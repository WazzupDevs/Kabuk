import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { V46_BUTTONS as buttons } from '../../apps/mobile/src/theme/parts.generated.ts';
import { buttonIds } from './buttons.ts';
import { readInventory } from './inventory.ts';

const root = resolve(import.meta.dirname, '../..');
const inventory = readInventory(root);

const bell = (icon: (typeof buttons)['gonder']['light']['icon']) => {
  if (!icon || !('drawing' in icon)) throw new Error('no drawing');
  return icon;
};
const send = (icon: (typeof buttons)['gonder']['light']['icon']) => {
  if (!icon || !('send' in icon)) throw new Error('no send icon');
  return icon.send;
};
const fills = (icon: (typeof buttons)['gonder']['light']['icon']) => {
  if (!icon || !('fills' in icon)) throw new Error('no bar icon');
  return icon.fills;
};

// What scripts/v46/buttons.ts takes from the measurement for each of v46's buttons (the module is
// what `pnpm tokens` writes: tokens.test.ts), checked on the values v46 has.
describe('v46 buttons in parts.generated.ts', () => {
  it('has every button of the gallery group, and nothing else', () => {
    expect(Object.keys(buttons)).toEqual(buttonIds(inventory));
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
  });

  // `.send-ic rect` turns each bar about its own middle; `.send.ready` gives them the brand colours
  // and opens them to 36 degrees (`.send.ready .sa{fill:#7B5CFF;transform:rotate(36deg)…}`).
  it('draws the send bars waiting and ready, each turned about its own middle', () => {
    const { waiting, ready } = send(buttons.gonder.light.icon);
    expect(waiting.map((b) => [b.fill, Math.round(b.rotate)])).toEqual([
      ['#BDB6D3', 26],
      ['#BDB6D3', -26],
    ]);
    expect(ready.map((b) => [b.fill, Math.round(b.rotate)])).toEqual([
      ['#7B5CFF', 36],
      ['#FF4F8B', -36],
    ]);
    expect(send(buttons.gonder.dark.icon).ready.map((b) => b.fill)).toEqual(['#7B5CFF', '#FF4F8B']);
    for (const b of [...waiting, ...ready]) expect(b).toMatchObject({ width: 14, height: 4.4 });
  });

  // `.nb-ic{transform-origin:50% 14%}`: the bell turns about its top, the clapper on its own layer.
  it('turns the bell about its own point and keeps the clapper apart', () => {
    const icon = bell(buttons['yuvarlak-simge'].light.icon);
    expect(icon.origin).toEqual([12, 3.36]);
    expect(icon.clap).not.toBeNull();
  });

  // v46 `.va .sheet .close` is a block: the browser's button default (`text-align: center`) centres
  // the label, not `justify-content`.
  it('centres the label of a button that is not a flex box', () => {
    expect(buttons['yumusak-lavanta'].light.justify).toBe('center');
    expect(buttons['birincil-52'].light.justify).toBe('center');
  });

  // `.hb .ld.mini{width:22px;height:22px}`; elsewhere the loader is 26.
  it("sizes the loader as each look's own", () => {
    expect(buttons['kenarli-36'].light.loaderSize).toEqual([22, 22]);
    expect(buttons['birincil-52'].light.loaderSize).toEqual([26, 26]);
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
