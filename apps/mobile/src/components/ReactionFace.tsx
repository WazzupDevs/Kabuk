import { isReaction } from '@shared/reactions.ts';

import { DM } from '@/theme/dm';
import { EMOTES } from '@/theme/emotes.generated';
import { SPACING } from '@/theme/tokens';
import { CachedSvg } from './CachedSvg';

// The faces' drawing box: each in a round (scripts/sistem/emotes.ts, viewBox 48 × 48).
const ASPECT = 1;
// `pill`: a DM's reaction under its bubble (DmSohbet `.rx svg`: 22).
const WIDTH = { chip: SPACING[5], pill: DM.reactions.face, pick: SPACING[9] } as const;

// A reaction's capsule face in its round (in a bubble's reactions, and in the long-press bar). Anything not one of the six draws nothing.
export function ReactionFace({ emoji, size }: { emoji: string; size: keyof typeof WIDTH }) {
  if (!isReaction(emoji)) return null;
  const width = WIDTH[size];
  return <CachedSvg xml={EMOTES[emoji]} width={width} height={width * ASPECT} />;
}
