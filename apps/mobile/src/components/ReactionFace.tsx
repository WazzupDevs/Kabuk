import { isReaction } from '@shared/reactions.ts';
import { SvgXml } from 'react-native-svg';

import { EMOTES } from '@/theme/emotes.generated';
import { SPACING } from '@/theme/tokens';

// The faces' drawing box (uretec/veri/emotes.json: viewBox 60 × 57).
const ASPECT = 57 / 60;
const WIDTH = { chip: SPACING[6], pick: SPACING[9] } as const;

// A reaction's capsule face (skall tuvali: `.react .emo` under a bubble, `.emopick svg` in the
// long-press picker). Anything not one of the six draws nothing.
export function ReactionFace({ emoji, size }: { emoji: string; size: keyof typeof WIDTH }) {
  if (!isReaction(emoji)) return null;
  const width = WIDTH[size];
  return <SvgXml xml={EMOTES[emoji]} width={width} height={width * ASPECT} />;
}
