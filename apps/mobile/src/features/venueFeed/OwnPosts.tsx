import type { OwnVenuePost } from '@shared/venueFeed.ts';
import { View } from 'react-native';

import { CapIcon } from '@/aura/CapIcon';
import { Btn, Glass, T, useKit } from '@/aura/kit';
import { EmptyState } from '@/components/EmptyState';
import { useLoaderHold } from '@/components/Loader';
import { tr } from '@/i18n/tr';
import { useNow } from '@/lib/useNow';
import { VENUE_FEED_LOOK } from '@/theme/venueFeed';
import { SPACING } from '@/theme/tokens';

import { ageLabel } from './PostRow';
import { useOwnVenuePosts } from './queries';

const ERROR_PICTURE = {
  source: require('../../../assets/riso/error-generic.webp'),
  width: 120,
  height: 98,
  radius: 0,
};

// The own profile's Gönderiler (docs/SPEC_V4.md §4.Y; the owner's call, 21 Kasım): the person's own
// feed posts of the last day, newest first, each under the venue it was written at and its age,
// its words, then its like and reply counts. Only the author sees this page (rule 4: the venue
// goes to nobody else); a post goes from here when it goes from the feed.
export function OwnPosts() {
  const { query, posts } = useOwnVenuePosts(true);
  const now = useNow(60_000);
  const loading = useLoaderHold(query.isPending);
  if (loading) return <EmptyState kind="loading" body={tr.common.loading} compact />;
  if (query.isError && posts.length === 0)
    return (
      // The error's riso picture at the size of the other pictures in a panel (owner, 21 Kasım:
      // the page-size picture stood out here).
      <EmptyState
        kind="empty"
        title={tr.connection.errorTitle}
        body={tr.venueFeed.mineError}
        picture={ERROR_PICTURE}
        compact
        action={{
          label: tr.common.retry,
          onPress: () => void query.refetch(),
          loading: query.isRefetching,
        }}
      />
    );
  if (posts.length === 0)
    return (
      <EmptyState
        icon="compose"
        title={tr.venueFeed.mineEmpty}
        body={tr.venueFeed.mineEmptyNote}
        compact
      />
    );
  return (
    <View style={{ gap: SPACING[3] }} testID="profile-posts">
      {posts.map((p) => (
        <OwnPostCard key={p.id} post={p} now={now} />
      ))}
      {query.hasNextPage ? (
        <View style={{ alignItems: 'center', marginTop: VENUE_FEED_LOOK.foot.top }}>
          <Btn
            sm
            variant="glassy"
            label={tr.venueFeed.older}
            loading={query.isFetchingNextPage}
            onPress={() => void query.fetchNextPage()}
          />
        </View>
      ) : null}
    </View>
  );
}

function OwnPostCard({ post, now }: { post: OwnVenuePost; now: number }) {
  const { c } = useKit();
  const L = VENUE_FEED_LOOK;
  return (
    <Glass pad="pad" style={{ gap: SPACING[2] }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING[1.5] }}>
        <CapIcon name="pin" color={c.muted} size={L.actions.icon} />
        <View style={{ flexShrink: 1 }}>
          <T v="fine" strong ink>
            {post.venueName}
          </T>
        </View>
        <T v="fine">{`· ${ageLabel(post.createdAt, now)}`}</T>
      </View>
      <T v="body" ink>
        {post.body}
      </T>
      <View style={{ flexDirection: 'row', gap: L.actions.gap }}>
        <Count icon="heart" n={post.likes} label={tr.venueFeed.likeCount(post.likes)} />
        <Count icon="reply" n={post.replies} label={tr.venueFeed.mineReplies(post.replies)} />
      </View>
    </Glass>
  );
}

function Count({ icon, n, label }: { icon: 'heart' | 'reply'; n: number; label: string }) {
  const { c } = useKit();
  const L = VENUE_FEED_LOOK;
  return (
    <View
      accessible
      accessibilityLabel={label}
      style={{ flexDirection: 'row', alignItems: 'center', gap: L.actions.iconGap }}
    >
      <CapIcon name={icon} color={c.muted} size={L.actions.icon} />
      <T v="fine">{String(n)}</T>
    </View>
  );
}
