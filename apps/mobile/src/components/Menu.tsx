import { Ionicons } from '@expo/vector-icons';
import { Children, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { ICON, OPACITY, SPACING } from '@/theme/tokens';

import type { IconName } from './Button';
import { Loader } from './Loader';
import { Text } from './Text';

// skall tuvali (skall.css → "Menü"): a sheet's actions as rows of one soft card, a hairline
// between them; a negative row is written red.
// float: over a scrim, beside a held message (skall.css → `.pop .menu`): the surface on the float
// shadow, 210 wide.
export function Menu({ children, float }: { children: ReactNode; float?: boolean }) {
  const { colors, shape } = useTheme();
  const rows = Children.toArray(children).filter(Boolean);
  const card = (
    <View
      style={{
        borderRadius: shape.radius.lg,
        backgroundColor: float ? colors.surface : colors.surface2,
        overflow: 'hidden',
      }}
    >
      {rows.map((row, i) => (
        <View
          key={i}
          style={
            i > 0
              ? { borderTopWidth: shape.stroke.hairline, borderTopColor: colors.divider }
              : undefined
          }
        >
          {row}
        </View>
      ))}
    </View>
  );
  if (!float) return card;
  return (
    <View
      style={{ width: FLOAT_WIDTH, borderRadius: shape.radius.lg, boxShadow: shape.shadow.sheet }}
    >
      {card}
    </View>
  );
}

const FLOAT_WIDTH = SPACING[16] * 3 + SPACING[4] + SPACING[0.5];

export function MenuItem({
  label,
  icon,
  onPress,
  negative,
  loading,
  note,
  testID,
}: {
  label: string;
  icon?: IconName;
  onPress: () => void;
  negative?: boolean;
  loading?: boolean;
  // A line under the label (skall tuvali, MasaKisiSecenekler: what "Engelle" does).
  note?: string;
  testID?: string;
}) {
  const { colors } = useTheme();
  const ink = negative ? colors.onDangerSoft : colors.text;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!loading, busy: !!loading }}
      disabled={loading}
      onPress={onPress}
    >
      {({ pressed }) => (
        <View
          className="flex-row items-center"
          style={{
            gap: SPACING[3],
            minHeight: SPACING[12] + SPACING[1],
            paddingHorizontal: SPACING[4] + SPACING[0.5],
            opacity: pressed ? OPACITY.pressed : 1,
          }}
        >
          {icon ? (
            <Ionicons name={icon} size={ICON.md} color={negative ? ink : colors.muted} />
          ) : null}
          <View
            className="flex-1"
            style={{ gap: SPACING[0.5], paddingVertical: note ? SPACING[2.5] : 0 }}
          >
            <Text variant="button" color={ink}>
              {label}
            </Text>
            {note ? <Text variant="fine">{note}</Text> : null}
          </View>
          {loading ? <Loader kind="meet" size={ICON.md} delay={0} label={null} /> : null}
        </View>
      )}
    </Pressable>
  );
}
