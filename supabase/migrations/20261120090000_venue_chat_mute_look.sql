-- Aura v71 P4 (docs/decisions/aura-v71-eklenen.md, karar 1): "Sessize alınanlar" draws a muted
-- anonymous identity with its capsule and nick. A mute keeps the look its message was written with
-- (the label is kept the same way); a profiled mute has none. Only the muter's own list carries
-- it, with no account id and no profile id (rule 4); the muter already saw this look on the message.
--
-- Locks (rule 10): no new path; venue_chat_mute writes the same row as before.

alter table public.venue_chat_mutes
  add column look text check (char_length(look) between 1 and 200),
  add constraint venue_chat_mutes_profiled_no_look check (not profiled or look is null);

-- Mutes from before this: the anonymous identity's latest look in the venue chat.
update public.venue_chat_mutes vm
set look = (
  select m.sender_look from public.venue_chat_messages m
  where m.sender_user_id = vm.muted_user_id and not m.profiled and m.sender_look is not null
  order by m.created_at desc, m.id desc
  limit 1
)
where not vm.profiled;

create or replace function public.venue_chat_mute(target_user_id uuid, target_message_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  m public.venue_chat_messages;
  mute_id uuid;
begin
  m := private.visible_venue_chat_message(target_user_id, target_message_id);
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

-- venue-chat/mutes: the label, the anonymous look and the date, newest first; no account id.
drop function public.venue_chat_mutes_of(uuid);
create function public.venue_chat_mutes_of(target_user_id uuid)
returns table (id uuid, label text, profiled boolean, look text, created_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select id, label, profiled, case when profiled then null else look end, created_at
  from public.venue_chat_mutes
  where user_id = target_user_id
  order by created_at desc, id;
$$;

revoke all on function public.venue_chat_mutes_of(uuid) from public, anon, authenticated;
grant execute on function public.venue_chat_mutes_of(uuid) to service_role;
