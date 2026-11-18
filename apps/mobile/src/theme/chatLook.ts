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
  // 116 from the board's top: 12 under the bar's 52 capsule (the bar's own 6 under it, and 6).
  timeChip: { height: 32, padLeft: 8, padRight: 12, gap: 6, icon: 18, top: 6 },
  // A face beside another's run (SemtDolu, MekanSohbet `.ga`, `/*AVBUYUK*/`): 40.
  face: 40,
  // The day's pill in the venue and the district chat (`.flow .day`): 28 inside its 1 line, 12 in.
  day: { height: 28 },
  // The first message's suggestions (`.sug`): 12 over the message bar, a row from 12 at the left
  // to the screen's right edge, 8 apart; each 36 high, 14 in. The table's card 24 over them.
  suggest: { height: 36, padX: 14, gap: 8, cardGap: 24 },
  // Under the top bar (SemtSohbet, MekanSohbet `.band`): the chat's ground to the bar's top (the
  // board's 40 % of 132), then fading out; 132 under a 47 status bar.
  band: {
    below: 85,
    semt: { light: '#F5E9D8', dark: '#000000' },
    mekan: { light: '#DDEFE2', dark: '#000000' },
  },
  // The first message's card (`.emp`): 24 round, 20 / 22 / 22 inside, the riso 122 wide standing 62
  // above it; its title 16/22 (700) and its sentence 13/18 (500) 8 and 4 under; the table's riso
  // 150 wide and 70 above, the card 24 over the suggestions; 40 from the screen's sides (the
  // stream's 12 and 28), the district's centred.
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
    masa: { art: 150, artUp: 70 },
  },
  light: {
    emptyCard: {
      fill: '#FFFFFF',
      shadow: '0px 18px 44px rgba(4, 73, 35, 0.10), 0px 2px 6px rgba(4, 73, 35, 0.05)',
      edge: '',
    },
    // `.sug span`: the surface on `--glass-shadow`.
    suggest: {
      fill: '#FFFFFF',
      shadow: '0px 18px 44px rgba(4, 73, 35, 0.10), 0px 2px 6px rgba(4, 73, 35, 0.05)',
      edge: '',
    },
  },
  dark: {
    emptyCard: { fill: '#121614', shadow: '', edge: 'rgba(255, 255, 255, 0.08)' },
    suggest: { fill: '#121614', shadow: '', edge: 'rgba(255, 255, 255, 0.10)' },
  },
} as const;
