import {
  createContext,
  type ReactNode,
  type RefObject,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { PixelRatio, type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  makeMutable,
  type SharedValue,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated';

import { BtnInkFade } from './BtnInk';
import { useScreenScroll, useScrollPast } from './ScrollScreen';
import { ramp } from './scrollMath';

// Mekan's cards shrinking into their strips (the owner's design and report, 24 Kasım). Once the
// page's switch reaches its pinned place, the pinned stack takes over at the very same spot (the
// page's cards hide, nothing cross-fades between two copies): the switch sticks, and the two cards
// shrink, their foot following the finger one to one, down to their strips under it; each card's
// open face gives way to its strip's on the way. Scrolled back, they grow into the open cards and
// hand back to the page. Only transforms move: an animated height never reached the screen on
// Android, so a card is cut at its foot by two opposite slides (Cut) and given a rounded foot of
// its own.

// The room a card's shadow takes round it (the glass's soft shadow).
const FOOT_SHADOW = 24;

// How much a card has lost of its height, on whole pixels: the frame's cut and its rounded foot
// meet on one pixel line, never overlapping by a part of one (a light line across a dark card).
const PX = PixelRatio.get();
function lostAt(full: number, strip: number, t: number): number {
  'worklet';
  return full > 0 ? Math.round((full - strip) * t * PX) / PX : 0;
}

type Slot = {
  t: SharedValue<number>;
  full: SharedValue<number>;
  // How far everything over this card has moved up.
  shift: SharedValue<number>;
  strip: number;
};
const MorphSlot = createContext<Slot | null>(null);

export function useMorphSlot(): Slot | null {
  return useContext(MorphSlot);
}

type Gap = { open: number; folded: number };

export function PinMorph({
  from,
  cardsOff = false,
  ground,
  strip,
  head,
  gaps,
  cards,
  under,
}: {
  // The scroll at which the page's switch stands where the pinned one does.
  from: number;
  // Only the head shows (another view of the page): the cards stay built, hidden.
  cardsOff?: boolean;
  ground: string;
  // Each card's strip height.
  strip: number;
  head: ReactNode;
  // The gap over each card: open (the page's) and folded (the stack's).
  gaps: readonly [Gap, Gap];
  cards: readonly [ReactNode, ReactNode];
  under?: ReactNode;
}) {
  const scroll = useScreenScroll();
  const fullA = useSharedValue(0);
  const fullB = useSharedValue(0);
  // How far it has folded, 0 to 1: the whole fold is as long as all it loses, so its foot (and the
  // page under it) moves one to one with the finger.
  const t = useDerivedValue(() => {
    const a = fullA.get();
    const b = fullB.get();
    if (a <= 0 || b <= 0) return 0;
    const lose =
      a - strip + (b - strip) + (gaps[0].open - gaps[0].folded) + (gaps[1].open - gaps[1].folded);
    const y = scroll ? scroll.y.get() : 0;
    return ramp(y, from, from + Math.max(1, lose));
  });
  const shiftA = useDerivedValue(() => -(gaps[0].open - gaps[0].folded) * t.get());
  const shiftB = useDerivedValue(() => {
    const lostA = fullA.get() > 0 ? (fullA.get() - strip) * t.get() : 0;
    return shiftA.get() - lostA - (gaps[1].open - gaps[1].folded) * t.get();
  });
  const shown = useAnimatedStyle(() => {
    const y = scroll ? scroll.y.get() : 0;
    return { opacity: y >= from ? 1 : 0 };
  });
  // How far the stack's foot (the last strip's) has come up.
  const lift = useDerivedValue(() => {
    const lostB = fullB.get() > 0 ? (fullB.get() - strip) * t.get() : 0;
    return lostB - shiftB.get();
  });
  const underStyle = useAnimatedStyle(() => ({ transform: [{ translateY: -lift.get() }] }));
  // The page's ground behind the strips, cut at the stack's foot: what scrolls under them never
  // shows through the glass.
  const groundOuter = useAnimatedStyle(() => ({ transform: [{ translateY: -lift.get() }] }));
  const groundInner = useAnimatedStyle(() => ({ transform: [{ translateY: lift.get() }] }));
  // The head (Mekan's switch) is pinned from the top (the owner's call, 25 Kasım: the switch over
  // the venue's name, where Mesajlar has its own); the cards take over from `from`, and only then
  // take touches.
  const live = useScrollPast(from);
  return (
    <View pointerEvents="box-none">
      <View pointerEvents="box-none">
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { overflow: 'hidden' },
            groundOuter,
            shown,
            cardsOff ? OFF : null,
          ]}
        >
          <Animated.View style={[{ flex: 1, backgroundColor: ground }, groundInner]} />
        </Animated.View>
        <View style={{ backgroundColor: ground }}>{head}</View>
        <Animated.View
          style={[shown, cardsOff ? OFF : null]}
          pointerEvents={live ? 'box-none' : 'none'}
          accessibilityElementsHidden={!live}
        >
          <View style={{ height: gaps[0].open }} />
          <MorphSlot.Provider value={{ t, full: fullA, shift: shiftA, strip }}>
            {cards[0]}
          </MorphSlot.Provider>
          <View style={{ height: gaps[1].open }} />
          <MorphSlot.Provider value={{ t, full: fullB, shift: shiftB, strip }}>
            {cards[1]}
          </MorphSlot.Provider>
        </Animated.View>
      </View>
      <Animated.View style={[underStyle, shown, cardsOff ? OFF : null]} pointerEvents="none">
        {under}
      </Animated.View>
    </View>
  );
}

