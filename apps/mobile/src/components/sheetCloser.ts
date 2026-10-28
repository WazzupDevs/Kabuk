import { create } from 'zustand';

// Every open bottom sheet closes at once: a sheet is its own Android window and hid the 60 second
// request card under it (audit UI-2). The owner's request card asks for it when a request comes in.
export const useSheetCloser = create<{ round: number }>(() => ({ round: 0 }));

export function closeAllSheets(): void {
  useSheetCloser.setState((s) => ({ round: s.round + 1 }));
}
