import { create } from 'zustand';

// The table's last "Bu masadayım" request, kept on this phone while it waits: my_join_requests
// does not say which kind a request is, and the waiting card names the side's leader (canvas:
// Faz 2 · 22.5 → İsteyen: adını söyle). Lost with the app; the plain waiting note shows then.
type JoinAsk = { requestId: string; leader: string };

export const useJoinAsk = create<{ ask: JoinAsk | null; set: (ask: JoinAsk | null) => void }>(
  (set) => ({ ask: null, set: (ask) => set({ ask }) }),
);
