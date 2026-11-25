import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { EYEBROW_NARROW, KIT_TYPE, RADIUS_SCALE, SPACE_SCALE, TYPE_SCALE } from './auraKit';

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

// The corner scale (the owner's call, 20 Kasım, docs/decisions/temel.md): the shared theme files
// name no corner between 8 and 31 outside it. The games', the sign-up's and the capsule's files and
// the old tokens draw their own.
describe('the corner scale', () => {
  const OWN = new Set([
    'sprengja.ts',
    'signum.ts',
    'kaupholl.ts',
    'kibrit.ts',
    'krot.ts',
    'vampirTable.ts',
    'vampirTableSize.ts',
    'vampirScene.ts',
    'vampir.ts',
    'kinshi.ts',
    'kinshiPlay.ts',
    'kinshiWord.ts',
    'riso.ts',
    'gameMotion.ts',
    'signup.ts',
    'capsules.ts',
    'capsuleFx.ts',
    'capsuleSkia.ts',
    'tokens.ts',
    'theme.ts',
  ]);
  const dir = import.meta.dirname;

  it('is the five corners, and the spacing its seven steps', () => {
    expect([...RADIUS_SCALE]).toEqual([12, 16, 20, 24, 28]);
    expect([...SPACE_SCALE]).toEqual([4, 8, 12, 16, 20, 24, 32]);
  });

  it('holds every corner of the shared theme files', () => {
    const off: string[] = [];
    for (const file of readdirSync(dir)) {
      if (!file.endsWith('.ts') || file.endsWith('.test.ts') || OWN.has(file)) continue;
      const text = readFileSync(join(dir, file), 'utf8');
      for (const m of text.matchAll(/\b(\w*[rR]adius\w*): *(\d+(?:\.\d+)?)\b(?!\s*[*/+-])/g)) {
        const value = Number(m[2]);
        if (value < 8 || value > 31) continue;
        if (!(RADIUS_SCALE as readonly number[]).includes(value))
          off.push(`${file}: ${m[1]} ${value}`);
      }
    }
    expect(off).toEqual([]);
  });
});
