// A venue's name short enough for one line of a list ticket (the owner's ask, 20 Kasım: every
// ticket the same size, a long word in a set short form). The page of the venue keeps the full name.
const SHORT: readonly [RegExp, string][] = [
  [/Üniversitesi/g, 'Üni.'],
  [/Üniversite/g, 'Üni.'],
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
  return SHORT.reduce((text, [long, short]) => text.replace(long, short), base);
}
