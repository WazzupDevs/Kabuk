import { type JsxAST, parse } from 'react-native-svg';

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
  let ast = drawings.get(key);
  if (ast === undefined) {
    const svg = capsuleSvg(look, false, eyes, ink).replace(
      'viewBox="0 0 48 58"',
      'viewBox="0 0 48 66"',
    );
    ast = parse(svg);
    drawings.set(key, ast);
  }
  return ast;
}
