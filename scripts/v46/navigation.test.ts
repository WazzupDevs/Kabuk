import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  V46_BUTTONS,
  V46_TAB_BAR as bar,
  V46_TOP_BARS as heads,
  V46_VIEW_MODE as viewMode,
  type V46Transition,
} from '../../apps/mobile/src/theme/parts.generated.ts';
import { V46_COMPONENTS } from '../../apps/mobile/src/theme/tokens.generated.ts';
import { androidBlur } from '../../apps/mobile/src/ui/backdrop.ts';
import { readInventory } from './inventory.ts';
import { parseEase, readMeasured } from './measured.ts';
import { splitShadow, TAB_BARS, TAB_KEYS } from './navigation.ts';
import { SCREEN } from './screenParts.ts';

const root = resolve(import.meta.dirname, '../..');
const inventory = readInventory(root);
const measured = readMeasured(root);
const html = readFileSync(resolve(root, 'docs/design/v46', inventory.meta.source), 'utf8');
const source = (file: string) => readFileSync(resolve(root, 'apps/mobile/src/ui', file), 'utf8');
const SCHEMES = ['light', 'dark'] as const;

const REDUCED = /prefers-reduced-motion:\s*reduce/;
const seconds = (v: string | undefined) =>
  !v ? 0 : Math.round(Number(v.replace(/m?s$/, '')) * (v.endsWith('ms') ? 1 : 1000));
