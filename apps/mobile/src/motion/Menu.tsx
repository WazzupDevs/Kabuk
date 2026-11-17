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
import { T } from '@/aura/kit';
import { LEAVE_RN, springConfig } from '@/aura/motion';
import { AppIcon } from '@/components/AppIcon';
import type { IconName } from '@/components/Button';
import { Loader } from '@/components/Loader';
import { boxShadowParts } from '@/components/NativeShadow';
import { SheetScrim } from '@/components/SheetScrim';
import { Text } from '@/components/Text';
import { tr } from '@/i18n/tr';
import { useLabOff } from '@/lib/drawLab';
import { useLeaveKeyboard } from '@/lib/modalKeyboard';
import { useOverlaySlot } from '@/lib/useOverlaySlot';
import { runSheetSlide } from '@/lib/sheetSlide';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { useSinglePress } from '@/lib/useSinglePress';
import { MOTION } from '@/theme/aura';
import { KIT } from '@/theme/auraKit';
import { DM } from '@/theme/dm';
import { gradientStyle } from '@/theme/gradient';
import { useTheme } from '@/theme/ThemeProvider';
import { ICON, OPACITY, SPACING } from '@/theme/tokens';

import { MENU_FADE_UNTIL, MENU_SCALE, type MenuAnchor, menuPlace } from './menuPlace';

// skall tuvali (skall.css → "Menü"): a sheet's actions as rows of one soft card, a hairline
// between them; a negative row is written red.
// float: beside a held message (MessagePop), the long-press menu's look (MesajlarUzunBas).
// anchor: grown out of the button at `anchor` (iskelet.md → 3.5; MenuPop): the ⋮ menu's look
// (SikayetEt, MekanSecenek), or with `hold` the long-press menu's over its scrim (InboxRows).
type RowLook = 'sheet' | 'pop' | 'hold';
const Look = createContext<RowLook>('sheet');
// Whether a row follows another: it draws the hairline over itself, from the words (U29).
const Follows = createContext(false);
// In a menu grown from a button: a row's press closes the menu first.
const PopClose = createContext<(() => void) | null>(null);

export function Menu({
  children,
  float,
  anchor,
  hold,
  visible = true,
  onClose,
}: {
  children: ReactNode;
  float?: boolean;
  // The button the menu grows out of (measureMenuAnchor). Unset: the rows stand where they are.
  anchor?: MenuAnchor;
  // With `anchor`: a long press's menu (MesajlarUzunBas) rather than a ⋮ button's.
  hold?: boolean;
  // With `anchor`: whether the menu is open, and what a tap outside, back or a row does to it.
  visible?: boolean;
  onClose?: () => void;
}) {
  const { scheme } = useTheme();
  const rows = Children.toArray(children).filter(Boolean);
  const shadowOff = useLabOff('golge');
  const L = KIT.layer.size;
  const shadow = boxShadowParts(
    shadowOff,
    float ? KIT.layer[scheme].menuShadow : null,
    L.holdRadius,
  );
  if (anchor) {
    return (
      <MenuPop anchor={anchor} visible={visible} hold={!!hold} onClose={onClose ?? noop}>
        {rows}
      </MenuPop>
    );
  }
  if (float) {
    return (
      <View style={{ width: L.holdWidth, borderRadius: L.holdRadius, boxShadow: shadow.boxShadow }}>
        {shadow.node}
        <MenuCard look="hold">{rows}</MenuCard>
      </View>
    );
  }
  return (
    <View
      // docs/design/aura (`.glass.list`): the rows in one glass card, a hairline between them.
      style={[
        // U2: in a sheet the card is the sheet's card colour (#1B211F in the dark).
        gradientStyle(KIT[scheme].glassInSheet),
        {
          borderRadius: KIT.size.glassRadiusSm,
          borderWidth: KIT.size.edge,
          borderColor: KIT[scheme].glassInSheetEdge,
          overflow: 'hidden',
        },
      ]}
    >
      {rows.map((row, i) => (
        <Follows.Provider key={i} value={i > 0}>
          {row}
        </Follows.Provider>
      ))}
    </View>
  );
}