// Shows its children down to `cut` px over the card's shrinking foot: the window slides up as the
// card shrinks and its content slides down as much, so the content stays put and its foot is cut.
function Cut({
  slot,
  cut,
  fill,
  round,
  children,
}: {
  slot: Slot;
  cut: number;
  fill?: boolean;
  // The window's corners: the card's content keeps inside its rounded foot (never square past it).
  round?: number;
  children: ReactNode;
}) {
  const { t, full, strip } = slot;
  const lost = useDerivedValue(() => lostAt(full.get(), strip, t.get()) + cut);
  const outer = useAnimatedStyle(() => ({ transform: [{ translateY: -lost.get() }] }));
  const inner = useAnimatedStyle(() => ({ transform: [{ translateY: lost.get() }] }));
  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        { overflow: 'hidden', borderRadius: round },
        fill ? StyleSheet.absoluteFill : null,
        outer,
      ]}
    >
      <Animated.View pointerEvents="box-none" style={[fill ? { flex: 1 } : null, inner]}>
        {children}
      </Animated.View>
    </Animated.View>
  );
}

// A card inside the morph: its frame cut `radius` over its foot and a rounded foot drawn there,
// its content cut at the foot; its parts fly, shrink and grow (Fly).
export function MorphCard({
  slot,
  open,
  folded,
  radius,
  frame,
}: {
  slot: Slot;
  open: ReactNode;
  folded: ReactNode;
  radius: number;
  // The card's frame (its glass) at a given height (null: filling the card).
  frame: (height: number | null) => ReactNode;
}) {
  const { t, full, shift, strip } = slot;
  const place = useAnimatedStyle(() => ({ transform: [{ translateY: shift.get() }] }));
  const foot = useAnimatedStyle(() => {
    const f = full.get();
    const h = f > 0 ? f - lostAt(f, strip, t.get()) : strip;
    return { transform: [{ translateY: h - radius }], opacity: f > 0 ? 1 : 0 };
  });
  // Its parts fly as the profile's photo and name do (the owner's call, 24 Kasım): see Fly.
  const anchor = useRef<View>(null);
  const width = useSharedValue(0);
  const [pairs] = useState(() => new Map<string, Pair>());
  const [watchers] = useState(() => new Set<() => void>());
  const pair = (id: string): Pair => {
    let p = pairs.get(id);
    if (!p) {
      p = { open: makeMutable<Rect | null>(null), strip: makeMutable<Rect | null>(null) };
      pairs.set(id, p);
    }
    return p;
  };
  const watch = (fn: () => void) => {
    watchers.add(fn);
    return () => {
      watchers.delete(fn);
    };
  };
  const openGone = useAnimatedStyle(() => ({ opacity: t.get() >= 1 ? 0 : 1 }));
  return (
    <Animated.View
      style={place}
      pointerEvents="box-none"
      onLayout={(e) => {
        full.set(Math.round(e.nativeEvent.layout.height));
        watchers.forEach((fn) => fn());
      }}
    >
      <Cut slot={slot} cut={radius} fill>
        {frame(null)}
      </Cut>
      {/* Its window reaches past the card by the shadow's room, so the foot's shadow falls round
          its rounded corners as an open card's does, never cut square. */}
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            left: -FOOT_SHADOW,
            right: -FOOT_SHADOW,
            top: 0,
            height: radius + FOOT_SHADOW,
            overflow: 'hidden',
          },
          foot,
        ]}
      >
        <View style={{ marginTop: -radius, marginHorizontal: FOOT_SHADOW }}>
          {frame(2 * radius)}
        </View>
      </Animated.View>
      <Cut slot={slot} cut={0} round={radius}>
        <View
          ref={anchor}
          collapsable={false}
          pointerEvents="box-none"
          onLayout={(e) => width.set(e.nativeEvent.layout.width)}
        >
          <FlyCtx.Provider value={{ t, full, strip, width, face: 'open', anchor, pair, watch }}>
            <Animated.View style={[{ borderRadius: radius, overflow: 'hidden' }, openGone]}>
              {open}
            </Animated.View>
          </FlyCtx.Provider>
          <FlyCtx.Provider value={{ t, full, strip, width, face: 'strip', anchor, pair, watch }}>
            <View
              pointerEvents="box-none"
              style={{ position: 'absolute', left: 0, right: 0, top: 0, height: strip }}
            >
              {folded}
            </View>
          </FlyCtx.Provider>
        </View>
      </Cut>
    </Animated.View>
  );
}

