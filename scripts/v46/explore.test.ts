import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  V46_EXPLORE as explore,
  V46_EXPLORE_MOTION as motion,
  V46_VENUE_THUMBS as thumbs,
  type V46Animation,
  type V46Transition,
} from '../../apps/mobile/src/theme/parts.generated.ts';
import { V46_COMPONENTS } from '../../apps/mobile/src/theme/tokens.generated.ts';
import { readInventory } from './inventory.ts';
import { keyframeChannels, parseKeyframes } from './keyframes.ts';
import { parseEase, readMeasured } from './measured.ts';
import { EXPLORE_GROUP, SCREEN_PARTS } from './screenParts.ts';

const root = resolve(import.meta.dirname, '../..');
const inventory = readInventory(root);
const measured = readMeasured(root);
const html = readFileSync(resolve(root, 'docs/design/v46', inventory.meta.source), 'utf8');
const source = (file: string) => readFileSync(resolve(root, 'apps/mobile/src/ui', file), 'utf8');
const SCHEMES = ['light', 'dark'] as const;

const REDUCED = /prefers-reduced-motion:\s*reduce/;
const seconds = (v: string | undefined) =>
  !v ? 0 : Math.round(Number(v.replace(/m?s$/, '')) * (v.endsWith('ms') ? 1 : 1000));
const rule = (selector: string): V46Transition[] => {
  const r = inventory.motion.transitions.find(
    (t) => t.selector === selector && !REDUCED.test(t.media),
  );
  if (!r) throw new Error(`no transition rule ${selector}`);
  return r.parts.map((p) => ({
    prop: p.prop,
    ms: seconds(p.dur),
    delayMs: seconds(p.delay),
    ease: parseEase(p.ease || 'ease'),
  }));
};
const matched = (id: string, kind: string) =>
  new Set(
    (measured.components[id]?.matches ?? []).filter((m) => m.kind === kind).map((m) => m.selector),
  );
const press = (selector: string) =>
  inventory.interaction.press_feedback.find((r) => r.selector === selector)?.effect;

describe("v46's Keşfet parts", () => {
  it('are measured on their real screen', () => {
    const ids = SCREEN_PARTS.filter((p) => p.group === EXPLORE_GROUP).map((p) => p.id);
    expect(ids.length).toBeGreaterThan(0);
    for (const id of ids) expect(measured.components[id]?.real, id).toBeTruthy();
  });

  it('ease the search with `.dsearch` and turn it purple while typing', () => {
    expect(matched('arama', 'transition')).toContain('.dsearch');
    for (const s of SCHEMES) {
      const f = explore[s].search;
      expect(f.transitions).toEqual(rule('.dsearch'));
      expect(f.focus.border.color).toBe('#7B5CFF');
      expect(f.idle.shadow).toBeNull();
      expect(f.focus.shadow).not.toBeNull();
    }
    expect(html).toContain('.dsearch:focus-within{border-color:#7B5CFF');
    const field = source('SearchField.tsx');
    expect(field).toMatch(/transitionStyle\(s\.transitions\)/);
    expect(field).toMatch(/focused \|\| focusedPreview \? s\.focus : s\.idle/);
  });

  it('press a row as `.vrow:active` and `.va button:active` say, easing its ground with `.vrow`', () => {
    expect(matched('mekan-satiri', 'press')).toEqual(
      new Set(['.vrow:active', '.va button:active']),
    );
    expect(explore.light.row.pressed.bg).toBe(press('.vrow:active')?.background);
    expect(explore.dark.row.pressed.bg).toBe(
      press('html[data-theme="dark"] .vrow:active')?.background,
    );
    const scale = Number(
      /scale\(([0-9.]+)\)/.exec(press('.va button:active')?.transform ?? '')?.[1],
    );
    for (const s of SCHEMES) {
      expect(explore[s].row.pressed.scale).toBe(scale);
      expect(explore[s].row.transitions).toEqual(rule('.vrow'));
      expect(explore[s].chips.chip.pressedScale).toBe(scale);
      expect(explore[s].city.button.pressedScale).toBe(scale);
    }
    const row = source('VenueRow.tsx');
    expect(row).toMatch(/transitionStyle\(r\.transitions\)/);
    expect(row).toMatch(/r\.pressed\.bg/);
    expect(row).toMatch(/r\.pressed\.scale/);
    expect(source('FilterChips.tsx')).toMatch(/chip\.pressedScale/);
    expect(source('CityButton.tsx')).toMatch(/b\.pressedScale/);
  });

  it('take a touch past the chips as `.cat::after` does', () => {
    expect(html).toContain(
      '.cat::after{content:"";position:absolute;left:0;right:0;top:-4px;bottom:-4px}',
    );
    for (const s of SCHEMES) {
      expect(explore[s].chips.chip.hitSlop).toEqual({ top: 4, right: 0, bottom: 4, left: 0 });
    }
    expect(source('FilterChips.tsx')).toMatch(/hitSlop=\{chip\.hitSlop\}/);
  });

  it('draw the cards as the inventory draws its cards', () => {
    for (const s of SCHEMES) {
      const c = V46_COMPONENTS['kart-baglanti'][s];
      for (const card of [explore[s].list.card, explore[s].here.card]) {
        expect(card.border).toEqual(c.border);
        expect(card.radius).toBe(c.radius);
        expect(card.shadow).toBe(c.shadow);
      }
    }
  });

  it('keep the soft button of "Şu an buradasın" the inventory\'s yumusak-beyaz', () => {
    expect(V46_COMPONENTS['yumusak-beyaz'].source).toContain('[data-here-go] @ kesfet');
    expect(readFileSync(resolve(root, 'apps/mobile/src/ui/HereCard.tsx'), 'utf8')).toContain(
      'look="yumusak-beyaz"',
    );
  });
});

