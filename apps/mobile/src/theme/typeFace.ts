// The app's two faces for the files that name a face themselves (the games' and the sign-up's type
// files): the owner's call, 20 Kasım, docs/decisions/temel.md → Yazı tipi. A title (20 and over, or
// a bold line of 17 and over) is Bricolage Grotesque 700; everything else is the phone's own face
// (Android: Roboto), a step lighter as that face is read. Numbers that must keep their width
// (`NUMBERS`: a clock, a score, a count) ask either face for its figures of one width.
// Pure: no React Native import.
export const TITLE_FACE = 'BricolageGrotesque_700Bold';
export const SYSTEM_FACE = 'sans-serif';

export type Face = { fontFamily: string; fontWeight?: '400' | '500' | '700' };

// The weight a Plus Jakarta Sans file name carries (`PlusJakartaSans_800ExtraBold` → 800).
function weightOf(family: string): number {
  const m = /_(\d{3})/.exec(family);
  return m ? Number(m[1]) : 500;
}

// The face a style drawn in `family` at `size` takes under the rule.
export function faceOf(family: string, size: number): Face {
  const weight = weightOf(family);
  if (size >= 20 || (weight >= 700 && size >= 17)) return { fontFamily: TITLE_FACE };
  return {
    fontFamily: SYSTEM_FACE,
    fontWeight: weight >= 700 ? '700' : weight >= 600 ? '500' : '400',
  };
}

// Spread after a style: its figures each as wide as the next (both faces have them).
export const NUMBERS: { fontVariant: 'tabular-nums'[] } = { fontVariant: ['tabular-nums'] };
