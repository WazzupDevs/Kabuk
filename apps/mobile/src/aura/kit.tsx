import { upperTr } from '@shared/trText.ts';
import { Image as PhotoView } from 'expo-image';
import Reanimated, { Easing as ReEasing, FadeIn, FadeOut } from 'react-native-reanimated';
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
  Easing,
  Image,
  type ImageSourcePropType,
  Pressable,
  type StyleProp,
  StyleSheet,
  Text,
  type TextStyle,
  View,
  type ViewStyle,
} from 'react-native';

import { Loader, useLoopActive } from '@/components/Loader';
import { boxShadowParts, shadowParts } from '@/components/NativeShadow';
import { useLabOff } from '@/lib/drawLab';
import { useNarrow } from '@/lib/useNarrow';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { useReduceTransparency } from '@/lib/useReduceTransparency';
import { AURA, MOTION } from '@/theme/aura';
import {
  BTN_STRONG,
  type ButtonGlassKind,
  EYEBROW_NARROW,
  KIT,
  KIT_TYPE,
  type KitTextVariant,
} from '@/theme/auraKit';
import { gradientStyle } from '@/theme/gradient';
import { Frost, FROSTED } from '@/components/LiquidGlass';
import { useTheme } from '@/theme/ThemeProvider';

import { CapIcon, type CapIconName } from './CapIcon';
import { springConfig, SWAP_RN } from './motion';
import { photoCacheKey } from '@/lib/usePhoto';
import { PRESS_DELAY, usePress } from '@/motion/Tap';

// The canvas's component kit (docs/design/aura/project/aura.css), class for class. Values from
// theme/auraKit.ts; nothing is measured here.

export function useKit() {
  const { scheme } = useTheme();
  return { scheme, c: KIT[scheme], tags: scheme === 'dark' ? KIT.tagsDark : KIT.tags };
}

// Text: .display, .title, .h3, .body, .fine, .eyebrow, .stamp; `strong` is .strong (ink, 600).
// .body, .fine, .eyebrow and .stamp are muted unless `ink` or `strong`; `color` wins over both.
// `note` too: a description under a title is quieter than it (the owner's report, 2 Kasım, 3.4).
const MUTED: readonly KitTextVariant[] = ['body', 'fine', 'eyebrow', 'stamp', 'member', 'note'];
export function T({
  v = 'body',
  ink,
  strong,
  color,
  center,
  lines,
  fit,
  tabular,
  style,
  children,
  testID,
  accessibilityRole,
  accessibilityLiveRegion,
}: {
  v?: KitTextVariant;
  ink?: boolean;
  strong?: boolean;
  color?: string;
  center?: boolean;
  lines?: number;
  // Shrinks to fit its lines rather than ending in "…" (CLAUDE.md → Ekran davranışı).
  fit?: boolean;
  // Digits of one width (a time at a list row's right, iskelet.md → 5.3).
  tabular?: boolean;
  style?: StyleProp<TextStyle>;
  children: ReactNode;
  testID?: string;
  accessibilityRole?: 'header' | 'text';
  accessibilityLiveRegion?: 'polite' | 'assertive' | 'none';
}) {
  const { c } = useKit();
  const narrow = useNarrow();
  const tone = color ?? (MUTED.includes(v) && !ink && !strong ? c.muted : c.ink);
  return (
    <Text
      testID={testID}
      accessibilityRole={accessibilityRole}
      accessibilityLiveRegion={accessibilityLiveRegion}
      numberOfLines={lines}
      adjustsFontSizeToFit={fit}
      minimumFontScale={fit ? MIN_FIT : undefined}
      maxFontSizeMultiplier={MAX_FONT_SCALE}
      style={[
        v === 'eyebrow' && narrow ? EYEBROW_NARROW : KIT_TYPE[v],
        strong ? KIT_TYPE.strong : null,
        { color: tone, textAlign: center ? 'center' : undefined },
        tabular ? TABULAR : null,
        style,
      ]}
    >
      {children}
    </Text>
  );
}
// The canvas's type grows with the system's text size up to this much.
const MAX_FONT_SCALE = 1.3;
const MIN_FIT = 0.5;
const TABULAR: TextStyle = { fontVariant: ['tabular-nums'] };

// .glass (.sm, .pad, .pad-lg): frosted white, a white edge, the soft green shadow and a light top
// line; in the dark flat #121614 with a 9 % white edge.
// Inside a sheet a glass card lies flat: the sheet is the surface, and its scroll clips a card's
// soft shadow into square corners outside the round ones (the owner's report, 28 Ekim).
const FlatGlass = createContext(false);
export function InSheet({ children }: { children: ReactNode }) {
  return <FlatGlass.Provider value>{children}</FlatGlass.Provider>;
}

// On a card (a Glass) a button lies on the card, not on the screen's backdrop: it keeps its own
// fill over the card, unfrosted (a frost there would show the clouds through the card).
const OnCard = createContext(false);

// Whether a clear button here is frosted (ui/LiquidGlass → Frost): where the glass blurs, straight
// on the screen (not on a card, not in a sheet). Çizim ölçümü's `buzlu` (lib/drawLab.ts) unfrosts it:
// the control keeps its own fill, as where the glass does not blur. With the system's "reduce
// transparency" on nothing is frosted (iskelet.md → 6.6).
export function useFrost(): boolean {
  const onCard = useContext(OnCard);
  const flat = useContext(FlatGlass);
  const labOff = useLabOff('buzlu');
  const solid = useReduceTransparency();
  return FROSTED && !onCard && !flat && !labOff && !solid;
}