// The ⋮ menu's and the long-press menu's card (KIT.layer): the flat surface, no glass. The ⋮ menu
// 16 / 8 / 8 inside, its red row last after a hairline (MekanSecenek); the long-press menu 6
// inside, its red rows apart under a 6 band across it (MesajlarUzunBas `.psep`).
function MenuCard({ look, children }: { look: 'pop' | 'hold'; children: ReactNode[] }) {
  const { scheme } = useTheme();
  const layer = KIT.layer[scheme];
  const L = KIT.layer.size;
  const hold = look === 'hold';
  const plain = children.filter((row) => !isNegative(row));
  const negative = children.filter(isNegative);
  const banded = hold && negative.length > 0 && plain.length > 0;
  const group = (rows: ReactNode[], from: number) =>
    rows.map((row, i) => (
      <Follows.Provider key={from + i} value={i > 0 || (!banded && from > 0)}>
        {row}
      </Follows.Provider>
    ));
  return (
    <View
      style={{
        backgroundColor: layer.menu,
        borderRadius: hold ? L.holdRadius : L.menuRadius,
        overflow: 'hidden',
        paddingTop: hold ? L.holdPad : L.menuPadTop,
        paddingHorizontal: hold ? L.holdPad : L.menuPadX,
        paddingBottom: hold ? L.holdPad : L.menuPadBottom,
      }}
    >
      <Look.Provider value={look}>
        {group(plain, 0)}
        {banded ? (
          <View
            style={{
              height: L.holdBand,
              marginHorizontal: -L.holdPad,
              backgroundColor: layer.holdBand,
            }}
          />
        ) : null}
        {group(negative, plain.length)}
      </Look.Provider>
    </View>
  );
}

const noop = () => undefined;

// The menu's note under its rows (tuval DmMenuSureDoldu, `.pnote`): 4 under them over a hairline,
// 8 / 12 / 6 inside, 12/16 500 in the muted ink. Read with the menu, not a row of its own.
export function MenuNote({ children }: { children: string }) {
  const { colors, scheme } = useTheme();
  return (
    <View
      style={{
        marginTop: DM.menuNote.top,
        paddingTop: DM.menuNote.padTop,
        paddingHorizontal: DM.menuNote.padX,
        paddingBottom: DM.menuNote.padBottom,
        borderTopWidth: KIT.size.hair,
        borderTopColor: KIT[scheme].hair,
      }}
    >
      <T v="menuNote" color={colors.muted}>
        {children}
      </T>
    </View>
  );
}

// Where a button's menu measures it from: its box in the window, as the menu's Modal reads it.
export function measureMenuAnchor(view: View | null, done: (anchor: MenuAnchor) => void): void {
  view?.measureInWindow((x, y, width, height) => done({ x, y, width, height }));
}

function isNegative(row: ReactNode): boolean {
  return isValidElement<{ negative?: boolean }>(row) && row.props.negative === true;
}

// A closing that never reports its end: gone this long after it should have ended.
const LEAVE_FALLBACK_MS = 250;

// iskelet.md → 3.5: a menu grown out of its button, scaled from 0.18 to 1 from the button's centre
// on springs.menu (menuPlace.ts); a tap outside or Android's back closes it, no "Vazgeç" row; a
// destructive row stands at the foot, red. The ⋮ menu (SikayetEt, MekanSecenek): 292 wide, 28
// round, the flat surface, no scrim. The long-press menu (`hold`, MesajlarUzunBas): 268 wide, 24
// round, over its scrim (SheetScrim → hold). One open at a time with the sheets, the dialog and the
// held message (lib/overlayStore.ts). Measured first (unseen), then placed and grown; with reduce
// motion it appears and goes at once.
function MenuPop({
  anchor,
  visible,
  hold,
  onClose,
  children,
}: {
  anchor: MenuAnchor;
  visible: boolean;
  hold: boolean;
  onClose: () => void;
  children: ReactNode[];
}) {
  const { scheme } = useTheme();
  const reduce = useReduceMotion();
  const screen = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const shadowOff = useLabOff('golge');
  const [mounted, setMounted] = useState(visible);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const [p] = useState(() => new Animated.Value(0));
  useLeaveKeyboard(visible);
  useOverlaySlot(hold ? 'hold' : 'menu', visible, onClose);
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
  const L = KIT.layer.size;
  const radius = hold ? L.holdRadius : L.menuRadius;
  // At most the screen less its edges (320 dp: 292 still fits).
  const width = Math.min(hold ? L.holdWidth : L.menuWidth, screen.width - 2 * KIT.size.menuGap);
  const shadow = boxShadowParts(shadowOff, KIT.layer[scheme].menuShadow, radius);
  return (
    <Modal
      transparent
      visible={mounted}
      animationType="none"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      {hold ? (
        <SheetScrim
          hold
          opacity={p.interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolate: 'clamp' })}
        />
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={tr.common.close}
        onPress={onClose}
        style={StyleSheet.absoluteFill}
      />
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
          width,
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
          <PopClose.Provider value={onClose}>
            <MenuCard look={hold ? 'hold' : 'pop'}>{children}</MenuCard>
          </PopClose.Provider>
        </View>
      </Animated.View>
    </Modal>
  );
}

