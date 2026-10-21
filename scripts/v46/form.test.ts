import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  V46_BUTTON_MOTION,
  V46_EXPLORE_ICONS,
  V46_FORM as form,
  V46_FORM_ICONS,
  type V46Transition,
} from '../../apps/mobile/src/theme/parts.generated.ts';
import { V46_COMPONENTS } from '../../apps/mobile/src/theme/tokens.generated.ts';
import { lockDrawing } from './form.ts';
import { parseColor, readInventory } from './inventory.ts';
import { element, parseEase, readMeasured } from './measured.ts';
import { bundledMetrics } from './fontMetrics.ts';
import { FORM_GROUP, SCREEN_PARTS } from './screenParts.ts';

const root = resolve(import.meta.dirname, '../..');
const inventory = readInventory(root);
const measured = readMeasured(root);
const metrics = bundledMetrics(root);
const html = readFileSync(resolve(root, 'docs/design/v46', inventory.meta.source), 'utf8');
const source = (file: string) => readFileSync(resolve(root, 'apps/mobile/src/ui', file), 'utf8');
const SCHEMES = ['light', 'dark'] as const;

const REDUCED = /prefers-reduced-motion:\s*reduce/;
const seconds = (v: string | undefined) =>
  !v ? 0 : Math.round(Number(v.replace(/m?s$/, '')) * (v.endsWith('ms') ? 1 : 1000));
const rule = (selector: string): V46Transition[] => {
  const r = inventory.motion.transitions.find(
    (t) => t.selector === selector && !REDUCED.test(t.media),
  );
  if (!r) throw new Error(`no transition rule ${selector}`);
  return r.parts.map((p) => ({
    prop: p.prop,
    ms: seconds(p.dur),
    delayMs: seconds(p.delay),
    ease: parseEase(p.ease || 'ease'),
  }));
};
const hasRule = (selector: string) =>
  inventory.motion.transitions.some((t) => t.selector === selector && !REDUCED.test(t.media));
const reading = (id: string, s: (typeof SCHEMES)[number]) => {
  const m = measured.components[id];
  if (!m) throw new Error(`no measurement of ${id}`);
  return element(m[s], metrics);
};
const look = (id: string) => {
  const c = inventory.components.find((x) => x.id === id);
  if (!c) throw new Error(`no inventory component ${id}`);
  return c;
};
// Whether a rule stands in v46's `prefers-reduced-motion: reduce` block.
const inReduced = (css: string) => {
  const at = html.indexOf(css);
  const media = html.lastIndexOf('@media', at);
  return at >= 0 && html.slice(media, at).startsWith('@media (prefers-reduced-motion:reduce)');
};

