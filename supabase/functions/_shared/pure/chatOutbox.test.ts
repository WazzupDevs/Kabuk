import { describe, expect, it } from 'vitest';

import { toRuns } from './chatRuns.ts';
import {
  canRetry,
  mergeOutbox,
  type Outbox,
  type OutboxMessage,
  outboxReducer,
} from './chatOutbox.ts';
import type { ErrorCode } from './errors.ts';

const sending: Outbox = outboxReducer([], { type: 'send', localId: 'a', body: 'selam' });

describe('outboxReducer', () => {
  it('shows a message as sending at once, in order', () => {
    const two = outboxReducer(sending, { type: 'send', localId: 'b', body: 'naber' });
    expect(two.map((m) => [m.localId, m.status])).toEqual([
      ['a', 'sending'],
      ['b', 'sending'],
    ]);
  });

  it('drops the message once the server accepted it', () => {
    expect(outboxReducer(sending, { type: 'sent', localId: 'a' })).toEqual([]);
  });

  it('keeps a failed message with its error, and retries it', () => {
    const failed = outboxReducer(sending, { type: 'failed', localId: 'a', errorCode: null });
    expect(failed[0]).toMatchObject({ status: 'failed', errorCode: null });
    expect(outboxReducer(failed, { type: 'retry', localId: 'a' })[0]).toMatchObject({
      status: 'sending',
      body: 'selam',
    });
  });

  it('keeps the answered message through a failure and a retry', () => {
    const reply = outboxReducer([], { type: 'send', localId: 'r', body: 'olur', replyTo: 'm1' });
    const failed = outboxReducer(reply, { type: 'failed', localId: 'r', errorCode: null });
    expect(outboxReducer(failed, { type: 'retry', localId: 'r' })[0]).toMatchObject({
      replyTo: 'm1',
      status: 'sending',
    });
    expect(sending[0]).not.toHaveProperty('replyTo');
  });

  it('removes a message on request', () => {
    expect(outboxReducer(sending, { type: 'remove', localId: 'a' })).toEqual([]);
  });
});

describe('canRetry', () => {
  const failedWith = (errorCode: ErrorCode | null): OutboxMessage => {
    const [message] = outboxReducer(sending, { type: 'failed', localId: 'a', errorCode });
    if (!message) throw new Error('no message');
    return message;
  };

  it('offers a retry for network failures, the rate limit and server faults', () => {
    for (const code of [null, 'rate_limited', 'internal'] as const) {
      const message = failedWith(code);
      expect(canRetry(message), String(code)).toBe(true);
    }
  });

  it('does not offer a retry for rejected messages', () => {
    for (const code of ['profanity_rejected', 'message_invalid', 'not_in_room'] as const) {
      const message = failedWith(code);
      expect(canRetry(message), code).toBe(false);
      const retried = outboxReducer([message], { type: 'retry', localId: 'a' });
      expect(retried[0]?.status).toBe('failed');
    }
  });

  it('never retries a message that is still sending', () => {
    const [message] = sending;
    expect(message && canRetry(message)).toBe(false);
  });
});

