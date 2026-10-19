import { memo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  type SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, {
  Defs,
  Ellipse,
  LinearGradient,
  Polygon,
  RadialGradient,
  Rect,
  Stop,
  SvgAst,
} from 'react-native-svg';

import {
  blinkMask,
  bodyFrame,
  charFrame,
  confettiFrame,
  INTRO,
  INTRO_BLINK_OPEN,
  INTRO_COLORS,
  INTRO_CONFETTI,
  INTRO_JUMP_MS,
  INTRO_SHAPE,
  type IntroChar,
  type IntroConfetti,
  type IntroLamp,
  type IntroPhone,
  type IntroRing,
  type IntroScene as Scene,
  type IntroTable,
  jumpRoom,
  lampFrame,
  phoneFrame,
  ringFrame,
  shadowFrame,
  tableFrame,
} from '@/theme/introScene';
import { useTheme } from '@/theme/ThemeProvider';

import { figureDrawing } from './figureDrawing';

type Palette = (typeof INTRO_COLORS)['light'];

type Props = {
  scene: Scene;
  // Time since the scene began, in ms (src/theme/introScene.ts → INTRO.endMs is its end).
  t: SharedValue<number>;
  // Reduce motion: a tap does not make a capsule jump.
  still: boolean;
};

// The first screen's scene (v45 §2): drawn from src/theme/introScene.ts on the UI thread, every
// part a function of `t`. Decoration: the caller hides it from screen readers.
export function IntroScene({ scene, t, still }: Props) {
  const { scheme } = useTheme();
  const pal = INTRO_COLORS[scheme];
  // The eyes are part of the drawing: a blink swaps it, so the shut ones live on the JS side.
  const [shut, setShut] = useState(0);
  useAnimatedReaction(
    () => blinkMask(scene.chars, t.value),
    (mask, prev) => {
      if (mask !== prev) runOnJS(setShut)(mask);
    },
    [scene],
  );
  // The confetti is drawn only while it bursts (from INTRO.playAt; gone by the end): before and
  // after, its 18 pieces would be worked out on every frame for nothing.
  const [bursting, setBursting] = useState(false);
  useAnimatedReaction(
    () => t.value >= INTRO.playAt && t.value < INTRO.endMs,
    (on, prev) => {
      if (on !== prev) runOnJS(setBursting)(on);
    },
  );
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {scene.tables.map((tb, i) => (
        <TableShadow key={`sh${i}`} tb={tb} t={t} pal={pal} />
      ))}
      {scene.lamps.map((l, i) => (
        <Lamp key={`l${i}`} l={l} t={t} pal={pal} />
      ))}
      {scene.tables.map((tb, i) => (
        <Table key={`t${i}`} tb={tb} t={t} pal={pal} />
      ))}
      {scene.phones.map((p) => (
        <Phone key={`p${p.seat}`} p={p} t={t} pal={pal} />
      ))}
      {scene.rings.map((r, i) => (
        <Ring key={`r${i}`} rg={r} t={t} pal={pal} />
      ))}
      {scene.chars.map((c, i) => (
        <Capsule
          key={c.look}
          c={c}
          cw={scene.cw}
          ch={scene.ch}
          t={t}
          ink={pal.ink}
          blink={(shut & (1 << i)) !== 0}
          still={still}
        />
      ))}
      {bursting ? scene.confetti.map((p, i) => <Piece key={`c${i}`} p={p} t={t} />) : null}
    </View>
  );
}

const Capsule = memo(function Capsule({
  c,
  cw,
  ch,
  t,
  ink,
  blink,
  still,
}: {
  c: IntroChar;
  cw: number;
  ch: number;
  t: SharedValue<number>;
  ink: string | undefined;
  blink: boolean;
  still: boolean;
}) {
  const jump = useSharedValue(0);
  const place = useAnimatedStyle(() => {
    const f = charFrame(c, t.value);
    return {
      opacity: f.opacity,
      zIndex: f.z,
      transform: [{ translateX: f.x }, { translateY: f.y }, { scale: f.s }],
    };
  });
  const body = useAnimatedStyle(() => {
    const b = bodyFrame(c, t.value, jump.value, jumpRoom(charFrame(c, t.value), ch));
    return { transform: [{ translateY: b.dy * ch }, { scaleY: b.sy }] };
  });
  // A tap makes it jump (v45: obfJump), during the scene and after it: on the press itself, so a
  // scroll that starts on a capsule does not.
  const onPress = () => {
    jump.set(0);
    jump.set(withTiming(1, { duration: INTRO_JUMP_MS, easing: Easing.linear }));
  };
  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: 0,
          top: 0,
          width: cw,
          height: ch,
          transformOrigin: '50% 100%',
        },
        place,
      ]}
    >
      <Pressable accessible={false} disabled={still} onPress={onPress} style={styles.fill}>
        <Animated.View style={[styles.fill, body]}>
          <SvgAst
            ast={figureDrawing(c.look, { open: blink ? INTRO_BLINK_OPEN : 1 }, ink)}
            override={{ width: cw, height: ch }}
          />
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
});

