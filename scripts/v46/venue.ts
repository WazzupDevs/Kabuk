// The parts Mekan is built from (v46 native, step 3h) as the app draws them: the venue's name
// (`h1.venue`), the two cards pinned at the top (`.pin`: the venue chat's link card `.linkcard.chat`
// and the own card, `.mine.nomasa` without a table, `.mine` with one, both under the same glow
// `.mine::before`), a list's head and the line under it (`.sec`, `.note`), the lobby's rows
// (`.card.row`) with their chips and the request's wait, and the empty lobby (`.empty-card`).
// "Katıl" and "Bu masadayım" are buttons (buttons.ts → JOIN_LOOKS). From the measurement
// (measured.ts) only what src/ui/VenueCards.tsx and LobbyRow.tsx read.
import { animation, type Drawing, drawingOf } from './buttons.ts';
import { type CardLook, card, find, played, type Played, tinted } from './explore.ts';
import type { Inventory } from './inventory.ts';
import type { Element, MotionMatch } from './measured.ts';
import { pressScale, text, type Text } from './navigation.ts';

type Sides = readonly [number, number, number, number];
type Edge = { width: number; color: string };

const need = <T>(v: T | null | undefined, what: string): T => {
  if (v === null || v === undefined) throw new Error(`${what}: not measured`);
  return v;
};
const flexGap = (el: Element, label: string, id: string) =>
  need(find(el, label, id).flex, `${id} ${label} flex`).gap;

// The glow on the own card's corner (`.mine::before`): a round of v46's radial gradient, `size`
// across, `right` and `top` from the card's padding box (negative: past the edge, clipped).
export type GlowScheme = { size: number; right: number; top: number; gradient: string };

function glow(el: Element, id: string): GlowScheme {
  const b = need(el.look.badge, `${id} glow`);
  const border = el.look.border?.width ?? 0;
  return {
    size: b.box[0],
    right: b.right,
    // Measured from the bottom; the card's own height gives its top.
    top: el.box[1] - 2 * border - b.bottom - b.box[1],
    gradient: need(b.image, `${id} glow gradient`),
  };
}

export type VenueScheme = {
  title: Text & { marginBottom: number };
  pin: { padding: Sides; gap: number };
  section: { margin: Sides; title: Text; count: Text };
  note: Text & { margin: Sides };
  card: CardLook;
  glow: GlowScheme;
  link: {
    padding: Sides;
    gap: number;
    pressedScale: number;
    disc: { size: number; gradient: string; icon: { size: number; color: string } };
    title: Text;
    body: Text;
    dot: { size: number; marginRight: number };
    chevron: { size: number; color: string };
  };
  noTable: {
    padding: Sides;
    gap: number;
    head: { gap: number };
    icon: { size: number };
    middle: { gap: number };
    title: Text;
    body: Text;
  };
  mine: {
    padding: Sides;
    head: { gap: number; pressedScale: number };
    icon: { size: number };
    title: Text;
    status: Text & { gap: number };
    dot: { size: number; off: string; on: string };
    go: { size: number; bg: string; chevron: { size: number; color: string } };
    actions: { marginTop: number; gap: number };
  };
  empty: {
    padding: Sides;
    gap: number;
    mark: number;
    title: Text;
    body: Text & { marginTop: number };
  };
  list: { gap: number };
  row: {
    padding: Sides;
    gap: number;
    icon: { size: number };
    title: Text;
    note: Text & { marginTop: number };
    meta: { marginTop: number; gap: number };
    wait: { size: number; loader: number };
  };
  chip: {
    padding: Sides;
    gap: number;
    radius: number;
    gradient: string;
    border: Edge;
    shadow: string;
    text: Text;
    icon: { size: number; color: string };
  };
  here: { marginTop: number };
};

export type VenueElements = {
  title: Element;
  pin: Element;
  section: Element;
  note: Element;
  link: Element;
  noTable: Element;
  mine: Element;
  dotOff: Element;
  dotOn: Element;
  empty: Element;
  list: Element;
  row: Element;
  waiting: Element;
  chip: Element;
  here: Element;
};

