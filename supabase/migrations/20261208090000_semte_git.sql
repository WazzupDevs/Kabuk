-- Semte Git and Geçit (docs/SPEC_V4.md §4.V, K-90; the project owner's decisions, 8 Kasım): a
-- person at home joins their district's chat without a check-in, through the day's question. The
-- district chat is apart from the venue chat and the tables: nothing here reads or writes a
-- check-in, a table or a venue chat message.
--
-- Rule 6: the coordinate never reaches the database. The Edge Function finds the district from it
-- (pure/district.ts) and keeps only the district (user_districts). Nobody else learns it.
-- Rule 4: a room's head count goes nowhere (no column, no page field, no broadcast payload); the
-- question's right option goes to no phone (gecit_questions is service-role only and no reader
-- returns `answer`); real questions are not in the repo (admin:gecit-import).
-- Rule 9: district_chat:{room_id} is private; only the people with an open session in that room
-- (the extra time included) subscribe, and only the server sends, data-free.
-- Rule 10: user_districts → district-day lock (private.lock_district_day) → district_rooms →
-- district_sessions → district_chat_rate → district_chat_reaction_rate → district_chat_messages →
-- district_chat_reactions → reports → district_chat_reports. gecit_answers is locked alone. A friend
-- request from the chat starts at the pair lock, as the venue chat's (lock_pair →
-- venue_chat_friend_presses → friend_requests). A mute writes venue_chat_mutes alone (the list is
-- shared with the venue chat). The cron job picks its rows with skip locked.

-- 1. Tables ---------------------------------------------------------------------------------------

-- The districts (content/districts.json, our own rough drawings): ring is [[lng, lat], ...].
create table public.districts (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique check (ref ~ '^[a-z0-9-]{1,40}$'),
  name text not null check (char_length(name) between 1 and 60),
  ring jsonb not null check (jsonb_typeof(ring) = 'array' and jsonb_array_length(ring) >= 3),
  sort integer not null default 0,
  is_active boolean not null default true
);
alter table public.districts enable row level security;
revoke all on table public.districts from anon, authenticated;

-- The person's last found district (null: found outside every district). No coordinate.
create table public.user_districts (
  user_id uuid primary key references auth.users (id) on delete cascade,
  district_id uuid references public.districts (id) on delete set null,
  located_at timestamptz not null default now()
);
alter table public.user_districts enable row level security;
revoke all on table public.user_districts from anon, authenticated;

-- The day's question (Istanbul day). Service role only: the answer never leaves the server.
create table public.gecit_questions (
  day date primary key,
  prompt text not null check (char_length(prompt) between 1 and 300),
  options text[] not null check (
    array_length(options, 1) = 4
    and array_position(options, null) is null
  ),
  answer smallint not null check (answer between 0 and 3),
  created_at timestamptz not null default now()
);
alter table public.gecit_questions enable row level security;
revoke all on table public.gecit_questions from anon, authenticated;

-- One try a day.
create table public.gecit_answers (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  correct boolean not null,
  created_at timestamptz not null default now(),
  primary key (user_id, day)
);
alter table public.gecit_answers enable row level security;
revoke all on table public.gecit_answers from anon, authenticated;

-- A room of one district for one day; all close at 00:00 (the cron job deletes past days' rooms,
-- their sessions and messages with them).
create table public.district_rooms (
  id uuid primary key default gen_random_uuid(),
  district_id uuid not null references public.districts (id) on delete cascade,
  day date not null,
  created_at timestamptz not null default now()
);
create index district_rooms_day_idx on public.district_rooms (district_id, day);
alter table public.district_rooms enable row level security;
revoke all on table public.district_rooms from anon, authenticated;

-- A person's time in a room. Open while status = 'open' and grace_ends_at > now(): active until
-- ends_at, then the extra time ("Devam?"). joined_at: when they first came into this room today
-- (they read nothing older).
create table public.district_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  district_id uuid not null references public.districts (id) on delete cascade,
  room_id uuid not null references public.district_rooms (id) on delete cascade,
  day date not null,
  joined_at timestamptz not null default now(),
  ends_at timestamptz not null,
  grace_ends_at timestamptz not null,
  identity_mode text not null default 'anonymous'
    check (identity_mode in ('anonymous', 'profiled')),
  identity_switches integer not null default 0 check (identity_switches between 0 and 1),
  status text not null default 'open' check (status in ('open', 'closed')),
  created_at timestamptz not null default now(),
  closed_at timestamptz,
  check (grace_ends_at >= ends_at)
);
create unique index district_sessions_one_open on public.district_sessions (user_id)
  where status = 'open';