export function Glass({
  sm,
  pad,
  radius: round,
  frost,
  style,
  children,
  testID,
}: {
  sm?: boolean;
  pad?: 'pad' | 'lg';
  // Its own roundness (a pill: half its height), the shadow drawn to the same.
  radius?: number;
  // A control on glass (a field, a switch): the screen's backdrop frosted under its fill (the
  // owner's call, 30 Ekim). A card stays as it is.
  frost?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
  testID?: string;
}) {
  const { c, scheme } = useKit();
  const flat = useContext(FlatGlass);
  const shadowOff = useLabOff('golge');
  // Çizim ölçümü's `kart`, and the system's "reduce transparency" (iskelet.md → 6.6) outside a
  // sheet (a card there is already opaque): the toned opaque fill instead of the translucent glass.
  const labFlat = useLabOff('kart');
  const solid = useReduceTransparency();
  const flatFill = labFlat || (solid && !flat);
  const canFrost = useFrost();
  const frosted = !!frost && canFrost;
  const radius = round ?? (sm ? KIT.size.glassRadiusSm : KIT.size.glassRadius);
  // In a sheet the card takes the sheet's card colour (U2: #1B211F in the dark).
  const fill = flat ? c.glassInSheet : c.glass;
  const shadow = shadowParts(
    shadowOff,
    flat ? undefined : c.glassShadow,
    c.glassInset,
    radius,
    StyleSheet.flatten(style)?.overflow !== 'hidden',
    KIT.size.edge,
  );
  return (
    <View
      testID={testID}
      style={[
        frosted ? null : flatFill ? { backgroundColor: c.sheetBase } : gradientStyle(fill),
        {
          borderRadius: radius,
          borderWidth: KIT.size.edge,
          borderColor: flat ? c.glassInSheetEdge : c.glassEdge,
          boxShadow: shadow.boxShadow,
          padding: pad === 'pad' ? KIT.size.pad : pad === 'lg' ? KIT.size.padLg : undefined,
        },
        style,
      ]}
    >
      {shadow.node}
      {frosted ? (
        <>
          <Frost radius={radius} ground={AURA[scheme].ground} />
          <View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              { borderRadius: radius },
              flatFill ? { backgroundColor: c.sheetBase } : gradientStyle(fill),
            ]}
          />
        </>
      ) : null}
      <OnCard.Provider value>{children}</OnCard.Provider>
    </View>
  );
}

// A clear button's frost (ui/LiquidGlass → Frost; the owner's call, 30 Ekim), round at its height.
function FrostOf({ height, fill }: { height: number; fill?: string }) {
  const { scheme } = useTheme();
  if (!useFrost()) return null;
  return <Frost radius={height / 2} ground={AURA[scheme].ground} fill={fill} />;
}

// The press (iskelet.md → 2.3) is the motion kit's (src/motion/Tap.tsx): one source for Tap and
// every button here.
export { PRESS_DELAY, usePress };

// .btn (.primary, .glassy, .dark; .sm; .block): a capsule, its icon before its label. Busy: the
// label stays, the meeting capsules turn beside it, a second press is ignored.
// A button sits in a row's middle (Li, Row): its own `alignSelf` would otherwise put it at the
// row's top. In a column it keeps to the start, its own width.
const InRow = createContext(false);

