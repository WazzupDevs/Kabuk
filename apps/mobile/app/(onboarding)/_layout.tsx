import { Stack } from 'expo-router';
import { View } from 'react-native';

import { OverlayHost } from '@/components/OverlayHost';
import { useStackOptions } from '@/lib/stackOptions';

export { RouteError as ErrorBoundary } from '@/components/RouteError';

export const unstable_settings = { initialRouteName: 'consents' };

export default function GroupLayout() {
  const stackOptions = useStackOptions();
  // No screen is listed here: a listed screen comes first and the group would open on it, not on
  // its initial route (extras.tsx sets its own options).
  // OverlayHost draws `confirm` (the birth date's "Onayla / Düzelt", birth.tsx). The (app) group
  // has its own; the root layout's guards never mount both groups at once, so one host draws it.
  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={stackOptions} />
      <OverlayHost />
    </View>
  );
}
