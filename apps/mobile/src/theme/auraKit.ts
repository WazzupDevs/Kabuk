// The airy look's component kit, value for value from docs/design/aura/project/aura.css (the
// canvas's classes: .display, .glass, .btn, .chip, .tag, .round, .av, .thumb, .li, .sec, .badge,
// .live). Light from `:root`, dark from `.night` (the canvas's dark side). Components in
// src/aura/kit/ read only these.
import { BUTTON_GLASS } from './buttonGlass';

const F = {
  500: 'PlusJakartaSans_500Medium',
  600: 'PlusJakartaSans_600SemiBold',
  700: 'PlusJakartaSans_700Bold',
  800: 'PlusJakartaSans_800ExtraBold',
} as const;

// The text style's parts the kit sets, as React Native's TextStyle has them. Kept here, not imported:
// the theme files stay pure, and the root type check (Node's types) reads them through the tests.
type TextStyle = {
  fontFamily?: string;
  fontSize?: number;
  lineHeight?: number;
  letterSpacing?: number;
  fontStyle?: 'normal' | 'italic';
};

// A text style: the canvas's size and line, its weight's file, letter spacing in em.
const t = (w: keyof typeof F, size: number, line: number, em = 0): TextStyle => ({
  fontFamily: F[w],
  fontSize: size,
  lineHeight: line,
  letterSpacing: em * size,
});

