import { Image, StyleSheet, useWindowDimensions, View } from 'react-native';

import { useLabOff } from '@/lib/drawLab';
import { AURA } from '@/theme/aura';
import { useTheme } from '@/theme/ThemeProvider';

// The colour clouds behind a screen (docs/design/aura/project/aura.css → `.aura`, the five clouds
// a1 to a5, light and `.night`), the same still picture on every screen (the owner's call, 28
// Ekim). Drawn by Chromium from aura.css at the canvas's 390 × 844 and kept as one image per theme:
// five live clouds per screen, ten during a slide, held the phone at 12 to 15 frames a second and
// kept it drawing at rest. One opaque picture is one layer, read once and kept in memory.
const GROUND = {
  light: require('../../assets/aura/ground-light.webp'),
  dark: require('../../assets/aura/ground-dark.webp'),
} as const;

export function AuraBackground() {
  const { scheme } = useTheme();
  if (useLabOff('zemin')) {
    return <View style={[StyleSheet.absoluteFill, { backgroundColor: AURA[scheme].ground }]} />;
  }
  return (
    <Image
      source={GROUND[scheme]}
      fadeDuration={0}
      resizeMode="cover"
      style={StyleSheet.absoluteFill}
      accessible={false}
    />
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
  return (
    <View
      style={{ position: 'absolute', left: 0, right: 0, top, height, overflow: 'hidden', opacity }}
    >
      <Image
        source={GROUND[scheme]}
        fadeDuration={0}
        resizeMode="cover"
        style={{ position: 'absolute', left: 0, top: -top, width, height: screen }}
        accessible={false}
      />
    </View>
  );
}
