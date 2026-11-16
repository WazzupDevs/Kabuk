import { Btn, Round } from '@/aura/kit';
import type { ButtonVariant } from '@/theme/buttonFill';
import { KIT } from '@/theme/auraKit';
import { useTheme } from '@/theme/ThemeProvider';
import { ICON, SPACING, TOUCH } from '@/theme/tokens';

import { AppIcon, type IconName } from './AppIcon';

// The older button, now a thin wrapper of the kit's Btn (src/aura/kit.tsx; docs/design/iskelet.md →
// 2.1): one look and one height for every button. The roles map to the kit's: `primary` the
// primary, `secondary` and `neutral` the glassy, `danger` the danger, `ghost` and `dangerText` the
// ghost (the latter in the danger's red), `positive` the soft green fill. Busy: the label stays,
// Buluş beside it, a second press is ignored; the label is one line and shrinks to fit. New code
// takes Btn: buttonGuard.test.ts keeps the files that still import this one, and the list only
// shrinks.
export type { IconName };

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: ButtonVariant;
  // sm the kit's small (36, touched at 44); md and lg the main height.
  size?: 'sm' | 'md' | 'lg';
  icon?: IconName;
  // A short addition after the label ("+1", "2 hak"), part of its one line so they shrink together.
  detail?: string;
  accessibilityLabel?: string;
  testID?: string;
  // A text-only button that lines up with the content's left edge ("Tekrar gönder").
  flush?: boolean;
  // Half a row: tighter at the sides.
  tight?: boolean;
  // Only `icon`, in the kit's round button; the label is what screen readers say.
  iconOnly?: boolean;
};

const KIND = {
  primary: 'primary',
  secondary: 'glassy',
  neutral: 'glassy',
  positive: 'glassy',
  danger: 'danger',
  ghost: 'ghost',
  dangerText: 'ghost',
} as const satisfies Record<ButtonVariant, 'primary' | 'glassy' | 'danger' | 'ghost'>;

const GLASS = {
  primary: 'prominent',
  glassy: 'clear',
  danger: 'danger',
  ghost: 'ghost',
} as const;

const SMALL_SLOP = (TOUCH.min - KIT.size.btnSm) / 2;

export function Button({
  label,
  onPress,
  disabled,
  loading = false,
  variant = 'primary',
  size = 'md',
  icon,
  detail,
  accessibilityLabel,
  testID,
  flush,
  tight,
  iconOnly,
}: Props) {
  const { colors, scheme } = useTheme();
  const kind = KIND[variant];
  const positive = variant === 'positive';
  const tint = positive
    ? colors.onSuccessSoft
    : variant === 'dangerText'
      ? colors.danger
      : undefined;
  const ink = tint ?? KIT.button[scheme][GLASS[kind]].ink;
  if (iconOnly && icon) {
    return (
      <Round
        label={accessibilityLabel ?? label}
        onPress={onPress}
        disabled={disabled}
        loading={loading}
        testID={testID}
      >
        <AppIcon name={icon} size={ICON.md} color={ink} />
      </Round>
    );
  }
  const small = size === 'sm';
  const pad = flush ? 0 : tight ? SPACING[3] : undefined;
  return (
    <Btn
      label={detail ? `${label} ${detail}` : label}
      onPress={onPress}
      variant={kind}
      sm={small}
      hitSlop={small ? SMALL_SLOP : undefined}
      lead={
        icon && !disabled && !loading ? (
          <AppIcon name={icon} size={ICON.md} color={ink} />
        ) : undefined
      }
      loading={loading}
      disabled={disabled}
      tint={tint}
      fill={positive && !disabled ? colors.successSoft : undefined}
      look={pad === undefined ? undefined : { padLeft: pad, padRight: pad }}
      testID={testID}
      accessibilityLabel={accessibilityLabel ?? (detail ? `${label} ${detail}` : label)}
    />
  );
}
