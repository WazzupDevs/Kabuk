import { useSyncExternalStore } from 'react';

import { T } from '@/aura/kit';
import { errorMessage } from '@/i18n/errors';
import { KIT } from '@/theme/auraKit';

// The error line of a centred confirmation (lib/overlayStore → confirm): the dialog lies over the
// screen that holds the mutation, so the failed try is written inside it. One holder a dialog.
export type DialogErrorHolder = {
  set: (error: unknown) => void;
  get: () => unknown;
  subscribe: (listener: () => void) => () => void;
};

export function createDialogError(): DialogErrorHolder {
  let error: unknown = null;
  const listeners = new Set<() => void>();
  return {
    set: (next) => {
      error = next;
      listeners.forEach((l) => l());
    },
    get: () => error,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export function DialogErrorLine({ holder }: { holder: DialogErrorHolder }) {
  const error = useSyncExternalStore(holder.subscribe, holder.get);
  if (!error) return null;
  return (
    <T v="fine" color={KIT.danger} center>
      {errorMessage(error)}
    </T>
  );
}
