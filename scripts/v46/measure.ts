// The in-page readers below run in Chromium.
/// <reference lib="dom" />
// What the v46 inventory does not write down, measured from v46 the way the inventory was: live
// getComputedStyle in Chromium (docs/decisions/v46-native-3b-dugmeler.md). For each inventory
// component, in both schemes at 360×740 (the gallery copy, `?page=galeri`): the box's gap,
// alignment, padding and font, its transitions, its look while pressed (`:active` forced through
// the DevTools protocol, whether or not the gallery shows a pressed copy) and its parts (icons with
// their drawing and every shape's paint, labels with their font). With the system asking for less
// motion (light). At 320×568, v46's own small-screen check (`?s=<state>`, the real screen): what
// v46's `max-width` rules change. The parts of v46's screens the inventory does not list
// (scripts/v46/screenParts.ts: the navigation) go through the same passes on their real screen.
// The page gets the app's own font files and Roboto for `system-ui`, as the visual gate draws v46
// (scripts/visual/prototype.ts).
//
// Output docs/design/v46/olcum/skall-v46-olcum.json, read by `pnpm tokens`. Not part of CI (the
// output is committed); run it again when v46 changes:
//   PLAYWRIGHT_CHROMIUM=<chromium> node --experimental-strip-types scripts/v46/measure.ts
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { type Browser, chromium, type ElementHandle, type Page } from 'playwright';

import { GATE_NOW } from '../../apps/mobile/src/features/design/gorsel/deterministic.ts';
import { appFonts, fontFaces, withRoboto } from '../visual/prototype.ts';
import { readInventory } from './inventory.ts';
import { SCREEN_PARTS, type ScreenPart } from './screenParts.ts';

export const MEASURE_OUT = 'docs/design/v46/olcum/skall-v46-olcum.json';
const GALLERY = 'docs/design/v46/skall-masa-deneme-v46-galeri.html';
const FONT_HOST = 'https://fonts.gstatic.com/olcum/';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const inventory = readInventory(root);
const fonts = appFonts(root);
const fontFiles = new Map(fonts.map((f) => [`${FONT_HOST}${f.name}.ttf`, f.file]));
const galleryFile = join(root, GALLERY);
const BUTTONS = 'Düğmeler';
// The groups whose real screen is read too (transitions where used, the motion rules that reach
// them): their motion test reads it.
const REAL_GROUPS = new Set([BUTTONS, 'Sekme çubuğu', ...SCREEN_PARTS.map((p) => p.group)]);
// v46's state classes read as a look of their own (the gallery copies only the resting look).
const STATE_CLASSES: Record<string, string[]> = { gonder: ['ready'] };
// Every motion rule of the inventory, by its selector: transitions, animations (and their
// reduced-motion overrides) and the press looks.
const MOTION_RULES = [
  ...inventory.motion.transitions.map((r) => ({ kind: 'transition', selector: r.selector })),
  ...inventory.motion.animation_rules.map((r) => ({ kind: 'animation', selector: r.selector })),
  ...inventory.interaction.press_feedback.map((r) => ({ kind: 'press', selector: r.selector })),
];
const galleryUrl = pathToFileURL(galleryFile).href;

type Viewport = { width: number; height: number };

