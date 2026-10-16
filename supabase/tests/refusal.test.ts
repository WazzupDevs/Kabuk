import { describe, expect, it } from 'vitest';

import { IDEMPOTENT_CALLS } from '../functions/_shared/pure/apiRetry.ts';
import { RETIRED_WORKER_BODY, sendsAgain, serveFaultOf } from './refusal.ts';

describe('serveFaultOf', () => {
  it("takes the serve's 500 body as a refusal and an empty 503 as a cut-off answer", () => {
    expect(serveFaultOf(500, RETIRED_WORKER_BODY)).toBe('retired-500');
    expect(serveFaultOf(503, '')).toBe('empty-503');
  });

  it('leaves every other answer to the test, our own 5xx included', () => {
    expect(serveFaultOf(500, '{"error":{"code":"internal","message":"x"}}')).toBeNull();
    expect(serveFaultOf(500, '')).toBeNull();
    expect(serveFaultOf(503, '{"error":{"code":"internal","message":"x"}}')).toBeNull();
    expect(serveFaultOf(503, RETIRED_WORKER_BODY)).toBeNull();
    expect(serveFaultOf(546, '')).toBeNull();
    expect(serveFaultOf(200, '')).toBeNull();
    expect(serveFaultOf(400, '')).toBeNull();
  });
});

describe('sendsAgain', () => {
  it('sends every refused call again: the function never ran', () => {
    for (const call of ['rooms/respond', 'checkin/check-in', 'tabu/mark']) {
      expect(sendsAgain('retired-500', call)).toBe(true);
      expect(sendsAgain('no-answer', call)).toBe(true);
    }
  });

  it('sends a cut-off call again only when it answers the same when sent twice', () => {
    for (const call of IDEMPOTENT_CALLS) expect(sendsAgain('empty-503', call)).toBe(true);
    // The function ran: a request accepted, a table opened, a message sent.
    for (const call of ['rooms/respond', 'checkin/check-in', 'chat/send', 'dm/send']) {
      expect(sendsAgain('empty-503', call)).toBe(false);
    }
  });
});
