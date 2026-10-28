import { View } from 'react-native';

import { BRAND } from '@/theme/brand';
import { withAlpha } from '@/theme/contrast';
import { KIT } from '@/theme/auraKit';
import { useTheme } from '@/theme/ThemeProvider';
import { ICON, SPACING } from '@/theme/tokens';

import type { IconName } from './Button';
import { Text } from './Text';
import { AppIcon } from './AppIcon';

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
  | 'light'
  | 'glass';

type Props = { label: string; variant?: TagVariant; icon?: IconName; live?: boolean };

// skall.css → `.tag.glass`: ink at 62 % over a drawing.
const GLASS_ALPHA = 0.62;

// A chip (the skall design system → Chip): a filled capsule label, never outlined or tilted.
// Keşfet's liveliness is calm / lively / buzz, an event `event`; a table's intent is `calm`.
export function Tag({ label, variant = 'neutral', icon, live }: Props) {
  const { colors, shape, scheme } = useTheme();

  // docs/design/aura (`.tag`): purple, pink, amber and green on their soft grounds, the plain one
  // raised white.
  const t = scheme === 'dark' ? KIT.tagsDark : KIT.tags;
  const glassy = { bg: KIT[scheme].raisedRound, fg: colors.text };
  const fill: Record<TagVariant, { bg: string; fg: string }> = {
    calm: t.purple,
    lively: t.amber,
    buzz: t.pink,
    event: t.amber,
    neutral: glassy,
    profiled: t.pink,
    won: t.green,
    lost: t.amber,
    done: { bg: KIT[scheme].raisedRound, fg: colors.muted },
    game: t.purple,
    chat: t.pink,
    leader: { bg: colors.text, fg: colors.canvas },
    positive: t.green,
    warn: t.amber,
    danger: { bg: colors.dangerSoft, fg: colors.onDangerSoft },
    brand: t.purple,
    light: { bg: BRAND.white, fg: BRAND.ink },
    glass: { bg: withAlpha(BRAND.ink, GLASS_ALPHA), fg: BRAND.white },
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
      {icon ? <AppIcon name={icon} size={ICON.xs} color={fg} /> : null}
      <Text variant="tag" color={fg}>
        {label}
      </Text>
    </View>
  );
}
