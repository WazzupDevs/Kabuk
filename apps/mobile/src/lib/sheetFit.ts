// A sheet as tall as its content, at most this share of the screen (docs/design/aura → CheckInDar:
// `.sheet` max-height 90%). RouteSheet's `maxHeight: '90%'` and the buddies' hiding read the same.
export const SHEET_MAX = 0.9;

// The frame the buddies are placed in (aura.css `.behind > .peek`).
export const PEEK_FRAME = 350;

// The buddies over a sheet's edge, scaled to its width (docs/design/aura/aktarim-37-checkin.md):
// placed in a 350 wide frame, the strip over the edge `up` × (width / 350) high (58 → 61 for a
// 370 wide sheet), each buddy's x, top and height by the same ratio. Unmeasured, the frame's own.
export function peekScale(width: number, up: number): { k: number; strip: number } {
  const k = width > 0 ? width / PEEK_FRAME : 1;
  return { k, strip: up * k };
}

// Whether the buddies show: not once the sheet stands at its tallest (the strip would stand over
// the screen's top part, the content scrolling under it). Half a point of rounding is allowed for;
// an unmeasured sheet shows them. The answer depends on the sheet's height only, never on the
// buddies (drawn outside the sheet's layout), so hiding them cannot change it back.
export function peekShown(
  sheetHeight: number,
  areaHeight: number,
  max: number = SHEET_MAX,
): boolean {
  if (sheetHeight <= 0 || areaHeight <= 0) return true;
  return sheetHeight < areaHeight * max - 0.5;
}
