-- Kapsül Anlat (step 4.6.1), the owner's decisions of 5 November (docs/decisions/4.6.1-kapsul-anlat.md):
-- - Tur sonu lasts 30 s (was 15), as the canvas's Tur sonu board shows.
-- - The last turn has its Tur sonu too; the game ends when it is over (the owner's "Sonraki tura
--   geç" or its clock). A team left with nobody still ends the game at once.
-- - The side model's one-table deck (tabu_local_deck) goes: nothing calls it.

-- pure/tabuGame.ts → TABU_GAME (tabuGame.test.ts reads the numbers here).
create or replace function private.tabu_config()
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select jsonb_build_object(
    'turnSeconds', 60, 'totalTurns', 6, 'maxPasses', 3, 'readySeconds', 10,
    'countdownSeconds', 3, 'summarySeconds', 30, 'cardsPerTurn', 40, 'minPlayers', 4,
    'maxPlayers', 12
  );
$$;

-- The turn's clock ran out: what it scored goes to lastTurn and Tur sonu opens, after the last turn
-- too; a team with nobody left ends the game at once.
create or replace function private.tabu_summarize(r public.rooms)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  st jsonb := r.game_state;
  counts jsonb := coalesce(r.game_state -> 'counts', '{}'::jsonb);
  summary jsonb;
begin
  summary := jsonb_build_object(
    'turnNo', (st ->> 'turnNo')::integer,
    'team', private.tabu_team_of((st ->> 'turnNo')::integer),
    'describer', st -> 'describer',
    'score', coalesce((counts ->> 'correct')::integer, 0) - coalesce((counts ->> 'taboo')::integer, 0),
    'counts', counts,
    'words', coalesce(st -> 'words', '[]'::jsonb)
  );
  st := (st - 'startsAt') || jsonb_build_object('lastTurn', summary);
  if private.tabu_team_empty(st) then
    r.game_state := st;
    return private.tabu_finish(r);
  end if;
  update public.rooms
  set last_activity_at = now(),
      game_state = st || jsonb_build_object(
        'phase', 'summary',
        'step', (st ->> 'step')::integer + 1,
        'endsAt', now() + private.tabu_seconds('summarySeconds')
      )
  where id = r.id
  returning * into r;
  return r;
end;
$$;

-- One step on from the phase `r` is in: its time ran out, or the describer or the owner pressed.
-- A team with nobody left ends the game; so does the last turn's Tur sonu.
create or replace function private.tabu_step(r public.rooms)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  phase text := r.game_state ->> 'phase';
begin
  if phase = 'turn' then
    return private.tabu_summarize(r);
  end if;
  if private.tabu_team_empty(r.game_state) then
    return private.tabu_finish(r);
  end if;
  if phase = 'ready' then
    return private.tabu_run_turn(r);
  elsif phase = 'summary' then
    if (r.game_state ->> 'turnNo')::integer >= (r.game_state ->> 'totalTurns')::integer then
      return private.tabu_finish(r);
    end if;
    return private.tabu_open_turn(r.id, r.game_state, (r.game_state ->> 'turnNo')::integer + 1);
  end if;
  return r;
end;
$$;

drop function public.tabu_local_deck(uuid, uuid, integer);

revoke all on function private.tabu_config() from public, anon, authenticated;
revoke all on function private.tabu_summarize(public.rooms) from public, anon, authenticated;
revoke all on function private.tabu_step(public.rooms) from public, anon, authenticated;
