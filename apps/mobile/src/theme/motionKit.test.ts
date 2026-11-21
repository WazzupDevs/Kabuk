import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { menuOpenAt, menuPlace } from '../motion/menuPlace';
import { sheetOpenAt } from '../motion/sheetOpen';
import { MOTION } from './aura';
import { KIT } from './auraKit';
import { SCRIM_GLASS } from './glass';

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

  // skall.css `.sheet`, `.grab`: the handle 40 × 4 in --control, 12 under the top; `.sh-t` 21/26 700.
  it('its handle 40 × 4, 12 under its top edge; its title 700 21/26', () => {
    expect(kitSize('grabW')).toBe(40);
    expect(kitSize('grabH')).toBe(4);
    expect(kitSize('sheetPadTop')).toBe(12);
    expect(KIT.layer.light.sheetGrab).toBe('#C6E0CC');
    expect(KIT.layer.dark.sheetGrab).toBe('#2A332F');
    expect(code('src/motion/Sheet.tsx')).toMatch(/'sheetTitle'\)/);
  });

  it('opens on springs.sheet and floats 8 in, 28 round, without a close button', () => {
    expect(MOTION.springs.sheet).toEqual({ stiffness: 260, damping: 24, mass: 1 });
    expect(code('src/motion/useSheetMotion.ts')).toMatch(/springConfig\(MOTION\.springs\.sheet\)/);
    expect(kitSize('sheetInset')).toBe(8);
    expect(KIT.layer.size.sheetRadius).toBe(28);
    expect(code('src/components/SheetCard.tsx')).not.toMatch(/sheet-close|icon="close"/);
  });

  it('leaves on the leaving curve by its own height, and is not put back while still drawn', () => {
    const motion = code('src/motion/useSheetMotion.ts');
    expect(motion).toMatch(/Easing\.bezier\(\.\.\.MOTION\.curves\.leave\)/);
    expect(motion).toMatch(/outputRange: \[0, out\]/);
    const sheet = code('src/motion/Sheet.tsx');
    // PF-25: the motion goes back to its start only once the sheet is off the screen.
    expect(sheet).toMatch(/\(\) => setMounted\(false\),/);
    expect(sheet).toMatch(/if \(!mounted\) reset\(\);/);
    // PF-57: what it shows is held while it leaves.
    expect(sheet).toMatch(/<Held frozen=\{!visible\}>/);
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

  // Yeni arayüz tuvali `.dlg .btn.ghost`: the way out without a fill.
  it('a confirmation: danger and a ghost cancel', () => {
    const confirm = code('src/motion/Dialog.tsx');
    expect(confirm).toMatch(/variant="ghost"/);
    expect(confirm).toMatch(/variant=\{danger \? 'danger' : 'primary'\}/);
  });
});

