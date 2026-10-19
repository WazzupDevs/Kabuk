// TextInput's maxLength counts UTF-16 units, the server counts characters (code points): an emoji
// is two units, so a native limit of 80 stopped a bio at about 40 emoji (the CTO's review of K-34).
// The units this text may grow to so that it holds at most `max` characters: the units it has, and
// one more for each character left. With one character left, an emoji (two units) does not fit.
export function maxLengthFor(text: string, max: number): number {
  return text.length + Math.max(0, max - [...text].length);
}
