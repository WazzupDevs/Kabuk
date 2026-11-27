-- Geçit's question pool, Skall Semti and Skall Üniversitesi (the owner's decisions, 27 Kasım;
-- docs/decisions/gecit-havuz-acik-yerler.md, docs/SPEC_V4.md §4.V and §4.AA).
--
-- 1. The pool: questions are loaded once (pnpm admin:gecit-import); the day's questions are drawn
--    from it on the server, the never asked first, then the longest ago. A day has numbered
--    questions (slot 1, 2, …), the same for everyone: a wrong answer gives the next one an hour
--    later, without limit. The right option never leaves the server (rule 4).
-- 2. districts.open: a district with no boundary that anyone may enter, whatever their location
--    (Skall Semti). locate never finds it; a session in it is not closed by a location.
-- 3. venues.open_checkin: a venue checked in to without a location (Skall Üniversitesi).
--
-- Rule 10: the day's question is drawn under the Geçit day's advisory lock (private.lock_gecit_day)
-- → gecit_pool → gecit_questions, holding no other lock; an answer locks gecit_answers alone.
-- Entering a district keeps its order (user_districts → district-day lock → …).

-- 1. The pool ------------------------------------------------------------------------------------

create table public.gecit_pool (
  id uuid primary key default gen_random_uuid(),
  prompt text not null unique check (char_length(prompt) between 1 and 300),
  options text[] not null check (
    array_length(options, 1) = 4
    and array_position(options, null) is null
  ),
  answer smallint not null check (answer between 0 and 3),
  -- The last day it was asked; null: never.
  last_asked_on date,
  created_at timestamptz not null default now()
);
alter table public.gecit_pool enable row level security;
revoke all on table public.gecit_pool from anon, authenticated;

-- A day's questions are numbered; the first is everyone's first.
alter table public.gecit_questions
  add column slot smallint not null default 1 check (slot between 1 and 100),
  add column pool_id uuid references public.gecit_pool (id) on delete set null;
alter table public.gecit_questions drop constraint gecit_questions_pkey;
alter table public.gecit_questions add primary key (day, slot);

-- One answer per question; a wrong one waits an hour for the next question.
alter table public.gecit_answers
  add column slot smallint not null default 1 check (slot between 1 and 100);
alter table public.gecit_answers drop constraint gecit_answers_pkey;
alter table public.gecit_answers add primary key (user_id, day, slot);

-- Drawing a day's question goes one at a time.
create function private.lock_gecit_day(target_day date)
returns void
language sql
volatile
set search_path = ''
as $$
  select pg_advisory_xact_lock(hashtextextended('gecit_day:' || target_day::text, 0));
$$;

-- The day's question with this number: drawn from the pool the first time anyone needs it (the
-- never asked first, at random; then the longest ago). Never one already asked today: a wrong
-- answerer would get it again and find the right option by elimination. A row of nulls when the
-- pool has nothing left for today.
create function private.gecit_question(target_day date, target_slot smallint)
returns public.gecit_questions
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  q public.gecit_questions;
  p public.gecit_pool;
begin
  select * into q from public.gecit_questions where day = target_day and slot = target_slot;
  if q.day is not null then
    return q;
  end if;
  perform private.lock_gecit_day(target_day);
  select * into q from public.gecit_questions where day = target_day and slot = target_slot;
  if q.day is not null then
    return q;
  end if;
  select * into p from public.gecit_pool
  where last_asked_on is distinct from target_day
  order by last_asked_on nulls first, random()
  limit 1
  for update;
  if p.id is null then
    return q;
  end if;
  update public.gecit_pool set last_asked_on = target_day where id = p.id;
  insert into public.gecit_questions (day, slot, prompt, options, answer, pool_id)
  values (target_day, target_slot, p.prompt, p.options, p.answer, p.id)
  returning * into q;
  return q;
end;
$$;

-- Whether Geçit asks anything today: a question was drawn or the pool has one.
create function private.gecit_asks(target_day date)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.gecit_questions where day = target_day)
      or exists (select 1 from public.gecit_pool);
$$;

-- The person's gate today. passed: answered right, or nothing to ask. failed: answered wrong, the
-- next question at retry_at. question: the question to answer now (never its answer).
create function public.gecit_state(target_user_id uuid, retry_minutes integer)
returns table (
  gate text,
  day date,
  slot smallint,
  prompt text,
  options text[],
  retry_at timestamptz
)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  today date := private.istanbul_today();
  last_a public.gecit_answers;
  next_slot smallint;
  q public.gecit_questions;
