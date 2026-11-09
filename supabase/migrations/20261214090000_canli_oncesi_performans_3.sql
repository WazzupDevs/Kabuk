-- Canlı öncesi denetim, performans 3 (docs/PROGRESS.md → D5, D6).

-- D5: the venue chat page reads only what came after the newest message a phone has (`after`):
-- a new message's broadcast no longer has every phone at the venue read and sign the 50-message
-- page again. `after` takes the message at that moment too (two messages may share it); the app
-- drops the ones it has. Same filters as the page: the blocked, the muted, the hidden and the
-- deleted stay out.
drop function public.venue_chat_page_for(uuid, uuid, timestamptz, integer);

create function public.venue_chat_page_for(
  target_user_id uuid,
  target_venue_id uuid,
  before timestamptz default null,
  page_size integer default 50,
  after timestamptz default null
)
returns table (
  id uuid,
  profiled boolean,
  sender_alias text,
  display_name text,
  photo_path text,
  body text,
  created_at timestamptz,
  from_me boolean,
  reply_to jsonb,
  reactions jsonb,
  sender_key text,
  sender_look text
)
language sql
stable
security definer
set search_path = ''
as $$
  with k as materialized (
    select private.venue_chat_sender_secret() as secret,
           (private.venue_chat_session(target_user_id, target_venue_id)).id as session_id
  )
  select m.id, m.profiled,
         case when m.profiled then null else m.sender_alias end,
         case when m.profiled then p.display_name else null end,
         case when m.profiled and p.photo_hidden_at is null then p.photo_path else null end,
         m.body, m.created_at, m.sender_user_id = target_user_id,
         private.venue_quote(target_user_id, m),
         private.venue_reaction_list(target_user_id, m.id),
         left(encode(extensions.hmac(
           'venue_chat_sender:' || m.sender_user_id::text || ':' || m.profiled::text || ':'
             || m.sender_alias || ':' || private.venue_chat_scope(m.venue_id)::text || ':'
             || ((m.created_at at time zone 'Europe/Istanbul')::date)::text,
           k.secret, 'sha256'), 'hex'), 24),
         case when m.profiled then null else m.sender_look end
  from public.venue_chat_messages m
  cross join k
  left join public.profiles p on p.id = m.sender_user_id
  where m.venue_id in (select private.venue_chat_venues(target_venue_id))
    and k.session_id is not null
    and (before is null or m.created_at < before)
    and (after is null or m.created_at >= after)
    and m.deleted_at is null
    and (m.hidden_at is null or m.sender_user_id = target_user_id)
    and not private.is_blocked_between(target_user_id, m.sender_user_id)
    and not exists (
      select 1 from public.venue_chat_mutes mu
      where mu.user_id = target_user_id
        and mu.muted_user_id = m.sender_user_id
        and mu.profiled = m.profiled
    )
  order by m.created_at desc
  limit least(greatest(page_size, 1), 100);
$$;

revoke all on function public.venue_chat_page_for(uuid, uuid, timestamptz, integer, timestamptz)
  from public, anon, authenticated;
grant execute on function public.venue_chat_page_for(uuid, uuid, timestamptz, integer, timestamptz)
  to service_role;

-- D6: the Sprengja fuse job runs. It was created switched off until the dev checks
-- (docs/decisions/4.6.8-sprengja-dev.md, passed; on in dev since 6 Kasım); on, the phones poll
-- about 70% less (the holder every 2 s, the others not at all). In production it starts with the
-- owner's db push.
select cron.alter_job(job_id => jobid, active => true)
from cron.job where jobname = 'sprengja-explode';

-- D9: a closed table's game leftovers go a day after it closed, as its messages do (the owner's
-- call, 9 Kasım): the events, the secrets, the Tabu turns, the used cards and game_state. The
-- play history (play_history) and the results (game_results) stay. Requests and invites are only
-- read while they wait (minutes) and in the hourly limits; they go a day after they were made.
-- Locks (rule 10): the job takes closed rooms with skip locked, then the rows of those rooms;
-- requests and invites alone, with skip locked. The index leaves game_state out of its condition,
-- so the updates of a game stay HOT; the job looks at the rooms closed in the last week (it runs
-- every hour; what lay there before is deleted below).
create index rooms_closed_idx on public.rooms (closed_at) where status = 'closed';
create index join_requests_created_idx on public.join_requests (created_at);
create index table_invites_created_idx on public.table_invites (created_at);

create function private.delete_old_game_rows()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  ids uuid[];
  n integer := 0;
  m integer;
begin
  select coalesce(array_agg(id), '{}') into ids
  from (
    select r.id from public.rooms r
    where r.status = 'closed' and r.game_state <> '{}'::jsonb
      and r.closed_at <= now() - interval '24 hours'
      and r.closed_at > now() - interval '7 days'
    order by r.closed_at
    limit 500
    for update skip locked
  ) picked;
  if cardinality(ids) > 0 then
    delete from public.game_secrets where room_id = any (ids);
    delete from public.game_events where room_id = any (ids);
    delete from public.tabu_turns where room_id = any (ids);
    delete from public.room_used_cards where room_id = any (ids);
    update public.rooms set game_state = '{}'::jsonb where id = any (ids);
    n := cardinality(ids);
  end if;

  delete from public.join_requests
  where id in (
    select j.id from public.join_requests j
    where j.created_at <= now() - interval '24 hours' and j.expires_at < now()
    limit 10000
    for update skip locked
  );
  get diagnostics m = row_count;
  n := n + m;

  delete from public.table_invites
  where id in (
    select i.id from public.table_invites i
    where i.created_at <= now() - interval '24 hours' and i.expires_at < now()
    limit 10000
    for update skip locked
  );
  get diagnostics m = row_count;
  return n + m;
end;
$$;
revoke all on function private.delete_old_game_rows() from public, anon, authenticated;

-- What is there already: every closed room's rows; game_state of those past the job's week.
update public.rooms set game_state = '{}'::jsonb
where status = 'closed' and closed_at <= now() - interval '7 days' and game_state <> '{}'::jsonb;
delete from public.game_secrets s using public.rooms r
where r.id = s.room_id and r.status = 'closed' and r.closed_at <= now() - interval '24 hours';
delete from public.game_events e using public.rooms r
where r.id = e.room_id and r.status = 'closed' and r.closed_at <= now() - interval '24 hours';
delete from public.tabu_turns t using public.rooms r
where r.id = t.room_id and r.status = 'closed' and r.closed_at <= now() - interval '24 hours';
delete from public.room_used_cards u using public.rooms r
where r.id = u.room_id and r.status = 'closed' and r.closed_at <= now() - interval '24 hours';

select cron.schedule('delete-old-game-rows', '23 * * * *', $$select private.delete_old_game_rows()$$);
