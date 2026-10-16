// One import per weight (the package roots would bundle every weight of the family). The files are
// JS assets loaded with expo-font at runtime, so they travel with an OTA update. Five files, no more
// (the skall design system → kod-esleme.md → "Yazı tipi ağırlıkları").
import { Manrope_400Regular } from '@expo-google-fonts/manrope/400Regular';
import { Manrope_600SemiBold } from '@expo-google-fonts/manrope/600SemiBold';
import { Manrope_700Bold } from '@expo-google-fonts/manrope/700Bold';
import { Poppins_700Bold } from '@expo-google-fonts/poppins/700Bold';
import { Poppins_800ExtraBold } from '@expo-google-fonts/poppins/800ExtraBold';
import type { FontSource } from 'expo-font';

import type { FontName, FontSet } from './tokens';

const FONT_ASSETS: Record<FontName, FontSource> = {
  Poppins_700Bold,
  Poppins_800ExtraBold,
  Manrope_400Regular,
  Manrope_600SemiBold,
  Manrope_700Bold,
};

// The files the theme needs, for `useFonts`.
export function fontsOf(set: FontSet): Record<string, FontSource> {
  const map: Record<string, FontSource> = {};
  for (const name of Object.values(set)) map[name] = FONT_ASSETS[name];
  return map;
}
