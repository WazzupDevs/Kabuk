import type { ReactNode } from 'react';
import { type NativeScrollEvent, type NativeSyntheticEvent, ScrollView, View } from 'react-native';

import { useKit } from '@/aura/kit';
import { KIT } from '@/theme/auraKit';
import { gradientStyle } from '@/theme/gradient';
import { useLabOff } from '@/lib/drawLab';
import { shadowParts } from './NativeShadow';

// A bottom sheet's card (Sheet, RouteSheet): docs/design/aura `.sheet`, 36 round. Its content
// scrolls edge to edge inside the round card, clipped by the card's own corners, so nothing in it
// is cut square: not a button's glow at its sides, not a row scrolling past its top or bottom (the
// owner's report, 29 Ekim). What passes under the handle and the bottom edge fades into the card.
// No scroll bar (the owner's call, 29 Ekim).
export function SheetCard({
  onScroll,
  children,
}: {
  onScroll?: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  children: ReactNode;
}) {
  const k = useKit();
  const head = KIT.size.sheetPadTop + KIT.size.grabH + KIT.size.sheetGap;
  // The sheet's soft shadow natively (NativeShadow.tsx): it slides in, and React Native would blur
  // its shadow again on every frame of the slide.
  const shadowOff = useLabOff('golge');
  const shadow = shadowParts(shadowOff, k.c.glassShadow, undefined, KIT.size.sheetRadius);
  return (
    <View
      style={{ flexShrink: 1, borderRadius: KIT.size.sheetRadius, boxShadow: shadow.boxShadow }}
    >
      {shadow.node}
      <View
        style={{
          ...gradientStyle(k.c.sheet),
          backgroundColor: k.c.sheetBase,
          flexShrink: 1,
          borderRadius: KIT.size.sheetRadius,
          borderWidth: KIT.size.edge,
          borderColor: k.c.glassEdge,
          overflow: 'hidden',
        }}
      >
        <ScrollView
          showsHorizontalScrollIndicator={false}
          bounces={false}
          overScrollMode="never"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onScroll={onScroll}
          scrollEventThrottle={16}
          contentContainerStyle={{
            paddingTop: head,
            paddingHorizontal: KIT.size.sheetPadX,
            paddingBottom: KIT.size.sheetPadBottom,
          }}
        >
          {children}
        </ScrollView>
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
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: KIT.size.sheetPadBottom,
            ...gradientStyle(k.c.sheetFadeBottom),
          }}
        />
      </View>
    </View>
  );
}
