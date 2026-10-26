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
// The fields and switches in the states the inventory does not copy (it has each at rest), with
// its own (Form).
export const FORM_GROUP = 'Form';
// Mekan's own parts around the inventory's cards and lobby rows (Kartlar, Katıl).
export const VENUE_GROUP = 'Mekan';

const focus = (selector: string) => `js:document.querySelector('${selector}').focus()`;

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
  // The fields while typing (`:focus` / `:focus-within`: the purple edge and its ring) and with
  // something typed in.
  {
    id: 'alan-isim-odak',
    group: FORM_GROUP,
    name: 'Metin alanı, yazarken',
    source_state: 'kayit-isim',
    selector_in_state: '.sup-field:has([data-sup-name])',
    extra_steps: [focus('[data-sup-name]')],
  },
  {
    id: 'alan-telefon-odak',
    group: FORM_GROUP,
    name: 'Telefon alanı, yazarken',
    source_state: 'kayit-telefon',
    selector_in_state: '.sup-phone',
    extra_steps: [focus('[data-sup-phone]')],
  },
  {
    id: 'alan-telefon-dolu',
    group: FORM_GROUP,
    name: 'Telefon alanı, dolu',
    source_state: 'kayit-telefon',
    selector_in_state: '.sup-phone',
    extra_steps: ['f:[data-sup-phone]::532 123 45 67'],
  },
  {
    id: 'alan-kod-odak',
    group: FORM_GROUP,
    name: 'Kod alanı, yazarken',
    source_state: 'kayit-kod',
    selector_in_state: '[data-otp]',
    extra_steps: [focus('[data-otp] input')],
  },
  {
    id: 'alan-kod-dolu',
    group: FORM_GROUP,
    name: 'Kod alanı, üç hane yazılmış',
    source_state: 'kayit-kod',
    selector_in_state: '[data-otp]',
    extra_steps: [
      'f:[data-otp] input@@0::4',
      'f:[data-otp] input@@1::8',
      'f:[data-otp] input@@2::2',
      "js:document.querySelectorAll('[data-otp] input')[3].focus()",
    ],
  },
  // The field's error text by its own rule (`.sup-err`): on the sign-up screen v46's paragraph rule
  // (`.sup-pane>p`, more specific) draws it as a plain muted line, so it is read out of the
  // pane, in the same app frame (docs/SPEC_V4.md §4.C: the intent of a rule that another overrides).
  {
    id: 'alan-hata-kendi',
    group: FORM_GROUP,
    name: 'Alan hatası metni, kendi kuralıyla',
    source_state: 'kayit-telefon-hata',
    selector_in_state: '[data-sup-err="phone"]',
    extra_steps: [
      "js:var e=document.querySelector('[data-sup-err=\"phone\"]');e.closest('.sup-pane').parentNode.appendChild(e)",
    ],
  },
  {
    id: 'alan-secim-odak',
    group: FORM_GROUP,
    name: 'Seçim, açıkken',
    source_state: 'kayit-dogum',
    selector_in_state: '[data-dob="d"]',
    extra_steps: [focus('[data-dob="d"]')],
  },
  {
    id: 'alan-cok-satir-odak',
    group: FORM_GROUP,
    name: 'Çok satırlı alan, yazarken',
    source_state: 'profil-duzenle',
    selector_in_state: '[data-ebio]',
    extra_steps: [focus('[data-ebio]')],
  },
  // A switch that cannot change now (Bildirimler with the phone's permission off).
  {
    id: 'anahtar-pasif',
    group: FORM_GROUP,
    name: 'Anahtar, pasif',
    source_state: 'bildirim-izin-kapali',
    selector_in_state: '[data-nk]',
    extra_steps: [],
  },
  // The anonymous switch on, and after this check-in's one change (`.used`: the lock on its
  // corner), as v46 shows it once the sheet's "Anonim görün" is pressed.
  {
    id: 'anonim-anahtari-acik',
    group: FORM_GROUP,
    name: 'Anonim anahtarı, açık',
    source_state: 'mekan',
    selector_in_state: '[data-anon-sw]',
    extra_steps: [
      "js:document.querySelector('[data-anon-sw]').setAttribute('aria-checked','true')",
    ],
  },
  {
    id: 'anonim-anahtari-kilitli',
    group: FORM_GROUP,
    name: 'Anonim anahtarı, bu girişte değişti',
    source_state: 'mekan',
    selector_in_state: '[data-anon-sw]',
    extra_steps: ['c:[data-anon-sw]', 'c:[data-anx-yes]', 'w:900'],
  },
  // Mekan around its cards: the venue's name, a list's head ("Açık masalar" and its count), the
  // line under it, a lobby row's chip with its icon (the inventory's lobby row stops above it), and
  // the dot on the own table's card, off and in the lobby (`.dot.open`).
  {
    id: 'mekan-basligi',
    group: VENUE_GROUP,
    name: 'Mekanın adı',
    source_state: 'mekan',
    selector_in_state: 'section[data-page="venue"] h1.venue',
    extra_steps: [],
  },
  {
    id: 'mekan-bolum',
    group: VENUE_GROUP,
    name: 'Liste başı (Açık masalar ve sayısı)',
    source_state: 'mekan',
    selector_in_state: 'section[data-page="venue"] .sec',
    extra_steps: [],
  },
  {
    id: 'mekan-notu',
    group: VENUE_GROUP,
    name: 'Liste başının altındaki not',
    source_state: 'mekan',
    selector_in_state: '[data-here-note]',
    extra_steps: [],
  },
  {
    id: 'lobi-cipi',
    group: VENUE_GROUP,
    name: 'Lobi satırının çipi (kişi sayısı)',
    source_state: 'mekan',
    selector_in_state: '[data-lobby-list] .meta .chip',
    extra_steps: [],
  },
  {
    id: 'masa-durum-noktasi',
    group: VENUE_GROUP,
    name: 'Masa kartının noktası, lobide değil',
    source_state: 'mekan-masam-var',
    selector_in_state: '[data-mine] [data-dot]',
    extra_steps: [],
  },
  {
    id: 'masa-durum-noktasi-acik',
    group: VENUE_GROUP,
    name: 'Masa kartının noktası, lobide',
    source_state: 'mekan-masam-var',
    selector_in_state: '[data-mine] [data-dot]',
    extra_steps: ["js:document.querySelector('[data-mine] [data-dot]').classList.add('open')"],
  },
  // The two cards pinned at the top (`.pin`: its padding, the gap below the chat card) and the
  // lobby's list (`.list`: the gap between its rows).
  {
    id: 'mekan-sabit',
    group: VENUE_GROUP,
    name: 'Üstte sabit kalan iki kart',
    source_state: 'mekan',
    selector_in_state: 'section[data-page="venue"] .pin',
    extra_steps: [],
  },
  {
    id: 'lobi-listesi',
    group: VENUE_GROUP,
    name: 'Açık masalar listesi',
    source_state: 'mekan',
    selector_in_state: '[data-lobby-list]',
    extra_steps: [],
  },
];
