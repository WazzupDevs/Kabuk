-- One venue chat per university (docs/SPEC_V4.md §4.Q; the project owner's decision, 4 Kasım): a
-- person checked in at any campus of a university reads and writes the same chat as one at its
-- other campuses. Every other venue keeps its own chat. Check-in, the lobby, tables, invites and
-- games stay bounded by the campus's own venue_id; only the chat widens.
--
-- What stays: a message is still written under the sender's own venue (venue_chat_messages.venue_id
-- is the campus), and nothing a reader receives names that campus: the page has no venue column and
-- the sender key is made with the chat's scope, so one sender looks the same from every campus.
-- Realtime topics stay venue_chat:{venue_id} (each person subscribes to their own campus's, as
-- before); the server sends the data-free broadcast to every campus of the scope.
--
-- Lock order (rule 10): unchanged. These functions take the same locks as before, in the same
-- order; the scope is read without a lock.

-- The chat a venue belongs to: its university for a campus of one, else the venue itself.
create function private.venue_chat_scope(target_venue_id uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(v.university_id, v.id) from public.venues v where v.id = target_venue_id;
$$;

revoke all on function private.venue_chat_scope(uuid) from public, anon, authenticated;

-- The venues sharing a venue's chat: the venue itself, and every campus of its university.
create function private.venue_chat_venues(target_venue_id uuid)
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select target_venue_id
  union
  select o.id from public.venues v
  join public.venues o on o.university_id = v.university_id
  where v.id = target_venue_id and v.university_id is not null;
$$;

revoke all on function private.venue_chat_venues(uuid) from public, anon, authenticated;

-- The reader's live check-in in the chat's scope (as in 20261012090000_venue_chat.sql, at any
-- campus of the same university). Every read, reaction, report, profile and the Realtime topic go
-- through it.
create or replace function private.venue_chat_session(target_user_id uuid, target_venue_id uuid)
returns public.table_sessions
language sql
stable
security definer
set search_path = ''
as $$
  select * from public.table_sessions
  where user_id = target_user_id
    and venue_id in (select private.venue_chat_venues(target_venue_id))
    and status = 'active' and expires_at > now()
  limit 1;
$$;

-- The service's list of topics to broadcast a venue chat change on.
create function public.venue_chat_topics(target_venue_id uuid)
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select private.venue_chat_venues(target_venue_id);
$$;

revoke all on function public.venue_chat_topics(uuid) from public, anon, authenticated;
grant execute on function public.venue_chat_topics(uuid) to service_role;

-- As before (20261103090000_identity.sql, 20261021090000_replies_reactions.sql,
-- 20261119090000_v4_cleanup.sql), with the chat's scope in place of the one venue.
create or replace function public.venue_chat_page_for(
  target_user_id uuid,
  target_venue_id uuid,
  before timestamptz default null,
  page_size integer default 50
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
  with k as materialized (select private.venue_chat_sender_secret() as secret)
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
    and (private.venue_chat_session(target_user_id, target_venue_id)).id is not null
    and (before is null or m.created_at < before)
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

create or replace function public.venue_chat_page(
  target_venue_id uuid,
  before timestamptz default null,
  page_size integer default 50
)
returns table (
  id uuid,
  profiled boolean,
  sender_alias text,
  display_name text,
  body text,
  created_at timestamptz,
  from_me boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select m.id, m.profiled,
         case when m.profiled then null else m.sender_alias end,
         case when m.profiled then p.display_name else null end,
         m.body, m.created_at, m.sender_user_id = (select auth.uid())
  from public.venue_chat_messages m
  left join public.profiles p on p.id = m.sender_user_id
  where m.venue_id in (select private.venue_chat_venues(target_venue_id))
    and (private.venue_chat_session((select auth.uid()), target_venue_id)).id is not null
    and (before is null or m.created_at < before)
    and m.deleted_at is null
    and (m.hidden_at is null or m.sender_user_id = (select auth.uid()))
    and not private.is_blocked_between((select auth.uid()), m.sender_user_id)
    and not exists (
      select 1 from public.venue_chat_mutes mu
      where mu.user_id = (select auth.uid())
        and mu.muted_user_id = m.sender_user_id
        and mu.profiled = m.profiled
    )
  order by m.created_at desc
  limit least(greatest(page_size, 1), 100);
$$;

create or replace function private.venue_quote(viewer uuid, m public.venue_chat_messages)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when not m.replied then null
    when q.id is null or private.venue_chat_scope(q.venue_id) <> private.venue_chat_scope(m.venue_id) then jsonb_build_object('gone', true)
    else jsonb_build_object(
      'id', q.id,
      'body', left(q.body, 80),
      'from_me', q.sender_user_id = viewer,
      'name', case when q.profiled then p.display_name else q.sender_alias end
    )
  end
  from (select 1) one
  left join lateral (
    select v.* from private.visible_venue_chat_message(viewer, m.reply_to_id) v
    where v.id is not null
  ) q on true
  left join public.profiles p on p.id = q.sender_user_id;
$$;

create or replace function public.safety_report_venue_chat(
  target_user_id uuid,
  target_message_id uuid,
  new_reason text,
  snapshot_size integer,
  hide_after integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  ts public.table_sessions;
  m public.venue_chat_messages;
  snapshot jsonb;
  added integer;
  reporters integer;
begin
  select * into m from private.visible_venue_chat_message(target_user_id, target_message_id);
  if m.id is null or m.sender_user_id = target_user_id then
    return false;
  end if;
  select * into ts from public.table_sessions
  where id = (private.venue_chat_session(target_user_id, m.venue_id)).id
  for no key update;
  select * into m from public.venue_chat_messages where id = target_message_id for update;
  if m.id is null then
    return false;
  end if;

  select coalesce(jsonb_agg(row order by row ->> 'created_at'), '[]'::jsonb) into snapshot
  from (
    select jsonb_build_object(
      'sender_alias', x.sender_alias,
      'display_name', case when x.profiled then p.display_name end,
      'body', x.body,
      'created_at', x.created_at,
      'reported', x.id = m.id
    ) as row
    from public.venue_chat_messages x
    left join public.profiles p on p.id = x.sender_user_id
    where x.venue_id in (select private.venue_chat_venues(m.venue_id)) and (x.hidden_at is null or x.id = m.id)
      and x.deleted_at is null
    order by x.created_at desc
    limit snapshot_size
  ) last;

  insert into public.reports (reporter_id, reported_user_id, reason, target_type,
                              venue_chat_message_id, messages_snapshot)
  values (target_user_id, m.sender_user_id, new_reason, 'venue_chat', m.id, snapshot);

  insert into public.venue_chat_reports (message_id, reporter_user_id)
  values (m.id, target_user_id)
  on conflict do nothing;
  get diagnostics added = row_count;
  if added = 0 or m.hidden_at is not null then
    return false;
  end if;
  select count(*) into reporters from public.venue_chat_reports
  where message_id = m.id and reporter_user_id <> m.sender_user_id;
  if reporters >= hide_after then
    update public.venue_chat_messages set hidden_at = now() where id = m.id;
    return true;
  end if;
  return false;
end;
$$;

create or replace function public.venue_chat_send_once(target_user_id uuid, target_venue_id uuid, new_body text, min_interval_ms integer, window_seconds integer, window_max integer, expected_identity text, reply_to uuid DEFAULT NULL::uuid, new_client_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(message_id uuid, replayed boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
      if prior.profiled <> (expected_identity = 'profiled') then
        raise exception using errcode = 'P0001', message = 'identity_mismatch';
      end if;
      message_id := prior.id;
      replayed := true;
      return next;
      return;
    end if;
  end if;

  -- The message goes with the check-in's identity; the one the app shows must be it.
  if expected_identity is distinct from ts.identity_mode then
    raise exception using errcode = 'P0001', message = 'identity_mismatch';
  end if;
  chosen := ts.identity_mode;
  if reply_to is not null and (
    private.venue_chat_scope((private.visible_venue_chat_message(target_user_id, reply_to)).venue_id)
      is distinct from private.venue_chat_scope(target_venue_id)
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
$function$
;