export function Btn({
  label,
  onPress,
  variant = 'primary',
  sm,
  mid,
  tall,
  bar,
  block,
  snug,
  icon,
  loading,
  disabled,
  tint,
  fill,
  trail,
  testID,
  accessibilityLabel,
  style,
}: {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'glassy' | 'dark' | 'danger';
  sm?: boolean;
  // Mekan's "Masa kur": 44 high, 15.
  mid?: boolean;
  // The venue page's and the check-in sheet's button: 58 high.
  tall?: boolean;
  // In a bar of round buttons: a button as tall as they are, `bar` high (the owner's report, 29
  // Ekim: Masa's "Bitir" stood shorter than the rounds beside it). Beside 48 rounds 18 inside and
  // 16 (Masa); beside 44 the small one's.
  bar?: number;
  block?: boolean;
  // As wide as its words beside a wider button: 16 inside, its icon 20 (Aura v76 ProfilBaskasi,
  // "Arkadaşlıktan çıkar"; F1).
  snug?: boolean;
  icon?: CapIconName;
  loading?: boolean;
  disabled?: boolean;
  // The label's colour where the canvas gives one (Bitir, Ayrıl in red).
  tint?: string;
  // A flat fill where the canvas gives one (Kinshi's Doğru on --signal, a team's Katıl), with
  // `tint` for its words; no shadow.
  fill?: string;
  // Something after the words (Kinshi's count in Sonraki tura geç, its pass count).
  trail?: ReactNode;
  testID?: string;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const { c, scheme } = useKit();
  const inRow = useContext(InRow);
  const press = usePress();
  const shadowOff = useLabOff('golge');
  const solid = useReduceTransparency();
  // Glass (iskelet.md → 2.1): the primary prominent, the glassy clear, the danger red; no live
  // blur. Disabled is the same button faded, its touch off. "dark" (a chip-like button) stays as it
  // was.
  const off = disabled && !loading;
  const glass = variant !== 'dark';
  const kind: ButtonGlassKind =
    variant === 'danger' ? 'danger' : variant === 'glassy' ? 'clear' : 'prominent';
  const g = KIT.button[scheme][kind];
  const fg = tint ?? (variant === 'dark' ? (off ? c.onDisabled : c.onChipOn) : g.ink);
  const height = bar
    ? bar
    : sm
      ? KIT.size.btnSm
      : mid
        ? KIT.size.btnMid
        : tall
          ? KIT.size.btnTall
          : KIT.size.btn;
  const big = bar ? bar >= KIT.size.roundLg : false;
  const small = sm || (!!bar && !big);
  const padX = snug
    ? KIT.size.btnPadXSnug
    : big || mid
      ? KIT.size.btnPadXMid
      : small
        ? KIT.size.btnPadXSm
        : KIT.size.btnPadX;
  const labelType = mid ? KIT_TYPE.btnMid : small ? KIT_TYPE.btnSm : KIT_TYPE.btn;
  // The soft outer shadow drawn natively (NativeShadow.tsx); the top light, the bottom line and the
  // white edge inside are inset shadows. A flat `fill` has none.
  const shadow =
    glass && !fill
      ? shadowParts(
          shadowOff,
          g.shadow || undefined,
          g.inset || undefined,
          height / 2,
          true,
          KIT.size.edge,
        )
      : null;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: !!disabled || !!loading, busy: !!loading }}
      disabled={disabled || loading}
      onPress={onPress}
      unstable_pressDelay={press.delay}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      // Round like the button: a shadow a screen gives it (Paketler's Aç) drew a box round it.
      style={[
        {
          alignSelf: block ? 'stretch' : inRow ? 'center' : 'flex-start',
          borderRadius: KIT.size.btn,
          opacity: off && glass ? KIT.button.offOpacity : 1,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          glass
            ? fill
              ? { backgroundColor: fill }
              : {
                  ...gradientStyle(solid ? g.solid : g.fill),
                  borderWidth: KIT.size.edge,
                  borderColor: g.edge,
                  boxShadow: shadow?.boxShadow,
                }
            : { backgroundColor: off ? c.disabledOnCard : c.chipOn },
          {
            height,
            paddingHorizontal: padX,
            borderRadius: height / 2,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: KIT.size.btnGap,
            transform: [{ scale: press.scale }],
          },
        ]}
      >
        {shadow?.node}
        {loading ? (
          <Loader kind="meet" size={sm ? KIT.size.iconSm : KIT.size.icon} delay={0} label={null} />
        ) : icon && !off ? (
          // Disabled, no icon (Aura v65 `.btn.off`; the owner's report, 2 Kasım, 10.1).
          <CapIcon
            name={icon}
            color={fg}
            soft={kind === 'clear' ? CLEAR_SOFT : PRIMARY_SOFT}
            size={sm ? KIT.size.iconSm : snug ? KIT.size.iconSnug : KIT.size.icon}
          />
        ) : null}
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={MIN_LABEL_SCALE}
          maxFontSizeMultiplier={MAX_FONT_SCALE}
          style={[
            labelType,
            glass && !fill && kind !== 'clear' ? BTN_STRONG : null,
            { color: fg, flexShrink: 1 },
          ]}
        >
          {label}
        </Text>
        {trail && !loading ? trail : null}
      </Animated.View>
    </Pressable>
  );
}
// The riso print's texture tile (scripts/icon/risoButton.ts), light marks on the dark ink: only
// Mesajlar's riso "+" now; the buttons are glass (iskelet.md → 2.1).
export const RISO_TEXTURE = {
  light: require('../../assets/riso/button/texture-light.png') as ImageSourcePropType,
};
const PRIMARY_SOFT = 0.62;
const CLEAR_SOFT = 0.5;
// A disabled switch (not a button: U10 is for buttons) still fades.
const DISABLED = 0.45;
const MIN_LABEL_SCALE = 0.6;

