import { describe, expect, it } from 'vitest';

import { saveNoticeShown } from './saveNotice';

describe('Süsle save failure notice', () => {
  it('is the screen one when Kaydet on the bar failed', () => {
    expect(saveNoticeShown({ failed: true, fromDialog: false })).toBe(true);
  });
  it('is the dialog one alone when "Kaydet ve çık" failed: one notice, not two', () => {
    expect(saveNoticeShown({ failed: true, fromDialog: true })).toBe(false);
  });
  it('is none when nothing failed', () => {
    expect(saveNoticeShown({ failed: false, fromDialog: false })).toBe(false);
    expect(saveNoticeShown({ failed: false, fromDialog: true })).toBe(false);
  });
});