// Grup 3, P5: the venue chat's server messages and outbox in one stream, oldest first.
describe('mergeOutbox', () => {
  type M = { id: string; at: string; mine: boolean };
  const msg = (id: string, at: string, mine = false): M => ({ id, at, mine });
  const out = (localId: string, at: string): OutboxMessage => ({
    localId,
    body: localId,
    status: 'sending',
    errorCode: null,
    at,
  });
  const NOW = '2026-10-31T12:00:00.000Z';
  const merge = (server: M[], outbox: Outbox, sent: [string, string][] = []) =>
    mergeOutbox(server, (m) => m.at, outbox, new Map(sent), NOW);
  const keys = (server: M[], outbox: Outbox, sent: [string, string][] = []) =>
    merge(server, outbox, sent).map((e) => e.key);

  it('puts a message from someone else that came while two of mine wait in its place', () => {
    const server = [msg('s1', '2026-10-31T10:00:00Z'), msg('s2', '2026-10-31T10:02:00Z')];
    const outbox = [out('o1', '2026-10-31T10:01:00Z'), out('o2', '2026-10-31T10:03:00Z')];
    expect(keys(server, outbox)).toEqual(['s1', 'o1', 's2', 'o2']);
  });

  it('keeps the order of equal times: the server first, then the outbox as written', () => {
    const at = '2026-10-31T10:00:00Z';
    expect(keys([msg('s1', at), msg('s2', at)], [out('o1', at), out('o2', at)])).toEqual([
      's1',
      's2',
      'o1',
      'o2',
    ]);
  });

  it('gives the sent message its outbox key and leaves the outbox entry out', () => {
    const server = [msg('s1', '2026-10-31T10:00:00Z'), msg('m1', '2026-10-31T10:01:01Z', true)];
    const outbox = [out('o1', '2026-10-31T10:01:00Z'), out('o2', '2026-10-31T10:02:00Z')];
    const merged = merge(server, outbox, [['o1', 'm1']]);
    expect(merged.map((e) => e.key)).toEqual(['s1', 'o1', 'o2']);
    expect(merged[1]?.m?.id).toBe('m1');
    expect(merged[1]?.out).toBeUndefined();
  });

  it('keeps a sent message waiting until its copy is on the page', () => {
    const outbox = [out('o1', '2026-10-31T10:01:00Z')];
    const merged = merge([msg('s1', '2026-10-31T10:00:00Z')], outbox, [['o1', 'm1']]);
    expect(merged.map((e) => [e.key, !!e.out])).toEqual([
      ['s1', false],
      ['o1', true],
    ]);
  });

  it('moves a sent message to its server time when another came in between', () => {
    // Written at 10:01 on the phone; the server wrote it after a message of 10:01:30.
    const server = [msg('s2', '2026-10-31T10:01:30Z'), msg('m1', '2026-10-31T10:01:40Z', true)];
    const outbox = [out('o1', '2026-10-31T10:01:00Z')];
    expect(keys(server.slice(0, 1), outbox)).toEqual(['o1', 's2']);
    expect(keys(server, outbox, [['o1', 'm1']])).toEqual(['s2', 'o1']);
  });

  it('dates a waiting message without a time now', () => {
    const outbox: Outbox = [{ localId: 'o1', body: 'x', status: 'sending', errorCode: null }];
    expect(merge([msg('s1', '2026-10-31T13:00:00Z')], outbox).map((e) => e.key)).toEqual([
      'o1',
      's1',
    ]);
  });

  it('gives day lines and runs the right way round', () => {
    const server = [msg('s1', '2026-10-29T12:00:00Z'), msg('s2', '2026-10-31T10:00:30Z')];
    const outbox = [
      out('o1', '2026-10-31T10:00:00Z'),
      out('o2', '2026-10-31T10:01:00Z'),
      out('o3', '2026-10-31T10:01:20Z'),
    ];
    const merged = merge(server, outbox);
    const runs = toRuns(
      merged,
      (e) => (e.out || e.m?.mine ? 'me' : 'them'),
      (e) => e.at,
    );
    expect(runs.map((r) => [r.item.key, r.first, r.last])).toEqual([
      ['s1', true, true],
      ['o1', true, true],
      ['s2', true, true],
      ['o2', true, false],
      ['o3', false, true],
    ]);
    // The first message and the first of a new day carry a day line (two days apart in any zone).
    expect(runs.filter((r) => r.day).map((r) => r.item.key)).toEqual(['s1', 'o1']);
  });
});

describe('canRetry, the venue chat (Grup 3, P5)', () => {
  it('offers only Sil when the identity changed', () => {
    const m: OutboxMessage = {
      localId: 'a',
      body: 'x',
      status: 'failed',
      errorCode: 'identity_mismatch',
    };
    expect(canRetry(m)).toBe(false);
    expect(canRetry({ ...m, errorCode: 'client_id_reused' })).toBe(false);
  });
});