// .round (.glassy): a round icon button, 44.
export function Round({
  icon,
  label,
  onPress,
  glassy = true,
  color,
  badge,
  testID,
  disabled,
  loading,
  primary,
  big,
  light,
  side,
  onHold,
  children,
}: {
  icon?: CapIconName;
  label: string;
  onPress?: () => void;
  // Pressed and held: true while a finger is on it, false when it lifts (Krot's "Rolüm").
  onHold?: (on: boolean) => void;
  glassy?: boolean;
  color?: string;
  badge?: number;
  testID?: string;
  disabled?: boolean;
  // Pressed and waiting: the meeting capsules in its place, a second press does nothing.
  loading?: boolean;
  // The main action of a row (accept, join): the primary's round.
  primary?: boolean;
  // The venue page's back button: 44.
  big?: boolean;
  // Over a picture (U17): light glass, a white edge, the ink, in both schemes.
  light?: boolean;
  // Its own size (Masa's bar: 48, or 44 on a narrow phone).
  side?: number;
  children?: ReactNode;
}) {
  const { c } = useKit();
  const press = usePress();
  const s = side ?? (big ? KIT.size.roundLg : KIT.size.round);
  const shadowOff = useLabOff('golge');
  const frost = useFrost();
  const off = disabled && !loading;
  const frosted = frost && glassy && !primary && !off && !light;
  const fg = off
    ? c.onDisabled
    : primary
      ? KIT.onPrimary
      : light
        ? KIT.sceneRound.ink
        : (color ?? c.ink);
  const shadow = off
    ? null
    : primary
      ? shadowParts(shadowOff, c.primaryShadow, c.primaryInset, s / 2)
      : glassy
        ? shadowParts(shadowOff, c.raisedShadow || undefined, undefined, s / 2, true, KIT.size.edge)
        : null;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled || !!loading, busy: !!loading }}
      onPress={onPress}
      disabled={disabled || loading}
      unstable_pressDelay={press.delay}
      onPressIn={() => {
        press.onPressIn();
        onHold?.(true);
      }}
      onPressOut={() => {
        press.onPressOut();
        onHold?.(false);
      }}
    >
      <Animated.View
        style={[
          {
            width: s,
            height: s,
            borderRadius: s / 2,
            alignItems: 'center',
            justifyContent: 'center',
            transform: [{ scale: press.scale }],
          },
          // Disabled (U10): the neutral fill, not faded.
          off
            ? { backgroundColor: frost ? c.disabled : c.disabledOnCard }
            : primary
              ? { backgroundColor: KIT.primary, boxShadow: shadow?.boxShadow }
              : light
                ? {
                    backgroundColor: KIT.sceneRound.bg,
                    borderWidth: KIT.size.edge,
                    borderColor: KIT.sceneRound.edge,
                  }
                : glassy
                  ? {
                      backgroundColor: frosted ? undefined : c.raisedRound,
                      borderWidth: KIT.size.edge,
                      borderColor: c.raisedEdge,
                      boxShadow: shadow?.boxShadow,
                    }
                  : null,
        ]}
      >
        {shadow?.node}
        {glassy && !primary && !off && !light ? <FrostOf height={s} fill={c.raisedRound} /> : null}
        {loading ? (
          <Loader kind="meet" size={KIT.size.iconSm} delay={0} label={null} />
        ) : (
          (children ?? (icon ? <CapIcon name={icon} color={fg} /> : null))
        )}
        {badge ? (
          <View style={{ position: 'absolute', top: -BADGE_OUT, right: -BADGE_OUT }}>
            <Badge count={badge} />
          </View>
        ) : null}
      </Animated.View>
    </Pressable>
  );
}
const BADGE_OUT = 4;

