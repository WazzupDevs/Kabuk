import type { ReactNode } from 'react';
import { View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, { type AnimatedRef, useAnimatedRef } from 'react-native-reanimated';

import { Round, useKit } from '@/aura/kit';
import { tr } from '@/i18n/tr';
import { KIT } from '@/theme/auraKit';
import { gradientStyle } from '@/theme/gradient';
import { useLabOff } from '@/lib/drawLab';
import { shadowParts } from './NativeShadow';
import { useSheetDrag } from './sheetDrag';

// A bottom sheet's card (Sheet, RouteSheet; iskelet.md → 3.5): it floats 8 from the screen's sides
// and foot, 28 round at every corner, the flat surface (yeni arayüz tuvali: SikayetEt, Masadakiler;
// KIT.layer: #FFFFFF, in the dark #121614 in a 1 px white ring), its shadow 0 -8 40 at 18 %. Its handle and its title stay put at its top, the 38 close
// button at the title's right; what is under them scrolls, edge to edge inside the card, clipped by
// its own corners, and fades out at the scroll's edges (Android's fading edge: no band of colour,
// only while there is more to scroll). No scroll bar (29 Ekim), no "Tamam" or "Kapat" at its foot.
// Its content ends the bottom safe area and 4 above its foot, so its buttons sit 12 above the safe
// area as everywhere. Pulled down it follows the finger and closes (useSheetDrag); `above` (the
// buddies over its top edge) comes with it. With a `footer` (Check-in, aura v37) the card is two
// parts: the content scrolls above, only when it does not fit; the footer's buttons stay put under
// it. No live glass on it (ortak-temel-plan.md A.11).
export function SheetCard({
  onClose,
  bottomInset,
  above,
  head,
  balance,
  fill,
  footer,
  scrollRef,
  look,
  closeButton = true,
  children,
}: {
  // Unset: it cannot be pulled away and has no close button (the join request).
  onClose?: () => void;
  // The bottom safe area: the content's end stays clear of it.
  bottomInset: number;
  above?: ReactNode;
  // The title that stays put under the handle, the close button at its right.
  head?: ReactNode;
  // A centred title: as much room before it as the close button takes after it.
  balance?: boolean;
  // As tall as the sheet around it (Sheet → `top`), the content stretched to it.
  fill?: boolean;
  // Buttons that stay under the scrolling content.
  footer?: ReactNode;
  // The content's scroll, for a sheet that moves it itself (Kapsülünü süsle's pack chips).
  scrollRef?: AnimatedRef<Animated.ScrollView>;
  // A board's own sheet (tuval Mesajlar's Bildirimler, Dm's block): its ground with no line, its
  // room inside, where its title stands and how far the close button is from the side.
  look?: SheetLook;
  // Pulled down and on the scrim it still closes; false: no close button (the location sheet).
  closeButton?: boolean;
  children: ReactNode;
}) {
  const k = useKit();
  const ownScroller = useAnimatedRef<Animated.ScrollView>();
  const scroller = scrollRef ?? ownScroller;
  const { pan, native, onScroll, style } = useSheetDrag(onClose, scroller);
  // The sheet's soft shadow natively (NativeShadow.tsx): it slides in, and React Native would blur
  // its shadow again on every frame of the slide.
  const shadowOff = useLabOff('golge');
  const layer = KIT.layer[k.scheme];
  const radius = KIT.layer.size.sheetRadius;
  // tuval (every sheet): its shadow rises over the screen, 0 -8 40; in the dark its ring.
  const shadow = shadowParts(shadowOff, layer.sheetShadow, undefined, radius);
  const padX = look?.padX ?? KIT.size.sheetPadX;
  const top = { borderRadius: radius };
  const foot = Math.max(
    KIT.size.sheetPadBottom + bottomInset,
    look?.padBottom ?? KIT.size.sheetPadBottomMin,
  );
  const size = fill ? { flex: 1 } : { flexShrink: 1 };
  const close =
    onClose && closeButton ? (
      <Round
        testID="sheet-close"
        icon="close"
        label={tr.common.close}
        side={KIT.size.sheetClose}
        onPress={onClose}
      />
    ) : null;
  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        style={[
          size,
          { marginHorizontal: KIT.size.sheetInset, marginBottom: KIT.size.sheetInset },
          style,
        ]}
        collapsable={false}
      >
        {above}
        <View style={{ ...size, ...top, boxShadow: shadow.boxShadow }}>
          {shadow.node}
          <View
            style={{
              ...(look
                ? {
                    ...(look.ground ? gradientStyle(look.ground) : null),
                    backgroundColor: look.base,
                  }
                : { backgroundColor: layer.sheet }),
              ...size,
              ...top,
              overflow: 'hidden',
            }}
          >
            <View style={{ flexShrink: 0, paddingTop: KIT.size.sheetPadTop }}>
              <View
                style={{
                  alignSelf: 'center',
                  width: KIT.size.grabW,
                  height: KIT.size.grabH,
                  borderRadius: KIT.size.grabH,
                  backgroundColor: layer.sheetGrab,
                }}
              />
              {head ? (
                <View
                  style={{
                    flexDirection: 'row',
                    gap: KIT.size.rowGap,
                    alignItems: look ? 'center' : 'flex-start',
                    marginTop: look?.headTop ?? KIT.size.sheetHeadGap,
                    paddingLeft: padX + (look?.titleIn ?? 0),
                    paddingRight: padX + (look?.closeIn ?? 0),
                  }}
                >
                  {balance && close ? <View style={{ width: KIT.size.sheetClose }} /> : null}
                  <View
                    style={{ flex: 1, minHeight: KIT.size.sheetClose, justifyContent: 'center' }}
                  >
                    {head}
                  </View>
                  {close}
                </View>
              ) : null}
            </View>
            <GestureDetector gesture={native}>
              <Animated.ScrollView
                ref={scroller}
                showsHorizontalScrollIndicator={false}
                bounces={false}
                overScrollMode="never"
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                onScroll={onScroll}
                scrollEventThrottle={16}
                fadingEdgeLength={{ start: KIT.size.sheetFade, end: KIT.size.sheetFade }}
                contentContainerStyle={{
                  flexGrow: fill ? 1 : undefined,
                  paddingTop: head ? (look?.bodyTop ?? KIT.size.rowGap) : KIT.size.sheetGap,
                  paddingHorizontal: padX,
                  paddingBottom: footer ? KIT.size.sheetGap + KIT.size.tagGap : foot,
                }}
              >
                {children}
              </Animated.ScrollView>
            </GestureDetector>
            {footer ? (
              <View
                style={{
                  flexShrink: 0,
                  paddingHorizontal: padX,
                  paddingBottom: foot,
                }}
              >
                {footer}
              </View>
            ) : null}
            {/* Without a title the close button stands at the top right over the content (a
                person's card opens with their face under the handle). */}
            {!head && close ? (
              <View
                style={{
                  position: 'absolute',
                  top: KIT.size.sheetPadTop + KIT.size.grabH + KIT.size.sheetHeadGap,
                  right: padX,
                }}
              >
                {close}
              </View>
            ) : null}
          </View>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

export type SheetLook = {
  ground?: string;
  base: string;
  padX?: number;
  padBottom?: number;
  headTop?: number;
  titleIn?: number;
  closeIn?: number;
  // The content's room under the title's row (tuval Ayarlar: 13).
  bodyTop?: number;
};