async function open(
  browser: Browser,
  query: string,
  viewport: Viewport,
  reducedMotion: 'reduce' | 'no-preference' = 'no-preference',
): Promise<Page> {
  const context = await browser.newContext({ viewport, reducedMotion, locale: 'tr-TR' });
  // v46's clock, timers and animation frames only move when this script moves them: its JS-drawn
  // parts (the loader, the icons' springs) are read at the same frame on every run.
  await context.clock.install({ time: GATE_NOW });
  await context.route('**/*', async (route) => {
    const url = route.request().url();
    if (url.startsWith(galleryUrl)) {
      return route.fulfill({
        contentType: 'text/html; charset=utf-8',
        body: withRoboto(readFileSync(galleryFile, 'utf8')),
      });
    }
    if (url.startsWith('file:')) return route.continue();
    if (url.startsWith('https://fonts.googleapis.com/')) {
      return route.fulfill({
        contentType: 'text/css',
        body: fontFaces(fonts).replaceAll('https://fonts.gstatic.com/gorsel/', FONT_HOST),
      });
    }
    const file = fontFiles.get(url);
    if (file) return route.fulfill({ contentType: 'font/ttf', body: readFileSync(file) });
    return route.abort();
  });
  const page = await context.newPage();
  await page.goto(`${galleryUrl}?${query}`);
  for (let t = 0; !(await page.evaluate(() => document.documentElement.dataset.ready)); t += 100) {
    if (t > 60_000) throw new Error(`v46 not ready: ${query}`);
    await page.clock.runFor(100);
  }
  await page.evaluate(() => document.fonts.ready);
  // Every face of the app's families, or the sizes below would be of a fallback font.
  const missing = await page.evaluate(async (wanted) => {
    const bad: string[] = [];
    for (const f of wanted) {
      const faces = await document.fonts.load(`${f.weight} 16px "${f.family}"`);
      if (!faces.some((face) => face.status === 'loaded')) bad.push(`${f.family} ${f.weight}`);
    }
    return bad;
  }, fonts);
  if (missing.length) throw new Error(`fonts not loaded: ${missing.join(', ')}`);
  return page;
}