// .badge: a pink count.
// `swap`: a new count takes the old one's place, the old fading out (hareket.json → leave, 120) and the
// new in (arrive, 180); the badge stays where it is (Mekan sohbeti kartı).
export function Badge({ count, large, swap }: { count: number; large?: boolean; swap?: boolean }) {
  const side = large ? KIT.size.badgeLg : KIT.size.badge;
  const label = count > 99 ? '99+' : String(count);
  const textStyle = [large ? KIT_TYPE.badgeLg : KIT_TYPE.badge, { color: KIT.white }];
  return (
    <View
      style={{
        minWidth: side,
        height: side,
        paddingHorizontal: KIT.size.badgePadX,
        borderRadius: side / 2,
        backgroundColor: KIT.pink,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {swap ? (
        <Reanimated.Text
          key={label}
          entering={FadeIn.duration(BADGE_ARRIVE_MS).easing(BADGE_ARRIVE)}
          exiting={FadeOut.duration(BADGE_LEAVE_MS).easing(BADGE_LEAVE)}
          maxFontSizeMultiplier={1}
          style={textStyle}
        >
          {label}
        </Reanimated.Text>
      ) : (
        <Text maxFontSizeMultiplier={1} style={textStyle}>
          {label}
        </Text>
      )}
    </View>
  );
}
const BADGE_ARRIVE_MS = 180;
const BADGE_LEAVE_MS = 120;
const BADGE_ARRIVE = ReEasing.bezier(...MOTION.curves.arrive);
const BADGE_LEAVE = ReEasing.bezier(...MOTION.curves.leave);

// .chip (.on): a filter. `tall`: Keşfet's kind chips (38 high, 15). It sinks when pressed like every
// button (hareket.json → press).
export function Chip({
  label,
  on,
  onPress,
  testID,
  tall,
  lg,
  md,
  narrow,
  icon,
  accessibilityLabel,
  fixed,
}: {
  label: string;
  on?: boolean;
  onPress?: () => void;
  testID?: string;
  tall?: boolean;
  // Kapsülün's slots: 40 high, 18 inside, 15.
  lg?: boolean;
  // U19: Mekan's spot, 40 high, 16 inside, 14.
  md?: boolean;
  // Aura v75 KesfetHaritaDar: 320 dp or the largest text (src/lib/narrow.ts), 46 high and 15.
  narrow?: boolean;
  // U35: a worn part's chip leads with its close icon, 10 in on that side.
  icon?: CapIconName;
  accessibilityLabel?: string;
  // Its words keep their size in any system text size (a chip inside a fixed-height pill, as
  // Kinshi's turn chip beside the score's numbers).
  fixed?: boolean;
}) {
  const { c } = useKit();
  const press = usePress();
  const frosted = useFrost() && !on;
  const h = narrow
    ? KIT.size.chipNarrow
    : lg || md
      ? KIT.size.chipLg
      : tall
        ? KIT.size.chipTall
        : KIT.size.chip;
  // Its soft shadow natively (NativeShadow.tsx).
  const shadowOff = useLabOff('golge');
  const shadow = shadowParts(
    shadowOff,
    on ? undefined : c.chipShadow || undefined,
    undefined,
    h / 2,
    true,
    KIT.size.edge,
  );
  return (
    <Pressable
      testID={testID}
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={onPress ? { selected: !!on } : undefined}
      disabled={!onPress}
      onPress={onPress}
      unstable_pressDelay={press.delay}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
    >
      <Animated.View
        style={{
          height: h,
          paddingLeft: icon ? KIT.size.chipIconPadLeft : undefined,
          paddingHorizontal: md
            ? KIT.size.chipMdPadX
            : lg
              ? KIT.size.chipLgPadX
              : tall
                ? KIT.size.chipTallPadX
                : KIT.size.chipPadX,
          borderRadius: h,
          flexDirection: 'row',
          alignItems: 'center',
          gap: KIT.size.chipGap,
          backgroundColor: on ? c.chipOn : frosted ? undefined : c.raisedChip,
          borderWidth: KIT.size.edge,
          borderColor: on ? c.chipOn : c.raisedEdge,
          boxShadow: shadow.boxShadow,
          transform: [{ scale: press.scale }],
        }}
      >
        {shadow.node}
        {on ? null : <FrostOf height={h} fill={c.raisedChip} />}
        {icon ? <CapIcon name={icon} color={c.muted} size={KIT.size.iconSm} /> : null}
        <Text
          numberOfLines={1}
          maxFontSizeMultiplier={fixed ? 1 : MAX_FONT_SCALE}
          style={[
            md ? KIT_TYPE.chipMd : tall || lg || narrow ? KIT_TYPE.chipLg : KIT_TYPE.chip,
            { color: on ? c.onChipOn : c.ink },
          ]}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

export type TagTone =
  | 'purple'
  | 'pink'
  | 'amber'
  | 'green'
  | 'glassy'
  | 'art'
  | 'artLit'
  | 'artOk'
  | 'scene'
  | 'sceneCalm'
  | 'event'
  | 'eventTime';

// .tag: a small capsule of a colour, its dot or icon first.
export function Tag({
  label,
  tone = 'glassy',
  lead,
  height,
  large,
  fit,
  colors: own,
}: {
  label: string;
  tone?: TagTone;
  lead?: ReactNode;
  height?: number;
  // A venue page's tags over its scene: 30 high, 14.
  large?: boolean;
  // Within a narrow place: the words shrink to fit rather than end in "…".
  fit?: boolean;
  // A ground and ink of the canvas's own (Kinshi's team labels, Doğru, Pas, Yasak!).
  colors?: { bg: string; fg: string; edge?: string };
}) {
  const { c, tags } = useKit();
  const frosted = useFrost() && tone === 'glassy' && !own;
  // `art`: dark glass over a picture (Masa's game cards); `artLit` white there (the person's vote);
  // `artOk` white with the success green (the owner's "Aç": the green tag did not read over the
  // posters, the owner's report, 6 Kasım, round 3).
  const colors = own
    ? own
    : tone === 'glassy'
      ? { bg: c.raisedRound, fg: c.ink }
      : tone === 'art'
        ? { bg: KIT.artTag, fg: KIT.white }
        : tone === 'artLit'
          ? { bg: KIT.white, fg: KIT.light.ink }
          : tone === 'artOk'
            ? { bg: KIT.white, fg: KIT.tags.green.fg }
            : tone === 'scene'
              ? KIT.sceneTag
              : tone === 'sceneCalm'
                ? KIT.sceneTagCalm
                : tone === 'event'
                  ? KIT.eventTag
                  : tone === 'eventTime'
                    ? KIT.eventTimeTag
                    : { bg: tags[tone].bg, fg: tags[tone].fg };
  return (
    <View
      style={{
        height: height ?? (large ? KIT.size.tagLg : KIT.size.tag),
        paddingHorizontal: large
          ? KIT.size.tagLgPadX
          : height
            ? KIT.size.chipPadX - 1
            : KIT.size.tagPadX,
        borderRadius: KIT.size.chip,
        flexDirection: 'row',
        alignItems: 'center',
        gap: KIT.size.tagGap,
        backgroundColor: frosted ? undefined : colors.bg,
        borderWidth: own ? (own.edge ? KIT.size.edge : 0) : tone === 'glassy' ? KIT.size.edge : 0,
        borderColor: own?.edge ?? c.raisedEdge,
        alignSelf: 'flex-start',
      }}
    >
      {tone === 'glassy' && !own ? (
        <FrostOf height={height ?? (large ? KIT.size.tagLg : KIT.size.tag)} fill={colors.bg} />
      ) : null}
      {lead}
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit={fit}
        minimumFontScale={fit ? MIN_TAG_SCALE : undefined}
        maxFontSizeMultiplier={MAX_FONT_SCALE}
        style={[
          large ? KIT_TYPE.tagLg : KIT_TYPE.tag,
          { color: colors.fg },
          fit ? { flexShrink: 1 } : null,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const MIN_TAG_SCALE = 0.7;

// .live: a glowing dot and its words. The dot beats: two rings spread from it and fade, one after
// the other, like a pulse (the owner's call, 28 Ekim). Still with reduce motion, and while the
// screen is out of sight.
export function Live({
  label,
  color = KIT.success,
  ring = KIT.successRing,
  large,
  soft,
}: {
  label: string;
  color?: string;
  ring?: string;
  // Mekan's "Mekandasın" at 14; the venue chat's "şu an aktif" at 500 in the muted ink (U20).
  large?: boolean;
  soft?: boolean;
}) {
  const { c } = useKit();
  const type = large ? KIT_TYPE.liveLg : soft ? KIT_TYPE.liveSoft : KIT_TYPE.live;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: KIT.size.chipGap }}>
      <PulseDot color={color} ring={ring} />
      <Text
        maxFontSizeMultiplier={MAX_FONT_SCALE}
        style={[type, { color: soft ? c.muted : c.ink }]}
      >
        {label}
      </Text>
    </View>
  );
}

export function PulseDot({
  color = KIT.success,
  ring = KIT.successRing,
  size = KIT.size.dot,
}: {
  color?: string;
  ring?: string;
  size?: number;
}) {
  const reduce = useReduceMotion();
  const active = useLoopActive();
  const { scheme } = useKit();
  // The core's glow natively (NativeShadow.tsx): the waves redraw the screen on every frame, and
  // React Native would blur this glow again on each one. None in the dark: there it stood as a
  // grey disc round the dot (the owner's report, 2 Kasım, 2.2); the waves stay.
  const glow = boxShadowParts(
    useLabOff('golge'),
    scheme === 'dark'
      ? undefined
      : `0px 0px ${size}px ${ring}, 0px 0px 0px ${KIT.size.dotRing / 2}px ${ring}`,
    size / 2,
  );
  const [waves] = useState(() => [new Animated.Value(0), new Animated.Value(0)]);
  useEffect(() => {
    if (reduce || !active) {
      waves.forEach((w) => w.setValue(0));
      return undefined;
    }
    const loops = waves.map((w, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * (PULSE_MS / 2)),
          Animated.timing(w, {
            toValue: 1,
            duration: PULSE_MS,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(w, { toValue: 0, duration: 0, useNativeDriver: true }),
          Animated.delay((1 - i) * (PULSE_MS / 2)),
        ]),
      ),
    );
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [reduce, active, waves]);
  return (
    <View
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
      accessible={false}
    >
      {reduce
        ? null
        : waves.map((w, i) => (
            <Animated.View
              key={i}
              style={{
                position: 'absolute',
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: color,
                opacity: w.interpolate({ inputRange: [0, 1], outputRange: [PULSE_FROM, 0] }),
                transform: [
                  { scale: w.interpolate({ inputRange: [0, 1], outputRange: [1, PULSE_TO] }) },
                ],
              }}
            />
          ))}
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          boxShadow: glow.boxShadow,
        }}
      >
        {glow.node}
      </View>
    </View>
  );
}
const PULSE_MS = 1800;
const PULSE_FROM = 0.45;
const PULSE_TO = 2.8;

// .sec: a section's heading and its note at the right, on a baseline.
export function Sec({ title, note, large }: { title: string; note?: string; large?: boolean }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        paddingTop: KIT.size.secPadTop,
      }}
    >
      {/* U4: a section's head at h3 (Mekan's lobby still 21, its note 14). */}
      <T v={large ? 'secXl' : 'h3'} accessibilityRole="header">
        {title}
      </T>
      {note ? <T v={large ? 'fineLg' : 'fine'}>{note}</T> : null}
    </View>
  );
}

