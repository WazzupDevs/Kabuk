import { router, useFocusEffect } from 'expo-router';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  BackHandler,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { tr } from '@/i18n/tr';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { withAlpha } from '@/theme/contrast';
import { EASE_OUT } from '@/theme/markMotion';
import { useTheme } from '@/theme/ThemeProvider';
import { OPACITY, SPACING } from '@/theme/tokens';

import { Quiet } from './Quiet';
import { useSheetDrag } from './sheetDrag';
import { Text } from './Text';

// A route drawn as a bottom sheet over the screen it opened from (skall tuvali: Ayarlar,
// Bildirimler, mekana giriş and "Neredesin?" are sheets; the owner's decision, 27 Ekim). The route
// is a transparent modal ((app)/_layout.tsx → SHEET); the screen under it stays as it was. The
// sheet slides in like Sheet (the same 320 ms ease-out); a tap on the scrim, Android's back button
// useCloseSheet() and a pull down slide it out, then the route pops. Being part of the route, a screen pushed
// from it opens on top of it, unlike a Modal.
const SLIDE_MS = 320;
const HANDLE = { width: 40, height: 5 } as const;

const CloseContext = createContext<() => void>(() => undefined);

export function useCloseSheet(): () => void {
  return useContext(CloseContext);
}

export function RouteSheet({
  title,
  children,
  testID,
}: {
  title?: string;
  children: ReactNode;
  testID?: string;
}) {
  const { colors, shape } = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const reduce = useReduceMotion();
  const [progress] = useState(() => new Animated.Value(0));
  const closing = useRef(false);

  useEffect(() => {
    const anim = Animated.timing(progress, {
      toValue: 1,
      duration: reduce ? 0 : SLIDE_MS,
      easing: (u) => EASE_OUT(u),
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [progress, reduce]);

  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    Animated.timing(progress, {
      toValue: 0,
      duration: reduce ? 0 : SLIDE_MS,
      easing: (u) => EASE_OUT(u),
      useNativeDriver: true,
    }).start(() => {
      if (router.canGoBack()) router.back();
      else router.replace('/explore');
    });
  }, [progress, reduce]);

  // Pulled down, it closes (useSheetDrag).
  const drag = useSheetDrag(close);

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        close();
        return true;
      });
      return () => sub.remove();
    }, [close]),
  );

  return (
    <CloseContext.Provider value={close}>
      <View style={StyleSheet.absoluteFill}>
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: withAlpha(colors.scrim, OPACITY.scrim), opacity: progress },
          ]}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={tr.common.close}
          onPress={close}
          style={StyleSheet.absoluteFill}
        />
        <View className="flex-1 justify-end" pointerEvents="box-none">
          <Animated.View
            testID={testID}
            accessibilityViewIsModal
            style={{
              backgroundColor: colors.surface,
              borderTopLeftRadius: shape.radius.xl,
              borderTopRightRadius: shape.radius.xl,
              boxShadow: shape.shadow.sheet,
              paddingTop: SPACING[2.5],
              paddingHorizontal: SPACING[5],
              paddingBottom: SPACING[6] + insets.bottom,
              maxHeight: '90%',
              transform: [
                {
                  translateY: Animated.add(
                    progress.interpolate({ inputRange: [0, 1], outputRange: [height, 0] }),
                    drag.offset,
                  ),
                },
              ],
            }}
            {...drag.handlers}
          >
            <View
              className="mb-2 self-center"
              style={{
                width: HANDLE.width,
                height: HANDLE.height,
                borderRadius: shape.radius.pill,
                backgroundColor: colors.divider,
              }}
            />
            <ScrollView
              bounces={false}
              keyboardShouldPersistTaps="handled"
              onScroll={drag.onScroll}
              scrollEventThrottle={16}
            >
              <Quiet value>
                {title ? (
                  <Text variant="title" accessibilityRole="header">
                    {title}
                  </Text>
                ) : null}
                {/* skall tuvali (skall.css → `.sheet`): 12 between the title and every block. */}
                <View style={{ gap: SPACING[3], marginTop: title ? SPACING[3] : 0 }}>
                  {children}
                </View>
              </Quiet>
            </ScrollView>
          </Animated.View>
        </View>
      </View>
    </CloseContext.Provider>
  );
}