begin
  if exists (select 1 from public.gecit_answers a
             where a.user_id = target_user_id and a.day = today and a.correct) then
    return query select 'passed'::text, today, null::smallint, null::text, null::text[],
      null::timestamptz;
    return;
  end if;
  select * into last_a from public.gecit_answers a
  where a.user_id = target_user_id and a.day = today
  order by a.slot desc
  limit 1;
  if last_a.slot is not null
     and now() < last_a.created_at + make_interval(mins => retry_minutes) then
    return query select 'failed'::text, today, last_a.slot, null::text, null::text[],
      least(last_a.created_at + make_interval(mins => retry_minutes), private.istanbul_midnight());
    return;
  end if;
  next_slot := coalesce(last_a.slot, 0) + 1;
  if next_slot > 100 then
    return query select 'failed'::text, today, last_a.slot, null::text, null::text[],
      private.istanbul_midnight();
    return;
  end if;
  q := private.gecit_question(today, next_slot);
  if q.day is null and next_slot = 1 then
    -- Nothing to ask today (an empty pool): the gate is open, as district_enter sees it.
    return query select 'passed'::text, today, null::smallint, null::text, null::text[],
      null::timestamptz;
    return;
  end if;
  if q.day is null then
    -- The pool has no question left for today after a wrong answer: closed until midnight.
    return query select 'failed'::text, today, last_a.slot, null::text, null::text[],
      private.istanbul_midnight();
    return;
  end if;
  return query select 'question'::text, today, q.slot, q.prompt, q.options, null::timestamptz;
end;
$$;

-- An answer to the person's current question. The same answer sent again returns its first result;
-- the next question before its time is gate_closed; an old question is question_expired.
-- target_slot null (an app from before the pool): the person's current question.
drop function public.gecit_answer(uuid, date, integer);
create function public.gecit_answer(target_user_id uuid, target_day date, choice integer,
                                    target_slot smallint default null,
                                    retry_minutes integer default 60)
returns table (correct boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  last_a public.gecit_answers;
  cur smallint;
  q public.gecit_questions;
  a public.gecit_answers;
begin
  if target_day is distinct from private.istanbul_today() then
    raise exception using errcode = 'P0001', message = 'question_expired';
  end if;
  if exists (select 1 from public.gecit_answers x
             where x.user_id = target_user_id and x.day = target_day and x.correct) then
    return query select true;
    return;
  end if;
  select * into last_a from public.gecit_answers x
  where x.user_id = target_user_id and x.day = target_day
  order by x.slot desc
  limit 1;
  if last_a.slot is not null
     and now() < last_a.created_at + make_interval(mins => retry_minutes) then
    if target_slot is null or target_slot = last_a.slot then
      return query select last_a.correct;
      return;
    end if;
    raise exception using errcode = 'P0001', message = 'gate_closed';
  end if;
  cur := coalesce(last_a.slot, 0) + 1;
  if target_slot is not null and target_slot <> cur then
    raise exception using errcode = 'P0001', message = 'question_expired';
  end if;
  select * into q from public.gecit_questions x where x.day = target_day and x.slot = cur;
  if q.day is null then
    raise exception using errcode = 'P0001', message = 'no_question';
  end if;
  insert into public.gecit_answers (user_id, day, slot, correct)
  values (target_user_id, target_day, cur, choice = q.answer)
  on conflict (user_id, day, slot) do nothing;
  select * into a from public.gecit_answers x
  where x.user_id = target_user_id and x.day = target_day and x.slot = cur;
  return query select a.correct;
end;
$$;

-- 2. Skall Semti ---------------------------------------------------------------------------------

alter table public.districts add column open boolean not null default false;
alter table public.districts drop constraint districts_ring_check;
alter table public.districts add constraint districts_ring_check check (
  jsonb_typeof(ring) = 'array' and (open or jsonb_array_length(ring) >= 3)
);

-- An open district's session is not closed by where the person is found.
create or replace function public.district_set(target_user_id uuid, target_district_id uuid)
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
  if s.id is not null and s.district_id is distinct from target_district_id
     and not coalesce((select d.open from public.districts d where d.id = s.district_id), false)
  then
    update public.district_sessions set status = 'closed', closed_at = now() where id = s.id;
  end if;
end;
$$;

-- As before (20261208090000_semte_git.sql), with the district to enter: null is the person's own
-- (found) district; otherwise an active district that is open or is their own. The gate: whatever
-- Geçit asks today must have been answered right.
drop function public.district_enter(uuid, integer, integer, integer);
create function public.district_enter(target_user_id uuid, capacity integer, session_minutes integer,
                                      grace_minutes integer,
                                      target_district_id uuid default null)
returns public.district_sessions
language plpgsql
security definer
set search_path = ''
as $$
declare
  ud public.user_districts;
  dist uuid;
  today date := private.istanbul_today();
  midnight timestamptz := private.istanbul_midnight();
  s public.district_sessions;
  last_s public.district_sessions;
  target_room uuid;
  joined timestamptz := now();
  new_ends timestamptz;
begin
  select * into ud from public.user_districts where user_id = target_user_id for update;
  if target_district_id is null then
    dist := ud.district_id;
  else
    select d.id into dist from public.districts d
    where d.id = target_district_id and d.is_active
      and (d.open or d.id = ud.district_id);
  end if;
  if dist is null then
    raise exception using errcode = 'P0001', message = 'district_required';
  end if;
  if private.gecit_asks(today)
     and not exists (select 1 from public.gecit_answers
                     where user_id = target_user_id and day = today and correct) then
    raise exception using errcode = 'P0001', message = 'gate_closed';
  end if;

  perform private.lock_district_day(dist, today);

  -- The open session is read without a lock here (rooms come before sessions, rule 10); it is
  -- locked and closed after the room, below.
  select * into s from public.district_sessions
  where user_id = target_user_id and status = 'open';
  if s.id is not null and s.district_id = dist and s.day = today
     and s.grace_ends_at > now() then
    return s;
  end if;

  -- Back to today's last room, if it has a seat.
  select * into last_s from public.district_sessions
  where user_id = target_user_id and district_id = dist and day = today
  order by created_at desc
  limit 1;
  if last_s.id is not null then
    select r.id into target_room from public.district_rooms r
    where r.id = last_s.room_id
      and (select count(*) from public.district_sessions o
           where o.room_id = r.id and o.status = 'open' and o.grace_ends_at > now()) < capacity
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
      where o.room_id = r.id and o.status = 'open' and o.grace_ends_at > now()
    ) c on true
    where r.district_id = dist and r.day = today and c.n < capacity
    order by c.n desc, r.created_at, r.id
    limit 1
    for no key update of r;
    joined := now();
  end if;

  if target_room is null then
    insert into public.district_rooms (district_id, day) values (dist, today)
    returning id into target_room;
    joined := now();
  end if;

  -- After the room: an old open session (another district, a past day, its extra time over) is
  -- locked, read again and closed before the new one (one open session per person).
  select * into s from public.district_sessions
  where user_id = target_user_id and status = 'open'
  for no key update;
  if s.id is not null then
    if s.district_id = dist and s.day = today and s.grace_ends_at > now() then
      return s;
    end if;
    update public.district_sessions set status = 'closed', closed_at = now() where id = s.id;
  end if;

  new_ends := least(now() + make_interval(mins => session_minutes), midnight);
  insert into public.district_sessions
    (user_id, district_id, room_id, day, joined_at, ends_at, grace_ends_at)
  values
    (target_user_id, dist, target_room, today, coalesce(joined, now()), new_ends,
     least(new_ends + make_interval(mins => grace_minutes), midnight))
  returning * into s;
  return s;
