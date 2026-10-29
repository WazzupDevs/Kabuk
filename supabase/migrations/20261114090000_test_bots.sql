-- Test bots (the owner's call, 29 Ekim): one phone tries a game alone. On the dev project and the
-- local stack only (the Edge Functions refuse elsewhere, pure/devProject.ts → testBotsAllowed), the
-- owner of a table seats bots at it ("Bot ekle"): accounts that never sign in, each checked in at the
-- owner's venue and spot and seated through the same "Katıl" or "Bu masadayım" and acceptance any
-- person takes. In a game they play by themselves (Vampir Köylü: test_bots_vampir).
--
-- Bots sit anonymously like any other account (gender 'female', the capsule nick): nothing at the
-- table or in any answer says which seats are bots (rule 4).
--
-- Locks (rule 10): seating uses the table's own functions (check-in → tables → people → request);
-- test_bots_vampir locks the bots' check-ins in id order first, then each move takes the table
-- (private.room_phone) as a person's move does. private.test_bots itself is never locked.

-- 1. The bots ----------------------------------------------------------------------------------
create table private.test_bots (
  user_id uuid primary key references auth.users (id) on delete cascade,
  owner_user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index test_bots_owner on private.test_bots (owner_user_id, created_at);

-- Rule 2: RLS on, no policy: only the service role (the Edge Functions) reads and writes it.
alter table private.test_bots enable row level security;
revoke all on table private.test_bots from public, anon, authenticated;

-- A new bot account of `target_owner`'s.
create function public.test_bot_add(target_bot uuid, target_owner uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into private.test_bots (user_id, owner_user_id) values (target_bot, target_owner)
  on conflict (user_id) do nothing;
$$;

-- `target_owner`'s bots, oldest first: the active check-in of each (null: none) and the table it
-- sits at (null: none).
create function public.test_bots_of(target_owner uuid)
returns table (user_id uuid, session_id uuid, room_id uuid)
language sql
stable
security definer
set search_path = ''
as $$
  select tb.user_id, ts.id, private.open_room_of_session(ts.id)
  from private.test_bots tb
  left join public.table_sessions ts
    on ts.user_id = tb.user_id and ts.status = 'active' and ts.expires_at > now()
  where tb.owner_user_id = target_owner
  order by tb.created_at, tb.user_id;
$$;

-- 2. Vampir Köylü ------------------------------------------------------------------------------
-- The bots' moves at a running game, through the game's own actions (each checked as a person's
-- is): on the role card they are ready; at night they choose (the vampires bite the one a fellow
-- vampire already chose, else anyone they may), by day they vote, most of them for the one with the
-- most votes so far. A move that ends the phase lets the bots act in the next one too. Returns how
-- many moves they made. The vampir Edge Function calls it around each call on the dev project.
create function public.test_bots_vampir(target_room_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.rooms;
  st jsonb;
  sec jsonb;
  b record;
  alive uuid[];
  target uuid;
  no integer;
  at_step integer;
  moved boolean;
  moves integer := 0;
begin
  select * into r from public.rooms where id = target_room_id;
  if r.concept is distinct from 'vampir' or not (r.game_state ? 'phase') then
    return 0;
  end if;
  no := private.current_game_no(r.game_state);

  -- Rule 10: the bots' check-ins, in id order, before the table.
  perform 1 from public.table_sessions ts
  where ts.id in (
    select gp.session_id
    from public.game_players gp
    join public.table_sessions s on s.id = gp.session_id
    join private.test_bots tb on tb.user_id = s.user_id
    where gp.room_id = target_room_id and gp.game_no = no and gp.left_at is null
  )
  order by ts.id
  for no key update;

  for pass in 1..6 loop
    moved := false;
    for b in
      select s.user_id, gp.session_id, gp.role
      from public.game_players gp
      join public.table_sessions s on s.id = gp.session_id
      join private.test_bots tb on tb.user_id = s.user_id
      where gp.room_id = target_room_id and gp.game_no = no and gp.left_at is null
      order by gp.seat_order
    loop
      select * into r from public.rooms where id = target_room_id;
      st := r.game_state;
      exit when r.concept is distinct from 'vampir' or not (st ? 'phase')
        or private.current_game_no(st) <> no;
      alive := private.vampir_alive(st);
      continue when not b.session_id = any (alive);
      at_step := (st ->> 'step')::integer;

      if st ->> 'phase' = 'role' then
        continue when coalesce(st -> 'ready', '[]'::jsonb) ? b.session_id::text;
        perform public.vampir_ready(b.user_id, target_room_id, at_step);
        moves := moves + 1;
        moved := true;

      elsif st ->> 'phase' = 'night' then
        sec := private.vampir_secret(target_room_id, st);
        continue when coalesce(sec -> 'picks', '{}'::jsonb) ? b.session_id::text;
        target := null;
        if b.role = 'vampir' then
          select p.tgt::uuid into target
          from jsonb_each_text(coalesce(sec -> 'picks', '{}'::jsonb)) as p (picker, tgt)
          join public.game_players gp
            on gp.room_id = target_room_id and gp.game_no = no
            and gp.session_id::text = p.picker and gp.role = 'vampir'
          limit 1;
        end if;
        if target is null then
          select a.sid into target
          from unnest(alive) as a (sid)
          left join public.game_players gp
            on gp.room_id = target_room_id and gp.game_no = no and gp.session_id = a.sid
          where case b.role
            when 'vampir' then gp.role is distinct from 'vampir'
            when 'doktor' then a.sid::text is distinct from sec ->> 'lastSave'
            else a.sid <> b.session_id
          end
          order by random()
          limit 1;
        end if;
        continue when target is null;
        perform public.vampir_pick(b.user_id, target_room_id, at_step, target);
        moves := moves + 1;
        moved := true;

      elsif st ->> 'phase' = 'vote' then
        continue when coalesce(st -> 'votes', '{}'::jsonb) ? b.session_id::text;
        target := null;
        if random() < 0.6 then
          select v.tgt::uuid into target
          from jsonb_each_text(coalesce(st -> 'votes', '{}'::jsonb)) as v (voter, tgt)
          left join public.game_players gp
            on gp.room_id = target_room_id and gp.game_no = no and gp.session_id::text = v.tgt
          where v.tgt <> b.session_id::text
            and v.tgt::uuid = any (alive)
            and not (b.role = 'vampir' and gp.role is not distinct from 'vampir')
          group by v.tgt
          order by count(*) desc, random()
          limit 1;
        end if;
        if target is null then
          select a.sid into target
          from unnest(alive) as a (sid)
          left join public.game_players gp
            on gp.room_id = target_room_id and gp.game_no = no and gp.session_id = a.sid
          where a.sid <> b.session_id
          order by (b.role = 'vampir' and gp.role is not distinct from 'vampir'), random()
          limit 1;
        end if;
        continue when target is null;
        perform public.vampir_vote(b.user_id, target_room_id, at_step, target);
        moves := moves + 1;
        moved := true;
      end if;
    end loop;
    exit when not moved;
  end loop;
  return moves;
end;
$$;

-- 3. Grants ------------------------------------------------------------------------------------
do $$
declare
  fn text;
begin
  foreach fn in array array[
    'public.test_bot_add(uuid, uuid)',
    'public.test_bots_of(uuid)',
    'public.test_bots_vampir(uuid)'
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated', fn);
    execute format('grant execute on function %s to service_role', fn);
  end loop;
end;
$$;
