create or replace function public.kb_is_admin(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = uid and lower(coalesce(role, '')) = 'admin'
  );
$$;

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'verification_status'
  ) then
    alter table public.profiles add column verification_status text;
    update public.profiles set verification_status = 'approved';
    alter table public.profiles alter column verification_status set default 'pending';
    alter table public.profiles alter column verification_status set not null;
    alter table public.profiles
      add constraint profiles_verification_status_check
      check (verification_status in ('pending', 'approved', 'rejected'));
  end if;
end $$;

alter table public.profiles add column if not exists verified_at timestamptz;
alter table public.profiles add column if not exists verified_by uuid;

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role)
  values (new.id, 'resident')
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace function public.kb_guard_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    new.role := 'resident';
    new.verification_status := 'pending';
    new.verified_at := null;
    new.verified_by := null;
    return new;
  end if;

  if auth.uid() is not null and not public.kb_is_admin(auth.uid()) then
    if new.role is distinct from old.role then
      raise exception 'KB_FORBIDDEN: role changes are not allowed';
    end if;
    if new.verification_status is distinct from old.verification_status
       or new.verified_at is distinct from old.verified_at
       or new.verified_by is distinct from old.verified_by then
      raise exception 'KB_FORBIDDEN: only admins can verify residents';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists kb_guard_profile_role on public.profiles;
create trigger kb_guard_profile_role
  before insert or update on public.profiles
  for each row execute function public.kb_guard_profile_role();

create or replace function public.kb_list_residents()
returns table (
  id uuid,
  email text,
  full_name text,
  username text,
  created_at timestamptz,
  email_confirmed boolean,
  verification_status text,
  verified_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.kb_is_admin(auth.uid()) then
    raise exception 'KB_FORBIDDEN: admins only';
  end if;

  return query
  select
    p.id,
    u.email::text,
    coalesce(u.raw_user_meta_data ->> 'full_name', '')::text,
    coalesce(u.raw_user_meta_data ->> 'username', '')::text,
    coalesce(u.created_at, p.created_at),
    (u.email_confirmed_at is not null),
    p.verification_status,
    p.verified_at
  from public.profiles p
  join auth.users u on u.id = p.id
  where lower(coalesce(p.role, '')) <> 'admin'
  order by coalesce(u.created_at, p.created_at) desc;
end;
$$;

create or replace function public.kb_set_resident_status(p_user uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.kb_is_admin(auth.uid()) then
    raise exception 'KB_FORBIDDEN: admins only';
  end if;

  if p_status not in ('pending', 'approved', 'rejected') then
    raise exception 'KB_BAD_STATUS: unknown status';
  end if;

  update public.profiles
  set verification_status = p_status,
      verified_at = case when p_status = 'pending' then null else now() end,
      verified_by = case when p_status = 'pending' then null else auth.uid() end
  where id = p_user and lower(coalesce(role, '')) <> 'admin';

  if not found then
    raise exception 'KB_NOT_FOUND: resident not found';
  end if;

  if p_status in ('approved', 'rejected') then
    insert into public.notifications (user_id, title, message, type)
    values (
      p_user,
      case when p_status = 'approved' then 'Account Verified' else 'Account Not Approved' end,
      case when p_status = 'approved'
        then 'Your account has been verified by the barangay. You can now request documents online.'
        else 'Your account could not be verified. Please visit the barangay hall with a valid ID for assistance.'
      end,
      'account.' || p_status
    );
  end if;
end;
$$;

revoke all on function public.kb_list_residents() from public, anon;
revoke all on function public.kb_set_resident_status(uuid, text) from public, anon;
grant execute on function public.kb_list_residents() to authenticated;
grant execute on function public.kb_set_resident_status(uuid, text) to authenticated;

create or replace function public.kb_guard_document_request_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_pending int;
  v_recent int;
  v_confirmed timestamptz;
  v_verification text;
  v_today date := (now() at time zone 'Asia/Manila')::date;
begin
  if v_uid is null then
    return new;
  end if;

  if new.user_id is distinct from v_uid then
    raise exception 'KB_FORBIDDEN: you can only file requests for your own account';
  end if;

  if public.kb_is_admin(v_uid) then
    raise exception 'KB_ADMIN: administrators cannot file document requests';
  end if;

  select email_confirmed_at into v_confirmed from auth.users where id = v_uid;
  if v_confirmed is null then
    raise exception 'KB_UNVERIFIED: verify your email before filing requests';
  end if;

  select verification_status into v_verification from public.profiles where id = v_uid;
  if coalesce(v_verification, 'pending') <> 'approved' then
    raise exception 'KB_NOT_APPROVED: your account is awaiting barangay verification';
  end if;

  select count(*) into v_pending
  from public.document_requests
  where user_id = v_uid and lower(coalesce(status, 'pending')) = 'pending';
  if v_pending >= 3 then
    raise exception 'KB_PENDING_LIMIT: too many pending requests';
  end if;

  if coalesce(new.document_type, '') <> 'Other Document Request' and exists (
    select 1 from public.document_requests
    where user_id = v_uid
      and document_type = new.document_type
      and lower(coalesce(status, 'pending')) = 'pending'
  ) then
    raise exception 'KB_DUPLICATE: a pending request for this document already exists';
  end if;

  select count(*) into v_recent
  from public.document_requests
  where user_id = v_uid and created_at > now() - interval '24 hours';
  if v_recent >= 5 then
    raise exception 'KB_DAILY_LIMIT: daily request limit reached';
  end if;

  if new.appointment_date is null
     or new.appointment_date < v_today
     or extract(isodow from new.appointment_date) in (6, 7) then
    raise exception 'KB_BAD_DATE: appointments must be on a weekday, today or later';
  end if;

  if length(coalesce(new.full_name, '')) > 120
     or length(coalesce(new.purpose, '')) > 500
     or length(coalesce(new.other_document, '')) > 200 then
    raise exception 'KB_TOO_LONG: one or more fields are too long';
  end if;

  new.status := 'pending';
  new.admin_remarks := null;
  return new;
end;
$$;

drop trigger if exists kb_guard_document_request_insert on public.document_requests;
create trigger kb_guard_document_request_insert
  before insert on public.document_requests
  for each row execute function public.kb_guard_document_request_insert();

create or replace function public.kb_guard_document_request_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null or public.kb_is_admin(v_uid) then
    return new;
  end if;

  if old.user_id is distinct from v_uid then
    raise exception 'KB_FORBIDDEN: not your request';
  end if;

  if not (
    lower(coalesce(old.status, 'pending')) = 'pending'
    and lower(coalesce(new.status, '')) = 'cancelled'
  ) then
    raise exception 'KB_FORBIDDEN: residents can only cancel pending requests';
  end if;

  if (to_jsonb(new) - 'status' - 'updated_at') is distinct from (to_jsonb(old) - 'status' - 'updated_at') then
    raise exception 'KB_FORBIDDEN: request details cannot be edited';
  end if;

  return new;
end;
$$;

drop trigger if exists kb_guard_document_request_update on public.document_requests;
create trigger kb_guard_document_request_update
  before update on public.document_requests
  for each row execute function public.kb_guard_document_request_update();

create or replace function public.kb_guard_document_request_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.kb_is_admin(auth.uid()) then
    raise exception 'KB_FORBIDDEN: requests cannot be deleted';
  end if;
  return old;
end;
$$;

drop trigger if exists kb_guard_document_request_delete on public.document_requests;
create trigger kb_guard_document_request_delete
  before delete on public.document_requests
  for each row execute function public.kb_guard_document_request_delete();

