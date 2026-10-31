import { describe, expect, it } from 'vitest';

import { type TableScreenInput, tableScreenView } from './tableScreen';

const sitting: TableScreenInput = {
  roomPending: false,
  roomError: false,
  roomFetching: false,
  hasRoom: true,
  closed: false,
  checkInPending: false,
  checkInError: false,
  hasCheckIn: true,
  movedTo: false,
  peopleRead: true,
  seated: true,
  seen: true,
};

describe('the table screen', () => {
  it('shows the table to someone sitting at it', () => {
    expect(tableScreenView(sitting)).toBe('table');
  });

  it('shows an error, not Masa bitti, when the first read of the table failed', () => {
    expect(tableScreenView({ ...sitting, roomError: true, hasRoom: false })).toBe('error');
    expect(tableScreenView({ ...sitting, roomError: true, hasRoom: false, seen: false })).toBe(
      'error',
    );
  });

  it('shows an error, not Masa bitti, when the check-in could not be read', () => {
    expect(tableScreenView({ ...sitting, checkInError: true, hasCheckIn: false })).toBe('error');
  });

  it('keeps the table on screen when a later read fails over what was already read', () => {
    expect(tableScreenView({ ...sitting, roomError: true, checkInError: true })).toBe('table');
  });

  it('shows Masa bitti once the table closed or the person is no longer at it', () => {
    expect(tableScreenView({ ...sitting, closed: true })).toBe('end');
    expect(tableScreenView({ ...sitting, hasRoom: false })).toBe('end');
    expect(tableScreenView({ ...sitting, seated: false })).toBe('end');
    expect(tableScreenView({ ...sitting, hasCheckIn: false })).toBe('end');
  });

  it('sends someone who never sat here to Mekan', () => {
    expect(tableScreenView({ ...sitting, hasRoom: false, seen: false })).toBe('venue');
    expect(tableScreenView({ ...sitting, hasRoom: false, seen: false, roomFetching: true })).toBe(
      'loading',
    );
  });

  it('waits for the first reads', () => {
    expect(tableScreenView({ ...sitting, roomPending: true })).toBe('loading');
    expect(tableScreenView({ ...sitting, checkInPending: true })).toBe('loading');
    expect(tableScreenView({ ...sitting, movedTo: true })).toBe('loading');
  });
});
