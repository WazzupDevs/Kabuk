// Profanity filter for chat, clues and guesses (MVP_SPEC §6). The list comes from
// content/profanity-tr.json (via the database). Matching lowercases with tr-TR rules but does NOT
// fold Turkish letters: folding makes everyday words collide with listed ones (sık → sik,
// "got it" → göt). ASCII spellings that collide with nothing are listed explicitly instead.
import { canonicalize, plainText, tokenize } from './trText.ts';

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
// or a display name, a way to reach someone off the app (rule 4). Rejected, never masked. Matched in
// trText's canonical form: full-width forms folded, invisible characters dropped, Turkish lowercase
// with ı as i ("@İrem" → "@irem", "INFO" → "info").
const PHONE_DIGITS = 10;
// A run of digits and the marks numbers are spaced with: "0532 123 45 67", "+90 (532) 123-45-67",
// "0532_123·45|67".
const DIGIT_RUN = /[+(]?\d[\d\s.\-()/_,·*|]*\d/g;
// O and l written for 0 and 1 next to a digit ("O532 l23 45 67"), for counting digits only.
const LOOKALIKE: Record<string, string> = { o: '0', l: '1' };
const YEAR = /^(?:1\d{3}|20\d{2})$/;
const DATE = /(^|\D)\d{1,2}[./-]\d{1,2}[./-](?:1\d{3}|20\d{2})(?!\d)/g;
// "elif [at] gmail [dot] com".
const BRACKET_AT = /[[({<]\s*(?:at|et)\s*[\])}>]/g;
const BRACKET_DOT = /[[({<]\s*(?:dot|nokta)\s*[\])}>]/g;
// Spaces around the @ and the dots: "elif @ gmail . com".
const EMAIL =
  /[\p{L}\p{N}._%+-]+\s*@\s*[a-z0-9-]+(?:\s*\.\s*[a-z0-9-]+)*\s*\.\s*[a-z]{2,}(?![\p{L}\p{N}])/u;
// No extension: "elif@gmail".
const MAIL_PROVIDER =
  /[\p{L}\p{N}._%+-]\s*@\s*(?:gmail|googlemail|hotmail|outlook|yahoo|icloud|yandex|protonmail|proton|live|msn|mynet)(?![\p{L}\p{N}])/u;
// "@elif.kaya", "@ elif", not the middle of an address ("mail@ desem").
const HANDLE = /(?:^|[^\p{L}\p{N}._@])@\s?(?=[\p{N}._]*\p{L})[\p{L}\p{N}._]{2,}/u;
const SCHEME = /https?:\/\/|\bwww\s*\./;
// Bare domains: "elifkaya.com.tr", "elif.ai"; not "severim.kahve". tv is left out ("film.tv
// izlerim"); a tv link with a path is still found.
const TLDS =
  'com|net|org|io|me|co|tr|app|dev|gg|ly|link|ee|xyz|info|biz|edu|ai|site|online|store|shop|club|live|art|blog|page|bio|social|space|tech|top|fm|cc';
const DOMAIN = new RegExp(
  `(?:^|[^\\p{L}\\p{N}.@-])[a-z0-9][a-z0-9-]*(?:\\.[a-z0-9-]+)*\\.(?:${TLDS})(?![\\p{L}\\p{N}])`,
  'u',
);
// Any extension before a path: "goo.gl/abc", "elif.site/abc".
const PATH_LINK =
  /(?:^|[^\p{L}\p{N}.@-])[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z0-9-]*[a-z][a-z0-9-]*\/[\p{L}\p{N}_]/u;
// A spaced dot, or a space for the dot, before a common extension and a path: "t. me/elif",
// "instagram com/elif". Not tr or app ("diller TR/EN", "iOS app/web").
const SPACED_LINK =
  /(?:^|[^\p{L}\p{N}.@-])[a-z0-9-]+(?:\s*\.\s*|\s+)(?:com|net|org|me|io|co|ly|gg|ee|link)\s*\/\s*[\p{L}\p{N}_]/u;
// A username after a platform's name without @: "ig: elif.kaya", "snap elif_k". The short names are
// also ordinary text ("x-men", "3 x 10 km"), so they count only with ":" or "=".
const PLATFORMS = 'instagram|insta|ig|snapchat|snap|telegram|tg|tiktok|twitter|discord|onlyfans';
const SHORT_PLATFORMS = ['x', 'sc', 'dc'];
const PLATFORM = new RegExp(
  `(?:^|[^\\p{L}\\p{N}])(${PLATFORMS}|${SHORT_PLATFORMS.join('|')})(?![\\p{L}\\p{N}])\\s*([:=-]?)\\s*([\\p{L}\\p{N}_.#]*)`,
  'gu',
);
// A full stop between a small letter and a capitalised word starts a sentence, not a domain
// ("Kafa dengi.Net konuşurum"); not in a word with an @ ("elif@Site.Com").
const SENTENCE_DOT = /(\p{Ll})\.(?=\p{Lu}\p{Ll})/gu;

const hasLetter = (s: string) => /\p{L}/u.test(s);

// "elif_k", "elif.kaya", "elif99", "elif#1234"; not "yok" or "yok.".
function looksLikeUsername(word: string): boolean {
  const w = word.replace(/[.#]+$/, '');
  return hasLetter(w) && /[_\d#]|[^.]\.[^.]/u.test(w);
}

function platformHandle(s: string): boolean {
  for (const [, name = '', mark = '', word = ''] of s.matchAll(PLATFORM)) {
    const short = SHORT_PLATFORMS.includes(name);
    if (mark === ':' || mark === '=') {
      if (hasLetter(word)) return true;
    } else if (!short && (mark === '-' ? hasLetter(word) : looksLikeUsername(word))) {
      return true;
    }
  }
  return false;
}

// At least 10 digits, unless every group is a year or a date ("1071 1453 1923", "2016-2020/2020-2022",
// "01.01.2000 - 31.12.2020").
function isPhone(run: string): boolean {
  if (run.replace(/\D/g, '').length < PHONE_DIGITS) return false;
  const groups = run.replace(DATE, '$1 ').split(/\D+/).filter(Boolean);
  return !groups.every((g) => YEAR.test(g));
}

export function containsContact(text: string): boolean {
  const sentences = plainText(text)
    .split(/(\s+)/)
    .map((word) => (word.includes('@') ? word : word.replace(SENTENCE_DOT, '$1 ')))
    .join('');
  const s = canonicalize(sentences).replace(BRACKET_AT, '@').replace(BRACKET_DOT, '.');
  const digits = s
    .replace(/[ol](?=\d)/g, (c) => LOOKALIKE[c] ?? c)
    .replace(/(\d)([ol])/g, (_, d: string, c: string) => d + (LOOKALIKE[c] ?? c));
  return (
    (digits.match(DIGIT_RUN) ?? []).some(isPhone) ||
    EMAIL.test(s) ||
    MAIL_PROVIDER.test(s) ||
    HANDLE.test(s) ||
    SCHEME.test(s) ||
    DOMAIN.test(s) ||
    PATH_LINK.test(s) ||
    SPACED_LINK.test(s) ||
    platformHandle(s)
  );
}
