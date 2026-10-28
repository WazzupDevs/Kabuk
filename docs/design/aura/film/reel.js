// The skall motion reel: every frame is a pure function of time (render(t), seconds), so it can be
// played live or captured frame by frame. Springs are the same model Reanimated's withSpring uses
// (stiffness, damping, mass), so the values carry over to the app.
'use strict';

const $ = (id) => document.getElementById(id);
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, p) => a + (b - a) * p;

function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sx = (t) => ((ax * t + bx) * t + cx) * t;
  const sy = (t) => ((ay * t + by) * t + cy) * t;
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) {
      const d = 3 * ax * t * t + 2 * bx * t + cx;
      const e = sx(t) - x;
      if (Math.abs(e) < 1e-5 || Math.abs(d) < 1e-6) break;
      t -= e / d;
    }
    return sy(clamp(t));
  };
}
function spring(k, c, m = 1) {
  const w0 = Math.sqrt(k / m), z = c / (2 * Math.sqrt(k * m));
  return (t) => {
    if (t <= 0) return 0;
    if (z < 1) {
      const wd = w0 * Math.sqrt(1 - z * z);
      return 1 - Math.exp(-z * w0 * t) * (Math.cos(wd * t) + ((z * w0) / wd) * Math.sin(wd * t));
    }
    return 1 - Math.exp(-w0 * t) * (1 + w0 * t);
  };
}

// The motion standard (hareket.json carries the same values).
const OUT = bezier(0.2, 0.9, 0.25, 1);      // things arriving
const IN = bezier(0.4, 0, 1, 1);            // things leaving
const IO = bezier(0.4, 0, 0.2, 1);
const MORPH = spring(170, 26);              // a card becoming its screen, and back
const BACK = spring(260, 30);
const POP = spring(260, 17);                // people and badges arriving: a small bounce
const PRESS = spring(500, 22);              // a pressed button springing back
const LEAD = spring(420, 30);               // tab disc: the leading edge
const TRAIL = spring(200, 24);              // tab disc: the trailing edge (the stretch)

const tw = (t, t0, d, e = OUT) => e(clamp((t - t0) / d));
const sp = (t, t0, s) => s(Math.max(0, t - t0));

function put(el, o) {
  if (!el) return;
  const op = o.op ?? 1;
  el.style.opacity = op.toFixed(3);
  el.style.visibility = op < 0.003 ? 'hidden' : 'visible';
  const sx = o.sx ?? o.s ?? 1, sy = o.sy ?? o.s ?? 1;
  el.style.transform = `translate(${(o.x || 0).toFixed(2)}px, ${(o.y || 0).toFixed(2)}px) scale(${sx.toFixed(4)}, ${sy.toFixed(4)})${o.r ? ` rotate(${o.r.toFixed(2)}deg)` : ''}`;
  el.style.filter = o.blur > 0.05 ? `blur(${o.blur.toFixed(2)}px)` : 'none';
}

// Blur dissolve, the reel's main way in and out (p: 0 hidden, 1 shown).
const dis = (p, y = 12, s0 = 0.97, b = 12) => ({ op: p, y: (1 - p) * y, s: lerp(s0, 1, p), blur: (1 - p) * b });

// Times (s).
const T = { join: 2.3, accepted: 3.75, open: 4.35, zjoin: 6.6, close: 8.0, msgs: 9.4, prof: 11.1, home: 12.85, end: 14.9 };
const TAPS = [
  [T.join, 'k0'], [T.close - 0.15, 'back'], [T.msgs - 0.06, 'tab-messages'], [T.prof - 0.06, 'tab-profile'], [T.home - 0.06, 'tab-venue'],
];
const SWITCHES = [[T.msgs, 'venue', 'messages'], [T.prof, 'messages', 'profile'], [T.home, 'profile', 'venue']];
const TABX = { explore: 0, activities: 70.5, venue: 141, messages: 211.5, profile: 282 };

