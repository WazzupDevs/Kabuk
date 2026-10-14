-- Profile photo paths without the public_id (rule 4). Until now a photo was stored at
-- {public_id}/{uuid}.jpg, and a signed URL shows its path: wherever a photo reaches people before
-- friendship (a profiled venue chat message, its profile, a venue chat friend request) the
-- profile id went with it. New photos go to p/{random uuid}.jpg.
--
-- The path no longer says whose a file is, so the server keeps the one it issued:
-- profiles.photo_pending_path is the last path from photo-upload-url, and photo-commit accepts only
-- that path. It is closed to the client (the profiles grants list their columns; this one is not
-- among them). Account deletion removes the current and the pending file.
--
-- Photos from before are moved by `pnpm admin:move-photos` (Storage API copy, then
-- move_profile_photo below, then the old file is removed): storage.objects is never renamed with
-- SQL, which would part a row from its object.

alter table public.profiles add column photo_pending_path text;

-- The database half of moving a photo from before random paths (the Storage copy is done by the
-- script first): the profile points at the new path, and report copies that name the old path name
-- the new one, so the count behind hiding a photo after reports carries over (report rows are
-- server-only and stay for 30 days). Returns the number of profiles changed (0 if the owner
-- committed another photo meanwhile). Service role only.
create function public.move_profile_photo(old_path text, new_path text)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  moved integer;
begin
  update public.profiles set photo_path = new_path where photo_path = old_path;
  get diagnostics moved = row_count;
  update public.reports
  set profile_snapshot = jsonb_set(profile_snapshot, '{photo_path}', to_jsonb(new_path))
  where profile_snapshot ->> 'photo_path' = old_path;
  return moved;
end;
$$;

revoke all on function public.move_profile_photo(text, text) from public, anon, authenticated;
grant execute on function public.move_profile_photo(text, text) to service_role;
