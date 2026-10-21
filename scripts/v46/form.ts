// The form parts (v46 native, step 3g) as the app draws them: the text field with its label
// (`.sup-field`), the phone field (`.sup-phone`), the code's six boxes (`.otp`), a field's error
// line (`.sup-err`), the warning box (`.sup-warn`), the select (`.dob select`), the many-line field
// (`.ebio textarea`), the switch (`.vsw`) and the anonymous switch (`.anon-sw`). From the
// measurement (measured.ts) only what src/ui/TextField.tsx, PhoneField.tsx, CodeField.tsx,
// FieldError.tsx, Notice.tsx, SelectField.tsx, TextArea.tsx, Switch.tsx and AnonSwitch.tsx read.
import { type Drawing, drawingOf, px, styled } from './buttons.ts';
import { parseColor } from './inventory.ts';
import type {
  Element,
  Field,
  Font,
  Part,
  Pressed,
  SvgNode,
  Transform,
  Transition,
} from './measured.ts';
import { text, type Text } from './navigation.ts';

type Sides = readonly [number, number, number, number];
type Edge = { width: number; color: string };
type Insets = { top: number; right: number; bottom: number; left: number };

const find = (el: Element, label: string, id: string) => {
  const p = el.parts.find((x) => x.part === label);
  if (!p) throw new Error(`${id}: no ${label}`);
  return p;
};
const edge = (e: Edge | null | undefined, what: string): Edge => {
  if (!e) throw new Error(`${what}: no edge`);
  return e;
};
const need = <T>(v: T | null | undefined, what: string): T => {
  if (v === null || v === undefined) throw new Error(`no ${what}`);
  return v;
};

// A field's edge and ring, at rest and while typing (`:focus`, `:focus-within`).
export type FieldLook = { border: Edge; shadow: string | null };

// What a field shows (its value, or its placeholder while empty): font, colours, where it sits,
// whether its digits are each as wide, the caret's colour.
export type FieldText = {
  font: Font;
  letterSpacing: number;
  color: string;
  placeholderColor: string;
  align: Field['align'];
  tabular: boolean;
  caret: string;
};

const fieldText = (f: Field, placeholderColor = f.placeholderColor): FieldText => ({
  font: f.font,
  letterSpacing: f.letterSpacing,
  color: f.color,
  placeholderColor,
  align: f.align,
  tabular: f.tabular,
  caret: f.caret,
});

// A field's box, drawn from a part (an `<input>` inside a label) or an element (the phone's label,
// a `<textarea>`, a `<select>`).
export type FieldBox = {
  height: number;
  padding: Sides;
  radius: number;
  bg: string;
  idle: FieldLook;
  focus: FieldLook;
  transitions: Transition[];
};

function partBox(idle: Part, focus: Part, what: string): FieldBox {
  return {
    height: idle.box[1],
    padding: idle.padding ?? [0, 0, 0, 0],
    radius: px(idle.radius, `${what} radius`),
    bg: need(idle.bg, `${what} ground`),
    idle: { border: edge(idle.border, what), shadow: idle.shadow ?? null },
    focus: { border: edge(focus.border, `${what} focus`), shadow: focus.shadow ?? null },
    transitions: styled(idle.transitions),
  };
}

function elementBox(idle: Element, focus: Element, what: string): FieldBox {
  return {
    height: idle.box[1],
    padding: idle.padding,
    radius: need(idle.look.radius, `${what} radius`),
    bg: need(idle.look.bg, `${what} ground`),
    idle: { border: edge(idle.look.border, what), shadow: idle.look.shadow },
    focus: { border: edge(focus.look.border, `${what} focus`), shadow: focus.look.shadow },
    transitions: styled(idle.transitions),
  };
}

// The sign-up's text field (`.sup-field`): its label above the box. v46 gives this field no
// placeholder colour of its own (the browser's grey shows: Chromium's `#757575` in both schemes),
// every other field of v46 has the same one (`.cin`, `.ebio textarea`, `.dsearch input`,
// `.sup-phone input`); the field takes theirs (docs/SPEC_V4.md §4.C, the conflict rule).
export type TextFieldScheme = {
  marginTop: number;
  gap: number;
  label: Text;
  box: FieldBox;
  text: FieldText;
};

