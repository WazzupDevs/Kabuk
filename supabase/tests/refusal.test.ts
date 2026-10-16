import { describe, expect, it } from 'vitest';

import { RETIRED_WORKER_BODY, refusalOf } from './refusal.ts';

describe('refusalOf', () => {
  it("takes the serve's 500 body and an empty 503 as a refusal", () => {
    expect(refusalOf(500, RETIRED_WORKER_BODY)).toBe('retired-500');
    expect(refusalOf(503, '')).toBe('empty-503');
  });

  it('leaves every other answer to the test, our own 5xx included', () => {
    expect(refusalOf(500, '{"error":{"code":"internal","message":"x"}}')).toBeNull();
    expect(refusalOf(500, '')).toBeNull();
    expect(refusalOf(503, RETIRED_WORKER_BODY)).toBeNull();
    expect(refusalOf(503, '{"code":"BOOT_ERROR","message":"x"}')).toBeNull();
    expect(refusalOf(546, '')).toBeNull();
    expect(refusalOf(200, '')).toBeNull();
    expect(refusalOf(400, '')).toBeNull();
  });
});
