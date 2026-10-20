import type { FontName } from './tokens';

// v46's weights in the Plus Jakarta Sans files the app bundles (src/theme/fonts.ts: 500 to 800).
// v46 also writes 400 once (13/400, emoji reactions); it is not bundled and draws as 500 until
// the shared components' step decides it (docs/decisions/v46-native-2-galeri.md). No React Native
// import: the tests read it in Node.
const FAMILY: Partial<Record<number, FontName>> = {
  500: 'PlusJakartaSans_500Medium',
  600: 'PlusJakartaSans_600SemiBold',
  700: 'PlusJakartaSans_700Bold',
  800: 'PlusJakartaSans_800ExtraBold',
};

export function isBundledWeight(weight: number): boolean {
  return FAMILY[weight] !== undefined;
}

export function familyFor(weight: number): FontName {
  return FAMILY[weight] ?? 'PlusJakartaSans_500Medium';
}
