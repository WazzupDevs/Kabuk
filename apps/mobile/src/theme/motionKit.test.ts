import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { menuOpenAt, menuPlace } from '../motion/menuPlace';
import { sheetOpenAt } from '../motion/sheetOpen';
import { MOTION } from './aura';

const mobile = join(import.meta.dirname, '..', '..');
const code = (file: string) => readFileSync(join(mobile, file), 'utf8');
// The kit's sizes, read from its source: importing it brings React Native's types, which clash with
// the root tests' fetch (tsconfig.json).
const kitSize = (name: string): number => {
  const m = new RegExp(`\\n    ${name}: (\\d+),`).exec(code('src/theme/auraKit.ts'));
  return m ? Number(m[1]) : NaN;
};

describe('the sheet (iskelet.md → 3.5, 4.3)', () => {
  it('opens from 80 below and 0.3 faded to its place', () => {
    expect(MOTION.sheetOpen).toEqual({ fromY: 80, fromOpacity: 0.3 });
    expect(sheetOpenAt(0)).toEqual({ translateY: 80, opacity: 0.3 });
    expect(sheetOpenAt(1)).toEqual({ translateY: 0, opacity: 1 });
    // On the spring's overshoot it goes a little above its place and stays opaque.
    const over = sheetOpenAt(1.05);
    expect(over.translateY).toBeLessThan(0);
    expect(over.opacity).toBe(1);
  });

  it('opens on springs.sheet and floats 8 in, 40 round, its close button 38', () => {
    expect(MOTION.springs.sheet).toEqual({ stiffness: 260, damping: 24, mass: 1 });
    expect(code('src/motion/useSheetMotion.ts')).toMatch(/springConfig\(MOTION\.springs\.sheet\)/);
    expect(kitSize('sheetInset')).toBe(8);
    expect(kitSize('sheetRadius')).toBe(40);
    expect(kitSize('sheetClose')).toBe(38);
  });

  it('draws no "Tamam" or "Kapat" button of its own at its foot', () => {
    for (const file of ['src/motion/Sheet.tsx', 'src/components/SheetCard.tsx']) {
      expect(code(file)).not.toMatch(/<(?:Btn|Button)\b/);
    }
  });

  it('fades what scrolls at its edges without a band of colour', () => {
    const card = code('src/components/SheetCard.tsx');
    expect(card).toMatch(/fadingEdgeLength/);
    expect(card).not.toMatch(/sheetFadeTop|sheetFadeBottom/);
  });

  it('a confirmation: danger and a clear cancel', () => {
    const confirm = code('src/components/ConfirmSheet.tsx');
    expect(confirm).toMatch(/variant="glassy"/);
    expect(confirm).toMatch(/variant=\{danger \? 'danger' : 'primary'\}/);
  });
});

describe('the menu grown from its button (iskelet.md → 3.5)', () => {
  const screen = { width: 400, height: 800 };
  const edges = { top: 24, bottom: 16 };
  const menu = { width: 264, height: 200 };
  const gap = kitSize('menuGap');

  it('is 256 to 272 wide, 26 round, a destructive row 6 apart', () => {
    expect([kitSize('menuMinW'), kitSize('menuMaxW')]).toEqual([256, 272]);
    expect(kitSize('menuRadius')).toBe(26);
    expect(kitSize('menuDangerGap')).toBe(6);
  });

  it('grows from 0.18 on springs.menu', () => {
    expect(MOTION.menuOpen.fromScale).toBe(0.18);
    expect(MOTION.springs.menu).toEqual({ stiffness: 300, damping: 24, mass: 1 });
    expect(code('src/motion/Menu.tsx')).toMatch(/springConfig\(MOTION\.springs\.menu\)/);
    expect(menuOpenAt(0)).toEqual({ scale: 0.18, opacity: 0 });
    expect(menuOpenAt(1)).toEqual({ scale: 1, opacity: 1 });
  });

  it('opens under a button on the right, its right edge on the button, from its centre', () => {
    const anchor = { x: 340, y: 40, width: 44, height: 44 };
    const p = menuPlace(anchor, menu, screen, edges, gap);
    expect(p.left).toBe(340 + 44 - 264);
    expect(p.top).toBe(40 + 44 + gap);
    expect(p.originX).toBe(362 - p.left);
    expect(p.originY).toBe(62 - p.top);
  });

  it('opens over a button near the foot, its left edge on a button on the left', () => {
    const anchor = { x: 16, y: 700, width: 44, height: 44 };
    const p = menuPlace(anchor, menu, screen, edges, gap);
    expect(p.left).toBe(16);
    expect(p.top).toBe(700 - gap - 200);
    expect(p.originY).toBe(722 - p.top);
  });

  it('keeps within the screen when it fits neither under nor over', () => {
    const tall = { width: 264, height: 700 };
    const anchor = { x: 4, y: 380, width: 44, height: 44 };
    const p = menuPlace(anchor, tall, screen, edges, gap);
    expect(p.left).toBe(gap);
    expect(p.top).toBeGreaterThanOrEqual(edges.top + gap);
    expect(p.top + tall.height).toBeLessThanOrEqual(screen.height - edges.bottom - gap);
  });
});

describe('one press (iskelet.md → 2.3)', () => {
  it('Tap and the kit share one press from MOTION', () => {
    const tap = code('src/motion/Tap.tsx');
    expect(tap).toMatch(/MOTION\.press\.scale/);
    expect(tap).toMatch(/MOTION\.press\.downMs/);
    expect(tap).toMatch(/MOTION\.springs\.press/);
    expect(tap).toMatch(/unstable_pressDelay=\{press\.delay\}/);
    const kit = code('src/aura/kit.tsx');
    expect(kit).toMatch(/import \{ PRESS_DELAY, usePress \} from '@\/motion\/Tap'/);
    expect(kit).not.toMatch(/function usePress\(/);
  });
});
