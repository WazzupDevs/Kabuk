import { type ReactNode, useState } from 'react';
import { View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, { type AnimatedRef, useAnimatedRef } from 'react-native-reanimated';

import { useKit } from '@/aura/kit';
import { KIT } from '@/theme/auraKit';
import { gradientStyle } from '@/theme/gradient';
import { useLabOff } from '@/lib/drawLab';
import { shadowParts } from './NativeShadow';
import { useSheetDrag } from './sheetDrag';

// A bottom sheet's card (Sheet, RouteSheet): Aura v65 `.sheet` (U8, SablonSheet), a glass card 8
// from the screen's sides and foot, 28 round at every corner, its handle 40 × 4 12 from the top;
// its content ends the bottom safe area and 4 above its foot (38 on a 34 safe area), so its buttons
// sit 12 above the safe area as everywhere. Its content scrolls edge to edge inside the card,
// clipped by the card's own corners, so nothing in it is cut square (the owner's report, 29 Ekim). What passes
// under the handle and the bottom edge fades into the card. No scroll bar (29 Ekim). Pulled down it
// follows the finger and closes (useSheetDrag); `above` (the buddies over its top edge) comes with
// it. With a `footer` (Check-in, aura v37) the card is two parts: the content scrolls above, only
// when it does not fit, cut square at its foot; the footer's buttons stay put under it, 18 below
// the content. `footerFade` (Masa kur, aura v47) fades what scrolls into the footer's top edge, only
// while the content does not fit.
export function SheetCard({
  onClose,
  bottomInset,
  above,
  fill,
  footer,
  footerFade,
  scrollRef,
  children,
}: {
  // Unset: it cannot be pulled away (the join request).
  onClose?: () => void;
  // The bottom safe area: the content's end stays clear of it.
  bottomInset: number;
  above?: ReactNode;
  // As tall as the sheet around it (Sheet → `top`), the content stretched to it.
  fill?: boolean;
  // Buttons that stay under the scrolling content.
  footer?: ReactNode;
  footerFade?: boolean;
  // The content's scroll, for a sheet that moves it itself (Kapsülünü süsle's pack chips).
  scrollRef?: AnimatedRef<Animated.ScrollView>;
  children: ReactNode;
}) {
  const k = useKit();
  const ownScroller = useAnimatedRef<Animated.ScrollView>();
  const scroller = scrollRef ?? ownScroller;
  const { pan, native, onScroll, style } = useSheetDrag(onClose, scroller);
  const head = KIT.size.sheetPadTop + KIT.size.grabH + KIT.size.sheetGap;
  // The sheet's soft shadow natively (NativeShadow.tsx): it slides in, and React Native would blur
  // its shadow again on every frame of the slide.
  const shadowOff = useLabOff('golge');
  const shadow = shadowParts(shadowOff, k.c.glassShadow, undefined, KIT.size.sheetRadius);
  const top = { borderRadius: KIT.size.sheetRadius };
  const foot = Math.max(KIT.size.sheetPadBottom + bottomInset, KIT.size.sheetPadBottomMin);
  const size = fill ? { flex: 1 } : { flexShrink: 1 };
  // The scroll's height, its content's and the footer's: the fade shows only when content overflows.
  const [viewH, setViewH] = useState(0);
  const [contentH, setContentH] = useState(0);
  const [footerH, setFooterH] = useState(0);
  const measure = !!footer && !!footerFade;
  const overflows = measure && viewH > 0 && footerH > 0 && contentH > viewH + 1;
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
              ...gradientStyle(k.c.sheet),
              backgroundColor: k.c.sheetBase,
              ...size,
              ...top,
              borderWidth: KIT.size.edge,
              borderColor: k.c.glassEdge,
              overflow: 'hidden',
            }}
          >
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
                onLayout={measure ? (e) => setViewH(e.nativeEvent.layout.height) : undefined}
                onContentSizeChange={measure ? (_w, h) => setContentH(h) : undefined}
                contentContainerStyle={{
                  flexGrow: fill ? 1 : undefined,
                  paddingTop: head,
                  paddingHorizontal: KIT.size.sheetPadX,
                  paddingBottom: footer ? KIT.size.sheetGap + KIT.size.tagGap : foot,
                }}
              >
                {children}
              </Animated.ScrollView>
            </GestureDetector>
            {footer ? (
              <View
                onLayout={measure ? (e) => setFooterH(e.nativeEvent.layout.height) : undefined}
                style={{
                  flexShrink: 0,
                  paddingHorizontal: KIT.size.sheetPadX,
                  paddingBottom: foot,
                }}
              >
                {footer}
              </View>
            ) : null}
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                height: head,
                ...gradientStyle(k.c.sheetFadeTop),
              }}
            >
              <View
                style={{
                  alignSelf: 'center',
                  marginTop: KIT.size.sheetPadTop,
                  width: KIT.size.grabW,
                  height: KIT.size.grabH,
                  borderRadius: KIT.size.grabH,
                  backgroundColor: k.c.grab,
                }}
              />
            </View>
            {/* What scrolls fades into the card's foot (with a footer it is cut square, the buttons
                below it). */}
            {overflows ? (
              <View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: footerH,
                  height: KIT.size.sheetFooterFade,
                  ...gradientStyle(k.c.sheetFadeBottom),
                }}
              />
            ) : null}
            {footer ? null : (
              <View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: foot,
                  ...gradientStyle(k.c.sheetFadeBottom),
                }}
              />
            )}
          </View>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}
