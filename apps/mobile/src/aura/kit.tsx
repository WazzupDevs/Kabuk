import { upperTr } from '@shared/trText.ts';
import { Image as PhotoView } from 'expo-image';
import { Children, createContext, type ReactNode, useContext, useEffect, useState } from 'react';
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
import { shadowParts } from '@/components/NativeShadow';
import { useLabOff } from '@/lib/drawLab';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { MOTION } from '@/theme/aura';
import { KIT, KIT_TYPE, type KitTextVariant } from '@/theme/auraKit';
import { gradientStyle } from '@/theme/gradient';
import { useTheme } from '@/theme/ThemeProvider';

import { CapIcon, type CapIconName } from './CapIcon';
import { springConfig } from './motion';

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

export function Glass({
  sm,
  pad,
  style,
  children,
  testID,
}: {
  sm?: boolean;
  pad?: 'pad' | 'lg';
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
  testID?: string;
}) {
  const { c } = useKit();
  const flat = useContext(FlatGlass);
  useLabOff('golge');
  const flatFill = useLabOff('kart');
  const radius = sm ? KIT.size.glassRadiusSm : KIT.size.glassRadius;
  const shadow = shadowParts(
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
        flatFill ? { backgroundColor: c.sheetBase } : gradientStyle(c.glass),
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
      {children}
    </View>
  );
}

// A press that sinks a little and springs back (hareket.json → press), on the native driver.
function usePress() {
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
  // In a bar of round buttons: a small button as tall as they are (the owner's report, 29 Ekim:
  // Masa's "Bitir" stood shorter than the rounds beside it).
  bar?: boolean;
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
  useLabOff('golge');
  const fg =
    tint ?? (variant === 'primary' ? KIT.onPrimary : variant === 'dark' ? c.onChipOn : c.ink);
  const shadow =
    variant === 'primary'
      ? shadowParts(KIT.primaryShadow, c.primaryInset, KIT.size.btn)
      : variant === 'dark'
        ? null
        : shadowParts(c.raisedShadow || undefined, undefined, KIT.size.btn, true, KIT.size.edge);
  const ground: ViewStyle =
    variant === 'primary'
      ? { backgroundColor: KIT.primary, boxShadow: shadow?.boxShadow }
      : variant === 'dark'
        ? { backgroundColor: c.chipOn }
        : {
            backgroundColor: c.raised,
            borderWidth: KIT.size.edge,
            borderColor: c.raisedEdge,
            boxShadow: shadow?.boxShadow,
          };
  const off = disabled && !loading;
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
            height: bar ? KIT.size.round : sm ? KIT.size.btnSm : KIT.size.btn,
            paddingHorizontal: sm ? KIT.size.btnPadXSm : KIT.size.btnPadX,
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
          style={[sm ? KIT_TYPE.btnSm : KIT_TYPE.btn, { color: fg, flexShrink: 1 }]}
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
  children?: ReactNode;
}) {
  const { c } = useKit();
  const press = usePress();
  const s = KIT.size.round;
  useLabOff('golge');
  const fg = primary ? KIT.onPrimary : (color ?? c.ink);
  const shadow = primary
    ? shadowParts(KIT.primaryShadow, c.primaryInset, s / 2)
    : glassy
      ? shadowParts(c.raisedShadow || undefined, undefined, s / 2, true, KIT.size.edge)
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
                  backgroundColor: c.raisedRound,
                  borderWidth: KIT.size.edge,
                  borderColor: c.raisedEdge,
                  boxShadow: shadow?.boxShadow,
                }
              : null,
        ]}
      >
        {shadow?.node}
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
export function Badge({ count }: { count: number }) {
  return (
    <View
      style={{
        minWidth: KIT.size.badge,
        height: KIT.size.badge,
        paddingHorizontal: KIT.size.badgePadX,
        borderRadius: KIT.size.badge / 2,
        backgroundColor: KIT.pink,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text maxFontSizeMultiplier={1} style={[KIT_TYPE.badge, { color: KIT.white }]}>
        {count > 99 ? '99+' : String(count)}
      </Text>
    </View>
  );
}

// .chip (.on): a filter.
export function Chip({
  label,
  on,
  onPress,
  testID,
}: {
  label: string;
  on?: boolean;
  onPress?: () => void;
  testID?: string;
}) {
  const { c } = useKit();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ selected: !!on }}
      onPress={onPress}
      style={{
        height: KIT.size.chip,
        paddingHorizontal: KIT.size.chipPadX,
        borderRadius: KIT.size.chip,
        flexDirection: 'row',
        alignItems: 'center',
        gap: KIT.size.chipGap,
        backgroundColor: on ? c.chipOn : c.raisedChip,
        borderWidth: KIT.size.edge,
        borderColor: on ? c.chipOn : c.raisedEdge,
        boxShadow: on ? undefined : c.chipShadow || undefined,
      }}
    >
      <Text
        numberOfLines={1}
        maxFontSizeMultiplier={MAX_FONT_SCALE}
        style={[KIT_TYPE.chip, { color: on ? c.onChipOn : c.ink }]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export type TagTone = 'purple' | 'pink' | 'amber' | 'green' | 'glassy';

// .tag: a small capsule of a colour, its dot or icon first.
export function Tag({
  label,
  tone = 'glassy',
  lead,
  height,
  fit,
}: {
  label: string;
  tone?: TagTone;
  lead?: ReactNode;
  height?: number;
  // Within a narrow place: the words shrink to fit rather than end in "…".
  fit?: boolean;
}) {
  const { c, tags } = useKit();
  const colors =
    tone === 'glassy' ? { bg: c.raisedRound, fg: c.ink } : { bg: tags[tone].bg, fg: tags[tone].fg };
  return (
    <View
      style={{
        height: height ?? KIT.size.tag,
        paddingHorizontal: height ? KIT.size.chipPadX - 1 : KIT.size.tagPadX,
        borderRadius: KIT.size.chip,
        flexDirection: 'row',
        alignItems: 'center',
        gap: KIT.size.tagGap,
        backgroundColor: colors.bg,
        borderWidth: tone === 'glassy' ? KIT.size.edge : 0,
        borderColor: c.raisedEdge,
        alignSelf: 'flex-start',
      }}
    >
      {lead}
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit={fit}
        minimumFontScale={fit ? MIN_TAG_SCALE : undefined}
        maxFontSizeMultiplier={MAX_FONT_SCALE}
        style={[KIT_TYPE.tag, { color: colors.fg }, fit ? { flexShrink: 1 } : null]}
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
}: {
  label: string;
  color?: string;
  ring?: string;
}) {
  const { c } = useKit();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: KIT.size.chipGap }}>
      <PulseDot color={color} ring={ring} />
      <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={[KIT_TYPE.live, { color: c.ink }]}>
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
          // A soft glow round the core.
          boxShadow: `0px 0px ${size}px ${ring}, 0px 0px 0px ${KIT.size.dotRing / 2}px ${ring}`,
        }}
      />
    </View>
  );
}
const PULSE_MS = 1800;
const PULSE_FROM = 0.45;
const PULSE_TO = 2.8;

