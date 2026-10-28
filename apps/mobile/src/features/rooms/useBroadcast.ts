import { privateChannel, useChannel } from '@/lib/realtime';

// Every (re)subscribe, to every consumer of the topic: never a broadcast's event name.
const SUBSCRIBED = ' subscribed';

// Listens to a data-free broadcast on a private channel; the handler refetches through RLS.
// Several consumers may listen to different events of the same topic (e.g. session:{id}).
// Realtime never replays what was sent while the channel was down (the background, a network
// drop), so each (re)subscribe runs every handler once as well, like the table's row (audit
// CHAT-3: a DM, a decision or an invite sent meanwhile stayed missing until the next event).
export function useBroadcast(topic: string | null, event: string, onEvent: () => void): void {
  useChannel<string>(
    topic,
    (emit) => ({
      channel: privateChannel(topic ?? '').on(
        'broadcast',
        { event: '*' },
        (msg: { event: string }) => emit(msg.event),
      ),
      onStatus: (status) => {
        if (status === 'SUBSCRIBED') emit(SUBSCRIBED);
      },
    }),
    (received) => {
      if (received === event || received === SUBSCRIBED) onEvent();
    },
  );
}
