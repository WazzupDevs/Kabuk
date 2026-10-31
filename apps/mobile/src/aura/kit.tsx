import { upperTr } from '@shared/trText.ts';
import { Image as PhotoView } from 'expo-image';
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
import { useReduceMotion } from '@/lib/useReduceMotion';
import { AURA, MOTION } from '@/theme/aura';
import { KIT, KIT_TYPE, type KitTextVariant } from '@/theme/auraKit';
import { gradientStyle } from '@/theme/gradient';
import { Frost, FROSTED } from '@/components/LiquidGlass';
import { useTheme } from '@/theme/ThemeProvider';

import { CapIcon, type CapIconName } from './CapIcon';
import { springConfig, SWAP_RN } from './motion';
import { photoCacheKey } from '@/lib/usePhoto';

// The canvas's component kit (docs/design/aura/project/aura.css), class for class. Values from
// theme/auraKit.ts; nothing is measured here.

export function useKit() {
  const { scheme } = useTheme();
  return { scheme, c: KIT[scheme], tags: scheme === 'dark' ? KIT.tagsDark : KIT.tags };
}

// Text: .display, .title, .h3, .body, .fine, .eyebrow, .stamp; `strong` is .strong (ink, 600).
// .body, .fine, .eyebrow and .stamp are muted unless `ink` or `strong`; `color` wins over both.
const MUTED: readonly KitTextVariant[] = ['body', 'fine', 'eyebrow', 'stamp'];
export function T({
  v = 'body',
  ink,
  strong,
  color,
  center,
  lines,
  fit,
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
  style?: StyleProp<TextStyle>;
  children: ReactNode;
  testID?: string;
  accessibilityRole?: 'header' | 'text';
  accessibilityLiveRegion?: 'polite' | 'assertive' | 'none';
}) {
  const { c } = useKit();
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
        KIT_TYPE[v],
        strong ? KIT_TYPE.strong : null,
        { color: tone, textAlign: center ? 'center' : undefined },
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

// .glass (.sm, .pad, .pad-lg): frosted white, a white edge, the soft violet shadow and a light top
// line.
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
// on the screen (not on a card, not in a sheet).
export function useFrost(): boolean {
  const onCard = useContext(OnCard);
  const flat = useContext(FlatGlass);
  return FROSTED && !onCard && !flat;
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
  const flatFill = useLabOff('kart');
  const canFrost = useFrost();
  const frosted = !!frost && canFrost;
  const radius = round ?? (sm ? KIT.size.glassRadiusSm : KIT.size.glassRadius);
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
        frosted ? null : flatFill ? { backgroundColor: c.sheetBase } : gradientStyle(c.glass),
        {
          borderRadius: radius,
          borderWidth: KIT.size.edge,
          borderColor: c.glassEdge,
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
              flatFill ? { backgroundColor: c.sheetBase } : gradientStyle(c.glass),
            ]}
          />
        </>
      ) : null}
      <OnCard.Provider value>{children}</OnCard.Provider>
    </View>
  );
}

// A clear button's frost (ui/LiquidGlass → Frost; the owner's call, 30 Ekim), round at its height.
export function FrostOf({ height, fill }: { height: number; fill?: string }) {
  const { scheme } = useTheme();
  if (!useFrost()) return null;
  return <Frost radius={height / 2} ground={AURA[scheme].ground} fill={fill} />;
}

// A press that sinks a little and springs back (hareket.json → press), on the native driver.
export function usePress() {
  const [scale] = useState(() => new Animated.Value(1));
  return {
    scale,
    onPressIn: () =>
      Animated.timing(scale, {
        toValue: MOTION.press.scale,
        duration: MOTION.press.downMs,
        useNativeDriver: true,
      }).start(),
    onPressOut: () =>
      Animated.spring(scale, { ...springConfig(MOTION.springs.press), toValue: 1 }).start(),
  };
}

