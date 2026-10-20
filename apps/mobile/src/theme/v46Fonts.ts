import type { FontName } from './tokens';

// v46's weights in the Plus Jakarta Sans files the app bundles (src/theme/fonts.ts): 500 to 800,
// the same four v46 loads from Google Fonts. A weight v46 writes but does not load (400, 18 times:
// the reaction pills `.vr` and `.react` in Mesajlar and Mekan sohbeti, an emoji in each) is drawn as
// the browser draws it, with the file CSS font matching picks (docs/decisions/v46-native-3a-yazi.md).
// No React Native import: the tests read it in Node.
const FAMILY: Record<number, FontName> = {
  500: 'PlusJakartaSans_500Medium',
  600: 'PlusJakartaSans_600SemiBold',
  700: 'PlusJakartaSans_700Bold',
  800: 'PlusJakartaSans_800ExtraBold',
};

export const BUNDLED_WEIGHTS: readonly number[] = Object.keys(FAMILY).map(Number);

// CSS Fonts 4 §5.2, font-weight: the weight among `available` a browser draws `desired` with.
// 400 to 500: up to 500 first, then lighter, then heavier; lighter than 400: lighter first; heavier
// than 500: heavier first.
export function matchWeight(desired: number, available: readonly number[]): number {
  if (available.includes(desired)) return desired;
  const asc = [...available].sort((a, b) => a - b);
  const lighter = asc.filter((w) => w < desired).reverse();
  const heavier = asc.filter((w) => w > desired);
  const order =
    desired >= 400 && desired <= 500
      ? [...heavier.filter((w) => w <= 500), ...lighter, ...heavier.filter((w) => w > 500)]
      : desired < 400
        ? [...lighter, ...heavier]
        : [...heavier, ...lighter];
  const [first] = order;
  if (first === undefined) throw new Error('no font weight available');
  return first;
}

export function familyFor(weight: number): FontName {
  return FAMILY[matchWeight(weight, BUNDLED_WEIGHTS)] as FontName;
}
