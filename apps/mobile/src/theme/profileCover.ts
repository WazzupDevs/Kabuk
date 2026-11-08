import type { ColorScheme } from './tokens';

// The profile's cover and the anonymous identity's ticket (docs/SPEC_V4.md §4.W, "C · kapak ve
// bilet"). The cover is the person's own picture or, without one, a riso scene: a sky, a sun printed
// a little off in pink, layered hills with small trees and halftone dots; at night a navy sky, a
// moon-coloured sun and dark hills.
export const PROFILE_COVER = {
  // The cover's height under the status bar (the own profile and another person's band).
  height: 190,
  // Another person's profile: the band 22 round within the page's sides.
  bandRadius: 22,
  // The face 112 overlapping the cover's foot by half; the name 12 under it.
  faceOverlap: 56,
  nameTop: 12,
  // The fixed bar once the cover is gone: the face 32, 10 beside the name.
  barFace: 32,
  barGap: 10,
  // Profili düzenle's preview: 1.9:1 at 120 across, 14 round.
  previewWidth: 120,
  previewRadius: 14,
  // The scene's own units (it is drawn on a 390 × 190 box and cut to the cover's width).
  scene: { width: 390, height: 190 },
  // The pink print's offset from the sun.
  sunOffset: { x: 6, y: 4 },
  colors: {
    light: {
      sky: '#CFE8EE',
      sun: '#FFC93C',
      print: 'rgba(255, 79, 139, 0.55)',
      dots: 'rgba(3, 27, 11, 0.12)',
      hillFar: '#9BD3AC',
      hillMid: '#3FAE6E',
      hillNear: '#0E8745',
      tree: '#055328',
      trunk: '#3A2A1A',
    },
    dark: {
      sky: '#141C3A',
      sun: '#F2E8C6',
      print: 'rgba(255, 79, 139, 0.35)',
      dots: 'rgba(255, 255, 255, 0.10)',
      hillFar: '#22392E',
      hillMid: '#183024',
      hillNear: '#0F2219',
      tree: '#0A1711',
      trunk: '#06100B',
    },
  } satisfies Record<ColorScheme, Record<string, string>>,
} as const;

// The ticket: paper with a dark-green edge and a pink print a little off under it, a notch at the
// top and the bottom of the dashed perforation; the stub 96 with the capsule on its ground.
export const TICKET = {
  paper: '#FBF7EE',
  edge: '#0F3B22',
  edgeWidth: 2,
  print: '#FF4F8B',
  printOffset: 3,
  ink: '#031B0B',
  muted: '#4A6550',
  link: '#0B783D',
  radius: 18,
  notch: 10,
  stub: 96,
  capsule: 64,
  dash: [4, 4] as const,
  padX: 14,
  padY: 14,
  gap: 4,
  buttonTop: 10,
} as const;
