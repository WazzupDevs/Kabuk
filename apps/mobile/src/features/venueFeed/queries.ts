import { venueChatChannel } from '@shared/venueChat.ts';
import { VENUE_FEED_BROADCAST, type VenuePost } from '@shared/venueFeed.ts';
import {
  type InfiniteData,
  type QueryClient,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';

import { useBroadcast } from '@/features/rooms/useBroadcast';
import { profileApi, venueFeedApi } from '@/lib/api';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { stablePhoto } from '@/lib/photoUrls';

import { mapPost, nextBefore, throttleCalls, withLike } from './feedLogic';

export const venueFeedKeys = {
  all: ['venueFeed'] as const,
  mine: ['venueFeed', 'mine'] as const,
  page: (venueId: string) => ['venueFeed', venueId] as const,
  replies: (postId: string) => ['venueFeedReplies', postId] as const,
  repliesAll: ['venueFeedReplies'] as const,
  profile: (postId: string) => ['venueFeedProfile', postId] as const,
};

// The author of a post, opened through it: a profile view without public_id; `not_found` (the post
// gone, the venue left, a block) is the screen's "not visible".
export function useVenueFeedProfile(postId: string | undefined) {
  return useQuery({
    queryKey: venueFeedKeys.profile(postId ?? ''),
    enabled: !!postId,
    retry: false,
    queryFn: () => profileApi.getFromVenuePost(postId ?? ''),
  });
}

// The caller's own posts younger than a day (the own profile's Gönderiler, §4.Y), newest first, a
// page at a time; under `all`, so whatever refreshes the feed refreshes them too.
export function useOwnVenuePosts(enabled: boolean) {
  const query = useInfiniteQuery({
    queryKey: venueFeedKeys.mine,
    enabled,
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) => (await venueFeedApi.mine(pageParam)).posts,
    getNextPageParam: (last) => nextBefore(last),
  });
  const posts = useMemo(() => query.data?.pages.flat() ?? [], [query.data]);
  return { query, posts };
}

type FeedPages = InfiniteData<VenuePost[], string | undefined>;

// The photos of a page signed by the function keep the URL they were first shown with.
function shown(posts: VenuePost[]): VenuePost[] {
  return posts.map((p) => ({ ...p, photoUrl: stablePhoto(p.photoUrl) }));
}

// The venue's feed, newest first, a page at a time (older ones on `fetchNextPage`); empty without a
// live check-in at the venue.
export function useVenueFeed(venueId: string | undefined) {
  const query = useInfiniteQuery({
    queryKey: venueFeedKeys.page(venueId ?? ''),
    enabled: venueId !== undefined,
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) =>
      shown((await venueFeedApi.page(venueId ?? '', pageParam)).posts),
    getNextPageParam: (last) => nextBefore(last),
  });
  const posts = useMemo(() => query.data?.pages.flat() ?? [], [query.data]);
  return { query, posts };
}

// The replies of a post, newest first, a page at a time.
export function useVenueFeedReplies(postId: string | undefined) {
  const query = useInfiniteQuery({
    queryKey: venueFeedKeys.replies(postId ?? ''),
    enabled: postId !== undefined,
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) =>
      shown((await venueFeedApi.replies(postId ?? '', pageParam)).posts),
    getNextPageParam: (last) => nextBefore(last),
  });
  const posts = useMemo(() => query.data?.pages.flat() ?? [], [query.data]);
  return { query, posts };
}

// The venue chat's topic carries the feed's data-free `venue_post` too (a post, a reply, a like, a
// delete, a hide): the page, and the replies open on the screen, are read again. Every like is a
// broadcast the whole venue hears, so the reads are one per second at most. The subscribing itself
// reads once as well (useBroadcast: nothing sent while the channel was down is replayed).
const REREAD_MS = 1000;

export function useVenueFeedLive(venueId: string | undefined, postId?: string) {
  const queryClient = useQueryClient();
  const throttle = useMemo(
    () =>
      throttleCalls(() => {
        if (venueId) void queryClient.invalidateQueries({ queryKey: venueFeedKeys.page(venueId) });
        if (postId) void queryClient.invalidateQueries({ queryKey: venueFeedKeys.replies(postId) });
      }, REREAD_MS),
    [queryClient, venueId, postId],
  );
  useEffect(() => () => throttle.cancel(), [throttle]);
  useBroadcast(venueId ? venueChatChannel(venueId) : null, VENUE_FEED_BROADCAST, throttle.call);
}

// A post (or reply) changed on every list that shows it: the venue's page and the open replies.
function patchEverywhere(
  queryClient: QueryClient,
  postId: string,
  change: (post: VenuePost) => VenuePost,
) {
  const patch = (old: FeedPages | undefined) =>
    old ? { ...old, pages: old.pages.map((page) => mapPost(page, postId, change)) } : old;
  queryClient.setQueriesData<FeedPages>({ queryKey: venueFeedKeys.all }, patch);
  queryClient.setQueriesData<FeedPages>({ queryKey: venueFeedKeys.repliesAll }, patch);
}

// "Beğen": shown at once, taken back when the server refuses (the limit: 10 changes in 10 seconds).
// One call at a time, so a quick press and its takeback reach the server in order.
export function useFeedLike() {
  const queryClient = useQueryClient();
  return useMutation({
    meta: FEEL_ERROR,
    scope: { id: 'venueFeedLike' },
    mutationFn: ({ postId, liked }: { postId: string; liked: boolean }) =>
      liked ? venueFeedApi.like(postId) : venueFeedApi.unlike(postId),
    onMutate: ({ postId, liked }) => {
      patchEverywhere(queryClient, postId, (p) => withLike(p, liked));
    },
    onError: (_err, { postId, liked }) => {
      patchEverywhere(queryClient, postId, (p) => withLike(p, !liked));
    },
  });
}

// "Sil" on one's own post or reply: gone for everyone; the lists read again.
export function useFeedDelete(onDone: () => void) {
  const queryClient = useQueryClient();
  return useMutation({
    meta: FEEL_ERROR,
    mutationFn: (postId: string) => venueFeedApi.remove(postId),
    onSuccess: () => {
      onDone();
      void queryClient.invalidateQueries({ queryKey: venueFeedKeys.all });
      void queryClient.invalidateQueries({ queryKey: venueFeedKeys.repliesAll });
    },
  });
}
