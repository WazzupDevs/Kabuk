// When Süsle's new look comes on, and what a tile shows meanwhile (features/capsule/CapsuleStage.tsx,
// profile/capsule.tsx). No dependency: unit-tested (features/capsule/stageGate.test.ts).

// How long the stage waits for the tiles on the screen after a change (a roll of the dice, a
// colour, a part): the stage and the strip come on together, the old look everywhere and then the
// new one, not a new colour on the stage beside the old one in the strip. A few of the queue's
// turns; tiles that take longer would hold the stage back for no better picture, so it goes on
// without them and they change as they are made. The look's own pictures are waited for always.
export const TILE_WAIT_MS = 250;

// The stage shows the new look once its pictures are made and the tiles on the screen are too, or
// once it has waited TILE_WAIT_MS for them.
export function stagePasses(lookReady: boolean, tilesReady: boolean, overdue: boolean): boolean {
  return lookReady && (tilesReady || overdue);
}

// A tile's picture: the one just made, else the last made it showed (the same option in the colour
// before), else none (its SVG, the first time only).
export function tileShown(made: string | null, last: string | null): string | null {
  return made ?? last;
}

// The stage's second canvas, the look fading out over the new one (features/capsule/
// CapsuleStage.tsx): on the screen from the first change that fades, and kept there after (a
// canvas mounted for each change made its surface each time: docs/decisions/skia-build-plani.md →
// "Bütün kapsül Skia'da"); idle, hidden and drawing nothing, between two fades. Never on the screen
// with reduce motion (no fade).
export function fadeCanvas(mounted: boolean, fading: boolean): { mounted: boolean; idle: boolean } {
  return { mounted: mounted || fading, idle: !fading };
}
