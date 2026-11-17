import { create } from 'zustand';

import { code, type Look } from './look';

// The look being tried on, shared by Kapsülünü süsle and Tüm aksesuarlar (yeni arayüz tuvali, 16
// Kasım, docs/decisions/yeni-tuval.md → f): the catalog's "Kapsülüne tak" puts a piece on this
// draft, nothing is written; Kaydet, only in Süsle, writes it (`profile/save-look`). The editor
// owns it: `null` is "no draft yet", the saved look.
type Draft = {
  look: Look | null;
  set: (look: Look) => void;
  clear: () => void;
};

export const useLookDraft = create<Draft>((set) => ({
  look: null,
  set: (look) => set({ look }),
  clear: () => set({ look: null }),
}));

// The draft differs from the saved look (a draft equal to it is no change).
export function draftChanged(draft: Look | null, saved: Look): boolean {
  return draft !== null && code(draft) !== code(saved);
}
