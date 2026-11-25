// Where a held message's reaction bar and menu stand (components/MessagePop.tsx). The message stays
// where it is, as it is (the owner's call, 21 Kasım: it never moves to make room); the bar and the
// menu go over or under it by where it stands on the screen, as Telegram Android places a message's
// reactions and its popup menu. Pure, so the place is tested (holdPlace.test.ts).
//
// - The bar over the message and the menu under it, when both fit.
// - The menu does not fit under: it goes over the message, and the bar under it (or, without room
//   there either, over the menu).
// - The bar does not fit over: it goes under the message, the menu under the bar.
// - A message too tall for either: the bar at the screen's top edge and the menu at its foot, over
//   the message.

export type HoldBox = { y: number; height: number };

export type HoldPlace = {
  // The bar's and the menu's top; null when there is none.
  barTop: number | null;
  menuTop: number | null;
  // Whether each opens downward (grows from its top) or upward (from its foot).
  barBelow: boolean;
  menuBelow: boolean;
};

export function holdPlace(
  message: HoldBox,
  bar: number | null,
  menu: number | null,
  // The usable band of the screen: from `top` to `bottom` (the safe area and a margin taken off).
  edges: { top: number; bottom: number },
  gap: number,
): HoldPlace {
  const above = message.y - edges.top;
  const below = edges.bottom - (message.y + message.height);
  const b = bar === null ? 0 : bar + gap;
  const m = menu === null ? 0 : menu + gap;
  const foot = message.y + message.height + gap;
  const head = message.y - gap;

  // Bar over, menu under.
  if (above >= b && below >= m) {
    return {
      barTop: bar === null ? null : head - bar,
      menuTop: menu === null ? null : foot,
      barBelow: false,
      menuBelow: true,
    };
  }
  // The menu over the message; the bar under it, or over the menu.
  if (menu !== null && above >= m) {
    const barUnder = bar !== null && below >= b;
    if (barUnder || bar === null || above >= m + b) {
      return {
        barTop: bar === null ? null : barUnder ? foot : head - menu - gap - bar,
        menuTop: head - menu,
        barBelow: barUnder,
        menuBelow: false,
      };
    }
  }
  // Both under: the bar, then the menu.
  if (below >= b + m) {
    return {
      barTop: bar === null ? null : foot,
      menuTop: menu === null ? null : foot + b,
      barBelow: true,
      menuBelow: true,
    };
  }
  // No room either way: the bar at the top edge, the menu at the foot, over the message.
  return {
    barTop: bar === null ? null : Math.max(edges.top, head - bar),
    menuTop: menu === null ? null : Math.min(foot, edges.bottom - menu),
    barBelow: false,
    menuBelow: true,
  };
}
