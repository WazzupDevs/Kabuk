import { Stack } from 'expo-router';

import { usePushNavigation } from '@/features/push/push';
import { IncomingRequestHost } from '@/features/rooms/IncomingRequest';

export { RouteError as ErrorBoundary } from '@/components/RouteError';

export const unstable_settings = { initialRouteName: '(tabs)' };

export default function GroupLayout() {
  usePushNavigation();
  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      {/* A request to the table opens over any screen (docs/SPEC_V3.md §23.C). */}
      <IncomingRequestHost />
    </>
  );
}