// .btn (.primary, .glassy, .dark; .sm; .block): a capsule, its icon before its label. Busy: the
// label stays, the meeting capsules turn beside it, a second press is ignored.
// A button sits in a row's middle (Li, Row): its own `alignSelf` would otherwise put it at the
// row's top. In a column it keeps to the start, its own width.
const InRow = createContext(false);
export function RowAlign({ children }: { children: ReactNode }) {
  return <InRow.Provider value>{children}</InRow.Provider>;
}

export function Btn({
  label,
  onPress,
  variant = 'primary',
  sm,
  mid,
  tall,
  bar,
  block,
  icon,
  loading,
  disabled,
  tint,
  testID,
  accessibilityLabel,
  style,
}: {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'glassy' | 'dark';
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
  icon?: CapIconName;
  loading?: boolean;
  disabled?: boolean;
  // The label's colour where the canvas gives one (Bitir, Ayrıl in red).
  tint?: string;
  testID?: string;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const { c } = useKit();
  const press = usePress();
  const inRow = useContext(InRow);
  const shadowOff = useLabOff('golge');
  const frosted = useFrost() && variant === 'glassy';
  const fg =
    tint ?? (variant === 'primary' ? KIT.onPrimary : variant === 'dark' ? c.onChipOn : c.ink);
  const shadow =
    variant === 'primary'
      ? shadowParts(shadowOff, KIT.primaryShadow, c.primaryInset, KIT.size.btn)
      : variant === 'dark'
        ? null
        : shadowParts(
            shadowOff,
            c.raisedShadow || undefined,
            undefined,
            KIT.size.btn,
            true,
            KIT.size.edge,
          );
  const ground: ViewStyle =
    variant === 'primary'
      ? { backgroundColor: KIT.primary, boxShadow: shadow?.boxShadow }
      : variant === 'dark'
        ? { backgroundColor: c.chipOn }
        : {
            backgroundColor: frosted ? undefined : c.raised,
            borderWidth: KIT.size.edge,
            borderColor: c.raisedEdge,
            boxShadow: shadow?.boxShadow,
          };
  const off = disabled && !loading;
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
  const padX = big || mid ? KIT.size.btnPadXMid : small ? KIT.size.btnPadXSm : KIT.size.btnPadX;
  const labelType = mid ? KIT_TYPE.btnMid : small ? KIT_TYPE.btnSm : KIT_TYPE.btn;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: !!disabled || !!loading, busy: !!loading }}
      disabled={disabled || loading}
      onPress={onPress}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      style={[{ alignSelf: block ? 'stretch' : inRow ? 'center' : 'flex-start' }, style]}
    >
      <Animated.View
        style={[
          ground,
          {
            height,
            paddingHorizontal: padX,
            borderRadius: KIT.size.btn,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: KIT.size.btnGap,
            opacity: off ? DISABLED : 1,
            transform: [{ scale: press.scale }],
          },
        ]}
      >
        {shadow?.node}
        {variant === 'glassy' ? <FrostOf height={height} fill={c.raised} /> : null}
        {loading ? (
          <Loader kind="meet" size={sm ? KIT.size.iconSm : KIT.size.icon} delay={0} label={null} />
        ) : icon ? (
          <CapIcon
            name={icon}
            color={fg}
            soft={variant === 'primary' ? PRIMARY_SOFT : 0.5}
            size={sm ? KIT.size.iconSm : KIT.size.icon}
          />
        ) : null}
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={MIN_LABEL_SCALE}
          maxFontSizeMultiplier={MAX_FONT_SCALE}
          style={[labelType, { color: fg, flexShrink: 1 }]}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}
