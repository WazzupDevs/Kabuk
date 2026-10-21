import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  V46_BUTTON_MOTION as motions,
  V46_BUTTONS as buttons,
  type V46ButtonId,
  type V46ButtonScheme,
  type V46KeyframeMotion,
  type V46RuleTransition,
  type V46Transition,
} from '../../apps/mobile/src/theme/parts.generated.ts';
import { BUTTONS_GROUP } from './buttons.ts';
import { readInventory } from './inventory.ts';
import { keyframeChannels, parseKeyframes } from './keyframes.ts';
import { parseEase, readMeasured } from './measured.ts';

const root = resolve(import.meta.dirname, '../..');
const inventory = readInventory(root);
const measured = readMeasured(root);
const ids = inventory.components.filter((c) => c.group === BUTTONS_GROUP).map((c) => c.id);

const REDUCED = /prefers-reduced-motion:\s*reduce/;
const seconds = (v: string | undefined) =>
  !v ? 0 : Math.round(Number(v.replace(/m?s$/, '')) * (v.endsWith('ms') ? 1 : 1000));
// The properties React Native has a style for (scripts/v46/buttons.ts → STYLED); a fill of a bar
// is drawn by its own motion (`barFill`, `sendBars`).
const STYLED = ['background-color', 'border-color', 'box-shadow', 'color', 'opacity', 'transform'];

const ruleTransitions = (selector: string, reduced: boolean): V46Transition[] => {
  const rule = inventory.motion.transitions.find(
    (r) => r.selector === selector && REDUCED.test(r.media) === reduced,
  );
  return (rule?.parts ?? []).map((p) => ({
    prop: p.prop,
    ms: seconds(p.dur),
    delayMs: seconds(p.delay),
    ease: parseEase(p.ease || 'ease'),
  }));
};
const real = (list: { prop: string; ms: number; delayMs: number; ease: string }[]) =>
  list.map((t) => ({ ...t, ease: parseEase(t.ease) }));

