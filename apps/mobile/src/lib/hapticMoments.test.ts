import { describe, expect, it } from 'vitest';

import { type RequesterStatus, requesterStatus } from '@shared/rooms.ts';

import {
  HAPTIC_LIMITS,
  hapticGate,
  type HapticMoment,
  HAPTICS,
  requesterHaptic,
} from './hapticMoments';

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
      tabChanged: { kind: 'selection' },
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
      accountReady: { kind: 'notification', type: 'success' },
      sent: { kind: 'impact', style: 'light' },
    });
  });
});

// Which of the asked touches play: [ms, moment] in time order through one gate, with keystrokes
// as [ms, 'key'] and a pressed send or save as [ms, 'press'].
function played(events: [number, HapticMoment | 'key' | 'press'][]): string[] {
  const gate = hapticGate();
  const out: string[] = [];
  for (const [at, what] of events) {
    if (what === 'key') gate.typed(at);
    else if (what === 'press') gate.stoppedTyping();
    else if (gate.allow(what, at)) out.push(`${at}:${what}`);
  }
  return out;
}

describe('haptic rate limits (K-30)', () => {
  it("are the design session's numbers", () => {
    expect(HAPTIC_LIMITS).toEqual({ sameMomentMs: 600, anyMs: 150, typingMs: 600 });
  });

  it('plays the same moment at most every 600 ms', () => {
    expect(
      played([
        [0, 'selection'],
        [300, 'selection'],
        [599, 'selection'],
        [600, 'selection'],
        [1100, 'selection'],
        [1200, 'selection'],
      ]),
    ).toEqual(['0:selection', '600:selection', '1200:selection']);
  });

  it('keeps any two touches at least 150 ms apart', () => {
    expect(
      played([
        [0, 'tabuCorrect'],
        [100, 'timeUp'],
        [149, 'failed'],
        [150, 'failed'],
        [250, 'selection'],
        [300, 'selection'],
      ]),
    ).toEqual(['0:tabuCorrect', '150:failed', '300:selection']);
  });

  it('a held touch does not count: the next one is measured from the last that played', () => {
    // 100 is held (150 ms rule), so 700 plays even though 600 ms have not passed since 100.
    expect(
      played([
        [0, 'lastSeconds'],
        [100, 'lastSeconds'],
        [700, 'lastSeconds'],
      ]),
    ).toEqual(['0:lastSeconds', '700:lastSeconds']);
  });

  it("a timed turn's last seconds, one a second, all play", () => {
    expect(
      played([
        [0, 'lastSeconds'],
        [1000, 'lastSeconds'],
        [2000, 'lastSeconds'],
        [3000, 'timeUp'],
      ]),
    ).toEqual(['0:lastSeconds', '1000:lastSeconds', '2000:lastSeconds', '3000:timeUp']);
  });

  it('nothing plays while the person types, and touches come back 600 ms after the last key', () => {
    expect(
      played([
        [0, 'key'],
        [200, 'incomingRequest'],
        [250, 'key'],
        [500, 'key'],
        [900, 'failed'],
        [1100, 'failed'],
      ]),
    ).toEqual(['1100:failed']);
  });

  it('a pressed send or save ends the pause: its failure plays right after the last key', () => {
    expect(
      played([
        [0, 'key'],
        [300, 'key'],
        [350, 'press'],
        [500, 'failed'],
        [600, 'key'],
        [700, 'incomingRequest'],
      ]),
    ).toEqual(['500:failed']);
  });

  // The 0.6.0 phone test: going from tab to tab quickly, every other change was silent (the same
  // moment's 600 ms). Every tab change plays, however close, and while typing too.
  it('plays every tab change, however close to the last touch', () => {
    expect(
      played([
        [0, 'tabChanged'],
        [120, 'tabChanged'],
        [200, 'selection'],
        [260, 'tabChanged'],
        [300, 'key'],
        [400, 'tabChanged'],
      ]),
    ).toEqual(['0:tabChanged', '120:tabChanged', '260:tabChanged', '400:tabChanged']);
  });

  it('a tab change still counts as a touch: the next other one keeps 150 ms from it', () => {
    expect(
      played([
        [0, 'tabChanged'],
        [100, 'requestAccepted'],
        [150, 'requestAccepted'],
      ]),
    ).toEqual(['0:tabChanged', '150:requestAccepted']);
  });

  it('every moment has its own 600 ms window', () => {
    expect(
      played([
        [0, 'grabbed'],
        [200, 'replyThreshold'],
        [400, 'grabbed'],
        [600, 'grabbed'],
        [800, 'replyThreshold'],
      ]),
    ).toEqual(['0:grabbed', '200:replyThreshold', '600:grabbed', '800:replyThreshold']);
  });
});
