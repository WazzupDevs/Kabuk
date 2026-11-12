import { MOTION } from '../theme/aura';

// A box on the screen (measureInWindow): the button a menu grows out of.
export type MenuAnchor = { x: number; y: number; width: number; height: number };

export type MenuPlace = {
  left: number;
  top: number;
  // The menu's transform origin, in its own box: the button's centre (iskelet.md → 3.5: the
  // origin is the button's place), so it may lie outside the box.
  originX: number;
  originY: number;
};

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), Math.max(lo, hi));

// Where a menu grown out of `anchor` stands (Telegram Android's popup menus): under the button,
// or over it when it does not fit under; its edge on the button's side (the right one for a button
// on the screen's right half); `gap` from the button and the screen's edges, `edges` the safe area
// above and below. Pure, so the place is tested (theme/motionKit.test.ts).
export function menuPlace(
  anchor: MenuAnchor,
  menu: { width: number; height: number },
  screen: { width: number; height: number },
  edges: { top: number; bottom: number },
  gap: number,
): MenuPlace {
  const cx = anchor.x + anchor.width / 2;
  const cy = anchor.y + anchor.height / 2;
  const onRight = cx > screen.width / 2;
  const left = clamp(
    onRight ? anchor.x + anchor.width - menu.width : anchor.x,
    gap,
    screen.width - gap - menu.width,
  );
  const floor = screen.height - edges.bottom - gap;
  const ceiling = edges.top + gap;
  const below = anchor.y + anchor.height + gap;
  const above = anchor.y - gap - menu.height;
  const top =
    below + menu.height <= floor
      ? below
      : above >= ceiling
        ? above
        : clamp(below, ceiling, floor - menu.height);
  return { left, top, originX: cx - left, originY: cy - top };
}

// The menu's scale and opacity at its opening's progress `p` (0 closed, 1 open; past 1 on the
// spring's overshoot): from MOTION.menuOpen.fromScale, faded in over the first part.
export const MENU_SCALE = [MOTION.menuOpen.fromScale, 1] as const;
export const MENU_FADE_UNTIL = 0.35;
export function menuOpenAt(p: number): { scale: number; opacity: number } {
  return {
    scale: MENU_SCALE[0] + (MENU_SCALE[1] - MENU_SCALE[0]) * p,
    opacity: clamp(p / MENU_FADE_UNTIL, 0, 1),
  };
}
