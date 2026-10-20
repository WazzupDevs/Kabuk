// Parts of v46's screens that the inventory does not list as components (its 59 are the gallery's
// copies), measured on the real screen where v46 draws them (scripts/v46/measure.ts: `?s=<state>`,
// the same passes as an inventory component: both schemes, pressed, reduce motion, 320 dp, the
// motion rules that reach it). Each is v46's own element, picked as the inventory picks its own
// (`selector@@n`, steps run by the gallery's `__step`): nothing here is drawn anew.
export type ScreenPart = {
  id: string;
  group: string;
  name: string;
  source_state: string;
  selector_in_state: string;
  extra_steps: string[];
};

export const NAVIGATION_GROUP = 'Gezinme';

export const SCREEN_PARTS: readonly ScreenPart[] = [
  // The tab bar with each tab selected that the inventory does not have (it has Mekan, Mesajlar
  // and Profil: alt-sekme-*).
  {
    id: 'alt-sekme-kesfet',
    group: NAVIGATION_GROUP,
    name: 'Alt sekme çubuğu, Keşfet seçili',
    source_state: 'kesfet',
    selector_in_state: 'nav[data-nav]',
    extra_steps: [],
  },
  {
    id: 'alt-sekme-aktiviteler',
    group: NAVIGATION_GROUP,
    name: 'Alt sekme çubuğu, Aktiviteler seçili',
    source_state: 'aktiviteler',
    selector_in_state: 'nav[data-nav]',
    extra_steps: [],
  },
  // The top bars: each tab screen's pinned head (title, the screen's own control on the right,
  // the fade below), and a sub page's (back, title, its count).
  {
    id: 'ust-kesfet',
    group: NAVIGATION_GROUP,
    name: 'Üst çubuk, Keşfet (başlık ve liste/harita seçici)',
    source_state: 'kesfet',
    selector_in_state: '.dhd',
    extra_steps: [],
  },
  {
    id: 'ust-aktiviteler',
    group: NAVIGATION_GROUP,
    name: 'Üst çubuk, Aktiviteler (başlık)',
    source_state: 'aktiviteler',
    selector_in_state: '.apin',
    extra_steps: [],
  },
  {
    id: 'ust-mesajlar',
    group: NAVIGATION_GROUP,
    name: 'Üst çubuk, Mesajlar (başlık ve zil)',
    source_state: 'mesajlar',
    selector_in_state: '.mpin',
    extra_steps: [],
  },
  {
    id: 'ust-alt',
    group: NAVIGATION_GROUP,
    name: 'Üst çubuk, alt sayfa (geri ve başlık)',
    source_state: 'gizlilik',
    selector_in_state: '.fpin',
    extra_steps: [],
  },
  {
    id: 'ust-alt-sayili',
    group: NAVIGATION_GROUP,
    name: 'Üst çubuk, alt sayfa, başlıkta sayı',
    source_state: 'arkadaslar',
    selector_in_state: '.fpin',
    extra_steps: [],
  },
  // Keşfet's list/map switch, the list on and the map on.
  {
    id: 'liste-harita',
    group: NAVIGATION_GROUP,
    name: 'Liste/harita seçici, liste seçili',
    source_state: 'kesfet',
    selector_in_state: '.vmode',
    extra_steps: [],
  },
  {
    id: 'liste-harita-harita',
    group: NAVIGATION_GROUP,
    name: 'Liste/harita seçici, harita seçili',
    source_state: 'kesfet',
    selector_in_state: '.vmode',
    extra_steps: ['c:[data-vm]@@1'],
  },
];
