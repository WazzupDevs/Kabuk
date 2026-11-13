import { type ReactNode, useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, { runOnJS, useAnimatedReaction, useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AURA, barBandCss, MOTION } from '@/theme/aura';
import { KIT } from '@/theme/auraKit';
import { gradientStyle } from '@/theme/gradient';
import { useTheme } from '@/theme/ThemeProvider';

import { stickyBandAt, stickyFadeAt, stickyLift, stickyShrinkAt } from './scrollMath';
import { type ScreenScroll, useScreenScroll } from './ScrollScreen';

// Where the field pins (its top in the content less its place under the bar) and how far the band
// reaches under it, from its anchor's place in the window. Read when it is laid out and when the
// content changes size, never on a frame.
function place(scroll: ScreenScroll, anchor: View) {
  anchor.measureInWindow((_x, top, _w, height) => {
    const viewport = scroll.viewportTop.get();
    const inContent = top - viewport + scroll.y.get();
    scroll.stickyAt.set(Math.max(0, inContent - KIT.size.stickyTop));
    // From the band's own foot down to the pinned field's foot, and a little more.
    const foot = viewport + KIT.size.stickyTop + height + KIT.size.stickyBandPad;
    scroll.setReach(Math.max(0, Math.ceil(foot - AURA.topBar.bandHeight)));
  });
}

// A screen's main search or filter (docs/design/iskelet.md → 3.2: Keşfet's search capsule,
// Aktiviteler's Etkinlikler and Geçmiş, Mesajlar's search): it scrolls with the content until it
// reaches the bar (KIT.size.stickyTop under the top of the scrolling body) and stays there, with no
// title bar of its own; once pinned, the band reaches below it (TopBar → BarBand). Screen draws it
// over the parts after it. On a screen that does not scroll it stays in place.
// `shrink` ([from, to]): the field thins from `from` to `to` over the last MOTION.scroll's
// stickyFadePx before it pins (Keşfet's capsule, 5.1); its place in the content stays `from` high,
// so nothing under it moves. Its children fill the height they are given.
// `band`: on a screen with no top bar (Keşfet, 5.1: no title bar of its own) the field carries the
// band itself, behind it from the scrolling body's top to the band's fade under its foot, coming in
// over the same last px before the pin; the screen's band over the content would cover the field.
// `side`: how far the field stands from the screen's sides, so its band reaches them (Keşfet's
// head: 22, tuval Kesfet).
export function StickyField({
  shrink,
  band,
  side = KIT.size.side,
  children,
}: {
  shrink?: readonly [number, number];
  band?: boolean;
  side?: number;
  children: ReactNode;
}) {
  const scroll = useScreenScroll();
  const [anchor, setAnchor] = useState<View | null>(null);
  const fadePx = MOTION.scroll.stickyFadePx;
  const measure = () => {
    if (scroll && anchor) place(scroll, anchor);
  };
  // Once more when the screen's parts have arrived: measured while its part was still rising into
  // place (Reveal), the field pinned that much too high (Keşfet back from its map,
  // docs/denetim/pano-fark-2026-11.md → PF-02).
  useEffect(() => {
    if (!scroll || !anchor) return undefined;
    const timer = setTimeout(() => place(scroll, anchor), SETTLED_MS);
    return () => clearTimeout(timer);
  }, [scroll, anchor]);
  // The content above it may change size without moving it within its own parent.
  useAnimatedReaction(
    () => scroll?.contentHeight.get() ?? 0,
    (now, before) => {
      if (before !== null && now !== before) runOnJS(measure)();
    },
  );
  const style = useAnimatedStyle(() => {
    const y = scroll ? scroll.y.get() : 0;
    const pinAt = scroll ? scroll.stickyAt.get() : -1;
    const lift = { transform: [{ translateY: stickyLift(y, pinAt) }] };
    if (!shrink) return lift;
    return { ...lift, height: stickyShrinkAt(y, pinAt, fadePx, shrink[0], shrink[1]) };
  });
  return (
    // The anchor stays where the content puts it; only the field inside it moves.
    <View
      ref={setAnchor}
      collapsable={false}
      onLayout={measure}
      style={shrink ? { height: shrink[0] } : undefined}
    >
      <Animated.View style={[shrink ? { height: shrink[0] } : null, style]}>
        {band ? <FieldBand height={shrink ? shrink[0] : 0} side={side} /> : null}
        {children}
      </Animated.View>
    </View>
  );
}

// Long enough for a screen's cascade to have ended (hareket.json → stagger, dissolve).
const SETTLED_MS = 700;

// The band behind a pinned field: drawn once, only its opacity follows the scroll (2.2).
function FieldBand({ height, side }: { height: number; side: number }) {
  const scroll = useScreenScroll();
  const { scheme } = useTheme();
  const fadePx = MOTION.scroll.stickyFadePx;
  const top = KIT.size.stickyTop;
  const foot = Math.round(AURA.topBar.bandHeight * AURA.topBar.bandFade);
  const style = useAnimatedStyle(() => {
    if (!scroll) return { opacity: 0 };
    return { opacity: stickyBandAt(scroll.y.get(), scroll.stickyAt.get(), fadePx) };
  });
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        { position: 'absolute', left: -side, right: -side, top: -top },
        { bottom: -foot },
        gradientStyle(barBandCss(scheme, top + height + foot)),
        style,
      ]}
    />
  );
}

// The band over the status bar, for a screen whose scrolling body starts right under it (Keşfet,
// Aktiviteler): the field's own band is drawn inside the body and ends at the body's top edge, so
// what scrolled was cut on a hard line under the status bar with the bare ground above it
// (docs/denetim/pano-fark-2026-11.md → PF-01, PF-29). It comes in with the field's band. Placed
// against the screen (inside its safe area view, at its top). Nothing where something stands
// between the status bar and the body (Mesajlar's fixed title).
export function StickyStatusBand() {
  const scroll = useScreenScroll();
  const insets = useSafeAreaInsets();
  const { scheme } = useTheme();
  const fadePx = MOTION.scroll.stickyFadePx;
  const top = insets.top;
  const style = useAnimatedStyle(() => {
    if (!scroll || scroll.viewportTop.get() > top + 1) return { opacity: 0 };
    return { opacity: stickyBandAt(scroll.y.get(), scroll.stickyAt.get(), fadePx) };
  });
  if (!scroll || top <= 0) return null;
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        { position: 'absolute', left: 0, right: 0, top: 0, height: top },
        { backgroundColor: AURA[scheme].bar.band },
        style,
      ]}
    />
  );
}

// What is above a sticky field (Aktiviteler's gift card): over the last MOTION.scroll.stickyFadePx
// before the field pins it fades out and shrinks to 0.95.
export function StickyFade({ children }: { children: ReactNode }) {
  const scroll = useScreenScroll();
  const fadePx = MOTION.scroll.stickyFadePx;
  const scaleTo = AURA.topBar.stickyScale;
  const style = useAnimatedStyle(() => {
    if (!scroll) return { opacity: 1, transform: [{ scale: 1 }] };
    const f = stickyFadeAt(scroll.y.get(), scroll.stickyAt.get(), fadePx, scaleTo);
    return { opacity: f.opacity, transform: [{ scale: f.scale }] };
  });
  // It shrinks toward its foot (tuval Aktivite: from 50 % 100 %).
  return <Animated.View style={[SHRINK_FROM_FOOT, style]}>{children}</Animated.View>;
}
const SHRINK_FROM_FOOT = { transformOrigin: 'center bottom' } as const;
