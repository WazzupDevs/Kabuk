// Mesajlar and Arşivlenenler as the new board draws them (yeni arayüz tuvali, 16 Kasım: Main,
// MesajlarKaydir, MesajlarSabitDolu, MesajlarArsivRozet, MesajlarBos, MesajlarAra, MesajlarAraBos,
// Arsiv, ArsivBos; 390 × 844, the status bar 47 high), value for value. The rows lie flat on the
// ground as Arkadaşlar's (theme/flatLists.ts).
import { ACTIVITIES } from './activities';

export const MESSAGES = {
  // The page (`.content`): 13 under the status bar (60 on the board), 20 from the sides, 12 between
  // its parts; two lists 8 more apart (`.lst+.lst`).
  top: 13,
  side: 20,
  gap: 12,
  listGap: 8,
  // The field 12 under the title's row: the screen's fixed top keeps 4 under it (Screen → `top`).
  fieldTop: 8,
  // The title's row (`.hd .acts`): the new message's round and the bell, 44 each, 8 apart.
  actsGap: 8,
  // The tabs (`.sg`): a glass capsule 44 high in all (its 1 edge and 3 inside, 4 from its outside),
  // its two parts 36 and 22 round; a tab's words and its badge 6 apart (`.sg span{gap:6}`).
  tabs: { ...ACTIVITIES.tabs, pad: 3, badgeGap: 6 },
  // The search capsule (`.field.srch`): 20 in at either side, its icon 20 (`.ci.md`).
  searchPad: 20,
  // The bell (`.round .nd`): its dot 9, 9 from its top and 10 from its right, in a 2 ring of the
  // ground.
  bell: { dot: 9, dotTop: 9, dotRight: 10, dotRing: 2 },
  // A conversation (`.rw`): 10 above and under, 20 in (the list runs to the screen's edges), 12
  // between the face (48 in a 2 ring) and its words, 72 at least; the name's line and the last
  // line's 2 apart, their parts 8; the ticks 18 (`.tick`).
  // The last line's end fades out over 44 (`.pv` mask).
  row: { padY: 10, padX: 20, gap: 12, minHeight: 72, ring: 2, lineGap: 2, metaGap: 8, fade: 44 },
  // The held row over the scrim (MesajlarUzunBas `.rw.ub`): 12 in from the sides, 8 inside (its
  // words 20 in as the row's), 22 round.
  lifted: { side: 12, padX: 8, radius: 22 },
  ticks: { width: 18 },
  // Arşivlenenler's top (Arsiv, ArsivBos `.ptop`, `.pt2`): the row as high as its parts (the 44
  // round, the title 26 over the count), not Arkadaşlar's 56; the count's line stands in the page's
  // 20 line (`.pt2 span` is inline: its 13/18 words sit lower). On the phone the count's letters
  // stand 2 higher in their line than Chrome draws them, so it is 4 under the title and the hint
  // 2 less under the row (the hint stays where the board has it; Arsiv, measured 18 Kasım). With
  // no count (ArsivBos) the row is the 44 round's and the page starts 4 + 12 under it.
  archiveTop: { countTop: 4, fieldTop: 10, emptyTop: 12 },
  // The empty states (MesajlarBos, MesajlarAraBos, ArsivBos `.emp`): centred between the part over
  // it (12 under) and 190 from the board's foot, which is 100 over its tab bar (`.tb`: 30 + 60).
  // On the phone the tab bar stands 12 over the safe area and the list's foot keeps 90 over it
  // (Screen → SCROLL_PAD): 82 more puts the foot 100 over the bar as on the board.
  emptyLift: 82,
  // "Sohbet silindi" (MesajlarSilindi `.snk`): 16 over the tab bar (106 from the foot).
  noticeAbove: 16,
  // A search's count over its rows (`.rlbl`): 4 under the field.
  resultTop: 4,
  // The buddies over Bildirimler's sheet (Peek): 56 × 70, 40 in from the left and 44 from the
  // right, 62 over the sheet's top edge, rising from 40 below.
  peek: { width: 56, height: 70, left: 40, right: 44, up: 62, rise: 40 },
  light: {
    // The tabs' glass (`.sg`: --glass-bg, --glass-line, --glass-shadow) and the chosen part's
    // shadow (`.seg span.on`).
    tabsGlass: {
      fill: 'linear-gradient(180deg, rgba(255, 255, 255, 0.80), rgba(255, 255, 255, 0.54))',
      edge: 'rgba(255, 255, 255, 0.86)',
      inset: 'inset 0px 1px 0px #FFFFFF',
      shadow: '0px 18px 44px rgba(4, 73, 35, 0.10), 0px 2px 6px rgba(4, 73, 35, 0.05)',
    },
    tabOnShadow: '0px 2px 6px rgba(3, 27, 11, 0.18)',
    // The search's icon (`.srch`: --ci-a --muted).
    searchIcon: '#4A6550',
    // The held row (`.rw.ub`): --surface, its shadow.
    lifted: { fill: '#FFFFFF', edge: '', shadow: '0px 12px 32px rgba(3, 27, 11, 0.16)' },
    // A face's ring (`.av`: 2 of --surface) and its shadow (--shadow-raised).
    faceRing: '#FFFFFF',
    faceShadow: '0px 2px 8px rgba(3, 27, 11, 0.08)',
    // An unread conversation's time (`.tm.new`: --accent).
    fresh: '#0B783D',
    // The bell's dot (--buzz) in a ring of the ground (--canvas).
    dot: '#FF4F8B',
    dotRing: '#EFF7F1',
  },
  // koyu.css: the surface for the face's ring, no shadow, its accent and black ground.
  dark: {
    tabsGlass: ACTIVITIES.dark.tabsGlass,
    tabOnShadow: ACTIVITIES.dark.tabOnShadow,
    searchIcon: '#A3AEA8',
    lifted: { fill: '#151A18', edge: 'rgba(255, 255, 255, 0.08)', shadow: '' },
    faceRing: '#151A18',
    faceShadow: '',
    fresh: '#3DDC84',
    dot: '#FF4F8B',
    dotRing: '#000000',
  },
} as const;