const rule = (selector: string, reduced = false): V46Transition[] => {
  const r = inventory.motion.transitions.find(
    (t) => t.selector === selector && REDUCED.test(t.media) === reduced,
  );
  if (!r) throw new Error(`no transition rule ${selector}`);
  return r.parts
    .filter((p) => p.prop !== 'none')
    .map((p) => ({
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

describe('v46 tab bar', () => {
  it('is measured with each tab selected, on its real screen or in the inventory', () => {
    for (const k of TAB_KEYS) expect(measured.components[TAB_BARS[k]], k).toBeTruthy();
  });

  it("draws the bar as the inventory's look of it, in both schemes", () => {
    for (const s of SCHEMES) {
      const look = V46_COMPONENTS['alt-sekme-mekan'][s];
      const b = bar[s];
      expect(b.height).toBe(look.height);
      expect(b.radius).toBe(look.radius);
      expect(b.padding).toEqual(look.padding);
      expect(b.border).toEqual(look.border);
      expect(b.gradient).toBe(look.gradient);
      expect(splitShadow(look.shadow ?? '')).toEqual(b.shadow);
    }
  });

  it('is as wide as the screen less its inset, up to the widest v46 draws it', () => {
    const m = measured.components[TAB_BARS.explore];
    const b = bar.light;
    expect(m?.light.self.box[0]).toBe(SCREEN.width - 2 * b.inset);
    expect(m?.narrow?.self.box[0]).toBe(320 - 2 * b.inset);
    expect(b.maxWidth).toBeLessThan(480 - 2 * b.inset);
    // v46's own rule: `width: min(376px, calc(100% - 24px)); bottom: 12px`.
    expect(html).toContain(
      `width:min(${b.maxWidth}px,calc(100% - ${2 * b.inset}px));height:${b.height}px`,
    );
    const top = m?.light.self.at?.[1] ?? 0;
    expect(html).toContain(`bottom:${SCREEN.height - top - b.height}px;width:min(`);
    // Blurred as v46 does; its saturate is not drawn (§4.C).
    expect(m?.light.self.backdrop).toBe('blur(20px) saturate(1.9)');
    expect(b.backdrop).toEqual({ blur: 20 });
  });

  it("blurs as much as v46's `blur(20px)` on any screen", () => {
    // CSS blurs by a deviation in dp; Dimezis by `RenderEffect.createBlurEffect(radius × 4)`, and
    // Android turns a radius into a deviation as Skia does (0.57735 × radius + 0.5).
    for (const ratio of [1.5, 2, 2.625, 2.75, 3, 3.5]) {
      const blur = androidBlur(bar.light.backdrop.blur, ratio);
      expect(blur.intensity).toBe(1);
      const sigma = 0.57735 * ((blur.intensity / blur.reductionFactor) * 4) + 0.5;
      expect(sigma).toBeCloseTo(bar.light.backdrop.blur * ratio, 9);
    }
    expect(source('TabBar.tsx')).toMatch(/androidBlur\(t\.backdrop\.blur, PixelRatio\.get\(\)\)/);
  });

  it('shrinks a pressed tab by the press rule that reaches it', () => {
    const presses = matched(TAB_BARS.venue, 'press');
    expect([...presses]).toEqual(['.va button:active']);
    const t = inventory.interaction.press_feedback.find((r) => r.selector === '.va button:active');
    expect(Number(/^scale\(([0-9.]+)\)$/.exec(t?.effect.transform ?? '')?.[1])).toBe(
      bar.light.tab.pressedScale,
    );
    expect(source('TabBar.tsx')).toMatch(/t\.tab\.pressedScale/);
  });

  it('keeps the edge of the pill not selected, transparent, so the icon does not move', () => {
    for (const s of SCHEMES) {
      expect(bar[s].pill.inactive.border).toEqual({
        width: bar[s].pill.active.border?.width,
        color: 'transparent',
      });
    }
    expect(source('TabBar.tsx')).toMatch(/borderColor: pill\.border\?\.color \?\? 'transparent'/);
  });

  it('eases the pill with `.va .tab .ic`, and with reduce motion too (v46 keeps it)', () => {
    expect(matched(TAB_BARS.venue, 'transition')).toContain('.va .tab .ic');
    for (const s of SCHEMES) expect(bar[s].pill.transitions).toEqual(rule('.va .tab .ic'));
    expect(bar.reduced.pill).toEqual(rule('.va .tab .ic'));
    expect(source('TabBar.tsx')).toMatch(
      /transitionStyle\(reduce \? V46_TAB_BAR\.reduced\.pill : t\.pill\.transitions\)/,
    );
  });

  it("moves the Mekan mark's parts with their own rules, the overlap waiting going in", () => {
    const transitions = matched(TAB_BARS.venue, 'transition');
    for (const sel of ['.vt-all', '.vt-a,.vt-b', '.vt-x']) expect(transitions).toContain(sel);
    // `.vt-x` comes after `.vt-a,.vt-b`: the overlap only fades, it does not slide.
    const fade = rule('.vt-x');
    const delay = /\.is-active \.vt-x\{[^}]*transition-delay:\.(\d+)s/.exec(html);
    expect(delay).not.toBeNull();
    for (const s of SCHEMES) {
      for (const state of ['inactive', 'active'] as const) {
        const v = bar[s].venue[state];
        expect(v.group.transitions).toEqual(rule('.vt-all'));
        expect(v.a.transitions).toEqual(rule('.vt-a,.vt-b'));
        expect(v.b.transitions).toEqual(rule('.vt-a,.vt-b'));
        expect(v.x.transitions).toEqual(
          state === 'active'
            ? fade.map((t) => ({ ...t, delayMs: Number(`0.${delay?.[1]}`) * 1000 }))
            : fade,
        );
      }
    }
    // Reduce motion: `.vt-all,.vt-a,.vt-b,.vt-x{transition:none}`.
    expect(transitions).toContain('.vt-all,.vt-a,.vt-b,.vt-x');
    expect(rule('.vt-all,.vt-a,.vt-b,.vt-x', true)).toEqual([]);
    expect(bar.reduced.venue).toEqual({ group: [], a: [], b: [], x: [] });
    const glyph = source('VenueGlyph.tsx');
    expect(glyph).toMatch(/V46_TAB_BAR\.reduced\.venue/);
    for (const part of ['group', 'a', 'b', 'x']) {
      expect(glyph).toContain(`${part}: s.${part}.transitions`);
      expect(glyph).toMatch(new RegExp(`transitionStyle\\(eases\\.${part}`));
    }
  });

  it("puts the mark where v46's CSS does, selected and not", () => {
    const at = (sel: string) => {
      // The rule whose selector is `sel` itself (not one that ends with it), `0` or px.
      const esc = sel.replace(/\./g, '\\.');
      const m = new RegExp(
        `(?:^|[}\\n])${esc}\\{[^}]*transform:translate\\((\\d+)(?:px)?,(\\d+)(?:px)?\\)`,
      ).exec(html);
      return m ? [Number(m[1]), Number(m[2])] : null;
    };
    for (const s of SCHEMES) {
      const v = bar[s].venue;
      expect(v.inactive.group.at).toEqual(at('.vt-all'));
      expect(v.active.group.at).toEqual(at('.is-active .vt-all'));
      expect(v.inactive.b.at).toEqual(at('.vt-b'));
      expect(v.active.b.at).toEqual(at('.is-active .vt-b'));
      // The overlap is the second capsule: it sits where that one does.
      expect(v.inactive.x.at).toEqual(v.inactive.b.at);
      expect(v.active.x.at).toEqual(v.active.b.at);
      expect([v.inactive.x.opacity, v.active.x.opacity]).toEqual([0, 1]);
    }
  });

  it("gives the tab not selected the colour of its label, and the one selected the ink's", () => {
    for (const s of SCHEMES) {
      const b = bar[s];
      expect(b.icon.inactive).toBe(b.label.inactive.color);
      expect(b.icon.active).toBe(b.label.active.color);
      expect(b.venue.inactive.a.fill).toBe(b.label.inactive.color);
      expect(b.label.active.font.weight).toBeGreaterThan(b.label.inactive.font.weight);
    }
  });

  it("puts the unread dot where the inventory's bildirim-noktasi is", () => {
    for (const s of SCHEMES) {
      const dot = V46_COMPONENTS['bildirim-noktasi'][s];
      expect(bar[s].dot.bg).toBe(dot.bg);
      expect(bar[s].dot.shadow).toBe(dot.shadow);
      expect(bar[s].dot.size).toEqual([dot.height, dot.height]);
    }
  });
});

describe('v46 heads', () => {
  it("hold the screen's own controls: the switch, the bell, back", () => {
    const part = (id: string, label: string) =>
      measured.components[id]?.light.parts.find((p) => p.part === label);
    expect(part('ust-kesfet', 'div.vmode')?.box).toEqual(viewMode.light.size);
    expect(part('ust-mesajlar', 'button.round.nbell')?.box).toEqual([
      V46_COMPONENTS['yuvarlak-simge'].light.height,
      V46_COMPONENTS['yuvarlak-simge'].light.height,
    ]);
    expect(part('ust-alt', 'button.round.back')?.box).toEqual([
      V46_COMPONENTS['yuvarlak-geri'].light.height,
      V46_COMPONENTS['yuvarlak-geri'].light.height,
    ]);
    expect(V46_BUTTONS['yuvarlak-geri']).toBeTruthy();
    const top = source('TopBar.tsx');
    expect(top).toContain('look="yuvarlak-geri"');
  });

  it("are pinned on the screen's ground, with a fade from it below", () => {
    for (const s of SCHEMES) {
      for (const h of [heads[s].explore, heads[s].activities, heads[s].messages, heads[s].sub]) {
        expect(h.fade.height).toBe(16);
        expect(h.title.font).toEqual({ size: 28, weight: 800, lineHeight: 34 });
      }
    }
    // The bell goes to the row's end with its own margin (`margin-left: auto`), the switch by
    // `justify-content: space-between`: both are the row spread.
    expect(heads.light.messages.row?.justify).toBe('space-between');
    expect(heads.light.explore.row?.justify).toBe('space-between');
    expect(heads.light.activities.row).toBeNull();
  });
});

describe('v46 list/map switch', () => {
  it('eases its buttons with `.vmode button` and shrinks them pressed', () => {
    expect(matched('liste-harita', 'transition')).toContain('.vmode button');
    for (const s of SCHEMES) {
      expect(viewMode[s].button.transitions).toEqual(rule('.vmode button'));
      expect(viewMode[s].button.pressedScale).toBe(bar[s].tab.pressedScale);
    }
    expect([...matched('liste-harita', 'press')]).toEqual(['.va button:active']);
    expect(viewMode.light.button.hitSlop).toEqual({ top: 3, right: 0, bottom: 3, left: 0 });
    const toggle = source('ViewModeToggle.tsx');
    expect(toggle).toMatch(/transitionStyle\(m\.button\.transitions\)/);
    expect(toggle).toMatch(/m\.button\.pressedScale/);
    expect(toggle).toMatch(/hitSlop=\{m\.button\.hitSlop\}/);
  });
});