describe("v46's form parts", () => {
  it('are measured, their own states on their real screen', () => {
    const parts = SCREEN_PARTS.filter((p) => p.group === FORM_GROUP).map((p) => p.id);
    expect(parts.length).toBeGreaterThan(0);
    for (const id of parts) expect(measured.components[id]?.real, id).toBeTruthy();
    for (const c of inventory.components.filter((x) => x.group === FORM_GROUP)) {
      expect(measured.components[c.id]?.real, c.id).toBeTruthy();
    }
  });

  it('draw the text field as `.sup-field`: the label above, the box changing at once on focus', () => {
    for (const s of SCHEMES) {
      const f = form[s].textField;
      const inv = look('alan-isim')[s];
      expect(f.box.height + f.label.font.lineHeight + f.gap).toBe(Number.parseFloat(inv.height));
      expect(f.label.font).toEqual({ size: 12, weight: 800, lineHeight: 16 });
      expect(f.text.font.size).toBe(18);
      expect(f.box.focus.border.color).toBe('#6A47F5');
      expect(f.box.idle.shadow).toBeNull();
      expect(f.box.focus.shadow).toMatch(/^0px 0px 0px 4px /);
      // v46 eases none of the sign-up's fields: the edge and the ring change at once.
      expect(f.box.transitions).toEqual([]);
    }
    expect(hasRule('.sup-field input')).toBe(false);
    expect(html).toContain('.sup-field input:focus{border-color:#6A47F5;box-shadow:0 0 0 4px');
    const filled = measured.components['alan-isim-dolu']?.light.parts.find(
      (p) => p.part === 'input',
    );
    expect(filled?.field?.value).toBe('Elif');
  });

  it("give the name field the other fields' placeholder colour (v46 leaves it the browser's)", () => {
    expect(html).not.toMatch(/\.sup-field input::placeholder/);
    for (const s of SCHEMES) {
      const own = reading('alan-isim', s).parts.find((p) => p.part === 'input')?.field;
      expect(own?.placeholderColor).toBe('#757575');
      expect(form[s].textField.text.placeholderColor).toBe(form[s].phone.text.placeholderColor);
      expect(form[s].textArea.text.placeholderColor).toBe(form[s].phone.text.placeholderColor);
    }
    expect(form.light.phone.text.placeholderColor).toBe('#6E6890');
  });

  it('draw the phone field as `.sup-phone`: +90, then the number in even digits', () => {
    for (const s of SCHEMES) {
      const p = form[s].phone;
      expect(p.box.height).toBe(Number.parseFloat(look('alan-telefon')[s].height));
      expect(p.box.radius).toBe(20);
      expect(p.box.bg).toBe(parseColor(look('alan-telefon')[s].bg));
      expect(p.text.tabular).toBe(true);
      expect(p.text.letterSpacing).toBe(0.3);
      expect(p.box.focus.border.color).toBe('#6A47F5');
    }
    expect(html).toMatch(/\.sup-phone input\{[^}]*font-variant-numeric:tabular-nums/);
    expect(html).toContain('.sup-phone:focus-within');
    const typed = reading('alan-telefon-dolu', 'light').parts.find((p) => p.part === 'input');
    expect(typed?.field?.value).toBe('532 123 45 67');
  });

  it('draw the code as `.otp`: six even boxes, the next one in focus', () => {
    for (const s of SCHEMES) {
      const c = form[s].code;
      expect(c.cells).toBe(6);
      expect(c.gap).toBe(8);
      expect(c.cell.height).toBe(Number.parseFloat(look('alan-kod')[s].height));
      expect(c.text).toMatchObject({ align: 'center', tabular: true });
      // Three digits typed: the fourth box has the focus look, the others rest.
      const boxes = reading('alan-kod-dolu', s).parts.filter((p) => p.part === 'input');
      expect(boxes.map((b) => b.field?.value)).toEqual(['4', '8', '2', '', '', '']);
      expect(boxes.map((b) => b.border?.color)).toEqual([
        c.cell.idle.border.color,
        c.cell.idle.border.color,
        c.cell.idle.border.color,
        c.cell.focus.border.color,
        c.cell.idle.border.color,
        c.cell.idle.border.color,
      ]);
    }
    const code = source('CodeField.tsx');
    expect(code).toMatch(/textContentType="oneTimeCode"/);
    expect(code).toMatch(/autoComplete="sms-otp"/);
    expect(code).not.toMatch(/noteTyping/);
  });

  it("draw a field's error by `.sup-err`'s own rule, which v46's sign-up pane overrides", () => {
    // On the sign-up screen `.sup-pane>p` (more specific) draws it as the pane's muted paragraph.
    expect(html).toContain(
      '.sup-err{font-size:13px;line-height:18px;font-weight:700;color:#B4281A}',
    );
    expect(html).toContain(
      '.sup-pane>p{font-size:15px;line-height:21px;font-weight:600;color:var(--muted)}',
    );
    expect(look('alan-hata').light.color).toBe('#5E5878');
    expect(form.light.error).toEqual({
      font: { size: 13, weight: 700, lineHeight: 18 },
      color: '#B4281A',
      letterSpacing: 0,
    });
    // Dark: the last of v46's `.sup-err` rules.
    expect(form.dark.error.color).toBe('#FF9C8A');
  });

  it('draw the warning box as `.sup-warn`', () => {
    for (const s of SCHEMES) {
      const n = form[s].notice;
      const inv = look('uyari')[s];
      expect(n.bg).toBe(parseColor(inv.bg));
      expect(n.text.color).toBe(parseColor(inv.color));
      expect(n.radius).toBe(Number.parseFloat(inv.radius));
      expect(n.padding).toEqual([10, 12, 10, 12]);
      expect(n.text.font).toEqual({ size: 13, weight: 700, lineHeight: 18 });
    }
  });

  it("draw the select as `.dob select`, with v46's own down arrow (the browser draws v46's)", () => {
    for (const s of SCHEMES) {
      const sel = form[s].select;
      const inv = look('alan-secim')[s];
      expect(sel.box.height).toBe(Number.parseFloat(inv.height));
      expect(sel.box.bg).toBe(parseColor(inv.bg));
      expect(sel.box.padding).toEqual([0, 8, 0, 8]);
      expect(sel.text.font).toMatchObject({ size: 16, weight: 700 });
      expect(sel.box.focus.border.color).toBe('#6A47F5');
    }
    expect(measured.components['alan-secim']?.light.self).toMatchObject({
      select: { text: 'Seç' },
    });
    expect(html).not.toMatch(/\.dob select\{[^}]*appearance:\s*none/);
    const select = source('SelectField.tsx');
    expect(select).toMatch(/V46_EXPLORE_ICONS\.down/);
    expect(V46_EXPLORE_ICONS.down.nodes.length).toBeGreaterThan(0);
  });

  it('draw the many-line field as `.ebio textarea`, its edge and ring easing', () => {
    for (const s of SCHEMES) {
      const t = form[s].textArea;
      expect(t.transitions).toEqual(rule('.ebio textarea'));
      expect(t.height).toBe(Number.parseFloat(look('alan-cok-satir')[s].height));
      expect(t.padding).toEqual([12, 14, 12, 14]);
      expect(t.focus.border.color).toBe('#7B5CFF');
      expect(t.focus.shadow).toMatch(/^0px 0px 0px 3px /);
    }
    expect(source('TextArea.tsx')).toMatch(/transitionStyle\(f\.transitions\)/);
  });

  it('draw the switch as `.vsw`: the knob slides 20, the track eases, a press does not shrink it', () => {
    for (const s of SCHEMES) {
      const w = form[s].switch;
      expect(w.off).toBe(parseColor(look('anahtar-kapali')[s].bg));
      expect(w.on).toBe(parseColor(look('anahtar-acik')[s].bg));
      expect([w.width, w.height]).toEqual([52, 32]);
      expect(w.knob.onX).toBe(20);
      expect(w.knob.transitions).toEqual(rule('.vsw i'));
      expect(w.transitions).toEqual(rule('.vsw'));
      expect(w.hitSlop).toEqual({ top: 6, right: 2, bottom: 6, left: 2 });
      expect(measured.components['anahtar-kapali']?.[s].pressed.transform).toBe('none');
    }
    expect(html).toContain('.va .vsw:active{transform:none}');
    // With reduce motion the knob moves at once (v46's own rule); the colour still eases.
    expect(inReduced('.vsw i{transition:none}')).toBe(true);
    expect(form.light.switch.knob.reduced).toEqual([]);
    // One that cannot change now is faded (v46's last `.vsw[aria-disabled]` rule).
    expect(form.light.switch.disabledOpacity).toBeLessThan(1);
    expect(reading('anahtar-pasif', 'light').opacity).toBe(form.light.switch.disabledOpacity);
    const sw = source('Switch.tsx');
    expect(sw).toMatch(/haptic\('selection'\)/);
    expect(sw).toMatch(/reduce \? k\.reduced : k\.transitions/);
  });

  it('draw the anonymous switch as `.anon-sw`: the knob slides 18 and the faces turn over', () => {
    for (const s of SCHEMES) {
      const a = form[s].anon;
      const inv = look('anonim-anahtari')[s];
      expect(a.off.bg).toBe(parseColor(inv.bg));
      expect([a.width, a.height]).toEqual([46, 28]);
      expect(a.knob.onX).toBe(18);
      expect(a.knob.transitions).toEqual(rule('.anon-sw .knob'));
      expect(a.icon.transitions).toEqual(rule('.anon-sw svg'));
      expect(a.transitions).toEqual(rule('.anon-sw'));
      expect(a.photo).toEqual({
        off: { opacity: 1, scale: 1, rotate: 0 },
        on: { opacity: 0, scale: 0.4, rotate: 20 },
      });
      expect(a.anon).toEqual({
        off: { opacity: 0, scale: 0.4, rotate: -20 },
        on: { opacity: 1, scale: 1, rotate: 0 },
      });
      expect(a.pressedScale).toBe(0.97);
      expect(a.hitSlop).toEqual({ top: 8, right: 2, bottom: 8, left: 2 });
    }
    expect(html).toContain('.anon-sw[aria-checked="true"] .knob{transform:translateX(18px)');
    expect(inReduced('.anon-sw .knob,.anon-sw svg{transition:none}')).toBe(true);
    expect(form.light.anon.knob.reduced).toEqual([]);
    expect(form.light.anon.icon.reduced).toEqual([]);
    // A press on a used one shakes it (v46's `.anon-sw.nope`).
    expect(V46_BUTTON_MOTION.nope.selector).toContain('.anon-sw.nope');
    expect(source('AnonSwitch.tsx')).toMatch(/keyframeSequence\(nope, 'translateX'\)/);
  });

  it("put the used one's lock on its corner as `.anon-sw.used::before` draws it", () => {
    expect(html).toContain(
      '.anon-sw.used::before{content:"";position:absolute;right:-5px;bottom:-5px',
    );
    for (const s of SCHEMES) {
      const u = form[s].anon.used;
      expect(u.lock).toMatchObject({ size: 16, right: -5, bottom: -5, image: 10 });
      expect(u.lock.border.width).toBe(2);
    }
    expect(form.light.anon.used.lock).toMatchObject({ bg: '#14112B', color: '#FFFFFF' });
    expect(form.dark.anon.used.lock).toMatchObject({ bg: '#F3F0FF', color: '#14112B' });
    expect(form.light.anon.used.border.color).toBe('#C9C3DA');
    // The lock: a body and a shackle, the same drawing in both schemes, in currentColor.
    expect(V46_FORM_ICONS.lock.viewBox).toEqual([0, 0, 12, 12]);
    expect(V46_FORM_ICONS.lock.nodes.map((n) => n.tag)).toEqual(['rect', 'path']);
    const light = measured.components['anonim-anahtari-kilitli']?.light.self.before?.bgImage;
    expect(lockDrawing(light ?? '').color).toBe('#FFFFFF');
  });

  it('come from the measurement, not written in the components', () => {
    for (const file of [
      'TextField.tsx',
      'PhoneField.tsx',
      'CodeField.tsx',
      'FieldError.tsx',
      'Notice.tsx',
      'SelectField.tsx',
      'TextArea.tsx',
      'Switch.tsx',
      'AnonSwitch.tsx',
    ]) {
      expect(source(file), file).toMatch(/V46_FORM\[scheme\]/);
    }
    for (const file of ['TextField.tsx', 'PhoneField.tsx', 'TextArea.tsx']) {
      expect(source(file), file).toMatch(/noteTyping\(\)/);
    }
    // The gallery's own copies are as wide as the sign-up's pane: v46's gallery width at 360, the
    // screen less its padding on a narrower one (280 at 320, v46's narrow sign-up).
    expect(V46_COMPONENTS['alan-isim'].width).toBe(320);
    const gallery = readFileSync(
      resolve(root, 'apps/mobile/src/features/gallery/registry.tsx'),
      'utf8',
    );
    expect(gallery).toMatch(/const pane = useLayoutWidth\(\) - 2 \* shape\.screenPadding;/);
    expect(gallery).toMatch(/width: Math\.min\(galleryInfo\(id\)\.width, pane\)/);
    // v46's code step opens on its first box focused: the 320 pair is the focused field.
    expect(readFileSync(resolve(root, 'e2e/visual/states.json'), 'utf8')).toMatch(
      /"id": "v46-alan-kod-odak-320",\s*"app": "galeri\/v46\/alan-kod-odak",/,
    );
  });
});
