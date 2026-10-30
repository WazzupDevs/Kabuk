// skall tuvali: ekran üreticisinin parça kitaplığı (docs/design/sistem/README.md).
// Her ekran yalnızca bu parçalardan ve skall.css sınıflarından kurulur.
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const V46 = path.resolve(ROOT, '../kaynak');
const VERI = path.join(__dirname, 'veri');
// Elle çizilen panolar ve tuvalin dizini; üretilen panolar PROJ'a yazılır
const HAND = path.join(ROOT, 'tuval');
const PROJ = process.env.SISTEM_CIKTI || path.join(ROOT, '.uretim');
const LOOKLIB = require('./look.cjs');
const CAT = require(V46 + '/kapsul/kapsul-katalogu.json');
const veri = (n) => JSON.parse(fs.readFileSync(path.join(VERI, n + '.json'), 'utf8'));
const AVS = veri('avatars');
const VENUE = veri('venues');
const GAMES = veri('games');
const EMO = veri('emotes');
const POSTERS = veri('posters');
const COVERS = veri('eventCovers');
const ICON_DIR = V46 + '/masa-simgeleri';
const ICON_CAT = JSON.parse(fs.readFileSync(ICON_DIR + '/masa-simgeleri.json', 'utf8'));
const MEKAN = fs.readFileSync(HAND + '/Mekan.dc.html', 'utf8');

// Kendi profil fotoğrafın (Elif), Mekan panosundan
AVS.Elif = MEKAN.match(/aria-label="Profilin"><span class="av s40">(<svg[\s\S]*?<\/svg>)<\/span>/)[1];
const WORDMARK = MEKAN.match(/<svg class="wordmark"[\s\S]*?<\/svg>/)[0];