const Table = memo(function Table({
  tb,
  t,
  pal,
}: {
  tb: IntroTable;
  t: SharedValue<number>;
  pal: Palette;
}) {
  const { shape } = useTheme();
  const style = useAnimatedStyle(() => {
    const f = tableFrame(tb, t.value);
    return { opacity: f.opacity, transform: [{ scaleX: f.scaleX }] };
  });
  const tone = tb.far ? pal.far : pal.table;
  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: tb.cx - tb.w / 2,
          top: tb.y,
          width: tb.w,
          height: tb.h,
          zIndex: tb.z,
          borderRadius: shape.radius.pill,
          overflow: 'hidden',
          backgroundColor: tone.body,
        },
        style,
      ]}
    >
      <View style={{ height: tb.h * tone.band, backgroundColor: tone.top }} />
    </Animated.View>
  );
});

const TableShadow = memo(function TableShadow({
  tb,
  t,
  pal,
}: {
  tb: IntroTable;
  t: SharedValue<number>;
  pal: Palette;
}) {
  const style = useAnimatedStyle(() => ({ opacity: shadowFrame(t.value) }));
  const w = tb.w * 0.92;
  const h = tb.h * 0.7;
  return (
    <Animated.View
      style={[
        { position: 'absolute', left: tb.cx - tb.w * 0.46, top: tb.y + h, width: w, height: h },
        { zIndex: 1 },
        style,
      ]}
    >
      <Svg width={w} height={h}>
        <Defs>
          <RadialGradient id="shadow" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0" stopColor={pal.shadow.color} stopOpacity={pal.shadow.opacity} />
            <Stop offset="1" stopColor={pal.shadow.color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Ellipse cx={w / 2} cy={h / 2} rx={w / 2} ry={h / 2} fill="url(#shadow)" />
      </Svg>
    </Animated.View>
  );
});

const Lamp = memo(function Lamp({
  l,
  t,
  pal,
}: {
  l: IntroLamp;
  t: SharedValue<number>;
  pal: Palette;
}) {
  const { shape } = useTheme();
  // The lamp's frame once per frame; its four styles read it.
  const f = useDerivedValue(() => lampFrame(l, t.value));
  const hang = useAnimatedStyle(() => ({
    opacity: f.value.opacity,
    transform: [{ translateY: -(l.cord + l.h) * f.value.drop }],
  }));
  const sway = useAnimatedStyle(() => ({ transform: [{ rotate: `${f.value.rotate}deg` }] }));
  const lit = useAnimatedStyle(() => ({ opacity: f.value.lit }));
  const glow = useAnimatedStyle(() => ({ opacity: f.value.glow }));
  const bulb = l.w * INTRO_SHAPE.bulb;
  const bulbBox = {
    position: 'absolute' as const,
    left: l.w / 2 - bulb / 2,
    top: l.h - bulb / 2,
    width: bulb,
    height: bulb,
    borderRadius: bulb / 2,
  };
  const foot = INTRO_SHAPE.lampFoot;
  return (
    <Animated.View
      style={[{ position: 'absolute', left: l.x, top: l.y, width: l.w, height: l.h }, hang]}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            transformOrigin: ['50%', -l.cord, 0],
            backgroundColor: pal.lamp.shade,
            borderTopLeftRadius: shape.radius.pill,
            borderTopRightRadius: shape.radius.pill,
            borderBottomLeftRadius: foot,
            borderBottomRightRadius: foot,
          },
          sway,
        ]}
      >
        <View style={{ position: 'absolute', left: l.w / 2 - 1, top: -l.cord, opacity: 0.6 }}>
          <Svg width={2} height={l.cord}>
            <Defs>
              <LinearGradient id="cord" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={pal.lamp.shade} stopOpacity={0} />
                <Stop offset="0.6" stopColor={pal.lamp.shade} stopOpacity={1} />
              </LinearGradient>
            </Defs>
            <Rect width={2} height={l.cord} fill="url(#cord)" />
          </Svg>
        </View>
        <Animated.View
          style={[{ position: 'absolute', left: l.w / 2 - l.glowW / 2, top: l.h * 0.6 }, glow]}
        >
          <Svg width={l.glowW} height={l.glowH}>
            <Defs>
              <LinearGradient id="cone" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={pal.lamp.cone} stopOpacity={pal.lamp.coneOpacity} />
                <Stop offset="1" stopColor={pal.lamp.cone} stopOpacity={0} />
              </LinearGradient>
            </Defs>
            <Polygon
              points={`${l.glowW * 0.36},0 ${l.glowW * 0.64},0 ${l.glowW},${l.glowH} 0,${l.glowH}`}
              fill="url(#cone)"
            />
          </Svg>
        </Animated.View>
        <View style={[bulbBox, { backgroundColor: pal.lamp.bulb }]} />
        <Animated.View
          style={[bulbBox, { backgroundColor: pal.lamp.lit, boxShadow: pal.lamp.glow }, lit]}
        />
      </Animated.View>
    </Animated.View>
  );
});