end;
$$;

-- 3. Skall Üniversitesi --------------------------------------------------------------------------

alter table public.venues add column open_checkin boolean not null default false;

-- As before (20261121090000_universities.sql), with open_checkin.
drop function public.explore_venues(integer);
create function public.explore_venues(event_days integer default 7)
returns table (
  venue_id uuid,
  name text,
  district text,
  kind text,
  category text,
  lat double precision,
  lng double precision,
  bucket text,
  events jsonb,
  boundary jsonb,
  university_id uuid,
  university_ref text,
  university_name text,
  open_checkin boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select v.id,
         v.name,
         v.district,
         v.kind,
         case when v.kind = 'campus' then null else coalesce(v.category, 'kafe') end,
         extensions.st_y(v.location::extensions.geometry),
         extensions.st_x(v.location::extensions.geometry),
         coalesce(a.bucket, 'calm'),
         coalesce(e.events, '[]'::jsonb),
         case when v.boundary is not null
           then (extensions.st_asgeojson(v.boundary::extensions.geometry)::jsonb -> 'coordinates' -> 0)
         end,
         u.id,
         u.ref,
         u.name,
         v.open_checkin
  from public.venues v
  left join public.universities u on u.id = v.university_id
  left join public.venue_activity a on a.venue_id = v.id
  left join lateral (
    select jsonb_agg(
             jsonb_build_object('title', ev.title, 'startsAt', ev.starts_at, 'endsAt', ev.ends_at)
             order by ev.starts_at
           ) as events
    from public.venue_events ev
    where ev.venue_id = v.id
      and ev.ends_at > now()
      and ev.starts_at <= now() + make_interval(days => least(greatest(event_days, 0), 14))
  ) e on true
  where v.is_active
    and (v.university_id is null or u.is_active)
  order by v.name;
$$;

revoke all on function public.explore_venues(integer) from public, anon;
grant execute on function public.explore_venues(integer) to authenticated;

-- 4. Grants ---------------------------------------------------------------------------------------
do $$
declare
  fn text;
begin
  foreach fn in array array[
    'public.gecit_state(uuid, integer)',
    'public.gecit_answer(uuid, date, integer, smallint, integer)',
    'public.district_set(uuid, uuid)',
    'public.district_enter(uuid, integer, integer, integer, uuid)'
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated', fn);
    execute format('grant execute on function %s to service_role', fn);
  end loop;
  foreach fn in array array[
    'private.lock_gecit_day(date)',
    'private.gecit_question(date, smallint)',
    'private.gecit_asks(date)'
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated', fn);
  end loop;
end;
$$;
