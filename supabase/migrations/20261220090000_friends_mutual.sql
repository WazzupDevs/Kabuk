-- Ortak arkadaşlar (docs/decisions/yeni-tuval.md → 16 Kasım kararı b; rule 4): on a friend's
-- profile only. Reads, takes no lock. Rows come back only while viewer and target are friends
-- without a block between them; otherwise the answer is empty, the same as for an unknown id or
-- a friend without a common friend. A common friend with a block towards either of the two is
-- left out. Every row is already the viewer's friend, so its public_id is not new to the viewer.
create function public.friends_mutual(viewer uuid, target_public_id uuid)
returns table (
  public_id uuid,
  display_name text,
  photo_path text
)
language sql
stable
security definer
set search_path = ''
as $$
  with target as (
    select p.id from public.profiles p
    where p.public_id = target_public_id
      and p.id <> viewer
      and private.are_friends(viewer, p.id)
      and not private.is_blocked_between(viewer, p.id)
  ),
  mine as (
    select case when f.user_a = viewer then f.user_b else f.user_a end as id
    from public.friendships f
    where viewer in (f.user_a, f.user_b)
  )
  select p.public_id, p.display_name,
         case when p.photo_hidden_at is null then p.photo_path end
  from target t
  join mine m on m.id <> t.id
  join public.profiles p on p.id = m.id
  where private.are_friends(t.id, m.id)
    and not private.is_blocked_between(viewer, m.id)
    and not private.is_blocked_between(t.id, m.id)
  order by p.display_name nulls last, p.public_id;
$$;

revoke all on function public.friends_mutual(uuid, uuid) from public, anon, authenticated;
grant execute on function public.friends_mutual(uuid, uuid) to service_role;
