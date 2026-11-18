import { ApiError } from '@/lib/api';
import { isNetworkError, useConnection } from '@/lib/connection';

import { tr } from './tr';

// A request that never reached the server, or any failure while the app knows it is offline, says
// so (audit M15-21); a server's answer says its own words.
export function errorMessage(err: unknown): string {
  if (err instanceof ApiError) return tr.errors[err.code];
  if (isOfflineError(err)) return tr.connection.offlineError;
  return tr.common.genericError;
}

// The failure is the connection's (no server's answer): a state says "Bağlantı yok" for it rather
// than its error (EmptyState → `error`; Ortak kurallar C4).
export function isOfflineError(err: unknown): boolean {
  if (err instanceof ApiError) return false;
  return isNetworkError(err) || useConnection.getState().offline;
}