// The large lines are at least the face's own height (ascent 1.038 + descent 0.222 of the size):
// lower, Android cut the tails off (j, g, y, ş, ç; "Mesajlar", the owner's report, 28 Ekim).
export const KIT_TYPE = {
  display: t(500, 32, 42, -0.025),
  // A profile's name and age (Profil: .display at 34).
  displaySm: t(500, 34, 43, -0.025),
  // Keşfet's question (.display at 34).
  displayLg: t(500, 34, 41, -0.025),
  // Mesajlar's title (.display at 36).
  displayXl: t(500, 36, 46, -0.025),
  // Keşfet's question (iskelet.md → 5.1: 36, 800; the board's -0.035em). The line stays the face's
  // own height (the board's 1.06 cut the tails off on Android, above).
  exploreTitle: t(800, 36, 46, -0.035),
  // Keşfet (tuval Kesfet, Harita): the line of the day (13, 700, 0.06em), the chips (14; 700 when
  // chosen), the place line (21, 800) and its count (13, 600), a venue's name (16, 700) and line
  // (13, 500), the bucket (12, 700), a map pin's name (11.5, 700).
  exploreEyebrow: t(700, 13, 17, 0.06),
  exploreChip: t(600, 14, 18),
  exploreChipOn: t(700, 14, 18),
  exploreSection: t(800, 21, 27, -0.02),
  exploreCount: t(600, 13, 17),
  exploreSort: t(600, 13, 17),
  placeName: t(700, 16, 20, -0.01),
  placeSub: t(500, 13, 17),
  // Keşfet as the new board draws it (yeni arayüz tuvali, Kesfet, KesfetHarita): the line of the day
  // (`.eyebrow`, 12, 600), the question (`.kh`, 32, 700, -1 px; its line the face's own height, as
  // exploreTitle, for the board's 38 cut the tails off), what is typed and the hint (`.field`, 15,
  // 500), the chips (14, 600), the place (`.cty`, 15, 700), the count (13, 500), the order (13,
  // 600), a row's name (16, 600) and line (13, 500), how lively (12, 600), the map's legend (11,
  // 600), its sources (10, 500) and its card's name (16, 600, 21).
  kesfetEyebrow: t(600, 12, 16, 0.02),
  kesfetTitle: t(700, 32, 41, -0.03125),
  kesfetField: t(500, 15, 22),
  kesfetChip: t(600, 14, 18),
  kesfetPlace: t(700, 15, 20),
  kesfetCount: t(500, 13, 18),
  kesfetSort: t(600, 13, 18),
  kesfetName: t(600, 16, 22),
  kesfetSub: t(500, 13, 18),
  kesfetStatus: t(600, 12, 16),
  // The empty list's title (`.et`, 15, 600) and Semte Git's title on its scene (`.semt .tt`, 18,
  // 700, -0.3 px), its note (13, 500) and time (14, 500).
  kesfetEmptyTitle: t(600, 15, 20),
  semtTitle: t(700, 18, 23, -0.3 / 18),
  semtNote: t(500, 13, 18),
  semtMeta: t(500, 14, 18),
  mapLegend: t(600, 11, 14),
  mapAttr: t(500, 10, 14),
  mapName: t(600, 16, 21),
  bucket: t(700, 12, 16),
  // Semte Git on Keşfet: its eyebrow (11, 800, 0.1em), title (20, 800, 1.18) and note (13.5, 500,
  // 1.42).
  districtEyebrow: t(800, 11, 14, 0.1),
  districtTitle: t(800, 20, 24, -0.02),
  districtNote: t(500, 13.5, 19),
  // The small empty card (tuval Detay, Aktivite: 15.5/700, its sentence 13/500 at 1.4).
  emptyTitle: t(700, 15.5, 20),
  emptyNote: t(500, 13, 18),
  // The empty, error and offline state's title (yeni arayüz tuvali AktivitelerBos, AktivitelerHata
  // `.et`: 15/20 600); its sentence is `.fine` (`.ed`: 13/18 500).
  stateTitle: t(600, 15, 20),
  // A venue's page (tuval Detay): the name (31, 800, -0.03em; the line the face's own height, as
  // exploreTitle), the info line's pills (12.5, 700) and place (13.5, 600), the main button's words
  // (17, 800, -0.01em), the bar's name (15.5, 800, -0.015em).
  detailTitle: t(800, 31, 39, -0.03),
  detailPill: t(700, 12.5, 16),
  detailPlace: t(600, 13.5, 17),
  detailBtn: t(800, 17, 22, -0.01),
  // The same page as the new board draws it (yeni arayüz tuvali, MekanDetay): the name (26, 700,
  // -0.6 px), the info line's pills (13, 600) and place (14, 500), a section (16, 700), "Bu hafta"
  // (13, 600), the line under the button (13, 500), the location sheet's title (21, 700, -0.3 px)
  // and its notice's title (15, 700) and words (14, 500).
  venueNameTitle: t(700, 26, 32, -0.023),
  venueEmptyTitle: t(600, 15, 20),
  venuePill: t(600, 13, 18),
  venuePlace: t(500, 14, 18),
  venueSection: t(700, 16, 22),
  venueWeek: t(600, 13, 18),
  venueHint: t(500, 13, 18),
  locateTitle: t(700, 21, 26, -0.014),
  locateNoticeTitle: t(700, 15, 20),
  locateNotice: t(500, 14, 20),
  barName: t(800, 15.5, 20, -0.015),
  // Aktiviteler (tuval Aktivite, Sohbet): the gift card's eyebrow (11, 800, 0.12em), title (21,
  // 800, 1.16 raised to the face's height) and button (14.5, 800); the tabs (15, 700); the game
  // sheet's title (22, 800, -0.025em), its note (13.5, 600, 1.42), its eyebrow (12, 800, 0.1em),
  // a person's line (12.5, 600), the small actions (13.5, 800; once pressed 700).
  giftEyebrow: t(800, 11, 14, 0.12),
  giftTitle: t(800, 21, 26, -0.02),
  giftBtn: t(800, 14.5, 18),
  tabsBoard: t(700, 15, 19),
  sheetGame: t(800, 22, 28, -0.025),
  sheetNote: t(600, 13.5, 19),
  sheetEyebrow: t(800, 12, 16, 0.1),
  personLine: t(600, 12.5, 16),
  actionSm: t(800, 13.5, 17),
  actionSmDone: t(700, 13.5, 17),
  // Mesajlar (tuval Mesajlar): a conversation's last line (14, 500); Bildirimler's line (15.5, 700;
  // what happened in it 500, `light`).
  inboxPreview: t(500, 14, 18),
  notice: t(700, 15.5, 20),
  // The DM (yeni arayüz tuvali, DmSohbet): what is typed in its bar (`.fld`, 15/22), the bar's name
  // (`.who b`, 16/20, 600) and the line under it (`.who span`, 12/16); the strip over the message
  // bar (`.eb`: its title 13/17 at 700, its words 13/17). Its bubbles are `msg`, their time `stamp`,
  // the day `day`. The old board's: the menu's rows (15.5, 600), the block's sheet: its title (21,
  // 800, -0.02em), its sentence (14, 500, 1.45) and its buttons (16.5, 800).
  msgDm: t(500, 15, 22),
  dmName: t(600, 16, 20),
  dmSub: t(500, 12, 16),
  stripTitle: t(700, 13, 17),
  stripText: t(500, 13, 17),
  // "düzenlendi" by the time (DmDuzenlendi `.s .edt`: the time's 11/14 at 500) and the held
  // message's menu's note (DmMenuSureDoldu: 12/16, 500).
  msgEdited: t(500, 11, 14),
  menuNote: t(500, 12, 16),
  menuRow: t(600, 15.5, 20),
  // The ⋮ menu's row (MekanSecenek `.pi p`: 600 16/20).
  popRow: t(600, 16, 20),
  // Its value at the right (SemtSecenek `.pi .rv`: 500 14/18, muted).
  popValue: t(500, 14, 18),
  // The group chats' first-message card's title (SemtSohbet, MasaSohbet `.et`: 700 16/22), their
  // suggestion chips (`.sug span`: 600 13/18) and the district's time chip (`.tmr`: 700 13/18).
  chatEmptyTitle: t(700, 16, 22),
  chatSuggest: t(600, 13, 18),
  chatTime: t(700, 13, 18),
  confirmTitle: t(800, 21, 27, -0.02),
  confirmNote: t(500, 14, 20),
  confirmBtn: t(800, 16.5, 21),
  // The profile pages (tuval Profil, Benim): the name (31, 800, -0.03em; the line the face's own
  // height, as detailTitle), "Arkadaşsınız" (13, 700), a badge (13.5, 700), Mesaj (17, 800), the
  // bar's name (16, 800, -0.015em); the own buttons' "+N" (10.5, 800); the ticket's number (13,
  // 700), its eyebrow (11.5, 800, 0.1em), the nick (20, 800, -0.02em) and its renewal (13, 600);
  // Set balonu's title (17, 800, -0.015em), its count (12.5, 800), its note (13.5, 500, 1.42) and a
  // slot's name (13, 700).
  profileName: t(800, 31, 39, -0.03),
  friendTag: t(700, 13, 17),
  badgeChip: t(700, 13.5, 17),
  profileBtn: t(800, 17, 22),
  personBar: t(800, 16, 20, -0.015),
  stackMore: t(800, 10.5, 13),
  ticketNo: t(700, 13, 17),
  ticketKicker: t(800, 11.5, 15, 0.1),
  ticketNick: t(800, 20, 25, -0.02),
  ticketNote: t(600, 13, 17),
  setTitle: t(800, 17, 22, -0.015),
  setCount: t(800, 12.5, 16),
  setNote: t(500, 13.5, 19),
  setSlot: t(700, 13, 17),
  // The `sayfa` pages on the boards (tuval Arkadaslar, Duzenle): the large title (34, 800,
  // -0.035em; the line the face's own height) and the line under it (14, 600); a friend's "since"
  // (13, 600); Profili düzenle's Kapak (13.5, 700), the birth date's row (15, 700), its note (12.5,
  // 500) and "Değiştirilemez" (13, 700); the fields' labels (13, 700), what is typed (16, 600; the
  // bio 16, 500, 1.4) and their note (12.5, 500, 1.45).
  pageTitle: t(800, 34, 42, -0.035),
  pageSub: t(600, 14, 18),
  friendSince: t(600, 13, 17),
  coverBtn: t(700, 13.5, 17),
  // Kapsülün (tuval Kapsul2): a slot's chip (14, 700) and the chosen option's name (19, 800).
  capsuleChip: t(700, 14, 18),
  capsuleName: t(800, 19, 24, -0.02),
  rowTitle: t(700, 15, 19),
  rowNote: t(500, 12.5, 17),
  rowLock: t(700, 13, 17),
  boxLabel: t(700, 13, 17),
  boxField: t(600, 16, 21),
  boxFieldMulti: t(500, 16, 22),
  boxNote: t(500, 12.5, 18),
  // Ayarlar (tuval Ayarlar): a row's words (16, 600).
  settingsRow: t(600, 16, 20),
  // Ayarlar ailesi (yeni arayüz tuvali): Hesap's locked value (`.inf .tt p`: 16/22, 600, .2 px),
  // its foot (`.foot p`: 12/17, 500); the Ayarlar dialogs' title (`.dt`: 20/26, 700, -.3 px);
  // YasalMetin's heading (`.doc h2`: 18/24, 700, -.2 px), its text (`.doc p.b`: 15/23; the board's
  // 400 is not among the app's faces, so 500) and its draft pill (`.drf`: 11/14, 700, .2 px on the board; drawn at 13/16, the board's face runs wider: the pill is about 70 across there).
  settingsValue: t(600, 16, 22, 0.2 / 16),
  settingsFoot: t(500, 12, 17),
  dialogTitle: t(700, 20, 26, -0.3 / 20),
  legalHead: t(700, 18, 24, -0.2 / 18),
  legalText: t(500, 15, 23),
  // YasalMetin `.drf` as the board draws it: `.meta span` (500 13/18, muted) wins over `.drf`'s own
  // font and colour; only its 0.2 px spacing stays.
  draftPill: t(500, 13, 18, 0.2 / 13),
  // Yeni arayüz (Ayarlar, 16 Kasım): a page's title beside its back button (21, 700, -0.3 px), a
  // section's head in small letters (13, 700). The dialog's title is the page's; its words 15/500;
  // the long-press menu's row 15/600; the toast's title 14/600 and its line 12/500.
  pageBarTitle: t(700, 21, 26, -0.3 / 21),
  // A sheet's title (yeni arayüz tuvali `.sh-t`: 21/26, 700, -0.3 px).
  sheetTitle: t(700, 21, 26, -0.3 / 21),
  // Masa kur (yeni arayüz tuvali 32a–32c, theme/tableSetup.ts): the picture's name pill 14/700,
  // "Rastgele" 13/600, "ÖNERİ" 10/700, the pictures' head 15/700, "Başka masada" 11/700. Masa
  // bitti (64, 132): the title 32/700 at -0.6 px, its line 15/500.
  setupPill: t(700, 14, 18),
  setupShuffle: t(600, 13, 16),
  setupBadge: t(700, 10, 14, 0.4 / 10),
  setupHead: t(700, 15, 20),
  setupTaken: t(700, 11, 14),
  endTitle: t(700, 32, 38, -0.6 / 32),
  endLine: t(500, 15, 20),
  sectionHead: t(700, 13, 18),
  dialogText: t(500, 15, 22),
  holdRow: t(600, 15, 20),
  // Mesajlar's rows (yeni arayüz tuvali Main): the name (`.nm` 600 16/22, no tracking), a face's
  // initial (`.rw .av` 17), Arşivlenenler (`.arc` 600 15/22) and its count (`.arc .n` 600 13/18).
  inboxName: t(600, 16, 22),
  inboxLetter: t(700, 17, 22),
  inboxArchived: t(600, 15, 22),
  inboxCount: t(600, 13, 18),
  toastTitle: t(600, 14, 19),
  toastPill: t(600, 14, 18),
  toastSub: t(500, 12, 16),
  // The toast's button (SusleKaydedilemedi): 13/600.
  toastBtn: t(600, 13, 16),
  // EngelleOnay's "Şikayet de et" row: the words 15/600, the line under them 13/500.
  checkRow: t(600, 15, 20),
  checkRowNote: t(500, 13, 18),
  // Mekan: "Mekandasın" (yeni arayüz tuvali `.here`: 13, 600); (tuval Mekan) the card's title (26, 800, -0.03em, 1.1) and its
  // sentence (14.5, 500, 1.45); its buttons (15.5, 800), the strip's (14, 800); the venue chat's
  // field (14, 600); the invite's name (16, 700) and its button (14, 700).
  hereTag: t(600, 13, 18),
  cardHero: t(800, 26, 29, -0.03),
  cardHeroNote: t(500, 14.5, 21),
  tableBtn: t(800, 15.5, 20),
  stripBtn: t(800, 14, 18),
  chatField: t(600, 14, 18),
  inviteName: t(700, 16, 20),
  inviteBtn: t(700, 14, 18),
  title: t(600, 21, 27, -0.015),
  // The first screen's line (Main: 36, 500, -0.03em) and its wordmark (24, 800).
  welcome: t(500, 36, 46, -0.03),
  wordmarkSm: t(800, 24, 28, -0.04),
  // GuncellemeGerekli `.up h1` (24 / 30, 700, -.3px) and the version line under the button.
  updateTitle: t(700, 24, 30, -0.3 / 24),
  updateBuild: t(500, 12, 16),
  // A scene's title (Mekan: .title at 22).
  hero: t(600, 22, 28, -0.015),
  // Masa kur's title (.title at 24).
  sheetTitleLg: t(600, 24, 30, -0.015),
  // A digit of the code (Kod: 26, 600).
  code: t(600, 26, 33),
  // The phone number as it is typed (Telefon: 21, 600, 0.04em).
  phone: t(600, 21, 26, 0.04),
  // The incoming request's line (MasaIstek: .h3 at 17).
  requestTitle: t(600, 17, 23, -0.005),
  // A game's name on its card (Masa: 24, 700, -0.02em).
  gameName: t(700, 24, 31, -0.02),
  // A venue's name on its page (KesfetMekan: .display at 31).
  venueTitle: t(500, 31, 38, -0.025),
  h3: t(600, 16, 22, -0.005),
  // The masked phone number on Hesap (`.h3.mono`: 0.04em).
  h3Mono: t(600, 16, 22, 0.04),
  // A section's heading (.sec .h3 at 18).
  sec: t(600, 18, 24, -0.005),
  // Keşfet's place line and Masa's lone note (.h3 at 19).
  secLg: t(600, 19, 24, -0.005),
  // Mekan's lobby headings (.sec .h3 at 21).
  secXl: t(600, 21, 27, -0.005),
  body: t(500, 15, 22),
  // Aura v71 YasalMetin (`.legal`): the long legal text.
  legal: t(500, 15, 24),
  // A venue's district under its name on its page (KesfetMekan: .body at 17).
  bodyLg: t(500, 17, 22),
  fine: t(500, 13, 18),
  // What is typed in Profili düzenle's fields (17/24).
  field: t(500, 17, 24),
  // A venue row's second line and its bucket (Keşfet: .fine at 14).
  fineLg: t(500, 14, 18),
  // A longer note at 14 (Mekan's scene, Masa kur's switch, Masa: .fine 14/20).
  note: t(500, 14, 20),
  eyebrow: t(600, 12, 16, 0.02),
  stamp: t(600, 11, 14),
  strong: { fontFamily: F[600] } as TextStyle,
  // A conversation's name and last line while unread (iskelet.md → 5.4).
  bold: { fontFamily: F[800] } as TextStyle,
  // An unread conversation's time (yeni arayüz tuvali, Main `.tm.new`: 700).
  heavy: { fontFamily: F[700] } as TextStyle,
  // "Henüz mesaj yok" (5.4): slanted (the face has no italic file; Android slants it).
  italic: { fontStyle: 'italic' } as TextStyle,
  // The plain part of a bold line (Bildirimler: "isteğini kabul etti" after the name).
  light: { fontFamily: F[500] } as TextStyle,
  btn: t(600, 16, 20),
  // `.btn.big`: 700 17/22.
  btnBig: t(700, 17, 22),
  btnSm: t(600, 14, 18),
  // Mekan's "Masa kur" (44 high, 15).
  btnMid: t(600, 14, 18),
  chip: t(600, 13, 17),
  // Süsle's filter chip (`.flt span`): 600 12/16.
  chipFilter: t(600, 12, 16),
  // U34: a field's label on a card (ProfilDuzenle `.lb`).
  fieldLabel: t(600, 13, 17),
  // Keşfet's kind chips (15).
  chipLg: t(600, 15, 19),
  // U19: Mekan's spot chip, 14.
  chipMd: t(600, 14, 18),
  tag: t(600, 12, 16),
  // A venue page's tags (14).
  // A venue page's tags over its scene (U17: 13).
  tagLg: t(600, 13, 17),
  badge: t(700, 11, 14),
  // The request row's letter face (`.rqa`: 20/700, line 1).
  faceLetter: t(700, 20, 20),
  // The venue chat card's count (24 round, 12).
  badgeLg: t(700, 12, 15),
  live: t(600, 13, 17),
  // "şu an aktif" (500) and "Mekandasın" (15) on Mekan.
  liveSoft: t(500, 13, 17),
  // U19: Mekan's "Mekandasın", 14.
  liveLg: t(600, 14, 18),
  msg: t(500, 15, 21),
  // A message of emoji only, without a bubble (Telegram Android): one, and two or three. The
  // system's face (the emoji come from its colour font, not from ours) and a line 1.35 of the size:
  // with ours and 1.2, Android cut the emoji's top and right off (the owner's report, 6 Kasım).
  emojiOne: { fontSize: 40, lineHeight: 54 },
  emojiFew: { fontSize: 32, lineHeight: 44 },
  day: t(600, 12, 16),
  // A person's name under their face at Masa (`.mem`: 11/14 600).
  member: t(600, 11, 14),
  wordmark: t(800, 26, 30, -0.04),
  // Mekan (yeni arayüz tuvali, MekanMasa, MekanKaydir): the venue's name alone (`.vn`, 24, 700,
  // -0.5 px), small on the scrolled bar (`.sv p`, 17, 700, -0.2 px) and "Mekandasın" under it (12,
  // 600); a card's title (`.t1`, 18, 700, -0.3 px), its count (`.cn`, 13, 700) and "Açık masalar"
  // (`.oh p`, 18, 700).
  venueName: t(700, 24, 30, -0.5 / 24),
  venueBarName: t(700, 17, 22, -0.2 / 17),
  venueBarHere: t(600, 12, 16),
  venueCardTitle: t(700, 18, 24, -0.3 / 18),
  venueCount: t(700, 13, 18),
  venueLobbyTitle: t(700, 18, 24),
  // Masa (yeni arayüz tuvali, Masa, Masadakiler): the bar's table name (`.mti b`, 16/20 700) and its
  // line (`.mti span`, 12/16 500); "Oyunlar" (`.gh p`, 18/24 700) and its count (13/18 500); a person
  // in Masadakiler (`.mg .mr p`, 13/17 600), "Masa sahibi" under them (11/14 600) and the note
  // under the list (12/16 500).
  roomBarName: t(700, 16, 20),
  roomBarLine: t(500, 12, 16),
  roomSection: t(700, 18, 24),
  roomCount: t(500, 13, 18),
  roomPerson: t(600, 13, 17),
  roomOwner: t(600, 11, 14),
  roomNote: t(500, 12, 16),
  // A game's pre-game page (yeni arayüz tuvali, OyunLobi, TakimLobi): the game's name (`.ln b`,
  // 21/26 700, -0.3 px), a person (`.pr p`, 14/18 600), a row's title (`.lr p`, 16/20 600) and a
  // team's name (`.th3 p`, 15/20 700) and count (13/18 700).
  lobbyName: t(700, 21, 26, -0.3 / 21),
  lobbyPerson: t(600, 14, 18),
  lobbyQuiet: t(500, 14, 18),
  lobbyRow: t(600, 16, 20),
  lobbyTeam: t(700, 15, 20),
  lobbyTeamCount: t(700, 13, 18),
  av: {
    // A face in Masa's row of faces (`.fcs .av`, 10 700).
    roomFace: t(700, 10, 12),
    xs: t(700, 9, 11),
    md: t(700, 15, 19),
    sm: t(700, 12, 16),
    member: t(700, 12, 16),
    list: t(700, 15, 19),
    seat: t(700, 20, 24),
    // A conversation's face in Mesajlar (52).
    row: t(700, 18, 22),
    // A conversation's face (tuval Mesajlar: 54) and the DM bar's (38).
    inbox: t(700, 19, 24),
    bar: t(700, 14, 18),
    lg: t(700, 22, 26),
    xl: t(700, 32, 38),
    // Profil's two faces (112).
    big: t(700, 40, 48),
    hero: t(700, 40, 48),
    edit: t(700, 30, 36),
  },
} as const;

