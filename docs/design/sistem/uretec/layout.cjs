// Tuval dizinini sayfalara göre yeniden dizer.
// Kullanım: node layout.cjs <okunan canvas.json> <yazılacak canvas.json> <sayfa...>
// Sayfa modülleri: id, name, groups [[başlık, [pano...]]]. Var olan panolar da gruplarda adıyla geçebilir.
const fs = require('fs');
const [, , src, dst, ...mods] = process.argv;
const C = JSON.parse(fs.readFileSync(src, 'utf8'));
const PAGES = [
  ['sistem', 'Sistem'], ['kayit', 'Kayıt ve açılış'], ['kesfet', 'Keşfet ve Aktiviteler'], ['mekan', 'Mekan'],
  ['mekansohbeti', 'Mekan sohbeti'], ['masa', 'Masa'], ['oyun', 'Oyunlar'], ['mesaj', 'Mesajlar'],
  ['profil', 'Profil ve kapsül'], ['ayarlar', 'Ayarlar'], ['koyu', 'Koyu tema'],
];
// Var olan sayfalar ve sistem panoları
const FIXED = {
  sistem: [['Sistem: her ekran bu parçalardan kurulur', ['Main', 'Ikonlar', 'Bilesenler']]],
  koyu: [['Koyu tema: aynı parçalar', ['KoyuMekan', 'KoyuMesajlar', 'KoyuDm', 'KoyuMasaSohbeti', 'KoyuMekanSohbeti']]],
  kesfet: [['Keşfet', ['Kesfet']]],
  mekan: [['Mekan', ['Mekan', 'Haller']]],
  mekansohbeti: [['Mekan sohbeti', ['MekanSohbeti']]],
  masa: [['Masa', ['Masa', 'MasaSohbeti', 'Davet']]],
  mesaj: [['Mesajlar', ['Mesajlar', 'Dm']]],
  profil: [['Profil', ['Profil']]],
};
const pageGroups = { ...FIXED };
const titles = {};
const sizes = {};
for (const m of mods) {
  const mod = require('./' + m + '.cjs');
  pageGroups[mod.id] = mod.groups;
  for (const [n, b] of Object.entries(mod.boards)) { titles[n] = b.title; if (b.w) sizes[n] = [b.w, b.h]; }
  Object.assign(titles, mod.titles || {});
}
// Sayfaları yaz (yalnızca içinde pano olanlar)
const used = PAGES.filter(([id]) => pageGroups[id]);
C.pages = used.map(([id, name]) => ({ id, name }));
C.launch = { view: 'canvas', page: 'sistem' };
// Eski başlık notları kalkar, her sayfa kendi başlıklarını alır
C.notes = {};
const ROW = 1110, NOTE = 250;
for (const [pid] of used) {
  let y = 0;
  pageGroups[pid].forEach(([title, boards], gi) => {
    let x = 0, h = 0;
    for (const b of boards) {
      const key = b + '.dc.html';
      const old = C.boards[key] || {};
      const w = (sizes[b] || [])[0] || old.w || 360, bh = (sizes[b] || [])[1] || old.h || 780;
      C.boards[key] = { ...old, x, y, w, h: bh, page: pid, title: titles[b] || old.title || b };
      x += w + 80; h = Math.max(h, bh);
    }
    C.notes[`${pid}${gi}`] = { x: 0, y: y - NOTE, text: title, kind: 'title1', maxW: Math.max(x - 80, 1200), page: pid };
    y += h + 120 + NOTE + 10;
  });
}
// Sıra: sayfa sırasıyla
const order = [];
for (const [pid] of used) for (const [, boards] of pageGroups[pid]) for (const b of boards) order.push(b + '.dc.html');
for (const k of Object.keys(C.boards)) if (!order.includes(k)) order.push(k);
C.order = ['Main.dc.html', ...order.filter((k) => k !== 'Main.dc.html')];
fs.writeFileSync(dst, JSON.stringify(C, null, 2) + '\n');
const missing = order.filter((k) => !fs.existsSync(require('path').join(require('path').dirname(dst), k)));
console.log('sayfalar', C.pages.map((p) => p.id).join(' '), '| pano', Object.keys(C.boards).length, missing.length ? '| DOSYASI YOK: ' + missing.join(' ') : '');
