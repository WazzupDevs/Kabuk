import { describe, expect, it } from 'vitest';

import {
  DEFAULT_EYES,
  isGeneratedNick,
  LOOK_MAX_LENGTH,
  LOOK_SLOTS,
  nickCapacity,
  nickDigits,
  nickLetterPairs,
  nickNumbers,
  NICK_LETTERS,
  NICK_PATTERN,
  nickRefreshAt,
  normalizeLook,
  pickReadyLook,
  randomNick,
} from './capsule.ts';
import { CAPSULE_CATALOG, NICK_EXCLUSIONS } from './capsuleCatalog.ts';

// A seeded generator, so a failure repeats.
function seeded(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) % 2 ** 31;
    return s / 2 ** 31;
  };
}

describe('normalizeLook', () => {
  it('keeps every ready look as it is (K-61: drawn from the library parts only)', () => {
    expect(CAPSULE_CATALOG.readyLooks).toHaveLength(28);
    for (const { code } of CAPSULE_CATALOG.readyLooks) expect(normalizeLook(code)).toBe(code);
  });

  it('drops unknown parts, unknown ids and parts in a slot not theirs', () => {
    expect(normalizeLook('c:pembe e:koyu h:kulaklik x:y h:miğfer')).toBe(
      'c:pembe e:koyu h:kulaklik',
    );
    // "gozbandi" is a face part, not a head part.
    expect(normalizeLook('c:mor e:klasik h:gozbandi')).toBe('c:mor e:klasik');
    expect(normalizeLook('c:beyaz e:klasik')).toBe(`c:${CAPSULE_CATALOG.colors[0]?.id} e:klasik`);
  });

  it('keeps the first id of a slot and writes the slots in their order', () => {
    expect(normalizeLook('h:korsan c:mercan e:klasik h:tac')).toBe('c:mercan e:klasik h:korsan');
  });

  it('spells out the drawing defaults for a code without colour or eyes', () => {
    expect(normalizeLook('')).toBe(`c:${CAPSULE_CATALOG.colors[0]?.id} e:${DEFAULT_EYES}`);
    expect(CAPSULE_CATALOG.eyes.some((e) => e.id === DEFAULT_EYES)).toBe(true);
  });

  // K-52: the emotions are the phone's own and no slot of a code; one written in never reaches the
  // server's look ("kahkaha" is also a mouth part: as m:kahkaha it is the part, not the emotion).
  it('drops an emotion written into a code', () => {
    expect(CAPSULE_CATALOG.emotions.length).toBeGreaterThan(0);
    for (const { id } of CAPSULE_CATALOG.emotions) {
      expect(normalizeLook(`c:nane e:koyu ${id} d:${id} emotion:${id}`)).toBe('c:nane e:koyu');
    }
  });

  // profile/set-look takes a code up to LOOK_MAX_LENGTH; the longest canonical one fits well.
  it('writes a canonical code far below the longest set-look takes', () => {
    const longest = LOOK_SLOTS.map((slot) => {
      const ids =
        slot === 'c'
          ? CAPSULE_CATALOG.colors.map((c) => c.id)
          : slot === 'e'
            ? CAPSULE_CATALOG.eyes.map((e) => e.id)
            : CAPSULE_CATALOG.parts.filter((p) => p.slot === slot).map((p) => p.id);
      return `${slot}:${ids.reduce((a, b) => (b.length > a.length ? b : a), '')}`;
    }).join(' ');
    expect(normalizeLook(longest)).toBe(longest);
    expect(longest.length).toBeLessThan(LOOK_MAX_LENGTH / 2);
  });

  it('has no Fes and no Yıldız bıçak (K-51)', () => {
    const names = CAPSULE_CATALOG.parts.map((p) => p.name);
    expect(names).not.toContain('Fes');
    expect(names).not.toContain('Yıldız bıçak');
  });
});

