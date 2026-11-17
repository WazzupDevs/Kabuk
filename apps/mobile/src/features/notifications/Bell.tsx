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
  // Yeni arayüz tuvali, Main (`.round.soft`, `.nd`): the soft round 44; something unseen, a pink dot
  // 9 in a ring of the ground (the count is read out).
  return (
    <Round
      side={KIT.size.round}
      icon="bell"
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
