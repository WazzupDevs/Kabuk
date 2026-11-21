-- Mekan akışı: the author's own posts on the own profile (docs/SPEC_V4.md §4.Y → Gönderilerim; the
-- owner's call, 21 Kasım).
--
-- The caller's own posts (never replies) younger than a day, not deleted, newest first, each with
-- the venue it was written at, its like count and its reply count. Only the author ever reads
-- this: the venue goes to nobody else (rule 4), and nothing here names another account. A post
-- hidden by reports still shows to its author, as in the feed. No check-in is needed: the posts
-- are the caller's own. Read only; no lock (rule 10).

create function public.venue_feed_mine_for(
  target_user_id uuid,
  before timestamptz default null,
  page_size integer default 30
)
returns table (
  id uuid,
  venue_id uuid,
  venue_name text,
  body text,
  created_at timestamptz,
  likes integer,
  replies integer
)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.venue_id, v.name, p.body, p.created_at,
         (select count(*)::integer from public.venue_post_likes l where l.post_id = p.id),
         (select count(*)::integer from public.venue_posts r
          where r.parent_id = p.id
            and r.deleted_at is null
            and (r.hidden_at is null or r.author_user_id = target_user_id)
            and not private.is_blocked_between(target_user_id, r.author_user_id)
            and not exists (
              select 1 from public.venue_chat_mutes mu
              where mu.user_id = target_user_id and mu.muted_user_id = r.author_user_id
                and mu.profiled
            ))
  from public.venue_posts p
  join public.venues v on v.id = p.venue_id
  where p.author_user_id = target_user_id
    and p.parent_id is null
    and (before is null or p.created_at < before)
    and p.created_at > now() - interval '24 hours'
    and p.deleted_at is null
  order by p.created_at desc
  limit least(greatest(page_size, 1), 100);
$$;

create index venue_posts_author_idx on public.venue_posts (author_user_id, created_at desc);

revoke all on function public.venue_feed_mine_for(uuid, timestamptz, integer)
  from public, anon, authenticated;
grant execute on function public.venue_feed_mine_for(uuid, timestamptz, integer) to service_role;
