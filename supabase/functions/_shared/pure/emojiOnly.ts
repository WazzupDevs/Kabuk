// A message of emoji only (one to three, spaces between allowed) is drawn large and without a
// bubble, as Telegram Android draws it (the owner's call, 30 Ekim). By code point ranges, not a
// Unicode property escape: the app's JavaScript engine (Hermes) is not relied on for those.
export const EMOJI_ONLY_MAX = 3;

const ZWJ = 0x200d;
const KEYCAP = 0x20e3;

// Pictographs that stand as an emoji on their own.
function isBase(cp: number): boolean {
  return (
    (cp >= 0x1f000 && cp <= 0x1faff) ||
    (cp >= 0x2600 && cp <= 0x27bf) ||
    (cp >= 0x2300 && cp <= 0x23ff) ||
    (cp >= 0x2b00 && cp <= 0x2bff) ||
    (cp >= 0x2190 && cp <= 0x21ff) ||
    (cp >= 0x25aa && cp <= 0x25fe) ||
    cp === 0x00a9 ||
    cp === 0x00ae ||
    cp === 0x203c ||
    cp === 0x2049 ||
    cp === 0x2122 ||
    cp === 0x2139 ||
    cp === 0x24c2 ||
    cp === 0x3030 ||
    cp === 0x303d ||
    cp === 0x3297 ||
    cp === 0x3299
  );
}

// What joins or changes an emoji without being one: the joiner, variation selectors, skin tones,
// the keycap and tag characters (flags of regions).
function isModifier(cp: number): boolean {
  return (
    cp === ZWJ ||
    cp === 0xfe0f ||
    cp === 0xfe0e ||
    cp === KEYCAP ||
    (cp >= 0x1f3fb && cp <= 0x1f3ff) ||
    (cp >= 0xe0020 && cp <= 0xe007f)
  );
}

const isRegional = (cp: number) => cp >= 0x1f1e6 && cp <= 0x1f1ff;

// How many emoji the message is, when it is emoji only and at most EMOJI_ONLY_MAX of them; else 0.
export function emojiOnly(text: string): number {
  let count = 0;
  let joined = false;
  let regionalOpen = false;
  for (const ch of text) {
    const cp = ch.codePointAt(0) ?? 0;
    if (ch.trim() === '') {
      joined = false;
      regionalOpen = false;
      continue;
    }
    if (isModifier(cp)) {
      joined = cp === ZWJ;
      continue;
    }
    if (!isBase(cp)) return 0;
    // A flag is two regional letters; a joined sequence (a family, a profession) is one emoji.
    if (isRegional(cp)) {
      if (regionalOpen) {
        regionalOpen = false;
        continue;
      }
      regionalOpen = true;
    } else {
      regionalOpen = false;
    }
    if (joined) {
      joined = false;
      continue;
    }
    count += 1;
    if (count > EMOJI_ONLY_MAX) return 0;
  }
  return count;
}
