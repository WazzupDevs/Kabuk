// One import per weight (the package root would bundle every weight of the family). The files are
// JS assets loaded with expo-font at runtime, so they travel with an OTA update: no config plugin,
// no native change (docs/SPEC_V4.md §4.C, step 4.2). Four files, the weights v45 loads, and Roboto
// 700 for what v46 sets in system-ui (the notice over the tab bar): a file in assets/fonts/ with its
// licence (Roboto-OFL.txt), not a package, so the app's dependencies stay as they are.
import { PlusJakartaSans_500Medium } from '@expo-google-fonts/plus-jakarta-sans/500Medium';
import { PlusJakartaSans_600SemiBold } from '@expo-google-fonts/plus-jakarta-sans/600SemiBold';
import { PlusJakartaSans_700Bold } from '@expo-google-fonts/plus-jakarta-sans/700Bold';
import { PlusJakartaSans_800ExtraBold } from '@expo-google-fonts/plus-jakarta-sans/800ExtraBold';
import type { FontSource } from 'expo-font';

import type { FontName, FontSet } from './tokens';

const FONT_ASSETS: Record<FontName, FontSource> = {
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
  Roboto_700Bold: require('../../assets/fonts/Roboto_700Bold.ttf'),
};

// The files the theme needs, for `useFonts`.
export function fontsOf(set: FontSet): Record<string, FontSource> {
  const map: Record<string, FontSource> = {};
  for (const name of Object.values(set)) map[name] = FONT_ASSETS[name];
  return map;
}
