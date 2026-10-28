import { router } from 'expo-router';

import { Round } from '@/aura/kit';
import { useUnseenCount } from '@/features/friends/queries';
import { tr } from '@/i18n/tr';

// The bell at the top right of each tab's root screen (docs/SPEC_V3.md §18.3): the count is the
// requests waiting for the caller (play history and venue chat); it opens Bildirimler. Not shown
// in a DM, a room, the venue chat or the check-in flow (none of them is a tab root).
export function NotificationsBell() {
  const count = useUnseenCount();
  // docs/design/aura → Mesajlar: a round glass button, the count as a pink badge.
  return (
    <Round
      icon="bell"
      label={count > 0 ? tr.notifications.withCount(count) : tr.notifications.title}
      badge={count}
      onPress={() => router.push('/notifications')}
      testID="bell"
    />
  );
}
