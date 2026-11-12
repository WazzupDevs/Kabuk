import { type ReactNode, useState } from 'react';
import { View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';

import { Glass } from '@/aura/kit';
import type { ExploreFace } from '@/theme/explore';
import { AURA, barBandCss, MOTION } from '@/theme/aura';
import { KIT } from '@/theme/auraKit';
import { gradientStyle } from '@/theme/gradient';
import { useTheme } from '@/theme/ThemeProvider';

import { arriveAt, collapseAt } from './scrollMath';
import { useScreenScroll } from './ScrollScreen';

const v = AURA.venueCollapse;
const FILL = { flex: 1 } as const;

// A card that pins and folds into a strip as the screen scrolls (docs/design/iskelet.md → 5.11:
// Mekan's table card and venue chat). It scrolls with the content until its top reaches its line
// (`at` under the bar's foot, AURA.venueCollapse.pinTop, or under the scrolling body's top if that
// is lower), stays there and folds as the finger goes on, its foot following the finger one to one,
// down to `strip`; under 170 its content gives way to `folded` (collapseAt). All of it on the UI
// thread (4.1). Its place in the content keeps the card's full height, so nothing under it moves.
// `band`: how far under its strip the screen's band reaches once it is folded (the strips pinned
// under it and the band's fade), covering what flows under them. Draw it raised (PinLayer).
export function CollapsingCard({
  at = 0,
  strip,
  folded,
  radius,
  stripRadius,
  face,
  band,
  testID,
  children,
}: {
  at?: number;
  strip: number;
  folded: ReactNode;
  radius: number;
  // Its corners once it has turned into its strip (tuval Mekan: 30 open, 22 folded); the shadow
  // is drawn once for each, never on a frame.
  stripRadius?: number;
  // A board's own face (theme/venue.ts: the table card's white and its one shadow).
  face?: ExploreFace;
  band?: number;
  testID?: string;
  children: ReactNode;
}) {
  const scroll = useScreenScroll();
  const { scheme } = useTheme();
  const [anchor, setAnchor] = useState<View | null>(null);
  const [full, setFull] = useState(0);
  const [line, setLine] = useState(0);
  const [shut, setShut] = useState(false);
  const height = useSharedValue(0);
  const pinAt = useSharedValue(-1);
  const fadePx = MOTION.scroll.stickyFadePx;

  // Where it pins: its top in the content less its line. Read when it is laid out and when the
  // content changes size, never on a frame.
  const measure = () => {
    if (!scroll || !anchor) return;
    anchor.measureInWindow((_x, top) => {
      const viewport = scroll.viewportTop.get();
      const inContent = top - viewport + scroll.y.get();
      const below = Math.max(0, v.pinTop - viewport) + at;
      pinAt.set(Math.max(0, inContent - below));
      setLine(below);
    });
  };
  // The scrolling body's top may be measured after the card is.
  useAnimatedReaction(
    () => scroll?.viewportTop.get() ?? 0,
    (now, before) => {
      if (before !== null && now !== before) runOnJS(measure)();
    },
  );
  useAnimatedReaction(
    () => scroll?.contentHeight.get() ?? 0,
    (now, before) => {
      if (before !== null && now !== before) runOnJS(measure)();
    },
  );
  // Which face takes the touches: told to JS only when it changes.
  useAnimatedReaction(
    () => {
      const y = scroll ? scroll.y.get() : 0;
      return (
        collapseAt(y, pinAt.get(), height.get(), strip, v.stripFrom, v.stripFadePx).strip > 0.5
      );
    },
    (now, before) => {
      if (now !== before) runOnJS(setShut)(now);
    },
  );

  const card = useAnimatedStyle(() => {
    const h = height.get();
    if (h <= 0) return { transform: [{ translateY: 0 }] };
    const y = scroll ? scroll.y.get() : 0;
    const f = collapseAt(y, pinAt.get(), h, strip, v.stripFrom, v.stripFadePx);
    return { height: f.height, transform: [{ translateY: f.lift }] };
  });
  const open = useAnimatedStyle(() => {
    const y = scroll ? scroll.y.get() : 0;
    const f = collapseAt(y, pinAt.get(), height.get(), strip, v.stripFrom, v.stripFadePx);
    return { opacity: 1 - f.strip };
  });
  const closed = useAnimatedStyle(() => {
    const y = scroll ? scroll.y.get() : 0;
    const f = collapseAt(y, pinAt.get(), height.get(), strip, v.stripFrom, v.stripFadePx);
    return { opacity: f.strip };
  });
  // The band comes in over the scroll just after the card is folded (drawn once, 2.2).
  const bandStyle = useAnimatedStyle(() => {
    const pin = pinAt.get();
    const h = height.get();
    if (!scroll || pin < 0 || h <= 0) return { opacity: 0 };
    const foldedAt = pin + h - strip;
    return { opacity: arriveAt(scroll.y.get(), foldedAt, foldedAt + fadePx) };
  });
  const bandHeight = line + strip + (band ?? 0);
  const round = shut && stripRadius !== undefined ? stripRadius : radius;

  return (
    <View
      ref={setAnchor}
      collapsable={false}
      testID={testID}
      onLayout={measure}
      style={full > 0 ? { height: full } : undefined}
    >
      <Animated.View style={card}>
        {band !== undefined ? (
          <Animated.View
            pointerEvents="none"
            style={[
              {
                position: 'absolute',
                left: -KIT.size.side,
                right: -KIT.size.side,
                top: -line,
                height: bandHeight,
              },
              gradientStyle(barBandCss(scheme, bandHeight)),
              bandStyle,
            ]}
          />
        ) : null}
        {/* Before it is measured the card is its content's height; after, the fold's. */}
        <Glass radius={round} face={face} style={full > 0 ? FILL : undefined}>
          <View style={[full > 0 ? FILL : null, { borderRadius: round, overflow: 'hidden' }]}>
            <Animated.View
              style={open}
              pointerEvents={shut ? 'none' : 'auto'}
              importantForAccessibility={shut ? 'no-hide-descendants' : 'auto'}
            >
              <View
                onLayout={(e) => {
                  const h = Math.round(e.nativeEvent.layout.height);
                  if (h === full) return;
                  setFull(h);
                  height.set(h);
                }}
              >
                {children}
              </View>
            </Animated.View>
            <Animated.View
              pointerEvents={shut ? 'auto' : 'none'}
              importantForAccessibility={shut ? 'auto' : 'no-hide-descendants'}
              style={[{ position: 'absolute', left: 0, right: 0, top: 0, height: strip }, closed]}
            >
              {folded}
            </Animated.View>
          </View>
        </Glass>
      </Animated.View>
    </View>
  );
}

// A part of a scrolling screen drawn over the parts after it (Screen: a pinned card's strip over
// what flows under it).
export function PinLayer({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