export function venueScheme(
  inventory: Inventory,
  e: VenueElements,
  matches: { link: readonly MotionMatch[]; mine: readonly MotionMatch[] },
): VenueScheme {
  const sectionParts = e.section.parts.filter((p) => p.text);
  const [sectionTitle, sectionCount] = sectionParts;
  if (!sectionTitle || !sectionCount) throw new Error('mekan-bolum: title and count');
  const linkDisc = find(e.link, 'span.chat-ic', 'kart-baglanti');
  const linkIcon = find(e.link, 'svg.ico', 'kart-baglanti');
  const linkDot = find(e.link, 'i.live', 'kart-baglanti');
  const linkChevron = find(e.link, 'svg.ico.chev', 'kart-baglanti');
  const go = find(e.mine, 'span.go', 'kart-masam');
  const goChevron = find(e.mine, 'svg.ico.chev', 'kart-masam');
  const two = find(e.mine, 'div.two.owner-only', 'kart-masam');
  const status = find(e.mine, 'small', 'kart-masam');
  const emblem = e.mine.parts.find((p) => p.part.startsWith('span.tic'));
  const rowIcon = e.row.parts.find((p) => p.part.startsWith('span.tic'));
  const wait = find(e.waiting, 'div.wait', 'lobi-satiri-bekliyor');
  const waitLoader = find(e.waiting, 'svg.ld', 'lobi-satiri-bekliyor');
  const emptyMark = find(e.empty, 'svg.ld', 'kart-bos');
  const emptyBody = find(e.empty, 'p', 'kart-bos');
  const chipIcon = find(e.chip, 'svg.ico', 'lobi-cipi');
  const twoButton = e.mine.parts.find((p) => p.part === 'button.btn.btn-room');
  const twoSoft = e.mine.parts.find((p) => p.part === 'button.btn.btn-soft');
  if (!emblem || !rowIcon || !twoButton || !twoSoft)
    throw new Error('kart-masam / lobi-satiri: parts');
  // The two buttons share the card's width: their gap is the room left between them.
  const twoGap = two.box[0] - twoButton.box[0] - twoSoft.box[0];
  const titleText = need(e.title.text, 'mekan-basligi text');
  const noteText = need(e.note.text, 'mekan-notu text');
  const chipText = need(e.chip.text, 'lobi-cipi text');
  return {
    title: { font: e.title.font, ...titleText, marginBottom: e.title.margin[2] },
    pin: { padding: e.pin.padding, gap: e.link.margin[2] },
    section: {
      margin: e.section.margin,
      title: text(sectionTitle, 'mekan-bolum title'),
      count: text(sectionCount, 'mekan-bolum count'),
    },
    note: { font: e.note.font, ...noteText, margin: e.note.margin },
    card: card(e.empty, 'kart-bos'),
    glow: glow(e.mine, 'kart-masam'),
    link: {
      padding: e.link.padding,
      gap: e.link.gap,
      pressedScale: pressScale(inventory, matches.link, 'self'),
      disc: {
        size: linkDisc.box[0],
        gradient: need(linkDisc.gradient, 'kart-baglanti disc'),
        icon: { size: linkIcon.box[0], color: need(linkIcon.svg, 'chat icon').color },
      },
      title: text(find(e.link, 'b', 'kart-baglanti'), 'link title'),
      body: text(find(e.link, 'small', 'kart-baglanti'), 'link body'),
      dot: { size: linkDot.box[0], marginRight: linkDot.margin?.[1] ?? 0 },
      chevron: { size: linkChevron.box[0], color: need(linkChevron.svg, 'chevron').color },
    },
    noTable: {
      padding: e.noTable.padding,
      gap: e.noTable.gap,
      head: { gap: flexGap(e.noTable, 'div.nm-head', 'kart-masasiz') },
      icon: { size: find(e.noTable, 'svg.nm-ic', 'kart-masasiz').box[0] },
      middle: { gap: flexGap(e.noTable, 'span.cmid', 'kart-masasiz') },
      title: text(find(e.noTable, 'b', 'kart-masasiz'), 'no table title'),
      body: text(find(e.noTable, 'small', 'kart-masasiz'), 'no table body'),
    },
    mine: {
      padding: e.mine.padding,
      head: {
        gap: flexGap(e.mine, 'button.mine-head', 'kart-masam'),
        pressedScale: pressScale(inventory, matches.mine, 'button.mine-head'),
      },
      icon: { size: emblem.box[0] },
      title: text(find(e.mine, 'b', 'kart-masam'), 'mine title'),
      // The line holds the dot and a span, so it has no text of its own: its font is the one the dot
      // inherits from it, its colour the muted one of `.note` (both `var(--muted)`; tested).
      status: {
        font: e.dotOff.font,
        color: noteText.color,
        letterSpacing: 0,
        gap: need(status.flex, 'status flex').gap,
      },
      dot: {
        size: e.dotOff.box[0],
        off: need(e.dotOff.look.bg, 'dot off'),
        on: need(e.dotOn.look.bg, 'dot on'),
      },
      go: {
        size: go.box[0],
        bg: need(go.bg, 'go ground'),
        chevron: { size: goChevron.box[0], color: need(goChevron.svg, 'go chevron').color },
      },
      actions: { marginTop: two.margin?.[0] ?? 0, gap: twoGap },
    },
    empty: {
      padding: e.empty.padding,
      gap: e.empty.gap,
      mark: emptyMark.box[0],
      title: text(find(e.empty, 'b', 'kart-bos'), 'empty title'),
      body: { ...text(emptyBody, 'empty body'), marginTop: emptyBody.margin?.[0] ?? 0 },
    },
    list: { gap: e.list.gap },
    row: {
      padding: e.row.padding,
      gap: e.row.gap,
      icon: { size: rowIcon.box[0] },
      title: text(find(e.row, 'b', 'lobi-satiri'), 'row title'),
      note: {
        ...text(find(e.waiting, 'small', 'lobi-satiri-bekliyor'), 'row note'),
        marginTop: find(e.waiting, 'small', 'lobi-satiri-bekliyor').margin?.[0] ?? 0,
      },
      meta: {
        marginTop: find(e.row, 'div.meta', 'lobi-satiri').margin?.[0] ?? 0,
        gap: flexGap(e.row, 'div.meta', 'lobi-satiri'),
      },
      wait: { size: wait.box[0], loader: waitLoader.box[0] },
    },
    chip: {
      padding: e.chip.padding,
      gap: e.chip.gap,
      radius: need(e.chip.look.radius, 'chip radius'),
      gradient: need(e.chip.look.gradient, 'chip ground'),
      border: need(e.chip.look.border, 'chip edge'),
      shadow: need(e.chip.look.shadow, 'chip shadow'),
      text: { font: e.chip.font, ...chipText },
      icon: { size: chipIcon.box[0], color: need(chipIcon.svg, 'chip icon').color },
    },
    here: { marginTop: e.here.margin[0] },
  };
}

// The drawings: the venue chat's icon, the no-table card's mark and the chip's people, the arrow
// (the link card's and the own card's are the same `polyline`), all in `currentColor` but the mark.
export type VenueIcons = { chat: Drawing; noTable: Drawing; people: Drawing; chevron: Drawing };

export function venueIcons(link: Element, noTable: Element, chip: Element): VenueIcons {
  return {
    chat: tinted(find(link, 'svg.ico', 'kart-baglanti')),
    noTable: drawingOf(find(noTable, 'svg.nm-ic', 'kart-masasiz')),
    people: tinted(find(chip, 'svg.ico', 'lobi-cipi')),
    chevron: tinted(find(link, 'svg.ico.chev', 'kart-baglanti')),
  };
}

// The own table's icon bobs (`.va .emblem`: `bob`, 3.4 s, for ever). v46 stops it with reduce motion
// through the plain `.emblem` (`.emblem,.bobbing,.dot.open{animation:none!important}`), which the
// inventory's match by selector does not tie to `.va .emblem`: the test reads that rule.
export function venueMotions(inventory: Inventory): { bob: Played } {
  return { bob: { ...played(animation(inventory, 'bob', '.va .emblem')), offWhenReduced: true } };
}
