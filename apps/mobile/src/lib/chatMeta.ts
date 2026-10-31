// How far the reader may scroll the stream (drawn from the bottom up: 0 at its end) before the
// newest message's time line is wholly under the message bar: the room under the newest cell above
// the bar (`gapUnder`), the rows under it (the typing dots, `latest`) and the line's top above the
// cell's foot. Without a line (a message being sent, a failed one), the whole cell.
export function metaHiddenAt({
  gapUnder,
  latest,
  cellHeight,
  metaTop,
}: {
  gapUnder: number;
  latest: number;
  cellHeight: number;
  metaTop: number | null;
}): number {
  return gapUnder + latest + (metaTop ?? cellHeight);
}
