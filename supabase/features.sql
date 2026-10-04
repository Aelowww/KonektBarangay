alter table public.profiles add column if not exists full_name text;

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
    new.id_type := null;
    new.id_document_path := null;
    new.id_submitted_at := null;
    new.verification_note := null;
    return new;
  end if;

  if auth.uid() is not null
     and not public.kb_is_admin(auth.uid())
     and coalesce(current_setting('kb.submitting_id', true), '') <> 'on' then
    if new.role is distinct from old.role then
      raise exception 'KB_FORBIDDEN: role changes are not allowed';
    end if;
    if new.verification_status is distinct from old.verification_status
       or new.verified_at is distinct from old.verified_at
       or new.verified_by is distinct from old.verified_by
       or new.id_document_path is distinct from old.id_document_path
       or new.id_type is distinct from old.id_type
       or new.id_submitted_at is distinct from old.id_submitted_at
       or new.verification_note is distinct from old.verification_note
       or new.full_name is distinct from old.full_name then
      raise exception 'KB_FORBIDDEN: only admins can verify residents';
    end if;
  end if;

  return new;
end;
$$;

drop function if exists public.kb_submit_resident_id(text, text);
create or replace function public.kb_submit_resident_id(p_path text, p_id_type text, p_full_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_status text;
  v_name text := regexp_replace(trim(coalesce(p_full_name, '')), '\s+', ' ', 'g');
  v_admin record;
begin
  if v_uid is null then
    raise exception 'KB_FORBIDDEN: sign in first';
  end if;
  if public.kb_is_admin(v_uid) then
    raise exception 'KB_ADMIN: administrators do not need ID verification';
  end if;
  if p_path is null or split_part(p_path, '/', 1) <> v_uid::text then
    raise exception 'KB_FORBIDDEN: invalid file';
  end if;
  if not exists (select 1 from storage.objects where bucket_id = 'resident-ids' and name = p_path) then
    raise exception 'KB_NOT_FOUND: upload the ID photo first';
  end if;
  if coalesce(trim(p_id_type), '') = '' or length(p_id_type) > 60 then
    raise exception 'KB_BAD_INPUT: choose the type of ID';
  end if;
  if length(v_name) < 3 or length(v_name) > 120 or position(' ' in v_name) = 0 then
    raise exception 'KB_BAD_NAME: enter your full name as shown on your ID';
  end if;

  select verification_status into v_status from public.profiles where id = v_uid;
  if v_status = 'approved' then
    raise exception 'KB_ALREADY_VERIFIED: your account is already verified';
  end if;

  perform set_config('kb.submitting_id', 'on', true);
  update public.profiles
  set id_document_path = p_path,
      id_type = trim(p_id_type),
      id_submitted_at = now(),
      full_name = v_name,
      verification_status = 'pending',
      verification_note = null
  where id = v_uid;
  perform set_config('kb.submitting_id', 'off', true);

  for v_admin in select id from public.profiles where lower(coalesce(role, '')) = 'admin' loop
    insert into public.notifications (user_id, title, message, type)
    values (v_admin.id, 'ID Submitted for Verification', v_name || ' uploaded a valid ID for review.', 'admin.id_submitted');
  end loop;
end;
$$;

revoke all on function public.kb_submit_resident_id(text, text, text) from public, anon;
grant execute on function public.kb_submit_resident_id(text, text, text) to authenticated;

create or replace function public.kb_list_residents()
returns table (
  id uuid,
  email text,
  full_name text,
  username text,
  created_at timestamptz,
  email_confirmed boolean,
  verification_status text,
  verified_at timestamptz,
  id_type text,
  id_document_path text,
  id_submitted_at timestamptz,
  verification_note text
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
    coalesce(nullif(p.full_name, ''), u.raw_user_meta_data ->> 'full_name', '')::text,
    coalesce(u.raw_user_meta_data ->> 'username', '')::text,
    coalesce(u.created_at, p.created_at),
    (u.email_confirmed_at is not null),
    p.verification_status,
    p.verified_at,
    p.id_type,
    p.id_document_path,
    p.id_submitted_at,
    p.verification_note
  from public.profiles p
  join auth.users u on u.id = p.id
  where lower(coalesce(p.role, '')) <> 'admin'
  order by p.id_submitted_at desc nulls last, coalesce(u.created_at, p.created_at) desc;
end;
$$;

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(title) between 3 and 150),
  body text not null check (length(body) between 1 and 5000),
  category text not null default 'news' check (category in ('news', 'event', 'advisory')),
  event_date date,
  event_time text check (event_time is null or length(event_time) <= 40),
  location text check (location is null or length(location) <= 200),
  is_published boolean not null default true,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists announcements_created_idx on public.announcements (created_at desc);

alter table public.announcements enable row level security;

drop policy if exists "kb announcements: read published" on public.announcements;
create policy "kb announcements: read published" on public.announcements
  for select to anon, authenticated
  using (is_published or public.kb_is_admin(auth.uid()));

drop policy if exists "kb announcements: admin insert" on public.announcements;
create policy "kb announcements: admin insert" on public.announcements
  for insert to authenticated with check (public.kb_is_admin(auth.uid()));

drop policy if exists "kb announcements: admin update" on public.announcements;
create policy "kb announcements: admin update" on public.announcements
  for update to authenticated
  using (public.kb_is_admin(auth.uid())) with check (public.kb_is_admin(auth.uid()));

drop policy if exists "kb announcements: admin delete" on public.announcements;
create policy "kb announcements: admin delete" on public.announcements
  for delete to authenticated using (public.kb_is_admin(auth.uid()));

grant select on public.announcements to anon, authenticated;
grant insert, update, delete on public.announcements to authenticated;

drop trigger if exists announcements_updated_at on public.announcements;
create trigger announcements_updated_at
  before update on public.announcements
  for each row execute function public.update_updated_at();

create sequence if not exists public.blotter_case_seq;

create table if not exists public.blotter_reports (
  id uuid primary key default gen_random_uuid(),
  case_number text unique,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  incident_type text not null check (length(incident_type) between 2 and 60),
  incident_date date not null,
  incident_time text check (incident_time is null or length(incident_time) <= 40),
  location text not null check (length(location) between 2 and 200),
  respondent_name text check (respondent_name is null or length(respondent_name) <= 120),
  narrative text not null check (length(narrative) between 20 and 3000),
  status text not null default 'filed'
    check (status in ('filed', 'under_review', 'scheduled', 'resolved', 'dismissed')),
  hearing_at timestamptz,
  admin_remarks text check (admin_remarks is null or length(admin_remarks) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists blotter_reports_user_idx on public.blotter_reports (user_id, created_at desc);
create index if not exists blotter_reports_status_idx on public.blotter_reports (status, created_at desc);

alter table public.blotter_reports enable row level security;

drop policy if exists "kb blotter: read own or admin" on public.blotter_reports;
create policy "kb blotter: read own or admin" on public.blotter_reports
  for select to authenticated
  using (user_id = auth.uid() or public.kb_is_admin(auth.uid()));

drop policy if exists "kb blotter: resident files own" on public.blotter_reports;
create policy "kb blotter: resident files own" on public.blotter_reports
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "kb blotter: admin update" on public.blotter_reports;
create policy "kb blotter: admin update" on public.blotter_reports
  for update to authenticated
  using (public.kb_is_admin(auth.uid())) with check (public.kb_is_admin(auth.uid()));

drop policy if exists "kb blotter: admin delete" on public.blotter_reports;
create policy "kb blotter: admin delete" on public.blotter_reports
  for delete to authenticated using (public.kb_is_admin(auth.uid()));

grant select, insert, update, delete on public.blotter_reports to authenticated;

create or replace function public.kb_guard_blotter_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_open int;
  v_recent int;
  v_today date := (now() at time zone 'Asia/Manila')::date;
begin
  if v_uid is not null then
    if new.user_id is distinct from v_uid then
      raise exception 'KB_FORBIDDEN: you can only file reports for your own account';
    end if;
    if public.kb_is_admin(v_uid) then
      raise exception 'KB_ADMIN: administrators record blotters at the barangay hall';
    end if;
    if not exists (
      select 1 from public.profiles where id = v_uid and verification_status = 'approved'
    ) then
      raise exception 'KB_NOT_APPROVED: verify your identity before filing a blotter report';
    end if;

    select count(*) into v_open from public.blotter_reports
    where user_id = v_uid and status in ('filed', 'under_review', 'scheduled');
    if v_open >= 3 then
      raise exception 'KB_BLOTTER_LIMIT: you already have 3 open reports';
    end if;

    select count(*) into v_recent from public.blotter_reports
    where user_id = v_uid and created_at > now() - interval '24 hours';
    if v_recent >= 3 then
      raise exception 'KB_DAILY_LIMIT: daily report limit reached';
    end if;

    if new.incident_date > v_today or new.incident_date < v_today - 365 then
      raise exception 'KB_BAD_DATE: the incident date must be within the past year';
    end if;
  end if;

  new.status := 'filed';
  new.hearing_at := null;
  new.admin_remarks := null;
  new.case_number := 'BLT-' || to_char(now() at time zone 'Asia/Manila', 'YYYY') || '-'
                     || lpad(nextval('public.blotter_case_seq')::text, 4, '0');
  return new;
end;
$$;

drop trigger if exists kb_guard_blotter_insert on public.blotter_reports;
create trigger kb_guard_blotter_insert
  before insert on public.blotter_reports
  for each row execute function public.kb_guard_blotter_insert();

drop trigger if exists blotter_reports_updated_at on public.blotter_reports;
create trigger blotter_reports_updated_at
  before update on public.blotter_reports
  for each row execute function public.update_updated_at();

create or replace function public.kb_notify_blotter()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin record;
  v_label text;
begin
  if tg_op = 'INSERT' then
    for v_admin in select id from public.profiles where lower(coalesce(role, '')) = 'admin' loop
      insert into public.notifications (user_id, title, message, type)
      values (v_admin.id, 'New Blotter Report',
              'Blotter ' || new.case_number || ' (' || new.incident_type || ') was filed.', 'admin.new_blotter');
    end loop;
    insert into public.notifications (user_id, title, message, type)
    values (new.user_id, 'Blotter Report Filed',
            'Your report ' || new.case_number || ' was received. The barangay will review it.', 'blotter.filed');
    return new;
  end if;

  if new.status is distinct from old.status or new.hearing_at is distinct from old.hearing_at then
    v_label := case new.status
      when 'under_review' then 'is now under review'
      when 'scheduled' then 'has a hearing scheduled'
        || coalesce(' on ' || to_char(new.hearing_at at time zone 'Asia/Manila', 'Mon DD, YYYY HH12:MI AM'), '')
      when 'resolved' then 'has been resolved'
      when 'dismissed' then 'has been dismissed'
      else 'was updated'
    end;
    insert into public.notifications (user_id, title, message, type)
    values (new.user_id, 'Blotter Update',
            'Your report ' || new.case_number || ' ' || v_label || '.', 'blotter.' || new.status);
  end if;
  return new;
end;
$$;

drop trigger if exists kb_notify_blotter on public.blotter_reports;
create trigger kb_notify_blotter
  after insert or update on public.blotter_reports
  for each row execute function public.kb_notify_blotter();

create or replace function public.kb_list_blotters()
returns table (
  id uuid,
  case_number text,
  user_id uuid,
  reporter_name text,
  reporter_email text,
  incident_type text,
  incident_date date,
  incident_time text,
  location text,
  respondent_name text,
  narrative text,
  status text,
  hearing_at timestamptz,
  admin_remarks text,
  created_at timestamptz
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
  select b.id, b.case_number, b.user_id,
    coalesce(nullif(p.full_name, ''), u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'username', u.email)::text,
    u.email::text,
    b.incident_type, b.incident_date, b.incident_time, b.location, b.respondent_name, b.narrative,
    b.status, b.hearing_at, b.admin_remarks, b.created_at
  from public.blotter_reports b
  left join public.profiles p on p.id = b.user_id
  left join auth.users u on u.id = b.user_id
  order by b.created_at desc;
end;
$$;

revoke all on function public.kb_list_blotters() from public, anon;
grant execute on function public.kb_list_blotters() to authenticated;
