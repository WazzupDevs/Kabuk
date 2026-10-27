import { Stack } from 'expo-router';

import { usePushNavigation } from '@/features/push/push';
import { IncomingRequestHost } from '@/features/rooms/IncomingRequest';

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
  usePushNavigation();
  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="settings" options={SHEET} />
        <Stack.Screen name="notifications" options={SHEET} />
        <Stack.Screen name="checkin/index" options={SHEET} />
        <Stack.Screen name="spot" options={SHEET} />
      </Stack>
      {/* A request to the table opens over any screen (docs/SPEC_V3.md §23.C). */}
      <IncomingRequestHost />
    </>
  );
}