export type KitTextVariant = Exclude<
  keyof typeof KIT_TYPE,
  'av' | 'strong' | 'bold' | 'italic' | 'light'
>;

// Aura v75 E4: in the narrow state (320 dp or the largest text, `lib/narrow.ts`) the eyebrow is 13,
// so it is the canvas's 17/22 at the largest text (1.3x).
export const EYEBROW_NARROW = t(600, 13, 17, 0.02);

// Aura v65 skall.css and ekran.css: green-tinted soft shadows (rgba(4, 73, 35) and the ink
// rgba(3, 27, 11)), the primary's glow in its own green in the light scheme. The dark scheme draws
// none, but under the primary a soft black one (the owner's report, 2 Kasım, 2.1: the green glow
// stood like neon on the black ground).
const SHADOW = {
  glass: '0px 18px 44px rgba(4, 73, 35, 0.10), 0px 2px 6px rgba(4, 73, 35, 0.05)',
  soft: '0px 6px 16px rgba(4, 73, 35, 0.10)',
  chip: '0px 6px 16px rgba(4, 73, 35, 0.10)',
  av: '0px 2px 8px rgba(3, 27, 11, 0.08)',
  thumb: '0px 2px 8px rgba(3, 27, 11, 0.08)',
  primary: '0px 12px 26px rgba(14, 135, 69, 0.34)',
  send: '0px 10px 22px rgba(3, 27, 11, 0.24)',
  me: '0px 10px 22px rgba(14, 135, 69, 0.24)',
  disk: '0px 14px 30px rgba(4, 73, 35, 0.22)',
  // skall.css --shadow-card: a riso picture standing on the screen (an empty state, a scene).
  card: '0px 10px 22px rgba(3, 27, 11, 0.07)',
} as const;

// Keşfet's venue icon: 52 with its 16 round (Keşfet: the list row's picture).
// U13: the venue's picture 56, 18 round, on its soft green shadow (Kesfet `.vbox`).
export const VENUE_THUMB = {
  size: 56,
  radius: 18,
  shadow: '0px 6px 14px rgba(4, 73, 35, 0.16)',
} as const;

export type { ButtonGlassKind } from './buttonGlass';

// A clear button's words at 800 where asked (the bar's Kaydet with something to save, iskelet.md
// → 2.1); every other button's 600 (KIT_TYPE.btn).
export const BTN_STRONG: TextStyle = { fontFamily: F[800] };