create index district_sessions_room_idx on public.district_sessions (room_id) where status = 'open';
create index district_sessions_user_day_idx on public.district_sessions (user_id, day);
alter table public.district_sessions enable row level security;
revoke all on table public.district_sessions from anon, authenticated;

create table public.district_chat_messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.district_rooms (id) on delete cascade,
  session_id uuid not null references public.district_sessions (id) on delete cascade,
  sender_user_id uuid not null references auth.users (id) on delete cascade,
  sender_alias text not null,
  profiled boolean not null,
  sender_look text check (char_length(sender_look) between 1 and 200),
  body text not null check (char_length(body) between 1 and 1000),
  reply_to_id uuid references public.district_chat_messages (id) on delete set null,
  replied boolean not null default false,
  client_id uuid,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  hidden_at timestamptz,
  check (not profiled or sender_look is null)
);
create index district_chat_messages_room_idx on public.district_chat_messages (room_id, created_at desc);
create unique index district_chat_messages_client_idx
  on public.district_chat_messages (sender_user_id, client_id) where client_id is not null;
alter table public.district_chat_messages enable row level security;
revoke all on table public.district_chat_messages from anon, authenticated;

create table public.district_chat_reactions (
  message_id uuid not null references public.district_chat_messages (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  emoji text not null,
  created_at timestamptz not null default now(),
  primary key (message_id, user_id)
);
create index district_chat_reactions_user_idx on public.district_chat_reactions (user_id);
alter table public.district_chat_reactions enable row level security;
revoke all on table public.district_chat_reactions from anon, authenticated;

create table public.district_chat_rate (
  user_id uuid primary key references auth.users (id) on delete cascade,
  window_started_at timestamptz not null,
  count integer not null,
  last_sent_at timestamptz not null
);
alter table public.district_chat_rate enable row level security;
revoke all on table public.district_chat_rate from anon, authenticated;

create table public.district_chat_reaction_rate (
  user_id uuid primary key references auth.users (id) on delete cascade,
  window_started_at timestamptz not null,
  count integer not null
);
alter table public.district_chat_reaction_rate enable row level security;
revoke all on table public.district_chat_reaction_rate from anon, authenticated;

-- Who reported which message (one count per account; enough of them hide it).
create table public.district_chat_reports (
  message_id uuid not null references public.district_chat_messages (id) on delete cascade,
  reporter_user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (message_id, reporter_user_id)
);
alter table public.district_chat_reports enable row level security;
revoke all on table public.district_chat_reports from anon, authenticated;

-- A report keeps its copy after the night's delete.
alter table public.reports drop constraint reports_target_type_check;
alter table public.reports
  add constraint reports_target_type_check
    check (target_type in (
      'room', 'dm', 'profile', 'history', 'venue_chat', 'room_message', 'kibrit_paper',
      'district_chat'
    )),
  add column district_chat_message_id uuid
    references public.district_chat_messages (id) on delete set null;

-- 2. Helpers --------------------------------------------------------------------------------------

create function private.istanbul_today()
returns date
language sql
stable
set search_path = ''
as $$
  select (now() at time zone 'Europe/Istanbul')::date;
$$;

-- The next 00:00 in Istanbul.
create function private.istanbul_midnight()
returns timestamptz
language sql
stable
set search_path = ''
as $$
  select ((private.istanbul_today() + 1)::timestamp) at time zone 'Europe/Istanbul';
$$;

-- Placing people in one district's rooms of one day goes one at a time (the last seat).
create function private.lock_district_day(target_district_id uuid, target_day date)
returns void
language sql
volatile
set search_path = ''
as $$
  select pg_advisory_xact_lock(hashtextextended('district_day:' || target_district_id::text
                                                || ':' || target_day::text, 0));
$$;

-- The person's open session, or a row of nulls.
create function private.district_open_session(target_user_id uuid)
returns public.district_sessions
language sql
stable
security definer
set search_path = ''
as $$
  select * from public.district_sessions
  where user_id = target_user_id and status = 'open' and grace_ends_at > now()
    and day = private.istanbul_today()
  limit 1;
$$;

-- A message the person may see: in their open session's room, from their joining on, not deleted,
-- not from someone blocked either way, hidden only to others.
create function private.visible_district_chat_message(target_user_id uuid, target_message_id uuid)
returns public.district_chat_messages
language sql
stable
security definer
set search_path = ''
as $$
  select m.* from public.district_chat_messages m
  join public.district_sessions s
    on s.id = (private.district_open_session(target_user_id)).id
  where m.id = target_message_id
    and m.room_id = s.room_id
    and m.created_at >= s.joined_at
    and m.deleted_at is null
    and not private.is_blocked_between(target_user_id, m.sender_user_id)
    and (m.hidden_at is null or m.sender_user_id = target_user_id);
$$;

create function private.district_quote(viewer uuid, m public.district_chat_messages)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when not m.replied then null
    when q.id is null then jsonb_build_object('gone', true)
    else jsonb_build_object(
      'id', q.id,
      'body', left(q.body, 80),
      'from_me', q.sender_user_id = viewer,
      'name', case when q.profiled then p.display_name else q.sender_alias end
    )
  end
  from (select 1) one
  left join lateral (
    select v.* from private.visible_district_chat_message(viewer, m.reply_to_id) v
    where v.id is not null
  ) q on true
  left join public.profiles p on p.id = q.sender_user_id;
$$;

create function private.district_reaction_list(viewer uuid, target_message_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    jsonb_agg(jsonb_build_object('emoji', e.emoji, 'count', e.n, 'mine', e.mine)
      order by e.first_at),
    '[]'::jsonb)
  from (
    select r.emoji, count(*)::int as n, bool_or(r.user_id = viewer) as mine,
           min(r.created_at) as first_at
    from public.district_chat_reactions r
    where r.message_id = target_message_id
    group by r.emoji
  ) e;
$$;

-- 3. Writes (service role) ------------------------------------------------------------------------

-- The district the Edge Function found (null: outside every district). A session in another
-- district, or any session when outside, closes.
create function public.district_set(target_user_id uuid, target_district_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  s public.district_sessions;
begin
  insert into public.user_districts (user_id, district_id, located_at)
  values (target_user_id, target_district_id, now())
  on conflict (user_id) do update
    set district_id = excluded.district_id, located_at = excluded.located_at;

  select * into s from public.district_sessions
  where user_id = target_user_id and status = 'open'
  for no key update;
  if s.id is not null and s.district_id is distinct from target_district_id then
    update public.district_sessions set status = 'closed', closed_at = now() where id = s.id;
  end if;
end;
$$;

-- One try a day. The second answer of a day changes nothing and returns the first result.
create function public.gecit_answer(target_user_id uuid, target_day date, choice integer)
returns table (correct boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  q public.gecit_questions;
  a public.gecit_answers;
begin
  if target_day is distinct from private.istanbul_today() then
    raise exception using errcode = 'P0001', message = 'question_expired';
  end if;
  select * into q from public.gecit_questions where day = target_day;
  if q.day is null then
    raise exception using errcode = 'P0001', message = 'no_question';
  end if;
  insert into public.gecit_answers (user_id, day, correct)
  values (target_user_id, target_day, choice = q.answer)
  on conflict (user_id, day) do nothing;
  select * into a from public.gecit_answers where user_id = target_user_id and day = target_day;
  return query select a.correct;
end;
$$;

-- Into a room: the open session if there is one in the person's district; else back to the room of
-- today's last session if it has a seat, else the fullest room with a seat (the older on a tie),
-- else a new room. Seats are counted under the district-day lock, so of two people going for the
-- last seat at the same time one gets it and the other the next room.
create function public.district_enter(target_user_id uuid, capacity integer, session_minutes integer,
                                      grace_minutes integer)
returns public.district_sessions
language plpgsql
security definer
set search_path = ''
as $$
declare
  ud public.user_districts;
  today date := private.istanbul_today();
  midnight timestamptz := private.istanbul_midnight();
  s public.district_sessions;
  last_s public.district_sessions;
  target_room uuid;
  joined timestamptz := now();
  new_ends timestamptz;
begin
  select * into ud from public.user_districts where user_id = target_user_id for update;
  if ud.district_id is null then
    raise exception using errcode = 'P0001', message = 'district_required';
  end if;
  if exists (select 1 from public.gecit_questions where day = today)
     and not exists (select 1 from public.gecit_answers
                     where user_id = target_user_id and day = today and correct) then
    raise exception using errcode = 'P0001', message = 'gate_closed';
  end if;

  perform private.lock_district_day(ud.district_id, today);

  select * into s from public.district_sessions
  where user_id = target_user_id and status = 'open'
  for no key update;
  if s.id is not null then
    if s.district_id = ud.district_id and s.day = today and s.grace_ends_at > now() then
      return s;
    end if;
    update public.district_sessions set status = 'closed', closed_at = now() where id = s.id;
  end if;

  -- Back to today's last room, if it has a seat.
  select * into last_s from public.district_sessions
  where user_id = target_user_id and district_id = ud.district_id and day = today
  order by created_at desc
  limit 1;
  if last_s.id is not null then
    select r.id into target_room from public.district_rooms r
    where r.id = last_s.room_id
      and (select count(*) from public.district_sessions o
           where o.room_id = r.id and o.status = 'open') < capacity
    for no key update;
    if target_room is not null then
      select min(o.joined_at) into joined from public.district_sessions o
      where o.user_id = target_user_id and o.room_id = target_room;
    end if;
  end if;

  if target_room is null then
    select r.id into target_room from public.district_rooms r
    left join lateral (
      select count(*) as n from public.district_sessions o
      where o.room_id = r.id and o.status = 'open'
    ) c on true
    where r.district_id = ud.district_id and r.day = today and c.n < capacity
    order by c.n desc, r.created_at, r.id
    limit 1
    for no key update of r;
    joined := now();
  end if;

  if target_room is null then
    insert into public.district_rooms (district_id, day) values (ud.district_id, today)
    returning id into target_room;
    joined := now();
  end if;

  new_ends := least(now() + make_interval(mins => session_minutes), midnight);
  insert into public.district_sessions
    (user_id, district_id, room_id, day, joined_at, ends_at, grace_ends_at)
  values
    (target_user_id, ud.district_id, target_room, today, coalesce(joined, now()), new_ends,
     least(new_ends + make_interval(mins => grace_minutes), midnight))
  returning * into s;
  return s;
end;
$$;

-- "Evet, 2 saat daha": the same room, from now, never past midnight. Only once the time is up (a
-- minute early for the phone's clock); before that, or with no open session, not_due / no_session.
create function public.district_extend(target_user_id uuid, session_minutes integer,
                                       grace_minutes integer)
returns public.district_sessions
language plpgsql
security definer
set search_path = ''
as $$
declare
  s public.district_sessions;
  midnight timestamptz := private.istanbul_midnight();
  new_ends timestamptz;
begin
  select * into s from public.district_sessions
  where id = (private.district_open_session(target_user_id)).id
  for no key update;
  if s.id is null or s.status <> 'open' or s.grace_ends_at <= now() then
    raise exception using errcode = 'P0001', message = 'no_session';
  end if;
  if now() < s.ends_at - interval '1 minute' then
    raise exception using errcode = 'P0001', message = 'not_due';
  end if;
  new_ends := least(now() + make_interval(mins => session_minutes), midnight);
  update public.district_sessions
  set ends_at = new_ends,
      grace_ends_at = least(new_ends + make_interval(mins => grace_minutes), midnight)
  where id = s.id
  returning * into s;
  return s;
end;
$$;

create function public.district_leave(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.district_sessions set status = 'closed', closed_at = now()
  where user_id = target_user_id and status = 'open';
end;
$$;

-- One change of identity per session; profiled needs a photo.
create function public.district_set_identity(target_user_id uuid, anonymous boolean)
returns public.district_sessions
language plpgsql
security definer
set search_path = ''
as $$
declare
  s public.district_sessions;
  wanted text := case when anonymous then 'anonymous' else 'profiled' end;
begin
  select * into s from public.district_sessions
  where id = (private.district_open_session(target_user_id)).id
  for no key update;
  if s.id is null then
    raise exception using errcode = 'P0001', message = 'no_session';
  end if;
  if s.identity_mode = wanted then
    return s;
  end if;
  if s.identity_switches >= 1 then
    raise exception using errcode = 'P0001', message = 'identity_switch_used';
  end if;
  if wanted = 'profiled' and not public.has_profile_photo(target_user_id) then
    raise exception using errcode = 'P0001', message = 'photo_required';
  end if;
  update public.district_sessions
  set identity_mode = wanted, identity_switches = identity_switches + 1
  where id = s.id
  returning * into s;
  return s;
end;
$$;

-- 4. The room chat (service role) -----------------------------------------------------------------

-- The room of the person's open session (the chat's topic), or null.
create function public.district_open_session_room(target_user_id uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select (private.district_open_session(target_user_id)).room_id;
$$;

create function public.district_chat_page_for(
  target_user_id uuid,
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
  with k as materialized (select private.venue_chat_sender_secret() as secret),
  s as materialized (select * from private.district_open_session(target_user_id) where id is not null)
  select m.id, m.profiled,
         case when m.profiled then null else m.sender_alias end,
         case when m.profiled then p.display_name else null end,
         case when m.profiled and p.photo_hidden_at is null then p.photo_path else null end,
         m.body, m.created_at, m.sender_user_id = target_user_id,
         private.district_quote(target_user_id, m),
         private.district_reaction_list(target_user_id, m.id),
         left(encode(extensions.hmac(
           'district_chat_sender:' || m.sender_user_id::text || ':' || m.profiled::text || ':'
             || m.sender_alias || ':' || m.room_id::text,
           k.secret, 'sha256'), 'hex'), 24),
         case when m.profiled then null else m.sender_look end
  from public.district_chat_messages m
  cross join k
  join s on s.room_id = m.room_id
  left join public.profiles p on p.id = m.sender_user_id
  where m.created_at >= s.joined_at
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

-- The same clientId again (its answer lost) is the same message: nothing written or counted.
create function public.district_chat_send_once(
  target_user_id uuid,
  new_body text,
  min_interval_ms integer,
  window_seconds integer,
  window_max integer,
  expected_identity text,
  reply_to uuid default null,
  new_client_id uuid default null
)
returns table (message_id uuid, replayed boolean, room_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  s public.district_sessions;
  rate public.district_chat_rate;
  msg public.district_chat_messages;
  prior public.district_chat_messages;
  p public.profiles;
begin
  select * into s from public.district_sessions
  where id = (private.district_open_session(target_user_id)).id
  for no key update;
  if s.id is null then
    raise exception using errcode = 'P0001', message = 'no_session';
  end if;

  if new_client_id is not null then
    select * into prior from public.district_chat_messages
    where sender_user_id = target_user_id and client_id = new_client_id;
    if prior.id is not null then
      if prior.room_id <> s.room_id or prior.body <> new_body
        or prior.reply_to_id is distinct from reply_to then
        raise exception using errcode = 'P0001', message = 'client_id_reused';
      end if;
      if prior.profiled <> (expected_identity = 'profiled') then
        raise exception using errcode = 'P0001', message = 'identity_mismatch';
      end if;
      return query select prior.id, true, prior.room_id;
      return;
    end if;
  end if;

  if expected_identity is distinct from s.identity_mode then
    raise exception using errcode = 'P0001', message = 'identity_mismatch';
  end if;
  if reply_to is not null
     and (private.visible_district_chat_message(target_user_id, reply_to)).id is null then
    raise exception using errcode = 'P0001', message = 'reply_unavailable';
  end if;

  insert into public.district_chat_rate (user_id, window_started_at, count, last_sent_at)
  values (target_user_id, '-infinity', 0, '-infinity')
  on conflict (user_id) do nothing;
  select * into rate from public.district_chat_rate where user_id = target_user_id for update;
  if now() - rate.last_sent_at < make_interval(secs => min_interval_ms / 1000.0) then
    raise exception using errcode = 'P0001', message = 'too_soon';
  end if;
  if now() - rate.window_started_at >= make_interval(secs => window_seconds) then
    update public.district_chat_rate
    set window_started_at = now(), count = 1, last_sent_at = now()
    where user_id = target_user_id;
  elsif rate.count >= window_max then
    raise exception using errcode = 'P0001', message = 'rate_limited';
  else
    update public.district_chat_rate
    set count = count + 1, last_sent_at = now()
    where user_id = target_user_id;
  end if;

  select * into p from public.profiles where id = target_user_id;
  if (case when s.identity_mode = 'profiled' then p.display_name else p.capsule_nick end) is null then
    raise exception using errcode = 'P0001', message = 'onboarding_required';
  end if;
  insert into public.district_chat_messages
    (room_id, session_id, sender_user_id, sender_alias, profiled, sender_look, body, reply_to_id,
     replied, client_id)
  values
    (s.room_id, s.id, target_user_id,
     case when s.identity_mode = 'profiled' then p.display_name else p.capsule_nick end,
     s.identity_mode = 'profiled',
     case when s.identity_mode = 'profiled' then null else p.capsule_look end,
     new_body, reply_to, reply_to is not null, new_client_id)
  returning * into msg;
  return query select msg.id, false, msg.room_id;
end;
$$;

create function public.district_chat_react(
  target_user_id uuid,
  target_message_id uuid,
  new_emoji text,
  window_seconds integer,
  window_max integer
)
returns table (room_id uuid, changed boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  msg public.district_chat_messages;
  s public.district_sessions;
  rate public.district_chat_reaction_rate;
  before_emoji text;
begin
  select * into msg from private.visible_district_chat_message(target_user_id, target_message_id);
  if msg.id is null or msg.hidden_at is not null then
    raise exception using errcode = 'P0001', message = 'not_found';
  end if;
  select * into s from public.district_sessions
  where id = (private.district_open_session(target_user_id)).id
  for no key update;
  if s.id is null then
    raise exception using errcode = 'P0001', message = 'not_found';
  end if;

  insert into public.district_chat_reaction_rate (user_id, window_started_at, count)
  values (target_user_id, '-infinity', 0)
  on conflict (user_id) do nothing;
  select * into rate from public.district_chat_reaction_rate
  where user_id = target_user_id for update;
  if now() - rate.window_started_at >= make_interval(secs => window_seconds) then
    update public.district_chat_reaction_rate set window_started_at = now(), count = 1
    where user_id = target_user_id;
  elsif rate.count >= window_max then
    raise exception using errcode = 'P0001', message = 'rate_limited';
  else
    update public.district_chat_reaction_rate set count = count + 1
    where user_id = target_user_id;
  end if;

  select emoji into before_emoji from public.district_chat_reactions
  where message_id = msg.id and user_id = target_user_id;
  if new_emoji is null then
    delete from public.district_chat_reactions
    where message_id = msg.id and user_id = target_user_id;
  else
    insert into public.district_chat_reactions (message_id, user_id, emoji)
    values (msg.id, target_user_id, new_emoji)
    on conflict (message_id, user_id) do update set emoji = excluded.emoji, created_at = now()
    where public.district_chat_reactions.emoji <> excluded.emoji;
  end if;
  return query select msg.room_id, before_emoji is distinct from new_emoji;
end;
$$;

-- The sender's own message, gone for everyone; returns its room for the broadcast.
create function public.district_chat_delete(target_user_id uuid, target_message_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  room uuid;
begin
  update public.district_chat_messages set deleted_at = now()
  where id = target_message_id and sender_user_id = target_user_id and deleted_at is null
  returning room_id into room;
  if room is null then
    raise exception using errcode = 'P0001', message = 'not_found';
  end if;
  return room;
end;
$$;

-- The muted list is the venue chat's (one list, by identity; rule 5).
create function public.district_chat_mute(target_user_id uuid, target_message_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  m public.district_chat_messages;
  mute_id uuid;
begin
  m := private.visible_district_chat_message(target_user_id, target_message_id);
  if m.id is null then
    raise exception using errcode = 'P0001', message = 'not_found';
  end if;
  if m.sender_user_id = target_user_id then
    raise exception using errcode = 'P0001', message = 'bad_request';
  end if;
  insert into public.venue_chat_mutes (user_id, muted_user_id, profiled, label, look)
  values (
    target_user_id, m.sender_user_id, m.profiled,
    case
      when m.profiled then
        coalesce((select display_name from public.profiles where id = m.sender_user_id),
                 m.sender_alias)
      else m.sender_alias
    end,
    case when m.profiled then null else m.sender_look end
  )
  on conflict (user_id, muted_user_id, profiled) do update set label = public.venue_chat_mutes.label
  returning id into mute_id;
  return mute_id;
end;
$$;

-- The sender of a visible profiled message (its profile opens through the message only).
create function public.district_chat_profile_owner(target_user_id uuid, target_message_id uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select m.sender_user_id
  from private.visible_district_chat_message(target_user_id, target_message_id) m
  where m.id is not null and m.profiled and m.hidden_at is null;
$$;

-- As the venue chat's: a copy of the room's last visible messages goes with the report; the same
-- account counts once, the sender's own report nothing; hide_after accounts hide the message.
-- Returns the room when the message became hidden (the caller broadcasts), else null.
create function public.safety_report_district_chat(
  target_user_id uuid,
  target_message_id uuid,
  new_reason text,
  snapshot_size integer,
  hide_after integer
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  s public.district_sessions;
  m public.district_chat_messages;
  snapshot jsonb;
  added integer;
  reporters integer;
begin
  select * into m from private.visible_district_chat_message(target_user_id, target_message_id);
  if m.id is null or m.sender_user_id = target_user_id then
    return null;
  end if;
  select * into s from public.district_sessions
  where id = (private.district_open_session(target_user_id)).id
  for no key update;
  select * into m from public.district_chat_messages where id = target_message_id for update;
  if m.id is null then
    return null;
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
    from public.district_chat_messages x
    left join public.profiles p on p.id = x.sender_user_id
    where x.room_id = m.room_id and (x.hidden_at is null or x.id = m.id)
      and x.deleted_at is null
    order by x.created_at desc
    limit snapshot_size
  ) last;

  insert into public.reports (reporter_id, reported_user_id, reason, target_type,
                              district_chat_message_id, messages_snapshot)
  values (target_user_id, m.sender_user_id, new_reason, 'district_chat', m.id, snapshot);

  insert into public.district_chat_reports (message_id, reporter_user_id)
  values (m.id, target_user_id)
  on conflict do nothing;
  get diagnostics added = row_count;
  if added = 0 or m.hidden_at is not null then
    return null;
  end if;
  select count(*) into reporters from public.district_chat_reports
  where message_id = m.id and reporter_user_id <> m.sender_user_id;
  if reporters >= hide_after then
    update public.district_chat_messages set hidden_at = now() where id = m.id;
    return m.room_id;
  end if;
  return null;
end;
$$;

-- As the venue chat's (friends_request_venue_chat): the press is kept whatever happens, the request
-- goes as a venue chat request named after the district (the daily limit is the two chats'
-- together), and every way it is swallowed answers ok (rule 5).
create function public.friends_request_district_chat(
  target_user_id uuid,
  target_message_id uuid,
  daily_max integer
)
returns table (outcome text, other_user_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  m public.district_chat_messages;
  reverse_status text;
  sent_today integer;
  chat_name text;
  my_name text;
  their_name text;
  new_id uuid;
begin
  select * into m from private.visible_district_chat_message(target_user_id, target_message_id);
  if m.id is null or not m.profiled or m.hidden_at is not null
     or m.sender_user_id = target_user_id then
    return query select 'ok'::text, null::uuid;
    return;
  end if;
  perform private.lock_pair(target_user_id, m.sender_user_id);

  select d.name into chat_name
  from public.district_rooms r join public.districts d on d.id = r.district_id
  where r.id = m.room_id;
  select display_name into my_name from public.profiles where id = target_user_id;
  select display_name into their_name from public.profiles where id = m.sender_user_id;
  insert into public.venue_chat_friend_presses (from_user_id, to_user_id, to_name, venue_name)
  values (target_user_id, m.sender_user_id, their_name, chat_name)
  on conflict (from_user_id, to_user_id) do nothing;

  if private.is_blocked_between(target_user_id, m.sender_user_id) then
    return query select 'ok'::text, null::uuid;
    return;
  end if;
  if private.are_friends(target_user_id, m.sender_user_id) then
    return query select 'already_friends'::text, null::uuid;
    return;
  end if;

  select status into reverse_status from public.friend_requests
  where from_user_id = m.sender_user_id and to_user_id = target_user_id
  for update;
  if reverse_status = 'pending' then
    perform private.make_friends(target_user_id, m.sender_user_id, 'request');
    return query select 'friendship_created'::text, m.sender_user_id;
    return;
  end if;

  select count(*) into sent_today from public.friend_requests
  where from_user_id = target_user_id and source = 'venue_chat'
    and created_at > now() - interval '1 day';
  if sent_today >= daily_max then
    return query select 'ok'::text, null::uuid;
    return;
  end if;

  insert into public.friend_requests (from_user_id, to_user_id, source, venue_chat_context)
  values (target_user_id, m.sender_user_id, 'venue_chat',
          jsonb_build_object('venueName', chat_name, 'fromName', my_name, 'toName', their_name))
  on conflict (from_user_id, to_user_id) do nothing
  returning id into new_id;
  if new_id is null then
    return query select 'ok'::text, null::uuid;
    return;
  end if;
  return query select 'request_created'::text, m.sender_user_id;
end;
$$;

-- 5. The night (pg_cron) --------------------------------------------------------------------------
-- Every minute: sessions past their extra time close; past days' rooms go, with their sessions,
-- messages and reactions (a report keeps its copy); past days' answers and old rate rows go.
create function private.district_close_due()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  today date := private.istanbul_today();
begin
  update public.district_sessions set status = 'closed', closed_at = now()
  where id in (
    select id from public.district_sessions
    where status = 'open' and (grace_ends_at <= now() or day < today)
    for update skip locked
  );
  delete from public.district_rooms
  where id in (select id from public.district_rooms where day < today for update skip locked);
  delete from public.gecit_answers where day < today;
  delete from public.district_chat_rate where last_sent_at < now() - interval '1 day';
  delete from public.district_chat_reaction_rate
  where window_started_at < now() - interval '1 day';
end;
$$;

select cron.schedule('district-close-due', '* * * * *', $$select private.district_close_due()$$);

-- 6. Realtime (rule 9) ----------------------------------------------------------------------------
-- As before (20261128090000_signum.sql), with district_chat:{room_id}.
create or replace function private.realtime_topic_allowed(channel_topic text, sending boolean)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  kind text := split_part(channel_topic, ':', 1);
  target text := substr(channel_topic, length(kind) + 2);
  target_id uuid;
begin
  if target !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return false;
  end if;
  target_id := target::uuid;

  if kind = 'venue' then
    return not sending and exists (
      select 1 from public.table_sessions
      where user_id = (select auth.uid()) and venue_id = target_id and status = 'active'
    );
  elsif kind = 'venue_chat' then
    -- Only the own venue's topic (a campus of a university included): the server sends every venue
    -- chat broadcast to each campus's topic, and nobody listens on another campus's.
    return not sending and exists (
      select 1 from public.table_sessions
      where user_id = (select auth.uid()) and venue_id = target_id
        and status = 'active' and expires_at > now()
    );
  elsif kind = 'district_chat' then
    -- Only the room of the own open session (the extra time included); only the server sends.
    return not sending and exists (
      select 1 from public.district_sessions
      where user_id = (select auth.uid()) and room_id = target_id
        and status = 'open' and grace_ends_at > now()
    );
  elsif kind = 'session' then
    return not sending and exists (
      select 1 from public.table_sessions
      where id = target_id and user_id = (select auth.uid())
    );
  elsif kind in ('room', 'messages', 'game', 'presence') then
    return private.is_room_member(target_id);
  elsif kind = 'game_team' then
    -- Signum's team channel: only the server sends (data-free), only the team's players listen.
    return not sending and private.signum_team_member(target_id);
  elsif kind = 'inbox' then
    return not sending and target_id = (select auth.uid());
  elsif kind = 'dm' then
    return not sending and exists (
      select 1 from public.dm_threads
      where id = target_id and (select auth.uid()) in (user_a, user_b)
    );
  elsif kind = 'dm_typing' then
    return exists (
      select 1 from public.dm_threads t
      where t.id = target_id and (select auth.uid()) in (t.user_a, t.user_b)
        and not private.is_blocked_between(t.user_a, t.user_b)
    );
  end if;
  return false;
end;
$$;

-- 7. Grants ---------------------------------------------------------------------------------------
do $$
declare
  fn text;
begin
  foreach fn in array array[
    'public.district_set(uuid, uuid)',
    'public.gecit_answer(uuid, date, integer)',
    'public.district_enter(uuid, integer, integer, integer)',
    'public.district_extend(uuid, integer, integer)',
    'public.district_leave(uuid)',
    'public.district_set_identity(uuid, boolean)',
    'public.district_open_session_room(uuid)',
    'public.district_chat_page_for(uuid, timestamptz, integer)',
    'public.district_chat_send_once(uuid, text, integer, integer, integer, text, uuid, uuid)',
    'public.district_chat_react(uuid, uuid, text, integer, integer)',
    'public.district_chat_delete(uuid, uuid)',
    'public.district_chat_mute(uuid, uuid)',
    'public.district_chat_profile_owner(uuid, uuid)',
    'public.safety_report_district_chat(uuid, uuid, text, integer, integer)',
    'public.friends_request_district_chat(uuid, uuid, integer)'
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated', fn);
    execute format('grant execute on function %s to service_role', fn);
  end loop;
  foreach fn in array array[
    'private.istanbul_today()',
    'private.istanbul_midnight()',
    'private.lock_district_day(uuid, date)',
    'private.district_open_session(uuid)',
    'private.visible_district_chat_message(uuid, uuid)',
    'private.district_quote(uuid, public.district_chat_messages)',
    'private.district_reaction_list(uuid, uuid)',
    'private.district_close_due()'
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated', fn);
  end loop;
end;
$$;
