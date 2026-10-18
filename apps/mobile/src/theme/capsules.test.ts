import { describe, expect, it } from 'vitest';

import { CAPSULE_KEYS, CAPSULES, capsuleSvg } from './capsules';

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
});
