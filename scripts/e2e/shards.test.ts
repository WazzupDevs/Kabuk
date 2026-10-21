import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

// CI runs the P0 path in four shards (.github/workflows/e2e.yml); p0.yaml stays the whole path for
// a local run. Each shard signs up and picks the design on its own emulator, so every shard opens
// with p0's setup flows, and the shards together run p0's other flows once, in p0's order.
const maestro = resolve(import.meta.dirname, '../../e2e/maestro');
const flowsOf = (file: string): string[] =>
  [...readFileSync(resolve(maestro, file), 'utf8').matchAll(/^- runFlow: flows\/(\S+)\.yaml$/gm)]
    .map((m) => m[1])
    .filter((f): f is string => f !== undefined);

const SHARDS = [1, 2, 3, 4].map((n) => flowsOf(`shard-${n}.yaml`));
const P0 = flowsOf('p0.yaml');
// Sign-up, the design (Ayarlar → Tasarım (test)), check-in and the table name: the state every
// later flow starts from. 01c-preview only looks at the design previews and needs none of it.
const SETUP = ['01-login', '01b-design', '02-checkin', '03-name'];
// 02 checks in at Kantin; 04 moves this phone to Kütüphane, where every game flow has the bot check
// in. A shard without 04 makes that move right after the setup.
const MOVE = 'spot-kutuphane';
const OWN = SHARDS.map((flows) => flows.filter((f) => !SETUP.includes(f) && f !== MOVE));
const shardOf = (flow: string): number => OWN.findIndex((flows) => flows.includes(flow));

describe('E2E shards', () => {
  it("open with p0's setup flows", () => {
    for (const flows of SHARDS) {
      expect(flows.slice(0, 2)).toEqual(['01-login', '01b-design']);
      expect(flows.filter((f) => SETUP.includes(f))).toEqual(SETUP);
    }
  });

  it("move to the bot's spot after the setup unless 04 does", () => {
    for (const flows of SHARDS) {
      const after = flows[flows.indexOf('03-name') + 1];
      expect(after).toBe(flows.includes('04-table') ? '04-table' : MOVE);
      expect(flows.filter((f) => f === MOVE).length).toBe(flows.includes('04-table') ? 0 : 1);
    }
  });

  it("run p0's other flows once between them, in p0's order", () => {
    const rest = P0.filter((f) => !SETUP.includes(f));
    expect(OWN.flat().sort()).toEqual([...rest].sort());
    for (const flows of SHARDS) {
      const inP0 = flows.filter((f) => f !== MOVE).map((f) => P0.indexOf(f));
      expect(inP0).toEqual([...inP0].sort((a, b) => a - b));
    }
  });

  it('keep the flows that build on each other in one shard', () => {
    // 05 and 05b go on with 04's table, its end and friend; 07 blocks the bot met in 04.
    for (const group of [
      ['04-table', '05-table-end-friend-dm', '05b-dm-ticks-typing'],
      ['04-table', '07-history-block'],
    ]) {
      expect(new Set(group.map(shardOf)).size, group.join(', ')).toBe(1);
    }
  });
});
