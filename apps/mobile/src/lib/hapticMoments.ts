import type { RequesterStatus } from '@shared/rooms.ts';

// When the phone answers with a touch (the skall design system → hareket.md → "Dokunsal geri
// bildirim"): a touch confirms an outcome, never every press. Pure, so the table and the rule-5
// cases are tested (hapticMoments.test.ts); src/lib/haptics.ts plays it with expo-haptics.
export type HapticMoment =
  | 'selection' // a choice changed: headcount, spot, filter chip, tab
  | 'tableOpened' // the table opened to the lobby
  | 'requestAccepted' // a join request was accepted
  | 'proposalAccepted' // a game proposal was accepted
  | 'incomingRequest' // a join request came in
  | 'tabuCorrect' // Tabu: Doğru
  | 'tabuTaboo' // Tabu: Tabu
  | 'tabuPass' // Tabu: Pas
  | 'timeUp' // a turn's time ran out
  | 'failed' // an action failed (its error shows)
  | 'friendsMade'; // the end of the table: "Arkadaş oldunuz"

export type HapticCall =
  | { kind: 'selection' }
  | { kind: 'notification'; type: 'success' | 'error' }
  | { kind: 'impact'; style: 'light' | 'medium' | 'rigid' };

export const HAPTICS: Record<HapticMoment, HapticCall> = {
  selection: { kind: 'selection' },
  tableOpened: { kind: 'notification', type: 'success' },
  requestAccepted: { kind: 'notification', type: 'success' },
  proposalAccepted: { kind: 'notification', type: 'success' },
  incomingRequest: { kind: 'impact', style: 'medium' },
  tabuCorrect: { kind: 'impact', style: 'light' },
  tabuTaboo: { kind: 'impact', style: 'rigid' },
  tabuPass: { kind: 'impact', style: 'rigid' },
  timeUp: { kind: 'impact', style: 'rigid' },
  failed: { kind: 'notification', type: 'error' },
  friendsMade: { kind: 'notification', type: 'success' },
};

// The requester's touch when their join request's visible status changes. Only an acceptance is
// felt. A decline ("Geç") and a timeout reach the requester as the same `unavailable` at the same
// moment (requesterStatus, rule 5), and neither makes a touch: a touch on one would tell them apart.
export function requesterHaptic(
  previous: RequesterStatus | null,
  next: RequesterStatus | null,
): HapticMoment | null {
  return next === 'accepted' && previous !== 'accepted' ? 'requestAccepted' : null;
}