// .glass.list with .li rows: a hairline between rows.
export function GlassList({ children, testID }: { children: ReactNode; testID?: string }) {
  const { c } = useKit();
  const rows = Children.toArray(children).filter(Boolean);
  return (
    <Glass testID={testID} style={{ paddingVertical: KIT.size.listPadY }}>
      {rows.map((row, i) => (
        <View
          key={i}
          style={i > 0 ? { borderTopWidth: KIT.size.hair, borderTopColor: c.hair } : undefined}
        >
          {row}
        </View>
      ))}
    </Glass>
  );
}

// A list: the rows in one glass card (`.glass.sm.lst`; the owner's report, 2 Kasım, 16.1: the rows
// stood bare on the ground; each row a card of its own looked heavy, 30 Ekim), a hairline between
// them from where the text starts to the row's inner right edge (16.2). `inset`: how far in the
// hairline starts (the row's picture and the gap after it): a settings list's icon 24 + 12 = 36,
// a person's list `person` (the face 44 + 12 = 56).
export function RowList({
  children,
  testID,
  inset = KIT.size.av.row + KIT.size.liGap,
  person,
  plain,
}: {
  children: ReactNode;
  testID?: string;
  inset?: number;
  // A person's list (aura v71, `.av` 44): the hairline from the 44 face; the default stays.
  person?: boolean;
  // Already on a card (Keşfet's map card): no card of its own, the rows to the card's padding.
  plain?: boolean;
}) {
  const { c } = useKit();
  const rows = Children.toArray(children).filter(Boolean);
  const Card = plain ? PlainRows : Glass;
  return (
    <Card sm testID={testID} style={plain ? undefined : { overflow: 'hidden' }}>
      {rows.map((row, i) => (
        <View key={isValidElement(row) && row.key !== null ? row.key : i}>
          {i > 0 ? (
            <View
              style={{
                height: KIT.size.hair,
                marginLeft: KIT.size.liPadX + (person ? KIT.size.avPerson + KIT.size.liGap : inset),
                marginRight: KIT.size.liPadX,
                backgroundColor: c.hair,
              }}
            />
          ) : null}
          {row}
        </View>
      ))}
    </Card>
  );
}
function PlainRows({ testID, children }: { sm?: boolean; testID?: string; children: ReactNode }) {
  return (
    <View testID={testID} style={{ marginHorizontal: -KIT.size.liPadX }}>
      {children}
    </View>
  );
}

