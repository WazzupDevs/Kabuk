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
  // The tabs (`.sg`): Aktiviteler's capsule, 44 high, 4 inside, its two parts 36 and 22 round.
  tabs: ACTIVITIES.tabs,
  // The bell (`.round .nd`): its dot 9, 9 from its top and 10 from its right, in a 2 ring of the
  // ground.
  bell: { dot: 9, dotTop: 9, dotRight: 10, dotRing: 2 },
  // A conversation (`.rw`): 10 above and under, 20 in (the list runs to the screen's edges), 12
  // between the face (48 in a 2 ring) and its words, 72 at least; the name's line and the last
  // line's 2 apart, their parts 8; the ticks 18 (`.tick`).
  row: { padY: 10, padX: 20, gap: 12, minHeight: 72, ring: 2, lineGap: 2, metaGap: 8 },
  ticks: { width: 18 },
  // A search's count over its rows (`.rlbl`): 4 under the field.
  resultTop: 4,
  // The buddies over Bildirimler's sheet (Peek): 56 × 70, 40 in from the left and 44 from the
  // right, 62 over the sheet's top edge, rising from 40 below.
  peek: { width: 56, height: 70, left: 40, right: 44, up: 62, rise: 40 },
  light: {
    // The tabs as Aktiviteler's (`.sg`, the same capsule).
    tabsGlass: ACTIVITIES.light.tabsGlass,
    tabOnShadow: ACTIVITIES.light.tabOnShadow,
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
    faceRing: '#151A18',
    faceShadow: '',
    fresh: '#3DDC84',
    dot: '#FF4F8B',
    dotRing: '#000000',
  },
} as const;
