import type { VenuePost } from '@shared/venueFeed.ts';
import { router } from 'expo-router';
import { View } from 'react-native';

import { Btn, T } from '@/aura/kit';
import { Banner } from '@/components/Banner';
import { EmptyState } from '@/components/EmptyState';
import { Loader, useLoaderHold } from '@/components/Loader';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { useNow } from '@/lib/useNow';
import { SPACING } from '@/theme/tokens';
import { VENUE_FEED_LOOK } from '@/theme/venueFeed';

import { PostRow } from './PostRow';
import { useVenueFeed, useVenueFeedLive } from './queries';
import { usePostActions } from './usePostActions';
import { WriteField } from './WriteField';

// "Akış" on Mekan (yeni arayüz tuvali, MekanAkis, MekanAkisKaydir; docs/SPEC_V4.md §4.Y): the field
// to write in with its line ("Akışta herkes profiliyle yazar."), then the venue's posts newest
// first. Everyone writes with the profile, whatever the check-in's identity. The page is read
// again on the data-free `venue_post` broadcast (one read a second at most) and each time the view
// opens; the older posts come with "Daha eskiler". Loading, empty and error each have their own.
export function FeedView({ venueId }: { venueId: string }) {
  const { query, posts } = useVenueFeed(venueId);
  useVenueFeedLive(venueId);
  const now = useNow(30_000);
  const actions = usePostActions();
  const L = VENUE_FEED_LOOK;
  const loading = useLoaderHold(query.isPending);

  const write = () => router.push({ pathname: '/venue-feed/compose', params: { venueId } });
  const open = (post: VenuePost) =>
    router.push({ pathname: '/venue-feed/[postId]', params: { postId: post.id, venueId } });

  return (
    <View>
      <WriteField
        testID="venue-feed-field"
        label={tr.venueFeed.fieldLabel}
        placeholder={tr.venueFeed.field}
        onPress={write}
      />
      <View style={{ marginTop: L.note.top, marginLeft: L.note.left }}>
        <T v="fine">{tr.venueFeed.note}</T>
      </View>
      {actions.note ? (
        <View style={{ marginTop: L.note.top }}>
          <Banner tone="info" body={actions.note} testID="venue-feed-note" />
        </View>
      ) : null}
      <View style={{ marginTop: L.listTop }}>
        {loading ? (
          <View className="items-center" style={{ paddingVertical: SPACING[8] }}>
            <Loader />
          </View>
        ) : query.isError && posts.length === 0 ? (
          <EmptyState
            kind="error"
            inPage
            body={errorMessage(query.error)}
            action={{ label: tr.common.retry, onPress: () => void query.refetch() }}
          />
        ) : posts.length === 0 ? (
          <EmptyState inPage title={tr.venueFeed.empty} body={tr.venueFeed.emptyNote} />
        ) : (
          posts.map((post, i) => (
            <PostRow
              key={post.id}
              post={post}
              now={now}
              first={i === 0}
              onOpen={open}
              onLike={actions.onLike}
              onDelete={actions.onDelete}
              onReport={actions.onReport}
              onMute={actions.onMute}
            />
          ))
        )}
        {posts.length > 0 && query.hasNextPage ? (
          <View style={{ marginTop: L.foot.top, alignItems: 'center' }}>
            {query.isFetchNextPageError ? (
              <Btn
                sm
                variant="glassy"
                label={tr.common.retry}
                loading={query.isFetchingNextPage}
                onPress={() => void query.fetchNextPage()}
              />
            ) : (
              <Btn
                sm
                variant="glassy"
                testID="venue-feed-older"
                label={tr.venueFeed.older}
                loading={query.isFetchingNextPage}
                onPress={() => void query.fetchNextPage()}
              />
            )}
          </View>
        ) : null}
        {query.isError && posts.length > 0 && !query.isFetchNextPageError ? (
          <View style={{ marginTop: L.foot.top }}>
            <Banner tone="warn" body={errorMessage(query.error)} />
          </View>
        ) : null}
      </View>
      {actions.sheet}
    </View>
  );
}