export function textFieldScheme(
  idle: Element,
  focus: Element,
  placeholderColor: string,
): TextFieldScheme {
  const label = find(idle, 'span', 'alan-isim');
  const input = find(idle, 'input', 'alan-isim');
  return {
    marginTop: idle.margin[0],
    gap: idle.gap,
    label: text(label, 'field label'),
    box: partBox(input, find(focus, 'input', 'alan-isim-odak'), 'alan-isim'),
    text: fieldText(need(input.field, 'alan-isim field'), placeholderColor),
  };
}

// The phone field (`.sup-phone`): the box is the label, "+90" before the input.
export type PhoneFieldScheme = {
  marginTop: number;
  box: FieldBox;
  gap: number;
  prefix: Text;
  text: FieldText;
};

export function phoneFieldScheme(idle: Element, focus: Element): PhoneFieldScheme {
  const input = find(idle, 'input', 'alan-telefon');
  return {
    marginTop: idle.margin[0],
    box: elementBox(idle, focus, 'alan-telefon'),
    gap: idle.gap,
    prefix: text(find(idle, 'span.cc', 'alan-telefon'), 'phone prefix'),
    text: fieldText(need(input.field, 'alan-telefon field')),
  };
}

// The code (`.otp`): six boxes in a row, as wide as each other, a gap between; the box being typed
// in has the focus look.
export type CodeFieldScheme = {
  marginTop: number;
  cells: number;
  gap: number;
  cell: FieldBox;
  text: FieldText;
};

export function codeFieldScheme(idle: Element, focus: Element): CodeFieldScheme {
  const inputs = idle.parts.filter((p) => p.part === 'input');
  const [first] = inputs;
  const focused = focus.parts.find((p) => p.part === 'input');
  if (!first || !focused) throw new Error('alan-kod: no boxes');
  return {
    marginTop: idle.margin[0],
    cells: inputs.length,
    gap: idle.gap,
    cell: partBox(first, focused, 'alan-kod'),
    text: fieldText(need(first.field, 'alan-kod field')),
  };
}

// A field's error line by `.sup-err`'s own rule (screenParts.ts → alan-hata-kendi): on the sign-up
// screen v46's paragraph rule (`.sup-pane>p`) draws it as a muted line instead.
export function errorText(own: Element): Text {
  return { font: own.font, color: need(own.text, 'error colour').color, letterSpacing: 0 };
}

// The warning box (`.sup-warn`).
export type NoticeScheme = { bg: string; radius: number; padding: Sides; text: Text };

export function noticeScheme(el: Element): NoticeScheme {
  return {
    bg: need(el.look.bg, 'uyari ground'),
    radius: need(el.look.radius, 'uyari radius'),
    padding: el.padding,
    text: {
      font: el.font,
      color: need(el.text, 'uyari colour').color,
      letterSpacing: el.text?.letterSpacing ?? 0,
    },
  };
}

// The select (`.dob select`): its box and the chosen option's text. The arrow is the browser's own
// (`appearance: auto`), not v46's: the app draws v46's own down arrow (the city button's, Keşfet)
// in the text's colour, as Chromium draws its arrow (docs/SPEC_V4.md §4.C).
export type SelectScheme = { box: FieldBox; text: { font: Font; color: string } };

export function selectScheme(idle: Element, focus: Element): SelectScheme {
  // The chosen option, in the colour it takes from the select.
  const chosen = need(idle.select, 'alan-secim value').text;
  const option = idle.parts.find((p) => p.part === 'option' && p.text?.sample === chosen);
  return {
    box: elementBox(idle, focus, 'alan-secim'),
    text: { font: idle.font, color: need(option?.text, 'alan-secim colour').color },
  };
}

// The many-line field (`.ebio textarea`): as high as v46 draws it (its three rows, `rows="3"`,
// over its `min-height`), its text scrolling inside it; its edge and ring ease.
export type TextAreaScheme = FieldBox & { text: FieldText };

export function textAreaScheme(idle: Element, focus: Element): TextAreaScheme {
  return {
    ...elementBox(idle, focus, 'alan-cok-satir'),
    text: fieldText(need(idle.field, 'alan-cok-satir field')),
  };
}

