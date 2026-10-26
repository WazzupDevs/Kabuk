import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  V46_BUTTONS as buttons,
  V46_VENUE as venue,
  V46_VENUE_MOTION as motion,
} from '../../apps/mobile/src/theme/parts.generated.ts';
import { V46_COMPONENTS } from '../../apps/mobile/src/theme/tokens.generated.ts';
import { readInventory } from './inventory.ts';
import { readMeasured } from './measured.ts';
import { SCREEN_PARTS, VENUE_GROUP } from './screenParts.ts';

const root = resolve(import.meta.dirname, '../..');
const inventory = readInventory(root);
const measured = readMeasured(root);
const html = readFileSync(resolve(root, 'docs/design/v46', inventory.meta.source), 'utf8');
const app = (file: string) => readFileSync(resolve(root, 'apps/mobile', file), 'utf8');
const SCHEMES = ['light', 'dark'] as const;
// A rule of v46's CSS, by its selector (the first that has the declaration).
const cssRule = (selector: string) => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = new RegExp(`(?:^|[}\\n])${escaped}\\{([^}]*)\\}`).exec(html);
  if (!m?.[1]) throw new Error(`no rule ${selector}`);
  return m[1];
};

// What scripts/v46/venue.ts takes from the measurement (the module is what `pnpm tokens` writes:
// tokens.test.ts), checked on the values v46's CSS has.
describe('Mekan in parts.generated.ts', () => {
  it("measures Mekan's own parts on its real screen, and the cards and Katıl there too", () => {
    const own = SCREEN_PARTS.filter((p) => p.group === VENUE_GROUP).map((p) => p.id);
    expect(own).toEqual([
      'mekan-basligi',
      'mekan-bolum',
      'mekan-notu',
      'lobi-cipi',
      'masa-durum-noktasi',
      'masa-durum-noktasi-acik',
      'mekan-sabit',
      'lobi-listesi',
    ]);
    for (const id of [
      ...own,
      'kart-masasiz',
      'kart-masam',
      'kart-baglanti',
      'lobi-satiri',
      'katil',
    ]) {
      expect(measured.components[id]?.real, id).toBeTruthy();
    }
  });

  it("draws every card on v46's card (`.va .card`)", () => {
    expect(cssRule('.va .card')).toBe(
      'background:#fff;border:1px solid rgba(20,17,43,.06);border-radius:22px;box-shadow:0 10px 22px rgba(20,17,43,.07)',
    );
    expect(venue.light.card).toEqual({
      bg: '#FFFFFF',
      border: { width: 1, color: 'rgba(20, 17, 43, 0.06)' },
      radius: 22,
      shadow: '0px 10px 22px 0px rgba(20, 17, 43, 0.07)',
    });
  });

  it('puts the glow on the own card where `.mine::before` does', () => {
    expect(cssRule('.va .mine::before')).toMatch(
      /right:-30px;top:-50px;width:130px;height:130px;border-radius:50%/,
    );
    for (const s of SCHEMES) {
      expect(venue[s].glow).toMatchObject({ size: 130, right: -30, top: -50 });
      expect(venue[s].glow.gradient).toMatch(/^radial-gradient\(circle, /);
    }
  });

  it('gives the link card, the rows and the chips their own padding, as v46 measures them', () => {
    expect(venue.light.link.padding).toEqual([10, 12, 10, 10]);
    expect(venue.light.link.disc.size).toBe(46);
    expect(venue.light.link.dot).toEqual({ size: 8, marginRight: -4 });
    expect(venue.light.chip.padding).toEqual([3, 9, 3, 7]);
    expect(venue.light.list.gap).toBe(9);
    expect(venue.light.here.marginTop).toBe(4);
  });

  it("colours the own card's state line as `.note`: both are `var(--muted)`", () => {
    expect(cssRule('.va .mine-head small')).toMatch(/color:var\(--muted\)/);
    expect(cssRule('.va .note')).toMatch(/color:var\(--muted\)/);
    for (const s of SCHEMES) expect(venue[s].mine.status.color).toBe(venue[s].note.color);
  });

  it('colours the dot grey off the lobby and green in it (`.va .dot`, `.dot.open`)', () => {
    expect(venue.light.mine.dot).toEqual({ size: 8, off: '#A9A6B8', on: '#16A34A' });
  });

  it("bobs the own table's icon (`.va .emblem`) and stops it with reduce motion", () => {
    expect(html).toMatch(
      /prefers-reduced-motion:reduce\)\{\.emblem,\.bobbing,\.dot\.open\{animation:none!important\}/,
    );
    expect(motion.bob.iterations).toBeNull();
    expect(motion.bob.offWhenReduced).toBe(true);
    expect(Object.keys(motion.bob.channels).sort()).toEqual(['rotate', 'translateY']);
  });

  it('draws Katıl and Bu masadayım as buttons, green and lavender, 44 high, shrinking to 97 %', () => {
    expect(V46_COMPONENTS.katil.light).toMatchObject({
      bg: '#CDEFD9',
      color: '#0F5C31',
      height: 44,
    });
    expect(V46_COMPONENTS['katil-burada'].light).toMatchObject({ bg: '#EEEBF8', height: 44 });
    expect(buttons.katil.light.pressedScale).toBe(0.97);
    expect(buttons['katil-burada'].light.pressedScale).toBe(0.97);
  });
});

describe("the app's Mekan", () => {
  const screen = app('app/(app)/(tabs)/venue.tsx');
  const card = app('src/features/rooms/TableCard.tsx');
  const lobby = app('src/features/rooms/Lobby.tsx');
  const chat = app('src/features/venueChat/VenueChatCard.tsx');
  const top = app('src/features/rooms/VenueTop.tsx');

  it("is built from v46's parts", () => {
    expect(screen).toMatch(/V46_VENUE\[scheme\]\.pin/);
    expect(top).toMatch(/<VenueTitle /);
    expect(chat).toMatch(/<VenueLinkCard/);
    expect(card).toMatch(/<NoTableCard/);
    expect(card).toMatch(/<MyTableCard/);
    expect(card).toMatch(/look="birincil-48-15"/);
    for (const part of ['LobbyRow', 'LobbyChip', 'SectionHead', 'VenueNote', 'EmptyLobbyCard']) {
      expect(lobby, part).toMatch(new RegExp(`\\b${part}\\b`));
    }
    expect(lobby).toMatch(/look="katil"/);
    expect(lobby).toMatch(/look="katil-burada"/);
  });

  it('keeps the testIDs the E2E flows find', () => {
    for (const id of [
      'table-create-open',
      'go-to-table',
      'table-name',
      'table-state',
      'lobby-open',
      'withdraw-table',
      'invite-open',
      'change-spot',
    ]) {
      expect(card, id).toMatch(new RegExp(`"${id}"`));
    }
    for (const id of [
      'join-\\$\\{table\\.name\\}',
      'here-\\$\\{table\\.name\\}',
      'lobby-row-\\$\\{table\\.name\\}',
    ]) {
      expect(lobby, id).toMatch(new RegExp(id));
    }
    expect(chat).toMatch(/"venue-chat-open"/);
    expect(chat).toMatch(/"venue-chat-live"/);
  });

  it('gives Katıl at a full table the shared disabled look (§4.C, F7), no look of its own', () => {
    expect(lobby).toMatch(/disabled=\{actions\.full \|\| waitingOn !== null\}/);
    expect(app('src/ui/Button.tsx')).not.toMatch(/'katil': 'katil-12'/);
  });
});