// Kimlik öneki: her pano kendi id'lerini taşır (tuvalde çakışmasın)
let PFX = 'x', N = 0;
const setBoard = (p) => { PFX = p; N = 0; };
const uid = () => PFX + (++N);
const reid = (html) => {
  const map = {};
  html = html.replace(/id="([^"]+)"/g, (m, id) => { const n = uid(); map[id] = n; return `id="${n}"`; });
  return html.replace(/url\(#([^)]+)\)/g, (m, id) => `url(#${map[id] || id})`);
};

// 1. Çizgi ikonlar (gezinme ve bilgi)
const I = {
  back: '<polyline points="15 5 8 12 15 19"/>',
  chev: '<polyline points="9 5 16 12 9 19"/>',
  down: '<polyline points="6 9 12 15 18 9"/>',
  close: '<path d="M7 7l10 10M17 7L7 17"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4 4"/>',
  exit: '<path d="M10 4.5H7a2.5 2.5 0 0 0-2.5 2.5v10A2.5 2.5 0 0 0 7 19.5h3"/><path d="M15 8l4 4-4 4"/><path d="M19 12H9.5"/>',
  pin: '<path d="M12 21s-6.5-6.2-6.5-11.2a6.5 6.5 0 0 1 13 0C18.5 14.8 12 21 12 21z"/><circle cx="12" cy="9.8" r="2.4"/>',
  people: '<circle cx="9" cy="8" r="3.2"/><path d="M3 19c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5"/><circle cx="17" cy="9" r="2.4"/><path d="M16.5 14c2.6.1 4.5 1.9 4.5 4.5"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  edit: '<path d="M4 20l1-4L16.5 4.5a2.1 2.1 0 0 1 3 3L8 19z"/><path d="M14.5 6.5l3 3"/>',
  refresh: '<path d="M20 12a8 8 0 1 1-2.3-5.6"/><polyline points="20 4 20 9 15 9"/>',
  read: '<path d="M2.5 12.5l4 4 8-9"/><path d="M11 15.5l1 1 8-9"/>',
  check: '<path d="M5.5 12.6l4.3 4.3 8.7-9.4"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
  activity: '<rect x="5" y="4" width="13" height="16" rx="2.6"/><path d="M9 8.5h5M9 12h3"/><path d="M19.5 7.5v10a2.5 2.5 0 0 1-2.5 2.5"/>',
  chat: '<path d="M20 11.5a7.5 7.5 0 0 1-8 7.5 8.2 8.2 0 0 1-3.5-.8L4 19.5l1.5-4.2A7.2 7.2 0 0 1 4 11.5 7.5 7.5 0 0 1 12 4a7.5 7.5 0 0 1 8 7.5z"/>',
  person: '<circle cx="12" cy="8" r="3.6"/><path d="M5 20c0-3.9 3.1-6.5 7-6.5s7 2.6 7 6.5"/>',
  lock: '<rect x="5" y="10.5" width="14" height="10" rx="2.6"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5"/><path d="M12 7.6v.4"/>',
  mute: '<path d="M4.5 9.5h3l4-3.5v12l-4-3.5h-3z"/><path d="M15.5 9.5l4.5 4.5M20 9.5L15.5 14"/>',
  block: '<circle cx="12" cy="12" r="8.5"/><path d="M6 6l12 12"/>',
  shield: '<path d="M12 3.5l7 2.6v5.4c0 4.5-3 7.8-7 9-4-1.2-7-4.5-7-9V6.1z"/>',
  doc: '<path d="M7 3.5h7l4 4v13H7z"/><path d="M14 3.5v4h4"/><path d="M9.5 12.5h6M9.5 16h4"/>',
  palette: '<circle cx="12" cy="12" r="8.5"/><circle cx="8.6" cy="10" r="1.2"/><circle cx="12" cy="7.8" r="1.2"/><circle cx="15.4" cy="10" r="1.2"/><path d="M12 20.5c-1.4 0-2-1-2-2s.8-1.8 2-1.8h1.6"/>',
  phone: '<rect x="7" y="3" width="10" height="18" rx="2.6"/><path d="M11 17.5h2"/>',
  cake: '<path d="M4.5 20.5h15v-7a2 2 0 0 0-2-2h-11a2 2 0 0 0-2 2z"/><path d="M4.5 15.5c1.5 1.2 3 1.2 4.5 0s3-1.2 4.5 0 3 1.2 4.5 0 1.5-.6 1.5-.6"/><path d="M12 11.5V8"/><path d="M12 5.4c.9-.9.9-1.9 0-2.9-.9 1-.9 2 0 2.9z"/>',
  trash: '<path d="M5 7h14"/><path d="M9.5 7V5h5v2"/><path d="M7 7l1 13h8l1-13"/>',
  heart: '<path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z"/>',
  calendar: '<rect x="4" y="5.5" width="16" height="14.5" rx="2.6"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/>',
  star: '<path d="M12 4l2.4 5 5.4.6-4 3.7 1.1 5.3L12 16l-4.9 2.6 1.1-5.3-4-3.7 5.4-.6z"/>',
  logout: '<path d="M14 4.5h3a2.5 2.5 0 0 1 2.5 2.5v10a2.5 2.5 0 0 1-2.5 2.5h-3"/><path d="M9 8l-4 4 4 4"/><path d="M5 12h9.5"/>',
  shuffle: '<path d="M4 7h3.5c4 0 5 10 9 10H20"/><path d="M4 17h3.5c1.6 0 2.7-1.6 3.6-3.6M13.3 9.6C14.2 8 15.2 7 16.5 7H20"/><polyline points="17.5 4.5 20 7 17.5 9.5"/><polyline points="17.5 14.5 20 17 17.5 19.5"/>',
  arrow: '<path d="M4.5 12h14"/><path d="M13 6.5l5.5 5.5-5.5 5.5"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
};
const ico = (name, cls = '', style = '') =>
  `<svg class="ico${cls ? ' ' + cls : ''}" viewBox="0 0 24 24"${style ? ` style="${style}"` : ''} aria-hidden="true">${I[name]}</svg>`;

// 2. Çubuk ikonlar (eylemler). Renk anlamdan: positive, negative, neutral, on-primary
const PLUS = '<rect class="a" x="9.7" y="3" width="4.6" height="18" rx="2.3"/><rect class="b" x="3" y="9.7" width="18" height="4.6" rx="2.3"/><rect class="x" x="9.7" y="9.7" width="4.6" height="4.6"/>';
const B = {
  add: PLUS,
  end: `<g transform="rotate(45 12 12)">${PLUS}</g>`,
  accept: '<rect class="b" x="2.6" y="12.6" width="11" height="4.4" rx="2.2" transform="rotate(45 8.1 14.8)"/><rect class="a" x="6.8" y="9.9" width="16" height="4.4" rx="2.2" transform="rotate(-45 14.8 12.1)"/>',
  report: '<rect class="a" x="9.8" y="3" width="4.4" height="12" rx="2.2"/><rect class="b" x="9.8" y="16.8" width="4.4" height="4.4" rx="2.2"/>',
  send: '<rect class="a" x="5" y="9.8" width="14" height="4.4" rx="2.2" transform="rotate(36 12 12) translate(-.6 -3.6)"/><rect class="b" x="5" y="9.8" width="14" height="4.4" rx="2.2" transform="rotate(-36 12 12) translate(-.6 3.6)"/>',
  more: '<rect class="a" x="9.7" y="3" width="4.6" height="4.6" rx="2.3"/><rect class="b" x="9.7" y="9.7" width="4.6" height="4.6" rx="2.3"/><rect class="x" x="9.7" y="16.4" width="4.6" height="4.6" rx="2.3"/>',
  reply: '<rect class="a" x="4.2" y="10" width="15.8" height="4" rx="2"/><rect class="b" x="3.5" y="8.2" width="9" height="4" rx="2" transform="rotate(-45 8 10.2)"/><rect class="b" x="3.5" y="11.8" width="9" height="4" rx="2" transform="rotate(45 8 13.8)"/>',
  lobby: '<rect class="slot" x="11.4" y="6.7" width="6.4" height="15" rx="3.2"/><rect class="a" x="6.2" y="2.3" width="6.4" height="15" rx="3.2"/>',
  settings: '<rect class="track" x="3" y="6.8" width="18" height="2.6" rx="1.3"/><rect class="track" x="3" y="14.6" width="18" height="2.6" rx="1.3"/><rect class="a" x="13" y="3.6" width="5" height="9" rx="2.5"/><rect class="b" x="6" y="11.4" width="5" height="9" rx="2.5"/>',
  bell: '<path class="a" d="M5.2 16.2V9.6a6.8 6.8 0 0 1 13.6 0v6.6z"/><rect class="b" x="2.4" y="14" width="19.2" height="4.6" rx="2.3"/><rect x="5.2" y="14" width="13.6" height="2.2" fill="#3B25A6"/><rect class="x" x="9.6" y="19.8" width="4.8" height="3.6" rx="1.8"/>',
  photo: '<rect class="sa" x="2.5" y="6.5" width="19" height="13.5" rx="4.5"/><rect class="a" x="8" y="3.6" width="8" height="4.4" rx="2.2"/><circle class="sb" cx="12" cy="13.2" r="3.6"/>',
  list: '<rect class="a" x="4" y="5" width="16" height="3.6" rx="1.8"/><rect class="b" x="4" y="10.2" width="16" height="3.6" rx="1.8"/><rect class="x" x="4" y="15.4" width="11" height="3.6" rx="1.8"/>',
  map: '<path class="a" d="M12 21.5c-.4 0-.8-.2-1-.5C8.4 17.6 5.5 13.6 5.5 10a6.5 6.5 0 0 1 13 0c0 3.6-2.9 7.6-5.5 11-.2.3-.6.5-1 .5z"/><rect x="9.6" y="6" width="4.8" height="8" rx="2.4" fill="#FFFFFF"/><rect class="b" x="11.6" y="7.6" width="4.8" height="8" rx="2.4" opacity="0.9"/>',
};
const bar = (name, tone = 'neutral', style = '') =>
  `<svg class="bi ${tone}" viewBox="0 0 24 24"${style ? ` style="${style}"` : ''} aria-hidden="true">${B[name]}</svg>`;

// 3. Düğmeler. kind: primary | secondary | quiet | positive | negative; size: l | (m) | s
function btn(text, o = {}) {
  const cls = ['btn', o.size || '', o.kind || 'secondary', o.full ? 'full' : '', o.act ? 'act' : '', o.grow ? 'grow' : '', o.state || ''].filter(Boolean).join(' ');
  let ic = '';
  if (o.bar) {
    const tone = o.tone || (o.kind === 'primary' && o.state !== 'disabled' ? 'on-primary' : o.kind === 'negative' ? 'negative' : o.kind === 'positive' ? 'positive' : 'neutral');
    ic = bar(o.bar, tone);
  } else if (o.ico) ic = ico(o.ico);
  const busy = o.busy ? `<span class="busy-dots${o.kind === 'primary' ? '' : ' brand'}"><i></i><i></i><i></i></span>` : '';
  const dis = o.state === 'disabled' ? ' disabled' : '';
  return `<button class="${cls}"${dis}${o.label ? ` aria-label="${o.label}"` : ''}${o.style ? ` style="${o.style}"` : ''}>${busy}${o.busy && !o.keepText ? '' : ic + text}</button>`;
}
const status = (text, o = {}) => `<span class="status act${o.tone ? ' ' + o.tone : ''}">${o.ico ? ico(o.ico) : ''}${text}</span>`;
const round = (inner, label, extra = '') => `<button class="round" aria-label="${label}"${extra}>${inner}</button>`;
const rowEq = (...b) => `<div class="row-eq">${b.join('')}</div>`;

// 4. Görseller
function av(name, size = 's40', extra = '') {
  const s = AVS[name];
  if (!s) throw new Error('avatar yok: ' + name);
  return `<span class="av ${size}"${extra}>${s}</span>`;
}
const LOOKS = Object.fromEntries(CAT.hazir_gorunusler.map((h) => [h.ad, Object.fromEntries(h.kod.split(' ').map((p) => p.split(':')))]));
const strip = (s) => s.replace(/ class="[^"]*"/g, '').replace(/ aria-hidden="true"/g, '');
// Kapsül kanki: ayakta (fig, 48x66) ya da daire içinde (av)
function capsule(look, mode = 'fig', attrs = '') {
  const L = typeof look === 'string' ? LOOKS[look] : look;
  if (!L) throw new Error('görünüş yok: ' + look);
  const s = strip(LOOKLIB.svg(L, mode === 'fig' ? 'fig' : 'av')).replace(' width="100%" height="100%"', '');
  return attrs ? s.replace('<svg ', `<svg ${attrs} `) : s;
}
const capAv = (look, size = 's40') => `<span class="av ${size}">${capsule(look, 'av')}</span>`;
// İfadeli kanki (tepki): emotes.json, __ID__ öneki
const emo = (key) => EMO[key].svg.replace(/__ID__/g, uid());
const react = (key, n) => `<span class="react"><span class="emo">${emo(key)}</span>${n}</span>`;
const icons = {
  'uzay-galaksi': 'd277da1c3d2e07b5d01cd48c4e877ab1',
  'kis-kardanadam': '19ee9ce1bbf670d68bd70b1b87707af9',
  'kamp-ates': '19ccda204438cf91946a5a6f204d89a3',
  'uzay-gezegen': '3066acb23399fad10b830a08be9938d4',
  'deniz-fener': 'e4ecb3a6a8d42cd88e3b7d5d3aa34823',
};
const TABLES = { 'Mor Dalga': 'uzay-galaksi', 'Neşeli Panda': 'kis-kardanadam', 'Gece Baykuşu': 'kamp-ates', 'Atak Tilki': 'uzay-gezegen', 'Tatlı Yunus': 'deniz-fener' };
// Masa simgesi: tuvale yüklenmiş olan blob'dan, yoksa v46 kaynağından gömülü WebP
const iconSrc = (id) => icons[id] ? `/_blob/${icons[id]}` : `data:image/webp;base64,${fs.readFileSync(ICON_DIR + '/webp-256/' + id + '.webp').toString('base64')}`;
const tableIcon = (name, size = 's48', extra = '') => `<span class="thumb ${size}"${extra}><img src="${iconSrc(TABLES[name] || name)}" alt=""></span>`;
// Fotoğrafı sonradan gizlenen ya da kaldırılan profil: soluk hayalet kapsül (v46 AV.ghost)
const GHOST = '<svg viewBox="0 0 48 48" width="100%" height="100%" aria-hidden="true"><circle cx="24" cy="24" r="24" fill="#E8E4F4"/><rect x="10" y="8" width="28" height="56" rx="14" fill="#FFFFFF" opacity="0.95"/><path d="M30 10a14 14 0 0 1 8 12v42h-8z" fill="#14112B" opacity="0.06"/><rect x="14" y="15" width="20" height="11" rx="5.5" fill="#DFD9EF"/><circle cx="20" cy="20.5" r="2.1" fill="#9C94B8"/><circle cx="28" cy="20.5" r="2.1" fill="#9C94B8"/></svg>';
const ghostAv = (size = 's40', extra = '') => `<span class="av ${size}"${extra}>${GHOST}</span>`;
// Oyun posterleri (v46 .poster: 6 oyun) ve etkinlik kapakları (K-44: kafe, kampüs)
const posterArt = (g) => reid(POSTERS[g].svg);
const eventCover = (kind) => reid(COVERS[kind]);
const venueThumb = (kind, size = 's48') => `<span class="thumb ${size}" style="background: none;">${VENUE[kind]}</span>`;
const gameThumb = (g, size = 's48') => `<span class="thumb ${size}">${reid(GAMES[g])}</span>`;
const chips = (items, on) => `<div class="chips" style="flex-wrap: wrap;">${items.map((t) => `<span class="chip${t === on ? ' on' : ''}">${t}</span>`).join('')}</div>`;
// Menü: [{t, ico|bar, neg, end, sub}]
const menu = (rows) => `<div class="menu">${rows.map((r) => `<button>${r.bar ? bar(r.bar, r.tone || (r.neg ? 'negative' : 'neutral')) : r.ico ? ico(r.ico) : ''}${r.sub ? `<span class="mid"><span${r.neg ? ' class="neg"' : ''}>${r.t}</span><span class="t-note">${r.sub}</span></span>` : `<span${r.neg ? ' class="neg"' : ''}>${r.t}</span>`}${r.end ? `<span class="end">${r.end}</span>` : ''}</button>`).join('')}</div>`;

// 5. İskelet
const tabNames = [['kesfet', 'Keşfet'], ['akt', 'Aktiviteler'], ['mekan', 'Mekan'], ['mesaj', 'Mesajlar'], ['profil', 'Profil']];
function tabbar(active, o = {}) {
  const icon = (k) => {
    if (k === 'kesfet') return ico('compass');
    if (k === 'akt') return ico('activity');
    if (k === 'mesaj') return ico('chat') + (o.msgDot !== false && active !== 'mesaj' ? '<i class="dot"></i>' : '');
    if (k === 'profil') return ico('person');
    if (active === 'mekan') {
      const c = uid();
      return `<svg viewBox="86 86 340 340" width="22" height="22" aria-hidden="true"><defs><clipPath id="${c}"><rect width="96" height="236" rx="48"/></clipPath></defs><g transform="translate(180 111)"><rect width="96" height="236" rx="48" fill="#7B5CFF"/><rect x="56" y="54" width="96" height="236" rx="48" fill="#FF4F8B"/><g clip-path="url(#${c})"><rect x="56" y="54" width="96" height="236" rx="48" fill="#FFB547"/></g></g></svg>`;
    }
    return '<svg viewBox="86 86 340 340" width="22" height="22" aria-hidden="true"><g transform="translate(142 138)" fill="currentColor"><rect width="96" height="236" rx="48"/><rect x="132" width="96" height="236" rx="48"/></g></svg>';
  };
  return `<nav class="tabbar" aria-label="Sekmeler">${tabNames.map(([k, n]) => `<span class="tab${k === active ? ' on' : ''}"><span class="pill">${icon(k)}</span>${n}</span>`).join('')}</nav>`;
}
const tabTop = (title, right = '') => `<header class="topbar"><div class="ttl"><h1 class="t-h1">${title}</h1></div>${right}</header>`;
function innerTop(o) {
  const lead = o.lead || '';
  const sub = o.sub ? `<div class="sub meta">${o.sub}</div>` : '';
  const title = o.title ? `<div class="ttl"><span class="t-h3">${o.title}</span>${sub}</div>` : '<div class="ttl"></div>';
  return `<header class="topbar inner">${o.back === false ? '' : round(ico(o.backIco || 'back'), o.backLabel || 'Geri')}${lead}${title}${o.right || ''}</header>`;
}
function mekanTop(o = {}) {
  const wm = reid(WORDMARK);
  const sw = o.anon
    ? `<span class="hit" role="switch" aria-checked="true" aria-label="Anonim görün"><span class="idsw on"><span class="knob">${capsule(o.anonLook || 'Gözlük', 'av', 'width="16" height="16"')}</span></span></span>`
    : `<span class="hit" role="switch" aria-checked="false" aria-label="Anonim görün"><span class="idsw"><span class="knob"><svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="7.2" r="3.4" fill="#8A85A0"/><path d="M3.6 17.2c0-3.6 2.9-5.8 6.4-5.8s6.4 2.2 6.4 5.8z" fill="#8A85A0"/></svg></span></span></span>`;
  const me = o.noPhoto === 'empty'
    ? `<button class="round" aria-label="Profilin">${ico('person')}</button>`
    : o.noPhoto
    ? `<button class="round" style="padding: 0; overflow: hidden;" aria-label="Profilin">${ghostAv('s40')}</button>`
    : `<button class="round" style="padding: 0; overflow: hidden;" aria-label="Profilin">${o.anon ? capAv(o.anonLook || 'Gözlük', 's40') : av(o.me || 'Elif', 's40')}</button>`;
  return `<header class="topbar" style="flex-direction: column; align-items: stretch; gap: 10px; padding-bottom: 8px;">
    <div style="display: grid; grid-template-columns: 1fr auto 1fr; align-items: center;">
      <div style="justify-self: start;">${round(ico('exit'), 'Mekandan ayrıl')}</div>
      ${wm}
      <div class="row-x" style="justify-self: end; gap: 6px;">${sw}${me}</div>
    </div>
    <div class="ttl"><h1 class="t-h1">${o.venue || 'Hush Coffee'}</h1><div class="sub meta"><i class="live"></i>${o.count || '23 kişi burada'}</div></div>
  </header>`;
}
// Mekan sohbeti satırının ikili baloncuk ikonu
function venueChatIco(cls = 'ico') {
  const m = uid();
  const P = 'M20 11.5a7.5 7.5 0 0 1-8 7.5 8.2 8.2 0 0 1-3.5-.8L4 19.5l1.5-4.2A7.2 7.2 0 0 1 4 11.5 7.5 7.5 0 0 1 12 4a7.5 7.5 0 0 1 8 7.5z';
  return `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true"><defs><mask id="${m}"><rect width="24" height="24" fill="#fff"/><path transform="translate(-1.6 5.2) scale(0.8)" d="${P}" fill="#000" stroke="#000" stroke-width="5.4"/></mask></defs><g mask="url(#${m})"><path transform="matrix(-0.72 0 0 0.72 25.28 -0.28)" d="${P}" stroke-width="2.5"/></g><path transform="translate(-1.6 5.2) scale(0.8)" d="${P}" stroke-width="2.25"/></svg>`;
}
// Liste satırı
function item(o) {
  const mid = `<div class="mid">${o.title ? `<span class="t-h3">${o.title}</span>` : ''}${o.sub || ''}</div>`;
  return `<div class="item"${o.style ? ` style="${o.style}"` : ''}>${o.lead || ''}${mid}${o.end || ''}</div>`;
}
const note = (t, style = '') => `<span class="t-note"${style ? ` style="${style}"` : ''}>${t}</span>`;
const meta = (...parts) => `<div class="meta">${parts.join('<i class="sep"></i>')}</div>`;
const list = (...items) => `<div class="list">${items.join('')}</div>`;
const card = (inner, style = '') => `<div class="card"${style ? ` style="${style}"` : ''}>${inner}</div>`;
const section = (t, right = '') => `<div class="section"><span class="t-h3">${t}</span>${right ? `<span class="t-note">${right}</span>` : ''}</div>`;
const banner = (title, text, tone = 'warn', icon = '') => `<div class="banner ${tone}">${icon || bar('report', tone === 'danger' ? 'negative' : 'warn')}<div class="mid">${title ? `<span class="t-label">${title}</span>` : ''}<span class="t-note">${text}</span></div></div>`;
// Alt sayfa: arka plan ekran + perde + sayfa
const sheet = (label, inner, style = '') => `<div class="scrim"></div><section class="sheet" role="dialog" aria-label="${label}"${style ? ` style="${style}"` : ''}><span class="handle"></span>${inner}</section>`;
// Diyalog (ortada): onaylar için
const dialog = (label, inner) => `<div class="scrim"></div><section class="dialog" role="alertdialog" aria-label="${label}">${inner}</section>`;

// Boş, yükleniyor, hata
const glyphLoad = () => { const c = uid(); return `<span class="glyph"><svg viewBox="86 86 340 340" width="30" height="30" aria-hidden="true"><defs><clipPath id="${c}"><rect width="96" height="236" rx="48"/></clipPath></defs><g transform="translate(180 111) rotate(-12 76 145)"><rect width="96" height="236" rx="48" fill="#7B5CFF"/><rect x="56" y="54" width="96" height="236" rx="48" fill="#FF4F8B"/><g clip-path="url(#${c})"><rect x="56" y="54" width="96" height="236" rx="48" fill="#FFB547"/></g></g></svg></span>`; };
const glyphEmpty = () => '<span class="glyph"><svg viewBox="0 0 48 48" width="34" height="34" aria-hidden="true"><rect x="11" y="5" width="12" height="30" rx="6" fill="#7B5CFF"/><rect x="23" y="13" width="12" height="30" rx="6" fill="none" stroke="#FF4F8B" stroke-width="2.2" stroke-dasharray="3.2 3"/></svg></span>';
const glyphError = () => '<span class="glyph" style="background: var(--danger-soft);"><svg viewBox="0 0 48 48" width="34" height="34" aria-hidden="true"><rect x="8" y="9" width="12" height="30" rx="6" fill="#7B5CFF"/><rect x="28" y="9" width="12" height="30" rx="6" fill="none" stroke="#FF4F8B" stroke-width="2.2" stroke-dasharray="3.2 3"/><g transform="rotate(45 24 24)"><rect x="22.3" y="18" width="3.4" height="12" rx="1.7" fill="#E0402C"/><rect x="18" y="22.3" width="12" height="3.4" rx="1.7" fill="#FF8A70"/></g></svg></span>';
const stateCard = (kind, title, text, extra = '') => {
  const g = kind === 'load' ? glyphLoad() : kind === 'error' ? glyphError() : glyphEmpty();
  if (extra) return `<div class="card state col"><div class="row-x" style="gap: 14px;">${g}<div class="mid"><span class="t-h3">${title}</span><span class="t-note">${text}</span></div></div>${extra}</div>`;
  return `<div class="card state">${g}<div class="mid"><span class="t-h3">${title}</span><span class="t-note">${text}</span></div></div>`;
};
// Ortada büyük boş hâl (tam ekran boşluk)
const emptyHero = (art, title, text, action = '') => `<div class="hero-empty">${art}<span class="t-h2">${title}</span><span class="t-note">${text}</span>${action}</div>`;

// Sohbet kalıbı: tek mesaj ve tek ekran (DM, masa, mekan aynı)
function msg(o) {
  const lead = o.own || !(o.av || o.cap) ? '' : o.first ? (o.cap ? capAv(o.cap, 's32') : av(o.av, 's32')) : '<span class="gap"></span>';
  const who = o.who && o.first && !o.own ? `<span class="who" style="color: var(--name-${o.nc || 1});">${o.who}</span>` : '';
  const quote = o.quote ? `<span class="quote"><b>${o.quote[0]}</b><span>${o.quote[1]}</span></span>` : '';
  const tm = `<span class="tm">${o.time}${o.read ? ico('read') : ''}</span>`;
  const bub = `<div class="bub${o.hl ? ' hl' : ''}">${who}${quote}${o.text}${tm}</div>`;
  const reacts = o.reacts ? `<div class="reacts">${o.reacts.map(([k, n]) => react(k, n)).join('')}</div>` : '';
  const body = reacts ? `<div class="col">${bub}${reacts}</div>` : bub;
  return `<div class="msg${o.own ? ' own' : ''}${o.first ? ' first' : ''}"${o.style ? ` style="${o.style}"` : ''}>${lead}${body}</div>`;
}
const typingMsg = (o = {}) => `<div class="msg${o.first ? ' first' : ''}">${o.av ? (o.first ? av(o.av, 's32') : '<span class="gap"></span>') : ''}<div class="bub" style="padding: 10px 14px;"><span class="typing"><i></i><i></i><i></i></span></div></div>`;
const day = (t, isNew) => `<span class="day${isNew ? ' new' : ''}">${t}</span>`;
function chat(o) {
  return `<div class="chat"><div class="wall"></div><div class="stream">${o.stream}</div>${o.extra || ''}${o.idrow || ''}${o.reply || ''}<div class="composer"><div class="field">${o.placeholder || 'Mesaj yaz'}</div><span class="send" aria-label="Gönder">${bar('send')}</span></div></div>`;
}
const venueChatTop = () => innerTop({ lead: `<span class="glyph" style="width: 40px; height: 40px;">${venueChatIco('ico" style="width: 20px; height: 20px;')}</span>`, title: 'Mekan sohbeti', sub: '<i class="live"></i>23 kişi burada', right: round(bar('more'), 'Diğer seçenekler') });
const emoKeys = ['begen', 'ask', 'kahkaha', 'saskin', 'uzgun', 'kizgin'];
// Basılı tutma: tepki seçici + mesaj + eylemler
const pressMenu = (o) => `<div class="scrim"></div><div class="pop" style="top: ${o.top}px;"><div class="emopick${o.own ? ' own' : ''}" role="menu" aria-label="Tepki seç">${emoKeys.map((k) => `<span role="menuitem" aria-label="${EMO[k].name}"${k === o.on ? ' class="on"' : ''}>${emo(k)}</span>`).join('')}</div>${o.msg}<div class="menu${o.own ? ' own' : ''}" role="menu">${o.actions}</div></div>`;
const replyBar = (name, text) => `<div class="replybar">${bar('reply', 'neutral', 'width: 20px; height: 20px;')}<span class="quote" style="margin: 0; flex: 1; min-width: 0; background: none; border: 0; padding: 0;"><b>${name}</b><span>${text}</span></span><button class="round" style="width: 32px; height: 32px; border: 0; background: var(--soft);" aria-label="Yanıtı iptal et">${ico('close', '', 'width: 16px; height: 16px;')}</button></div>`;

// Push (pure/push.ts): ad, masa ve mekan taşımaz
const push = (body) => { const c = uid(); return `<div class="push" role="status"><span class="app"><svg viewBox="86 86 340 340" width="26" height="26" aria-hidden="true"><defs><clipPath id="${c}"><rect width="96" height="236" rx="48"/></clipPath></defs><g transform="translate(180 111)"><rect width="96" height="236" rx="48" fill="#7B5CFF"/><rect x="56" y="54" width="96" height="236" rx="48" fill="#FF4F8B"/><g clip-path="url(#${c})"><rect x="56" y="54" width="96" height="236" rx="48" fill="#FFB547"/></g></g></svg></span><div class="mid"><span class="t-small muted">skall · şimdi</span><span class="t-label">${body}</span></div></div>`; };

// 6. Pano belgesi
function doc(o) {
  const helmetCss = o.css ? '\n' + o.css : '';
  const w = o.w || 360, h = o.h || 780;
  const props = o.paper
    ? `{"$preview":{"width":${w},"height":${h}}}`
    : `{"theme":{"editor":"enum","options":["light","dark"],"default":"light"},"$preview":{"width":${w},"height":${h}}}`;
  const script = o.paper
    ? 'class Component extends DCLogic {\n  renderVals() {\n    return {};\n  }\n}'
    : "class Component extends DCLogic {\n  renderVals() {\n    const dark = (this.props.theme ?? 'light') === 'dark';\n    return { rootClass: dark ? 'sk dark' : 'sk' };\n  }\n}";
  const root = o.paper ? o.body : `<div class="{{rootClass}} phone${o.cls ? ' ' + o.cls : ''}">\n${o.body}\n</div>`;
  return `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<title>${o.title}</title>
<script src="./support.js"></script>
<link rel="stylesheet" href="skall.css">
</head>
<body>
<x-dc>
<helmet>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&amp;display=swap">
<style>
body{margin:0}${helmetCss}
</style>
</helmet>
${root}
</x-dc>
<script type="text/x-dc" data-dc-script data-props='${props}'>
${script}
</script>
</body>
</html>
`;
}
// Sohbet duvarları (helmet kuralı)
const WALL = {
  dm: '.wall{background:url(/_blob/42b67e7270df8020349bc5eb5eecfe03) 0 0/300px 300px repeat,#E9E1F1}\n.dark .wall{background:url(/_blob/5bcb04efeaeedf024f08e94648887e10) 0 0/300px 300px repeat,#110D22}',
  masa: '.wall{background:url(/_blob/87cc46f82206b95f4520a29b2812b24d) 0 0/300px 300px repeat,#F0E3D9}\n.dark .wall{background:url(/_blob/b87337ee9d7ede835c94ef4408ffed8a) 0 0/300px 300px repeat,#150C1A}',
  mekan: '.wall{background:url(/_blob/995f50ac1df75a4d4ae999e0efe9df0a) 0 0/300px 300px repeat,#DDEBE6}\n.dark .wall{background:url(/_blob/502c2de48c55bc0bfedb5fc2acef184b) 0 0/300px 300px repeat,#0A121A}',
};

// Var olan bir panonun gövdesini al (alt sayfaların arka planı için), id'leri yeniden adlandır
function fromBoard(name) {
  const own = path.join(HAND, name + '.dc.html');
  const s = fs.readFileSync(fs.existsSync(own) ? own : path.join(PROJ, name + '.dc.html'), 'utf8');
  const body = s.split('<x-dc>')[1].split('</x-dc>')[0].replace(/<helmet>[\s\S]*?<\/helmet>/, '');
  const inner = body.replace(/^\s*<div class="\{\{rootClass\}\} phone">/, '').replace(/<\/div>\s*$/, '');
  return reid(inner);
}

module.exports = {
  ROOT, HAND, PROJ, setBoard, uid, reid, I, ico, B, bar, btn, status, round, rowEq, av, AVS, LOOKS, capsule, capAv, emo, react,
  tableIcon, iconSrc, ICON_CAT, TABLES, POSTERS, posterArt, eventCover, GHOST, ghostAv, venueThumb, gameThumb, chips, menu, VENUE, tabbar, tabTop, innerTop, mekanTop, venueChatIco, item, note, meta, list, card, section, banner,
  msg, typingMsg, day, chat, venueChatTop, pressMenu, replyBar, emoKeys,
  push, sheet, dialog, glyphLoad, glyphEmpty, glyphError, stateCard, emptyHero, doc, WALL, fromBoard, WORDMARK,
};
