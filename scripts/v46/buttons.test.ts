import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { V46_BUTTONS as buttons } from '../../apps/mobile/src/theme/parts.generated.ts';
import { BUTTONS_GROUP } from './buttons.ts';
import { readInventory } from './inventory.ts';

const root = resolve(import.meta.dirname, '../..');
const inventory = readInventory(root);

const drawing = (icon: (typeof buttons)['gonder']['light']['icon']) => {
  if (!icon || !('drawing' in icon)) throw new Error('no drawing');
  return icon.drawing;
};
const fills = (icon: (typeof buttons)['gonder']['light']['icon']) => {
  if (!icon || !('fills' in icon)) throw new Error('no bar icon');
  return icon.fills;
};

// What scripts/v46/buttons.ts takes from the measurement for each of v46's buttons (the module is
// what `pnpm tokens` writes: tokens.test.ts), checked on the values v46 has.
describe('v46 buttons in parts.generated.ts', () => {
  it('has every button of the gallery group, and nothing else', () => {
    expect(Object.keys(buttons)).toEqual(
      inventory.components.filter((c) => c.group === BUTTONS_GROUP).map((c) => c.id),
    );
  });

  // `.va button:active { transform: scale(.97) }` outranks `.send:active` (.94) and
  // `.ntf-chip:active` (.96): every button shrinks to 97 %.
  // Except the profile editor's disabled Kaydet: `.ebar .btn[aria-disabled="true"]:active { transform: none }`.
  it('shrinks every button to 97 % while pressed, the bell icon to 92 % inside it', () => {
    for (const [id, b] of Object.entries(buttons)) {
      expect(b.light.pressedScale, id).toBe(id === 'birincil-48-pasif' ? 1 : 0.97);
    }
    expect(buttons['yuvarlak-simge'].light.icon?.pressedScale).toBe(0.92);
  });

  it('eases the press only where v46 does (`.ntf-chip`, `.send`); `.btn` shrinks at once', () => {
    const transform = (id: keyof typeof buttons) =>
      buttons[id].light.transitions.find((t) => t.prop === 'transform');
    expect(transform('birincil-52')).toBeUndefined();
    expect(transform('birincil-36')).toMatchObject({ ms: 120, ease: [0.25, 0.1, 0.25, 1] });
    expect(transform('gonder')).toMatchObject({ ms: 150 });
  });

  // `@media (max-width: 350px) { .va .btn { gap: 5px; padding: 0 6px } .va .btn .ico { display: none } }`
  it("takes v46's narrow rules: a smaller gap and padding, the stroke icon hidden", () => {
    expect(buttons['birincil-52'].narrow).toMatchObject({ gap: 5, padding: [0, 6, 0, 6] });
    expect(buttons['kenarli-44'].narrow).toMatchObject({ gap: 5, iconShown: false });
    expect(buttons['birincil-48-15'].narrow?.iconShown).toBe(true);
  });

  it('fades the busy label out and lifts it, with the loader in its own colours', () => {
    const busy = buttons['birincil-52-yukleniyor'];
    expect(busy.light.label).toMatchObject({ opacity: 0, translateY: -5 });
    expect(busy.light.loader).toMatchObject({
      size: [26, 26],
      fills: { a: '#FFFFFF', b: '#FF4F8B', overlap: '#FFB547' },
    });
    expect(busy.dark.loader?.fills.a).toBe('#1C1838');
    expect(busy.light.loader?.transitions).toEqual([
      { prop: 'opacity', ms: 160, delayMs: 60, ease: [0.2, 0.8, 0.2, 1] },
    ]);
  });

  it("draws bar icons from their fills and the rest from v46's drawing", () => {
    expect(buttons['birincil-48-15'].light.icon).toMatchObject({
      bar: 'plus',
      fills: { a: '#FFFFFF', b: '#FFFFFF', x: '#E8E3FF' },
    });
    expect(fills(buttons['birincil-48-15'].dark.icon).a).toBe('#1C1838');
    expect(fills(buttons['kenarli-36'].light.icon)).toEqual({
      a: '#7B5CFF',
      b: '#6FD69A',
      x: '#0F5C31',
    });
    // The send icon's bars are turned by CSS (`.send-ic rect`), kept in the drawing.
    const bars = drawing(buttons.gonder.light.icon).nodes[0]?.children ?? [];
    expect(bars.map((b) => b.attrs.transform)).toEqual([
      expect.stringContaining('matrix(0.899 0.438 -0.438 0.899'),
      expect.stringContaining('matrix(0.899 -0.438 0.438 0.899'),
    ]);
  });

  it("puts the bell's count where v46 does", () => {
    expect(buttons['yuvarlak-simge'].light.badge).toMatchObject({
      size: [20, 20],
      bg: '#C51F62',
      top: -4,
      right: -4,
      font: { size: 11, weight: 800, lineHeight: 20 },
    });
  });
});