// The switch (`.vsw`): a track and its knob (`i`), the knob sliding over when on, the track's
// colour easing. A press does not shrink it (`.va .vsw:active{transform:none}`: the tests check
// the pressed reading); its `::after` widens where it takes a touch; one that cannot change now is
// faded.
export type SwitchScheme = {
  width: number;
  height: number;
  radius: number;
  off: string;
  on: string;
  transitions: Transition[];
  hitSlop: Insets;
  disabledOpacity: number;
  knob: {
    size: number;
    inset: number;
    radius: number;
    bg: string;
    shadow: string | null;
    onX: number;
    transitions: Transition[];
    // With reduce motion (v46: `.vsw i{transition:none}`).
    reduced: Transition[];
  };
};

const moveX = (t: Transform, what: string) => {
  if (!t || t.scale !== 1 || t.rotate !== 0 || t.translateY !== 0) {
    throw new Error(`${what}: not a slide`);
  }
  return t.translateX;
};

export function switchScheme(
  off: Element,
  on: Element,
  disabled: Element,
  reduced: Element,
): SwitchScheme {
  const knob = find(off, 'i', 'anahtar');
  const knobOn = find(on, 'i', 'anahtar-acik');
  const at = need(knob.absolute, 'knob inset');
  return {
    width: off.box[0],
    height: off.box[1],
    radius: need(off.look.radius, 'switch radius'),
    off: need(off.look.bg, 'switch off'),
    on: need(on.look.bg, 'switch on'),
    transitions: styled(off.transitions),
    hitSlop: need(off.hitSlop, 'switch touch'),
    disabledOpacity: disabled.opacity,
    knob: {
      size: knob.box[0],
      inset: at.left,
      radius: knob.box[0] / 2,
      bg: need(knob.bg, 'knob ground'),
      shadow: knob.shadow ?? null,
      onX: moveX(knobOn.transform, 'knob on'),
      transitions: styled(knob.transitions),
      reduced: styled(find(reduced, 'i', 'anahtar reduced').transitions),
    },
  };
}

// The anonymous switch (`.anon-sw`): a smaller track with an edge; on its knob the profile's
// silhouette (`.k-photo`) turns into the capsule face (`.k-anon`) as it slides over. After this
// check-in's one change (`.used`) its edge changes and a lock sits on its corner (`::before`).
export type IconState = { opacity: number; scale: number; rotate: number };
export type AnonSwitchScheme = {
  width: number;
  height: number;
  radius: number;
  off: { bg: string; border: Edge };
  on: { bg: string; border: Edge };
  transitions: Transition[];
  hitSlop: Insets;
  pressedScale: number;
  knob: {
    size: number;
    inset: number;
    off: string;
    on: string;
    onX: number;
    transitions: Transition[];
    // With reduce motion (v46: `.anon-sw .knob,.anon-sw svg{transition:none}`).
    reduced: Transition[];
  };
  icon: { size: number; transitions: Transition[]; reduced: Transition[] };
  photo: { off: IconState; on: IconState };
  anon: { off: IconState; on: IconState };
  used: {
    border: Edge;
    lock: {
      size: number;
      right: number;
      bottom: number;
      border: Edge;
      bg: string;
      // The lock's drawing (its `url()`), as wide as `image` of the badge, in `color`.
      image: number;
      color: string;
    };
  };
};

const iconState = (p: Part): IconState => ({
  opacity: p.opacity,
  scale: p.transform?.scale ?? 1,
  rotate: p.transform?.rotate ?? 0,
});