export const KIT = {
  // The buttons are glass (theme/buttonGlass.ts; iskelet.md → 2.1).
  button: BUTTON_GLASS,
  light: {
    ink: '#031B0B',
    muted: '#4A6550',
    hair: 'rgba(3, 27, 11, 0.07)',
    // A still placeholder for a line still loading (Mekan sohbeti kartı).
    placeholder: 'rgba(3, 27, 11, 0.08)',
    glass: 'linear-gradient(180deg, rgba(255, 255, 255, 0.80), rgba(255, 255, 255, 0.54))',
    // A card inside a sheet: plain white with a hairline, apart from the sheet's own white glass
    // (the owner's report, 2 Kasım, 8.1: the card and its buttons melted into the sheet).
    glassInSheet: 'linear-gradient(180deg, #FFFFFF, #FFFFFF)',
    glassInSheetEdge: 'rgba(3, 27, 11, 0.09)',
    // U21: a sheet's still information row (--surface2; MekanSecenekler `.srow.info`).
    infoRow: '#E6F0E8',
    glassEdge: 'rgba(255, 255, 255, 0.86)',
    glassShadow: SHADOW.glass,
    // The light top edge of glass and of the primary (none in the dark: a white line on every
    // object, the owner's call, 28 Ekim).
    glassInset: 'inset 0px 1px 0px #FFFFFF',
    primaryInset: 'inset 0px 1px 0px rgba(255, 255, 255, 0.28)',
    // A raised white (buttons, chips, round buttons, glassy tags).
    raised: 'rgba(255, 255, 255, 0.74)',
    // A raised button inside a sheet: the sheet's card colour, apart from the sheet (8.1).
    raisedInSheet: '#FFFFFF',
    raisedRound: 'rgba(255, 255, 255, 0.74)',
    raisedChip: 'rgba(255, 255, 255, 0.74)',
    raisedEdge: '#FFFFFF',
    raisedRoundEdge: '#FFFFFF',
    // Süsle's filter chip's words (`.flt span`: --muted; in the dark the text at 60 %).
    filterInk: '#4A6550',
    raisedShadow: SHADOW.soft,
    primaryShadow: SHADOW.primary,
    cardShadow: SHADOW.card,
    chipShadow: SHADOW.chip,
    chipOn: '#031B0B',
    onChipOn: '#FFFFFF',
    day: 'rgba(255, 255, 255, 0.74)',
    field: '#FFFFFF',
    // Profili düzenle's fields.
    fieldLg: '#FFFFFF',
    // U34: a field on a card: the surface, 1 divider inside.
    fieldOnCard: '#FFFFFF',
    fieldOnCardEdge: '#D6E6DA',
    // The seg's chosen part (yeni arayüz, skall.css `.seg span.on`, 16 Kasım): the ink with white
    // words and a soft shadow; in the dark the 94 % white with #0B0E0D.
    segOn: '#031B0B',
    segOnInk: '#FFFFFF',
    segShadow: '0px 2px 6px rgba(3, 27, 11, 0.18)',
    // In a sheet the track is sunk, so the chosen white shows (the owner's report, 10 Kasım:
    // Ayarlar's two switches were white on white).
    segTrackInSheet: 'linear-gradient(180deg, #E0EDE2, #E0EDE2)',
    // An empty step on a light ground (Paketler's page dots, the login bar's parts): --track
    // vanished on the pale canvas.
    emptyMark: 'rgba(3, 27, 11, 0.18)',
    // The sheet (U8): the glass (`.glass.sheet`) over a blurred scrim. Laid on the canvas so it stays
    // opaque (the owner's call, 29 Ekim: Bildirimler and Ayarlar showed too much under them); its
    // top and bottom colours are what scrolls under its edges fades into.
    sheet: 'linear-gradient(180deg, rgba(255, 255, 255, 0.80), rgba(255, 255, 255, 0.54))',
    sheetBase: '#EFF7F1',
    // The sheet and the menu on the live glass (iskelet.md → 2.2): the same face, over the frost.
    sheetFrost: 'linear-gradient(180deg, rgba(255, 255, 255, 0.80), rgba(255, 255, 255, 0.54))',
    // The sheet's top and bottom colours, for what scrolls under its edges to fade into.
    sheetFadeTop:
      'linear-gradient(180deg, rgba(251, 253, 252, 1) 0%, rgba(251, 253, 252, 1) 55%, rgba(251, 253, 252, 0) 100%)',
    sheetFadeBottom: 'linear-gradient(180deg, rgba(247, 251, 248, 0), rgba(247, 251, 248, 1))',
    grab: '#C6E0CC',
    // A sheet's handle and its shadow (tuval Mesajlar, Dm, Sohbet, Ayarlar, Mekan: 40 × 5, ink 14 %;
    // 0 -8 40, ink 22 %).
    sheetGrab: 'rgba(3, 27, 11, 0.14)',
    sheetShadow: '0px -8px 40px rgba(3, 27, 11, 0.22)',
    scrim: 'rgba(3, 27, 11, 0.20)',
    // The switch off: --control.
    switchOff: '#C6E0CC',
    switchInset: 'inset 0px 1px 3px rgba(3, 27, 11, 0.10)',
    // Masa kur (aura v47): a text link and a note's warning on the sheet, at 4.5:1 or more.
    link: '#0B783D',
    warn: '#A8301A',
    // "Arkadaşsınız" on another person's profile (aura v50, ProfilBaskasi): a soft green pill.
    friendPill: '#CDEFD9',
    friendPillInk: '#0F5C31',
    // A disabled button (U10): the neutral fill and its label, never faded; on a card the same.
    disabled: '#DCE9DE',
    onDisabled: '#4A6550',
    disabledOnCard: '#DCE9DE',
    // .btn.danger: the soft red and its ink.
    dangerSoft: '#FBE1DB',
    onDangerSoft: '#A8301A',
    // The warning strips (`.nb2.dg`, `.nb2.wn`): the soft red and the soft amber with their ink; in
    // the dark see-through (the red at 12 %, the amber at 14 %).
    stripDanger: '#FBE1DB',
    onStripDanger: '#A8301A',
    stripWarn: '#FFF1D6',
    onStripWarn: '#5C3A00',
    // Aura v71: the step dots of the sign-up (`--step-dot`).
    stepDot: 'rgba(17, 23, 20, 0.16)',
    // A face's 2 ring (yeni arayüz tuvali ekran.css `.av`: --surface) and its shadow
    // (--shadow-raised; none in the dark).
    faceRing: '#FFFFFF',
    faceShadow: SHADOW.av,
    // The switch's knob (skall.css `.toggle i`: --surface, --shadow-raised; none in the dark).
    switchKnob: '#FFFFFF',
    switchKnobShadow: '0px 2px 8px rgba(3, 27, 11, 0.08)',
    // The check box and the radio (yeni arayüz tuvali `.cb`, `.rd`: KayitOnay, EngelleOnay,
    // SikayetEt, CheckInNokta): empty a 2 line of the ink at 28 %, on the ink with a white check.
    markLine: 'rgba(3, 27, 11, 0.28)',
    markOn: '#031B0B',
    onMarkOn: '#FFFFFF',
  },
  dark: {
    ink: '#EEF3F0',
    muted: '#A3AEA8',
    hair: 'rgba(255, 255, 255, 0.07)',
    placeholder: 'rgba(255, 255, 255, 0.10)',
    glass: '#121614',
    // U2: the card inside a sheet.
    glassInSheet: '#1B211F',
    glassInSheetEdge: 'rgba(255, 255, 255, 0.09)',
    infoRow: '#1B211F',
    glassEdge: 'rgba(255, 255, 255, 0.09)',
    glassShadow: '',
    glassInset: '',
    primaryInset: '',
    raised: '#121614',
    raisedInSheet: '#1B211F',
    // A shade stronger than the canvas: the round buttons on Masa's dark stage were hard to see.
    raisedRound: '#121614',
    raisedChip: '#121614',
    raisedEdge: 'rgba(255, 255, 255, 0.10)',
    // A round button's line (`.dark .ptop .round`, `.gt`, `.ktop`: #121614 in a 1 px line at 8 %).
    raisedRoundEdge: 'rgba(255, 255, 255, 0.08)',
    filterInk: 'rgba(238, 243, 240, 0.6)',
    raisedShadow: '',
    primaryShadow: '0px 10px 22px rgba(0, 0, 0, 0.35)',
    cardShadow: '',
    chipShadow: '',
    chipOn: '#EEF3F0',
    onChipOn: '#0B0E0D',
    day: '#121614',
    field: '#151A18',
    fieldLg: '#151A18',
    fieldOnCard: '#1B211F',
    fieldOnCardEdge: 'rgba(255, 255, 255, 0.08)',
    segOn: 'rgba(255, 255, 255, 0.94)',
    segOnInk: '#0B0E0D',
    segShadow: '',
    // As before: the sheet's card colour.
    segTrackInSheet: '#1B211F',
    emptyMark: '#1B211F',
    // A shade under the cards, as in the light (the cards' glass is the old sheet's colour).
    sheet: '#121614',
    sheetBase: '#121614',
    sheetFrost: 'linear-gradient(180deg, rgba(18, 22, 20, 0.80), rgba(18, 22, 20, 0.54))',
    sheetFadeTop:
      'linear-gradient(180deg, rgba(18, 22, 20, 1) 0%, rgba(18, 22, 20, 1) 55%, rgba(18, 22, 20, 0) 100%)',
    sheetFadeBottom: 'linear-gradient(180deg, rgba(18, 22, 20, 0), rgba(18, 22, 20, 1))',
    grab: '#2A332F',
    sheetGrab: '#2A332F',
    sheetShadow: '',
    scrim: 'rgba(0, 0, 0, 0.45)',
    switchOff: '#2A332F',
    switchInset: '',
    link: '#3DDC84',
    warn: '#FF977E',
    // U31 (ProfilBaskasi, dark): the green at 14 % and its light ink.
    friendPill: 'rgba(61, 220, 132, 0.14)',
    friendPillInk: '#93EBB9',
    disabled: '#1F2623',
    onDisabled: '#A3AEA8',
    // On a dark card the disabled fill is a step lighter (U10).
    disabledOnCard: '#2A332F',
    dangerSoft: '#3A1E22',
    onDangerSoft: '#FF977E',
    stripDanger: 'rgba(255, 151, 126, 0.12)',
    onStripDanger: '#FF977E',
    stripWarn: 'rgba(255, 181, 71, 0.14)',
    onStripWarn: '#FFC86B',
    stepDot: 'rgba(255, 255, 255, 0.18)',
    faceRing: '#151A18',
    faceShadow: '',
    switchKnob: '#151A18',
    switchKnobShadow: '',
    markLine: 'rgba(255, 255, 255, 0.30)',
    markOn: 'rgba(255, 255, 255, 0.94)',
    onMarkOn: '#0B0E0D',
  },
  // The same in both schemes.
  primary: '#0E8745',
  onPrimary: '#FFFFFF',
  // The lines beside "Yeni mesaj" in a chat.
  freshLine: 'rgba(255, 79, 139, 0.40)',
  // A new invite in Bildirimler: the brand's soft gradient.
  inviteGround: 'linear-gradient(135deg, rgba(14, 135, 69, 0.14), rgba(255, 79, 139, 0.10))',
  // The incoming request's card floats deeper (MasaIstek).
  requestShadow: '0px 30px 60px rgba(4, 73, 35, 0.22)',
  // The venue chat's bubbles (Grup 3, P4; Aura v46 → MekanSohbeti, MekanSohbetiKoyu): the
  // person's own in the primary with white words, its time 90 % white; another's in the screen's
  // glass (its colours from the scheme: glass, glassEdge, ink, muted), the name over it in a soft
  // chip (white 56 %, the dark ground 64 % in the dark). docs/decisions/grup3-mekan-balonlari.md.
  venueBubble: {
    nameChip: { light: 'rgba(255, 255, 255, 0.56)', dark: 'rgba(0, 0, 0, 0.64)' },
  },
  // Message bubbles, never see-through (the owner's call, 29 Ekim): the person's own white (a soft
  // off-white in the dark) with ink words; the others' in the chat's colour, white words: the DM
  // blue, the venue chat green, the table chat pink (deeper in the dark). The venue chat draws
  // the same since 4 Kasım (the owner's call: the own white, the others' solid like it, not glass).
  bubble: {
    light: {
      mine: '#FFFFFF',
      mineInk: '#031B0B',
      mineMuted: '#4A6550',
      mineEdge: 'rgba(3, 27, 11, 0.06)',
      mineShadow: '0px 4px 12px rgba(3, 27, 11, 0.10)',
      // Deeper than the first #2F7CF6 (3.9:1) so its white words read at 4.5:1 (the owner's
      // call, 4 Kasım); the same hue.
      dm: '#2670E0',
      // Darker than the venue chat's old glass-era green so its white words read at 4.5:1.
      mekan: '#17834D',
      // Pink, not the old purple (Aura v65 has no violet in the interface), until K-83's palette.
      masa: '#C2185B',
      themInk: '#FFFFFF',
      themMuted: 'rgba(255, 255, 255, 0.80)',
      // A big emoji's time, on the wallpaper (Telegram Android's dark pill).
      stamp: 'rgba(3, 27, 11, 0.32)',
      stampInk: '#FFFFFF',
    },
    dark: {
      mine: '#E6EEE9',
      mineInk: '#031B0B',
      mineMuted: '#4A6550',
      mineEdge: 'rgba(255, 255, 255, 0)',
      mineShadow: '0px 4px 12px rgba(0, 0, 0, 0.30)',
      dm: '#1E56B8',
      mekan: '#146B42',
      masa: '#8E1446',
      themInk: '#FFFFFF',
      themMuted: 'rgba(255, 255, 255, 0.74)',
      stamp: 'rgba(0, 0, 0, 0.40)',
      stampInk: '#FFFFFF',
    },
  },
  // Another's bubble's soft shadow, in its colour.
  chatShadow: {
    dm: '0px 4px 12px rgba(38, 112, 224, 0.22)',
    mekan: '0px 4px 12px rgba(30, 154, 92, 0.22)',
    masa: '0px 4px 12px rgba(194, 24, 91, 0.22)',
  },
  // A photo opened large over the screen (Profil, a person's profile).
  // Profil fotoğrafı: the dark ground, the white card the photo lies on (22 from the sides, 30
  // round) and its shadow.
  // A neutral dark under a photo (Telegram Android's black), not the ink's green (18.1).
  photoScrim: 'rgba(0, 0, 0, 0.82)',
  // Under the status bar over a picture or a sheet's scrim (audit M15-12): a dark fade 40 below the
  // bar, so its light icons read on a light picture.
  statusScrim: 'linear-gradient(180deg, rgba(0, 0, 0, 0.42), rgba(0, 0, 0, 0))',
  statusScrimBelow: 40,
  photoCard: { side: 22, radius: 30, shadow: '0px 24px 60px rgba(0, 0, 0, 0.35)' },
  // A chosen row's ring (CheckIn: the spot).
  primaryRing: 'rgba(14, 135, 69, 0.14)',
  // docs/design/iskelet.md → 5.8: Profili düzenle's focused field (3 px, the primary at 18 %), the
  // bar's Kaydet with nothing to save (its words), and a settings row's icon square (32, 10 round).
  primaryHalo: 'rgba(14, 135, 69, 0.18)',
  saveIdle: '#9AAEA1',
  rowIcon: { side: 32, radius: 10 },
  // Ayarlar's rows (iskelet.md → 5.9, 2.4): each row's square in its own colour, the icon white.
  rowIconTone: {
    notifications: '#FF4F8B',
    privacy: '#0E8745',
    account: '#2670E0',
    test: '#7A8A80',
  },
  // The bar's Kaydet keeps one width as its words change (iskelet.md → 2.1).
  saveMinWidth: 96,
  pink: '#FF4F8B',
  // Profili düzenle: the camera's white round at the face's corner.
  cameraShadow: '0px 2px 8px rgba(3, 27, 11, 0.08)',
  pinkRing: 'rgba(255, 79, 139, 0.18)',
  success: '#1C8C4E',
  successRing: 'rgba(28, 140, 78, 0.16)',
  danger: '#C8331F',
  white: '#FFFFFF',
  sendShadow: SHADOW.send,
  diskShadow: SHADOW.disk,
  diskRing: 'rgba(255, 255, 255, 0.90)',
  avShadow: SHADOW.av,
  thumbShadow: SHADOW.thumb,
  // .av c1 … c5: a face without a photo, a flat colour from its name (yeni arayüz tuvali ekran.css
  // `.c1` … `.c5`: --primary, --violet, --signal, --success, --read; no gradient), the dark
  // scheme's own (skall.css `.dark`).
  avColors: ['#0E8745', '#C51F62', '#FFB547', '#1C7843', '#2C63D6'],
  avColorsDark: ['#0E8745', '#FF5C93', '#FFB547', '#4CC97E', '#7DB2FF'],
  // .tag colours: ground and text.
  tags: {
    purple: { bg: '#D7EEDC', fg: '#055328' },
    pink: { bg: 'rgba(255, 79, 139, 0.12)', fg: '#B0124F' },
    amber: { bg: '#FFE6C7', fg: '#7A4300' },
    // U16: `.tag.ok` (success-soft) and `.tag.lively` (lively); in the dark Aktiviteler's own.
    green: { bg: '#CDEFD9', fg: '#0F5C31' },
  },
  tagsDark: {
    purple: { bg: 'rgba(61, 220, 132, 0.14)', fg: '#93EBB9' },
    pink: { bg: 'rgba(255, 126, 168, 0.20)', fg: '#FFD0E0' },
    amber: { bg: 'rgba(255, 181, 71, 0.16)', fg: '#FFD8A3' },
    green: { bg: 'rgba(61, 220, 132, 0.16)', fg: '#93EBB9' },
  },
  // A read message's double tick (Mesajlar, Dm).
  // On the viewer's own white bubble (a soft off-white in the dark): the light read blue in both.
  readTick: '#2C63D6',
  // A game card's corner tag: dark glass over its picture (Masa), and its shadow.
  artTag: 'rgba(3, 27, 11, 0.55)',
  // U17 (KesfetMekan `.htop`): over the venue's scene, in both schemes, the back button on light
  // glass and the tags light, the calm one in the calm green.
  sceneRound: { bg: 'rgba(255, 255, 255, 0.82)', edge: '#FFFFFF', ink: '#031B0B' },
  sceneTag: { bg: 'rgba(255, 255, 255, 0.82)', fg: '#031B0B' },
  // Aura v75 AktivitelerEtkinlik (`.tag.lively.gl`, `.tag.gl`): an event card's two tags over its
  // riso scene, the same in both schemes.
  eventTag: { bg: '#FFE7C2', fg: '#7A4300' },
  eventTimeTag: { bg: 'rgba(255, 255, 255, 0.86)', fg: '#031B0B' },
  // U19: the words over Mekan's riso "Henüz masan yok" scene, in both schemes (Mekan `.rtext`).
  risoScene: {
    title: '#031B0B',
    note: '#2B3A30',
    words: 176,
    radius: 28,
    gap: 6,
    buttonTop: 8,
    // The dark scheme's dim over the light scene (the owner's report, 2 Kasım, 6.2).
    darkVeil: 'rgba(0, 0, 0, 0.22)',
  },
  // U20 (MekanMasali `.mcard`): the person's table on glass 28 round, 6 in; its wide riso card 168
  // high, 22 round; the name on dark glass 12 in from the card's bottom left (`.mname`: 14 × 8 in,
  // 16 round, blur 10), the people 12 in from its bottom right; under it 12 / 16 / 16 in, 12 apart.
  tableCard: {
    pad: 6,
    radius: 28,
    // iskelet.md → 5.11: the picture on the card's whole width, 210 high.
    height: 210,
    // The same dark fade under the name on every card, over the picture's lower part.
    shade: 'linear-gradient(180deg, rgba(3, 27, 11, 0) 0%, rgba(3, 27, 11, 0.64) 100%)',
    shadeHeight: 110,
    // The glass state tag at the picture's corner (no live blur, 2.2).
    status: {
      fill: 'rgba(255, 255, 255, 0.62)',
      edge: 'rgba(255, 255, 255, 0.90)',
      ink: '#031B0B',
      padX: 10,
      padY: 5,
    },
    // The faces apart on the card's ground (2.4: 2.5 and a soft shadow), an empty seat dashed.
    face: { ring: 2.5, overlap: 8, shadow: '0px 2px 6px rgba(3, 27, 11, 0.16)', dash: 1.5 },
    ground: { light: '#F7FBF8', dark: '#121614' },
    // The thin fill under the faces: green while there is room, pink once full.
    meter: { height: 4, free: '#1C8C4E', full: '#FF4F8B' },
    // The strip it folds into: its picture 52, 14 round, 10 in.
    stripPad: 10,
    stripRadius: 14,
    // No table: the riso picture against the card's right, the words on the paper's fade.
    paper: '#ECE4CE',
    paperFade:
      'linear-gradient(90deg, rgba(236, 228, 206, 1) 0%, rgba(236, 228, 206, 1) 44%, rgba(236, 228, 206, 0) 74%)',
    paperPicture: 0.68,
    imageRadius: 22,
    inset: 12,
    name: {
      padX: 14,
      padY: 8,
      radius: 16,
      fill: 'rgba(3, 27, 11, 0.42)',
      blur: 10,
      eyebrow: 'rgba(255, 255, 255, 0.8)',
    },
    body: { top: 12, x: 16, bottom: 16, gap: 12 },
  },
  sceneTagCalm: { bg: 'rgba(215, 238, 220, 0.92)', fg: '#055328' },
  // U22 (Masa `.fadebot`): the table's riso card seen at 40 % down; the games fade into the canvas
  // over the bottom 90 (solid from 80 %). The rest of Masa: theme/room.ts.
  table: {
    stripFocus: 0.4,
    fade: 90,
    fadeSolid: 0.8,
  },
  // U23 (MasaDavet `.srow`, `.warn`): a friend's row 64 high, 8 / 12 / 8 / 14 in, on glass sm; the
  // full table's note above the list, warn-soft 16 round, 12 / 14 in, its icon 10 from the words.
  inviteRow: { height: 64, padY: 8, padLeft: 14, padRight: 12 },
  warnBox: {
    light: { bg: '#FFF1D6', fg: '#5C3A00' },
    dark: { bg: 'rgba(255, 181, 71, 0.14)', fg: '#FFE2B3' },
    radius: 16,
    padX: 14,
    padY: 12,
    gap: 10,
  },
  // U26 (MekanSohbetiBos `.ecard`, `.disc`): the empty venue chat's glass card 18 × 20 in, 8
  // apart; its 48 disc on a soft green, the chat icon in the accent with the pink body (.55).
  venueChatEmpty: {
    padX: 20,
    padY: 18,
    gap: 8,
    disc: 48,
    discGround: 'rgba(18, 152, 79, 0.12)',
    ink: { light: '#0B783D', dark: '#1FDC75' },
    body: '#FF4F8B',
    bodySoft: 0.55,
  },
  // Who the viewer writes as, in the chat's top bar (the owner's call, 8 Kasım: the strip over the
  // message bar went): two 30 slots 2 apart in a sunk track 2 in; a spent change locks it (a 14
  // badge, its icon 10). While the change is on its way the whole toggle at `busy`. Yeni arayüz
  // tuvali `.tog`: the chosen one in a 2.5 ring outside it, no fill; the face 2 inside its slot; the
  // other at 55 %; the track --surface2 with a 1 px line inside (in the dark #1B211F without it).
  identityToggle: {
    slot: 30,
    pad: 2,
    gap: 2,
    ring: 2.5,
    faceIn: 2,
    dim: 0.55,
    ringColor: { light: '#0E8745', dark: '#3DDC84' },
    track: { light: '#E6F0E8', dark: '#1B211F' },
    trackLine: { light: 'inset 0px 0px 0px 1px rgba(3, 27, 11, 0.06)', dark: '' },
    busy: 0.6,
    lock: 14,
    lockIcon: 10,
  },
  // Its empty note (`.day`): a glass pill 14 × 6 in, 13/17 600.
  chatEmptyPad: { x: 14, y: 6 },
  // docs/design/iskelet.md → 5.3: the game sheet's green-toned note (16 round, 12 in; 2.4: the
  // sheet's card less its inset), its words in the clear button's green.
  historyNote: {
    light: { fill: 'rgba(14, 135, 69, 0.10)', ink: '#0B5A2D' },
    dark: { fill: 'rgba(31, 220, 117, 0.14)', ink: '#1FDC75' },
    radius: 16,
    pad: 12,
  },
  // docs/design/iskelet.md → 5.2 (the `kapak` bar): the cover 360 high, moving at 0.45 of the
  // scroll; a 130 dark fade over its top (#031B0B at 38 % to clear); the content riding over its
  // foot as a card 34 round; the band coming in over 240–280, the venue's small picture (32, 10
  // round: 2.4) and name beside the back button over 300–330.
  venueCover: {
    height: 330,
    speed: 0.45,
    shadeHeight: 130,
    shade: 'linear-gradient(180deg, rgba(3, 27, 11, 0.38) 0%, rgba(3, 27, 11, 0) 100%)',
    cardRadius: 28,
    // How far the card rides over the cover's foot (MekanDetay: the card at 300 of a 330 cover).
    cardOverlap: 30,
    band: [240, 280],
    barTitle: [300, 330],
    barThumb: 32,
    barThumbRadius: 10,
  },
  gameCardShadow: '0px 12px 26px rgba(4, 73, 35, 0.18)',
  // A nick's colour in a line of the venue chat (Mekan: kapsul-sn19 in amber's ink).
  nickInk: '#9A4A00',
  nameInk: '#B0124F',
  size: {
    glassRadius: 28,
    glassRadiusSm: 22,
    pad: 18,
    padLg: 22,
    // The sizes as the boards draw them (the owner's call, 18 Kasım; yeni arayüz tuvali skall.css,
    // ekran.css and the boards' own): the main button 48 (`.btn`), the small 36 (`.btn.sm`), the
    // big 56 at 700 17/22 (`.btn.big`; the long one `btnTall` 56 at the main's type, `.fx .btn`), a
    // round icon button 44, a form field 48, a chip 40 (`.chip`), Süsle's filter chip 28 (`.flt
    // span`), a bar's button 40 (`.tb2 .btn`); a row's buttons 32, 34 or 40 by its screen (`rowBtn*`;
    // the many-line field 104, 22 round; the sheet 8 from the edges, 28 round, its handle 40 × 4).
    btn: 48,
    btnTall: 56,
    btnBig: 56,
    btnSm: 36,
    btnBar: 40,
    rowBtnSm: 32,
    rowBtnMd: 34,
    rowBtnLg: 40,
    // Mekan's "Masa kur" and Masa's "Bitir": the small height, 18 inside.
    btnMid: 36,
    btnPadXMid: 18,
    btnPadXSnug: 16,
    btnPadX: 24,
    btnPadXSm: 16,
    btnGap: 8,
    // A chip 36 (skall.css `.chip`); 40 where its board draws 40 (`chipLg`: Keşfet's kind chips,
    // MekanLobiAc's intent chips; 600 14/18, 16 inside). Süsle's filter chip 28, 11 inside
    // (`.flt span`).
    chip: 36,
    chipTall: 36,
    chipTallPadX: 16,
    chipLg: 40,
    chipFilter: 28,
    chipFilterPadX: 11,
    // Aura v75 E4 (narrow): a chip 46, a field 56, a segment 52.
    chipNarrow: 46,
    fieldNarrow: 56,
    segItemNarrow: 52,
    chipLgPadX: 16,
    // U19: Mekan's spot chip, 40 high and 16 in.
    chipMdPadX: 16,
    chipPadX: 12,
    chipGap: 6,
    chipsGap: 8,
    tag: 24,
    // A venue page's tags over its scene: 30 high, 12 inside.
    tagLg: 28,
    tagLgPadX: 12,
    tagPadX: 8,
    tagGap: 4,
    round: 44,
    // iskelet.md → 2.1 and 3.1: every top bar button 44 (the glass back button; the yeni arayüz
    // tuvali's `.round`, 17 Kasım, was 46); a sticky field
    // pins `stickyTop` under the top of its screen's scrolling body (top 52 to 54 on the canvas's 47
    // status bar) and the band reaches `stickyBandPad` under it.
    topBtn: 44,
    stickyTop: 6,
    stickyBandPad: 8,
    // iskelet.md → 5.1 (Keşfet): the search and list/map capsule 54, 48 once pinned, its switch's
    // rounds 3 in; a venue's card 26 round and 12 inside, its picture 76 at 14 (2.4: the card's 26
    // less its 12), the words 14 from it, the cards 10 apart (tuval Kesfet); the empty card's riso
    // 104x72. The rest of the boards' values: theme/explore.ts.
    explore: {
      capsule: 54,
      capsulePinned: 48,
      capsulePadX: 18,
      switchPad: 3,
      switchGap: 2,
      icon: 20,
      card: { radius: 26, pad: 12, picture: 76, pictureRadius: 14, gap: 14, lineGap: 5 },
      cardsGap: 10,
      empty: { width: 104, height: 72, radius: 14 },
    },
    // The venue page's back button (48).
    roundLg: 44,
    // A list row's picture: 48 (the owner's call, 30 Ekim: the rows were too thick at 52).
    // `seat`: Masa's card when its people fit one row (58).
    // member: Masa's people (U22); list: Masadakiler's rows (U24).
    av: {
      // The venue chat's last writers under its title (the owner's call, 8 Kasım).
      xs: 18,
      // Masa's row of faces (yeni arayüz tuvali, Masa `.fcs`).
      roomFace: 24,
      sm: 32,
      member: 36,
      // The DM's top bar (yeni arayüz tuvali, DmSohbet `.who .av`: 40).
      bar: 40,
      list: 40,
      md: 44,
      row: 48,
      // A conversation in Mesajlar (tuval Mesajlar: 54).
      inbox: 54,
      seat: 58,
      lg: 64,
      xl: 96,
      big: 112,
      // U31: another person's profile (ProfilBaskasi `.herow .av.xl`).
      hero: 120,
      // U34: Profili düzenle's face (ProfilDuzenle `.avw .av.xl`).
      edit: 88,
    },
    stackOverlap: 10,
    // Profil's two buttons and Kapsülün's: the main height (B1).
    btnRow: 48,
    // The empty state: its sign 28 × 42; 26 above (the lobby's 18). Yeni arayüz tuvali
    // (AktivitelerBos, AktivitelerHata `.emp`): 24 in from the sides, the title 12 under the
    // picture, the sentence 4 under it and at most 260 wide, the button 16 under it; the riso
    // picture small and unframed (150 across, a card's or a sheet's 120; no corner, no shadow).
    emptyMark: { width: 28, height: 42 },
    emptyTitleTop: 12,
    // In a card of its own (DmBos `.demp .et`): 10.
    emptyTitleTopCard: 10,
    emptyNoteTop: 4,
    emptyNoteMax: 260,
    // Engellenenler and Sessize alınanlar empty (`.emp span`: at most 240 wide).
    emptyNoteMaxSm: 240,
    emptyActionTop: 16,
    emptyPad: 24,
    emptyRiso: 150,
    emptyRisoSm: 120,
    // The Aura v76 BosDurumlar pictures are 640 × 440 exports: drawn whole at their own shape.
    emptyRisoAspect: 440 / 640,
    emptyTop: 26,
    emptyTopSm: 18,
    // U36 (GaleriKesfet, GaleriProfil `.disc`): the error and icon state's disc 64, its icon 26
    // (its words and button as the empty state's). Loading (MekanYukleniyor): the meeting capsules
    // 50 (YukleniyorListe `.ld` 22 x 50), no visible note (screen readers say it).
    stateDisc: 64,
    // GuncellemeGerekli `.up`: the wordmark 30 high, 28 over the 260 × 212 picture, the title 16
    // under it, the sentence 8 under that (300 wide at most); the button and the version line 12
    // apart at the bottom.
    updateWordmark: 30,
    updateWordmarkGap: 28,
    updateRisoW: 260,
    updateRisoH: 212,
    updateTitleTop: 16,
    updateNoteTop: 8,
    updateNoteMax: 300,
    updateFootGap: 12,
    // AktivitelerHata, AktivitelerBaglantiYok `.emp img`: the error and offline riso picture.
    stateRisoW: 210,
    stateRisoH: 172,
    stateIcon: 26,
    // Aura v75 E4: a tag when narrow (320 dp or the largest text, src/lib/narrow.ts).
    tagNarrow: 30,
    // Aura v75 AktivitelerHal `.erc .ci`.
    stateIconPage: 28,
    stateLoader: 50,
    stateLoadTop: 18,
    // Aktiviteler's history rows (iskelet.md → 5.3): a 56 picture.
    historyThumb: 56,
    // Kapsülün (U35): the capsule's 4 ring; the chosen option's 2 ring 2 out round its capsule; a
    // chip's close icon 10 in.
    capsuleRing: 4,
    // Kapsülünü süsle (iskelet.md → 5.10): the capsule 220 on its riso scene (its shadow and disc:
    // theme/capsuleEdit.ts); a part put on drops it 18 onto its feet. The trying strip: 84 round
    // options, 96 apart, the centred one 1.14 and ringed in green, the others 0.9; its art 62
    // inside, its two ends fading over 86 (22 % of the board's 390); at most 7 dots under it. The
    // centred option's green ring 3 wide on its edge (tuval Kapsul2).
    capsuleStage: 220,
    capsuleDrop: 18,
    stripItem: 84,
    stripStep: 96,
    stripOn: 1.14,
    stripOff: 0.9,
    stripArt: 62,
    stripFade: 86,
    stripDots: 7,
    boxRing: 3,
    boxRingGap: 0,
    chipIconPadLeft: 10,
    avRing: 2,
    avRingXs: 1.5,
    avRingXl: 3,
    avRingHero: 4,
    thumb: 60,
    thumbRadius: 18,
    badge: 20,
    badgeLg: 24,
    badgePadX: 6,
    dot: 8,
    dotRing: 4,
    focusHalo: 3,
    // Telegram Android's thin rows (the owner's call, 30 Ekim): 48 picture, 9 above and under.
    liPadY: 9,
    liPadX: 16,
    liGap: 12,
    listPadY: 4,
    secPadTop: 4,
    secPadX: 2,
    rowGap: 12,
    side: 20,
    icon: 22,
    // A round button's icon 44 and over (skall.css `.round .ci`: --icon-lg).
    roundIcon: 24,
    iconSm: 18,
    iconSnug: 20,
    disk: 4,
    seg: 26,
    // A segmented control 44 high, its chosen part 36 (skall.css `.seg`).
    segItem: 36,
    // Mesajlar's tabs: 48 high in a 30 round.
    // U27: Mesajlar's tabs 48 in all (40 tabs 4 in), a pill.
    segLg: 40,
    segLgRadius: 24,
    // Mesajlar's bell (52) and its new message button (70, 26 from the right).
    // U27: the bell 44 (round soft).
    bell: 44,
    // iskelet.md → 5.4: the new chat button a prominent round, a body's main button (2.1: 50 to
    // 56), 20 from the right.
    newChat: 56,
    newChatRight: 20,
    // Mesajlar's rows: a 58 face, 12 above and under.
    // U27 (`.list .li`): a conversation 72 high, 12 / 16 in; the hairline from 72.
    inboxPadY: 12,
    inboxRow: 72,
    // iskelet.md → 3.5: the sheet 8 in from the edges (its corners KIT.layer's 28); its title 10
    // under the handle, no close button (18 Kasım); what scrolls fades out over `sheetFade` at its
    // edges (no band).
    sheetInset: 8,
    sheetHeadGap: 10,
    sheetFade: 24,
    // iskelet.md → 3.5: a menu grown from its button 8 from it and the screen's edges (its look
    // KIT.layer's: the ⋮ menu and the long-press menu).
    menuGap: 8,
    // The handle 12 under the sheet's top edge (yeni arayüz tuvali skall.css `.sheet`: 12 / 20 / 24).
    sheetPadTop: 12,
    sheetPadX: 20,
    // Under the sheet's content: its 38 (SablonSheet) is the bottom safe area (34) and 4 more, so
    // its buttons sit 12 above the safe area as everywhere (U9).
    sheetPadBottom: 4,
    // At least the `.sheet`'s own 24 under its content (no safe area).
    sheetPadBottomMin: 24,
    sheetGap: 16,
    // Masa kur (aura v47): what scrolls fades into the footer's top edge, only while it overflows.
    sheetFooterFade: 32,
    grabW: 40,
    // The handle 40 × 4 (yeni arayüz tuvali skall.css `.grab`: every sheet and Profil's panel).
    grabH: 4,
    msgRadius: 22,
    msgTail: 8,
    // Chat bubbles (iskelet.md → 5.5): 20 round, 7 where a run's bubbles face each other, the run's
    // last one with a tail 7 × 12; a run's bubbles 2 apart (yeni arayüz tuvali, DmKlavye, MekanSohbet,
    // SemtSohbet `.flow{gap:2}`), 12 when the writer changes.
    bubbleRadius: 20,
    bubbleInner: 7,
    runGap: 2,
    runApart: 12,
    bubblePadX: 12,
    bubblePadY: 7,
    tailW: 7,
    tailH: 12,
    field: 48,
    // Aura v71 (GaleriEklenen): a boxed field 60 (the birth date), the name's 72 with 22 inside.
    fieldBox: 60,
    fieldBig: 72,
    fieldBigPad: 22,
    // The empty photo picker (KayitFoto `.pick`): 120 across, its dashed line 3.
    photoPick: 120,
    photoPickLine: 3,
    // The check box and the radio: 24, the box 8 round (`.check`, `.radio`).
    // `.cb` and `.rd`: 24, the box 7 round with an 18 check, the empty line 2, the chosen radio's
    // ring 7.
    checkBox: 24,
    checkRadius: 7,
    checkTick: 18,
    markLine: 2,
    radioOn: 7,
    // A choice or consent row: 56 and 64 at least (the consents, `.opt`), 10 or 12 above and under.
    optMin: 56,
    optPadY: 10,
    consentPadY: 12,
    // A person's row in a settings page (`.lr`): 64 at least. A settings row itself: theme/settings.ts
    // → SETTINGS.row (yeni arayüz tuvali `.sr`).
    lrMin: 64,
    // A person's row: the face 44 (`.av`).
    avPerson: 44,
    // The warning strip: 14 above and under, 16 in, 4 between its title and words.
    warnPadY: 14,
    warnPadX: 16,
    warnGap: 4,
    // A sheet's title icon, in the line, and the gap to the words.
    titleIcon: 24,
    titleIconGap: 10,
    // Profili düzenle's fields: 48 high (B1; the bio 104, 22 round), 22 inside.
    fieldLg: 48,
    fieldLgTall: 104,
    fieldLgTallRadius: 22,
    fieldLgPadX: 22,
    fieldLgPadY: 16,
    // A chat's message field and its send button 52 (yeni arayüz tuvali `.fld`, `.snd`).
    composerField: 52,
    composerSend: 52,
    // iskelet.md → 5.5: the DM's message bar one glass capsule 52, its send a 38 green round inside
    // it at the right, `composerSendInset` from its edge.
    composerCapsule: 52,
    composerSendIn: 38,
    composerSendInset: 7,
    phoneField: 72,
    fieldPadX: 20,
    dayPadX: 12,
    dayPadY: 4,
    barPad: 8,
    barRadius: 30,
    barGap: 10,
    // The DM's top as Telegram Android draws it (the owner's call, 29 Ekim): the avatar this far
    // inside its pill, the pills all as tall as it.
    // The DM's name pill: as tall as the rounds beside it, 44 (the owner's call, 2 Kasım, 13.1).
    dmPill: 44,
    pill: 44,
    eventCard: 210,
    // Mekan's scene (210) and the words in it (20 in, 180 wide).
    hero: 210,
    heroPad: 20,
    // The switch (skall.css `.toggle`): 52 × 32, the knob 26.
    switchW: 52,
    switchH: 32,
    switchKnob: 26,
    // Masa kur's icon row: 12 apart, 16 round, the ring 3 out.
    iconTileGap: 12,
    iconTileRadius: 16,
    // Masa's game cards: 24 round, the tag 8 in and 7 down.
    gameCardRadius: 22,
    gameTagX: 8,
    gameTagY: 8,
    // Mekan's and Masa's blocks: 14 apart.
    venueGap: 14,
    eventPad: 12,
    segPad: 4,
    segGap: 4,
    hair: 1,
    edge: 1,
  },
  // The new look's layers (yeni arayüz tuvali, 16 Kasım; docs/design/yeni-arayuz/project:
  // AyarlarCikis, MesajlarSohbetSil, EngelleOnay, SikayetEt, MekanSecenek, MesajlarUzunBas,
  // SusleKaydedilemedi, OrtakKurallar C2): the dialog, the sheet, the ⋮ menu, the long-press menu,
  // the toast and their scrims. Defined here; the dialog, sheet and menu work that follows draws
  // them. Flat surfaces, no live blur; only the long-press menu's still copy is blurred.
  layer: {
    light: {
      // The dialog: the surface, its shadow; its danger button soft red, its icon's disc red 10 %.
      dialog: '#FFFFFF',
      dialogShadow: '0px 18px 48px rgba(3, 27, 11, 0.22)',
      dialogDanger: '#FBE1DB',
      onDialogDanger: '#A8301A',
      dialogDisc: 'rgba(214, 64, 40, 0.10)',
      // The icon on a danger dialog's disc (EngelleOnay `.ei`: var(--danger), skall.css #A8301A).
      dialogIcon: '#A8301A',
      // The dialog's and the sheet's scrim, flat; the long-press menu's over its still copy.
      scrim: 'rgba(3, 27, 11, 0.42)',
      holdScrim: 'rgba(3, 27, 11, 0.30)',
      // The ⋮ menu and the long-press menu: the surface, their shadow and ring; the rows' hairline;
      // the long-press menu's red group apart on a band.
      menu: '#FFFFFF',
      menuShadow: '0px 18px 48px rgba(3, 27, 11, 0.22), 0px 0px 0px 1px rgba(3, 27, 11, 0.06)',
      menuHair: 'rgba(3, 27, 11, 0.10)',
      holdHair: 'rgba(3, 27, 11, 0.08)',
      holdBand: 'rgba(3, 27, 11, 0.05)',
      // The rows' icons and the red (MekanSecenek `.pi`: --primary; MesajlarUzunBas `.pi`: the
      // ink with its body muted; `.dg`: --danger, its body at 35 % in the long-press menu). The
      // body (`.ci .b`) is drawn at --ci-bo, .5, over that: muted at 50 %, the red at 17.5 %.
      menuIcon: '#0E8745',
      menuDanger: '#A8301A',
      holdIcon: '#031B0B',
      holdIconBody: '#4A6550',
      holdIconSoft: 0.5,
      holdDangerBody: '#C8381F',
      holdDangerSoft: 0.175,
      // The sheet: the surface, its handle (skall.css `.grab`: --control) and its shadow.
      sheet: '#FFFFFF',
      sheetGrab: '#C6E0CC',
      sheetShadow: '0px -8px 40px rgba(3, 27, 11, 0.18)',
      // The toast: the ink with white words, its button and its shadow.
      toast: '#031B0B',
      onToast: '#FFFFFF',
      toastButton: 'rgba(255, 255, 255, 0.14)',
      toastShadow: '0px 12px 30px rgba(3, 27, 11, 0.30)',
      // A failure's icon on the toast (SusleKaydedilemedi `.ti2`): the strong part, the body at
      // `toastIconSoft`.
      toastIcon: '#FF977E',
      toastIconSoft: 0.4,
      // EngelleOnay's "Şikayet de et" row (`.chk`, `.cb`): hairlines over and under it; the box a
      // 2 px inset line, filled with the ink and a white check when ticked.
      checkHair: 'rgba(3, 27, 11, 0.08)',
      checkLine: 'rgba(3, 27, 11, 0.28)',
      checkOn: '#031B0B',
      onCheckOn: '#FFFFFF',
    },
    dark: {
      dialog: '#151A18',
      // No shadow in the dark: a 1 px white ring.
      dialogShadow: '0px 0px 0px 1px rgba(255, 255, 255, 0.08)',
      dialogDanger: 'rgba(255, 151, 126, 0.12)',
      onDialogDanger: '#FF977E',
      dialogDisc: 'rgba(255, 151, 126, 0.12)',
      dialogIcon: '#FF977E',
      scrim: 'rgba(0, 0, 0, 0.70)',
      holdScrim: 'rgba(0, 0, 0, 0.62)',
      menu: '#151A18',
      menuShadow: '0px 18px 48px rgba(0, 0, 0, 0.70), 0px 0px 0px 1px rgba(255, 255, 255, 0.08)',
      menuHair: 'rgba(255, 255, 255, 0.10)',
      holdHair: 'rgba(255, 255, 255, 0.08)',
      holdBand: 'rgba(255, 255, 255, 0.05)',
      menuIcon: '#3DDC84',
      menuDanger: '#FF977E',
      holdIcon: '#EEF3F0',
      // koyu: the body rgba(238,243,240,.45) and the red's at .35, each at .5 (`.ci .b`).
      holdIconBody: '#EEF3F0',
      holdIconSoft: 0.225,
      holdDangerBody: '#FF977E',
      holdDangerSoft: 0.175,
      // SikayetEt's dark sheet: #121614 and a 1 px white ring.
      sheet: '#121614',
      sheetGrab: '#2A332F',
      sheetShadow: '0px 0px 0px 1px rgba(255, 255, 255, 0.08)',
      // The toast turned over: white with the ink.
      toast: '#FFFFFF',
      onToast: '#031B0B',
      toastButton: 'rgba(3, 27, 11, 0.08)',
      toastShadow: '0px 12px 30px rgba(3, 27, 11, 0.30)',
      toastIcon: '#C8381F',
      toastIconSoft: 0.35,
      checkHair: 'rgba(255, 255, 255, 0.08)',
      checkLine: 'rgba(255, 255, 255, 0.30)',
      checkOn: 'rgba(255, 255, 255, 0.94)',
      onCheckOn: '#0B0E0D',
    },
    size: {
      // The dialog 28 in from the sides, 28 round, 24 / 20 / 20 inside; its icon's disc 56 (the
      // icon 28), the title 14 under it; its words 6 under the title and 20 over the buttons (and
      // over what the caller puts between); the second button 8 under the first.
      dialogInset: 28,
      dialogRadius: 28,
      dialogPadTop: 24,
      dialogPadX: 20,
      dialogPadBottom: 20,
      dialogDisc: 56,
      dialogDiscIcon: 28,
      // AyarHesapSil (`.dlg .ic2 .ci`): 26 on the soft red disc.
      dialogDiscIconSm: 26,
      dialogTitleGap: 14,
      dialogTextTop: 6,
      dialogTextBottom: 20,
      dialogButtonGap: 8,
      // The icon in its buttons 24 (skall.css `.ci`: --icon-lg).
      dialogButtonIcon: 24,
      // Where it stands (the boards' `.dlg` top 250 / 280 / 210 by its height): a little over the
      // middle, this share of the room it leaves above it and the rest under it.
      dialogAbove: 0.44,
      // A soft pill of words between the sentence and the buttons (SemtSureBitti `.dw`).
      dialogPill: { radius: 14, padY: 6, padX: 12 },
      // The ⋮ menu: 292 wide, 28 round, 16 / 8 / 8 inside, 12 from the screen's edge; a row 48 at
      // least, 6 / 12 in, 18 round, its icon 22 and 14 to the words, the hairline from 48.
      menuWidth: 292,
      menuRadius: 28,
      menuPadTop: 16,
      menuPadX: 8,
      menuPadBottom: 8,
      // A ⋮ menu whose first row is a row, not a heading (SemtSecenek, MekanSohbetSecenek: 8 all
      // round).
      menuPadTight: 8,
      // An off row's icon (`.pi.off .ci`).
      menuOffIcon: 0.5,
      menuEdge: 12,
      menuRow: 48,
      menuRowPadX: 12,
      menuRowPadY: 6,
      menuRowRadius: 18,
      menuIcon: 22,
      menuRowGap: 14,
      menuHairIn: 48,
      // The long-press menu: 268 wide, 24 round, 6 inside; a row 44 at least, 12 in, 16 round, its
      // icon 20 and 14 to the words, the hairline from 46; the red group 6 apart on its band; the
      // still copy under it blurred 6.
      holdWidth: 268,
      holdRadius: 24,
      holdPad: 6,
      holdRow: 44,
      holdRowPadX: 12,
      holdRowRadius: 16,
      holdIcon: 20,
      holdGap: 14,
      holdHairIn: 46,
      holdBand: 6,
      holdBlur: 6,
      // The sheet: 8 from the edges, 28 round, 12 / 20 / 34 inside; its handle 40 × 4, 16 over
      // the content.
      sheetInset: 8,
      sheetRadius: 28,
      sheetPadTop: 12,
      sheetPadX: 20,
      sheetPadBottom: 34,
      grabW: 40,
      grabH: 4,
      grabGap: 16,
      // The toast: 20 from the sides, 20 round, 12 / 12 / 12 / 14 inside, 12 between its parts;
      // its icon 22, its button 36 (14 in); the line under its title at 70 %.
      toastSide: 20,
      toastRadius: 20,
      toastPad: 12,
      toastPadLeft: 14,
      toastGap: 12,
      toastIcon: 22,
      toastButton: 36,
      toastButtonPadX: 14,
      toastSubOpacity: 0.7,
      // The short notice as a capsule in the middle (tuval MesajlarSilindi `.snk`): 44 high, 18
      // in, its one line 600 14/18.
      toastPill: 44,
      toastPillPadX: 18,
      // EngelleOnay's "Şikayet de et" row: 12 over and under its words, 12 from the box to them;
      // the box 24, 7 round, its line 2, its check 18.
      checkRowPad: 12,
      checkRowGap: 12,
      checkBox: 24,
      checkBoxRadius: 7,
      checkBoxLine: 2,
      checkMark: 18,
    },
  },
} as const;

// Shadows in one `boxShadow`, the empty ones left out (a scheme without a top edge).
export function shadowList(...parts: (string | undefined)[]): string | undefined {
  const list = parts.filter((p): p is string => !!p);
  return list.length > 0 ? list.join(', ') : undefined;
}
