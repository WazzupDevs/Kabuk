// Atölye draft `accessoryCard` (the owner's ask, 23 Kasım): Süsle's options as the tier cards a gift
// pack opens (features/gifts/art.ts → blankCard), one for each of the four tiers, in place of the
// rounds. B the accessory alone drawn in the card's round, C the card as the gift shows it.
export const ACCESSORY_CARD = {
  // The card's width in the strip; its height by the card's own shape (600 × 840).
  width: 96,
  // The accessory alone in the card's round, a share of the round.
  art: 0.92,
  // The chosen card's ring, and how much larger it stands.
  ring: 3,
  lift: 1.06,
} as const;