describe('pickReadyLook', () => {
  it('gives one of the ready looks, the first and the last included', () => {
    const codes = CAPSULE_CATALOG.readyLooks.map((l) => l.code);
    expect(pickReadyLook(() => 0)).toBe(codes[0]);
    expect(pickReadyLook(() => 0.999999)).toBe(codes[codes.length - 1]);
    const random = seeded(7);
    for (let i = 0; i < 200; i++) expect(codes).toContain(pickReadyLook(random));
  });

  // K-50, rule 12: the start look takes no input but a random number.
  it('takes nothing about the person', () => {
    expect(pickReadyLook.length).toBe(1);
  });
});

describe('nick', () => {
  it('never gives the rude pairs and numbers of content/profanity-tr.json', () => {
    expect(NICK_EXCLUSIONS.letterPairs).toEqual(['am', 'mk', 'sk', 'sg', 'gt']);
    expect(NICK_EXCLUSIONS.numbers).toEqual(['31', '69']);
    const pairs = nickLetterPairs();
    for (const pair of NICK_EXCLUSIONS.letterPairs) expect(pairs).not.toContain(pair);
    expect(nickNumbers(2)).not.toContain('31');
    expect(nickNumbers(2)).not.toContain('69');
    for (const n of ['131', '310', '690', '169', '069']) expect(nickNumbers(3)).not.toContain(n);
    const random = seeded(1);
    for (let i = 0; i < 2000; i++) {
      const nick = randomNick(i % 2 === 0 ? 2 : 3, random);
      expect(isGeneratedNick(nick), nick).toBe(true);
    }
  });

  it('is "kapsul-" with two of the letters and two or three digits', () => {
    expect(NICK_LETTERS).toBe('abcdefghkmnprstuvyz');
    expect(randomNick(2, () => 0)).toBe('kapsul-aa00');
    expect(randomNick(3, () => 0)).toBe('kapsul-aa000');
    expect(randomNick(2, () => 0.999999)).toBe('kapsul-zz99');
    expect(NICK_PATTERN.test('kapsul-xx55')).toBe(false); // x is not one of the letters
    expect(NICK_PATTERN.test('kapsul-zz555')).toBe(true);
    expect(NICK_PATTERN.test('kapsul-zz5555')).toBe(false);
    expect(isGeneratedNick('kapsul-am12')).toBe(false);
    expect(isGeneratedNick('kapsul-ab69')).toBe(false);
  });

  // §4.D: 19 × 19 × 100 = 36.100 before the exclusions.
  it('counts the capacity without the excluded pairs and numbers', () => {
    expect(nickLetterPairs()).toHaveLength(19 * 19 - 5);
    expect(nickNumbers(2)).toHaveLength(98);
    expect(nickCapacity(2)).toBe(356 * 98);
    // 1000 less the numbers with 31 in them (31x and x31, 10 each; none has it twice) and the 20
    // with 69; none has both.
    expect(nickNumbers(3)).toHaveLength(1000 - 2 * 20);
    expect(nickCapacity(3)).toBe(356 * 960);
  });

  it('moves to three digits past half the two-digit capacity, never back', () => {
    const half = nickCapacity(2) / 2;
    expect(nickDigits(0)).toBe(2);
    expect(nickDigits(Math.floor(half))).toBe(2);
    expect(nickDigits(Math.floor(half) + 1)).toBe(3);
    expect(nickDigits(nickCapacity(2) * 3)).toBe(3);
  });
});

describe('nickRefreshAt', () => {
  it('allows the first refresh at once and the next one 30 days later (K-9)', () => {
    const now = new Date('2026-11-10T12:00:00Z');
    expect(nickRefreshAt(null, now)).toBeNull();
    expect(nickRefreshAt('2026-11-01T12:00:00Z', now)).toBe('2026-12-01T12:00:00.000Z');
    expect(nickRefreshAt('2026-10-11T12:00:00Z', now)).toBeNull();
    expect(nickRefreshAt('2026-10-11T12:00:01Z', now)).toBe('2026-11-10T12:00:01.000Z');
  });
});
