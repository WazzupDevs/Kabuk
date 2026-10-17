-- Faz 3 step 23.3b (docs/SPEC_V3.md §23.G, §23.N): the table's end without the "Tanışalım mı?"
-- window reaches the app. The app that shows the merged table's end and its "Arkadaş ekle" comes
-- with this migration, so the switch of 20261029090000_table_end.sql turns on here: every road that
-- opened the window closes a two-sided room at once and writes its pairs (friend_open), and
-- inactivity closes only a one-sided room, after 30 minutes (the cron's argument below; pure/rooms.ts
-- → ROOM_IDLE_MINUTES). Undoing it is this function back to false and the cron back to 10.
--
-- With it, one read for the app: which of the caller's history records are friends now
-- (public.my_history_friends), so the table's end and the play history can say "Arkadaş oldunuz"
-- and open the DM (canvas: Faz 3 · 23.3).
--
-- Lock order (rule 10): unchanged; the read takes no lock.

create or replace function private.table_end_on()
returns boolean
language sql
stable
set search_path = ''
as $$
  select true;
$$;

revoke all on function private.table_end_on() from public, anon, authenticated;

select cron.unschedule('close-idle-rooms');
select cron.schedule(
  'close-idle-rooms',
  '* * * * *',
  $$select private.close_idle_rooms(30, 30)$$
);

-- "Arkadaş oldunuz" (docs/SPEC_V3.md §23.G; canvas: Faz 3 · 23.3 → masa sonu, oyun geçmişi): the
-- caller's history records whose pair became friends at that encounter, with the friend's profile id;
-- the app finds the name and the DM thread in its friend list. Both accounts pressed "Arkadaş ekle"
-- on the encounter (each has its intent), they are friends now and nothing blocks them. Friends now
-- alone would not do: a friend who joined the table anonymously would be tied to that record (rule
-- 4). friends_add_from_room writes no intent for a pair that is already friends, and ending a
-- friendship (removal, block) deletes the pair's intents, so neither record shows. A single press
-- shows nothing (rule 5). Read-only (rule 1).
create function public.my_history_friends()
returns table (history_id uuid, public_id uuid)
language sql
stable
security definer
set search_path = ''
as $$
  select h.id, p.public_id
  from public.play_history h
  join public.profiles p on p.id = h.other_user_id
  where h.user_id = (select auth.uid())
    and h.available_at <= now()
    and exists (
      select 1 from public.mutual_friend_intents i
      where i.encounter_id = h.encounter_id and i.user_id = h.user_id
    )
    and exists (
      select 1 from public.mutual_friend_intents i
      where i.encounter_id = h.encounter_id and i.user_id = h.other_user_id
    )
    and private.are_friends(h.user_id, h.other_user_id)
    and not private.is_blocked_between(h.user_id, h.other_user_id);
$$;

revoke all on function public.my_history_friends() from public, anon;
grant execute on function public.my_history_friends() to authenticated;
