import {
  Children,
  createContext,
  isValidElement,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import {
  Animated,
  Modal,
  Pressable,
  StatusBar,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CapIcon, type CapIconName } from '@/aura/CapIcon';
import { T, useKit } from '@/aura/kit';
import { LEAVE_RN, springConfig } from '@/aura/motion';
import { AppIcon } from '@/components/AppIcon';
import type { IconName } from '@/components/Button';
import { BackdropBlur, HAS_BACKDROP } from '@/components/LiquidGlass';
import { Loader } from '@/components/Loader';
import { boxShadowParts, shadowParts } from '@/components/NativeShadow';
import { Text } from '@/components/Text';
import { tr } from '@/i18n/tr';
import { useLabOff } from '@/lib/drawLab';
import { useLeaveKeyboard } from '@/lib/modalKeyboard';
import { runSheetSlide } from '@/lib/sheetSlide';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { useSinglePress } from '@/lib/useSinglePress';
import { MOTION } from '@/theme/aura';
import { KIT } from '@/theme/auraKit';
import { MENU_GLASS } from '@/theme/glass';
import { gradientStyle } from '@/theme/gradient';
import { useTheme } from '@/theme/ThemeProvider';
import { ICON, OPACITY, SPACING } from '@/theme/tokens';

import { MENU_FADE_UNTIL, MENU_SCALE, type MenuAnchor, menuPlace } from './menuPlace';
import { useSheetFrost } from './useSheetMotion';

// skall tuvali (skall.css → "Menü"): a sheet's actions as rows of one soft card, a hairline
// between them; a negative row is written red.
// float: over a scrim, beside a held message (skall.css → `.pop .menu`): the surface on the float
// shadow, 210 wide; as Telegram Android's message menu, its rows lower and without hairlines (the
// owner's call, 30 Ekim).
// anchor: grown out of the button at `anchor` (iskelet.md → 3.5; MenuPop).
const Floating = createContext(false);
// Whether a row follows another: it draws the hairline over itself, from the words (U29).
const Follows = createContext(false);
// In a menu grown from a button: a row's press closes the menu first.
const PopClose = createContext<(() => void) | null>(null);

export function Menu({
  children,
  float,
  anchor,
  visible = true,
  onClose,
}: {
  children: ReactNode;
  float?: boolean;
  // The button the menu grows out of (measureMenuAnchor). Unset: the rows stand where they are.
  anchor?: MenuAnchor;
  // With `anchor`: whether the menu is open, and what a tap outside, back or a row does to it.
  visible?: boolean;
  onClose?: () => void;
}) {
  const { colors, shape, scheme } = useTheme();
  const rows = Children.toArray(children).filter(Boolean);
  const shadowOff = useLabOff('golge');
  const shadow = boxShadowParts(shadowOff, float ? shape.shadow.sheet : null, shape.radius.lg);
  if (anchor) {
    return (
      <MenuPop anchor={anchor} visible={visible} onClose={onClose ?? noop}>
        {rows}
      </MenuPop>
    );
  }
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

const noop = () => undefined;

// Where a button's menu measures it from: its box in the window, as the menu's Modal reads it.
export function measureMenuAnchor(view: View | null, done: (anchor: MenuAnchor) => void): void {
  view?.measureInWindow((x, y, width, height) => done({ x, y, width, height }));
}

function isNegative(row: ReactNode): boolean {
  return isValidElement<{ negative?: boolean }>(row) && row.props.negative === true;
}

// A closing that never reports its end: gone this long after it should have ended.
const LEAVE_FALLBACK_MS = 250;
// The still copy of the screen frosts in over the opening's last part, as the menu reaches its size
// (its blurred patch stands at the menu's full box from the start).
const BLUR_FROM = 0.6;

// iskelet.md → 3.5: a glass menu grown out of its button, 256 to 272 wide, 26 round, frosted at 28,
// scaled from 0.18 to 1 from the button's centre on springs.menu (menuPlace.ts); a tap outside or
// Android's back closes it, no "Vazgeç" row; a destructive row stands at the foot, apart by 6, red.
// The frost is the screen copied once as the menu opens (LiquidGlass → BackdropBlur) in the
// menu's box; with reduce transparency or below Android 12 the card's solid ground. Measured first
// (unseen), then placed and grown; with reduce motion it appears and goes at once.
function MenuPop({
  anchor,
  visible,
  onClose,
  children,
}: {
  anchor: MenuAnchor;
  visible: boolean;
  onClose: () => void;
  children: ReactNode[];
}) {
  const k = useKit();
  const reduce = useReduceMotion();
  const frost = useSheetFrost() && HAS_BACKDROP;
  const screen = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const shadowOff = useLabOff('golge');
  const [mounted, setMounted] = useState(visible);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const [p] = useState(() => new Animated.Value(0));
  useLeaveKeyboard(visible);
  if (visible && !mounted) setMounted(true);
  // Closed before it was measured: nothing to play out.
  if (!visible && mounted && size === null) setMounted(false);

  useEffect(() => {
    if (!mounted || size === null) return undefined;
    const leaveMs = reduce ? 0 : MOTION.dissolve.outMs;
    const anim = visible
      ? reduce
        ? Animated.timing(p, { toValue: 1, duration: 0, useNativeDriver: true })
        : Animated.spring(p, { ...springConfig(MOTION.springs.menu), toValue: 1 })
      : Animated.timing(p, {
          toValue: 0,
          duration: leaveMs,
          easing: LEAVE_RN,
          useNativeDriver: true,
        });
    return runSheetSlide(
      anim,
      !visible,
      () => {
        setMounted(false);
        setSize(null);
      },
      leaveMs + LEAVE_FALLBACK_MS,
    );
  }, [visible, mounted, size, reduce, p]);

  // Inside a status-bar-translucent Modal the safe area can come back 0 (MessagePop).
  const topInset = Math.max(insets.top, StatusBar.currentHeight ?? 0);
  const place = size
    ? menuPlace(anchor, size, screen, { top: topInset, bottom: insets.bottom }, KIT.size.menuGap)
    : null;
  const radius = KIT.size.menuRadius;
  const shadow = shadowParts(shadowOff, k.c.glassShadow, undefined, radius);
  const plain = children.filter((row) => !isNegative(row));
  const negative = children.filter(isNegative);
  return (
    <Modal
      transparent
      visible={mounted}
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={tr.common.close}
        onPress={onClose}
        style={StyleSheet.absoluteFill}
      />
      {frost && place && size ? (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: place.left,
            top: place.top,
            width: size.width,
            height: size.height,
            borderRadius: radius,
            overflow: 'hidden',
            opacity: p.interpolate({
              inputRange: [0, BLUR_FROM, 1],
              outputRange: [0, 0, 1],
              extrapolate: 'clamp',
            }),
          }}
        >
          <BackdropBlur blur={MENU_GLASS.blur} style={StyleSheet.absoluteFill} />
        </Animated.View>
      ) : null}
      <Animated.View
        accessibilityRole="menu"
        onLayout={
          size
            ? undefined
            : (e) =>
                setSize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })
        }
        style={{
          position: 'absolute',
          left: place?.left ?? 0,
          top: place?.top ?? 0,
          minWidth: KIT.size.menuMinW,
          maxWidth: KIT.size.menuMaxW,
          opacity: place
            ? p.interpolate({
                inputRange: [0, MENU_FADE_UNTIL, 1],
                outputRange: [0, 1, 1],
                extrapolate: 'clamp',
              })
            : 0,
          transformOrigin: place ? [place.originX, place.originY, 0] : undefined,
          transform: [
            { scale: p.interpolate({ inputRange: [0, 1], outputRange: [...MENU_SCALE] }) },
          ],
        }}
      >
        <View style={{ borderRadius: radius, boxShadow: shadow.boxShadow }}>
          {shadow.node}
          <View
            style={{
              ...(frost
                ? gradientStyle(k.c.sheetFrost)
                : { ...gradientStyle(k.c.sheet), backgroundColor: k.c.sheetBase }),
              borderRadius: radius,
              borderWidth: KIT.size.edge,
              borderColor: k.c.glassEdge,
              overflow: 'hidden',
            }}
          >
            <PopClose.Provider value={onClose}>
              <Floating.Provider value>
                {plain}
                {negative.length > 0 && plain.length > 0 ? (
                  <View style={{ height: KIT.size.menuDangerGap, backgroundColor: k.c.hair }} />
                ) : null}
                {negative}
              </Floating.Provider>
            </PopClose.Provider>
          </View>
        </View>
      </Animated.View>
    </Modal>
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
  const popClose = useContext(PopClose);
  const iconSize = floating ? ICON.md : ICON.lg;
  const press = useSinglePress(
    popClose
      ? () => {
          popClose();
          onPress();
        }
      : onPress,
  );
  const ink = negative ? colors.onDangerSoft : colors.text;
  return (
    <Pressable
      testID={testID}
      accessibilityRole={popClose ? 'menuitem' : 'button'}
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
