import '../global.css';

import { needsOnboarding } from '@shared/consent.ts';
import { QueryClientProvider } from '@tanstack/react-query';
import { SplashScreen, Stack } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { Loader } from '@/components/Loader';
import { useProfile } from '@/features/account/useProfile';
import { startSessionSync, useSessionStore } from '@/features/auth/session';
import { LaunchCurtain } from '@/features/launch/LaunchCurtain';
import { markLaunchReady } from '@/features/launch/launchStore';
import { useOnboardingStore } from '@/features/onboarding/store';
import { configureNotifications } from '@/features/push/push';
import { UpdateRequired } from '@/features/update/UpdateRequired';
import { useUpdateGate, watchUpdateGate } from '@/features/update/updateGate';
import { pingUpdateGate } from '@/lib/api';
import { initErrorReporting } from '@/lib/errorReporting';
import { queryClient } from '@/lib/queryClient';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { useStackOptions } from '@/lib/stackOptions';

export { RouteError as ErrorBoundary } from '@/components/RouteError';

initErrorReporting();
// The launch curtain hands over from the system splash on its first frame (LaunchCurtain); whatever
// the curtain does, the system splash goes at the latest after 3 s (launchGuard).
void SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  // Sign-in, onboarding and the app replace each other with a fade, on the canvas.
  const stackOptions = { ...useStackOptions(), animation: 'fade' } as const;
  const updateRequired = useUpdateGate((s) => s.required);
  const initialized = useSessionStore((s) => s.initialized);
  const signedIn = useSessionStore((s) => s.session !== null);
  const profile = useProfile();
  const extrasPending = useOnboardingStore((s) => s.extrasPending);
  const loading = !initialized || (signedIn && profile.isPending);

  // The first screen is there: the launch opens onto it.
  useEffect(() => {
    if (updateRequired || !loading) markLaunchReady();
  }, [updateRequired, loading]);

  if (updateRequired) return <UpdateRequired />;

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-canvas">
        <Loader />
      </View>
    );
  }

  // Consents, a display name, a birth date and the gender (docs/SPEC_V3.md §3, §23.D), then the
  // optional photo step.
  const onboarded =
    signedIn && profile.isSuccess && !needsOnboarding(profile.data) && !extrasPending;

  return (
    <Stack screenOptions={stackOptions}>
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={signedIn && !onboarded}>
        <Stack.Screen name="(onboarding)" />
      </Stack.Protected>
      <Stack.Protected guard={onboarded}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    startSessionSync();
    configureNotifications();
    return watchUpdateGate(pingUpdateGate);
  }, []);

  // Gestures (react-native-gesture-handler) work only under its root view: it wraps the whole app.
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <LaunchCurtain>
          <ThemeProvider>
            <RootNavigator />
          </ThemeProvider>
        </LaunchCurtain>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