export function anonSwitchScheme(
  off: Element,
  on: Element,
  used: Element,
  pressed: Pressed,
  reduced: Element,
): AnonSwitchScheme {
  const knob = find(off, 'span.knob', 'anonim');
  const knobOn = find(on, 'span.knob', 'anonim-acik');
  const photo = find(off, 'svg.k-photo', 'anonim');
  const at = need(knob.absolute, 'anon knob inset');
  const badge = need(used.look.badge, 'used lock');
  return {
    width: off.box[0],
    height: off.box[1],
    radius: need(off.look.radius, 'anon radius'),
    off: { bg: need(off.look.bg, 'anon off'), border: edge(off.look.border, 'anon off') },
    on: { bg: need(on.look.bg, 'anon on'), border: edge(on.look.border, 'anon on') },
    transitions: styled(off.transitions),
    hitSlop: need(off.hitSlop, 'anon touch'),
    pressedScale: pressed.transform?.scale ?? 1,
    knob: {
      size: knob.box[0],
      inset: at.left,
      off: need(knob.bg, 'anon knob'),
      on: need(knobOn.bg, 'anon knob on'),
      onX: moveX(knobOn.transform, 'anon knob on'),
      transitions: styled(knob.transitions),
      reduced: styled(find(reduced, 'span.knob', 'anonim reduced').transitions),
    },
    // The face's size where it shows (the other is drawn small: `scale(.4)`).
    icon: {
      size: photo.box[0],
      transitions: styled(photo.transitions),
      reduced: styled(find(reduced, 'svg.k-photo', 'anonim reduced').transitions),
    },
    photo: { off: iconState(photo), on: iconState(find(on, 'svg.k-photo', 'anonim-acik')) },
    anon: {
      off: iconState(find(off, 'svg.k-anon', 'anonim')),
      on: iconState(find(on, 'svg.k-anon', 'anonim-acik')),
    },
    used: {
      border: edge(used.look.border, 'used edge'),
      lock: {
        size: badge.box[0],
        right: badge.right,
        bottom: badge.bottom,
        border: edge(badge.border, 'lock edge'),
        bg: badge.bg,
        image: px(badge.imageSize.split(/\s+/)[0], 'lock size'),
        color: lockDrawing(need(badge.image, 'lock picture')).color,
      },
    },
  };
}

// The faces on the knob, the same in both schemes.
export function anonIcons(on: Element): { photo: Drawing; anon: Drawing } {
  return {
    photo: drawingOf(find(on, 'svg.k-photo', 'anonim-acik')),
    anon: drawingOf(find(on, 'svg.k-anon', 'anonim-acik')),
  };
}

// The lock in `.anon-sw.used::before` (a CSS `url("data:image/svg+xml,…")`): v46's own drawing,
// one colour, drawn in `currentColor` and that colour apart.
export function lockDrawing(image: string): { drawing: Drawing; color: string } {
  const m = /^url\("data:image\/svg\+xml,(.+)"\)$/.exec(image.trim());
  if (!m?.[1]) throw new Error(`lock: ${image.slice(0, 60)}`);
  const svg = decodeURIComponent(m[1]);
  const viewBox = /viewBox='([^']+)'/.exec(svg)?.[1]?.split(/\s+/).map(Number);
  if (!viewBox || viewBox.length !== 4) throw new Error('lock: no viewBox');
  const colours = new Set<string>();
  const nodes: SvgNode[] = [...svg.matchAll(/<(rect|path)\s([^>]*?)\/>/g)].map((n) => {
    const read: Record<string, string | number> = {};
    for (const [, k, v] of (n[2] ?? '').matchAll(/([\w-]+)='([^']*)'/g)) {
      if (k && v !== undefined) read[k] = /^-?\d+(\.\d+)?$/.test(v) ? Number(v) : v;
    }
    const { fill, stroke, 'stroke-width': width, ...attrs } = read;
    // A paint in the url is the drawing's one colour (`#fff` written short there).
    const paint = (v: string | number | undefined, fallback: 'currentColor' | null) => {
      if (v === undefined) return fallback;
      if (v === 'none') return null;
      const c = String(v).replace(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/i, '#$1$1$2$2$3$3');
      colours.add(parseColor(c));
      return 'currentColor';
    };
    return {
      tag: n[1] ?? '',
      cls: null,
      attrs,
      // Where the url leaves a paint out, SVG's defaults: a fill (here the drawing's one colour), no
      // stroke, 1 wide, butt caps and mitred joins.
      fill: paint(fill, 'currentColor'),
      stroke: paint(stroke, null),
      strokeWidth: typeof width === 'number' ? width : 1,
      lineCap: 'butt',
      lineJoin: 'miter',
      opacity: 1,
    };
  });
  if (colours.size !== 1 || !nodes.length) throw new Error('lock: not one colour');
  return {
    drawing: {
      viewBox: viewBox as unknown as readonly [number, number, number, number],
      clips: [],
      gradients: [],
      nodes: nodes.map(({ cls, ...n }) => {
        void cls;
        return n;
      }),
    },
    color: [...colours][0] ?? '',
  };
}

export type FormScheme = {
  textField: TextFieldScheme;
  phone: PhoneFieldScheme;
  code: CodeFieldScheme;
  error: Text;
  notice: NoticeScheme;
  select: SelectScheme;
  textArea: TextAreaScheme;
  switch: SwitchScheme;
  anon: AnonSwitchScheme;
};
