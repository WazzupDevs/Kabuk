import { Stack } from 'expo-router';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ConnectionBanner } from '@/components/ConnectionBanner';
import { OverlayHost } from '@/components/OverlayHost';
import { useDistrictLaunchLocate } from '@/features/district/launchLocate';
import { useGiftLogin } from '@/features/gifts/queries';
import { usePushNavigation, useSilentPushRegistration } from '@/features/push/push';
import { IncomingRequestHost } from '@/features/rooms/IncomingRequest';
import { useStackOptions } from '@/lib/stackOptions';
import { MenuHost } from '@/motion/Menu';
import { MenuLayer } from '@/motion/menuLayer';

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
  useSilentPushRegistration();
  useGiftLogin();
  useDistrictLaunchLocate();
  return (
    <View style={{ flex: 1 }}>
      {/* The menus grown from a button draw over everything here, in this window (menuLayer.tsx). */}
      <MenuLayer>
        {/* "Bağlantı yok" over the screens, in the flow: the screens below it get their own safe
          area (a nested provider measures it), so their top buttons move down under the band. */}
        <ConnectionBanner />
        <SafeAreaProvider style={{ flex: 1 }}>
          <Stack screenOptions={stackOptions}>
            {/* Listed first: a group opened by its guard (after sign-up or sign-in, with no address)
            opens on its first listed screen, which was the Ayarlar sheet. Ayarlar is a page now
            (16 Kasım): pushed from the right as every page, its pages on the same stack. */}
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="notifications" options={SHEET} />
            <Stack.Screen name="checkin/index" options={SHEET} />
            <Stack.Screen name="checkin/spot" options={SHEET} />
            <Stack.Screen name="spot" options={SHEET} />
          </Stack>
        </SafeAreaProvider>
        {/* A request to the table opens over any screen (docs/SPEC_V3.md §23.C). */}
        <IncomingRequestHost />
        {/* The menus a screen opens with openMenu (motion/Menu.tsx): drawn here, never in it. */}
        <MenuHost />
      </MenuLayer>
      <OverlayHost />
    </View>
  );
}
