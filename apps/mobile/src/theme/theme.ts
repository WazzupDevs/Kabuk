import { baseTypography, type ThemeDefinition } from './tokens';

// The app's one theme, skall: two capsules that overlap by 35 %. Everything interactive is a
// capsule, where two things meet takes the overlap colour. Light: a pale violet ground, ink text, a
// violet accent and soft shadows. Dark: a deep ink ground, a lighter violet accent, and the surface
// tones carry the separation instead of shadows. Plus Jakarta Sans throughout (500 to 800). No
// outlined, hard-shadowed "3D" controls: a pressed control shrinks to 97 %. Visual source: v45
// (docs/design/v45/; CLAUDE.md → "Kod kuralları"; docs/SPEC_V4.md §4.C, step 4.2). Every
// text/ground pair is AA (contrast.test.ts).
//
// v44's values (step 4.2a): canvas, quiet fill, divider and muted text in both schemes; the dark
// card `surface` #1C1838 and muted #B8B3D2 are one tone lighter than the old system's (v44 report
// §1; the owner approves them with the PR's screenshots, K-25). `border` stays: v44's soft input
// outlines (#DAD3F2, #3A3563) fall under the 3:1 a control's outline needs (contrast.test.ts).
export const THEME: ThemeDefinition = {
  defaultScheme: 'system',
  palettes: {
    light: {
      canvas: '#F5F3FC',
      surface: '#FFFFFF',
      surface2: '#EEEBF8',
      raised: '#FFFFFF',
      text: '#14112B',
      muted: '#5E5878',
      accent: '#5A3AE6',
      onAccent: '#FFFFFF',
      violet: '#C51F62',
      onViolet: '#FFFFFF',
      read: '#2C63D6',
      border: '#817B9A',
      divider: '#E3DEF2',
      danger: '#BF3A14',
      onDanger: '#FFFFFF',
      success: '#1C7843',
      onSuccess: '#FFFFFF',
      dangerSoft: '#FBE1DB',
      successSoft: '#CDEFD9',
      signal: '#FFB547',
      onSignal: '#14112B',
      calm: '#E8E3FF',
      onCalm: '#3B25A6',
      lively: '#FFE6C7',
      onLively: '#7A4300',
      buzz: '#FF4F8B',
      onBuzz: '#14112B',
      event: '#FFB547',
      onEvent: '#14112B',
      scrim: '#14112B',
      feature: '#14112B',
      onFeature: '#FFFFFF',
      featureMuted: '#B9B3D9',
      overlap: '#FFB547',
      focus: '#5A3AE6',
    },
    dark: {
      canvas: '#0D0B1E',
      surface: '#1C1838',
      surface2: '#262148',
      raised: '#2C2752',
      text: '#F3F0FF',
      muted: '#B8B3D2',
      accent: '#A28FFF',
      onAccent: '#14112B',
      violet: '#FF7DAD',
      onViolet: '#14112B',
      read: '#7DB2FF',
      border: '#7A73A3',
      divider: '#34305A',
      danger: '#FF8F6E',
      onDanger: '#1F0A04',
      success: '#5FD98C',
      onSuccess: '#052313',
      dangerSoft: '#272638',
      successSoft: '#173022',
      signal: '#FFB547',
      onSignal: '#14112B',
      calm: '#2B2560',
      onCalm: '#DCD5FF',
      lively: '#46290B',
      onLively: '#FFD8A3',
      buzz: '#FF4F8B',
      onBuzz: '#14112B',
      event: '#FFB547',
      onEvent: '#14112B',
      scrim: '#000000',
      feature: '#2A2552',
      onFeature: '#F3F0FF',
      featureMuted: '#C4BEE2',
      overlap: '#FFFFFF',
      focus: '#A28FFF',
    },
  },
  fonts: {
    display: 'PlusJakartaSans_800ExtraBold',
    displayBold: 'PlusJakartaSans_700Bold',
    regular: 'PlusJakartaSans_500Medium',
    semibold: 'PlusJakartaSans_600SemiBold',
    bold: 'PlusJakartaSans_700Bold',
  },
  shape: {
    // deck: Kapsül Anlat's cards; roleCard: Sahtekar's role card; letterTile: Harf Kapmaca's tile.
    radius: {
      xs: 6,
      sm: 12,
      md: 16,
      lg: 22,
      xl: 28,
      pill: 999,
      deck: 24,
      roleCard: 26,
      letterTile: 38,
    },
    stroke: { card: 0, feature: 2, control: 2, tag: 0, hairline: 1, venueRing: 2 },
    selectedTeam: 'fill',
    screenPadding: 20,
  },
  shadows: {
    light: {
      card: '0px 10px 28px -14px rgba(20, 17, 43, 0.24)',
      raised: '0px 2px 8px -2px rgba(20, 17, 43, 0.16)',
      sheet: '0px -16px 48px -16px rgba(20, 17, 43, 0.32)',
      tabBar: '0px 14px 36px -10px rgba(20, 17, 43, 0.28)',
      focus: '0px 0px 0px 2px #F5F3FC, 0px 0px 0px 4px #5A3AE6',
    },
    dark: {
      card: '0px 0px 0px 1px rgba(255, 255, 255, 0.05)',
      raised: '0px 2px 8px -2px rgba(0, 0, 0, 0.5)',
      sheet: '0px -16px 48px -16px rgba(0, 0, 0, 0.7)',
      tabBar: '0px 14px 36px -10px rgba(0, 0, 0, 0.6)',
      focus: '0px 0px 0px 2px #0D0B1E, 0px 0px 0px 4px #A28FFF',
    },
  },
  typography: baseTypography(),
};
