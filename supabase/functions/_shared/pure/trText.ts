// Turkish text matching (MVP_SPEC §6). Dependency-free; used by the app and Edge Functions.
// The only place for text matching (CLAUDE.md rule 7).

const FOLD: Record<string, string> = { ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u' };

// fold: false keeps ç ğ ı ö ş ü. Profanity matching uses it, because folding makes everyday words
// collide with listed ones (sık → sik, got → göt).
export type TextOptions = { fold?: boolean };

// Turkish lowercase, fold ç ğ ı ö ş ü (unless fold: false), and turn everything but letters and
// digits into spaces.
export function normalize(s: string, { fold = true }: TextOptions = {}): string {
  const lower = s.toLocaleLowerCase('tr-TR');
  const folded = fold ? lower.replace(/[çğıöşü]/g, (c) => FOLD[c] ?? c) : lower;
  return folded.replace(/[^\p{L}\p{N}]/gu, ' ');
}

// Splits a normalized string into words and joins runs of single letters ("d e n i z" → "deniz").
export function tokenize(s: string, options: TextOptions = {}): string[] {
  const tokens: string[] = [];
  let letters = '';
  for (const token of normalize(s, options).split(' ')) {
    if (token === '') continue;
    if ([...token].length === 1) {
      letters += token;
      continue;
    }
    if (letters) tokens.push(letters);
    letters = '';
    tokens.push(token);
  }
  if (letters) tokens.push(letters);
  return tokens;
}

// Turkish uppercase for what the screen shows ("Kategori" → "KATEGORİ"). Done by hand for i and ı,
// so it does not depend on the phone's locale support (Android's textTransform makes "i" an "I").
export function upperTr(s: string): string {
  return s.replace(/i/g, 'İ').replace(/ı/g, 'I').toUpperCase();
}

// The first letter in Turkish uppercase, the rest as it is ("isim" → "İsim").
export function capitalizeTr(s: string): string {
  const [first = '', ...rest] = [...s];
  return upperTr(first) + rest.join('');
}

// Case suffixes on names, the only way a screen puts one on a name ("Martı" → "Martı'nın"). Spelling
// decides: an apostrophe, harmony from the last written vowel, n or y after a final vowel. A final
// number is read aloud (5'in, 6'nın, 10'un, 100'ün); an accented vowel counts as its base letter;
// w, q, x and letters of other alphabets are consonants; trailing symbols are skipped, though the
// suffix still follows the whole name; a name without a vowel takes the e-forms. Common names read
// with a soft l take a front vowel (Hilal'in, Kemal'e).
export type GrammaticalCase = 'genitive' | 'dative';

const VOWELS = new Set([...'aıoueiöü']);
const BACK = new Set([...'aıou']);
const ROUNDED = new Set([...'ouöü']);
// Accented vowels outside Turkish, by their base letter; any other letter is a consonant either way.
const ACCENTED: Record<string, string> = {};
for (const [base, accented] of [
  ['a', 'àáâãäåāăą'],
  ['e', 'èéêëēĕėęě'],
  ['i', 'ìíîïĩīĭį'],
  ['o', 'òóôõōŏőø'],
  ['u', 'ùúûũūŭůűų'],
] as const) {
  for (const c of accented) ACCENTED[c] = base;
}

const ONES = ['', 'bir', 'iki', 'üç', 'dört', 'beş', 'altı', 'yedi', 'sekiz', 'dokuz'];
const TENS = ['', 'on', 'yirmi', 'otuz', 'kırk', 'elli', 'altmış', 'yetmiş', 'seksen', 'doksan'];
const POWERS = ['bin', 'milyon', 'milyar', 'trilyon', 'katrilyon', 'kentilyon', 'seksilyon'];
// Names whose final l is soft: the suffix takes a front vowel, as after "e" (a language rule, not
// content). Matched on the whole last word, lowercased and with accents mapped (Kemâl → kemal).
const SOFT_L = new Set([
  'kemal',
  'cemal',
  'celal',
  'bilal',
  'hilal',
  'nihal',
  'meral',
  'ikbal',
  'iclal',
  'hayal',
]);

// The last word of a number read aloud: "5" → "beş", "10" → "on", "100" → "yüz", "2000" → "bin".
function lastNumberWord(digits: string): string {
  const zeros = digits.length - digits.replace(/0+$/, '').length;
  if (zeros === digits.length) return 'sıfır';
  const digit = Number(digits[digits.length - 1 - zeros]);
  if (zeros === 0) return ONES[digit] ?? '';
  if (zeros === 1) return TENS[digit] ?? '';
  if (zeros === 2) return 'yüz';
  return POWERS[Math.min(Math.floor(zeros / 3), POWERS.length) - 1] ?? '';
}

export function inflectTr(name: string, grammaticalCase: GrammaticalCase): string {
  // What is heard at the end: the name without trailing symbols, or its final number read aloud.
  const text = name.toLocaleLowerCase('tr-TR').replace(/[^\p{L}0-9]+$/u, '');
  const number = /[0-9]+$/.exec(text);
  const letters = [...(number ? lastNumberWord(number[0]) : text)].map((c) => ACCENTED[c] ?? c);
  const lastWord = /\p{L}*$/u.exec(letters.join(''))?.[0] ?? '';
  const lastVowel = SOFT_L.has(lastWord)
    ? 'e'
    : (letters.filter((c) => VOWELS.has(c)).at(-1) ?? 'e');
  const endsInVowel = VOWELS.has(letters.at(-1) ?? '');
  const back = BACK.has(lastVowel);
  const rounded = ROUNDED.has(lastVowel);
  const suffix =
    grammaticalCase === 'genitive'
      ? `${endsInVowel ? 'n' : ''}${back ? (rounded ? 'u' : 'ı') : rounded ? 'ü' : 'i'}n`
      : `${endsInVowel ? 'y' : ''}${back ? 'a' : 'e'}`;
  return `${name}'${suffix}`;
}
