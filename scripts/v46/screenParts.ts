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

// The phone v46 is measured on (its inventory's 360×740): where a part pinned to the screen's edge
// sits is read against it.
export const SCREEN = { width: 360, height: 740 } as const;

// The tab bars go with the inventory's own (Sekme çubuğu); the heads are a group of their own.
export const TAB_BAR_GROUP = 'Sekme çubuğu';
export const TOP_BAR_GROUP = 'Üst çubuk';
// Keşfet's own parts (the filter chips are the inventory's suzgec-cipleri).
export const EXPLORE_GROUP = 'Keşfet';

export const SCREEN_PARTS: readonly ScreenPart[] = [
  // The tab bar with each tab selected that the inventory does not have (it has Mekan, Mesajlar
  // and Profil: alt-sekme-*).
  {
    id: 'alt-sekme-kesfet',
    group: TAB_BAR_GROUP,
    name: 'Alt sekme çubuğu, Keşfet seçili',
    source_state: 'kesfet',
    selector_in_state: 'nav[data-nav]',
    extra_steps: [],
  },
  {
    id: 'alt-sekme-aktiviteler',
    group: TAB_BAR_GROUP,
    name: 'Alt sekme çubuğu, Aktiviteler seçili',
    source_state: 'aktiviteler',
    selector_in_state: 'nav[data-nav]',
    extra_steps: [],
  },
  // The top bars: each tab screen's pinned head (title, the screen's own control on the right,
  // the fade below), and a sub page's (back, title, its count).
  {
    id: 'ust-kesfet',
    group: TOP_BAR_GROUP,
    name: 'Üst çubuk, Keşfet (başlık ve liste/harita seçici)',
    source_state: 'kesfet',
    selector_in_state: '.dhd',
    extra_steps: [],
  },
  {
    id: 'ust-aktiviteler',
    group: TOP_BAR_GROUP,
    name: 'Üst çubuk, Aktiviteler (başlık)',
    source_state: 'aktiviteler',
    selector_in_state: '.apin',
    extra_steps: [],
  },
  {
    id: 'ust-mesajlar',
    group: TOP_BAR_GROUP,
    name: 'Üst çubuk, Mesajlar (başlık ve zil)',
    source_state: 'mesajlar',
    selector_in_state: '.mpin',
    extra_steps: [],
  },
  {
    id: 'ust-alt',
    group: TOP_BAR_GROUP,
    name: 'Üst çubuk, alt sayfa (geri ve başlık)',
    source_state: 'gizlilik',
    selector_in_state: '.fpin',
    extra_steps: [],
  },
  {
    id: 'ust-alt-sayili',
    group: TOP_BAR_GROUP,
    name: 'Üst çubuk, alt sayfa, başlıkta sayı',
    source_state: 'arkadaslar',
    selector_in_state: '.fpin',
    extra_steps: [],
  },
  // Keşfet's list/map switch, the list on and the map on.
  {
    id: 'liste-harita',
    group: TOP_BAR_GROUP,
    name: 'Liste/harita seçici, liste seçili',
    source_state: 'kesfet',
    selector_in_state: '.vmode',
    extra_steps: [],
  },
  {
    id: 'liste-harita-harita',
    group: TOP_BAR_GROUP,
    name: 'Liste/harita seçici, harita seçili',
    source_state: 'kesfet',
    selector_in_state: '.vmode',
    extra_steps: ['c:[data-vm]@@1'],
  },
  // Keşfet's search, empty, focused (`:focus-within`) and with a word typed in.
  {
    id: 'arama',
    group: EXPLORE_GROUP,
    name: 'Arama kutusu, boş',
    source_state: 'kesfet',
    selector_in_state: '.dsearch',
    extra_steps: [],
  },
  {
    id: 'arama-odak',
    group: EXPLORE_GROUP,
    name: 'Arama kutusu, yazarken',
    source_state: 'kesfet',
    selector_in_state: '.dsearch',
    extra_steps: ["js:document.querySelector('[data-vsearch]').focus()"],
  },
  {
    id: 'arama-dolu',
    group: EXPLORE_GROUP,
    name: 'Arama kutusu, dolu',
    source_state: 'kesfet',
    selector_in_state: '.dsearch',
    extra_steps: ['f:[data-vsearch]::Kahve'],
  },
  // The city and district button, with the count beside it.
  {
    id: 'sehir-secici',
    group: EXPLORE_GROUP,
    name: 'Şehir seçici ve mekan sayısı',
    source_state: 'kesfet',
    selector_in_state: '.vloc',
    extra_steps: [],
  },
  // The list's card, and a venue in it: with open tables (the live line) and quiet.
  {
    id: 'mekan-listesi',
    group: EXPLORE_GROUP,
    name: 'Mekan listesi',
    source_state: 'kesfet',
    selector_in_state: '.vlist',
    extra_steps: [],
  },
  {
    id: 'mekan-satiri',
    group: EXPLORE_GROUP,
    name: 'Mekan satırı, açık masalı',
    source_state: 'kesfet',
    selector_in_state: '.vlist .vrow',
    extra_steps: [],
  },
  {
    id: 'mekan-satiri-sessiz',
    group: EXPLORE_GROUP,
    name: 'Mekan satırı, sessiz',
    source_state: 'kesfet',
    selector_in_state: '.vlist .vrow@@3',
    extra_steps: [],
  },
  // The venues' icons, one per kind v46 draws: cafe, tea garden, food, campus.
  {
    id: 'mekan-simgesi-kafe',
    group: EXPLORE_GROUP,
    name: 'Mekan simgesi, kafe',
    source_state: 'kesfet',
    selector_in_state: '.vrow[data-vkind="cafe"] .vthumb',
    extra_steps: [],
  },
  {
    id: 'mekan-simgesi-cay',
    group: EXPLORE_GROUP,
    name: 'Mekan simgesi, çay bahçesi',
    source_state: 'kesfet',
    selector_in_state: '.vrow[data-vkind="tea"] .vthumb',
    extra_steps: [],
  },
  {
    id: 'mekan-simgesi-yemek',
    group: EXPLORE_GROUP,
    name: 'Mekan simgesi, yemek',
    source_state: 'kesfet',
    selector_in_state: '.vrow[data-vkind="food"] .vthumb',
    extra_steps: [],
  },
  {
    id: 'mekan-simgesi-kampus',
    group: EXPLORE_GROUP,
    name: 'Mekan simgesi, kampüs',
    source_state: 'kesfet',
    selector_in_state: '.vhere .vthumb',
    extra_steps: [],
  },
  // Where the person is checked in, and the live dot (its halo is its `::after`).
  {
    id: 'su-an-buradasin',
    group: EXPLORE_GROUP,
    name: 'Şu an buradasın',
    source_state: 'kesfet',
    selector_in_state: '.vhere',
    extra_steps: [],
  },
  {
    id: 'canli-nokta',
    group: EXPLORE_GROUP,
    name: 'Canlı nokta',
    source_state: 'kesfet',
    selector_in_state: '.vh-lbl .live',
    extra_steps: [],
  },
];