let R = {};
function measure() {
  const ph = $('ph').getBoundingClientRect();
  const rel = (el) => { const r = el.getBoundingClientRect(); return { x: r.left - ph.left, y: r.top - ph.top, w: r.width, h: r.height }; };
  const tab = (n) => { const r = rel($('toff-' + n)); return { x: r.x + r.w / 2, y: r.y + r.h / 2 }; };
  R = {
    row: rel($('lr0')), thumb: rel($('lt0')), k0: rel($('k0')), hero: rel($('l-scene')), heroT: rel($('heroT')),
    'tab-messages': tab('messages'), 'tab-profile': tab('profile'), 'tab-venue': tab('venue'),
  };
  R.back = { x: 42, y: 82 };
  R.scene = { x: 0, y: 0, w: 390, h: 330 };
  R.disk = { x: 125, y: 136, w: 140, h: 140 };
  R.seat = { x: 167, y: 70, w: 56, h: 56 };
}
const center = (r) => (r.w !== undefined ? { x: r.x + r.w / 2, y: r.y + r.h / 2 } : r);
const inside = (t, a, b) => t >= a && t < b;

function bob(t, period, phase, amp) { return -amp * (0.5 - 0.5 * Math.cos((2 * Math.PI * (t + phase)) / period)); }
function blink(t, times) {
  let s = 1;
  for (const b of times) { const d = (t - b) / 0.16; if (d > 0 && d < 1) s = 1 - 0.88 * Math.sin(Math.PI * d); }
  return s;
}
function eyes(el, s) { el.querySelectorAll('.eye').forEach((e) => { e.style.transform = `scaleY(${s.toFixed(3)})`; }); }

function figure(el, t, start, phase, blinks, popFrom = 26) {
  // A capsule buddy: pops in with a bounce, then floats and blinks.
  const p = sp(t, start, POP);
  const y = lerp(popFrom, 0, p) + (t > start + 0.5 ? bob(t, 2.6, phase, 4) : 0);
  put(el, { op: tw(t, start, 0.14), y, s: lerp(0.4, 1, p) });
  el.style.transformOrigin = '50% 100%';
  eyes(el, blink(t, blinks));
  const sh = el.querySelector('i');
  if (sh) sh.style.transform = `scaleX(${(1 + y / 30).toFixed(3)})`;
}

function aura(t) {
  const bl = $('aura').children;
  const f = [[3.7, 4.3, 30, 22], [4.6, 3.9, -26, 30], [3.3, 5.1, 24, -18], [5.4, 4.4, -30, 20], [4.1, 3.6, 22, 26]];
  for (let i = 0; i < bl.length; i++) {
    const [a, b, ax, ay] = f[i];
    bl[i].style.transform = `translate(${(ax * Math.sin(t / a)).toFixed(1)}px, ${(ay * Math.cos(t / b)).toFixed(1)}px) scale(${(1 + 0.06 * Math.sin(t / (a + b))).toFixed(3)})`;
  }
}

function touch(t) {
  const el = $('touch');
  let shown = false;
  for (const [at, where] of TAPS) {
    if (t >= at - 0.02 && t < at + 0.5) {
      const c = center(R[where]);
      const a = tw(t, at, 0.1), out = tw(t, at + 0.24, 0.24, IN);
      el.style.left = c.x + 'px';
      el.style.top = c.y + 'px';
      put(el, { op: a * (1 - out), s: lerp(0.7, 1, a) * lerp(1, 1.18, out) });
      shown = true;
    }
  }
  if (!shown) put(el, { op: 0 });
}

