// The new canvas's centred confirmation (yeni arayüz tuvali, AyarlarCikis, MesajlarSohbetSil,
// EngelleOnay: `.dlg`, `.scrim`, `.ei`, `.dt`, `.dx`) and its flat scrim (Ortak kurallar C2: no
// blur under a dialog or a sheet). Its own file until the shared dialog tokens land in auraKit.ts.
import type { TextStyle } from 'react-native';

export const DIALOG = {
  // In from either side of the screen, its corner, its room inside (top, sides, foot).
  inset: 28,
  radius: 28,
  padTop: 24,
  padX: 20,
  padBottom: 20,
  // The icon disc over the title and its picture; the title 14 under the disc.
  disc: 56,
  discIcon: 28,
  titleGap: 14,
  // The sentence 6 under the title, the buttons 20 under it, 8 between them.
  noteGap: 6,
  actionsGap: 20,
  buttonGap: 8,
  // `.dt` 700 21/26 −0.3 px; `.dx` 500 15/22.
  title: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 21,
    lineHeight: 26,
    letterSpacing: -0.3,
  } satisfies TextStyle,
  note: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 15,
    lineHeight: 22,
  } satisfies TextStyle,
  light: {
    surface: '#FFFFFF',
    shadow: '0px 18px 48px 0px rgba(3, 27, 11, 0.22)',
    scrim: 'rgba(3, 27, 11, 0.42)',
    // `.ei` on a danger dialog: the soft red disc and its ink.
    dangerDisc: 'rgba(214, 64, 40, 0.10)',
    dangerIcon: '#C8381F',
  },
  dark: {
    surface: '#151A18',
    // In the dark no shadow: a 1 px white ring.
    shadow: '0px 0px 0px 1px rgba(255, 255, 255, 0.08)',
    scrim: 'rgba(0, 0, 0, 0.70)',
    dangerDisc: 'rgba(255, 151, 126, 0.12)',
    dangerIcon: '#FF977E',
  },
} as const;