const Phone = memo(function Phone({
  p,
  t,
  pal,
}: {
  p: IntroPhone;
  t: SharedValue<number>;
  pal: Palette;
}) {
  const f = useDerivedValue(() => phoneFrame(p, t.value));
  const style = useAnimatedStyle(() => ({
    opacity: f.value.opacity,
    transform: [{ translateY: f.value.rise * p.h * 0.3 }],
  }));
  const lit = useAnimatedStyle(() => ({ opacity: f.value.lit }));
  const glow = useAnimatedStyle(() => ({ opacity: f.value.glow }));
  // The screen: 3 px in from the sides and the top, 5 px from the bottom (inside the 2 px rim).
  const sw = p.w - 6;
  const sh = p.h - 8;
  const screen = {
    position: 'absolute' as const,
    left: 1,
    top: 1,
    width: sw,
    height: sh,
    borderRadius: sw * INTRO_SHAPE.screenCorner,
  };
  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: p.x,
          top: p.y,
          width: p.w,
          height: p.h,
          zIndex: 9,
          borderRadius: p.w * INTRO_SHAPE.phoneCorner,
          borderWidth: 2,
          borderColor: pal.phone.rim,
          backgroundColor: pal.phone.body,
        },
        style,
      ]}
    >
      <View style={[screen, { backgroundColor: pal.phone.screen }]} />
      <Animated.View
        style={[screen, { backgroundColor: pal.phone.lit[1], boxShadow: pal.phone.glow }, glow]}
      />
      <Animated.View style={[screen, { overflow: 'hidden' }, lit]}>
        <Svg width={sw} height={sh}>
          <Defs>
            <LinearGradient id="lit" x1="0.33" y1="0.03" x2="0.67" y2="0.97">
              <Stop offset="0" stopColor={pal.phone.lit[0]} />
              <Stop offset="1" stopColor={pal.phone.lit[1]} />
            </LinearGradient>
          </Defs>
          <Rect width={sw} height={sh} fill="url(#lit)" />
        </Svg>
      </Animated.View>
    </Animated.View>
  );
});

const Ring = memo(function Ring({
  rg,
  t,
  pal,
}: {
  rg: IntroRing;
  t: SharedValue<number>;
  pal: Palette;
}) {
  const { shape } = useTheme();
  const f = useDerivedValue(() => ringFrame(rg, t.value));
  const style = useAnimatedStyle(() => ({ opacity: f.value.opacity }));
  const glow = useAnimatedStyle(() => ({ opacity: f.value.glow }));
  const pill = { borderRadius: shape.radius.pill, backgroundColor: pal.ring.fill };
  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: rg.x,
          top: rg.y,
          width: rg.w,
          height: INTRO_SHAPE.ring,
          zIndex: rg.z,
          boxShadow: pal.ring.edge,
        },
        pill,
        style,
      ]}
    >
      <Animated.View style={[StyleSheet.absoluteFill, pill, { boxShadow: pal.ring.glow }, glow]} />
    </Animated.View>
  );
});

const Piece = memo(function Piece({ p, t }: { p: IntroConfetti; t: SharedValue<number> }) {
  const style = useAnimatedStyle(() => {
    const f = confettiFrame(p, t.value);
    return {
      opacity: f.opacity,
      transform: [
        { translateX: f.x },
        { translateY: f.y },
        { rotate: `${f.rot}deg` },
        { scale: f.s },
      ],
    };
  });
  const { w, h, r } = INTRO_SHAPE.confetti;
  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: p.x - w / 2,
          top: p.y - h / 2,
          width: w,
          height: h,
          borderRadius: r,
          zIndex: 25,
          backgroundColor: INTRO_CONFETTI[p.color],
        },
        style,
      ]}
    />
  );
});

const styles = StyleSheet.create({ fill: { flex: 1 } });