const OFF = { display: 'none' } as const;

// The page's own cards: hidden once the pinned stack has taken over (no two copies on screen).
export function PinHide({
  from,
  onHeight,
  children,
}: {
  from: number;
  // Its height once laid out (the fold's length).
  onHeight?: (height: number) => void;
  children: ReactNode;
}) {
  const scroll = useScreenScroll();
  const style = useAnimatedStyle(() => {
    const y = scroll ? scroll.y.get() : 0;
    return { opacity: y >= from ? 0 : 1 };
  });
  return (
    <Animated.View
      style={style}
      onLayout={onHeight ? (e) => onHeight(Math.round(e.nativeEvent.layout.height)) : undefined}
    >
      {children}
    </Animated.View>
  );
}

type Rect = { x: number; y: number; w: number; h: number };
type Pair = { open: SharedValue<Rect | null>; strip: SharedValue<Rect | null> };
type FlyContext = {
  t: SharedValue<number>;
  // The card's open height and its strip's (the cut part keeps to the card as it shrinks).
  full: SharedValue<number>;
  strip: number;
  // The card's width (a part flying beside the picture keeps inside it).
  width: SharedValue<number>;
  face: 'open' | 'strip';
  anchor: RefObject<View | null>;
  pair: (id: string) => Pair;
  watch: (fn: () => void) => () => void;
};
const FlyCtx = createContext<FlyContext | null>(null);

// How a part flies: from its top left (text), its centre (a button), or its centre cut to the
// strip part's shape as it goes (a picture into its square).
export type FlyMode = 'start' | 'center' | 'crop';

const noop = () => undefined;
// The open card's parts that do not fly are gone over the fold's first 6 %; the flying words and
// buttons start after it (the owner's report, 25 Kasım: nothing over a fading part, nothing past
// the card).
const GONE = 0.06;
// Where the strip's own picture starts coming over the flying one.
const PICTURE_SWAP = 0.8;
const HUG = { alignSelf: 'flex-start' } as const;

