create or replace function public.kb_email_registered(p_email text)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select case
    when p_email is null or length(p_email) > 254 then false
    else exists (
      select 1 from auth.users
      where lower(email) = lower(trim(p_email))
        and deleted_at is null
    )
  end;
$$;

revoke all on function public.kb_email_registered(text) from public;
grant execute on function public.kb_email_registered(text) to anon, authenticated;
