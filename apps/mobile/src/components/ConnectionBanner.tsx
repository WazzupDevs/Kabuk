import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { View } from 'react-native';
import Reanimated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { tr } from '@/i18n/tr';
import { probeConnection } from '@/lib/api';
import { noteSuccess, useConnection } from '@/lib/connection';
import { useTheme } from '@/theme/ThemeProvider';
import { ICON, SPACING } from '@/theme/tokens';

import { Text } from './Text';
import { AppIcon } from './AppIcon';
import { useLabOff } from '@/lib/drawLab';
import { boxShadowParts } from './NativeShadow';

const CHECK_MS = 4000;

// "Bağlantı yok" (skall tuvali, Haller): at the top over any screen while the server cannot be
// reached; it checks again every few seconds and, back online, fetches the screen's lists again
// ("Tekrar bağlanınca liste kendiliğinden güncellenir"). It takes no touches.
export function ConnectionBanner() {
  const { colors, shape } = useTheme();
  // Its soft shadow natively (NativeShadow.tsx): the banner slides in.
  const shadowOff = useLabOff('golge');
  const shadow = boxShadowParts(shadowOff, shape.shadow.sheet, shape.radius.lg);
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
      entering={FadeInUp}
      exiting={FadeOutUp}
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      testID="connection-banner"
      style={{
        position: 'absolute',
        left: shape.screenPadding,
        right: shape.screenPadding,
        top: insets.top + SPACING[2],
      }}
    >
      <View
        className="flex-row items-start"
        style={{
          gap: SPACING[3],
          padding: SPACING[4],
          borderRadius: shape.radius.lg,
          backgroundColor: colors.warnSoft,
          boxShadow: shadow.boxShadow,
        }}
      >
        {shadow.node}
        <AppIcon name="alert" size={ICON.md} color={colors.onWarnSoft} />
        <View className="flex-1 gap-0.5">
          <Text variant="label" tone="onWarnSoft">
            {tr.connection.offlineTitle}
          </Text>
          <Text variant="fine" tone="onWarnSoft">
            {tr.connection.offlineBody}
          </Text>
        </View>
      </View>
    </Reanimated.View>
  );
}
