import { describe, expect, it } from 'vitest';

import { CAPSULE_KEYS, CAPSULES, capsuleSvg, FRIEND_DARK_INK } from './capsules';

// A small well-formedness check: every tag closes, in order (SvgXml parses the text on the phone).
function wellFormed(svg: string): boolean {
  const stack: string[] = [];
  for (const m of svg.matchAll(/<(\/?)([a-zA-Z]+)[^>]*?(\/?)>/g)) {
    const [, closing, name, selfClosing] = m;
    if (selfClosing) continue;
    if (closing) {
      if (stack.pop() !== name) return false;
    } else stack.push(name as string);
  }
  return stack.length === 0;
}

describe('capsule avatars (v45: AV)', () => {
  it("are v45's 28 variants, each once", () => {
    expect(CAPSULES).toHaveLength(28);
    expect(new Set(CAPSULE_KEYS).size).toBe(28);
    expect(CAPSULE_KEYS[0]).toBe('none');
    expect(CAPSULE_KEYS).toContain('captain');
    expect(CAPSULE_KEYS).toContain('headphones');
  });

  it("draw well-formed SVG with the variant's colours and accessory, clipped to the disc", () => {
    for (const v of CAPSULES) {
      const svg = capsuleSvg(v.key);
      expect(wellFormed(svg)).toBe(true);
      expect(svg).toContain(`fill="${v.bg}"`);
      expect(svg).toContain(`fill="${v.body}"`);
      if (v.front) expect(svg).toContain(v.front);
      expect(svg).toContain('clip-path="url(#disc)"');
      // The prototype's blinking hook is not part of the app.
      expect(svg).not.toContain('class=');
    }
  });

  it('every capsule has the same body: 28 wide, 56 high, from y 8', () => {
    for (const key of CAPSULE_KEYS) {
      expect(capsuleSvg(key)).toContain('<rect x="10" y="8" width="28" height="56" rx="14"');
    }
  });

  it('the ghost is pale, without an accessory', () => {
    const svg = capsuleSvg('ghost');
    expect(wellFormed(svg)).toBe(true);
    expect(svg).toContain('fill="#E8E4F4"');
    expect(svg).toContain('opacity="0.95"');
  });

  it('standing alone it has no disc and a taller box (the sign-up friends, step 4.3)', () => {
    const svg = capsuleSvg('pirate', false);
    expect(wellFormed(svg)).toBe(true);
    expect(svg).toContain('viewBox="0 0 48 58"');
    expect(svg).not.toContain('clipPath');
    expect(svg).not.toContain('r="24"');
  });

  // The sign-up friends' eyes (the CTO's 4.3d review): looking, squinting, blinking and the dark
  // scheme's ink.
  it('turns the eyes: shifted when looking, flattened when squinting or blinking', () => {
    // 'cat' has a light visor and ink-coloured eyes at x 20 and 28, y 20.5.
    const rest = capsuleSvg('cat', false);
    expect(rest).toContain('<circle cx="20" cy="20.5" r="2.1"');
    expect(rest).toContain('<circle cx="28" cy="20.5" r="2.1"');
    const looking = capsuleSvg('cat', false, { dx: -2.6, dy: 1.8 });
    expect(looking).toContain('<circle cx="17.4" cy="22.3" r="2.1"');
    expect(looking).toContain('<circle cx="25.4" cy="22.3" r="2.1"');
    const squint = capsuleSvg('cat', false, { open: 0.25 });
    expect(squint).toContain('<ellipse cx="20" cy="20.5" rx="2.1" ry="0.53"');
    expect(squint).not.toContain('<circle cx="20"');
    // A dark visor's eyes flatten too.
    const shades = CAPSULES.find((c) => c.visor === 'dark')!;
    expect(capsuleSvg(shades.key, false, { open: 0.1 })).toContain('ry="0.2"');
    for (const key of CAPSULE_KEYS) {
      expect(wellFormed(capsuleSvg(key, false, { dx: -2.6, dy: 1.8, open: 0.25 }))).toBe(true);
    }
  });

  it("the dark scheme's ink lightens the outlines and shading, never the eyes", () => {
    const light = capsuleSvg('cat', false);
    const dark = capsuleSvg('cat', false, {}, FRIEND_DARK_INK);
    expect(dark).toContain(FRIEND_DARK_INK);
    // The shading of the body took the new ink...
    expect(dark).toContain(`<path d="M30 10a14 14 0 0 1 8 12v42h-8z" fill="${FRIEND_DARK_INK}"`);
    // ...the eyes kept the dark one, so they still read on the light visor.
    expect(dark).toContain('<circle cx="20" cy="20.5" r="2.1" fill="#14112B"/>');
    expect(dark).toContain('<circle cx="28" cy="20.5" r="2.1" fill="#14112B"/>');
    // The default ink leaves the drawing as it is.
    expect(capsuleSvg('cat', false, {}, '#14112B')).toBe(light);
  });
});
