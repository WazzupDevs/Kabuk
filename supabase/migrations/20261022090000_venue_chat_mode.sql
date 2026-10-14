-- Faz 2 step 22.1 (docs/SPEC_V3.md §22.G, decisions 7 and 8).
--
-- Decision 7: the venue chat mode (anonymous or profiled) is chosen once per check-in, with the
-- first message, and never changes. table_sessions.venue_chat_profiled is null until then; a new
-- check-in is a new table session, so it starts unchosen again. A message in the other mode is
-- refused (venue_chat_mode_locked), never silently switched: an old app's toggle must not send a
-- message profiled that its user thinks is anonymous.
--
-- Decision 8: "Profilimle" needs a profile photo that others can see (a path, not hidden). Only
-- its presence is checked, at the moment of the choice: creating or asking to join a profiled
-- room (rooms function) and the first profiled venue chat message (here).

alter table public.table_sessions add column venue_chat_profiled boolean;

-- The one rule for "has a photo", for the venue chat below and the rooms function (service role).
create function public.has_profile_photo(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = target_user_id and photo_path is not null and photo_hidden_at is null
  );
$$;

revoke all on function public.has_profile_photo(uuid) from public, anon, authenticated;
grant execute on function public.has_profile_photo(uuid) to service_role;

-- As in 20261021090000_replies_reactions.sql, plus the mode: written with the first message under
-- the table session's lock, so a refused message (reply, rate limit) leaves it unchosen.
create or replace function public.venue_chat_send(
  target_user_id uuid,
  target_venue_id uuid,
  new_body text,
  profiled boolean,
  min_interval_ms integer,
  window_seconds integer,
  window_max integer,
  reply_to uuid default null
)
returns public.venue_chat_messages
language plpgsql
security definer
set search_path = ''
as $$
declare
  ts public.table_sessions;
  rate public.venue_chat_rate;
  msg public.venue_chat_messages;
begin
  select * into ts from public.table_sessions
  where user_id = target_user_id and venue_id = target_venue_id
    and status = 'active' and expires_at > now()
  for no key update;
  if ts.id is null then
    raise exception using errcode = 'P0001', message = 'no_active_table';
  end if;
  if ts.venue_chat_profiled is null then
    if profiled and not public.has_profile_photo(target_user_id) then
      raise exception using errcode = 'P0001', message = 'photo_required';
    end if;
  elsif ts.venue_chat_profiled is distinct from profiled then
    raise exception using errcode = 'P0001', message = 'venue_chat_mode_locked';
  end if;
  if reply_to is not null and (
    (private.visible_venue_chat_message(target_user_id, reply_to)).venue_id
      is distinct from target_venue_id
  ) then
    raise exception using errcode = 'P0001', message = 'reply_unavailable';
  end if;

  insert into public.venue_chat_rate (user_id, window_started_at, count, last_sent_at)
  values (target_user_id, '-infinity', 0, '-infinity')
  on conflict (user_id) do nothing;
  select * into rate from public.venue_chat_rate where user_id = target_user_id for update;
  if now() - rate.last_sent_at < make_interval(secs => min_interval_ms / 1000.0) then
    raise exception using errcode = 'P0001', message = 'too_soon';
  end if;
  if now() - rate.window_started_at >= make_interval(secs => window_seconds) then
    update public.venue_chat_rate
    set window_started_at = now(), count = 1, last_sent_at = now()
    where user_id = target_user_id;
  elsif rate.count >= window_max then
    raise exception using errcode = 'P0001', message = 'rate_limited';
  else
    update public.venue_chat_rate
    set count = count + 1, last_sent_at = now()
    where user_id = target_user_id;
  end if;

  if ts.venue_chat_profiled is null then
    update public.table_sessions set venue_chat_profiled = profiled where id = ts.id;
  end if;

  insert into public.venue_chat_messages
    (venue_id, session_id, sender_user_id, sender_alias, profiled, body, reply_to_id, replied)
  values
    (target_venue_id, ts.id, target_user_id, ts.alias, profiled, new_body, reply_to,
     reply_to is not null)
  returning * into msg;
  return msg;
end;
$$;
