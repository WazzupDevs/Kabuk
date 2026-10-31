// Optimistic chat sending (MVP_SPEC §7): a message shows at once as "sending", disappears into
// the real list when the server accepts it, and stays as "failed" otherwise. Only failures that
// can succeed on a second try offer "Tekrar dene"; a rejected message (profanity, length, not in
// the room) shows why and can be removed.
import type { ErrorCode } from './errors.ts';

export type OutboxStatus = 'sending' | 'failed';

export type OutboxMessage = {
  localId: string;
  body: string;
  status: OutboxStatus;
  // null: no API error code (network failure, timeout).
  errorCode: ErrorCode | null;
  // The message this one answers (docs/SPEC_V3.md §21.1), sent again on "Tekrar dene".
  replyTo?: string;
  // When it was written (ISO): its time while it is on its way (the DM shows it at once, as
  // Telegram Android does).
  at?: string;
};

export type Outbox = readonly OutboxMessage[];

export type OutboxAction =
  | { type: 'send'; localId: string; body: string; replyTo?: string; at?: string }
  | { type: 'sent'; localId: string }
  | { type: 'failed'; localId: string; errorCode: ErrorCode | null }
  | { type: 'retry'; localId: string }
  | { type: 'remove'; localId: string };

// Errors worth retrying: no answer at all, the rate limit, or a server fault.
const RETRYABLE: readonly (ErrorCode | null)[] = [null, 'rate_limited', 'internal'];

export function canRetry(message: OutboxMessage): boolean {
  return message.status === 'failed' && RETRYABLE.includes(message.errorCode);
}

export function outboxReducer(outbox: Outbox, action: OutboxAction): Outbox {
  switch (action.type) {
    case 'send':
      return [
        ...outbox,
        {
          localId: action.localId,
          body: action.body,
          status: 'sending',
          errorCode: null,
          ...(action.replyTo ? { replyTo: action.replyTo } : {}),
          ...(action.at ? { at: action.at } : {}),
        },
      ];
    case 'sent':
    case 'remove':
      return outbox.filter((m) => m.localId !== action.localId);
    case 'failed':
      return outbox.map((m) =>
        m.localId === action.localId ? { ...m, status: 'failed', errorCode: action.errorCode } : m,
      );
    case 'retry':
      return outbox.map((m) =>
        m.localId === action.localId && canRetry(m)
          ? { ...m, status: 'sending', errorCode: null }
          : m,
      );
  }
}

// One stream of a chat's server messages and the outbox (Grup 3, P5: the venue chat), oldest
// first by time. A message the server took keeps its outbox key (sentIds: localId → messageId), so
// its bubble is not drawn anew; once its copy is in `server`, the outbox entry is left out. Equal
// times keep their order: the server's first, then the outbox in the order written.
export type MergedEntry<M> = { key: string; at: string; m?: M; out?: OutboxMessage };

export function mergeOutbox<M extends { id: string }>(
  server: readonly M[],
  atOf: (m: M) => string,
  outbox: Outbox,
  sentIds: ReadonlyMap<string, string>,
  now: string,
): MergedEntry<M>[] {
  const keyOf = new Map([...sentIds].map(([localId, id]) => [id, localId]));
  const onPage = new Set(server.map((m) => m.id));
  const entries: MergedEntry<M>[] = [
    ...server.map((m) => ({ key: keyOf.get(m.id) ?? m.id, at: atOf(m), m })),
    ...outbox
      .filter((o) => {
        const id = sentIds.get(o.localId);
        return !(id && onPage.has(id));
      })
      .map((o) => ({ key: o.localId, at: o.at ?? now, out: o })),
  ];
  const time = (e: MergedEntry<M>) => {
    const t = Date.parse(e.at);
    return Number.isNaN(t) ? Number.POSITIVE_INFINITY : t;
  };
  // Array.prototype.sort is stable (ES2019): equal times keep the order above.
  return entries
    .map((e, i) => ({ e, i, t: time(e) }))
    .sort((a, b) => (a.t === b.t ? a.i - b.i : a.t < b.t ? -1 : 1))
    .map(({ e }) => e);
}
