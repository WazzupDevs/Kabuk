// The named colours of v46 (the palette the components are rewritten with, v46 native step 3), each
// read from one place in the inventory: a CSS custom property v46 declares, or a property of a
// component as measured. The name says the role; the reference says where v46 shows it. Light and
// dark come from the same place.
export type ColorRef =
  { var: string } | { component: string; prop: 'bg' | 'color' | 'borderColor' };

export const PALETTE_REFS = {
  // Grounds
  canvas: { var: '--pin-bg' }, // the app's ground behind every screen
  surface: { component: 'kart-bos', prop: 'bg' }, // cards, sheets
  surfaceSoft: { component: 'yumusak-lavanta', prop: 'bg' }, // .close: the lavender quiet fill
  segmentTrack: { component: 'bolumlu-sekme', prop: 'bg' }, // .rtabs
  // Text
  ink: { var: '--ink' },
  muted: { var: '--muted' },
  link: { component: 'baglanti', prop: 'color' }, // .link
  // The primary action (.btn.btn-room; .btn-primary is not used, envanter F4)
  primary: { component: 'birincil-52', prop: 'bg' },
  onPrimary: { component: 'birincil-52', prop: 'color' },
  // The one disabled look (SPEC_V4 §4.C: Katıl gets it too; loading keeps the primary colour)
  disabled: { component: 'birincil-52-pasif', prop: 'bg' },
  onDisabled: { component: 'birincil-52-pasif', prop: 'color' },
  // Outlines
  controlBorder: { component: 'kenarli-36', prop: 'borderColor' }, // .hb, fields
  hairline: { component: 'yuvarlak-geri', prop: 'borderColor' }, // .round.back
  cardBorder: { component: 'kart-bos', prop: 'borderColor' },
  // Roles
  danger: { component: 'tehlike', prop: 'bg' },
  onDanger: { component: 'tehlike', prop: 'color' },
  dangerSoft: { component: 'tehlike-yumusak', prop: 'bg' }, // .endbtn
  onDangerSoft: { component: 'tehlike-yumusak', prop: 'color' },
  successSoft: { component: 'katil', prop: 'bg' }, // .join, .pa-friend
  onSuccessSoft: { component: 'katil', prop: 'color' },
  warnSoft: { component: 'uyari', prop: 'bg' }, // .sup-warn
  onWarnSoft: { component: 'uyari', prop: 'color' },
  switchOff: { component: 'anahtar-kapali', prop: 'bg' },
  switchOn: { component: 'anahtar-acik', prop: 'bg' },
  unread: { component: 'bildirim-noktasi', prop: 'bg' }, // .tdot
  toast: { component: 'toast', prop: 'bg' },
  onToast: { component: 'toast', prop: 'color' },
  // The brand (skall Logo Sistemi)
  brandPurple: { var: '--brand-purple' },
  brandPink: { var: '--brand-pink' },
  overlap: { var: '--overlap' },
} as const satisfies Record<string, ColorRef>;
