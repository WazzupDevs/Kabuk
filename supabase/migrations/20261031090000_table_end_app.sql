-- Faz 3 step 23.3b (docs/SPEC_V3.md §23.G, §23.N): the table's end without the "Tanışalım mı?"
-- window reaches the app. The app that shows the merged table's end and its "Arkadaş ekle" comes
-- with this migration, so the switch of 20261029090000_table_end.sql turns on here: every road that
-- opened the window closes a two-sided room at once and writes its pairs (friend_open), and
-- inactivity closes only a one-sided room, after 30 minutes (the cron's argument below; pure/rooms.ts
-- → ROOM_IDLE_MINUTES). Undoing it is this function back to false and the cron back to 10.
--
-- With it, one read for the app: which of the caller's history records are friends now
-- (public.play_history_friends), so the table's end and the play history can say "Arkadaş oldunuz"
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
-- caller's history records whose two accounts are friends now, with the friend's profile id, name and
-- DM thread. Only friends: friends see each other's profile and profile id (rule 4); a single press
-- of "Arkadaş ekle" makes no friendship and shows nothing here (rule 5). Read-only (rule 1).
create function public.play_history_friends()
returns table (history_id uuid, public_id uuid, display_name text, thread_id uuid)
language sql
stable
security definer
set search_path = ''
as $$
  select h.id, p.public_id, p.display_name, t.id
  from public.play_history h
  join public.profiles p on p.id = h.other_user_id
  left join public.dm_threads t
    on t.user_a = least(h.user_id, h.other_user_id) and t.user_b = greatest(h.user_id, h.other_user_id)
  where h.user_id = (select auth.uid())
    and h.available_at <= now()
    and private.are_friends(h.user_id, h.other_user_id);
$$;

revoke all on function public.play_history_friends() from public, anon;
grant execute on function public.play_history_friends() to authenticated;
