import { useSyncExternalStore } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { GlassTarget } from '@/components/LiquidGlass';
import { AURA } from '@/theme/aura';
import { useTheme } from '@/theme/ThemeProvider';

// The ground behind a screen: flat, no colour clouds (yeni arayüz tuvali ekran.css `.aura {
// display: none }`; docs/decisions/yeni-tuval.md → "Tuvale sadık kalınır"): `--canvas`, #EFF7F1 in
// the light scheme and #000000 in the dark (`AURA[scheme].ground`).

// The ground's size on the screen, as the last ground laid out (every ground fills its screen's
// root). A band cuts its strip of the picture at this size, so it lines up with the ground behind
// it; the window's size is not it on Android (the navigation bar), and a band cut at the window's
// size showed as a strip of its own (the owner's report, 3 Kasım, 2.1).
type Size = { width: number; height: number };
let groundSize: Size | null = null;
const groundListeners = new Set<() => void>();
function reportGround(width: number, height: number) {
  if (width <= 0 || height <= 0) return;
  if (groundSize && groundSize.width === width && groundSize.height === height) return;
  groundSize = { width, height };
  groundListeners.forEach((l) => l());
}
function subscribeGround(l: () => void) {
  groundListeners.add(l);
  return () => {
    groundListeners.delete(l);
  };
}
const readGround = () => groundSize;

export function useGroundSize(): Size {
  const window = useWindowDimensions();
  const ground = useSyncExternalStore(subscribeGround, readGround);
  return ground ?? window;
}

// The screen's backdrop: the frosted buttons drawn after it blur it (ui/LiquidGlass → Frost). Placed
// by its four edges, never by a size in per cent: a screen's root is padded by the safe area and a
// per cent is of the room inside the padding (the owner's report, 3 Kasım, 2.1).
export function AuraBackground() {
  const { scheme } = useTheme();
  return (
    <>
      <View
        pointerEvents="none"
        collapsable={false}
        style={StyleSheet.absoluteFill}
        onLayout={(e) => reportGround(e.nativeEvent.layout.width, e.nativeEvent.layout.height)}
      />
      <GlassTarget backdrop style={StyleSheet.absoluteFill}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: AURA[scheme].ground }]} />
      </GlassTarget>
    </>
  );
}

// How many steps a band's soft edge takes; each a strip a little fainter.
const FADE_STEPS = 10;

// A fixed bar's ground (a head over a list, a bar of buttons under it): the flat ground cut to the
// bar, so what scrolls under the bar is hidden; `fade` more of it fades out below (`down`) or above
// (`up`) the bar, in strips each fainter. `top` and `height` are on the screen.
// The soft edge only where `soft` asks for it (the owner's call, 6 Kasım): elsewhere a bar's ground
// ends where the bar does. Keşfet's band over the map keeps it (a hard edge would cut the map).
export function AuraBand({
  top,
  height,
  fade,
  direction,
  soft = false,
}: {
  top: number;
  height: number;
  fade: number;
  direction: 'down' | 'up';
  soft?: boolean;
}) {
  const { scheme } = useTheme();
  const strip = fade / FADE_STEPS;
  const strips = Array.from({ length: soft ? FADE_STEPS : 0 }, (_, i) => ({
    top: direction === 'down' ? top + height + i * strip : top - (i + 1) * strip,
    opacity: 1 - (i + 1) / (FADE_STEPS + 1),
  }));
  const color = AURA[scheme].ground;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {height > 0 ? (
        <View
          style={{ position: 'absolute', left: 0, right: 0, top, height, backgroundColor: color }}
        />
      ) : null}
      {strips.map((s, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: s.top,
            height: strip,
            opacity: s.opacity,
            backgroundColor: color,
          }}
        />
      ))}
    </View>
  );
}

// The ground behind a rounded card of a fixed head, laid in the card's box (its `fill` insets) so it
// follows the card's height as it changes with no measuring: what scrolls up under the head ends
// along the card's rounded foot, not on a straight line under it (the owner's report, 6 Kasım,
// round 3).
export function AuraPatch({
  radius = 0,
  fill,
}: {
  radius?: number;
  fill: { left: number; right: number; bottom: number };
}) {
  const { scheme } = useTheme();
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: 0,
        ...fill,
        borderRadius: radius,
        backgroundColor: AURA[scheme].ground,
      }}
    />
  );
}
