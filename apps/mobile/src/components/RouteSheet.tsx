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
import { Animated, BackHandler, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { InSheet, T } from '@/aura/kit';
import { Peek, type PeekKind } from '@/aura/Peek';
import { tr } from '@/i18n/tr';
import { useSheetFrost, useSheetMotion } from '@/motion/useSheetMotion';
import { KIT, type KitTextVariant } from '@/theme/auraKit';
import { peekShown, SHEET_MAX } from '@/lib/sheetFit';

import { Quiet } from './Quiet';
import { SheetCard, type SheetLook } from './SheetCard';
import { SheetScrim } from './SheetScrim';
import { ScreenStatusBar, StatusScrim } from './StatusScrim';

// A route drawn as a bottom sheet over the screen it opened from (skall tuvali: Ayarlar,
// Bildirimler, mekana giriş and "Neredesin?" are sheets; the owner's decision, 27 Ekim). The route
// is a transparent modal ((app)/_layout.tsx → SHEET); the screen under it stays as it was. The
// sheet moves like Sheet (iskelet.md → 3.5: in on springs.sheet, out down off the screen;
// useSheetMotion); a tap on the scrim, Android's back button, useCloseSheet(), its close button and
// a pull down slide it out, then the route pops. Being part of the route, a screen pushed from it
// opens on top of it, unlike a Modal.
const CloseContext = createContext<() => void>(() => undefined);

export function useCloseSheet(): () => void {
  return useContext(CloseContext);
}

export function RouteSheet({
  title,
  children,
  testID,
  peek,
  footer,
  look,
  titleType = 'title',
}: {
  title?: string;
  children: ReactNode;
  testID?: string;
  // Buddies looking over the sheet's top edge (docs/design/aura → CheckIn, Bildirimler).
  peek?: PeekKind;
  // Buttons that stay at the sheet's foot while the rest scrolls (Check-in, aura v37: SheetCard →
  // footer). With them the buddies are scaled to the sheet and go once it stands at its tallest.
  footer?: ReactNode;
  // A board's own sheet (SheetCard → look) and its title's type (tuval Mesajlar: 22/800).
  look?: SheetLook;
  titleType?: KitTextVariant;
}) {
  const insets = useSafeAreaInsets();
  const motion = useSheetMotion();
  const frost = useSheetFrost();
  const closing = useRef(false);
  const [area, setArea] = useState(0);
  const [sheetH, setSheetH] = useState(0);
  const showPeek = !!peek && (!footer || peekShown(sheetH, area));
  const { show, hide, reduce } = motion;

  useEffect(() => {
    const anim = show(reduce);
    anim.start();
    return () => anim.stop();
  }, [show, reduce]);

  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    hide(reduce).start(() => {
      if (router.canGoBack()) router.back();
      else router.replace('/explore');
    });
  }, [hide, reduce]);

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
        <SheetScrim opacity={motion.scrim} glass={frost} />
        {/* The status bar over the scrim: a fade and light icons; the light scheme's dark ones were
            lost on it (audit M15-12). */}
        <StatusScrim opacity={motion.scrim} />
        <ScreenStatusBar style="light" />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={tr.common.close}
          onPress={close}
          style={StyleSheet.absoluteFill}
        />
        <View
          className="flex-1 justify-end"
          pointerEvents="box-none"
          onLayout={footer ? (e) => setArea(e.nativeEvent.layout.height) : undefined}
        >
          <Animated.View
            testID={testID}
            onLayout={footer ? (e) => setSheetH(e.nativeEvent.layout.height) : undefined}
            accessibilityViewIsModal
            // iskelet.md → 3.5, down to the screen's foot as Telegram Android's sheets (the owner's
            // call, 30 Ekim). Pulled down, it closes (SheetCard).
            style={{
              maxHeight: `${SHEET_MAX * 100}%`,
              opacity: motion.opacity,
              transform: [{ translateY: motion.translateY }],
            }}
          >
            <SheetCard
              onClose={close}
              bottomInset={insets.bottom}
              above={showPeek && peek ? <Peek kind={peek} fit={!!footer} /> : null}
              head={
                title ? (
                  <T v={titleType} accessibilityRole="header">
                    {title}
                  </T>
                ) : undefined
              }
              frost={frost}
              look={look}
              footer={
                footer ? (
                  <InSheet>
                    <Quiet value>{footer}</Quiet>
                  </InSheet>
                ) : undefined
              }
            >
              <InSheet>
                <Quiet value>
                  {/* docs/design/aura (`.sheet`): 12 between the blocks (14 in a sheet with a
                      footer: CheckInDar). */}
                  <View style={{ gap: footer ? KIT.size.sheetGap : KIT.size.rowGap }}>
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
