import { describe, expect, it } from 'vitest';

import { useTableEndStore } from '../rooms/tableEnd';
import { accountChange, forgetAccountMemory } from './accountMemory';

describe('an account change', () => {
  it('forgets what was read for the last account on a sign-out or another account', () => {
    expect(accountChange('a', null)).toEqual({ conversations: true, memory: true });
    expect(accountChange('a', 'b')).toEqual({ conversations: true, memory: true });
  });

  it('keeps everything for the same account and on the first look', () => {
    expect(accountChange('a', 'a')).toEqual({ conversations: false, memory: false });
    expect(accountChange(undefined, 'a')).toEqual({ conversations: false, memory: false });
    expect(accountChange(undefined, null)).toEqual({ conversations: true, memory: false });
  });

  it("does not leave the last account's Masa bitti to the next one", () => {
    useTableEndStore.getState().remember('room-1', 'Köşe', 3, ['Elif']);
    useTableEndStore.getState().markLeft('room-1');
    forgetAccountMemory();
    expect(useTableEndStore.getState().tables).toEqual({});
  });
});