// Runs in the page: the measurable parts of one element.
function readElement(el: Element) {
  const round = (v: number) => Math.round(v * 1000) / 1000;
  const px = (v: string) => (v === 'normal' || v === 'auto' || v === '' ? v : round(parseFloat(v)));
  const transitions = (cs: CSSStyleDeclaration) => {
    const props = cs.transitionProperty.split(',').map((s) => s.trim());
    const durs = cs.transitionDuration.split(',').map((s) => s.trim());
    const delays = cs.transitionDelay.split(',').map((s) => s.trim());
    const eases = cs.transitionTimingFunction.split(/,(?![^(]*\))/).map((s) => s.trim());
    return props
      .map((prop, i) => ({
        prop,
        ms: round(parseFloat(durs[i % durs.length] ?? '0') * 1000),
        delayMs: round(parseFloat(delays[i % delays.length] ?? '0') * 1000),
        ease: eases[i % eases.length] ?? 'ease',
      }))
      .filter((t) => t.ms > 0);
  };
  const label = (n: Element) =>
    n.tagName.toLowerCase() +
    (n.getAttribute('class')
      ? '.' + (n.getAttribute('class') ?? '').trim().split(/\s+/).join('.')
      : '');
  const box = (n: Element) => {
    const r = n.getBoundingClientRect();
    return [round(r.width), round(r.height)];
  };
  const ownText = (n: Element) =>
    [...n.childNodes]
      .filter((c) => c.nodeType === 3)
      .map((c) => (c.textContent ?? '').trim())
      .join(' ')
      .trim();
  const textOf = (n: Element, cs: CSSStyleDeclaration) => ({
    text: ownText(n),
    font: `${cs.fontSize}/${cs.fontWeight}/${cs.lineHeight}`,
    letterSpacing: cs.letterSpacing,
    color: cs.color,
  });
  const cs = getComputedStyle(el);
  const image = (c: CSSStyleDeclaration) =>
    c.backgroundImage && c.backgroundImage !== 'none' ? { bgImage: c.backgroundImage } : {};
  const edge = (c: CSSStyleDeclaration) =>
    parseFloat(c.borderTopWidth) > 0
      ? { border: { width: px(c.borderTopWidth), color: c.borderTopColor } }
      : {};
  // A pseudo-element that draws (a pinned head's fade below it: `.dhd::after`).
  const after = getComputedStyle(el, '::after');
  const drawnAfter =
    after.content !== 'none' &&
    ((after.backgroundImage && after.backgroundImage !== 'none') ||
      after.backgroundColor !== 'rgba(0, 0, 0, 0)')
      ? {
          after: {
            height: px(after.height),
            top: px(after.top),
            bg: after.backgroundColor,
            ...image(after),
          },
        }
      : {};
  const r = el.getBoundingClientRect();
  const self = {
    box: box(el),
    // Where it is in the viewport (a bar pinned to the screen's edge: the tab bar).
    at: [round(r.left), round(r.top)],
    bg: cs.backgroundColor,
    ...image(cs),
    ...edge(cs),
    radius: cs.borderRadius,
    shadow: cs.boxShadow,
    ...(cs.backdropFilter && cs.backdropFilter !== 'none' ? { backdrop: cs.backdropFilter } : {}),
    ...drawnAfter,
    display: cs.display,
    textAlign: cs.textAlign,
    padding: cs.padding,
    font: `${cs.fontSize}/${cs.fontWeight}/${cs.lineHeight}`,
    minHeight: cs.minHeight,
    gap: px(cs.columnGap),
    justifyContent: cs.justifyContent,
    alignItems: cs.alignItems,
    transitions: transitions(cs),
    ...(ownText(el) ? textOf(el, cs) : {}),
  };
  const SHAPES = ['rect', 'path', 'polyline', 'circle', 'line', 'ellipse'];
  const DEFS = ['defs', 'clippath', 'lineargradient', 'radialgradient'];
  const GEOMETRY = ['d', 'points', 'x', 'y', 'width', 'height', 'rx', 'ry', 'cx', 'cy', 'r'];
  const GEOMETRY_ALL = [...GEOMETRY, 'x1', 'y1', 'x2', 'y2', 'transform'];
  const GRADIENT = ['x1', 'y1', 'x2', 'y2', 'cx', 'cy', 'r', 'fx', 'fy', 'gradientUnits'];
  const parts: unknown[] = [];
  const walk = (n: Element, depth: number) => {
    for (const c of n.children) {
      const tag = c.tagName.toLowerCase();
      const ccs = getComputedStyle(c);
      if (tag === 'svg') {
        // The drawing as v46 has it: every node with its geometry attributes, and each shape's
        // computed paint. A clip path or gradient is referred to by its index in the svg.
        const clips = [...c.querySelectorAll('clipPath')];
        const gradients = [...c.querySelectorAll('linearGradient, radialGradient')];
        const paintOf = (v: string) => {
          const ref = /url\("?#([^")]+)"?\)/.exec(v);
          if (!ref) return v;
          const i = gradients.findIndex((g) => g.id === ref[1]);
          if (i < 0) throw new Error(`paint refers to a gradient outside its svg: ${v}`);
          return { gradient: i };
        };
        const node = (k: Element): unknown => {
          const t = k.tagName.toLowerCase();
          const attrs: Record<string, string> = {};
          for (const a of GEOMETRY_ALL) {
            const v = k.getAttribute(a);
            if (v !== null) attrs[a] = v;
          }
          const clipRef = /url\(#([^)]+)\)/.exec(k.getAttribute('clip-path') ?? '');
          const clip = clipRef ? clips.findIndex((x) => x.id === clipRef[1]) : -1;
          const kids = [...k.children].filter((x) => !DEFS.includes(x.tagName.toLowerCase()));
          const scs = getComputedStyle(k);
          // The transform the node is drawn with: its computed one (the `transform` attribute, or
          // a CSS rule over it, like `.send-ic rect`), about its computed origin, as an SVG
          // transform. A CSS transform-origin is relative to the shape's box with `fill-box`.
          if (scs.transform !== 'none') {
            const [ox = 0, oy = 0] = scs.transformOrigin.split(' ').map((v) => parseFloat(v));
            const bb =
              scs.transformBox === 'fill-box' && 'getBBox' in k
                ? (k as SVGGraphicsElement).getBBox()
                : { x: 0, y: 0 };
            const cx = round(bb.x + ox);
            const cy = round(bb.y + oy);
            const m = scs.transform.replace('matrix(', '').replace(')', '').split(',').map(Number);
            attrs.transform =
              `translate(${cx} ${cy}) matrix(${m.map(round).join(' ')}) ` +
              `translate(${-cx} ${-cy})`;
          } else {
            delete attrs.transform;
          }
          return {
            tag: t,
            cls: k.getAttribute('class'),
            attrs,
            ...(clip >= 0 ? { clip } : {}),
            ...(SHAPES.includes(t)
              ? {
                  fill: paintOf(scs.fill),
                  stroke: paintOf(scs.stroke),
                  strokeWidth: px(scs.strokeWidth),
                  lineCap: scs.strokeLinecap,
                  lineJoin: scs.strokeLinejoin,
                  opacity: Number(scs.opacity),
                }
              : {}),
            ...(t === 'g' || kids.length ? { children: kids.map(node) } : {}),
            // A node's own transition (the Mekan tab's capsules: `.vt-a,.vt-b`), with the delay a
            // state gives it (`.is-active .vt-x`).
            ...(transitions(scs).length ? { transitions: transitions(scs) } : {}),
          };
        };
        parts.push({
          part: label(c),
          depth,
          box: box(c),
          display: ccs.display,
          color: ccs.color,
          opacity: Number(ccs.opacity),
          transform: ccs.transform,
          transformOrigin: ccs.transformOrigin,
          transitions: transitions(ccs),
          viewBox: c.getAttribute('viewBox'),
          clips: clips.map((k) => [...k.children].map(node)),
          gradients: gradients.map((g) => ({
            tag: g.tagName,
            attrs: Object.fromEntries(
              GRADIENT.flatMap((a) => {
                const v = g.getAttribute(a);
                return v === null ? [] : [[a, v]];
              }),
            ),
            stops: [...g.querySelectorAll('stop')].map((st) => {
              const sc = getComputedStyle(st);
              return {
                offset: st.getAttribute('offset'),
                color: sc.stopColor,
                opacity: Number(sc.stopOpacity),
              };
            }),
          })),
          nodes: [...c.children].filter((k) => !DEFS.includes(k.tagName.toLowerCase())).map(node),
        });
        continue;
      }
      parts.push({
        part: label(c),
        depth,
        box: box(c),
        display: ccs.display,
        position: ccs.position,
        ...(ccs.position === 'absolute'
          ? { inset: [ccs.top, ccs.right, ccs.bottom, ccs.left].map(px) }
          : {}),
        bg: ccs.backgroundColor,
        ...image(ccs),
        ...edge(ccs),
        radius: ccs.borderRadius,
        shadow: ccs.boxShadow,
        padding: ccs.padding,
        ...(ccs.display === 'flex' || ccs.display === 'inline-flex'
          ? { flex: [ccs.flexDirection, ccs.justifyContent, ccs.alignItems, px(ccs.columnGap)] }
          : {}),
        opacity: Number(ccs.opacity),
        transform: ccs.transform,
        transitions: transitions(ccs),
        ...(ownText(c) ? textOf(c, ccs) : {}),
      });
      if (depth < 3) walk(c, depth + 1);
    }
  };
  walk(el, 1);
  return { self, parts };
}

