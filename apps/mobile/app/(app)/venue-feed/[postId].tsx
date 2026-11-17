import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { Btn, T } from '@/aura/kit';
import { Banner } from '@/components/Banner';
import { EmptyState } from '@/components/EmptyState';
import { Loader, useLoaderHold } from '@/components/Loader';
import { SettingsPage } from '@/features/settings/SettingsParts';
import { PostRow } from '@/features/venueFeed/PostRow';
import { useVenueFeed, useVenueFeedLive, useVenueFeedReplies } from '@/features/venueFeed/queries';
import { usePostActions } from '@/features/venueFeed/usePostActions';
import { WriteField } from '@/features/venueFeed/WriteField';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { useNow } from '@/lib/useNow';
import { SPACING } from '@/theme/tokens';
import { VENUE_FEED_LOOK } from '@/theme/venueFeed';

// A post and its replies (docs/SPEC_V4.md §4.Y; the boards do not draw it: the feed's own row and
// the kit's page). The post as the feed shows it, the field to reply from, then the replies newest
// first, a page at a time. One level: a reply has no replies of its own. The list is read again on
// the venue's `venue_post` broadcast like the feed.
export default function VenueFeedRepliesScreen() {
  const { postId, venueId } = useLocalSearchParams<{ postId: string; venueId: string }>();
  const feed = useVenueFeed(venueId);
  const replies = useVenueFeedReplies(postId);
  useVenueFeedLive(venueId, postId);
  const now = useNow(30_000);
  const actions = usePostActions();
  const L = VENUE_FEED_LOOK;
  const parent = feed.posts.find((p) => p.id === postId);
  const loading = useLoaderHold(feed.query.isPending || replies.query.isPending);
  const gone = !feed.query.isPending && !feed.query.isError && !parent;

  const reply = () =>
    router.push({
      pathname: '/venue-feed/compose',
      params: { venueId, replyTo: postId, replyName: parent?.displayName ?? '' },
    });

  return (
    <SettingsPage list title={tr.venueFeed.repliesTitle}>
      {loading ? (
        <View className="items-center" style={{ paddingVertical: SPACING[8] }}>
          <Loader />
        </View>
      ) : gone ? (
        <EmptyState inPage body={tr.venueFeed.repliesGone} />
      ) : !parent ? (
        <EmptyState
          kind="error"
          inPage
          body={errorMessage(feed.query.error)}
          action={{ label: tr.common.retry, onPress: () => void feed.query.refetch() }}
        />
      ) : (
        <View>
          <PostRow
            post={parent}
            now={now}
            first
            onLike={actions.onLike}
            onDelete={actions.onDelete}
            onReport={actions.onReport}
            onMute={actions.onMute}
          />
          <WriteField
            testID="venue-feed-reply-field"
            label={tr.venueFeed.repliesFieldLabel}
            placeholder={tr.venueFeed.repliesField}
            onPress={reply}
          />
          {actions.note ? (
            <View style={{ marginTop: L.note.top }}>
              <Banner tone="info" body={actions.note} testID="venue-feed-note" />
            </View>
          ) : null}
          <View style={{ marginTop: L.listTop }}>
            {replies.query.isError && replies.posts.length === 0 ? (
              <EmptyState
                kind="error"
                inPage
                body={errorMessage(replies.query.error)}
                action={{ label: tr.common.retry, onPress: () => void replies.query.refetch() }}
              />
            ) : replies.posts.length === 0 ? (
              <View style={{ marginTop: L.foot.top }}>
                <T v="fine">{tr.venueFeed.repliesEmpty}</T>
              </View>
            ) : (
              replies.posts.map((post, i) => (
                <PostRow
                  key={post.id}
                  reply
                  post={post}
                  now={now}
                  first={i === 0}
                  onLike={actions.onLike}
                  onDelete={actions.onDelete}
                  onReport={actions.onReport}
                  onMute={actions.onMute}
                />
              ))
            )}
            {replies.posts.length > 0 && replies.query.hasNextPage ? (
              <View style={{ marginTop: L.foot.top, alignItems: 'center' }}>
                <Btn
                  sm
                  variant="glassy"
                  testID="venue-feed-older"
                  label={replies.query.isFetchNextPageError ? tr.common.retry : tr.venueFeed.older}
                  loading={replies.query.isFetchingNextPage}
                  onPress={() => void replies.query.fetchNextPage()}
                />
              </View>
            ) : null}
          </View>
        </View>
      )}
      {actions.sheet}
    </SettingsPage>
  );
}
