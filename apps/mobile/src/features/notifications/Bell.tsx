import { router } from 'expo-router';

import { Round } from '@/aura/kit';
import { useUnseenCount } from '@/features/friends/queries';
import { tr } from '@/i18n/tr';
import { KIT } from '@/theme/auraKit';

// The bell at the top right of each tab's root screen (docs/SPEC_V3.md §18.3): the count is the
// requests waiting for the caller (play history and venue chat); it opens Bildirimler. Not shown
// in a DM, a room, the venue chat or the check-in flow (none of them is a tab root).
export function NotificationsBell() {
  const count = useUnseenCount();
  // iskelet.md → 2.1 and 5.4: a top bar's clear glass round (46); something unseen, a pink dot (the
  // count is read out).
  return (
    <Round
      glass="clear"
      side={KIT.size.topBtn}
      icon="bell"
      label={count > 0 ? tr.notifications.withCount(count) : tr.notifications.title}
      dot={count > 0}
      onPress={() => router.push('/notifications')}
      testID="bell"
    />
  );
}
