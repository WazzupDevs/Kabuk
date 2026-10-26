import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

import { BRAND } from '@/theme/brand';
import { useTheme } from '@/theme/ThemeProvider';
import { ICON, SPACING } from '@/theme/tokens';

import type { IconName } from './Button';
import { Text } from './Text';

export type TagVariant =
  | 'calm'
  | 'lively'
  | 'buzz'
  | 'event'
  | 'neutral' // headcount, participation, badges
  | 'profiled'
  | 'won' // Geçmiş: a game's result (v44: .rchip)
  | 'lost'
  | 'done'
  | 'game' // table intent "Oyun"
  | 'chat' // table intent "Sohbet"
  | 'leader' // a side's leader in "Masadakiler"
  // skall tuvali (skall.css → `.tag`): the soft fills and the tags on a drawing.
  | 'positive'
  | 'warn'
  | 'danger'
  | 'brand'
  | 'light';

type Props = { label: string; variant?: TagVariant; icon?: IconName; live?: boolean };

// A chip (the skall design system → Chip): a filled capsule label, never outlined or tilted.
// Keşfet's liveliness is calm / lively / buzz, an event `event`; a table's intent is `calm`.
export function Tag({ label, variant = 'neutral', icon, live }: Props) {
  const { colors, shape } = useTheme();

  const fill: Record<TagVariant, { bg: string; fg: string }> = {
    calm: { bg: colors.calm, fg: colors.onCalm },
    lively: { bg: colors.lively, fg: colors.onLively },
    buzz: { bg: colors.buzz, fg: colors.onBuzz },
    event: { bg: colors.event, fg: colors.onEvent },
    neutral: { bg: colors.surface2, fg: colors.text },
    profiled: { bg: colors.violet, fg: colors.onViolet },
    won: { bg: colors.successSoft, fg: colors.onSuccessSoft },
    lost: { bg: colors.lively, fg: colors.onLively },
    done: { bg: colors.surface2, fg: colors.muted },
    game: { bg: colors.calm, fg: colors.onCalm },
    chat: { bg: colors.calm, fg: colors.onCalm },
    leader: { bg: colors.text, fg: colors.canvas },
    positive: { bg: colors.successSoft, fg: colors.onSuccessSoft },
    warn: { bg: colors.warnSoft, fg: colors.onWarnSoft },
    danger: { bg: colors.dangerSoft, fg: colors.onDangerSoft },
    brand: { bg: colors.surface2, fg: colors.accent },
    light: { bg: BRAND.white, fg: BRAND.ink },
  };
  const { bg, fg } = fill[variant];

  return (
    <View
      className="flex-row items-center self-start"
      style={{
        gap: SPACING[1],
        backgroundColor: bg,
        borderRadius: shape.radius.pill,
        // skall tuvali (skall.css → `.tag`): 24 high, 9 px sides, 11 px 800.
        minHeight: SPACING[6],
        paddingHorizontal: SPACING[2] + 1,
        paddingVertical: SPACING[0.5],
      }}
    >
      {live ? (
        <View
          style={{
            width: SPACING[2],
            height: SPACING[2],
            borderRadius: shape.radius.pill,
            backgroundColor: colors.success,
          }}
        />
      ) : null}
      {icon ? <Ionicons name={icon} size={ICON.xs} color={fg} /> : null}
      <Text variant="tag" color={fg}>
        {label}
      </Text>
    </View>
  );
}
