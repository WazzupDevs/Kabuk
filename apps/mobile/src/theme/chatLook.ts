import { DM } from './dm';

// The group chats' look (yeni arayüz tuvali, 16 Kasım: MekanSohbet, MekanSohbetSecenek, MasaSohbet,
// SemtSohbet, SemtSecenek, SemtDolu): the DM's stream, top bar and message bar (theme/dm.ts) are
// the base; these are the values the boards give the venue, table and district chats on top of it,
// value for value. Light from `:root`, dark from `.dark`.
export const CHAT_LOOK = {
  // The top bar's menu: a soft 44 round outside the capsule (`.round.soft`), 8 from it; the
  // capsule's words 14 in at the left and 4 at the right when the identity toggle sits in it
  // (`.who` override), 18 on both sides without it (the table's).
  bar: { toggleIn: 4, titleIn: 14, plainIn: 18, gap: 6 },
  // The identity toggle (`.tog`): 3 inside its rim, its 36 slots 2 apart.
  toggle: { slot: 36, pad: 3 },
  // The sender's name over a bubble (`.nk`): 12/700 in a pill, 1 / 8 inside, 12 from the left.
  name: {
    padY: 1,
    padX: 8,
    left: 12,
    light: 'rgba(255, 255, 255, 0.86)',
    dark: 'rgba(0, 0, 0, 0.72)',
  },
  // The message bar's field (`.fld` over `.glass`): a plain surface, its edge and shadow the DM's.
  composer: {
    light: { ...DM.light.composer, fill: '#FFFFFF' },
    dark: { ...DM.dark.composer, fill: '#121614' },
  },
  // Another's bubble's shadow in the chat's colour (`.msg.them.mekan`, `.msg.them.masa`); the dark
  // draws none.
  themShadow: {
    mekan: { light: '0px 4px 12px rgba(30, 154, 92, 0.22)', dark: '' },
    masa: { light: '0px 4px 12px rgba(194, 24, 91, 0.22)', dark: '' },
  },
  // The district chat's time chip (SemtSohbet `.tmr`): 32 high, 8 in at the clock (18) and 12 after
  // the words, 6 apart; its look the empty card's (the surface, no glass).
  timeChip: { height: 32, padLeft: 8, padRight: 12, gap: 6, icon: 18 },
  // The first message's card (`.emp`): 24 round, 20 / 22 / 22 inside, the riso 122 wide standing 62
  // above it; its title 16/22 (700) and its sentence 13/18 (500) 8 and 4 under; the table's riso
  // 150 wide and 70 above, the card's foot 170 over the screen's (the bar's 98 and 72 over it);
  // the district's 40 from the sides, centred.
  empty: {
    radius: 24,
    padTop: 20,
    padX: 22,
    padBottom: 22,
    art: 122,
    artUp: 62,
    titleTop: 8,
    bodyTop: 4,
    side: 40,
    masa: { art: 150, artUp: 70, aboveBar: 72 },
  },
  light: {
    emptyCard: {
      fill: '#FFFFFF',
      shadow: '0px 18px 44px rgba(4, 73, 35, 0.10), 0px 2px 6px rgba(4, 73, 35, 0.05)',
      edge: '',
    },
  },
  dark: {
    emptyCard: { fill: '#121614', shadow: '', edge: 'rgba(255, 255, 255, 0.08)' },
  },
} as const;
