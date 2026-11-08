-- The profile cover (the owner's call, 8 Kasım; CLAUDE.md rule 4: part of the profile, seen where
-- the photo is). The cover's file and its one pending upload, as the photo's (photo_path,
-- photo_pending_path). Closed to the client like the photo's path: no column grant; the profile
-- function signs a URL. Written only by the profile function (service role, rule 1).
alter table public.profiles
  add column cover_path text,
  add column cover_pending_path text;
