import { describe, expect, it } from 'vitest';

import { RETIRED_WORKER_BODY, refusalOf } from './refusal.ts';

describe('refusalOf', () => {
  it("takes only the serve's 500 body as a refusal", () => {
    expect(refusalOf(500, RETIRED_WORKER_BODY)).toBe('retired-500');
  });

  it('leaves every other answer to the test, our own 5xx and the empty 503 included', () => {
    expect(refusalOf(500, '{"error":{"code":"internal","message":"x"}}')).toBeNull();
    expect(refusalOf(500, '')).toBeNull();
    // The function may have run before this one (refusal.ts).
    expect(refusalOf(503, '')).toBeNull();
    expect(refusalOf(503, RETIRED_WORKER_BODY)).toBeNull();
    expect(refusalOf(546, '')).toBeNull();
    expect(refusalOf(200, '')).toBeNull();
    expect(refusalOf(400, '')).toBeNull();
  });
});