// .li: a list row.
export function Li({
  children,
  onPress,
  testID,
  accessibilityLabel,
  padY = KIT.size.liPadY,
  padX = KIT.size.liPadX,
  gap = KIT.size.liGap,
  top,
  minHeight,
}: {
  children: ReactNode;
  onPress?: () => void;
  testID?: string;
  accessibilityLabel?: string;
  // Above and under (Mesajlar's rows: 12).
  padY?: number;
  // Inside (Profil's rows: 18).
  padX?: number;
  // Between the picture and the words (Aktiviteler's rows: 14).
  gap?: number;
  // The picture at the top rather than in the middle (the lobby's narrow row).
  top?: boolean;
  // The row's least height (a settings row: 64).
  minHeight?: number;
}) {
  const style: ViewStyle = {
    minHeight,
    flexDirection: 'row',
    alignItems: top ? 'flex-start' : 'center',
    gap,
    paddingVertical: padY,
    paddingHorizontal: padX,
  };
  const row = <InRow.Provider value>{children}</InRow.Provider>;
  if (!onPress)
    return (
      <View testID={testID} style={style}>
        {row}
      </View>
    );
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      // A row under a scrolling finger never looks pressed (iskelet.md → 2.3, 6.4).
      unstable_pressDelay={PRESS_DELAY}
    >
      {/* The style on an inner View: NativeWind drops a function `style` on Pressable in release
          (docs/arsiv/DECISIONS.md). */}
      {({ pressed }) => (
        <View style={[style, pressed ? { opacity: PRESSED_ROW } : null]}>{row}</View>
      )}
    </Pressable>
  );
}
const PRESSED_ROW = 0.7;

// .thumb: a picture with rounded corners and a soft shadow (60, 18).
export function Thumb({
  source,
  size = KIT.size.thumb,
  radius = KIT.size.thumbRadius,
  accessibilityLabel,
}: {
  source: ImageSourcePropType | undefined;
  size?: number;
  radius?: number;
  accessibilityLabel?: string;
}) {
  const { c } = useKit();
  // Its soft shadow natively (NativeShadow.tsx).
  const shadow = boxShadowParts(useLabOff('golge'), KIT.thumbShadow, radius);
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        boxShadow: shadow.boxShadow,
        backgroundColor: c.raisedRound,
      }}
    >
      {shadow.node}
      {source ? (
        <Image
          fadeDuration={0}
          source={source}
          accessibilityLabel={accessibilityLabel}
          style={{ width: size, height: size, borderRadius: radius }}
        />
      ) : null}
    </View>
  );
}

// .av (.sm, .lg, .xl; c1 … c5): a face. A photo when there is one, else the name's first letter on
// a colour picked from the name. A white ring and a soft shadow.
export function Av({
  name,
  photoUrl,
  size = 'md',
  children,
}: {
  name: string;
  photoUrl?: string | null;
  size?:
    'xs' | 'sm' | 'member' | 'list' | 'md' | 'row' | 'seat' | 'lg' | 'xl' | 'big' | 'hero' | 'edit';
  // Something else in the ring (a capsule).
  children?: ReactNode;
}) {
  const { scheme } = useTheme();
  const side = KIT.size.av[size];
  const ring =
    size === 'xs'
      ? KIT.size.avRingXs
      : size === 'hero'
        ? KIT.size.avRingHero
        : size === 'xl' || size === 'big' || size === 'edit'
          ? KIT.size.avRingXl
          : KIT.size.avRing;
  // U31: the profile's face in the dark sits in a ring of the dark card (#121614).
  const ringColor = size === 'hero' && scheme === 'dark' ? KIT.dark.raised : KIT.white;
  const pick = KIT.avColors[colorIndex(name)] ?? KIT.avColors[0];
  const shadowOff = useLabOff('golge');
  // The face clips its photo, so its native shadow sits beside it in a box of the same size.
  const shadow = shadowParts(shadowOff, KIT.avShadow, undefined, side / 2);
  const face = (
    <View
      style={[
        {
          width: side,
          height: side,
          borderRadius: side / 2,
          borderWidth: ring,
          borderColor: ringColor,
          boxShadow: shadow.boxShadow,
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
        },
        children || photoUrl ? null : gradientStyle(pick),
      ]}
    >
      {children ? (
        children
      ) : photoUrl ? (
        // Kept in memory and on disk under the photo's own path, not its signed address
        // (PhotoImage): a new signature or a new render never loads it again or blinks it white.
        <PhotoView
          source={{ uri: photoUrl, cacheKey: photoCacheKey(photoUrl) }}
          cachePolicy="memory-disk"
          transition={0}
          style={{ width: side, height: side }}
          accessibilityIgnoresInvertColors
        />
      ) : (
        <Text maxFontSizeMultiplier={1} style={[KIT_TYPE.av[size], { color: KIT.white }]}>
          {initial(name)}
        </Text>
      )}
    </View>
  );
  // The same structure with or without the shadow (the Çizim ölçümü's shadow step turns it off):
  // a wrapper that came and went remounted the photo, which went white and loaded again (the
  // owner's report, 29 Ekim).
  return (
    <View style={{ width: side, height: side }}>
      {shadow.node}
      {face}
    </View>
  );
}

function initial(name: string): string {
  return upperTr(name.trim().charAt(0)) || '?';
}

// A face without a photo: its colour from the name (aura.css `.av` c1 … c5).
export function avatarGround(name: string): string {
  return KIT.avColors[colorIndex(name)] ?? KIT.avColors[0];
}

function colorIndex(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return h % KIT.avColors.length;
}

