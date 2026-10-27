import { describe, expect, it } from 'vitest';

import { isNetworkError, noteFailure, noteSuccess, useConnection } from './connection';

describe('connection', () => {
  it('tells a request that could not go from an answer', () => {
    expect(isNetworkError(new TypeError('Network request failed'))).toBe(true);
    const fetchError = new Error('Failed to send a request to the Edge Function');
    fetchError.name = 'FunctionsFetchError';
    expect(isNetworkError(fetchError)).toBe(true);
    expect(isNetworkError(new Error('not_found'))).toBe(false);
    expect(isNetworkError('offline')).toBe(false);
  });

  it('goes offline on a network failure and back on any answer', () => {
    noteFailure(new Error('Not found'));
    expect(useConnection.getState().offline).toBe(false);
    noteFailure(new TypeError('Network request failed'));
    expect(useConnection.getState().offline).toBe(true);
    noteSuccess();
    expect(useConnection.getState().offline).toBe(false);
  });
});
