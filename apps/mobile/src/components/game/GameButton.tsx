import { Pressable, View, type ViewStyle } from 'react-native';

import { withAlpha } from '@/theme/contrast';
import {
  chipFill,
  GAME_SHADOW,
  type GameGround,
  JUDGE_COLORS,
  mainButtonInk,
  ON_GAME,
  ON_GAME_ALPHA,
  ON_JUDGE,
} from '@/theme/gameColors';
import { useTheme } from '@/theme/ThemeProvider';
import { SPACING } from '@/theme/tokens';

import { Loader } from '../Loader';
import { usePressScale } from '../motion';
import { Text } from '../Text';

// The game screens' button (v43 report §5, the v45 file's .tbtn; docs/SPEC_V4.md §4.C): a 56 high
// capsule on the game's ground. `main` is white with its label in the game's colour (the one main
// action); `side` is the translucent chip of the ground with a white outline. Kapsül Anlat's three:
// `pass` and `correct` in two colours, equal (K-32), and the rival's `forbidden` ("Yasak!", K-5),
// red in a white ring, not filling the row.
export type GameButtonKind = 'main' | 'side' | 'pass' | 'correct' | 'forbidden';

type Props = {
  label: string;
  onPress: () => void;
  kind?: GameButtonKind;
  ground: GameGround;
  disabled?: boolean;
  // Busy: the label stays in place, invisible, and Buluş takes its place; a second press does
  // nothing (CLAUDE.md → Ekran davranışı).
  loading?: boolean;
  // The grab button ("Kaptım", "Söylüyorum"): 64 high, a larger label, the whole row (v43: .bx-buzz).
  large?: boolean;
  accessibilityLabel?: string;
  testID?: string;
};

export const GAME_BUTTON_HEIGHT = SPACING[14];
const LARGE_HEIGHT = SPACING[16];
const BUSY_MARK = 24;
// v43: .tbtn.tabu, at least 188 wide with 34 on each side.
const FORBIDDEN_MIN_WIDTH = 188;
const FORBIDDEN_PADDING = 34;
const OUTLINE = 2;
const RING = 3;

export function GameButton({
  label,
  onPress,
  kind = 'main',
  ground,
  disabled,
  loading = false,
  large,
  accessibilityLabel,
  testID,
}: Props) {
  const { shape } = useTheme();
  const pressScale = usePressScale();
  const inactive = disabled || loading;

  // Disabled: the ground's chip with a white label, readable (4.5:1, gameColors.test.ts) and plainly
  // not a coloured button (v43: .tbtn.pass[aria-disabled]).
  const face: { bg: string; fg: string; style?: ViewStyle } = disabled
    ? { bg: chipFill(ground), fg: ON_GAME }
    : kind === 'main'
      ? { bg: ON_GAME, fg: mainButtonInk(ground) }
      : kind === 'side'
        ? {
            bg: chipFill(ground),
            fg: ON_GAME,
            style: {
              borderWidth: OUTLINE,
              borderColor: withAlpha(ON_GAME, ON_GAME_ALPHA.outline),
            },
          }
        : kind === 'forbidden'
          ? {
              bg: JUDGE_COLORS.forbidden,
              fg: ON_GAME,
              style: {
                minWidth: FORBIDDEN_MIN_WIDTH,
                paddingHorizontal: FORBIDDEN_PADDING,
                borderWidth: RING,
                borderColor: withAlpha(ON_GAME, 0.92),
                boxShadow: GAME_SHADOW.forbidden,
              },
            }
          : {
              bg: kind === 'pass' ? JUDGE_COLORS.pass : JUDGE_COLORS.correct,
              fg: ON_JUDGE,
              style: { boxShadow: GAME_SHADOW.button },
            };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: !!inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      testID={testID}
      style={kind === 'forbidden' ? { alignSelf: 'center' } : { flexGrow: 1, flexBasis: 0 }}
    >
      {({ pressed }) => (
        <View
          style={[
            {
              minHeight: large ? LARGE_HEIGHT : GAME_BUTTON_HEIGHT,
              paddingHorizontal: SPACING[3],
              borderRadius: shape.radius.pill,
              backgroundColor: face.bg,
              alignItems: 'center',
              justifyContent: 'center',
            },
            face.style,
            pressScale(pressed && !inactive),
          ]}
        >
          <View style={{ opacity: loading ? 0 : 1 }}>
            <Text
              variant={large ? 'gameButtonLarge' : 'gameButton'}
              color={face.fg}
              align="center"
              // One line, always (CLAUDE.md → Ekran davranışı): a label that does not fit shrinks.
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.5}
            >
              {label}
            </Text>
          </View>
          {loading ? (
            <View pointerEvents="none" className="absolute inset-0 items-center justify-center">
              <Loader
                kind="meet"
                size={BUSY_MARK}
                delay={0}
                label={null}
                mono={{ color: face.fg, ground: face.bg === ON_GAME ? ON_GAME : ground.top }}
              />
            </View>
          ) : null}
        </View>
      )}
    </Pressable>
  );
}
