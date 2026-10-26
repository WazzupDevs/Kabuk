import type { PaletteKey } from './tokens';

// Roles (the skall design system → Button): `primary` the one main action per screen, accent
// filled; `secondary` and `neutral` a raised capsule with an outline (every other action);
// `positive` green ("Doğru", "Arkadaşlar"); `danger` red ("Masayı bitir"). `ghost` (an accent link)
// and `dangerText` ("Hesabımı sil") are text only.
export type ButtonVariant =
  'primary' | 'secondary' | 'positive' | 'danger' | 'neutral' | 'ghost' | 'dangerText';

// A role's label on its fill, as palette keys; `bg: null` is a text-only role, drawn on whatever
// ground it sits on.
export type ButtonFill = { bg: PaletteKey | null; fg: PaletteKey };

// skall tuvali (skall.css → "Düğme"): primary filled, secondary a surface capsule with the control
// outline, neutral the quiet soft fill, positive and danger the soft green and red fills.
const FILLS: Record<ButtonVariant, ButtonFill> = {
  primary: { bg: 'primary', fg: 'onPrimary' },
  secondary: { bg: 'surface', fg: 'text' },
  positive: { bg: 'successSoft', fg: 'onSuccessSoft' },
  danger: { bg: 'dangerSoft', fg: 'onDangerSoft' },
  neutral: { bg: 'surface2', fg: 'text' },
  ghost: { bg: null, fg: 'accent' },
  dangerText: { bg: null, fg: 'danger' },
};

export const BUTTON_VARIANTS = Object.keys(FILLS) as readonly ButtonVariant[];

export function isTextOnly(variant: ButtonVariant): boolean {
  return FILLS[variant].bg === null;
}

// Disabled is a neutral fill, not a faded role: a disabled label also reports a state
// ("Gönderildi", "Doğrula" before the code), so it stays readable (muted on surface2: AA in both
// schemes, contrast.test.ts). A text-only role takes no fill, only the muted label.
export function buttonFill(variant: ButtonVariant, disabled: boolean): ButtonFill {
  if (!disabled) return FILLS[variant];
  return isTextOnly(variant) ? { bg: null, fg: 'muted' } : { bg: 'disabled', fg: 'onDisabled' };
}
