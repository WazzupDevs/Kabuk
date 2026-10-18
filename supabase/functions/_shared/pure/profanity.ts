// Profanity filter for chat, clues and guesses (MVP_SPEC §6). The list comes from
// content/profanity-tr.json (via the database). Matching lowercases with tr-TR rules but does NOT
// fold Turkish letters: folding makes everyday words collide with listed ones (sık → sik,
// "got it" → göt). ASCII spellings that collide with nothing are listed explicitly instead.
import { tokenize } from './trText.ts';

// Words of this many letters or more also match with suffixes ("orospular"); shorter ones only
// as whole words ("göt" but not "götürdüm"). `wholeWords` are longer terms that also match only
// as whole words because an everyday word starts with them ("ananı" but not "ananın").
const PREFIX_MIN_LENGTH = 5;
const UNFOLDED = { fold: false } as const;

export type PreparedTerms = { prefixes: string[]; exact: string[]; phrases: string[] };

export function prepareTerms(
  terms: readonly string[],
  wholeWords: readonly string[] = [],
): PreparedTerms {
  const prepared: PreparedTerms = { prefixes: [], exact: [], phrases: [] };
  const add = (term: string, wholeWord: boolean) => {
    const tokens = tokenize(term, UNFOLDED);
    const [word] = tokens;
    if (tokens.length > 1) prepared.phrases.push(tokens.join(' '));
    else if (word && !wholeWord && [...word].length >= PREFIX_MIN_LENGTH) {
      prepared.prefixes.push(word);
    } else if (word) prepared.exact.push(word);
  };
  for (const term of terms) add(term, false);
  for (const term of wholeWords) add(term, true);
  return prepared;
}

export function containsProfanity(text: string, terms: PreparedTerms): boolean {
  // tokenize also joins spaced-out letters ("o r o s p u").
  const tokens = tokenize(text, UNFOLDED);
  const joined = ` ${tokens.join(' ')} `;
  if (terms.phrases.some((p) => joined.includes(` ${p} `))) return true;
  return tokens.some(
    (token) => terms.exact.includes(token) || terms.prefixes.some((p) => token.startsWith(p)),
  );
}

// K-34 (docs/SPEC_V4.md §4.C): a phone number, an e-mail address, a username or a link in a bio
// or a display name, a way to reach someone off the app (rule 4). Rejected, never masked. Contact
// details are ASCII, so this lowercases without Turkish rules ("INFO" → "info", not "ınfo").
const PHONE_DIGITS = 10;
// A run of digits and the marks numbers are spaced with: "0532 123 45 67", "+90 (532) 123-45-67".
const DIGIT_RUN = /[+(]?\d[\d\s.\-()/]*\d/g;
const EMAIL = /[\p{L}\p{N}._%+-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,}/u;
// "@elif.kaya", not the middle of an address.
const HANDLE = /(?:^|[^\p{L}\p{N}._@])@[a-z0-9._]{2,}/u;
const SCHEME = /(?:https?:\/\/|\bwww\.)/;
const TLDS = 'com|net|org|io|me|co|tr|app|dev|gg|tv|ly|link|ee|xyz|info|biz|edu';
// "instagram.com/elif", "t.me/deniz", "elifkaya.com.tr"; not "severim.kahve".
const DOMAIN = new RegExp(
  `(?:^|[^\\p{L}\\p{N}.@-])[a-z0-9][a-z0-9-]*(?:\\.[a-z0-9-]+)*\\.(?:${TLDS})(?![\\p{L}\\p{N}])`,
  'u',
);

export function containsContact(text: string): boolean {
  const s = text.toLowerCase();
  const phone = (s.match(DIGIT_RUN) ?? []).some(
    (run) => run.replace(/\D/g, '').length >= PHONE_DIGITS,
  );
  return phone || EMAIL.test(s) || HANDLE.test(s) || SCHEME.test(s) || DOMAIN.test(s);
}
