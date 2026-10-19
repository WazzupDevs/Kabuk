import { describe, expect, it } from 'vitest';

import { IDEMPOTENT_CALLS } from '../functions/_shared/pure/apiRetry.ts';
import { RETIRED_WORKER_BODY, sendsAgain, serveFaultOf, waitUntil } from './refusal.ts';

describe('serveFaultOf', () => {
  it("takes the serve's 500 body as a refusal and an empty 503 as a cut-off answer", () => {
    expect(serveFaultOf(500, RETIRED_WORKER_BODY)).toBe('retired-500');
    expect(serveFaultOf(503, '')).toBe('empty-503');
  });

  it("takes Kong's 503 'name resolution failed' as no runtime: the serve's container is gone", () => {
    // CI, 18 and 19 Oct: account/complete-onboarding answered 503: {"message":"name resolution failed"}
    expect(serveFaultOf(503, '{"message":"name resolution failed"}')).toBe('no-runtime');
    expect(serveFaultOf(503, '{\n  "message":"name resolution failed"\n}\n')).toBe('no-runtime');
    // Another Kong message, the same message with another status, or our own error: not this.
    expect(
      serveFaultOf(503, '{"message":"failure to get a peer from the ring-balancer"}'),
    ).toBeNull();
    expect(serveFaultOf(502, '{"message":"name resolution failed"}')).toBeNull();
    expect(
      serveFaultOf(503, '{"error":{"code":"x","message":"name resolution failed"}}'),
    ).toBeNull();
    expect(serveFaultOf(503, '{"message":"name resolution failed","code":"x"}')).toBeNull();
  });

  it('leaves every other answer to the test, our own 5xx included', () => {
    expect(serveFaultOf(500, '{"error":{"code":"internal","message":"x"}}')).toBeNull();
    expect(serveFaultOf(500, '')).toBeNull();
    expect(serveFaultOf(503, '{"error":{"code":"internal","message":"x"}}')).toBeNull();
    expect(serveFaultOf(503, RETIRED_WORKER_BODY)).toBeNull();
    expect(serveFaultOf(503, 'name resolution failed')).toBeNull();
    expect(serveFaultOf(546, '')).toBeNull();
    expect(serveFaultOf(200, '')).toBeNull();
    expect(serveFaultOf(400, '')).toBeNull();
  });
});

describe('sendsAgain', () => {
  it('sends every refused call again: the function never ran', () => {
    for (const call of ['rooms/respond', 'checkin/check-in', 'tabu/mark', 'dm/send']) {
      expect(sendsAgain('retired-500', call)).toBe(true);
      expect(sendsAgain('no-answer', call)).toBe(true);
      expect(sendsAgain('no-runtime', call)).toBe(true);
    }
  });

  it('sends a cut-off call again only when it answers the same when sent twice', () => {
    for (const call of IDEMPOTENT_CALLS) expect(sendsAgain('empty-503', call)).toBe(true);
    // The function ran: a request accepted, a room opened, a message sent.
    for (const call of ['rooms/respond', 'rooms/create', 'chat/send', 'dm/send']) {
      expect(sendsAgain('empty-503', call)).toBe(false);
    }
  });
});

describe('waitUntil (the serve answering ping again)', () => {
  // A clock that moves only when the wait sleeps.
  const clock = () => {
    let t = 0;
    return {
      now: () => t,
      sleep: (ms: number) => {
        t += ms;
        return Promise.resolve();
      },
    };
  };

  it('stops asking as soon as the answer is yes', async () => {
    const c = clock();
    let asked = 0;
    const answers = () => Promise.resolve(++asked === 4);
    expect(await waitUntil(answers, 60_000, 1_000, c.sleep, c.now)).toBe(true);
    expect(asked).toBe(4);
    expect(c.now()).toBe(3_000);
  });

  it('gives up once the time is up, without sleeping past it', async () => {
    const c = clock();
    let asked = 0;
    const answers = () => {
      asked += 1;
      return Promise.resolve(false);
    };
    expect(await waitUntil(answers, 60_000, 1_000, c.sleep, c.now)).toBe(false);
    expect(asked).toBe(61);
    expect(c.now()).toBe(60_000);
  });
});