type Reading = ReturnType<typeof readElement>;

// Runs in the page: the look that changes while pressed, of the element and of its parts (a rule
// like `.nbell:active .nb-ic` turns a part only), the parts in the order readElement lists them.
function readPressed(el: Element) {
  const cs = getComputedStyle(el);
  const parts: { transform: string; opacity: number }[] = [];
  const walk = (n: Element, depth: number) => {
    for (const c of n.children) {
      const ccs = getComputedStyle(c);
      parts.push({ transform: ccs.transform, opacity: Number(ccs.opacity) });
      if (c.tagName.toLowerCase() !== 'svg' && depth < 3) walk(c, depth + 1);
    }
  };
  walk(el, 1);
  return {
    transform: cs.transform,
    opacity: Number(cs.opacity),
    background: cs.backgroundColor,
    boxShadow: cs.boxShadow,
    color: cs.color,
    parts,
  };
}

// Runs in the page: the size v46 gives its button loader (`.ld.mini`) in this button while busy
// (\`.hb .ld.mini\` is smaller than the primary's). The loader is put in, read and taken out again.
function readBusyLoader(el: Element) {
  const wasBusy = el.classList.contains('busy');
  el.classList.add('busy');
  const ld = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  ld.setAttribute('class', 'ld mini');
  el.appendChild(ld);
  const cs = getComputedStyle(ld);
  const size = [parseFloat(cs.width), parseFloat(cs.height)];
  ld.remove();
  if (!wasBusy) el.classList.remove('busy');
  return size;
}

