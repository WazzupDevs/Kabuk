// The capsule identity (docs/SPEC_V4.md §4.D; K-9, K-46, K-50, K-61): the look and the nick an
// anonymous person shows. Both are the account's own, assigned on the server and stored when written
// (a message and a table member keep the look they were written with). The catalog and the nick
// exclusions come from capsuleCatalog.ts, which `pnpm seed` generates from
// content/capsule-catalog.json and content/profanity-tr.json → capsuleNick.
import { CAPSULE_CATALOG, NICK_EXCLUSIONS } from './capsuleCatalog.ts';

export type CapsuleCatalog = {
  colors: readonly { id: string }[];
  eyes: readonly { id: string }[];
  parts: readonly { id: string; slot: string }[];
  readyLooks: readonly { code: string }[];
};

export type NickExclusions = { letterPairs: readonly string[]; numbers: readonly string[] };

// A look code is "slot:id" tokens in this order: colour, eyes, head, face, mouth, neck
// (kapsul-cizim-kutuphanesi.js → SLOTS), e.g. "c:pembe e:koyu h:kulaklik".
export const LOOK_SLOTS = ['c', 'e', 'h', 'f', 'm', 'n'] as const;
export type LookSlot = (typeof LOOK_SLOTS)[number];

// The drawing library's own defaults: a code without a known colour draws the catalog's first
// colour, one without known eyes the "klasik" eyes. The canonical code spells them out.
export const DEFAULT_EYES = 'klasik';

function isLookSlot(value: string): value is LookSlot {
  return (LOOK_SLOTS as readonly string[]).includes(value);
}

// The canonical code: one id per slot, the first known one; unknown tokens, unknown ids and parts
// in a slot that is not theirs are dropped (K-46: "bilinmeyen parça atılır").
export function normalizeLook(code: string, catalog: CapsuleCatalog = CAPSULE_CATALOG): string {
  const known: Record<LookSlot, Set<string>> = {
    c: new Set(catalog.colors.map((c) => c.id)),
    e: new Set(catalog.eyes.map((e) => e.id)),
    h: new Set(),
    f: new Set(),
    m: new Set(),
    n: new Set(),
  };
  for (const part of catalog.parts) {
    if (isLookSlot(part.slot) && part.slot !== 'c' && part.slot !== 'e') {
      known[part.slot].add(part.id);
    }
  }

  const picked = new Map<LookSlot, string>();
  for (const token of code.trim().split(/\s+/)) {
    const colon = token.indexOf(':');
    if (colon < 1) continue;
    const slot = token.slice(0, colon);
    const id = token.slice(colon + 1);
    if (!isLookSlot(slot) || picked.has(slot) || !known[slot].has(id)) continue;
    picked.set(slot, id);
  }
  const firstColor = catalog.colors[0]?.id;
  if (!picked.has('c') && firstColor !== undefined) picked.set('c', firstColor);
  if (!picked.has('e') && known.e.has(DEFAULT_EYES)) picked.set('e', DEFAULT_EYES);
  return LOOK_SLOTS.flatMap((slot) => {
    const id = picked.get(slot);
    return id === undefined ? [] : [`${slot}:${id}`];
  }).join(' ');
}

// The 28 ready looks (K-61); one of them is the start look, at random and never from the gender
// (K-50, rule 12). `random` returns a number in [0, 1), like Math.random.
export function pickReadyLook(
  random: () => number,
  catalog: CapsuleCatalog = CAPSULE_CATALOG,
): string {
  const looks = catalog.readyLooks;
  const look = looks[Math.min(Math.floor(random() * looks.length), looks.length - 1)];
  if (look === undefined) throw new Error('The capsule catalog has no ready looks.');
  return look.code;
}

// The nick: "kapsul-" and two letters and two digits ("kapsul-xx55"); from half full on, three
// digits ("kapsul-xx555").
export const NICK_PREFIX = 'kapsul-';
export const NICK_LETTERS = 'abcdefghkmnprstuvyz';
export type NickDigits = 2 | 3;

// A refreshed nick (profile/refresh-nick, K-9): once in this many days.
export const NICK_REFRESH_DAYS = 30;

// When the next refresh is allowed; null when it is now (never refreshed, or 30 days have passed).
export function nickRefreshAt(changedAt: string | null, now: Date): string | null {
  if (changedAt === null) return null;
  const next = new Date(new Date(changedAt).getTime() + NICK_REFRESH_DAYS * 24 * 60 * 60 * 1000);
  return next > now ? next.toISOString() : null;
}

// Past this share of the two-digit capacity taken (assigned and retired nicks), new nicks get three
// digits. Nicks already given keep theirs.
export const NICK_FULL_SHARE = 0.5;

// A nick ready for the database's check (the format only; the exclusions are a rule of generation).
export const NICK_PATTERN = new RegExp(`^${NICK_PREFIX}[${NICK_LETTERS}]{2}[0-9]{2,3}$`);

export function nickLetterPairs(exclusions: NickExclusions = NICK_EXCLUSIONS): string[] {
  const excluded = new Set(exclusions.letterPairs);
  const pairs: string[] = [];
  for (const first of NICK_LETTERS) {
    for (const second of NICK_LETTERS) {
      const pair = `${first}${second}`;
      if (!excluded.has(pair)) pairs.push(pair);
    }
  }
  return pairs;
}

// Zero-padded numbers with no excluded number in them: "31" and "69" are out, and with three digits
// so are "131", "310", "690" and the like.
export function nickNumbers(
  digits: NickDigits,
  exclusions: NickExclusions = NICK_EXCLUSIONS,
): string[] {
  const numbers: string[] = [];
  for (let n = 0; n < 10 ** digits; n++) {
    const number = String(n).padStart(digits, '0');
    if (!exclusions.numbers.some((excluded) => number.includes(excluded))) numbers.push(number);
  }
  return numbers;
}

export function nickCapacity(
  digits: NickDigits,
  exclusions: NickExclusions = NICK_EXCLUSIONS,
): number {
  return nickLetterPairs(exclusions).length * nickNumbers(digits, exclusions).length;
}

// `taken` counts every nick given so far, assigned and retired.
export function nickDigits(
  taken: number,
  exclusions: NickExclusions = NICK_EXCLUSIONS,
): NickDigits {
  return taken > nickCapacity(2, exclusions) * NICK_FULL_SHARE ? 3 : 2;
}

export function randomNick(
  digits: NickDigits,
  random: () => number,
  exclusions: NickExclusions = NICK_EXCLUSIONS,
): string {
  const pick = (list: readonly string[]): string =>
    list[Math.min(Math.floor(random() * list.length), list.length - 1)] ?? '';
  return `${NICK_PREFIX}${pick(nickLetterPairs(exclusions))}${pick(nickNumbers(digits, exclusions))}`;
}

// A nick generation could give: the format, and no excluded pair or number.
export function isGeneratedNick(
  nick: string,
  exclusions: NickExclusions = NICK_EXCLUSIONS,
): boolean {
  if (!NICK_PATTERN.test(nick)) return false;
  const rest = nick.slice(NICK_PREFIX.length);
  const pair = rest.slice(0, 2);
  const number = rest.slice(2);
  if (exclusions.letterPairs.includes(pair)) return false;
  return !exclusions.numbers.some((excluded) => number.includes(excluded));
}