describe('the menu grown from its button (iskelet.md → 3.5)', () => {
  const screen = { width: 400, height: 800 };
  const edges = { top: 24, bottom: 16 };
  const menu = { width: 264, height: 200 };
  const gap = kitSize('menuGap');

  it('the ⋮ menu 292 wide, 28 round, flat and without a scrim; the long-press menu 268, 24', () => {
    expect(KIT.layer.size).toMatchObject({ menuWidth: 292, menuRadius: 28, menuPadTop: 8 });
    expect(KIT.layer.size).toMatchObject({ holdWidth: 268, holdRadius: 24, holdBand: 6 });
    const menu = code('src/motion/Menu.tsx');
    expect(menu).not.toMatch(/MENU_GLASS|BackdropBlur|useSheetFrost/);
    expect(menu).toMatch(/\{hold \? \(\s*<SheetScrim/);
  });

  it('sheets, menus and the held message hold their place in the one store', () => {
    expect(code('src/motion/Sheet.tsx')).toMatch(/useOverlaySlot\('sheet', visible, onClose\)/);
    expect(code('src/motion/Menu.tsx')).toMatch(/useOverlaySlot\(hold \? 'hold' : 'menu'/);
    expect(code('src/components/MessagePop.tsx')).toMatch(
      /useOverlaySlot\('hold', true, onClose\)/,
    );
    expect(code('src/components/RouteSheet.tsx')).toMatch(/useOverlaySlot\('sheet', true\)/);
  });

  it('the long-press scrim blurs only with the lab switch on; the others are flat', () => {
    expect(SCRIM_GLASS.blur).toBe(6);
    const scrim = code('src/components/SheetScrim.tsx');
    expect(scrim).toMatch(/!!hold && glassOn && HAS_BACKDROP && !solid/);
    expect(KIT.layer.light.holdScrim).toBe('rgba(3, 27, 11, 0.30)');
    expect(KIT.layer.dark.holdScrim).toBe('rgba(0, 0, 0, 0.62)');
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
    expect(kit).toMatch(/import \{ holdAfter, PRESS_DELAY, usePress \} from '@\/motion\/Tap'/);
    expect(kit).not.toMatch(/function usePress\(/);
  });

  it('a long press is held 400 ms from the touch, as Android and Telegram Android', () => {
    const tap = code('src/motion/Tap.tsx');
    expect(tap).toMatch(/export const HOLD_MS = 400;/);
    // Pressability counts delayLongPress after the press delay: a press with one passes the rest.
    expect(tap).toMatch(/return HOLD_MS - pressDelay;/);
    expect(code('src/motion/Tap.tsx')).toMatch(/delayLongPress=\{holdAfter\(press\.delay\)\}/);
    expect(code('src/aura/kit.tsx')).toMatch(/delayLongPress=\{holdAfter\(PRESS_DELAY\)\}/);
    expect(code('src/components/ChatBubble.tsx')).toMatch(/delayLongPress=\{HOLD_MS\}/);
  });
});

describe('the centred confirmation (Hareket tablosu A2, Ortak kurallar C1, C2)', () => {
  const dialog = code('src/motion/Dialog.tsx');
  it('arrives on MOTION.dissolve and leaves on its out time, at once with reduce motion', () => {
    expect(MOTION.dissolve).toMatchObject({ rise: 12, fromScale: 0.97, inMs: 240, outMs: 150 });
    expect(dialog).toMatch(/duration: d\.inMs, easing: ARRIVE/);
    expect(dialog).toMatch(/duration: d\.outMs, easing: LEAVE/);
    expect(dialog).toMatch(/if \(reduce\)/);
  });

  // Yeni arayüz tuvali `.dlg`: its buttons' icon 24, a little over the middle; opened from a
  // long-press menu, that menu's scrim (Ortak kurallar C2).
  it('its icons 24, over the middle, the held scrim when asked', () => {
    expect(KIT.layer.size.dialogButtonIcon).toBe(24);
    expect(KIT.layer.size.dialogAbove).toBeLessThan(0.5);
    expect(dialog).toMatch(/options\.scrim === 'hold' \? look\.holdScrim : look\.scrim/);
  });

  it('a flat scrim, no blur; 28 in and 28 round', () => {
    expect(KIT.layer.light.scrim).toBe('rgba(3, 27, 11, 0.42)');
    expect(KIT.layer.dark.scrim).toBe('rgba(0, 0, 0, 0.70)');
    expect(dialog).not.toMatch(/Blur|SheetScrim/);
    expect(KIT.layer.size).toMatchObject({ dialogInset: 28, dialogRadius: 28 });
    expect(dialog).toMatch(/KIT\.layer\[scheme\]/);
    expect(dialog).not.toMatch(/theme\/overlay/);
  });

  it('the action waits and nothing closes it meanwhile; cancel keeps the ConfirmSheet testID', () => {
    expect(dialog).toMatch(/loading=\{running === 'confirm'\}/);
    expect(dialog).toMatch(/loading=\{running === 'other'\}/);
    expect(dialog).toMatch(/disabled=\{pending\}/);
    expect(dialog).toMatch(/`\$\{testID\}-cancel`/);
    const host = code('src/components/OverlayHost.tsx');
    expect(host).toMatch(/statusBarTranslucent/);
    expect(host).toMatch(/navigationBarTranslucent/);
    expect(host).toMatch(/onRequestClose=\{cancel\}/);
  });
});
