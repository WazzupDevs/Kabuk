// A venue's name short enough for one line of a list ticket (the owner's ask, 20 Kasım: every
// ticket the same size, a long word in a set short form). The page of the venue keeps the full name.
// A university's name is never shortened to "Üni." (the owner's ask, 24 Kasım): a name longer than
// NAME_LIMIT characters is cut there and ends in "…" (the owner's call, in place of the rule that
// no text ends in "...", for this line only).
export const NAME_LIMIT = 22;
const SHORT: readonly [RegExp, string][] = [
  [/Fakültesi/g, 'Fak.'],
  [/Yerleşkesi/g, 'Yerl.'],
  [/Kampüsü/g, 'Kamp.'],
  [/Mahallesi/g, 'Mah.'],
  [/Caddesi/g, 'Cad.'],
];

// A campus is listed under its university's name alone: what follows "Üniversitesi" (the campus's
// own name) is left out (the owner's call, 20 Kasım); the district under it says which campus.
const AFTER_UNIVERSITY = /(Üniversitesi)\s.+$/;

export function shortVenueName(name: string): string {
  const base = name.replace(AFTER_UNIVERSITY, '$1');
  const short = SHORT.reduce((text, [long, to]) => text.replace(long, to), base);
  const letters = Array.from(short);
  return letters.length > NAME_LIMIT
    ? letters.slice(0, NAME_LIMIT).join('').trimEnd() + '…'
    : short;
}
