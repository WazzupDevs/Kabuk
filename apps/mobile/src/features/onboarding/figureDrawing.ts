import { type JsxAST, parse } from 'react-native-svg';

import { reportError } from '@/lib/errorReporting';
import { parseOnce } from '@/lib/parseOnce';
import { type CapsuleEyes, type CapsuleKey, capsuleSvg } from '@/theme/capsules';

// A capsule standing alone (no disc) in a 48 x 66 box, parsed once per look, eyes and ink. The
// sign-up friends and the first screen's scene look, squint and blink by swapping the drawing.
const drawings = new Map<string, JsxAST | null>();

export function figureDrawing(
  look: CapsuleKey,
  eyes: CapsuleEyes,
  ink: string | undefined,
): JsxAST | null {
  const key = `${look}:${eyes.dx ?? 0}:${eyes.dy ?? 0}:${eyes.open ?? 1}:${ink ?? ''}`;
  // A drawing that does not parse leaves the spot empty (the figures are only decoration).
  return parseOnce(
    drawings,
    key,
    () =>
      parse(
        capsuleSvg(look, false, eyes, ink).replace('viewBox="0 0 48 58"', 'viewBox="0 0 48 66"'),
      ),
    reportError,
  );
}