function lobby(t) {
  const L = $('lobby');
  let layer = { op: 1 };
  if (inside(t, T.open, T.close)) {
    const p = tw(t, T.open + 0.02, 0.42);
    layer = { op: 1 - p, blur: 14 * p, s: 1 - 0.06 * p };
  } else if (inside(t, T.close, T.msgs)) {
    const q = tw(t, T.close + 0.1, 0.46);
    layer = { op: q, blur: 14 * (1 - q), s: 0.94 + 0.06 * q };
  } else if (inside(t, T.msgs, T.home)) {
    const p = tw(t, T.msgs, 0.2, IO);
    layer = { op: 1 - p, blur: 10 * p, s: 1 - 0.015 * p };
  }
  L.style.display = layer.op < 0.003 ? 'none' : 'block';
  if (L.style.display === 'none') return;
  put(L, layer);
  L.style.transformOrigin = '50% 30%';

  const back = t >= T.home;
  const base = back ? T.home + 0.06 : 0.1;
  const k = back ? 0.7 : 1;
  put($('l-head'), dis(tw(t, base, 0.5)));
  put($('l-scene'), dis(tw(t, base + 0.08 * k, 0.55), 14, 0.95, 16));
  put($('l-sec'), dis(tw(t, base + 0.2 * k, 0.45)));
  put($('l-list'), { op: tw(t, base + 0.22 * k, 0.3) });
  for (let i = 0; i < 3; i++) put($('lr' + i), dis(tw(t, base + (0.28 + i * 0.07) * k, 0.5), 16, 0.98, 10));
  // The table's picture leaves the row while the table is open.
  $('lt0').style.opacity = inside(t, T.open, T.close) ? '0' : '1';

  // Katıl: pressed, a loader while the request waits, a check once it is accepted.
  const down = tw(t, T.join, 0.1), up = sp(t, T.join + 0.12, PRESS);
  put($('k0'), { s: t < T.join ? 1 : lerp(1, 0.94, down) + (t >= T.join + 0.12 ? 0.06 * up : 0) });
  const waiting = tw(t, T.join + 0.1, 0.18) * (1 - tw(t, T.accepted, 0.16, IN));
  put($('k0lbl'), { op: 1 - tw(t, T.join + 0.06, 0.14), blur: 6 * tw(t, T.join + 0.06, 0.14) });
  put($('k0load'), { op: waiting });
  for (let i = 0; i < 3; i++) put($('kl' + i), { y: -3 * Math.max(0, Math.sin(Math.PI * 2 * ((t * 1.8 - i * 0.16) % 1))) });
  const okp = sp(t, T.accepted + 0.06, POP);
  put($('k0ok'), { op: tw(t, T.accepted + 0.06, 0.12), s: lerp(0.3, 1, okp) });

  // The hero card: no table yet, then the table you sat at.
  const mine = t >= T.close;
  put($('heroA'), { op: mine ? 0 : 1 });
  put($('heroB'), { op: mine ? 1 : 0 });
  $('heroT').style.opacity = mine && t < T.close + 0.62 ? '0' : '1';

  figure($('lb1'), t, base + 0.42 * k, 0.4, [1.6, 3.4, 9.0, 14.1]);
  figure($('lb2'), t, base + 0.5 * k, 1.1, [2.05, 9.6, 14.4]);
  figure($('lb3'), t, base + 0.58 * k, 1.9, [1.2, 3.1, 13.7]);
  const ring = (t % 1.6) / 1.6;
  $('live-ring').style.transform = `scale(${lerp(1, 2.8, ring).toFixed(3)})`;
  $('live-ring').style.opacity = (0.55 * (1 - ring)).toFixed(3);
}

// The request notice above the tab bar: waiting, then accepted.
function note(t) {
  const on = inside(t, T.join + 0.1, T.open + 0.35);
  if (!on) { put($('note'), { op: 0 }); return; }
  const p = sp(t, T.join + 0.15, POP);
  let o = { op: tw(t, T.join + 0.15, 0.16), y: lerp(34, 0, p), s: lerp(0.94, 1, p), blur: 12 * (1 - tw(t, T.join + 0.15, 0.28)) };
  if (t >= T.open) { const x = tw(t, T.open, 0.28, IN); o = { op: 1 - x, blur: 10 * x, y: 16 * x, s: 1 - 0.03 * x }; }
  put($('note'), o);
  $('nsec').textContent = String(42 - Math.floor(Math.max(0, t - T.join - 0.15)));
  const sw = tw(t, T.accepted, 0.32);
  put($('n1'), { op: 1 - sw, blur: 8 * sw, y: -6 * sw });
  put($('n2'), { op: sw, blur: 8 * (1 - sw), y: 6 * (1 - sw) });
  put($('nload'), { op: 1 - tw(t, T.accepted, 0.14) });
  for (let i = 0; i < 3; i++) put($('nl' + i), { y: -3 * Math.max(0, Math.sin(Math.PI * 2 * ((t * 1.7 - i * 0.18) % 1))) });
  const okp = sp(t, T.accepted + 0.05, POP);
  put($('nok'), { op: tw(t, T.accepted + 0.05, 0.12), s: lerp(0.3, 1, okp) });
  $('note').style.background = sw > 0.5 ? 'linear-gradient(180deg, rgba(236,250,242,.92), rgba(255,255,255,.80))' : '';
}