// .sec: a section's heading and its note at the right, on a baseline.
export function Sec({ title, note }: { title: string; note?: string }) {
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
      <T v="sec" accessibilityRole="header">
        {title}
      </T>
      {note ? <T v="fine">{note}</T> : null}
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

// .li: a list row.
export function Li({
  children,
  onPress,
  testID,
  accessibilityLabel,
}: {
  children: ReactNode;
  onPress?: () => void;
  testID?: string;
  accessibilityLabel?: string;
}) {
  const style: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: KIT.size.liGap,
    paddingVertical: KIT.size.liPadY,
    paddingHorizontal: KIT.size.liPadX,
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
          (docs/DECISIONS.md). */}
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
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        boxShadow: KIT.thumbShadow,
        backgroundColor: c.raisedRound,
      }}
    >
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
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius ?? size / 2,
        overflow: 'hidden',
        boxShadow: `${KIT.diskShadow}, 0px 0px 0px ${KIT.size.disk}px ${KIT.diskRing}`,
      }}
    >
      {children}
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
  size?: 'sm' | 'md' | 'row' | 'lg' | 'xl' | 'big';
  // Something else in the ring (a capsule).
  children?: ReactNode;
}) {
  const side = KIT.size.av[size];
  const ring = size === 'xl' || size === 'big' ? KIT.size.avRingXl : KIT.size.avRing;
  const pick = KIT.avColors[colorIndex(name)] ?? KIT.avColors[0];
  useLabOff('golge');
  // The face clips its photo, so its native shadow sits beside it in a box of the same size.
  const shadow = shadowParts(KIT.avShadow, undefined, side / 2);
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
        <PhotoView
          source={{ uri: photoUrl }}
          cachePolicy="disk"
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
  return shadow.node ? (
    <View style={{ width: side, height: side }}>
      {shadow.node}
      {face}
    </View>
  ) : (
    face
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
}: {
  value: V;
  onChange: (v: V) => void;
  options: readonly { value: V; label: string; badge?: number; testID?: string }[];
  accessibilityLabel?: string;
}) {
  const { c } = useKit();
  return (
    <Glass
      style={{
        flexDirection: 'row',
        padding: KIT.size.segPad,
        gap: KIT.size.segGap,
        borderRadius: KIT.size.seg,
      }}
    >
      <View
        accessibilityRole="tablist"
        accessibilityLabel={accessibilityLabel}
        style={{ flex: 1, flexDirection: 'row', gap: KIT.size.segGap }}
      >
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
                height: KIT.size.btnSm,
                borderRadius: KIT.size.btnSm,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: KIT.size.tagGap,
                backgroundColor: on ? c.segOn : undefined,
                boxShadow: on ? c.segShadow || undefined : undefined,
              }}
            >
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={MIN_LABEL_SCALE}
                maxFontSizeMultiplier={MAX_FONT_SCALE}
                style={[KIT_TYPE.btnSm, { color: on ? c.ink : c.muted, flexShrink: 1 }]}
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
