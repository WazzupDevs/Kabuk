import { View } from 'react-native';
import Animated from 'react-native-reanimated';

import { useReduceMotion } from '@/lib/useReduceMotion';
import { V46_TAB_BAR } from '@/theme/parts.generated';
import { useTheme } from '@/theme/ThemeProvider';

import { transitionStyle } from './motion';

// An SVG fill as v46 eases it, on the capsule drawn as a View's ground.
const FILL = { fill: 'backgroundColor' } as const;

// The Mekan tab's mark (v46 `svg.vt`, viewBox 86 86 340 340): two capsules side by side, apart
// and in the tab's colour while not selected; selected, they slide together into the mark (the
// group moves, the second capsule moves against the first, both take the brand colours) and their
// overlap (`.vt-x`: the second capsule clipped to the first) fades in after them. Each part eases
// with v46's own transition into the state it goes to (the overlap waits 180 ms going in, and goes
// out at once); with reduce motion nothing eases (`.vt-all,.vt-a,.vt-b,.vt-x{transition:none}`).
// Drawn with Views so the moves ease as v46's CSS does.
export function VenueGlyph({ active, size }: { active: boolean; size: readonly [number, number] }) {
  const { scheme } = useTheme();
  const reduce = useReduceMotion();
  const v = V46_TAB_BAR[scheme].venue;
  const s = active ? v.active : v.inactive;
  const eases = reduce
    ? V46_TAB_BAR.reduced.venue
    : { group: s.group.transitions, a: s.a.transitions, b: s.b.transitions, x: s.x.transitions };
  // Drawing units to dp.
  const k = size[0] / v.viewBox[2];
  const capsule = {
    position: 'absolute',
    left: 0,
    top: 0,
    width: v.capsule.width * k,
    height: v.capsule.height * k,
    borderRadius: v.capsule.rx * k,
  } as const;
  const at = ([x, y]: readonly [number, number]) => [{ translateX: x * k }, { translateY: y * k }];
  return (
    <View style={{ width: size[0], height: size[1], overflow: 'hidden' }}>
      <Animated.View
        style={[
          {
            position: 'absolute',
            left: -v.viewBox[0] * k,
            top: -v.viewBox[1] * k,
            width: (v.viewBox[0] + v.viewBox[2]) * k,
            height: (v.viewBox[1] + v.viewBox[3]) * k,
            transform: at(s.group.at),
          },
          transitionStyle(eases.group),
        ]}
      >
        <Animated.View
          style={[capsule, { backgroundColor: s.a.fill }, transitionStyle(eases.a, FILL)]}
        />
        <Animated.View
          style={[
            capsule,
            { backgroundColor: s.b.fill, transform: at(s.b.at) },
            transitionStyle(eases.b, FILL),
          ]}
        />
        <View style={[capsule, { overflow: 'hidden' }]}>
          <Animated.View
            style={[
              capsule,
              { backgroundColor: s.x.fill, opacity: s.x.opacity, transform: at(s.x.at) },
              transitionStyle(eases.x, FILL),
            ]}
          />
        </View>
      </Animated.View>
    </View>
  );
}
