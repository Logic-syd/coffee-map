-- Coffee Map photo administration. Run as project owner in the SQL Editor.
-- Venue rows and existing covers are preserved. Browser writes use one guarded RPC.
begin;

create schema if not exists coffee_private;
revoke all on schema coffee_private from public, anon, authenticated;
create table if not exists coffee_private.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
revoke all on coffee_private.admins from public, anon, authenticated;
alter table coffee_private.admins enable row level security;

create or replace function public.is_coffee_admin()
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from coffee_private.admins where user_id = (select auth.uid()));
$$;
revoke all on function public.is_coffee_admin() from public;
grant execute on function public.is_coffee_admin() to anon, authenticated;

alter table public.venues enable row level security;
grant select on public.venues to authenticated;
drop policy if exists coffee_admin_read on public.venues;
create policy coffee_admin_read on public.venues for select to authenticated
  using ((select public.is_coffee_admin()));

-- Restrictive policies also protect against an existing permissive write policy.
-- The security-definer function below is the only new client write path.
drop policy if exists coffee_no_direct_insert on public.venues;
create policy coffee_no_direct_insert on public.venues as restrictive for insert to anon, authenticated with check (false);
drop policy if exists coffee_no_direct_update on public.venues;
create policy coffee_no_direct_update on public.venues as restrictive for update to anon, authenticated using (false) with check (false);
drop policy if exists coffee_no_direct_delete on public.venues;
create policy coffee_no_direct_delete on public.venues as restrictive for delete to anon, authenticated using (false);

-- Fail if a bucket of this name already has unrelated configuration.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('venue-photos', 'venue-photos', true, 2097152, array['image/jpeg'])
on conflict (id) do nothing;
do $$ begin
  if not exists (select 1 from storage.buckets where id = 'venue-photos' and public
    and file_size_limit = 2097152 and allowed_mime_types = array['image/jpeg']) then
    raise exception 'venue-photos already exists with different settings; inspect it before applying this migration';
  end if;
end $$;

drop policy if exists coffee_photo_insert on storage.objects;
create policy coffee_photo_insert on storage.objects for insert to authenticated
with check (
  bucket_id = 'venue-photos' and (select public.is_coffee_admin())
  and name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.jpg$'
  and exists (select 1 from public.venues v where v.id::text = (storage.foldername(name))[1])
);
drop policy if exists coffee_photo_insert_guard on storage.objects;
create policy coffee_photo_insert_guard on storage.objects as restrictive for insert to anon, authenticated
with check (bucket_id <> 'venue-photos' or (
  (select public.is_coffee_admin())
  and name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.jpg$'
  and exists (select 1 from public.venues v where v.id::text = (storage.foldername(name))[1])
));
-- New, immutable paths avoid stale image caches. No client overwrite/delete flow.
drop policy if exists coffee_photo_update_guard on storage.objects;
create policy coffee_photo_update_guard on storage.objects as restrictive for update to anon, authenticated
using (bucket_id <> 'venue-photos') with check (bucket_id <> 'venue-photos');
drop policy if exists coffee_photo_delete_guard on storage.objects;
create policy coffee_photo_delete_guard on storage.objects as restrictive for delete to anon, authenticated
using (bucket_id <> 'venue-photos');

create or replace function public.set_venue_cover(p_venue_id uuid, p_object_path text, p_previous_url text)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  current_url text;
  new_url text;
begin
  if not public.is_coffee_admin() then raise exception 'ADMIN_REQUIRED' using errcode = '42501'; end if;
  if p_object_path is null or p_object_path !~ ('^' || p_venue_id::text || '/[0-9a-f-]{36}\.jpg$') then
    raise exception 'INVALID_PHOTO_PATH';
  end if;
  if not exists (select 1 from storage.objects where bucket_id = 'venue-photos' and name = p_object_path) then
    raise exception 'PHOTO_NOT_UPLOADED';
  end if;
  -- This migration targets the restored Coffee Map project. Change for another project.
  new_url := 'https://xkkkyfzrafpauwfijjtn.supabase.co/storage/v1/object/public/venue-photos/' || p_object_path;
  select image_url into current_url from public.venues where id = p_venue_id for update;
  if not found then raise exception 'VENUE_NOT_FOUND'; end if;
  -- Idempotent retries after an ambiguous network response are safe.
  if current_url is not distinct from new_url then
    return jsonb_build_object('id', p_venue_id, 'image_url', new_url);
  end if;
  if current_url is distinct from p_previous_url then raise exception 'COVER_CONFLICT'; end if;
  update public.venues set image_url = new_url, updated_at = now() where id = p_venue_id;
  return jsonb_build_object('id', p_venue_id, 'image_url', new_url);
end;
$$;
revoke all on function public.set_venue_cover(uuid, text, text) from public, anon;
grant execute on function public.set_venue_cover(uuid, text, text) to authenticated;

commit;
