// The pack accessories' drawings (docs/SPEC_V4.md §4.U; Aura v134 KapsulAksesuar), drawn on the
// canvas's own capsule: a 100-unit box, the body 52 wide with its top at 22 and the visor's middle
// at 52. Each is set on the app's capsule (capsuleDrawing.js: the body 28 wide, its top at 8, the
// visor's middle at 20.5) by its anchor: a hat by the head's top, glasses by the visor, the
// headphones half way (their band on the head, their cups by the visor).
export type AccessoryAnchor = 'head' | 'face' | 'mid';

export const ACCESSORY_ART: Readonly<Record<string, { anchor: AccessoryAnchor; art: string }>> = {
  bere: {
    anchor: 'head',
    art: '<defs><clipPath id="bere-c"><path d="M17 33C13 21 29 9 51 9C74 9 89 19 85 31C82 37 22 40 17 33Z"/></clipPath></defs><path d="M17 33C13 21 29 9 51 9C74 9 89 19 85 31C82 37 22 40 17 33Z" fill="#2FA8E0"/><g clip-path="url(#bere-c)"><path d="M60 0H100V50H58C66 34 66 18 60 0Z" fill="#1F86BC"/><path d="M22 27C24 18 34 12 46 12C36 15 29 21 27 30Z" fill="#8FDCFA"/><path d="M30 20q6 -3 12 -3M38 26q8 -4 16 -4M56 15q8 0 14 3M62 24q8 0 14 3" fill="none" stroke="#1B74A8" stroke-width="1.4" stroke-linecap="round" opacity=".55"/></g><rect x="19" y="30" width="64" height="10" rx="5" fill="#FF4F8B"/><path d="M62 30H78a5 5 0 0 1 0 10H62Z" fill="#D93A73"/><path d="M23 35H79" fill="none" stroke="#FFC2D6" stroke-width="1.2" stroke-dasharray="2.4 2"/><rect x="48.5" y="3" width="4" height="8" rx="2" fill="#1B1530"/><circle cx="28" cy="35" r="3.4" fill="#F2C230"/><circle cx="27" cy="34" r="1.2" fill="#FFF1B8"/>',
  },
  yuvarlakgozluk: {
    anchor: 'face',
    art: '<circle cx="38" cy="52" r="11" fill="#BFE6FF" opacity=".45"/><path d="M31 50l5 -6M34 55l9 -10" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" opacity=".85"/><circle cx="38" cy="52" r="11" fill="none" stroke="#1B1530" stroke-width="4.6"/><path d="M28.4 48A11 11 0 0 1 40 41" fill="none" stroke="#5A4E86" stroke-width="1.6" stroke-linecap="round"/><circle cx="27" cy="49" r="1.6" fill="#F2C230"/><circle cx="62" cy="52" r="11" fill="#BFE6FF" opacity=".45"/><path d="M55 50l5 -6M58 55l9 -10" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" opacity=".85"/><circle cx="62" cy="52" r="11" fill="none" stroke="#1B1530" stroke-width="4.6"/><path d="M52.4 48A11 11 0 0 1 64 41" fill="none" stroke="#5A4E86" stroke-width="1.6" stroke-linecap="round"/><circle cx="73" cy="49" r="1.6" fill="#F2C230"/><path d="M48.5 50q1.5 -3.5 3 0" fill="none" stroke="#1B1530" stroke-width="3.6" stroke-linecap="round"/><path d="M24 49H19M76 49H81" stroke="#1B1530" stroke-width="3.6" stroke-linecap="round"/>',
  },
  kasket: {
    anchor: 'head',
    art: '<defs><clipPath id="kasket-c"><path d="M23 35C23 15 35 8 50 8C65 8 77 15 77 35Z"/></clipPath></defs><path d="M23 35C23 15 35 8 50 8C65 8 77 15 77 35Z" fill="#1FB5A8"/><g clip-path="url(#kasket-c)"><path d="M60 0H100V40H62C66 26 65 12 60 0Z" fill="#14897F"/><path d="M27 30C27 19 34 12 42 11C36 15 32 22 31 32Z" fill="#7FEDE6"/><path d="M50 8V35M37 11C33 18 32 27 33 35M63 11C67 18 68 27 67 35" fill="none" stroke="#0E6E66" stroke-width="1.4" opacity=".6"/></g><circle cx="50" cy="8.5" r="3.6" fill="#0B783D"/><circle cx="49" cy="7.5" r="1.2" fill="#3DDC84"/><path d="M40 22.5 42 27 47 27.6 43.3 30.8 44.4 35.5 40 33 35.6 35.5 36.7 30.8 33 27.6 38 27Z" fill="#F2C230"/><path d="M46 32H86C92 32 94 39 88 41H46Z" fill="#0B783D"/><path d="M46 38H88C90 38 91 40 88 41H46Z" fill="#075A2D"/><path d="M50 35.2H85" stroke="#3DDC84" stroke-width="1.1" stroke-dasharray="2.2 1.8"/><rect x="23" y="33" width="54" height="4" rx="2" fill="#14897F"/>',
  },
  kulaklik: {
    anchor: 'mid',
    art: '<path d="M19 54C19 12 81 12 81 54" fill="none" stroke="#1B1530" stroke-width="7" stroke-linecap="round"/><path d="M29 25C40 13 60 13 71 25" fill="none" stroke="#FF4F8B" stroke-width="7" stroke-linecap="round"/><path d="M31 24C41 15 59 15 69 24" fill="none" stroke="#FFC2D6" stroke-width="1.2" stroke-dasharray="2 2"/><path d="M56 16C62 17 67 20 71 25" fill="none" stroke="#D93A73" stroke-width="3" stroke-linecap="round"/><rect x="16" y="36" width="7" height="10" rx="2" fill="#B9C2CC"/><rect x="77" y="36" width="7" height="10" rx="2" fill="#8E98A4"/><rect x="9" y="43" width="19" height="29" rx="9.5" fill="#FF4F8B"/><path d="M20 43h-1.5a9.5 9.5 0 0 1 9.5 9.5v10a9.5 9.5 0 0 1 -9.5 9.5H20Z" fill="#D93A73"/><rect x="12" y="47" width="3" height="10" rx="1.5" fill="#FFC2D6"/><rect x="25" y="47" width="4" height="21" rx="2" fill="#B83265"/><rect x="72" y="43" width="19" height="29" rx="9.5" fill="#FF4F8B"/><path d="M83 43h-1.5a9.5 9.5 0 0 1 9.5 9.5v10a9.5 9.5 0 0 1 -9.5 9.5H83Z" fill="#D93A73"/><rect x="71" y="47" width="4" height="21" rx="2" fill="#B83265"/><circle cx="82" cy="57.5" r="3.6" fill="#F2C230"/><circle cx="81" cy="56.5" r="1.2" fill="#FFF1B8"/><circle cx="18.5" cy="57.5" r="3.6" fill="#F2C230"/><circle cx="17.5" cy="56.5" r="1.2" fill="#FFF1B8"/>',
  },
  buyucusapkasi: {
    anchor: 'head',
    art: '<defs><clipPath id="buyucu-c"><path d="M29 34C37 22 44 8 58 -4C59 3 63 6 68 6C64 14 68 24 72 34Z"/></clipPath></defs><path d="M29 34C37 22 44 8 58 -4C59 3 63 6 68 6C64 14 68 24 72 34Z" fill="#7B5CFF"/><g clip-path="url(#buyucu-c)"><path d="M56 -10H100V40H66C62 24 60 10 56 -10Z" fill="#5A3FD6"/><path d="M33 32C40 22 46 12 54 4C49 13 44 23 39 33Z" fill="#A592FF"/><path d="M60 15a4 4 0 1 0 2 7a3.2 3.2 0 1 1 -2 -7Z" fill="#F2C230"/><path d="M45 22l.8 1.8 1.8.8-1.8.8-.8 1.8-.8-1.8-1.8-.8 1.8-.8Z" fill="#FFF1B8"/><circle cx="52" cy="9" r="1.1" fill="#FFF1B8"/><circle cx="64" cy="28" r="1" fill="#FFF1B8"/></g><path d="M66 6C70 5 73 7 74 10C71 9 68 9 66 6Z" fill="#5A3FD6"/><circle cx="74.5" cy="10.5" r="2.6" fill="#F2C230"/><rect x="27" y="27" width="46" height="7" rx="2" fill="#F2C230"/><path d="M60 27H71a2 2 0 0 1 2 2v3a2 2 0 0 1 -2 2H60Z" fill="#C99A1A"/><rect x="45" y="26" width="9" height="9" rx="2" fill="none" stroke="#9A6B0E" stroke-width="2"/><ellipse cx="50" cy="36" rx="35" ry="6.5" fill="#5468FF"/><path d="M50 38.5C70 38.5 84 37 85 35.5C85 39 70 42.5 50 42.5Z" fill="#3B4CD6"/><path d="M20 34.5C26 32.5 36 31.8 44 31.8" fill="none" stroke="#8C9BFF" stroke-width="1.6" stroke-linecap="round"/>',
  },
  yildizgozluk: {
    anchor: 'face',
    art: '<path d="M37.0 35.5L42.6 44.2L52.7 46.9L46.1 55.0L46.7 65.3L37.0 61.6L27.3 65.3L27.9 55.0L21.3 46.9L31.4 44.2Z" fill="#FF4F8B" stroke="#1B1530" stroke-width="2.6" stroke-linejoin="round"/><path d="M37.0 43.6L40.2 48.6L45.9 50.1L42.1 54.7L42.5 60.6L37.0 58.4L31.5 60.6L31.9 54.7L28.1 50.1L33.8 48.6Z" fill="#2A2346"/><path d="M37.0 43.6L40.2 48.6L45.9 50.1L42.1 54.7L42.5 60.6L37.0 58.4L31.5 60.6L31.9 54.7L28.1 50.1L33.8 48.6Z" fill="none" stroke="#F2C230" stroke-width="1.6" stroke-linejoin="round"/><path d="M33 49l3 -3" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/><circle cx="40" cy="55" r="1" fill="#FFFFFF" opacity=".8"/><circle cx="29" cy="44" r="1.1" fill="#FFF1B8"/><circle cx="46" cy="47" r=".9" fill="#FFF1B8"/><circle cx="43" cy="62" r="1" fill="#FFF1B8"/><path d="M63.0 35.5L68.6 44.2L78.7 46.9L72.1 55.0L72.7 65.3L63.0 61.6L53.3 65.3L53.9 55.0L47.3 46.9L57.4 44.2Z" fill="#FF4F8B" stroke="#1B1530" stroke-width="2.6" stroke-linejoin="round"/><path d="M63.0 43.6L66.2 48.6L71.9 50.1L68.1 54.7L68.5 60.6L63.0 58.4L57.5 60.6L57.9 54.7L54.1 50.1L59.8 48.6Z" fill="#2A2346"/><path d="M63.0 43.6L66.2 48.6L71.9 50.1L68.1 54.7L68.5 60.6L63.0 58.4L57.5 60.6L57.9 54.7L54.1 50.1L59.8 48.6Z" fill="none" stroke="#F2C230" stroke-width="1.6" stroke-linejoin="round"/><path d="M59 49l3 -3" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/><circle cx="66" cy="55" r="1" fill="#FFFFFF" opacity=".8"/><circle cx="55" cy="44" r="1.1" fill="#FFF1B8"/><circle cx="72" cy="47" r=".9" fill="#FFF1B8"/><circle cx="69" cy="62" r="1" fill="#FFF1B8"/><path d="M46.5 51q3.5 -3 7 0" fill="none" stroke="#1B1530" stroke-width="3.2" stroke-linecap="round"/><path d="M50 40l1 2.4 2.4 1-2.4 1-1 2.4-1-2.4-2.4-1 2.4-1Z" fill="#F2C230"/>',
  },
  tac: {
    anchor: 'head',
    art: '<defs><clipPath id="tac-c"><path d="M24 36V14L36 25L50 5L64 25L76 14V36Z"/></clipPath></defs><path d="M24 36V14L36 25L50 5L64 25L76 14V36Z" fill="#F2C230" stroke="#B9851A" stroke-width="1.6" stroke-linejoin="round"/><g clip-path="url(#tac-c)"><path d="M58 0H100V40H58Z" fill="#D9A41E"/><path d="M27 33V20L33 26Z" fill="#FFE9A8"/><path d="M42 20L50 9L46 22Z" fill="#FFE9A8"/></g><rect x="22" y="29" width="56" height="9" rx="2" fill="#F2C230"/><path d="M58 29H76a2 2 0 0 1 2 2v5a2 2 0 0 1 -2 2H58Z" fill="#D9A41E"/><path d="M24 33.5H76" stroke="#B9851A" stroke-width="1" stroke-dasharray="1.2 2.2"/><ellipse cx="50" cy="33.5" rx="4.6" ry="3.6" fill="#FF4F8B"/><ellipse cx="48.8" cy="32.4" rx="1.6" ry="1.1" fill="#FFC2D6"/><path d="M33 30.5l3 3-3 3-3-3Z" fill="#1FB5A8"/><path d="M67 30.5l3 3-3 3-3-3Z" fill="#1FB5A8"/><path d="M32.4 31.6l1 1" stroke="#9FF2FF" stroke-width="1" stroke-linecap="round"/><path d="M66.4 31.6l1 1" stroke="#9FF2FF" stroke-width="1" stroke-linecap="round"/><path d="M50 15.5l2.6 4-2.6 4-2.6-4Z" fill="#7B5CFF"/><circle cx="24" cy="12" r="3.8" fill="#FFF4E0"/><circle cx="50" cy="4" r="4.2" fill="#FFF4E0"/><circle cx="76" cy="12" r="3.8" fill="#FFF4E0"/><circle cx="23" cy="11" r="1.2" fill="#FFFFFF"/><circle cx="49" cy="3" r="1.3" fill="#FFFFFF"/><circle cx="75" cy="11" r="1.2" fill="#FFFFFF"/><path d="M76 12a3.8 3.8 0 0 1 -3 3.7" fill="none" stroke="#E3C89C" stroke-width="1.4"/>',
  },
  ejderboynuzu: {
    anchor: 'head',
    art: '<path d="M34 31C22 25 17 13 21 1C26 11 33 17 43 22Z" fill="#FF7A3D"/><path d="M21 1C19 11 23 21 31 27L34 31C24 25 18 14 21 1Z" fill="#FFB27F"/><path d="M26 22q4 -2 7 1" fill="none" stroke="#B9501E" stroke-width="1.6" stroke-linecap="round"/><path d="M23 15q4 -2 7 1" fill="none" stroke="#B9501E" stroke-width="1.6" stroke-linecap="round"/><path d="M22 8q4 -2 7 1" fill="none" stroke="#B9501E" stroke-width="1.6" stroke-linecap="round"/><path d="M21 1C22 5 23.5 7 25 9C22.5 8 21 5 21 1Z" fill="#FFE9A8"/><ellipse cx="38.5" cy="28" rx="5.5" ry="2.8" transform="rotate(25 38.5 28)" fill="#9A6B4E"/><path d="M66 31C78 25 83 13 79 1C74 11 67 17 57 22Z" fill="#FF7A3D"/><path d="M66 31C71 28 75 24 77 19L57 22Z" fill="#D95A22"/><path d="M74 22q-4 -2 -7 1" fill="none" stroke="#B9501E" stroke-width="1.6" stroke-linecap="round"/><path d="M77 15q-4 -2 -7 1" fill="none" stroke="#B9501E" stroke-width="1.6" stroke-linecap="round"/><path d="M78 8q-4 -2 -7 1" fill="none" stroke="#B9501E" stroke-width="1.6" stroke-linecap="round"/><path d="M79 1C78 5 76.5 7 75 9C77.5 8 79 5 79 1Z" fill="#FFE9A8"/><ellipse cx="61.5" cy="28" rx="5.5" ry="2.8" transform="rotate(-25 61.5 28)" fill="#9A6B4E"/><path d="M50 30l4 5-4 6-4-6Z" fill="#FF4F8B"/><path d="M50 30l4 5-4 1.2Z" fill="#FFC2D6"/><path d="M44 35.5q6 -3 12 0" fill="none" stroke="#9A6B4E" stroke-width="1.6" stroke-linecap="round"/>',
  },
};

