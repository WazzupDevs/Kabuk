import { describe, expect, it } from 'vitest';

import { type RequesterStatus, requesterStatus } from '@shared/rooms.ts';

import { HAPTICS, requesterHaptic } from './hapticMoments';

// What the requester's phone feels over a request's life: its visible status sampled every second
// from sending until well past expires_at, as Lobby derives it (requesterStatus), and the touch on
// each change.
function feltByRequester(view: (t: number) => RequesterStatus): (string | null)[] {
  const sentAt = Date.parse('2026-10-16T20:00:00Z');
  const expiresAt = new Date(sentAt + 60_000).toISOString();
  const felt: (string | null)[] = [];
  let previous: RequesterStatus | null = null;
  for (let s = 0; s <= 90; s++) {
    const now = sentAt + s * 1000;
    const status = requesterStatus(view(now - sentAt), expiresAt, now);
    const moment = requesterHaptic(previous, status);
    if (moment) felt.push(`${s}:${moment}`);
    previous = status;
  }
  return felt;
}

describe('requester haptics (rule 5)', () => {
  // The owner pressed "Geç" 10 s in: whatever the view says from then on, the requester's status
  // only turns `unavailable` at expires_at.
  const declined = (ms: number): RequesterStatus => (ms < 10_000 ? 'pending' : 'unavailable');
  // Nobody answered.
  const timedOut = (): RequesterStatus => 'pending';
  const accepted = (ms: number): RequesterStatus => (ms < 10_000 ? 'pending' : 'accepted');

  it('"Geç" makes no touch', () => {
    expect(feltByRequester(declined)).toEqual([]);
  });

  it('a timeout makes no touch', () => {
    expect(feltByRequester(timedOut)).toEqual([]);
  });

  it('"Geç" and a timeout feel the same, second by second', () => {
    expect(feltByRequester(declined)).toEqual(feltByRequester(timedOut));
  });

  it('an acceptance is felt once, as a success', () => {
    expect(feltByRequester(accepted)).toEqual(['10:requestAccepted']);
    expect(HAPTICS.requestAccepted).toEqual({ kind: 'notification', type: 'success' });
  });

  it('no visible status other than accepted makes a touch', () => {
    const all: (RequesterStatus | null)[] = [null, 'pending', 'unavailable', 'accepted'];
    for (const previous of all) {
      for (const next of [null, 'pending', 'unavailable'] as const) {
        expect(requesterHaptic(previous, next)).toBeNull();
      }
    }
  });
});

describe('haptic table', () => {
  // hareket.md → "Dokunsal geri bildirim".
  it('matches the design system', () => {
    expect(HAPTICS).toEqual({
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
    });
  });
});
