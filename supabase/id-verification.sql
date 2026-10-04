alter table public.profiles add column if not exists id_type text;
alter table public.profiles add column if not exists id_document_path text;
alter table public.profiles add column if not exists id_submitted_at timestamptz;
alter table public.profiles add column if not exists verification_note text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('resident-ids', 'resident-ids', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "kb resident ids: owner upload" on storage.objects;
create policy "kb resident ids: owner upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'resident-ids' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "kb resident ids: owner or admin read" on storage.objects;
create policy "kb resident ids: owner or admin read" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'resident-ids'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.kb_is_admin(auth.uid()))
  );

drop policy if exists "kb resident ids: owner replace" on storage.objects;
create policy "kb resident ids: owner replace" on storage.objects
  for update to authenticated
  using (bucket_id = 'resident-ids' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'resident-ids' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "kb resident ids: owner or admin delete" on storage.objects;
create policy "kb resident ids: owner or admin delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'resident-ids'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.kb_is_admin(auth.uid()))
  );

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
       or new.verification_note is distinct from old.verification_note then
      raise exception 'KB_FORBIDDEN: only admins can verify residents';
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.kb_submit_resident_id(p_path text, p_id_type text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_status text;
  v_name text;
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

  select verification_status into v_status from public.profiles where id = v_uid;
  if v_status = 'approved' then
    raise exception 'KB_ALREADY_VERIFIED: your account is already verified';
  end if;

  perform set_config('kb.submitting_id', 'on', true);
  update public.profiles
  set id_document_path = p_path,
      id_type = trim(p_id_type),
      id_submitted_at = now(),
      verification_status = 'pending',
      verification_note = null
  where id = v_uid;
  perform set_config('kb.submitting_id', 'off', true);

  select coalesce(raw_user_meta_data ->> 'full_name', email) into v_name from auth.users where id = v_uid;
  for v_admin in select id from public.profiles where lower(coalesce(role, '')) = 'admin' loop
    insert into public.notifications (user_id, title, message, type)
    values (v_admin.id, 'ID Submitted for Verification', coalesce(v_name, 'A resident') || ' uploaded a valid ID for review.', 'admin.id_submitted');
  end loop;
end;
$$;

revoke all on function public.kb_submit_resident_id(text, text) from public, anon;
grant execute on function public.kb_submit_resident_id(text, text) to authenticated;

drop function if exists public.kb_list_residents();
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
    coalesce(u.raw_user_meta_data ->> 'full_name', '')::text,
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

revoke all on function public.kb_list_residents() from public, anon;
grant execute on function public.kb_list_residents() to authenticated;

drop function if exists public.kb_set_resident_status(uuid, text);
create or replace function public.kb_set_resident_status(p_user uuid, p_status text, p_note text default null)
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
      verified_by = case when p_status = 'pending' then null else auth.uid() end,
      verification_note = case when p_status = 'rejected' then nullif(left(trim(coalesce(p_note, '')), 300), '') else null end
  where id = p_user and lower(coalesce(role, '')) <> 'admin';

  if not found then
    raise exception 'KB_NOT_FOUND: resident not found';
  end if;

  if p_status in ('approved', 'rejected') then
    insert into public.notifications (user_id, title, message, type)
    values (
      p_user,
      case when p_status = 'approved' then 'Account Verified' else 'ID Verification Unsuccessful' end,
      case when p_status = 'approved'
        then 'Your ID has been verified by the barangay. You can now request documents online.'
        else 'We could not verify your ID'
             || coalesce(': ' || nullif(left(trim(coalesce(p_note, '')), 300), ''), '.')
             || ' Please upload a clear photo of a valid ID showing your registered name.'
      end,
      'account.' || p_status
    );
  end if;
end;
$$;

revoke all on function public.kb_set_resident_status(uuid, text, text) from public, anon;
grant execute on function public.kb_set_resident_status(uuid, text, text) to authenticated;
