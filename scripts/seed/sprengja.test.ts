import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { parseProfanity, parseSprengjaLetterGroups } from './content.ts';
import { cardsSql } from './sections.ts';
import { upperTr } from '../../supabase/functions/_shared/pure/trText.ts';

const read = (path: string): unknown =>
  JSON.parse(readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8'));
const profanity = parseProfanity(read('content/profanity-tr.json'));
const file = (groups: Record<string, string[]>) => ({ groups });
const filler = (n: number, from = 0) =>
  Array.from(
    { length: n },
    (_, i) => `${'abcçdefgğh'[(from + i) % 10]}${'ıioöuü'[Math.floor((from + i) / 10)]}`,
  );

describe('content/sprengja-letter-groups.json (docs/decisions/sprengja-harf-grubu-v3.md)', () => {
  const groups = parseSprengjaLetterGroups(read('content/sprengja-letter-groups.json'), profanity);

  it('holds the approved 96 groups: 40 kolay, 36 orta, 20 zor', () => {
    const count = (tier: string) => groups.filter((g) => g.tier === tier).length;
    expect([count('kolay'), count('orta'), count('zor')]).toEqual([40, 36, 20]);
    expect(groups.find((g) => g.group === 'kar')?.tier).toBe('orta');
    expect(groups.find((g) => g.group === 'us')?.tier).toBe('zor');
  });

  it('shows ı and i apart in capitals (upperTr)', () => {
    expect(upperTr('sı')).toBe('SI');
    expect(upperTr('si')).toBe('Sİ');
  });

  it('refuses a bad group, a repeat, an unknown tier, a listed word and too few groups', () => {
    const ok = { kolay: filler(5), orta: filler(3, 5), zor: filler(2, 8) };
    expect(parseSprengjaLetterGroups(file(ok), profanity)).toHaveLength(10);
    expect(() => parseSprengjaLetterGroups(file({ ...ok, zor: ['Ka', 'xy'] }), profanity)).toThrow(
      'lowercase letters',
    );
    expect(() => parseSprengjaLetterGroups(file({ ...ok, zor: ['kayk'] }), profanity)).toThrow(
      'lowercase letters',
    );
    expect(() =>
      parseSprengjaLetterGroups(file({ ...ok, zor: [ok.kolay[0] as string] }), profanity),
    ).toThrow('twice');
    expect(() => parseSprengjaLetterGroups(file({ ...ok, zorlu: ['ka'] }), profanity)).toThrow(
      'unknown tier',
    );
    expect(() => parseSprengjaLetterGroups(file({ ...ok, zor: ['göt'] }), profanity)).toThrow(
      'profanity list',
    );
    expect(() => parseSprengjaLetterGroups(file({ ...ok, zor: ['kal'] }), profanity)).toThrow(
      'starts a word',
    );
    expect(() =>
      parseSprengjaLetterGroups(
        file({ kolay: filler(3), orta: filler(1, 3), zor: filler(9, 4) }),
        profanity,
      ),
    ).toThrow('kolay + orta fewer than 5');
    expect(() =>
      parseSprengjaLetterGroups(
        file({ kolay: filler(4), orta: filler(1, 4), zor: filler(2, 5) }),
        profanity,
      ),
    ).toThrow('fewer than 8');
  });

  it('seeds one card a group: word the group, theme the tier, retiring the rest', () => {
    const sql = cardsSql([], [], [], [], [], [], [{ group: 'kar', tier: 'orta' }]);
    expect(sql).toContain("('sprengja', 'kar', 'kar', null, 'orta', null)");
    expect(sql).toContain(
      "where deck = 'sprengja' and is_active and source_key <> all (array['kar']::text[])",
    );
  });
});