const DISABLED = 0.45;
const PRIMARY_SOFT = 0.62;
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
  side,
  children,
}: {
  icon?: CapIconName;
  label: string;
  onPress?: () => void;
  glassy?: boolean;
  color?: string;
  badge?: number;
  testID?: string;
  disabled?: boolean;
  // Pressed and waiting: the meeting capsules in its place, a second press does nothing.
  loading?: boolean;
  // The main action of a row (accept, join): the primary's round.
  primary?: boolean;
  // The venue page's back button: 48.
  big?: boolean;
  // Its own size (Masa's bar: 48, or 44 on a narrow phone).
  side?: number;
  children?: ReactNode;
}) {
  const { c } = useKit();
  const press = usePress();
  const s = side ?? (big ? KIT.size.roundLg : KIT.size.round);
  const shadowOff = useLabOff('golge');
  const frosted = useFrost() && glassy && !primary;
  const fg = primary ? KIT.onPrimary : (color ?? c.ink);
  const shadow = primary
    ? shadowParts(shadowOff, KIT.primaryShadow, c.primaryInset, s / 2)
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
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
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
            opacity: disabled && !loading ? DISABLED : 1,
          },
          primary
            ? { backgroundColor: KIT.primary, boxShadow: shadow?.boxShadow }
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
        {glassy && !primary ? <FrostOf height={s} fill={c.raisedRound} /> : null}
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
export function Badge({ count, large }: { count: number; large?: boolean }) {
  const side = large ? KIT.size.badgeLg : KIT.size.badge;
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
      <Text
        maxFontSizeMultiplier={1}
        style={[large ? KIT_TYPE.badgeLg : KIT_TYPE.badge, { color: KIT.white }]}
      >
        {count > 99 ? '99+' : String(count)}
      </Text>
    </View>
  );
}

// .chip (.on): a filter. `tall`: Keşfet's kind chips (38 high, 15). It sinks when pressed like every
// button (hareket.json → press).
export function Chip({
  label,
  on,
  onPress,
  testID,
  tall,
  lg,
}: {
  label: string;
  on?: boolean;
  onPress?: () => void;
  testID?: string;
  tall?: boolean;
  // Kapsülün's slots: 40 high, 18 inside, 15.
  lg?: boolean;
}) {
  const { c } = useKit();
  const press = usePress();
  const frosted = useFrost() && !on;
  const h = lg ? KIT.size.chipLg : tall ? KIT.size.chipTall : KIT.size.chip;
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
      accessibilityRole="button"
      accessibilityState={{ selected: !!on }}
      onPress={onPress}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
    >
      <Animated.View
        style={{
          height: h,
          paddingHorizontal: lg
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
        <Text
          numberOfLines={1}
          maxFontSizeMultiplier={MAX_FONT_SCALE}
          style={[tall || lg ? KIT_TYPE.chipLg : KIT_TYPE.chip, { color: on ? c.onChipOn : c.ink }]}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

export type TagTone = 'purple' | 'pink' | 'amber' | 'green' | 'glassy' | 'art' | 'artLit';

// .tag: a small capsule of a colour, its dot or icon first.
export function Tag({
  label,
  tone = 'glassy',
  lead,
  height,
  large,
  fit,
}: {
  label: string;
  tone?: TagTone;
  lead?: ReactNode;
  height?: number;
  // A venue page's tags over its scene: 30 high, 14.
  large?: boolean;
  // Within a narrow place: the words shrink to fit rather than end in "…".
  fit?: boolean;
}) {
  const { c, tags } = useKit();
  const frosted = useFrost() && tone === 'glassy';
  // `art`: dark glass over a picture (Masa's game cards); `artLit` white there (the person's vote).
  const colors =
    tone === 'glassy'
      ? { bg: c.raisedRound, fg: c.ink }
      : tone === 'art'
        ? { bg: KIT.artTag, fg: KIT.white }
        : tone === 'artLit'
          ? { bg: KIT.white, fg: KIT.light.ink }
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
        borderWidth: tone === 'glassy' ? KIT.size.edge : 0,
        borderColor: c.raisedEdge,
        alignSelf: 'flex-start',
      }}
    >
      {tone === 'glassy' ? (
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
  // Mekan's "Mekandasın" at 15; the venue chat's "şu an aktif" at 500.
  large?: boolean;
  soft?: boolean;
}) {
  const { c } = useKit();
  const type = large ? KIT_TYPE.liveLg : soft ? KIT_TYPE.liveSoft : KIT_TYPE.live;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: KIT.size.chipGap }}>
      <PulseDot color={color} ring={ring} />
      <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={[type, { color: c.ink }]}>
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
  // The core's glow natively (NativeShadow.tsx): the waves redraw the screen on every frame, and
  // React Native would blur this glow again on each one.
  const glow = boxShadowParts(
    useLabOff('golge'),
    `0px 0px ${size}px ${ring}, 0px 0px 0px ${KIT.size.dotRing / 2}px ${ring}`,
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
        paddingHorizontal: KIT.size.secPadX,
      }}
    >
      {/* Mekan's lobby: 21, its note 14. */}
      <T v={large ? 'secXl' : 'sec'} accessibilityRole="header">
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