// The table opens out of its row; going back, it shrinks into the hero card: your table.
function masa(t) {
  const M = $('masa');
  const on = inside(t, T.open, T.close + 0.7);
  M.style.display = on ? 'block' : 'none';
  if (!on) { put($('zfly'), { op: 0 }); put($('zring'), { op: 0 }); return; }
  const closing = t >= T.close;
  const P = closing ? 1 - sp(t, T.close + 0.04, BACK) : sp(t, T.open + 0.02, MORPH);
  const home = closing ? R.hero : R.row, homeT = closing ? R.heroT : R.thumb;
  const box = (a, b) => ({ x: lerp(a.x, b.x, P), y: lerp(a.y, b.y, P), w: lerp(a.w, b.w, P), h: lerp(a.h, b.h, P) });

  const sc = $('m-scene');
  const r = box(home, R.scene);
  Object.assign(sc.style, { left: r.x + 'px', top: r.y + 'px', width: r.w + 'px', height: r.h + 'px' });
  const r0 = closing ? 26 : 22;
  sc.style.borderRadius = `${lerp(r0, 0, P).toFixed(1)}px ${lerp(r0, 0, P).toFixed(1)}px ${lerp(r0, 36, P).toFixed(1)}px ${lerp(r0, 36, P).toFixed(1)}px`;
  sc.style.opacity = (closing ? 1 - tw(t, T.close + 0.3, 0.24, IO) : tw(t, T.open, 0.06)).toFixed(3);

  const fl = $('fly');
  const f = box(homeT, R.disk);
  Object.assign(fl.style, { left: f.x + 'px', top: f.y + 'px', width: f.w + 'px', height: f.h + 'px', borderRadius: lerp(closing ? 20 : 18, 44, P).toFixed(1) + 'px' });
  fl.style.boxShadow = `0 ${lerp(6, 14, P).toFixed(1)}px ${lerp(14, 30, P).toFixed(1)}px rgba(54,36,140,${lerp(0.16, 0.22, P).toFixed(2)}), 0 0 0 ${(4 * P).toFixed(2)}px rgba(255,255,255,.9)`;
  fl.style.opacity = closing ? (1 - tw(t, T.close + 0.56, 0.08, IO)).toFixed(3) : '1';

  // Everything else arrives after the morph and leaves together before it closes.
  const out = closing ? tw(t, T.close, 0.22, IN) : 0;
  const gone = (o) => (closing ? { ...o, op: (o.op ?? 1) * (1 - out), blur: (o.blur || 0) + 10 * out, s: (o.s ?? 1) * (1 - 0.03 * out) } : o);
  const a = T.open;
  put($('m-top'), gone(dis(tw(t, a + 0.3, 0.42))));
  const pop = (id, at, from = 16) => { const p = sp(t, at, POP); put($(id), gone({ op: tw(t, at, 0.14), y: lerp(from, 0, p), s: lerp(0.3, 1, p) })); };
  pop('mE', a + 0.42);
  pop('mM', a + 0.5);
  // The others first, you last.
  for (const [id, at, ph, bl] of [['mB2', a + 0.58, 1.2, [6.1, 7.4]], ['mB1', a + 0.78, 0.3, [5.6, 7.0]]]) {
    figure($(id), t, at, ph, bl, 30);
    if (closing) put($(id), gone({ op: 1, y: bob(t, 2.6, ph, 4) }));
  }
  put($('mT2'), gone(dis(tw(t, a + 0.7, 0.36), 6)));
  put($('mT1'), gone(dis(tw(t, a + 0.9, 0.36), 6)));
  put($('m-title'), gone(dis(tw(t, a + 0.44, 0.45))));
  put($('m-seg'), gone(dis(tw(t, a + 0.52, 0.45))));
  for (const [i, at] of [[1, a + 0.6], [2, a + 0.68]]) {
    const p = sp(t, at, POP);
    put($('m-c' + i), gone({ op: tw(t, at, 0.16), y: lerp(24, 0, p), s: lerp(0.88, 1, p) }));
    // A frosted card first, then the game resolves out of the blur.
    const res = tw(t, at + 0.32, 0.5);
    put($('m-c' + i + 'in'), { op: res, blur: 16 * (1 - res), s: lerp(1.04, 1, res) });
    put($('m-c' + i + 'f'), { op: 1 - tw(t, at + 0.5, 0.3) });
  }
  put($('m-btn'), gone(dis(tw(t, a + 0.9, 0.45), 26)));

  // Someone else joins: their photo pops into a seat and a ring spreads around it.
  const zf = $('zfly');
  Object.assign(zf.style, { left: R.seat.x + 'px', top: R.seat.y + 'px' });
  const zp = sp(t, T.zjoin, POP);
  put(zf, gone({ op: tw(t, T.zjoin, 0.12), y: lerp(-14, 0, zp), s: lerp(0.2, 1, zp) }));
  const land = tw(t, T.zjoin + 0.12, 0.6);
  put($('zring'), { op: land > 0 && land < 1 ? 0.75 * (1 - land) : 0, s: lerp(1, 1.8, land) });
  const sw = tw(t, T.zjoin + 0.15, 0.3);
  put($('cnt4'), { op: 1 - sw, blur: 6 * sw, y: -6 * sw });
  put($('cnt5'), { op: sw, blur: 6 * (1 - sw), y: 6 * (1 - sw) });
}

