import { describe, expect, it } from 'vitest';

import { EYEBROW_NARROW, KIT_TYPE, TYPE_SCALE } from './auraKit';

type Style = { fontSize?: number; lineHeight?: number };

// Every text style of the kit, the faces' letters among them, by its name.
function styles(): [string, Style][] {
  const out: [string, Style][] = [['EYEBROW_NARROW', EYEBROW_NARROW]];
  for (const [name, value] of Object.entries(KIT_TYPE)) {
    if (name === 'av') {
      for (const [face, style] of Object.entries(value)) out.push([`av.${face}`, style as Style]);
    } else {
      out.push([name, value as Style]);
    }
  }
  return out;
}

// The base's type scale (the owner's call, 19 Kasım, docs/decisions/temel.md): eight sizes about
// 1.15 apart. A style between 10 and 36 is one of them; a new size is a decision, not a value.
describe('the type scale', () => {
  it('is the eight sizes', () => {
    expect([...TYPE_SCALE]).toEqual([10, 11, 13, 15, 17, 20, 24, 30]);
  });

  // The emoji-only message is the system's face at its own size (40 and 32), not a text style.
  const OWN = new Set(['emojiOne', 'emojiFew']);

  it('holds every text style between 10 and 36', () => {
    const off = styles()
      .filter(([name, s]) => !OWN.has(name) && s.fontSize !== undefined)
      .filter(([, s]) => (s.fontSize as number) >= 10 && (s.fontSize as number) <= 36)
      .filter(([, s]) => !(TYPE_SCALE as readonly number[]).includes(s.fontSize as number))
      .map(([name, s]) => `${name}: ${s.fontSize}`);
    expect(off).toEqual([]);
  });

  it('gives every sized style a whole line no shorter than its size', () => {
    const off = styles()
      .filter(([, s]) => s.fontSize !== undefined)
      .filter(([, s]) => {
        const line = s.lineHeight ?? 0;
        return !Number.isInteger(line) || line < (s.fontSize as number);
      })
      .map(([name, s]) => `${name}: ${s.fontSize}/${s.lineHeight}`);
    expect(off).toEqual([]);
  });
});