// A list as Telegram Android draws one (the owner's call, 30 Ekim: each row a card looked heavy):
// the rows straight on the ground, the full width of the screen's padding, a hairline between them
// from where the text starts. `inset`: how far in the hairline starts (the row's picture and the
// gap after it).
export function RowList({
  children,
  testID,
  inset = KIT.size.av.row + KIT.size.liGap,
}: {
  children: ReactNode;
  testID?: string;
  inset?: number;
}) {
  const { c } = useKit();
  const rows = Children.toArray(children).filter(Boolean);
  return (
    // The rows reach the screen's padding: their own padding is their touch area, not a margin.
    <View testID={testID} style={{ marginHorizontal: -KIT.size.liPadX }}>
      {rows.map((row, i) => (
        <View key={isValidElement(row) && row.key !== null ? row.key : i}>
          {i > 0 ? (
            <View
              style={{
                height: KIT.size.hair,
                marginLeft: KIT.size.liPadX + inset,
                backgroundColor: c.hair,
              }}
            />
          ) : null}
          {row}
        </View>
      ))}
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
}) {
  const style: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
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

// .disk: a round picture on a white ring with a deep soft shadow.
export function Disk({
  size,
  radius,
  children,
}: {
  size: number;
  radius?: number;
  children: ReactNode;
}) {
  // The disk clips its picture, so its native shadow and ring (NativeShadow.tsx) sit beside it in a
  // box of the same size.
  const shadow = boxShadowParts(
    useLabOff('golge'),
    `${KIT.diskShadow}, 0px 0px 0px ${KIT.size.disk}px ${KIT.diskRing}`,
    radius ?? size / 2,
  );
  return (
    <View style={{ width: size, height: size }}>
      {shadow.node}
      <View
        style={{
          width: size,
          height: size,
          borderRadius: radius ?? size / 2,
          overflow: 'hidden',
          boxShadow: shadow.boxShadow,
        }}
      >
        {children}
      </View>
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
  size?: 'sm' | 'md' | 'row' | 'seat' | 'lg' | 'xl' | 'big';
  // Something else in the ring (a capsule).
  children?: ReactNode;
}) {
  const side = KIT.size.av[size];
  const ring = size === 'xl' || size === 'big' ? KIT.size.avRingXl : KIT.size.avRing;
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
          borderColor: KIT.white,
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
}: {
  value: V;
  onChange: (v: V) => void;
  options: readonly { value: V; label: string; badge?: number; testID?: string }[];
  accessibilityLabel?: string;
  // Mesajlar's (docs/design/aura → Mesajlar): 48 high tabs at 16 in a 30 round.
  large?: boolean;
}) {
  const { c } = useKit();
  const reduce = useReduceMotion();
  const item = large ? KIT.size.segLg : KIT.size.btnSm;
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
      style={{
        flexDirection: 'row',
        padding: KIT.size.segPad,
        gap: KIT.size.segGap,
        borderRadius: radius,
      }}
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
                style={[
                  large ? KIT_TYPE.btn : KIT_TYPE.btnSm,
                  { color: on ? c.ink : c.muted, flexShrink: 1 },
                ]}
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
