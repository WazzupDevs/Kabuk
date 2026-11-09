-- Canlı öncesi denetim, performans 2 (docs/PROGRESS.md → D4, D7, D8).

-- D4: chat_send writes rooms.last_activity_at at most once a minute.
create or replace function public.chat_send(
  target_user_id uuid,
  target_room_id uuid,
  new_body text,
  min_interval_ms integer,
  reply_to uuid default null
)
returns public.messages
language plpgsql
security definer
set search_path = ''
as $$
declare
  p record;
  seat public.room_members;
  created public.messages;
begin
  select * into p from private.room_phone(target_user_id, target_room_id);
  select * into seat from public.room_members
  where room_id = target_room_id and session_id = p.session_id and left_at is null;

  if reply_to is not null and not exists (
    select 1 from public.messages q
    where q.id = reply_to and q.room_id = target_room_id and q.created_at >= seat.joined_at
  ) then
    raise exception using errcode = 'P0001', message = 'reply_unavailable';
  end if;

  if exists (
    select 1 from public.messages
    where session_id = p.session_id
      and created_at > clock_timestamp() - make_interval(secs => min_interval_ms / 1000.0)
  ) then
    raise exception using errcode = 'P0001', message = 'rate_limited';
  end if;

  insert into public.messages
    (room_id, session_id, sender_alias, body, created_at, reply_to_id, replied)
  values
    (target_room_id, p.session_id, seat.alias, new_body, clock_timestamp(), reply_to,
     reply_to is not null)
  returning * into created;

  -- D4: the table's last activity moves at most once a minute (close_idle_rooms counts in 30
  -- minutes): every rooms write also reaches the table through Postgres Changes.
  update public.rooms set last_activity_at = now()
  where id = target_room_id and last_activity_at < now() - interval '1 minute';
  return created;
end;
$$;

-- D7: the caller's venue chat check-in is looked up once per page, not once per message.
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
  with k as materialized (
    select private.venue_chat_sender_secret() as secret,
           (private.venue_chat_session(target_user_id, target_venue_id)).id as session_id
  )
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
    and k.session_id is not null
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

-- D8: old table chat messages go in batches, from closed rooms only, skipping locked rows (rule 10).
create or replace function private.delete_old_messages()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  n integer;
begin
  delete from public.messages
  where id in (
    -- From the messages (few: they go a day after their table) rather than every closed room.
    select m.id
    from public.messages m
    join public.rooms r on r.id = m.room_id
    where m.created_at <= now() - interval '24 hours'
      and r.status = 'closed' and r.closed_at <= now() - interval '24 hours'
    limit 10000
    for update of m skip locked
  );
  get diagnostics n = row_count;
  return n;
end;
$$;
revoke all on function private.delete_old_messages() from public, anon, authenticated;

create index messages_created_idx on public.messages (created_at);
