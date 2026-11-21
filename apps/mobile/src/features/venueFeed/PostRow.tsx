import type { VenuePost } from '@shared/venueFeed.ts';
import { useRef, useState } from 'react';
import { View } from 'react-native';

import { CapIcon } from '@/aura/CapIcon';
import { Av, T, useKit } from '@/aura/kit';
import { tr } from '@/i18n/tr';
import { Menu, type MenuAnchor, MenuItem, measureMenuAnchor, Tap } from '@/motion';
import { KIT } from '@/theme/auraKit';
import { VENUE_FEED_LOOK } from '@/theme/venueFeed';

import { feedAge } from './feedLogic';

export function ageLabel(createdAt: string, now: number): string {
  const age = feedAge(createdAt, now);
  switch (age.unit) {
    case 'now':
      return tr.venueFeed.ageNow;
    case 'minutes':
      return tr.venueFeed.ageMinutes(age.n);
    case 'hours':
      return tr.venueFeed.ageHours(age.n);
    case 'days':
      return tr.venueFeed.ageDays(age.n);
  }
}

// One post of the feed (yeni arayüz tuvali, MekanAkis `.po`): the author's face (the profile photo,
// or the name's first letter), the name and the age on one row with the ⋮ at the right, the words,
// then "Yanıtla" with its count and "Beğen" with its count. A post opens its replies; a reply
// (`reply`) has neither: no replies to a reply. The face and the name open the author's profile
// (`onProfile`, §4.Y; not on one's own post): the feed carries no profile id (rule 4).
export function PostRow({
  post,
  now,
  first,
  reply,
  onOpen,
  onProfile,
  onLike,
  onDelete,
  onReport,
  onMute,
  likeDisabled,
}: {
  post: VenuePost;
  now: number;
  first: boolean;
  // A reply in a post's replies.
  reply?: boolean;
  onOpen?: (post: VenuePost) => void;
  // The author's profile, through the post (not one's own).
  onProfile?: (post: VenuePost) => void;
  onLike: (post: VenuePost) => void;
  onDelete: (post: VenuePost) => void;
  onReport: (post: VenuePost) => void;
  onMute: (post: VenuePost) => void;
  likeDisabled?: boolean;
}) {
  const { c } = useKit();
  const L = VENUE_FEED_LOOK;
  const name = post.displayName ?? tr.venueFeed.someone;
  const moreRef = useRef<View>(null);
  const [anchor, setAnchor] = useState<MenuAnchor | null>(null);
  const [menu, setMenu] = useState(false);
  const openMenu = () =>
    measureMenuAnchor(moreRef.current, (at) => {
      setAnchor(at);
      setMenu(true);
    });
  const openProfile = !!onProfile && !post.fromMe;
  const ink = post.liked ? KIT.pink : c.muted;
  const words = (
    <T v="body" ink style={{ marginTop: L.head.textTop }}>
      {post.body}
    </T>
  );

  return (
    <View
      style={{
        flexDirection: 'row',
        gap: L.post.gap,
        paddingTop: L.post.padTop,
        paddingBottom: L.post.padBottom,
      }}
    >
      {first ? null : (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            left: L.post.hairLeft,
            right: L.post.hairRight,
            height: KIT.size.hair,
            backgroundColor: c.hair,
          }}
        />
      )}
      {openProfile ? (
        <Tap
          testID="venue-feed-face"
          accessibilityLabel={tr.venueFeed.openProfile(name)}
          onPress={() => onProfile?.(post)}
        >
          <Av name={name} photoUrl={post.photoUrl} size="list" />
        </Tap>
      ) : (
        <Av name={name} photoUrl={post.photoUrl} size="list" />
      )}
      <View style={{ flex: 1, minWidth: 0 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: L.head.gap,
            minHeight: L.head.height,
          }}
        >
          <View
            style={{
              flex: 1,
              minWidth: 0,
              flexDirection: 'row',
              flexWrap: 'wrap',
              alignItems: 'center',
              columnGap: L.head.gap,
            }}
          >
            {openProfile ? (
              <Tap
                testID="venue-feed-name"
                sink={false}
                accessibilityLabel={tr.venueFeed.openProfile(name)}
                onPress={() => onProfile?.(post)}
              >
                <T v="body" ink strong>
                  {name}
                </T>
              </Tap>
            ) : (
              <T v="body" ink strong>
                {name}
              </T>
            )}
            <T v="fine">{`· ${ageLabel(post.createdAt, now)}`}</T>
          </View>
          <View ref={moreRef} collapsable={false}>
            <Tap
              testID="venue-feed-more"
              accessibilityLabel={tr.venueFeed.postOptions}
              onPress={openMenu}
              hitSlop={L.head.more / 2}
              style={{
                width: L.head.more,
                height: L.head.more,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CapIcon name="more" color={c.muted} size={L.head.moreIcon} />
            </Tap>
          </View>
        </View>
        {onOpen ? (
          <Tap
            testID="venue-feed-open"
            sink={false}
            accessibilityLabel={`${name}: ${post.body}`}
            onPress={() => onOpen(post)}
          >
            {words}
          </Tap>
        ) : (
          words
        )}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: L.actions.gap,
            marginTop: L.actions.top,
          }}
        >
          {reply || !onOpen ? null : (
            <ActionButton
              testID="venue-feed-reply"
              label={tr.venueFeed.replyCount(post.replies)}
              icon="reply"
              ink={c.muted}
              count={post.replies}
              onPress={() => onOpen(post)}
            />
          )}
          <ActionButton
            testID="venue-feed-like"
            label={post.liked ? tr.venueFeed.unlike : tr.venueFeed.like}
            icon="heart"
            ink={ink}
            count={post.likes}
            selected={post.liked}
            disabled={likeDisabled}
            onPress={() => onLike(post)}
          />
        </View>
      </View>
      {anchor ? (
        <Menu anchor={anchor} visible={menu} onClose={() => setMenu(false)}>
          {post.fromMe ? (
            <MenuItem
              testID="venue-feed-delete"
              cap="trash"
              negative
              label={tr.venueFeed.delete}
              onPress={() => onDelete(post)}
            />
          ) : null}
          {post.fromMe ? null : (
            <MenuItem
              testID="venue-feed-mute"
              cap="mute"
              label={tr.venueFeed.mute}
              onPress={() => onMute(post)}
            />
          )}
          {post.fromMe ? null : (
            <MenuItem
              testID="venue-feed-report"
              cap="report"
              negative
              label={tr.safety.report}
              onPress={() => onReport(post)}
            />
          )}
        </Menu>
      ) : null}
    </View>
  );
}

// "Yanıtla" and "Beğen" (`.pa2 button`): the icon, then the count (none while it is 0).
function ActionButton({
  testID,
  label,
  icon,
  ink,
  count,
  selected,
  disabled,
  onPress,
}: {
  testID: string;
  label: string;
  icon: 'reply' | 'heart';
  ink: string;
  count: number;
  selected?: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  const L = VENUE_FEED_LOOK.actions;
  return (
    <Tap
      testID={testID}
      accessibilityLabel={label}
      accessibilityState={{ selected: !!selected }}
      disabled={disabled}
      hitSlop={L.gap / 2}
      onPress={onPress}
      style={{ flexDirection: 'row', alignItems: 'center', gap: L.iconGap, height: L.height }}
    >
      <CapIcon name={icon} color={ink} second={ink} size={L.icon} />
      {count > 0 ? (
        <T v="fine" strong color={ink} tabular>
          {String(count)}
        </T>
      ) : null}
    </Tap>
  );
}
