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
  | 'tabuTaboo' // Tabu: the rival's button ("Yasak!" from step 4.3, K-5)
  | 'tabuPass' // Tabu: Pas
  | 'timeUp' // a turn's time ran out
  | 'grabbed' // a grab game: the person's "Kaptım" came first (v43)
  | 'lastSeconds' // a timed turn: one of its last seconds (v43)
  | 'replyThreshold' // a chat: a swiped message passed the point where letting go answers it (v43)
  | 'failed' // an action the person pressed failed, and its error shows (FEEL_ERROR)
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
  grabbed: { kind: 'impact', style: 'medium' },
  lastSeconds: { kind: 'impact', style: 'light' },
  replyThreshold: { kind: 'selection' },
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

// A failed action is felt only when the person pressed it and its error shows on screen: those
// mutations carry this `meta`. Calls the phones send by themselves (advancing a phase whose time
// ran out, starting a turn when its time is up, fetching a target or a card while held) have none,
// so one that drops quietly (the network, an old turn) never makes the phone buzz for nothing.
export const FEEL_ERROR = { feelError: true } as const;

export function failureHaptic(
  meta: Readonly<Record<string, unknown>> | undefined,
): HapticMoment | null {
  return meta?.feelError === true ? 'failed' : null;
}

// How often the phone may answer with a touch (K-30, docs/SPEC_V4.md): the same moment at most
// every 600 ms, any two touches at least 150 ms apart, and none while the person types (no touch on
// a keystroke, nor one that lands between keystrokes).
export const HAPTIC_LIMITS = { sameMomentMs: 600, anyMs: 150, typingMs: 600 } as const;

export type HapticGate = {
  // Whether `moment` may play at `now` (ms). A touch that plays is remembered; a held one is not.
  allow(moment: HapticMoment, now: number): boolean;
  // A keystroke at `now`: touches hold until the person has not typed for `typingMs`.
  typed(now: number): void;
};

export function hapticGate(limits: typeof HAPTIC_LIMITS = HAPTIC_LIMITS): HapticGate {
  const lastOf = new Map<HapticMoment, number>();
  let lastAny = -Infinity;
  let lastKey = -Infinity;
  return {
    allow(moment, now) {
      if (now - lastKey < limits.typingMs) return false;
      if (now - lastAny < limits.anyMs) return false;
      if (now - (lastOf.get(moment) ?? -Infinity) < limits.sameMomentMs) return false;
      lastAny = now;
      lastOf.set(moment, now);
      return true;
    },
    typed(now) {
      lastKey = now;
    },
  };
}