// Which component draws a look and which generated transitions it reads for each part of v46's
// element (the measurement's part labels: `span` the label, an `svg` the icon or the loader).
const COMPONENT: Partial<Record<V46ButtonId, string>> = {
  'yuvarlak-geri': 'RoundButton.tsx',
  'yuvarlak-simge': 'RoundButton.tsx',
  gonder: 'SendButton.tsx',
};
const componentOf = (id: V46ButtonId) => COMPONENT[id] ?? 'Button.tsx';
const source = (file: string) => readFileSync(resolve(root, 'apps/mobile/src/ui', file), 'utf8');
type Target = { generated: (s: V46ButtonScheme) => V46Transition[] | undefined; reads: RegExp };
const target = (id: V46ButtonId, label: string): Target => {
  if (label === 'self')
    return { generated: (s) => s.transitions, reads: /transitionStyle\(p\.transitions\)/ };
  if (label === 'span') {
    return {
      generated: (s) => s.label?.transitions,
      reads: /transitionStyle\(text\?\.transitions/,
    };
  }
  if (label === 'svg.ld.mini') {
    // The loader is the busy look's (Button.tsx → BUSY), drawn in every look.
    return {
      generated: (s) => s.loader?.transitions,
      reads: /transitionStyle\(busy\.loader\.transitions\)/,
    };
  }
  if (label.startsWith('svg.')) {
    return {
      generated: (s) => s.icon?.transitions,
      reads:
        componentOf(id) === 'Button.tsx'
          ? /transitionStyle\(glyph\.transitions\)/
          : /transitionStyle\(p\.icon\.transitions\)/,
    };
  }
  throw new Error(`${id}: no generated place for ${label}`);
};

// The rules inside a drawing (a bar's fill and turn): v46 eases them in a state the resting
// measurement cannot show, so they are their own motions.
const DRAWN: Record<string, V46RuleTransition> = {
  'rect.bi-a': motions.barFill,
  'rect.sa': motions.sendBars,
  'rect.sb': motions.sendBars,
};

const keyframeMotions = Object.entries(motions).filter(
  (e): e is [string, V46KeyframeMotion] => 'keyframes' in e[1],
);

// Every motion rule of v46's CSS that reaches a button on its real screen (the measurement's
// matches: measure.ts → readMatches) is in parts.generated.ts with v46's values, and the component
// that draws the look reads it.
describe('v46 button motions', () => {
  it('has the real screen of every button measured', () => {
    for (const id of ids) expect(measured.components[id]?.matches, id).toBeTruthy();
  });

  it('eases each part with the transition that wins in v46, and the component reads it', () => {
    for (const id of ids as V46ButtonId[]) {
      const m = measured.components[id];
      const matched = (m?.matches ?? []).filter((x) => x.kind === 'transition');
      for (const label of new Set(matched.map((x) => x.target))) {
        const rules = matched.filter((x) => x.target === label).map((x) => x.selector);
        const drawn = DRAWN[label];
        if (drawn) {
          expect(rules, `${id} ${label}`).toContain(drawn.selector);
          expect(drawn.transitions, drawn.selector).toEqual(ruleTransitions(drawn.selector, false));
          expect(drawn.reduced, drawn.selector).toEqual(ruleTransitions(drawn.selector, true));
          continue;
        }
        const reading =
          label === 'self' ? m?.real?.self : m?.real?.parts.find((p) => p.part === label);
        const computed = real(reading?.transitions ?? []);
        // The rule the browser applied (a later or stronger one overrides: `.va .btn` over
        // `.pact .btn`, `.ld.mini` over `.btn>*`).
        const winner = rules.find((r) => {
          const own = ruleTransitions(r, false);
          return own.length > 0 && JSON.stringify(own) === JSON.stringify(computed);
        });
        expect(winner, `${id} ${label}: ${rules.join(' | ')}`).toBeDefined();
        const place = target(id, label);
        const styled = computed.filter((t) => STYLED.includes(t.prop));
        for (const scheme of ['light', 'dark'] as const) {
          expect(place.generated(buttons[id][scheme]), `${id} ${label} ${scheme}`).toEqual(styled);
        }
        expect(source(componentOf(id)), `${componentOf(id)} reads ${label}`).toMatch(place.reads);
      }
    }
  });

  it('shrinks each pressed button and icon by one of the press rules that reach it', () => {
    for (const id of ids as V46ButtonId[]) {
      const presses = (measured.components[id]?.matches ?? []).filter((x) => x.kind === 'press');
      for (const label of new Set(presses.map((x) => x.target))) {
        const scales = presses
          .filter((x) => x.target === label)
          .map((x) => {
            const rule = inventory.interaction.press_feedback.find(
              (r) => r.selector === x.selector,
            );
            const t = rule?.effect.transform;
            if (t === 'none') return 1;
            const s = t && /^scale\((-?[0-9]*\.?[0-9]+)\)$/.exec(t)?.[1];
            if (!s) throw new Error(`${x.selector}: ${t}`);
            return Number(s);
          });
        const s = buttons[id].light;
        const generated = label === 'self' ? s.pressedScale : s.icon?.pressedScale;
        expect(scales, `${id} ${label}`).toContain(generated);
      }
    }
  });

  it("plays each keyframe animation with v46's time, easing and keyframes, on the looks it reaches", () => {
    for (const [key, motion] of keyframeMotions) {
      const rule = inventory.motion.animation_rules.find(
        (r) => r.selector === motion.selector && !REDUCED.test(r.media),
      );
      const part = rule?.parts.find((p) => p.name === motion.keyframes);
      const frames = inventory.motion.keyframes.find((k) => k.name === motion.keyframes);
      expect(part && frames, key).toBeTruthy();
      const ms = seconds(part?.dur);
      expect(motion, key).toMatchObject({
        ms,
        delayMs: seconds(part?.delay),
        ease: parseEase(part?.ease || 'ease'),
        channels: keyframeChannels(parseKeyframes(frames?.keyframes_css ?? ''), ms),
      });
      // v46 turns it off with reduce motion where a reduce rule names its selector with
      // `animation: none` (the inventory reads `none!important` as `?`).
      const own = motion.selector.split(',').map((s) => s.trim());
      const off = inventory.motion.reduced_motion.some(
        (r) =>
          r.parts.some((p) => p.name === 'none' || p.name === '?') &&
          r.selector.split(',').some((s) => own.includes(s.trim())),
      );
      expect(motion.offWhenReduced, key).toBe(off);
      const reached = ids.filter((id) =>
        measured.components[id]?.matches?.some(
          (x) => x.kind === 'animation' && x.selector === motion.selector,
        ),
      );
      expect(motion.looks, key).toEqual(reached);
      expect(reached.length, key).toBeGreaterThan(0);
    }
  });

  it('has a motion for every animation rule that reaches a button, off where v46 turns it off', () => {
    for (const id of ids) {
      for (const x of measured.components[id]?.matches ?? []) {
        if (x.kind !== 'animation') continue;
        const rules = inventory.motion.animation_rules.filter((r) => r.selector === x.selector);
        if (rules.some((r) => !REDUCED.test(r.media))) {
          expect(
            keyframeMotions.map(([, m]) => m.selector),
            `${id} ${x.selector}`,
          ).toContain(x.selector);
          continue;
        }
        // Only a reduce-motion rule (`animation: none`): every motion it names is off then.
        const named = x.selector.split(',').map((s) => s.trim());
        const off = keyframeMotions.filter(([, m]) =>
          m.selector.split(',').some((s) => named.includes(s.trim())),
        );
        expect(off.length, x.selector).toBeGreaterThan(0);
        for (const [key, m] of off) expect(m.offWhenReduced, key).toBe(true);
      }
    }
    // The shake has no reduce-motion rule in v46: it stays.
    expect(motions.nope.offWhenReduced).toBe(false);
  });

  // A part rests at its own value between plays (CSS returns to it when the animation ends), not at
  // the first keyframe: `vbump` starts at half size and the badge must not rest there.
  it('rests each animated part at its own value', () => {
    for (const [key, motion] of keyframeMotions) {
      for (const [channel, steps] of Object.entries(motion.channels)) {
        const own = channel === 'scale' || channel === 'opacity' ? 1 : 0;
        expect(steps?.steps.at(-1)?.to, `${key} ${channel}`).toBe(own);
      }
    }
    const ui = ['Button.tsx', 'RoundButton.tsx', 'SendButton.tsx', 'glyph.tsx']
      .map(source)
      .join('\n');
    expect(ui).not.toMatch(/useSharedValue\([^)]*\.from\b/);
    expect(ui).toMatch(/useSharedValue\(keyframeRest\(/);
  });

  it('is read by the components', () => {
    const ui = ['Button.tsx', 'RoundButton.tsx', 'SendButton.tsx', 'glyph.tsx', 'BarGlyph.tsx']
      .map(source)
      .join('\n');
    for (const key of Object.keys(motions)) expect(ui, key).toContain(`V46_BUTTON_MOTION.${key}`);
    // Each animation plays only on the looks v46's rule reaches: the component asks `looks`, by
    // name or through a constant it keeps it in. The clapper swings with the bell (one ring).
    const asks = (key: string) => {
      const names = [
        `V46_BUTTON_MOTION.${key}`,
        ...[...ui.matchAll(new RegExp(`const (\\w+) = V46_BUTTON_MOTION\\.${key};`, 'g'))].map(
          (m) => m[1],
        ),
      ];
      return names.some((n) => ui.includes(`${n}.looks.includes(`));
    };
    for (const [key] of keyframeMotions) {
      if (key === 'bellClap') expect(motions.bellClap.looks).toEqual(motions.bellRing.looks);
      else expect(asks(key), key).toBe(true);
    }
  });
});
