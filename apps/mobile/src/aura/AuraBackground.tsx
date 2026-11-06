import { useSyncExternalStore } from 'react';
import { Image, StyleSheet, useWindowDimensions, View } from 'react-native';

import { useLabOff } from '@/lib/drawLab';
import { GlassTarget } from '@/components/LiquidGlass';
import { AURA } from '@/theme/aura';
import { useTheme } from '@/theme/ThemeProvider';

// The colour clouds behind a screen (Aura v65 ekran.css → `.aura`, the five clouds a1 to a5), the
// same still picture on every screen (the owner's call, 28 Ekim). Drawn by Chromium at the canvas's
// 390 × 844 (scripts/aura/ground.ts) and kept as one image: five live clouds per screen, ten during
// a slide, held the phone at 12 to 15 frames a second and kept it drawing at rest. One opaque
// picture is one layer, read once and kept in memory. Light only: the dark scheme has no aura
// (`.dark.pA`), its ground is the flat canvas.
const GROUND_PICTURE = require('../../assets/aura/ground-light.webp');

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

// The screen's backdrop: the frosted buttons drawn after it blur it (ui/LiquidGlass → Frost). The
// picture is also drawn once more under the glass's target, as a plain view (the owner's report, 2
// Kasım, K2/X2: on several screens the clouds did not show on first opening, flat mint, until a
// glass or a sheet made the screen draw again); the target draws the same picture over it.
// Placed by its four edges, never by a size in per cent: a screen's root is padded by the safe area
// and a per cent is of the room inside the padding, so the picture stopped short of the foot by the
// safe area and the window's plain colour showed there (the owner's report, 3 Kasım, 2.1).
export function AuraBackground() {
  const { scheme } = useTheme();
  const off = useLabOff('zemin');
  const plain = !off && scheme !== 'dark';
  // The target stays a sibling of the glass over it (LiquidGlassView finds its backdrop among the
  // views before its own branch, never inside one), so only the plain picture is wrapped.
  return (
    <>
      <View
        pointerEvents="none"
        collapsable={false}
        style={StyleSheet.absoluteFill}
        onLayout={(e) => reportGround(e.nativeEvent.layout.width, e.nativeEvent.layout.height)}
      >
        {plain ? (
          <Image
            source={GROUND_PICTURE}
            fadeDuration={0}
            resizeMode="cover"
            style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' }}
            accessible={false}
          />
        ) : null}
      </View>
      <GlassTarget backdrop style={StyleSheet.absoluteFill}>
        {off || scheme === 'dark' ? (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: AURA[scheme].ground }]} />
        ) : (
          <Image
            source={GROUND_PICTURE}
            fadeDuration={0}
            resizeMode="cover"
            // Its own size, or it draws at the picture's pixels (Image takes a required source's
            // size).
            style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' }}
            accessible={false}
          />
        )}
      </GlassTarget>
    </>
  );
}

// How many steps a band's soft edge takes; each a strip of the picture a little fainter.
const FADE_STEPS = 10;

// A fixed bar's ground (a head over a list, a bar of buttons under it): the same picture, cut to
// the bar and lined up with the one behind the screen, so what scrolls under the bar is hidden
// and the bar does not show; `fade` more of it fades out below (`down`) or above (`up`) the bar.
// React Native has no mask: the soft edge is the picture in strips, each fainter. `top` and
// `height` are on the screen (the screen's ground fills the window).
// The soft edge only where `soft` asks for it (the owner's call, 6 Kasım: the screens' fades at the
// top and the bottom looked bad in both schemes, docs/decisions/cam-kapali.md): elsewhere a bar's
// ground ends where the bar does. Keşfet's aura over the map keeps it (a hard edge would cut the map).
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
  const off = useLabOff('zemin');
  const strip = fade / FADE_STEPS;
  const strips = Array.from({ length: soft ? FADE_STEPS : 0 }, (_, i) => ({
    top: direction === 'down' ? top + height + i * strip : top - (i + 1) * strip,
    opacity: 1 - (i + 1) / (FADE_STEPS + 1),
  }));
  if (off) return null;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {height > 0 ? <Slice top={top} height={height} opacity={1} /> : null}
      {strips.map((s, i) => (
        <Slice key={i} top={s.top} height={strip} opacity={s.opacity} />
      ))}
    </View>
  );
}

function Slice({ top, height, opacity }: { top: number; height: number; opacity: number }) {
  const { scheme } = useTheme();
  const { width, height: screen } = useGroundSize();
  if (scheme === 'dark') {
    return (
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top,
          height,
          opacity,
          backgroundColor: AURA.dark.ground,
        }}
      />
    );
  }
  return (
    <View
      style={{ position: 'absolute', left: 0, right: 0, top, height, overflow: 'hidden', opacity }}
    >
      <Image
        source={GROUND_PICTURE}
        fadeDuration={0}
        resizeMode="cover"
        style={{ position: 'absolute', left: 0, top: -top, width, height: screen }}
        accessible={false}
      />
    </View>
  );
}

// A sideways soft edge (a chip row running off the screen's right, Kapsülün): the ground in
// columns, each more opaque towards the edge, lined up with the picture behind the screen. A flat
// colour fade over the clouds showed as a band of its own (the owner's report, 2 Kasım, 11.4).
// `top` and `left` are on the screen.
export function AuraFadeX({
  top,
  left,
  width,
  height,
}: {
  top: number;
  left: number;
  width: number;
  height: number;
}) {
  const off = useLabOff('zemin');
  const { scheme } = useTheme();
  const { width: screenWidth, height: screen } = useGroundSize();
  if (off || width <= 0 || height <= 0) return null;
  const column = width / FADE_STEPS;
  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', right: 0, top: 0, width, height, flexDirection: 'row' }}
    >
      {Array.from({ length: FADE_STEPS }, (_, i) => (
        <View
          key={i}
          style={{ width: column, height, overflow: 'hidden', opacity: (i + 1) / FADE_STEPS }}
        >
          {scheme === 'dark' ? (
            <View style={{ flex: 1, backgroundColor: AURA.dark.ground }} />
          ) : (
            <Image
              source={GROUND_PICTURE}
              fadeDuration={0}
              resizeMode="cover"
              style={{
                position: 'absolute',
                left: -(left + i * column),
                top: -top,
                width: screenWidth,
                height: screen,
              }}
              accessible={false}
            />
          )}
        </View>
      ))}
    </View>
  );
}
