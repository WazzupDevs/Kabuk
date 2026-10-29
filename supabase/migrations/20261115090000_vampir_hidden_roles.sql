-- Vampir Köylü's roles stay hidden until the end (the owner's call, 29 Ekim; K-80, rule 3): the
-- one who dies at night and the one voted out by day go to game_state.dead without their role, so
-- the table and Realtime never carry it; the jester voted out still wins alone (the verdict reads
-- the role on the server). The end screen (lastGame.vampir) shows every role: those still in the
-- game and the dead, each with theirs; who left the game keeps theirs hidden (K-78).

create or replace function private.vampir_morning(r public.rooms)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  st jsonb := r.game_state;
  no integer := private.current_game_no(r.game_state);
  alive uuid[] := private.vampir_alive(r.game_state);
  sec jsonb := private.vampir_secret(r.id, r.game_state);
  picks jsonb := coalesce(sec -> 'picks', '{}'::jsonb);
  bitten uuid;
  saved uuid;
  victim uuid;
begin
  select (p.value #>> '{}')::uuid into bitten
  from public.game_players gp
  join jsonb_each(picks) p on p.key = gp.session_id::text
  where gp.room_id = r.id and gp.game_no = no and gp.role = 'vampir'
    and gp.session_id = any (alive)
  group by p.value #>> '{}'
  order by count(*) desc, random()
  limit 1;

  select (picks ->> gp.session_id::text)::uuid into saved
  from public.game_players gp
  where gp.room_id = r.id and gp.game_no = no and gp.role = 'doktor'
    and gp.session_id = any (alive);

  update public.game_secrets
  set secret = jsonb_set(secret, '{lastSave}', coalesce(to_jsonb(saved::text), 'null'::jsonb))
  where room_id = r.id and game_no = no;

  if bitten is not null and bitten is distinct from saved and bitten = any (alive) then
    victim := bitten;
    st := jsonb_set(
      st, '{dead}',
      coalesce(st -> 'dead', '[]'::jsonb) || jsonb_build_array(jsonb_build_object(
        'sid', victim::text,
        'when', 'night',
        'round', coalesce((st ->> 'round')::integer, 1)
      ))
    );
  end if;
  return private.vampir_enter(
    r.id, st, 'morning', 'morningSeconds',
    jsonb_build_object('victim', coalesce(to_jsonb(victim::text), 'null'::jsonb))
      || jsonb_strip_nulls(jsonb_build_object('winner', private.vampir_winner(r.id, st)))
  );
end;
$$;

create or replace function private.vampir_verdict(r public.rooms)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  st jsonb := r.game_state;
  alive uuid[] := private.vampir_alive(r.game_state);
  top_sid text;
  top_votes integer;
  next_votes integer;
  out_role text;
  winner text;
begin
  select v.target, count(*)::integer into top_sid, top_votes
  from jsonb_each_text(coalesce(st -> 'votes', '{}'::jsonb)) as v (voter, target)
  where v.voter::uuid = any (alive) and v.target::uuid = any (alive)
  group by v.target
  order by count(*) desc, v.target
  limit 1;

  select count(*)::integer into next_votes
  from jsonb_each_text(coalesce(st -> 'votes', '{}'::jsonb)) as v (voter, target)
  where v.voter::uuid = any (alive) and v.target::uuid = any (alive) and v.target <> top_sid
  group by v.target
  order by count(*) desc
  limit 1;

  if top_sid is not null and top_votes > coalesce(next_votes, 0) then
    out_role := private.vampir_role(r.id, st, top_sid::uuid);
    st := jsonb_set(
      st, '{dead}',
      coalesce(st -> 'dead', '[]'::jsonb) || jsonb_build_array(jsonb_build_object(
        'sid', top_sid, 'when', 'vote',
        'round', coalesce((st ->> 'round')::integer, 1)
      ))
    );
  else
    top_sid := null;
  end if;
  winner := case when out_role = 'soytari' then 'j' else private.vampir_winner(r.id, st) end;
  return private.vampir_enter(
    r.id, st, 'verdict', 'verdictSeconds',
    jsonb_build_object('out', coalesce(to_jsonb(top_sid), 'null'::jsonb))
      || jsonb_strip_nulls(jsonb_build_object('winner', winner))
  );
end;
$$;

create or replace function private.vampir_finish(r public.rooms, winner text)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  st jsonb := r.game_state;
  no integer := private.current_game_no(r.game_state);
  roles jsonb;
  dead jsonb;
  result jsonb;
  done public.rooms;
begin
  insert into public.game_results (user_id, room_id, concept, mode, score, won)
  select ts.user_id, r.id, 'vampir', 'vampir', null,
         case winner
           when 'j' then gp.role = 'soytari'
           when 'v' then gp.role = 'vampir'
           else gp.role not in ('vampir', 'soytari')
         end
  from public.game_players gp
  join public.table_sessions ts on ts.id = gp.session_id
  where gp.room_id = r.id and gp.game_no = no and gp.left_at is null
    and not coalesce(st -> 'gone', '[]'::jsonb) ? gp.session_id::text;

  select coalesce(jsonb_object_agg(gp.session_id::text, gp.role), '{}'::jsonb) into roles
  from public.game_players gp
  where gp.room_id = r.id and gp.game_no = no
    and not coalesce(st -> 'gone', '[]'::jsonb) ? gp.session_id::text
    and gp.left_at is null;

  -- The dead with their roles, now that the game is over.
  select coalesce(jsonb_agg(d.value || jsonb_strip_nulls(jsonb_build_object('role', gp.role)) order by d.n), '[]'::jsonb)
  into dead
  from jsonb_array_elements(coalesce(st -> 'dead', '[]'::jsonb)) with ordinality as d (value, n)
  left join public.game_players gp
    on gp.room_id = r.id and gp.game_no = no and gp.session_id::text = d.value ->> 'sid';

  result := jsonb_build_object(
    'winner', winner,
    'roles', roles,
    'seats', coalesce(st -> 'seats', '[]'::jsonb),
    'dead', dead,
    'gone', coalesce(st -> 'gone', '[]'::jsonb),
    'round', coalesce((st ->> 'round')::integer, 0)
  );
  done := private.end_game(r.id, false);
  update public.rooms
  set game_state = jsonb_set(game_state, '{lastGame,vampir}', result)
  where id = done.id
  returning * into done;
  return done;
end;
$$;
