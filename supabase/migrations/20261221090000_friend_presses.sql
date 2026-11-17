-- İstekler → "Gönderdiğin" (yeni arayüz tuvali, IsteklerDolu; docs/decisions/yeni-tuval.md → h and
-- the 17 Kasım akşam decisions; rule 5 and 10).
--
-- The sender's list is made of presses, never of request rows: a request that was swallowed for
-- any reason (a block, an earlier decline, a removal, the daily limit, an anonymous friend, an
-- account that is gone) leaves the same press as one that waits, and the list shows every press as
-- "Kabul etmesi bekleniyor". venue_chat_friend_presses becomes friend_presses and takes the old
-- "İstek gönder" road of play history too.
--
--   * A chat press is one per pair (the person is profiled); a history press is one per history
--     row, under the name the person sat with: two rows of one person are never tied together, so
--     an anonymous seat stays unnamed (rule 4, K-75).
--   * An accepted request leaves the list: make_friends removes the pair's profiled presses. A
--     press on someone who sat anonymously stays (K-75: a friend who sat anonymously is told apart
--     from nobody).
--   * "Geri çek" (friends_withdraw) hides the press, clears the history row's "İstek gönder" and
--     deletes the waiting request; a decline stays (it is permanent) and the other side is told
--     nothing.
--   * One new request a day per pair after a withdrawal: a press again within a day of taking a
--     waiting request back shows as waiting and sends nothing. The chats' daily limit counts the
--     presses that made a request (a withdrawn one too).
--
-- Lock order (rule 10): play_history → pair lock → friend_presses → friend_requests → friendships.