function messages(t) {
  const G = $('msgs');
  const on = inside(t, T.msgs, T.prof + 0.3);
  G.style.display = on ? 'block' : 'none';
  if (!on) return;
  let layer = { op: 1 };
  if (t >= T.prof) { const p = tw(t, T.prof, 0.2, IO); layer = { op: 1 - p, blur: 10 * p, s: 1 - 0.015 * p }; }
  put(G, layer);
  const a = T.msgs;
  put($('g-head'), dis(tw(t, a + 0.07, 0.42)));
  put($('g-seg'), dis(tw(t, a + 0.12, 0.42)));
  put($('g-list'), { op: tw(t, a + 0.13, 0.25) });
  for (let i = 0; i < 5; i++) put($('gr' + i), dis(tw(t, a + 0.16 + i * 0.05, 0.48), 16, 0.98, 10));
  const b = sp(t, a + 0.62, POP);
  put($('g-badge'), { op: tw(t, a + 0.62, 0.1), s: lerp(0, 1, b) });
  for (let i = 0; i < 3; i++) {
    const ph = (t * 1.7 - i * 0.18) % 1;
    put($('ty' + i), { y: -4 * Math.max(0, Math.sin(Math.PI * 2 * ph)) });
  }
}

function profile(t) {
  const P = $('prof');
  const on = inside(t, T.prof, T.home + 0.3);
  P.style.display = on ? 'block' : 'none';
  if (!on) return;
  let layer = { op: 1 };
  if (t >= T.home) { const p = tw(t, T.home, 0.2, IO); layer = { op: 1 - p, blur: 10 * p, s: 1 - 0.015 * p }; }
  put(P, layer);
  const a = T.prof;
  put($('p-head'), dis(tw(t, a + 0.07, 0.42)));
  for (const [id, at] of [['p-c1', a + 0.1], ['p-c2', a + 0.16]]) {
    const p = sp(t, at, POP);
    put($(id), { op: tw(t, at, 0.16), y: lerp(20, 0, p), s: lerp(0.9, 1, p), blur: 12 * (1 - tw(t, at, 0.3)) });
  }
  put($('p-cap'), { r: t > a + 0.6 ? 5 * Math.sin((t - a - 0.6) * 3.2) * Math.exp(-(t - a - 0.6) * 0.9) : 0 });
  put($('p-name'), dis(tw(t, a + 0.3, 0.45)));
  put($('p-btns'), dis(tw(t, a + 0.36, 0.45)));
  put($('p-sec'), dis(tw(t, a + 0.42, 0.45)));
  for (let i = 0; i < 4; i++) {
    const at = a + 0.48 + i * 0.07;
    const p = sp(t, at, POP);
    put($('pm' + i), { op: tw(t, at, 0.14), y: lerp(18, 0, p), s: lerp(0.5, 1, p) });
    if (i < 3) put($('pmb' + i), { y: t > at + 0.4 ? bob(t, 2.4, i * 0.7, 3) : 0 });
  }
}

