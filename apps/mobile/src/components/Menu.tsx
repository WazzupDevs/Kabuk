import { Children, createContext, type ReactNode, useContext } from 'react';
import { Pressable, View } from 'react-native';

import { useLabOff } from '@/lib/drawLab';
import { useSinglePress } from '@/lib/useSinglePress';
import { KIT } from '@/theme/auraKit';
import { gradientStyle } from '@/theme/gradient';
import { useTheme } from '@/theme/ThemeProvider';
import { ICON, OPACITY, SPACING } from '@/theme/tokens';

import { CapIcon, type CapIconName } from '@/aura/CapIcon';
import { T } from '@/aura/kit';

import type { IconName } from './Button';
import { Loader } from './Loader';
import { boxShadowParts } from './NativeShadow';
import { Text } from './Text';
import { AppIcon } from './AppIcon';

// skall tuvali (skall.css → "Menü"): a sheet's actions as rows of one soft card, a hairline
// between them; a negative row is written red.
// float: over a scrim, beside a held message (skall.css → `.pop .menu`): the surface on the float
// shadow, 210 wide; as Telegram Android's message menu, its rows lower and without hairlines (the
// owner's call, 30 Ekim).
const Floating = createContext(false);
// Whether a row follows another: it draws the hairline over itself, from the words (U29).
const Follows = createContext(false);
export function Menu({ children, float }: { children: ReactNode; float?: boolean }) {
  const { colors, shape, scheme } = useTheme();
  const rows = Children.toArray(children).filter(Boolean);
  const shadowOff = useLabOff('golge');
  const shadow = boxShadowParts(shadowOff, float ? shape.shadow.sheet : null, shape.radius.lg);
  const card = (
    <View
      // docs/design/aura (`.glass.list`): the rows in one glass card, a hairline between them.
      style={[
        // U2: in a sheet the card is the sheet's card colour (#1B211F in the dark).
        float ? { backgroundColor: colors.surface } : gradientStyle(KIT[scheme].glassInSheet),
        {
          borderRadius: KIT.size.glassRadiusSm,
          borderWidth: float ? 0 : KIT.size.edge,
          borderColor: KIT[scheme].glassInSheetEdge,
          overflow: 'hidden',
        },
      ]}
    >
      {rows.map((row, i) => (
        <Follows.Provider key={i} value={i > 0 && !float}>
          {row}
        </Follows.Provider>
      ))}
    </View>
  );
  if (!float) return card;
  return (
    <View
      style={{ width: FLOAT_WIDTH, borderRadius: shape.radius.lg, boxShadow: shadow.boxShadow }}
    >
      {shadow.node}
      <Floating.Provider value>{card}</Floating.Provider>
    </View>
  );
}

const ROW_HEIGHT = 56;
const ROW_GAP = 14;
const FLOAT_WIDTH = SPACING[16] * 3 + SPACING[4] + SPACING[0.5];

export function MenuItem({
  label,
  icon,
  cap,
  onPress,
  negative,
  loading,
  note,
  testID,
  chevron,
  count,
}: {
  label: string;
  icon?: IconName;
  // The aura kit's icon instead (aura v50: the profile's and the photo's menus).
  cap?: CapIconName;
  onPress: () => void;
  negative?: boolean;
  loading?: boolean;
  // A line under the label (skall tuvali, MasaKisiSecenekler: what "Engelle" does).
  note?: string;
  testID?: string;
  // A row that opens a page (skall tuvali, Ayarlar): a chevron, with a count before it.
  chevron?: boolean;
  count?: number;
}) {
  const { colors, scheme } = useTheme();
  const floating = useContext(Floating);
  const follows = useContext(Follows);
  const iconSize = floating ? ICON.md : ICON.lg;
  const press = useSinglePress(onPress);
  const ink = negative ? colors.onDangerSoft : colors.text;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!loading, busy: !!loading }}
      disabled={loading}
      onPress={press}
    >
      {({ pressed }) => (
        <View
          className="flex-row items-center"
          style={{
            // U21: a sheet's row 56, 16 in, 14 between the icon and the words (`.srow`).
            gap: floating ? SPACING[4] : ROW_GAP,
            minHeight: floating ? SPACING[11] : ROW_HEIGHT,
            paddingHorizontal: floating ? SPACING[4] + SPACING[0.5] : SPACING[4],
            opacity: pressed ? OPACITY.pressed : 1,
          }}
        >
          {follows ? (
            <View
              // U29 (`.srow + .srow:before`): the hairline starts where the words do, 16 in from
              // the right.
              style={{
                position: 'absolute',
                top: 0,
                left: SPACING[4] + (cap || icon ? iconSize + ROW_GAP : 0),
                right: SPACING[4],
                borderTopWidth: KIT.size.hair,
                borderTopColor: KIT[scheme].hair,
              }}
            />
          ) : null}
          {cap ? (
            <CapIcon name={cap} size={iconSize} color={negative ? ink : colors.muted} />
          ) : icon ? (
            <AppIcon name={icon} size={iconSize} color={negative ? ink : colors.muted} />
          ) : null}
          <View
            className="flex-1"
            style={{ gap: SPACING[0.5], paddingVertical: note ? SPACING[2.5] : 0 }}
          >
            {floating ? (
              <Text variant="button" color={ink}>
                {label}
              </Text>
            ) : (
              <T v="h3" color={ink}>
                {label}
              </T>
            )}
            {note ? <Text variant="fine">{note}</Text> : null}
          </View>
          {loading ? <Loader kind="meet" size={ICON.md} delay={0} label={null} /> : null}
          {!loading && count !== undefined ? (
            <Text variant="label" tone="muted" tabular>
              {String(count)}
            </Text>
          ) : null}
          {!loading && chevron ? (
            <AppIcon name="chevron-forward" size={ICON.md} color={colors.muted} />
          ) : null}
        </View>
      )}
    </Pressable>
  );
}
