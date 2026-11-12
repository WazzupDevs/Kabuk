import { router } from 'expo-router';

import { Round, useKit } from '@/aura/kit';
import { useUnseenCount } from '@/features/friends/queries';
import { tr } from '@/i18n/tr';
import { KIT } from '@/theme/auraKit';
import { MESSAGES } from '@/theme/messages';

// The bell at the top right of each tab's root screen (docs/SPEC_V3.md §18.3): the count is the
// requests waiting for the caller (play history and venue chat); it opens Bildirimler. Not shown
// in a DM, a room, the venue chat or the check-in flow (none of them is a tab root).
export function NotificationsBell() {
  const count = useUnseenCount();
  const { scheme } = useKit();
  const b = MESSAGES.bell;
  // iskelet.md → 2.1 and 5.4: a top bar's clear glass round (46); something unseen, a pink dot (the
  // count is read out). tuval Mesajlar: the icon 21, the dot 10 in a white ring.
  return (
    <Round
      glass="clear"
      side={KIT.size.topBtn}
      icon="bell"
      iconSize={b.icon}
      label={count > 0 ? tr.notifications.withCount(count) : tr.notifications.title}
      dot={count > 0}
      dotLook={{
        side: b.dot,
        top: b.dotTop,
        right: b.dotRight,
        ring: b.dotRing,
        color: MESSAGES[scheme].dot,
        ringColor: MESSAGES[scheme].dotRing,
      }}
      onPress={() => router.push('/notifications')}
      testID="bell"
    />
  );
}
