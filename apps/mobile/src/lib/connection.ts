import { create } from 'zustand';

// Whether the app can reach the server (skall tuvali, Haller: "Bağlantı yok"). No network module:
// a request that could not be sent marks it offline, any answer marks it back online; while
// offline the banner checks again now and then (ConnectionBanner).
export const useConnection = create<{ offline: boolean }>(() => ({ offline: false }));

const NETWORK =
  /network request failed|failed to send a request|failed to fetch|fetch failed|network error/i;

export function isNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return error.name === 'FunctionsFetchError' || NETWORK.test(error.message);
}

export function noteFailure(error: unknown): void {
  if (isNetworkError(error) && !useConnection.getState().offline) {
    useConnection.setState({ offline: true });
  }
}

export function noteSuccess(): void {
  if (useConnection.getState().offline) useConnection.setState({ offline: false });
}
