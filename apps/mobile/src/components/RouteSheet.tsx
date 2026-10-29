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
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { InSheet, T, useKit } from '@/aura/kit';
import { Peek, type PeekKind } from '@/aura/Peek';
import { tr } from '@/i18n/tr';
import { KIT } from '@/theme/auraKit';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { EASE_OUT } from '@/theme/markMotion';

import { Quiet } from './Quiet';
import { SheetCard } from './SheetCard';
import { useSheetDrag } from './sheetDrag';

// A route drawn as a bottom sheet over the screen it opened from (skall tuvali: Ayarlar,
// Bildirimler, mekana giriş and "Neredesin?" are sheets; the owner's decision, 27 Ekim). The route
// is a transparent modal ((app)/_layout.tsx → SHEET); the screen under it stays as it was. The
// sheet slides in like Sheet (the same 320 ms ease-out); a tap on the scrim, Android's back button
// useCloseSheet() and a pull down slide it out, then the route pops. Being part of the route, a screen pushed
// from it opens on top of it, unlike a Modal.
const SLIDE_MS = 320;

const CloseContext = createContext<() => void>(() => undefined);

export function useCloseSheet(): () => void {
  return useContext(CloseContext);
}

export function RouteSheet({
  title,
  children,
  testID,
  peek,
}: {
  title?: string;
  children: ReactNode;
  testID?: string;
  // Buddies looking over the sheet's top edge (docs/design/aura → CheckIn, Bildirimler).
  peek?: PeekKind;
}) {
  const k = useKit();
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
          style={[StyleSheet.absoluteFill, { backgroundColor: k.c.scrim, opacity: progress }]}
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
            // docs/design/aura (`.sheet`): a frosted card floating 10 from the edges, 36 round.
            style={{
              marginHorizontal: KIT.size.sheetInset,
              marginBottom: KIT.size.sheetInset + insets.bottom,
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
            {peek ? <Peek kind={peek} /> : null}
            <SheetCard onScroll={drag.onScroll}>
              <InSheet>
                <Quiet value>
                  {title ? (
                    <T v="title" accessibilityRole="header">
                      {title}
                    </T>
                  ) : null}
                  {/* docs/design/aura (`.sheet`): 14 under the title, 12 between the blocks. */}
                  <View style={{ gap: KIT.size.rowGap, marginTop: title ? KIT.size.sheetGap : 0 }}>
                    {children}
                  </View>
                </Quiet>
              </InSheet>
            </SheetCard>
          </Animated.View>
        </View>
      </View>
    </CloseContext.Provider>
  );
}
