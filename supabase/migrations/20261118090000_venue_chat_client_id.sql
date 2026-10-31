-- Venue chat: a message sent again is written once (Grup 3, P5; the owner's approval, 31 Ekim).
--
-- The app gives each message an id of its own (`client_id`) and sends it again with the same id
-- when the answer did not come (Tekrar dene). The same account and the same id are one message:
-- - the second send writes nothing, counts nothing against the rate limit and answers the first
--   message's id (`replayed`: the Edge Function then broadcasts nothing);
-- - the same id with another body, venue or reply, or from another check-in, is client_id_reused;
--   with another identity than the first message went with, identity_mismatch (a message believed
--   anonymous never answers as sent when it went profiled); nothing is written;
-- - only with the live check-in the first message was written in: after it ends, no_active_table
--   as for any send. The sender's own message deleted or hidden since still answers its id (the
--   query is the sender's own: nothing about another account's messages or ids);
-- - two sends at once: the check-in's lock (`table_sessions`, for no key update, as before) puts
--   them one after the other and the second finds the first; the unique index is the last word.
-- `client_id` is optional: without it every send is a new message, as before. It never leaves the
-- database (the page functions list their columns). Lock order unchanged (CLAUDE.md rule 10):
-- table_sessions → venue_chat_rate → venue_chat_messages.

alter table public.venue_chat_messages add column client_id uuid;

create unique index venue_chat_messages_client_id_idx
  on public.venue_chat_messages (sender_user_id, client_id)
  where client_id is not null;

create function public.venue_chat_send_once(
  target_user_id uuid,
  target_venue_id uuid,
  new_body text,
  min_interval_ms integer,
  window_seconds integer,
  window_max integer,
  reply_to uuid default null,
  profiled boolean default null,
  expected_identity text default null,
  new_client_id uuid default null
)
returns table (message_id uuid, replayed boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  ts public.table_sessions;
  rate public.venue_chat_rate;
  msg public.venue_chat_messages;
  prior public.venue_chat_messages;
  p public.profiles;
  chosen text;
begin
  select * into ts from public.table_sessions
  where user_id = target_user_id and venue_id = target_venue_id
    and status = 'active' and expires_at > now()
  for no key update;

  if ts.id is null then
    raise exception using errcode = 'P0001', message = 'no_active_table';
  end if;

  -- Sent before (its answer lost): the same message, nothing new. Read after the check-in's lock,
  -- so a send running at the same time has finished.
  if new_client_id is not null then
    select * into prior from public.venue_chat_messages
    where sender_user_id = target_user_id and client_id = new_client_id;
    if prior.id is not null then
      if prior.session_id <> ts.id or prior.venue_id <> target_venue_id
        or prior.body <> new_body or prior.reply_to_id is distinct from reply_to then
        raise exception using errcode = 'P0001', message = 'client_id_reused';
      end if;
      if (expected_identity is not null and prior.profiled <> (expected_identity = 'profiled'))
        or (expected_identity is null and profiled is not null and prior.profiled <> profiled) then
        raise exception using errcode = 'P0001', message = 'identity_mismatch';
      end if;
      message_id := prior.id;
      replayed := true;
      return next;
      return;
    end if;
  end if;

  chosen := ts.identity_mode;
  if expected_identity is not null then
    if expected_identity is distinct from ts.identity_mode then
      raise exception using errcode = 'P0001', message = 'identity_mismatch';
    end if;
  elsif profiled is not null
    and (case when profiled then 'profiled' else 'anonymous' end) <> ts.identity_mode then
    if ts.venue_chat_profiled is not null or ts.identity_switches >= 1 then
      raise exception using errcode = 'P0001', message = 'venue_chat_mode_locked';
    end if;
    if profiled and not public.has_profile_photo(target_user_id) then
      raise exception using errcode = 'P0001', message = 'photo_required';
    end if;
    chosen := case when profiled then 'profiled' else 'anonymous' end;
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

  if chosen <> ts.identity_mode or ts.venue_chat_profiled is null then
    update public.table_sessions
    set identity_mode = chosen,
        identity_switches = identity_switches + (case when chosen <> ts.identity_mode then 1 else 0 end),
        venue_chat_profiled = chosen = 'profiled'
    where id = ts.id;
  end if;

  -- The message carries the identity's own name and never the table alias (rule 4, §4.D): an account
  -- without a nick (check-in and the own profile give one, _shared/capsule.ts) writes nothing.
  select * into p from public.profiles where id = target_user_id;
  if (case when chosen = 'profiled' then p.display_name else p.capsule_nick end) is null then
    raise exception using errcode = 'P0001', message = 'onboarding_required';
  end if;
  insert into public.venue_chat_messages
    (venue_id, session_id, sender_user_id, sender_alias, profiled, sender_look, body, reply_to_id,
     replied, client_id)
  values
    (target_venue_id, ts.id, target_user_id,
     case when chosen = 'profiled' then p.display_name else p.capsule_nick end,
     chosen = 'profiled',
     case when chosen = 'profiled' then null else p.capsule_look end,
     new_body, reply_to, reply_to is not null, new_client_id)
  returning * into msg;
  message_id := msg.id;
  replayed := false;
  return next;
end;
$$;

revoke all on function public.venue_chat_send_once(
  uuid, uuid, text, integer, integer, integer, uuid, boolean, text, uuid
) from public, anon, authenticated;
grant execute on function public.venue_chat_send_once(
  uuid, uuid, text, integer, integer, integer, uuid, boolean, text, uuid
) to service_role;

-- The Edge Function deployed before this one calls venue_chat_send until the new one is out: the
-- same answer as before, through the one function above (no client id, so always a new message).
create or replace function public.venue_chat_send(
  target_user_id uuid,
  target_venue_id uuid,
  new_body text,
  min_interval_ms integer,
  window_seconds integer,
  window_max integer,
  reply_to uuid default null,
  profiled boolean default null,
  expected_identity text default null
)
returns public.venue_chat_messages
language plpgsql
security definer
set search_path = ''
as $$
declare
  sent record;
  msg public.venue_chat_messages;
begin
  select * into sent from public.venue_chat_send_once(
    target_user_id, target_venue_id, new_body, min_interval_ms, window_seconds, window_max,
    reply_to, profiled, expected_identity, null
  );
  select * into msg from public.venue_chat_messages where id = sent.message_id;
  return msg;
end;
$$;

revoke all on function public.venue_chat_send(uuid, uuid, text, integer, integer, integer, uuid, boolean, text)
  from public, anon, authenticated;
grant execute on function public.venue_chat_send(uuid, uuid, text, integer, integer, integer, uuid, boolean, text)
  to service_role;