function tabbar(t) {
  // In from below at the start; away while a table is open.
  let y = lerp(40, 0, sp(t, 0.45, MORPH));
  let op = tw(t, 0.45, 0.25);
  if (inside(t, T.open, T.close + 0.2)) y = lerp(0, 120, tw(t, T.open, 0.35, IN));
  else if (inside(t, T.close + 0.2, T.msgs)) y = lerp(120, 0, sp(t, T.close + 0.2, MORPH));
  put($('bar'), { op, y });

  // The white disc: leading edge fast, trailing edge slower, so it stretches on the way.
  let L = TABX.venue, Rr = TABX.venue + 52, active = 'venue', from = null, at = 0;
  for (const [ts, a, b] of SWITCHES) if (t >= ts) { from = a; active = b; at = ts; }
  if (from) {
    const right = TABX[active] > TABX[from];
    const lead = sp(t, at, LEAD), trail = sp(t, at, TRAIL);
    L = lerp(TABX[from], TABX[active], right ? trail : lead);
    Rr = lerp(TABX[from] + 52, TABX[active] + 52, right ? lead : trail);
  }
  const w = Rr - L;
  const pill = $('pill');
  pill.style.left = 9 + L + 'px';
  pill.style.width = w + 'px';
  const squash = clamp((w - 52) / 60);
  put(pill, { op: tw(t, 0.6, 0.2), sy: 1 - 0.1 * squash });

  for (const n of ['explore', 'activities', 'venue', 'messages', 'profile']) {
    let onOp = 0, onS = 0.5, offOp = 1;
    if (n === 'venue' && t < T.msgs) {
      const p = sp(t, 0.72, POP);
      onOp = tw(t, 0.72, 0.14); onS = lerp(0.5, 1, p); offOp = 1 - tw(t, 0.7, 0.14);
    }
    for (const [ts, a, b] of SWITCHES) {
      if (t < ts) continue;
      if (n === b) { const p = sp(t, ts + 0.06, POP); onOp = tw(t, ts + 0.06, 0.14); onS = lerp(0.5, 1, p); offOp = 1 - tw(t, ts + 0.04, 0.14); }
      else if (n === a) { const x = tw(t, ts, 0.16, IN); onOp = 1 - x; onS = lerp(1, 0.8, x); offOp = tw(t, ts + 0.08, 0.2); }
    }
    put($('ton-' + n), { op: onOp, s: onS });
    put($('toff-' + n), { op: offOp });
  }
}

function render(t) {
  aura(t);
  lobby(t);
  masa(t);
  note(t);
  messages(t);
  profile(t);
  tabbar(t);
  touch(t);
}

window.REEL = { render, duration: T.end, measure };
measure();
render(0);
if (!/capture/.test(location.hash)) {
  const t0 = performance.now();
  const loop = () => { render(((performance.now() - t0) / 1000) % T.end); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
}