describe("v46's Keşfet motions", () => {
  const plays = (m: V46Animation, name: string, selector: string, reduced = false) => {
    const kf = inventory.motion.keyframes.find((k) => k.name === name);
    const use = kf?.usages.find(
      (u) => u.selector === selector && REDUCED.test(u.media) === reduced,
    );
    expect(kf && use, name).toBeTruthy();
    const ms = seconds(use?.duration);
    expect(m).toEqual({
      delayMs: seconds(use?.delay),
      ease: parseEase(use?.easing || 'ease'),
      channels: keyframeChannels(parseKeyframes(kf?.keyframes_css ?? ''), ms),
      offWhenReduced: m.offWhenReduced,
      iterations: use?.iterations === 'infinite' ? null : Number(use?.iterations || 1),
      holdsBefore: use?.fill === 'backwards' || use?.fill === 'both',
    });
  };

  it('play each animation with its keyframes, time and easing', () => {
    plays(motion.rowIn, 'rowIn', '.vrow');
    plays(motion.steam, 'steam', '.th-steam');
    plays(motion.livePulse, 'livePulse', '.live');
    plays(motion.liveHalo, 'liveHalo', '.live::after');
    plays(motion.liveFade, 'liveFade', '.live', true);
  });

  it('repeat as often as their rule says, and hold the first keyframe only where it says so', () => {
    for (const m of [motion.steam, motion.livePulse, motion.liveHalo, motion.liveFade]) {
      expect(m.iterations).toBeNull();
    }
    expect(motion.rowIn.iterations).toBe(1);
    expect(motion.rowIn.holdsBefore).toBe(true);
    expect(source('motion.ts')).toMatch(/withRepeat\(run, motion\.iterations \?\? -1,/);
    expect(source('VenueRow.tsx')).toMatch(/const waits = plays && m\.holdsBefore;/);
  });

  it('bring the rows in a step apart, as v46 writes the delays into its list', () => {
    const delays = [...html.matchAll(/class="vrow"[^>]*style="animation-delay:(\d+)ms"/g)]
      .map((m) => Number(m[1]))
      .sort((a, b) => a - b);
    expect(delays.slice(0, 3)).toEqual([0, motion.rowStaggerMs, 2 * motion.rowStaggerMs]);
    const row = source('VenueRow.tsx');
    expect(row).toMatch(/index \* V46_EXPLORE_MOTION\.rowStaggerMs/);
    expect(row).toMatch(/V46_EXPLORE_MOTION\.rowIn/);
  });

  it('stop the rows, the steam and the beat with reduce motion, and fade the dot instead', () => {
    const off = (selector: string) =>
      inventory.motion.reduced_motion.some(
        (r) =>
          r.parts.some((p) => p.name === 'none' || p.name === '?') &&
          r.selector
            .split(',')
            .map((x) => x.trim())
            .includes(selector),
      );
    expect(off('.vrow') && off('.th-steam') && off('.live') && off('.live::after')).toBe(true);
    for (const [name, m] of Object.entries({
      rowIn: motion.rowIn,
      steam: motion.steam,
      livePulse: motion.livePulse,
      liveHalo: motion.liveHalo,
    })) {
      expect(m.offWhenReduced, name).toBe(true);
    }
    expect(motion.liveFade.offWhenReduced).toBe(false);
    const dot = source('LiveDot.tsx');
    expect(dot).toMatch(/if \(reduce\) \{\s*const fade = keyframeLoop\(m\.liveFade, 'opacity'\)/);
    expect(dot).toMatch(/keyframeLoop\(m\.livePulse, 'scale'\)/);
    expect(dot).toMatch(/keyframeLoop\(m\.liveHalo, 'scale'\)/);
    expect(dot).toMatch(/keyframeLoop\(m\.liveHalo, 'opacity'\)/);
    expect(source('VenueThumb.tsx')).toMatch(/!\(reduce && steam\.offWhenReduced\)/);
    expect(source('VenueRow.tsx')).toMatch(/!\(reduce && m\.offWhenReduced\)/);
  });

  it("let the cafe's steam rise, the second bar later, and no other icon", () => {
    expect(thumbs.kafe.steam.map((b) => b.delayMs)).toEqual([0, 600]);
    expect(html).toContain('<rect class="th-steam" style="animation-delay:.6s"');
    for (const kind of ['cay', 'yemek', 'kampus'] as const) expect(thumbs[kind].steam).toEqual([]);
    expect(source('VenueThumb.tsx')).toMatch(/delayMs: bar\.delayMs/);
  });

  it("hold the loops where they rest, as the visual gate draws v46's still page", () => {
    expect(source('LiveDot.tsx')).toMatch(/useLoopActive\(\)/);
    expect(source('VenueThumb.tsx')).toMatch(/useLoopActive\(\)/);
  });
});

describe("the app's Keşfet", () => {
  const screen = readFileSync(
    resolve(root, 'apps/mobile/app/(app)/(tabs)/explore/index.tsx'),
    'utf8',
  );

  it("is built from v46's parts", () => {
    for (const part of [
      'TopBar',
      'ViewModeToggle',
      'SearchField',
      'FilterChips',
      'CityButton',
      'HereCard',
      'VenueRow',
    ]) {
      expect(screen, part).toMatch(new RegExp(`from '@/ui/${part}'`));
    }
    expect(screen).toMatch(/<TopBar\s+kind="explore"/);
  });

  it('leaves the bell to Mesajlar alone, its dot on the tab for unread DMs and waiting requests (K-6)', () => {
    const tab = (file: string) =>
      readFileSync(resolve(root, 'apps/mobile/app/(app)/(tabs)', file), 'utf8');
    for (const file of ['explore/index.tsx', 'activities.tsx', 'profile/index.tsx']) {
      expect(tab(file), file).not.toMatch(/NotificationsBell|BellButton/);
    }
    expect(tab('messages/index.tsx')).toMatch(/<NotificationsBell \/>/);
    const layout = tab('_layout.tsx');
    expect(layout).toMatch(/tabBarBadge: unread \+ requests > 0 \? unread \+ requests : undefined/);
    expect(layout).toMatch(/tabBarAccessibilityLabel: tr\.tabs\.messagesWith\(unread, requests\)/);
  });

  it('names the chips and the switch for a screen reader, as the old ones did', () => {
    expect(screen).toMatch(/accessibilityLabel=\{tr\.explore\.viewSwitch\}/);
    expect(screen).toMatch(/accessibilityLabel=\{tr\.explore\.kindsLabel\}/);
    expect(source('FilterChips.tsx')).toMatch(
      /accessibilityRole="radiogroup"\s*accessibilityLabel=\{accessibilityLabel\}/,
    );
    expect(source('ViewModeToggle.tsx')).toMatch(
      /accessibilityRole="tablist"\s*accessibilityLabel=\{accessibilityLabel\}/,
    );
  });

  it('feels a new view, the list or the map (haptics.ts → selection)', () => {
    expect(screen).toMatch(/onChange=\{\(mode\) => \{\s*haptic\('selection'\);\s*setView\(mode\);/);
  });

  it("names each type in v46's words, under the icon v46 draws for it", () => {
    // v46's list rows: the venue's type in words (`data-vtype`) and its icon, whose ground is the
    // drawing's first rect. The app's word for a type (tr.ts → explore.typeLabel) is the word of
    // the row whose icon is that type's drawing (lib/venueType.ts maps the categories onto them).
    const words = /typeLabel: \{([^}]*)\}/.exec(
      readFileSync(resolve(root, 'apps/mobile/src/i18n/tr.ts'), 'utf8'),
    )?.[1];
    if (!words) throw new Error('no typeLabel in tr.ts');
    const typeLabel = Object.fromEntries(
      [...words.matchAll(/(\w+): '([^']+)'/g)].map(([, key, word]) => [key, word]),
    );
    const rows = [
      ...html.matchAll(
        /class="vrow"[^>]*data-vtype="([^"]+)"[^>]*><span class="vthumb"><svg[^>]*><rect[^>]*fill="(#[0-9A-Fa-f]{6})"/g,
      ),
    ];
    expect(rows.length).toBeGreaterThanOrEqual(3);
    const seen = new Set<string>();
    for (const [, word, ground] of rows) {
      const type = Object.entries(thumbs).find(([, t]) => t.drawing.nodes[0]?.fill === ground)?.[0];
      if (!type) throw new Error(`no icon with v46's ground ${ground} (${word})`);
      seen.add(type);
      expect(typeLabel[type], type).toBe(word);
    }
    // v46's list has a cafe, a tea garden and a place to eat; a campus is in "Şu an buradasın".
    expect([...seen].sort()).toEqual(['cay', 'kafe', 'yemek']);
    expect(typeLabel.kampus).toBe('Kampüs');
  });

  it("takes each venue's icon and type from its category (lib/venueType.ts)", () => {
    // The list row, "Şu an buradasın" and the venue page; the mapping is tested in venueType.test.ts.
    expect(screen).toMatch(/const type = venueType\(v\);/);
    expect(screen).toMatch(/thumb=\{type\}/);
    expect(screen).toMatch(/tr\.explore\.typeLabel\[type\]/);
    expect(screen).toMatch(/type: hereVenue \? venueType\(hereVenue\) : 'kafe'/);
    expect(screen).toMatch(/thumb=\{here\.type\}/);
    expect(
      readFileSync(resolve(root, 'apps/mobile/app/(app)/(tabs)/explore/[venueId].tsx'), 'utf8'),
    ).toMatch(/tr\.explore\.typeLabel\[venueType\(venue\)\]/);
  });

  it('keeps the search 12 below the title, as `.dsearch` does', () => {
    for (const s of SCHEMES) expect(explore[s].search.marginTop).toBe(12);
    expect(html).toContain(
      '.dsearch{display:flex;align-items:center;gap:10px;height:48px;margin-top:12px',
    );
    // The screen keeps it, so the field is its own box (the visual gate crops to it).
    expect(screen).toMatch(/marginTop: V46_EXPLORE\[scheme\]\.search\.marginTop/);
    expect(source('SearchField.tsx')).not.toMatch(/marginTop/);
  });
});
