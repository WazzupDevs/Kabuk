// Message reactions (docs/SPEC_V4.md §4.C, the project owner's decision of 26 October, "B"): six
// capsule faces, the same in the DM, the room chat and the venue chat (skall tuvali,
// docs/design/sistem/uretec/veri/emotes.json). The app shows them on a long press; the server
// accepts only these, and takes the six emojis of the app before them as the faces they became
// (the same mapping moved the stored reactions, migration 20261110090000_capsule_reactions.sql).
export const REACTIONS = ['begen', 'ask', 'kahkaha', 'saskin', 'uzgun', 'kizgin'] as const;
export type Reaction = (typeof REACTIONS)[number];

const LEGACY: Readonly<Record<string, Reaction>> = {
  '👍': 'begen',
  '❤️': 'ask',
  '😂': 'kahkaha',
  '😮': 'saskin',
  '🎉': 'ask',
  '🔥': 'ask',
};

export function isReaction(value: unknown): value is Reaction {
  return (REACTIONS as readonly unknown[]).includes(value);
}

// One of the six, or an emoji of the app before them as its face; anything else null.
export function toReaction(value: unknown): Reaction | null {
  if (isReaction(value)) return value;
  return typeof value === 'string' ? (LEGACY[value] ?? null) : null;
}