// Masa's tabs (docs/design/aura → Masa): a glass capsule, the chosen tab raised white, the other's
// words muted; a count as a pink badge.
export function Seg<V extends string>({
  value,
  onChange,
  options,
  accessibilityLabel,
  large,
  narrow,
}: {
  value: V;
  onChange: (v: V) => void;
  options: readonly { value: V; label: string; badge?: number; testID?: string }[];
  accessibilityLabel?: string;
  // Mesajlar's (U27): 48 in all, 40 tabs in a pill.
  large?: boolean;
  // Aura v75 AktivitelerDar: 320 dp or the largest text (src/lib/narrow.ts), tabs 52 high.
  narrow?: boolean;
}) {
  const { c } = useKit();
  const flat = useContext(FlatGlass);
  const reduce = useReduceMotion();
  const item = large ? KIT.size.segLg : narrow ? KIT.size.segItemNarrow : KIT.size.segItem;
  const radius = large ? KIT.size.segLgRadius : KIT.size.seg;
  // The chosen tab's soft shadow natively (NativeShadow.tsx).
  const onShadow = shadowParts(useLabOff('golge'), c.segShadow || undefined, undefined, item / 2);
  const index = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  // The white disk slides to the chosen tab on the swap curve (aktarim-31: Sohbetler / İstekler).
  const [width, setWidth] = useState(0);
  const [at] = useState(() => new Animated.Value(index));
  useEffect(() => {
    if (reduce) {
      at.setValue(index);
      return undefined;
    }
    const anim = Animated.timing(at, {
      toValue: index,
      duration: SEG_SLIDE_MS,
      easing: SWAP_RN,
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [index, reduce, at]);
  const n = options.length;
  const cell = n > 0 ? (width - KIT.size.segGap * (n - 1)) / n : 0;
  return (
    <Glass
      frost
      radius={radius}
      style={[
        flat ? gradientStyle(c.segTrackInSheet) : null,
        {
          flexDirection: 'row',
          padding: KIT.size.segPad,
          gap: KIT.size.segGap,
          borderRadius: radius,
        },
      ]}
    >
      <View
        accessibilityRole="tablist"
        accessibilityLabel={accessibilityLabel}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        style={{ flex: 1, flexDirection: 'row', gap: KIT.size.segGap }}
      >
        {width > 0 ? (
          <Animated.View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: cell,
              height: item,
              borderRadius: item / 2,
              backgroundColor: c.segOn,
              boxShadow: onShadow.boxShadow,
              transform: [
                {
                  translateX: at.interpolate({
                    inputRange: [0, Math.max(1, n - 1)],
                    outputRange: [0, Math.max(1, n - 1) * (cell + KIT.size.segGap)],
                  }),
                },
              ],
            }}
          >
            {onShadow.node}
          </Animated.View>
        ) : null}
        {options.map((o) => {
          const on = o.value === value;
          return (
            <Pressable
              key={o.value}
              testID={o.testID}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              onPress={() => onChange(o.value)}
              style={{
                flex: 1,
                height: item,
                borderRadius: item,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: KIT.size.tagGap,
              }}
            >
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={MIN_LABEL_SCALE}
                maxFontSizeMultiplier={MAX_FONT_SCALE}
                // U27: the tabs' words 14/600 at either size (`.seg span`).
                style={[KIT_TYPE.btnSm, { color: on ? c.segOnInk : c.muted, flexShrink: 1 }]}
              >
                {o.label}
              </Text>
              {o.badge ? <Badge count={o.badge} /> : null}
            </Pressable>
          );
        })}
      </View>
    </Glass>
  );
}
// hareket.json gives the swap curve no length: the disk's slide takes this long.
const SEG_SLIDE_MS = 300;

// Masa kur's switch (docs/design/aura → MasaKur): 56 × 34, off a sunk lilac track, on the primary;
// the white knob 3 in, sliding on the press spring (hareket.json). At once when motion is reduced.
// Only the knob; the row around it is the control (its label, its role and its press).
export function Switch({ on, disabled }: { on: boolean; disabled?: boolean }) {
  const { c } = useKit();
  const reduce = useReduceMotion();
  const [x] = useState(() => new Animated.Value(on ? 1 : 0));
  useEffect(() => {
    if (reduce) {
      x.setValue(on ? 1 : 0);
      return undefined;
    }
    const anim = Animated.spring(x, { ...springConfig(MOTION.springs.press), toValue: on ? 1 : 0 });
    anim.start();
    return () => anim.stop();
  }, [on, reduce, x]);
  const inset = (KIT.size.switchH - KIT.size.switchKnob) / 2;
  const travel = KIT.size.switchW - KIT.size.switchKnob - 2 * inset;
  const knob = boxShadowParts(useLabOff('golge'), KIT.switchKnobShadow, KIT.size.switchKnob / 2);
  return (
    <View
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      style={{
        width: KIT.size.switchW,
        height: KIT.size.switchH,
        borderRadius: KIT.size.switchH / 2,
        backgroundColor: on ? KIT.primary : c.switchOff,
        boxShadow: on ? undefined : c.switchInset || undefined,
        padding: inset,
        opacity: disabled ? DISABLED : 1,
      }}
    >
      <Animated.View
        style={{
          width: KIT.size.switchKnob,
          height: KIT.size.switchKnob,
          borderRadius: KIT.size.switchKnob / 2,
          backgroundColor: KIT.white,
          boxShadow: knob.boxShadow,
          transform: [
            { translateX: x.interpolate({ inputRange: [0, 1], outputRange: [0, travel] }) },
          ],
        }}
      >
        {knob.node}
      </Animated.View>
    </View>
  );
}
