import { Stack } from 'expo-router';

import { ConnectionBanner } from '@/components/ConnectionBanner';
import { usePushNavigation } from '@/features/push/push';
import { IncomingRequestHost } from '@/features/rooms/IncomingRequest';
import { useStackOptions } from '@/lib/stackOptions';

export { RouteError as ErrorBoundary } from '@/components/RouteError';

export const unstable_settings = { initialRouteName: '(tabs)' };

// The routes the skall tuvali draws as sheets over the screen they open from (RouteSheet): no
// slide of their own, a see-through ground.
const SHEET = {
  presentation: 'transparentModal',
  animation: 'none',
  contentStyle: { backgroundColor: 'transparent' },
} as const;

export default function GroupLayout() {
  const stackOptions = useStackOptions();
  usePushNavigation();
  return (
    <>
      <Stack screenOptions={stackOptions}>
        {/* Listed first: a group opened by its guard (after sign-up or sign-in, with no address)
            opens on its first listed screen, which was the Ayarlar sheet. */}
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="settings" options={SHEET} />
        <Stack.Screen name="notifications" options={SHEET} />
        <Stack.Screen name="checkin/index" options={SHEET} />
        <Stack.Screen name="spot" options={SHEET} />
      </Stack>
      {/* A request to the table opens over any screen (docs/SPEC_V3.md §23.C). */}
      <IncomingRequestHost />
      <ConnectionBanner />
    </>
  );
}
