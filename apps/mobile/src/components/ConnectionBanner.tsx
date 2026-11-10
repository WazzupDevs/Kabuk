import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { View } from 'react-native';
import Reanimated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { tr } from '@/i18n/tr';
import { probeConnection } from '@/lib/api';
import { noteSuccess, useConnection } from '@/lib/connection';
import { useTheme } from '@/theme/ThemeProvider';
import { ICON, SPACING } from '@/theme/tokens';

import { Text } from './Text';
import { AppIcon } from './AppIcon';

const CHECK_MS = 4000;

// "Bağlantı yok" (skall tuvali, Haller): a band at the top of the app while the server cannot be
// reached. It takes the status bar's place and pushes the screen down under it (the group's
// layout gives the screens the safe area below the band), so it never covers a screen's top
// buttons, its title or the status bar's icons (audit M15-19). It checks again every few seconds
// and, back online, fetches the screen's data again. It takes no touches.
export function ConnectionBanner() {
  const { colors, shape } = useTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const offline = useConnection((s) => s.offline);
  useEffect(() => {
    if (!offline) return undefined;
    let stop = false;
    const timer = setInterval(() => {
      void probeConnection().then((ok) => {
        if (!ok || stop) return;
        noteSuccess();
        void queryClient.refetchQueries({ type: 'active' });
      });
    }, CHECK_MS);
    return () => {
      stop = true;
      clearInterval(timer);
    };
  }, [offline, queryClient]);
  if (!offline) return null;
  return (
    <Reanimated.View
      entering={FadeIn}
      exiting={FadeOut}
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      testID="connection-banner"
      style={{
        backgroundColor: colors.warnSoft,
        paddingTop: insets.top + SPACING[1.5],
        paddingBottom: SPACING[2],
        paddingLeft: shape.screenPadding + insets.left,
        paddingRight: shape.screenPadding + insets.right,
      }}
    >
      <View className="flex-row items-center" style={{ gap: SPACING[2] }}>
        <AppIcon name="alert" size={ICON.sm} color={colors.onWarnSoft} />
        <Text variant="fine" tone="onWarnSoft" className="flex-1">
          <Text variant="label" tone="onWarnSoft">
            {tr.connection.offlineTitle}
          </Text>
          {' · '}
          {tr.connection.offlineBody}
        </Text>
      </View>
    </Reanimated.View>
  );
}
