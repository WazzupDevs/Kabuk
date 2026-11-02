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

// The screen's backdrop: the frosted buttons drawn after it blur it (ui/LiquidGlass → Frost). The
// picture is also drawn once more under the glass's target, as a plain view (the owner's report, 2
// Kasım, K2/X2: on several screens the clouds did not show on first opening, flat mint, until a
// glass or a sheet made the screen draw again); the target draws the same picture over it.
export function AuraBackground() {
  const { scheme } = useTheme();
  const off = useLabOff('zemin');
  const plain = !off && scheme !== 'dark';
  return (
    <>
      {plain ? (
        <Image
          source={GROUND_PICTURE}
          fadeDuration={0}
          resizeMode="cover"
          style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' }}
          accessible={false}
        />
      ) : null}
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
export function AuraBand({
  top,
  height,
  fade,
  direction,
}: {
  top: number;
  height: number;
  fade: number;
  direction: 'down' | 'up';
}) {
  const off = useLabOff('zemin');
  const strip = fade / FADE_STEPS;
  const strips = Array.from({ length: FADE_STEPS }, (_, i) => ({
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
  const { width, height: screen } = useWindowDimensions();
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
