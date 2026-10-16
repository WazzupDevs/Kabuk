import { type ErrorBoundaryProps, router } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { launchGuard, markLaunchReady } from '@/features/launch/launchStore';
import { tr } from '@/i18n/tr';
import { reportError } from '@/lib/errorReporting';

// Error boundary of every route group (expo-router `ErrorBoundary` export): a short message
// instead of a white screen, a retry, and a way back home. The error goes to Sentry only.
export function RouteError({ error, retry }: ErrorBoundaryProps) {
  useEffect(() => {
    reportError(error);
    // An error screen is a first screen too: the launch opens onto it, and the system splash goes
    // even when the curtain never got to hand over.
    markLaunchReady();
    launchGuard.release();
  }, [error]);

  return (
    <Screen>
      <View className="flex-1 justify-center gap-3">
        <EmptyState kind="error" title={tr.errorScreen.title} body={tr.errorScreen.body} />
        <Button label={tr.errorScreen.retry} onPress={() => void retry()} />
        <Button
          variant="neutral"
          label={tr.errorScreen.home}
          onPress={() => {
            router.replace('/');
            void retry();
          }}
        />
      </View>
    </Screen>
  );
}
