import { Image, StyleSheet } from 'react-native';

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