// Runs in the page: which of the inventory's motion rules (transitions, animations, press looks)
// reach this element or a part of it, in the screen it is used in, as it is or with one of v46's
// state classes on the element or a part (\`nope\`, \`shoot\`, \`ring\`, \`bump\`, \`ready\`, \`busy\`, and
// the selection classes \`is-active\` and \`on\`), with the part's own subtree (\`.is-active .vt-all\`).
// A rule for \`:active\` is tried without it.
function readMatches(el: Element, rules: { kind: string; selector: string }[]) {
  const STATES = [null, 'nope', 'shoot', 'ring', 'bump', 'ready', 'busy', 'is-active', 'on'];
  const label = (n: Element) =>
    n === el
      ? 'self'
      : n.tagName.toLowerCase() +
        (n.getAttribute('class')
          ? '.' + (n.getAttribute('class') ?? '').trim().split(/\s+/).join('.')
          : '');
  const split = (sel: string) => {
    const out: string[] = [];
    let depth = 0;
    let start = 0;
    for (let i = 0; i < sel.length; i++) {
      if (sel[i] === '(') depth++;
      else if (sel[i] === ')') depth--;
      else if (sel[i] === ',' && depth === 0) {
        out.push(sel.slice(start, i));
        start = i + 1;
      }
    }
    out.push(sel.slice(start));
    return out.map((x) => x.trim().replace(/:(active|hover|focus-visible|focus)\b/g, ''));
  };
  const nodes = [el, ...el.querySelectorAll('*')];
  // Each node's name as it is, before any state class goes on.
  const names = new Map(nodes.map((n) => [n, label(n)]));
  const found: { kind: string; selector: string; target: string; state: string | null }[] = [];
  // A rule is listed once per node: as it is, or else with the first state class that brings it.
  const test = (n: Element, state: string | null) => {
    const target = names.get(n) ?? label(n);
    for (const r of rules) {
      if (
        found.some((f) => f.selector === r.selector && f.target === target && f.kind === r.kind)
      ) {
        continue;
      }
      for (const one of split(r.selector)) {
        if (one.includes('::')) continue;
        let hit = false;
        try {
          hit = n.matches(one);
        } catch {
          hit = false;
        }
        if (hit) {
          found.push({ kind: r.kind, selector: r.selector, target, state });
          break;
        }
      }
    }
  };
  // A state class sits on the button (`.send.shoot .sg`, `.nbell.ring .nb-ic`) or on the part it
  // moves (`.nb-bdg.bump`).
  for (const state of STATES) {
    for (const holder of state ? nodes : [el]) {
      const had = state ? holder.classList.contains(state) : true;
      if (state && !had) holder.classList.add(state);
      for (const n of holder === el ? nodes : [holder, ...holder.querySelectorAll('*')]) {
        test(n, state);
      }
      if (state && !had) holder.classList.remove(state);
    }
  }
  return found;
}

async function pressed(page: Page, selector: string) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('DOM.enable');
  await cdp.send('CSS.enable');
  const { root: doc } = await cdp.send('DOM.getDocument', { depth: 0 });
  const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: doc.nodeId, selector });
  await cdp.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: ['active'] });
  await page.clock.runFor(100);
  const look = await page.locator(selector).evaluate(readPressed);
  await cdp.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: [] });
  await cdp.detach();
  return look;
}

// The same element read on two pages: everything from the still one (`anim=0`, v46's own switch:
// every animation and transition at 0, so nothing is caught mid-flight and a forced `:active` shows
// at once), the transitions from the moving one.
type DrawnNode = { transitions?: unknown; children?: DrawnNode[] };
function withTransitions(still: Reading, moving: Reading): Reading {
  // An svg's nodes take theirs from the same node on the moving page (the trees are the same).
  const nodes = (a: DrawnNode[], b: DrawnNode[] | undefined): DrawnNode[] =>
    a.map((n, i) => {
      const m = b?.[i];
      const out: DrawnNode = { ...n };
      delete out.transitions;
      if (m?.transitions) out.transitions = m.transitions;
      if (n.children) out.children = nodes(n.children, m?.children);
      return out;
    });
  return {
    self: { ...still.self, transitions: moving.self.transitions },
    parts: still.parts.map((p, i) => {
      const m = moving.parts[i] as { transitions?: unknown; nodes?: DrawnNode[] } | undefined;
      const own = p as { nodes?: DrawnNode[] };
      return {
        ...(p as object),
        transitions: m?.transitions ?? [],
        ...(own.nodes ? { nodes: nodes(own.nodes, m?.nodes) } : {}),
      };
    }),
  };
}

