import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { NICK_LETTERS, NICK_PATTERN } from '../../supabase/functions/_shared/pure/capsule.ts';
import {
  CAPSULE_CATALOG,
  NICK_EXCLUSIONS,
} from '../../supabase/functions/_shared/pure/capsuleCatalog.ts';
import {
  buildCapsuleModule,
  CAPSULE_MODULE,
  parseCapsuleCatalog,
  parseNickExclusions,
} from './capsule.ts';

const root = resolve(import.meta.dirname, '../..');
const catalog = JSON.parse(readFileSync(resolve(root, 'content/capsule-catalog.json'), 'utf8'));

describe(CAPSULE_MODULE, () => {
  // §4.D, K-46: the app and the server read the same list; it is the one built from content/.
  it('is the module built from the current content (run `pnpm seed`)', async () => {
    expect(readFileSync(resolve(root, CAPSULE_MODULE), 'utf8')).toBe(
      await buildCapsuleModule(root),
    );
  });
});

describe('parseCapsuleCatalog', () => {
  it('reads the v46 catalog: 16 colours, 23 eyes, 173 parts, 28 ready looks', () => {
    const parsed = parseCapsuleCatalog(catalog);
    expect(parsed.colors).toHaveLength(16);
    expect(parsed.eyes).toHaveLength(23);
    expect(parsed.parts).toHaveLength(173);
    expect(parsed.readyLooks).toHaveLength(28);
    // K-61: Melek and Tavşan cream, Viking with horns and a beard.
    const look = (name: string) => parsed.readyLooks.find((l) => l.name === name)?.code;
    expect(look('Melek')).toBe('c:krem e:koyu h:hale m:gulumse');
    expect(look('Tavşan')).toBe('c:krem e:koyu h:tavsan');
    expect(look('Viking')).toBe('c:mercan e:klasik h:boynuz m:sakal');
  });

  it('refuses a ready look with a part the library does not have', () => {
    const bad = {
      ...catalog,
      readyLooks: [{ name: 'Miğferli', code: 'c:mor e:klasik h:migfer' }],
    };
    expect(() => parseCapsuleCatalog(bad)).toThrow(/not a canonical look/);
  });

  it('refuses a part in a pack its rack does not list, and an id twice', () => {
    const part = catalog.parts[0];
    expect(() => parseCapsuleCatalog({ ...catalog, parts: [{ ...part, pack: 'Yok' }] })).toThrow(
      /no pack/,
    );
    expect(() => parseCapsuleCatalog({ ...catalog, parts: [part, part] })).toThrow(/twice/);
  });
});

describe('parseNickExclusions', () => {
  it('needs pairs of the nick letters and digit strings', () => {
    expect(parseNickExclusions({ capsuleNick: { letterPairs: ['am'], numbers: ['31'] } })).toEqual({
      letterPairs: ['am'],
      numbers: ['31'],
    });
    expect(() =>
      parseNickExclusions({ capsuleNick: { letterPairs: ['ax'], numbers: [] } }),
    ).toThrow(/letterPairs/);
    expect(() => parseNickExclusions({ capsuleNick: { letterPairs: [], numbers: ['a'] } })).toThrow(
      /numbers/,
    );
    expect(() => parseNickExclusions({ terms: [] })).toThrow(/capsuleNick/);
  });
});

// The identity migration gives the accounts from before step 4.4 their nicks and looks in SQL; its
// letters, exclusions and looks are pure/capsule.ts's and the catalog's.
describe('supabase/migrations/20261103090000_identity.sql', () => {
  const migration = readFileSync(
    resolve(root, 'supabase/migrations/20261103090000_identity.sql'),
    'utf8',
  );
  const textArray = (name: string): string[] => {
    const match = migration.match(
      new RegExp(`${name} constant text\\[\\] := array\\[([^\\]]*)\\]`),
    );
    return [...(match?.[1] ?? '').matchAll(/'([^']*)'/g)].map((m) => m[1] ?? '');
  };

  it('backfills with the nick rules and the ready looks of pure/', () => {
    expect(migration.match(/letters constant text := '([a-z]+)'/)?.[1]).toBe(NICK_LETTERS);
    expect(textArray('excluded_pairs')).toEqual(NICK_EXCLUSIONS.letterPairs);
    expect(textArray('excluded_numbers')).toEqual(NICK_EXCLUSIONS.numbers);
    expect(textArray('looks')).toEqual(CAPSULE_CATALOG.readyLooks.map((l) => l.code));
    // The nick column's check is the format of pure/capsule.ts.
    expect(migration).toContain(`check (capsule_nick ~ '${NICK_PATTERN.source}')`);
  });
});