// A part of a card in Mekan's fold, as the profile's photo and name fly into the bar (the owner's
// call, 24 Kasım). The open card's part and the strip's part with the same `id` are one: the open
// one flies and shrinks onto the strip's, which takes over once the card has folded (they lie on
// each other then; nothing fades). A part without its other (no `id`, or none in the other face)
// shrinks away in its place in the open card, or grows in its place in the strip. Outside the fold
// (the page's own card) it is a plain box. `fill`: the box is laid out by `style` (absolute) and
// its content fills it.
export function Fly({
  id,
  mode = 'center',
  fill = false,
  drop = false,
  radius,
  beside,
  style,
  children,
}: {
  id?: string;
  // The cut part it keeps right of as both fly (the table's name and buttons beside its picture,
  // as the strip has them; never across it).
  beside?: string;
  mode?: FlyMode;
  fill?: boolean;
  // A cut part's rounded corners, from the open part's to the strip part's.
  radius?: readonly [number, number];
  // Gone the moment the fold starts (the open card's thin outline: a shrinking frame reads wrong).
  drop?: boolean;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  const ctx = useContext(FlyCtx);
  // Words fly by their own width, not their column's (so they keep beside the picture).
  const box = mode === 'start' ? [HUG, style] : style;
  if (!ctx) return <View style={box}>{children}</View>;
  return (
    <FlyIn
      ctx={ctx}
      id={id}
      mode={mode}
      fill={fill}
      drop={drop}
      radius={radius}
      beside={beside}
      style={box}
    >
      {children}
    </FlyIn>
  );
}

function FlyIn({
  ctx,
  id,
  mode,
  fill,
  drop,
  radius,
  beside,
  style,
  children,
}: {
  ctx: FlyContext;
  id: string | undefined;
  mode: FlyMode;
  fill: boolean;
  drop: boolean;
  radius: readonly [number, number] | undefined;
  beside: string | undefined;
  style: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  const { t, full, strip, width, face, anchor, watch } = ctx;
  const ref = useRef<View>(null);
  const pair = id ? ctx.pair(id) : null;
  const mine = pair ? (face === 'open' ? pair.open : pair.strip) : null;
  const other = pair ? (face === 'open' ? pair.strip : pair.open) : null;
  const next = beside ? ctx.pair(beside) : null;
  const measure = () => {
    const a = anchor.current;
    const b = ref.current;
    if (!a || !b || !mine) return;
    b.measureLayout(a, (x, y, w, h) => mine.set({ x, y, w, h }), noop);
  };
  useEffect(() => watch(measure));
  const open = face === 'open';
  const crop = open && mode === 'crop';
  // A cut part (the table's picture) as it flies: where it is drawn and how it is cut.
  const flight = useDerivedValue(() => {
    const o = mine?.get();
    const s = other?.get();
    if (!crop || !o || !s || s.h <= 0 || o.h <= 0 || o.w <= 0) {
      return { dx: 0, dy: 0, sc: 1, a: 1, b: 1 };
    }
    return cropFlight(o, s, full.get(), strip, t.get());
  });
  const box = useAnimatedStyle(() => {
    const k = t.get();
    const o = open ? mine?.get() : other?.get();
    const s = open ? other?.get() : mine?.get();
    if (drop)
      return {
        opacity: k > 0 ? 0 : 1,
        transform: [{ translateX: 0 }, { translateY: 0 }, { scaleX: 1 }, { scaleY: 1 }],
      };
    if (!o || !s || o.w <= 0 || o.h <= 0) {
      // Only the picture, the title and the buttons fly (the owner's choice, 25 Kasım); every other
      // part fades where it is, never moving or shrinking: the open card's own are gone over the
      // fold's first eighth, the strip's own come over its last eighth, once the flying ones are
      // near their places.
      const g = open ? 1 - ramp(k, 0, GONE) : ramp(k, 0.88, 1);
      return {
        opacity: g,
        transform: [{ translateX: 0 }, { translateY: 0 }, { scaleX: 1 }, { scaleY: 1 }],
      };
    }
    if (!open) {
      // The strip's picture comes over the flying one's last fifth, on the very same box (the two
      // pictures differ: the open card's wide one, the strip's square one; never a jump, 25 Kasım).
      return {
        opacity: crop ? ramp(k, PICTURE_SWAP, 1) : k >= 1 ? 1 : 0,
        transform: [{ translateX: 0 }, { translateY: 0 }, { scaleX: 1 }, { scaleY: 1 }],
      };
    }
    if (crop) {
      const f = flight.get();
      return {
        opacity: 1 - ramp(k, PICTURE_SWAP, 1),
        transform: [{ translateX: f.dx }, { translateY: f.dy }, { scaleX: f.sc }, { scaleY: f.sc }],
      };
    }
    // The words and buttons wait until the parts that fade are gone (never over them, 25 Kasım),
    // then their drawn size goes straight from the open part's to the strip part's.
    const m = ramp(k, GONE, 1);
    const sc = 1 + (s.h / o.h - 1) * m;
    const start = mode === 'start';
    const dx = start ? s.x - o.x : s.x + s.w / 2 - (o.x + o.w / 2);
    const dy = start ? s.y - o.y : s.y + s.h / 2 - (o.y + o.h / 2);
    let x = dx * m;
    const po = next?.open.get();
    const ps = next?.strip.get();
    if (po && ps && po.w > 0 && po.h > 0 && ps.h > 0) {
      const r = cropRect(po, ps, full.get(), strip, k);
      const left = o.x + x + (start ? 0 : (o.w * (1 - sc)) / 2);
      const least = r.x + r.w + (s.x - (ps.x + ps.w));
      // …and inside the card by the strip's own side room (that first when both cannot be).
      const most = width.get() - ps.x - o.w * sc;
      const aim = Math.min(Math.max(left, least), most > 0 ? most : left);
      x += (aim - left) * ramp(k, 0, 0.2);
    }
    return {
      opacity: 1,
      transform: [
        { translateX: x },
        { translateY: dy * m },
        // A button's capsule (its words faded, BtnInk) lands on the strip's whole box; words keep
        // their shape.
        { scaleX: start ? sc : 1 + (s.w / o.w - 1) * m },
        { scaleY: sc },
      ],
    };
  });
  // The cut: a rounded window squeezed about its centre while its content is stretched back as
  // much (only transforms reach the screen; an animated size never did), its corners rounding
  // from the open part's to the strip part's as it flies.
  const [r0, r1] = radius ?? [0, 0];
  // Its corners: from the open part's to the strip part's as it flies (drawn, through its scale).
  // The one style here that is not a transform: measured, it costs little (24 Kasım).
  const corner = useDerivedValue(() => {
    const { sc, a, b } = flight.get();
    return (r0 + (r1 - r0) * t.get()) / Math.max(0.001, sc * Math.min(a, b));
  });
  const clipRound = useAnimatedStyle(() => ({ borderRadius: corner.get() }));
  const clip = useAnimatedStyle(() => {
    const { a, b } = flight.get();
    return { transform: [{ scaleX: a }, { scaleY: b }] };
  });
  const back = useAnimatedStyle(() => {
    const { a, b } = flight.get();
    return { transform: [{ scaleX: 1 / a }, { scaleY: 1 / b }] };
  });
  // A flying button's words and icon are gone with the parts that fade (the owner's call, 25 Kasım).
  const ink = useDerivedValue(() => 1 - ramp(t.get(), 0, GONE));
  const bare = open && !!pair && mode === 'center';
  const filled = fill ? StyleSheet.absoluteFill : null;
  const body = crop ? (
    <Animated.View style={[filled, { overflow: 'hidden' }, clipRound, clip]}>
      <Animated.View style={[filled, back]}>{children}</Animated.View>
    </Animated.View>
  ) : (
    children
  );
  return (
    <View ref={ref} collapsable={false} onLayout={measure} style={style} pointerEvents="box-none">
      <Animated.View
        pointerEvents="box-none"
        style={[filled, mode === 'start' && pair ? { transformOrigin: 'left top' } : null, box]}
      >
        {bare ? <BtnInkFade.Provider value={ink}>{body}</BtnInkFade.Provider> : body}
      </Animated.View>
    </View>
  );
}

// Where a cut part is drawn at `k` of the fold (cropFlight). Worklets are defined in order: a
// worklet sees only the ones written before it.
function cropRect(o: Rect, s: Rect, full: number, strip: number, k: number): Rect {
  'worklet';
  const e = ramp(k, 0, 0.2);
  // Unrounded: the picture's size moves smoothly (a whole-pixel card height shook it).
  const cardH = full > 0 ? full - (full - strip) * k : o.h;
  const h = o.h + (cardH * (s.h / strip) - o.h) * e;
  const room = (cardH - h) / 2;
  const y = o.y + (room - o.y) * e;
  const x = o.x + (room * (s.x / Math.max(1, s.y)) - o.x) * e;
  const aspect = o.w / o.h + (s.w / s.h - o.w / o.h) * e;
  const w = o.w + (h * aspect - o.w) * e;
  return { x, y, w, h };
}

// A cut part's flight (the owner's call, 24 Kasım): once the fold has begun (its first fifth) the
// picture keeps inside the shrinking card at the strip's own proportion, as high as the strip's
// picture is of the strip, centred on the card's height with as much room on its left, its shape
// turning from the open part's to the strip part's square over that fifth; its content covers its box (as the
// strip's picture does), cut round it with rounded corners.
function cropFlight(
  o: Rect,
  s: Rect,
  full: number,
  strip: number,
  k: number,
): { dx: number; dy: number; sc: number; a: number; b: number } {
  'worklet';
  const { x, y, w, h } = cropRect(o, s, full, strip, k);
  const sc = Math.max(w / o.w, h / o.h);
  return {
    dx: x + w / 2 - (o.x + o.w / 2),
    dy: y + h / 2 - (o.y + o.h / 2),
    sc,
    a: w / (sc * o.w),
    b: h / (sc * o.h),
  };
}