// The inventory's extra steps and its `selector@@n`, run by the gallery's own `__step` and
// `__pick` (the n-th visible match, outside the demo strip).
async function pick(
  page: Page,
  c: { extra_steps: string[]; selector_in_state: string },
): Promise<ElementHandle<Element> | null> {
  // Each step waits on the page's (stopped) clock: run it on until the step is done.
  for (const step of c.extra_steps) {
    await page.evaluate((s) => {
      const w = window as unknown as { __step: (s: string) => Promise<void>; __stepDone?: boolean };
      w.__stepDone = false;
      void w.__step(s).then(() => (w.__stepDone = true));
    }, step);
    for (
      let t = 0;
      !(await page.evaluate(() => (window as { __stepDone?: boolean }).__stepDone));
      t += 50
    ) {
      if (t > 10_000) throw new Error(`v46 step did not finish: ${step}`);
      await page.clock.runFor(50);
    }
  }
  const handle = await page.evaluateHandle(
    (sel) => (window as unknown as { __pick: (s: string) => Element | null }).__pick(sel),
    c.selector_in_state,
  );
  return handle.asElement();
}

// The element read with each of its state classes on, one after the other (still page).
async function stateReadings(page: Page, selector: string, classes: string[]) {
  const states: Record<string, Reading> = {};
  for (const cls of classes) {
    await page.locator(selector).evaluate((el, k) => el.classList.add(k), cls);
    states[cls] = await page.locator(selector).evaluate(readElement);
    await page.locator(selector).evaluate((el, k) => el.classList.remove(k), cls);
  }
  return states;
}

// A screen part's element on its real screen (screenParts.ts), marked so that the steps after can
// find it by a selector.
async function openPart(
  browser: Browser,
  c: ScreenPart,
  query: string,
  viewport: Viewport,
  reducedMotion: 'reduce' | 'no-preference' = 'no-preference',
) {
  const page = await open(browser, `s=${c.source_state}&${query}`, viewport, reducedMotion);
  const ok = await page.evaluate(() => document.documentElement.dataset.stateOk === '1');
  const el = ok ? await pick(page, c) : null;
  if (!el) throw new Error(`no ${c.selector_in_state} in ${c.source_state} (${c.id})`);
  await el.evaluate((e, id) => e.setAttribute('data-olcum', id), c.id);
  return { page, sel: `[data-olcum="${c.id}"]` };
}

