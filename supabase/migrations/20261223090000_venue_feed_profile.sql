-- Mekan akışı: the profile behind a post and a friend request from it (docs/SPEC_V4.md §4.Y;
-- docs/decisions/mekan-akisi.md → "Sonraya kalan"; rule 4's feed paragraph, rule 5 and 10).
--
-- As the venue chat's (venue_chat_profile_owner, friends_request_venue_chat): the post must be one
-- the reader may see now (private.visible_venue_post: a live check-in in its feed, younger than a
-- day, not deleted, not hidden, no block either way), every post is profiled, and the profile id
-- never goes. The request is a venue chat request named after the feed's venue (the university's
-- for a campus): the daily limit is the chats' and the feed's together, the press is the pair's
-- one chat press, and every way it is swallowed answers ok (rule 5).
-- Lock order (rule 10): pair lock → friend_presses → friend_requests → friendships; no check-in,
-- post or rate row is locked.

-- The author's account for a post or reply the reader may see, or null. The caller answers
-- not_found for null: no check-in, deleted, hidden, expired, blocked and unknown all look alike.
create function public.venue_post_profile_owner(target_user_id uuid, target_post_id uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select p.author_user_id
  from private.visible_venue_post(target_user_id, target_post_id) p
  where p.id is not null and p.hidden_at is null;
$$;

create function public.friends_request_venue_post(
  target_user_id uuid,
  target_post_id uuid,
  daily_max integer
)
returns table (outcome text, other_user_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  p public.venue_posts;
  reverse_status text;
  sent_today integer;
  venue_name text;
  my_name text;
  their_name text;
  press_id uuid;
  new_id uuid;
begin
  select * into p from private.visible_venue_post(target_user_id, target_post_id);
  if p.id is null or p.hidden_at is not null or p.author_user_id = target_user_id then
    return query select 'ok'::text, null::uuid;
    return;
  end if;
  perform private.lock_pair(target_user_id, p.author_user_id);
  if private.are_friends(target_user_id, p.author_user_id) then
    return query select 'already_friends'::text, null::uuid;
    return;
  end if;

  -- The feed's name (the university's for a campus of one), never the author's campus.
  select coalesce(u.name, v.name) into venue_name
  from public.venues v left join public.universities u on u.id = v.university_id
  where v.id = p.venue_id;
  select display_name into my_name from public.profiles where id = target_user_id;
  select display_name into their_name from public.profiles where id = p.author_user_id;
  press_id := private.friend_press(target_user_id, p.author_user_id, 'venue_chat', null,
                                   their_name, true, venue_name);

  if private.is_blocked_between(target_user_id, p.author_user_id) then
    return query select 'ok'::text, null::uuid;
    return;
  end if;

  perform private.lock_presses(target_user_id, p.author_user_id);
  select status into reverse_status from public.friend_requests
  where from_user_id = p.author_user_id and to_user_id = target_user_id
  for update;
  if reverse_status = 'pending' then
    perform private.make_friends(target_user_id, p.author_user_id, 'request');
    return query select 'friendship_created'::text, p.author_user_id;
    return;
  end if;

  select (select count(*) from public.friend_requests
          where from_user_id = target_user_id and source = 'venue_chat'
            and created_at > now() - interval '1 day')
       + (select count(*) from public.friend_presses
          where from_user_id = target_user_id and source <> 'history'
            and withdrawn_at > now() - interval '1 day')
  into sent_today;
  if sent_today >= daily_max
     or private.friend_withdrawn_today(target_user_id, p.author_user_id) then
    return query select 'ok'::text, null::uuid;
    return;
  end if;

  insert into public.friend_requests (from_user_id, to_user_id, source, venue_chat_context)
  values (target_user_id, p.author_user_id, 'venue_chat',
          jsonb_build_object('venueName', venue_name, 'fromName', my_name, 'toName', their_name))
  on conflict (from_user_id, to_user_id) do nothing
  returning id into new_id;
  if new_id is null then
    return query select 'ok'::text, null::uuid;
    return;
  end if;
  update public.friend_presses set requested_at = now() where id = press_id;
  return query select 'request_created'::text, p.author_user_id;
end;
$$;

revoke all on function public.venue_post_profile_owner(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.venue_post_profile_owner(uuid, uuid) to service_role;
revoke all on function public.friends_request_venue_post(uuid, uuid, integer)
  from public, anon, authenticated;
grant execute on function public.friends_request_venue_post(uuid, uuid, integer) to service_role;