// The canvas's capsule in the app's units: as wide (52 → 28), from the same left edge (24 → 10).
const SCALE = 28 / 52;
const LEFT = 10 - 24 * SCALE;
const TOP: Record<AccessoryAnchor, number> = {
  head: 8 - 22 * SCALE,
  face: 20.5 - 52 * SCALE,
  mid: 14.25 - 37 * SCALE,
};

// The accessory's layer for the app's capsule drawing (its 48-unit box), or '' for an unknown id
// (an accessory a newer catalog has: the old app draws the capsule without it).
export function accessoryLayer(id: string | null | undefined): string {
  const a = id ? ACCESSORY_ART[id] : undefined;
  if (!a) return '';
  return `<g transform="translate(${LEFT.toFixed(3)} ${TOP[a.anchor].toFixed(3)}) scale(${SCALE.toFixed(5)})">${a.art}</g>`;
}

// The canvas's standing capsule (a collection tile, Aksesuarlarım: viewBox 0 -12 100 140) wearing
// the accessory; `silhouette` draws all of it in one colour (an accessory not owned yet).
const FIGURE_BODY =
  '<rect x="24" y="22" width="52" height="92" rx="26" fill="#F5E6CC"/>' +
  '<path d="M60 24A26 26 0 0 1 76 48V88A26 26 0 0 1 60 112Z" fill="#D9CBB4"/>' +
  '<rect x="28" y="41" width="45" height="22" rx="11" fill="#E2F0D9"/>' +
  '<circle cx="39" cy="52" r="4.6" fill="#1B1530"/><circle cx="61" cy="52" r="4.6" fill="#1B1530"/>' +
  '<path d="M42 70q8 6 16 0" fill="none" stroke="#1B1530" stroke-width="4" stroke-linecap="round"/>';

export function accessoryFigure(id: string, silhouette: string | null = null): string {
  const art = ACCESSORY_ART[id]?.art ?? '';
  const inner = FIGURE_BODY + art;
  const drawn = silhouette
    ? inner
        .replace(/fill="#[0-9A-Fa-f]{3,8}"/g, `fill="${silhouette}"`)
        .replace(/stroke="#[0-9A-Fa-f]{3,8}"/g, `stroke="${silhouette}"`)
        .replace(/ opacity="[^"]*"/g, '')
    : inner;
  return `<svg viewBox="0 -12 100 140" width="100%" height="100%" aria-hidden="true">${drawn}</svg>`;
}