-- 1. The table -------------------------------------------------------------------------------------
alter table public.venue_chat_friend_presses rename to friend_presses;
alter table public.friend_presses rename column created_at to sent_at;
alter table public.friend_presses
  drop constraint venue_chat_friend_presses_pkey,
  drop constraint venue_chat_friend_presses_to_user_id_fkey,
  alter column to_user_id drop not null,
  add column id uuid not null default gen_random_uuid(),
  add column source text not null default 'venue_chat'
    check (source in ('venue_chat', 'district_chat', 'history')),
  add column history_id uuid references public.play_history (id) on delete set null,
  add column to_profiled boolean not null default true,
  -- When this press last made a request row (the chats' daily limit is counted from it), and
  -- when its waiting request was last taken back (one new request a day per pair after that).
  add column requested_at timestamptz,
  add column withdrawn_at timestamptz,
  add column hidden_at timestamptz,
  add primary key (id),
  -- The person's account going leaves the press: it waits like any other.
  add constraint friend_presses_to_user_id_fkey
    foreign key (to_user_id) references auth.users (id) on delete set null;
alter table public.friend_presses alter column source drop default;
alter table public.friend_presses
  rename constraint venue_chat_friend_presses_from_user_id_fkey to friend_presses_from_user_id_fkey;

create unique index friend_presses_chat_key on public.friend_presses (from_user_id, to_user_id)
  where source <> 'history' and to_user_id is not null;
create unique index friend_presses_history_key on public.friend_presses (from_user_id, history_id)
  where source = 'history' and history_id is not null;
create index friend_presses_from_idx on public.friend_presses (from_user_id, sent_at desc);
create index friend_presses_to_idx on public.friend_presses (to_user_id);
create index friend_presses_history_idx on public.friend_presses (history_id);

-- The presses from before: a chat press between two who are friends was 'accepted' and leaves; the
-- rest keep the stamp of the request they made, if one is there.
delete from public.friend_presses p where private.are_friends(p.from_user_id, p.to_user_id);
update public.friend_presses p set requested_at = r.created_at
from public.friend_requests r
where r.from_user_id = p.from_user_id and r.to_user_id = p.to_user_id;

-- "İstek gönder" pressed on play history before this (the old road's rows only: a mutual "Evet"
-- and a friend_open row press "Arkadaş ekle", which is no request).
insert into public.friend_presses
  (from_user_id, to_user_id, source, history_id, to_name, to_profiled, sent_at, requested_at)
select h.user_id, h.other_user_id, 'history', h.id, h.other_alias, h.other_profiled,
       h.friend_action_at, r.created_at
from public.play_history h
left join public.friend_requests r
  on r.from_user_id = h.user_id and r.to_user_id = h.other_user_id
where h.friend_action_at is not null and not h.friend_open and not h.reveal_mutual
  and not (h.other_profiled and h.other_user_id is not null
           and private.are_friends(h.user_id, h.other_user_id));

-- 2. A press, kept whatever happens next ------------------------------------------------------------
-- Called under the pair lock (with a person) and, for history, with the history row locked. A
-- hidden press comes back as a new one. Returns the press.
create function private.friend_press(
  from_id uuid,
  to_id uuid,
  new_source text,
  new_history_id uuid,
  new_to_name text,
  new_to_profiled boolean,
  new_venue_name text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  press_id uuid;
begin
  if new_source = 'history' then
    select id into press_id from public.friend_presses
    where from_user_id = from_id and source = 'history' and history_id = new_history_id
    for update;
  else
    select id into press_id from public.friend_presses
    where from_user_id = from_id and source <> 'history' and to_user_id = to_id
    for update;
  end if;
  if press_id is null then
    insert into public.friend_presses
      (from_user_id, to_user_id, source, history_id, to_name, to_profiled, venue_name)
    values (from_id, to_id, new_source, new_history_id, new_to_name, new_to_profiled,
            new_venue_name)
    returning id into press_id;
    return press_id;
  end if;
  update public.friend_presses
  set sent_at = now(), hidden_at = null, to_name = new_to_name, venue_name = new_venue_name
  where id = press_id and hidden_at is not null;
  return press_id;
end;
$$;

revoke all on function private.friend_press(uuid, uuid, text, uuid, text, boolean, text)
  from public, anon, authenticated;

-- Whether `from_id` took a waiting request to `to_id` back within the last day (one new request a
-- day per pair after that: "Geri çek" and a new press never ring the other side again and again).
create function private.friend_withdrawn_today(from_id uuid, to_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.friend_presses
    where from_user_id = from_id and to_user_id = to_id
      and withdrawn_at > now() - interval '1 day'
  );
$$;

revoke all on function private.friend_withdrawn_today(uuid, uuid)
  from public, anon, authenticated;

-- 3. An accepted request leaves the sender's list ----------------------------------------------------
-- make_friends as in 20261005090000_friends_dm.sql, first removing the pair's profiled presses
-- (friend_presses comes before friend_requests and friendships in the lock order).
create or replace function private.make_friends(a uuid, b uuid, new_source text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  created boolean;
begin
  delete from public.friend_presses
  where to_profiled
    and ((from_user_id = a and to_user_id = b) or (from_user_id = b and to_user_id = a));
  insert into public.friendships (user_a, user_b, source)
  values (least(a, b), greatest(a, b), new_source)
  on conflict do nothing;
  created := found;
  insert into public.dm_threads (user_a, user_b)
  values (least(a, b), greatest(a, b))
  on conflict do nothing;
  update public.friend_requests
  set status = 'accepted', responded_at = coalesce(responded_at, now())
  where status = 'pending'
    and ((from_user_id = a and to_user_id = b) or (from_user_id = b and to_user_id = a));
  return created;
end;
$$;

-- 4. The three request roads -------------------------------------------------------------------------
-- friends_request as in 20261104090000_table_model.sql: the pair lock first, then the press, then
-- the ways it is swallowed. A row whose other account is gone keeps a press too.
create or replace function public.friends_request(target_user_id uuid, target_history_id uuid)
returns table (outcome text, other_user_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  h public.play_history;
  reverse_status text;
  press_id uuid;
  new_id uuid;
begin
  select * into h from private.own_history(target_user_id, target_history_id);
  if h.id is null then
    return query select 'ok'::text, null::uuid;
    return;
  end if;
  update public.play_history set friend_action_at = coalesce(friend_action_at, now())
  where id = h.id;

  if h.other_user_id is null then
    perform private.friend_press(target_user_id, null, 'history', h.id, h.other_alias,
                                 coalesce(h.other_profiled, false), null);
    return query select 'ok'::text, null::uuid;
    return;
  end if;
  perform private.lock_pair(target_user_id, h.other_user_id);
  if private.are_friends(target_user_id, h.other_user_id)
     and coalesce(h.other_profiled, false) then
    return query select 'already_friends'::text, null::uuid;
    return;
  end if;
  press_id := private.friend_press(target_user_id, h.other_user_id, 'history', h.id,
                                   h.other_alias, coalesce(h.other_profiled, false), null);
  -- K-75 (rule 4): a friend who sat anonymously is told apart from nobody: the press is
  -- swallowed as across a block (rule 5's silent pattern), nothing else changes.
  if private.are_friends(target_user_id, h.other_user_id)
     or private.is_blocked_between(target_user_id, h.other_user_id) then
    return query select 'ok'::text, null::uuid;
    return;
  end if;

  select status into reverse_status from public.friend_requests
  where from_user_id = h.other_user_id and to_user_id = target_user_id
  for update;
  if reverse_status = 'pending' then
    perform private.make_friends(target_user_id, h.other_user_id, 'request');
    return query select 'friendship_created'::text, h.other_user_id;
    return;
  end if;

  if private.friend_withdrawn_today(target_user_id, h.other_user_id) then
    return query select 'ok'::text, null::uuid;
    return;
  end if;
  insert into public.friend_requests (from_user_id, to_user_id, encounter_id)
  values (target_user_id, h.other_user_id, h.encounter_id)
  on conflict (from_user_id, to_user_id) do nothing
  returning id into new_id;
  if new_id is null then
    return query select 'ok'::text, null::uuid;
    return;
  end if;
  update public.friend_presses set requested_at = now() where id = press_id;
  return query select 'request_created'::text, h.other_user_id;
end;
$$;

-- friends_request_venue_chat as in 20261125090000_university_venue_chat.sql. A friend keeps no
-- press (the person is profiled: 'already_friends' is told).
create or replace function public.friends_request_venue_chat(
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
  m public.venue_chat_messages;
  reverse_status text;
  sent_today integer;
  venue_name text;
  my_name text;
  their_name text;
  press_id uuid;
  new_id uuid;
begin
  select * into m from private.visible_venue_chat_message(target_user_id, target_message_id);
  if m.id is null or not m.profiled or m.hidden_at is not null
     or m.sender_user_id = target_user_id then
    return query select 'ok'::text, null::uuid;
    return;
  end if;
  perform private.lock_pair(target_user_id, m.sender_user_id);
  if private.are_friends(target_user_id, m.sender_user_id) then
    return query select 'already_friends'::text, null::uuid;
    return;
  end if;

  -- The press is kept whatever happens next: the sender's list shows it as waiting.
  -- The chat's name (the university's for a campus of one), never the sender's campus.
  select coalesce(u.name, v.name) into venue_name
  from public.venues v left join public.universities u on u.id = v.university_id
  where v.id = m.venue_id;
  select display_name into my_name from public.profiles where id = target_user_id;
  select display_name into their_name from public.profiles where id = m.sender_user_id;
  press_id := private.friend_press(target_user_id, m.sender_user_id, 'venue_chat', null,
                                   their_name, true, venue_name);

  if private.is_blocked_between(target_user_id, m.sender_user_id) then
    return query select 'ok'::text, null::uuid;
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

  select count(*) into sent_today from public.friend_presses
  where from_user_id = target_user_id and source <> 'history'
    and requested_at > now() - interval '1 day';
  if sent_today >= daily_max
     or private.friend_withdrawn_today(target_user_id, m.sender_user_id) then
    return query select 'ok'::text, null::uuid;
    return;
  end if;

  insert into public.friend_requests (from_user_id, to_user_id, source, venue_chat_context)
  values (target_user_id, m.sender_user_id, 'venue_chat',
          jsonb_build_object('venueName', venue_name, 'fromName', my_name, 'toName', their_name))
  on conflict (from_user_id, to_user_id) do nothing
  returning id into new_id;
  if new_id is null then
    return query select 'ok'::text, null::uuid;
    return;
  end if;
  update public.friend_presses set requested_at = now() where id = press_id;
  return query select 'request_created'::text, m.sender_user_id;
end;
$$;

-- friends_request_district_chat as in 20261208090000_semte_git.sql, the same way.
create or replace function public.friends_request_district_chat(
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
  press_id uuid;
  new_id uuid;
begin
  select * into m from private.visible_district_chat_message(target_user_id, target_message_id);
  if m.id is null or not m.profiled or m.hidden_at is not null
     or m.sender_user_id = target_user_id then
    return query select 'ok'::text, null::uuid;
    return;
  end if;
  perform private.lock_pair(target_user_id, m.sender_user_id);
  if private.are_friends(target_user_id, m.sender_user_id) then
    return query select 'already_friends'::text, null::uuid;
    return;
  end if;

  select d.name into chat_name
  from public.district_rooms r join public.districts d on d.id = r.district_id
  where r.id = m.room_id;
  select display_name into my_name from public.profiles where id = target_user_id;
  select display_name into their_name from public.profiles where id = m.sender_user_id;
  press_id := private.friend_press(target_user_id, m.sender_user_id, 'district_chat', null,
                                   their_name, true, chat_name);

  if private.is_blocked_between(target_user_id, m.sender_user_id) then
    return query select 'ok'::text, null::uuid;
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

  select count(*) into sent_today from public.friend_presses
  where from_user_id = target_user_id and source <> 'history'
    and requested_at > now() - interval '1 day';
  if sent_today >= daily_max
     or private.friend_withdrawn_today(target_user_id, m.sender_user_id) then
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
  update public.friend_presses set requested_at = now() where id = press_id;
  return query select 'request_created'::text, m.sender_user_id;
end;
$$;

-- 5. friends/sent and friends/withdraw (service role) -------------------------------------------------
-- The caller's presses, newest first: the name the person showed when it was pressed, never a
-- photo, a profile id or what became of the request (rule 4 and 5).
create function public.friends_sent(viewer uuid)
returns table (id uuid, to_name text, sent_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.to_name, p.sent_at
  from public.friend_presses p
  where p.from_user_id = viewer and p.hidden_at is null
  order by p.sent_at desc, p.id
  limit 100;
$$;

-- "Geri çek". The press is read without a lock for its history row and its person, the locks are
-- taken in order (play_history → pair lock → friend_presses → friend_requests) and the press is
-- read again under them. Returns the person whose waiting request went (their inbox is told to
-- read again), null otherwise; the caller answers { ok: true } whatever happened.
create function public.friends_withdraw(target_user_id uuid, target_press_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  p public.friend_presses;
  gone uuid;
begin
  select * into p from public.friend_presses
  where id = target_press_id and from_user_id = target_user_id;
  if p.id is null then
    return null;
  end if;
  if p.history_id is not null then
    perform 1 from public.play_history
    where id = p.history_id and user_id = target_user_id
    for update;
  end if;
  if p.to_user_id is not null then
    perform private.lock_pair(target_user_id, p.to_user_id);
  end if;
  select * into p from public.friend_presses
  where id = target_press_id and from_user_id = target_user_id and hidden_at is null
  for update;
  if p.id is null then
    return null;
  end if;

  update public.friend_presses set hidden_at = now() where id = p.id;
  -- The history row offers "İstek gönder" again.
  if p.history_id is not null then
    update public.play_history set friend_action_at = null
    where id = p.history_id and user_id = target_user_id;
  end if;
  -- The waiting request goes with the last press that shows it; a decline stays.
  if p.to_user_id is not null and not exists (
    select 1 from public.friend_presses o
    where o.from_user_id = target_user_id and o.to_user_id = p.to_user_id
      and o.hidden_at is null
  ) then
    delete from public.friend_requests
    where from_user_id = target_user_id and to_user_id = p.to_user_id and status = 'pending'
    returning to_user_id into gone;
    if gone is not null then
      update public.friend_presses set withdrawn_at = now() where id = p.id;
    end if;
  end if;
  return gone;
end;
$$;

revoke all on function public.friends_sent(uuid) from public, anon, authenticated;
grant execute on function public.friends_sent(uuid) to service_role;
revoke all on function public.friends_withdraw(uuid, uuid) from public, anon, authenticated;
grant execute on function public.friends_withdraw(uuid, uuid) to service_role;

-- 6. The chat's old reader ----------------------------------------------------------------------------
-- my_sent_venue_chat_requests (20261012090000_venue_chat.sql) over the new table: the chats'
-- presses still shown. An accepted one has left the table, so every row waits.
create or replace function public.my_sent_venue_chat_requests()
returns table (to_name text, venue_name text, status text, created_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select p.to_name, p.venue_name, 'pending'::text, p.sent_at
  from public.friend_presses p
  where p.from_user_id = (select auth.uid()) and p.source <> 'history' and p.hidden_at is null
  order by p.sent_at desc;
$$;