const ROW_HEIGHT = 56;
const ROW_GAP = 14;

export function MenuItem({
  label,
  icon,
  cap,
  onPress,
  negative,
  loading,
  disabled,
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
  // Off, with its reason in `note` (tuval MesajlarSabitDolu: "Sabitle" at five pinned).
  disabled?: boolean;
  // A line under the label (skall tuvali, MasaKisiSecenekler: what "Engelle" does).
  note?: string;
  testID?: string;
  // A row that opens a page (skall tuvali, Ayarlar): a chevron, with a count before it.
  chevron?: boolean;
  count?: number;
}) {
  const { colors, scheme } = useTheme();
  const look = useContext(Look);
  const follows = useContext(Follows);
  const popClose = useContext(PopClose);
  const layer = KIT.layer[scheme];
  const L = KIT.layer.size;
  // The ⋮ menu's row (MekanSecenek `.pi`), the long-press menu's (MesajlarUzunBas `.pi`), a sheet's
  // (U21: 56, 16 in, 14 between the icon and the words, `.srow`).
  const row =
    look === 'pop'
      ? {
          icon: L.menuIcon,
          gap: L.menuRowGap,
          min: L.menuRow,
          padX: L.menuRowPadX,
          padY: L.menuRowPadY,
          radius: L.menuRowRadius,
          hairIn: L.menuHairIn,
          hairOut: L.menuRowPadX,
          hair: layer.menuHair,
        }
      : look === 'hold'
        ? {
            icon: L.holdIcon,
            gap: L.holdGap,
            min: L.holdRow,
            padX: L.holdRowPadX,
            padY: 0,
            radius: L.holdRowRadius,
            hairIn: L.holdHairIn,
            hairOut: L.holdRowPadX,
            hair: layer.holdHair,
          }
        : {
            icon: ICON.lg,
            gap: ROW_GAP,
            min: ROW_HEIGHT,
            padX: SPACING[4],
            padY: 0,
            radius: 0,
            // U29 (`.srow + .srow:before`): the hairline starts where the words do, 16 in from
            // the right.
            hairIn: SPACING[4] + (cap || icon ? ICON.lg + ROW_GAP : 0),
            hairOut: SPACING[4],
            hair: KIT[scheme].hair,
          };
  const iconSize = row.icon;
  const press = useSinglePress(
    popClose
      ? () => {
          popClose();
          onPress();
        }
      : onPress,
  );
  const sheet = look === 'sheet';
  const ink = negative ? (sheet ? colors.onDangerSoft : layer.menuDanger) : colors.text;
  // The ⋮ menu's icons --primary; the long-press menu's the ink, their body muted (the red's at
  // 35 %); a sheet's muted.
  const iconInk = negative
    ? ink
    : look === 'pop'
      ? layer.menuIcon
      : look === 'hold'
        ? layer.holdIcon
        : colors.muted;
  const iconBody =
    look === 'hold'
      ? negative
        ? { second: layer.holdDangerBody, soft: layer.holdDangerSoft }
        : { second: layer.holdIconBody, soft: layer.holdIconSoft }
      : look === 'pop'
        ? { second: iconInk, soft: 1 }
        : null;
  return (
    <Pressable
      testID={testID}
      accessibilityRole={popClose ? 'menuitem' : 'button'}
      accessibilityState={{ disabled: !!loading || !!disabled, busy: !!loading }}
      disabled={loading || disabled}
      onPress={press}
    >
      {({ pressed }) => (
        <View
          className="flex-row items-center"
          style={{
            gap: row.gap,
            minHeight: row.min,
            paddingHorizontal: row.padX,
            paddingVertical: row.padY,
            borderRadius: row.radius,
            opacity: pressed ? OPACITY.pressed : 1,
          }}
        >
          {follows ? (
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: row.hairIn,
                right: row.hairOut,
                borderTopWidth: KIT.size.hair,
                borderTopColor: row.hair,
              }}
            />
          ) : null}
          {cap ? (
            <CapIcon
              name={cap}
              size={iconSize}
              color={iconInk}
              second={iconBody?.second}
              soft={iconBody?.soft}
            />
          ) : icon ? (
            <AppIcon name={icon} size={iconSize} color={iconInk} />
          ) : null}
          <View
            className="flex-1"
            style={{ gap: SPACING[0.5], paddingVertical: note ? SPACING[2.5] : 0 }}
          >
            {!sheet ? (
              <T v={look === 'pop' ? 'popRow' : 'holdRow'} color={ink}>
                {label}
              </T>
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
