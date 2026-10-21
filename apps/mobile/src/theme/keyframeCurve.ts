import { cubicBezier } from './markMotion';
import type { V46Bezier, V46Channel, V46ChannelSteps } from './parts.generated';

// One channel of a v46 keyframe animation (parts.generated.ts → V46_EXPLORE_MOTION) as a curve over
// one round, milliseconds → value: from its first keyframe, each step to the next eased with the
// animation's timing function, as CSS plays it. `scale` multiplies lengths (keyframes in a
// drawing's units). Sampled (markMotion.ts → sampleCurve), it drives a loop on the native driver
// (src/ui/nativeLoop.ts). Pure, so the curve is tested.
export function keyframeCurve(
  motion: { ease: V46Bezier; channels: Partial<Record<V46Channel, V46ChannelSteps>> },
  channel: V46Channel,
  scale = 1,
): { period: number; at: (t: number) => number } | undefined {
  const c = motion.channels[channel];
  if (!c || c.steps.length === 0) return undefined;
  const ease = cubicBezier(...motion.ease);
  const length = channel === 'translateX' || channel === 'translateY' ? scale : 1;
  const period = c.steps.reduce((sum, s) => sum + s.ms, 0);
  return {
    period,
    at: (t) => {
      let from = c.from;
      let start = 0;
      for (const s of c.steps) {
        if (t < start + s.ms) {
          const u = Math.max(0, (t - start) / s.ms);
          return (from + (s.to - from) * ease(u)) * length;
        }
        from = s.to;
        start += s.ms;
      }
      return from * length;
    },
  };
}
