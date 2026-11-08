-- The profile cover (the owner's call, 8 Kasım; CLAUDE.md rule 4: part of the profile, seen where
-- the photo is). The cover's file and its one pending upload, as the photo's (photo_path,
-- photo_pending_path). Closed to the client like the photo's path: no column grant; the profile
-- function signs a URL. Written only by the profile function (service role, rule 1).
alter table public.profiles
  add column cover_path text,
  add column cover_pending_path text;

-- The cover's own moderation (as the photo's, docs/arsiv/SPEC_V2.md §5.3): a profile report keeps
-- the cover's path in its snapshot (and the edge function its copy, cover_copy); two different
-- accounts reporting the same cover hide it until a new cover is committed. Only profile reports:
-- a history report may concern an anonymous encounter, which must never point at the account's
-- cover (rule 4), and it does not hold the profile first (rule 10). Both closed to the client (no
-- column grant; reports have no client access at all).
alter table public.profiles
  add column cover_hidden_at timestamptz;

alter table public.reports
  add column cover_copy bytea;

-- Lock order (rule 10): safety_report_profile, the only path that reaches this, holds the reported
-- profile (for update) before its report insert; this locks the same row again in the same
-- transaction.
create function private.hide_cover_if_reported(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  p public.profiles;
  reporters integer;
begin
  select * into p from public.profiles where id = target_user_id for update;
  if p.cover_path is null or p.cover_hidden_at is not null then
    return;
  end if;
  select count(distinct reporter_id) into reporters
  from public.reports
  where target_type = 'profile'
    and reported_user_id = p.id
    and profile_snapshot ->> 'cover_path' = p.cover_path;
  if reporters >= 2 then
    update public.profiles set cover_hidden_at = now() where id = p.id;
  end if;
end;
$$;

revoke all on function private.hide_cover_if_reported(uuid) from public, anon, authenticated;

-- Every profile report records the reported person's cover at that moment.
create function private.report_cover_snapshot()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  cover text;
begin
  select cover_path into cover from public.profiles where id = new.reported_user_id;
  if cover is not null then
    new.profile_snapshot := coalesce(new.profile_snapshot, '{}'::jsonb)
      || jsonb_build_object('cover_path', cover);
  end if;
  return new;
end;
$$;

revoke all on function private.report_cover_snapshot() from public, anon, authenticated;

create trigger reports_cover_snapshot
  before insert on public.reports
  for each row
  when (new.target_type = 'profile' and new.reported_user_id is not null)
  execute function private.report_cover_snapshot();

create function private.report_hide_cover()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.hide_cover_if_reported(new.reported_user_id);
  return null;
end;
$$;

revoke all on function private.report_hide_cover() from public, anon, authenticated;

create trigger reports_hide_cover
  after insert on public.reports
  for each row
  when (new.target_type = 'profile' and new.reported_user_id is not null)
  execute function private.report_hide_cover();

-- The reported cover's copy (the edge function reads the file): on the reporter's latest profile
-- report of that person whose snapshot names this cover and has no copy yet.
create function public.safety_attach_cover_copy(
  target_user_id uuid,
  target_public_id uuid,
  reported_cover_path text,
  cover bytea
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.reports set cover_copy = cover
  where id = (
    select r.id from public.reports r
    join public.profiles p on p.id = r.reported_user_id
    where r.reporter_id = target_user_id
      and p.public_id = target_public_id
      and r.target_type = 'profile'
      and r.cover_copy is null
      and r.profile_snapshot ->> 'cover_path' = reported_cover_path
    order by r.created_at desc
    limit 1
  );
end;
$$;

revoke all on function public.safety_attach_cover_copy(uuid, uuid, text, bytea)
  from public, anon, authenticated;
grant execute on function public.safety_attach_cover_copy(uuid, uuid, text, bytea)
  to service_role;