const browser = await chromium.launch(
  process.env.PLAYWRIGHT_CHROMIUM ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM } : {},
);
const out: Record<string, Record<string, unknown>> = {};
try {
  const wide = { width: 360, height: 740 };
  for (const scheme of ['light', 'dark'] as const) {
    const still = await open(browser, `page=galeri&theme=${scheme}&demo=0&anim=0`, wide);
    const moving = await open(browser, `page=galeri&theme=${scheme}&demo=0`, wide);
    for (const c of inventory.components) {
      const sel = `[data-gal-el="${c.id}"]`;
      const entry = (out[c.id] ??= { name: c.name, group: c.group });
      entry[scheme] = {
        ...withTransitions(
          await still.locator(sel).evaluate(readElement),
          await moving.locator(sel).evaluate(readElement),
        ),
        pressed: await pressed(still, sel),
        busyLoader: c.group === BUTTONS ? await still.locator(sel).evaluate(readBusyLoader) : null,
        states: await stateReadings(still, sel, STATE_CLASSES[c.id] ?? []),
      };
    }
    await still.context().close();
    await moving.context().close();
    for (const c of SCREEN_PARTS) {
      const still = await openPart(browser, c, `theme=${scheme}&demo=0&anim=0`, wide);
      const moving = await openPart(browser, c, `theme=${scheme}&demo=0`, wide);
      const entry = (out[c.id] ??= { name: c.name, group: c.group });
      entry[scheme] = {
        ...withTransitions(
          await still.page.locator(still.sel).evaluate(readElement),
          await moving.page.locator(moving.sel).evaluate(readElement),
        ),
        pressed: await pressed(still.page, still.sel),
        busyLoader: null,
        states: {},
      };
      await still.page.context().close();
      await moving.page.context().close();
    }
  }
  // With the system asking for less motion (Chromium's `prefers-reduced-motion: reduce`), light.
  const still = await open(browser, 'page=galeri&theme=light&demo=0&anim=0', wide, 'reduce');
  const moving = await open(browser, 'page=galeri&theme=light&demo=0', wide, 'reduce');
  for (const c of inventory.components) {
    const sel = `[data-gal-el="${c.id}"]`;
    (out[c.id] as Record<string, unknown>).reduced = withTransitions(
      await still.locator(sel).evaluate(readElement),
      await moving.locator(sel).evaluate(readElement),
    );
  }
  await still.context().close();
  await moving.context().close();
  for (const c of SCREEN_PARTS) {
    const still = await openPart(browser, c, 'theme=light&demo=0&anim=0', wide, 'reduce');
    const moving = await openPart(browser, c, 'theme=light&demo=0', wide, 'reduce');
    (out[c.id] as Record<string, unknown>).reduced = withTransitions(
      await still.page.locator(still.sel).evaluate(readElement),
      await moving.page.locator(moving.sel).evaluate(readElement),
    );
    await still.page.context().close();
    await moving.page.context().close();
  }
  // The small screen, in the real state (light; v46's narrow rules do not depend on the scheme).
  for (const c of [...inventory.components, ...SCREEN_PARTS]) {
    const page = await open(browser, `s=${c.source_state}&theme=light&demo=0&anim=0`, {
      width: 320,
      height: 568,
    });
    const ok = await page.evaluate(() => document.documentElement.dataset.stateOk === '1');
    const el = ok ? await pick(page, c) : null;
    (out[c.id] as Record<string, unknown>).narrow = el ? await el.evaluate(readElement) : null;
    await page.context().close();
  }
  // In the real screen (light, 360, motion on): the transitions the element has where it is used,
  // and which of the inventory's motion rules reach it (the buttons' motion test reads these).
  for (const c of [...inventory.components, ...SCREEN_PARTS]) {
    if (!REAL_GROUPS.has(c.group)) continue;
    const page = await open(browser, `s=${c.source_state}&theme=light&demo=0`, wide);
    const ok = await page.evaluate(() => document.documentElement.dataset.stateOk === '1');
    const el = ok ? await pick(page, c) : null;
    const entry = out[c.id] as Record<string, unknown>;
    entry.real = el ? await el.evaluate(readElement) : null;
    entry.matches = el ? await el.evaluate(readMatches, MOTION_RULES) : null;
    await page.context().close();
  }
} finally {
  await browser.close();
}

const source = readFileSync(join(root, 'docs/design/v46', inventory.meta.source));
const result = {
  meta: {
    source: inventory.meta.source,
    source_sha256: createHash('sha256').update(source).digest('hex'),
    gallery: 'skall-masa-deneme-v46-galeri.html',
    script: 'scripts/v46/measure.ts',
    viewport:
      '360x740 (page=galeri; reduced: light), narrow 320x568 (s=<state>, light), ' +
      'real 360x740 (s=<state>, light, motion on: transitions and matched motion rules); ' +
      'screen parts (scripts/v46/screenParts.ts) in their real state for every pass',
    fonts: "the app's own files (apps/mobile/src/theme/fonts.ts), Roboto for system-ui",
  },
  components: out,
};
mkdirSync(dirname(join(root, MEASURE_OUT)), { recursive: true });
writeFileSync(join(root, MEASURE_OUT), JSON.stringify(result, null, 1) + '\n');
console.log(`Wrote ${MEASURE_OUT}`);
