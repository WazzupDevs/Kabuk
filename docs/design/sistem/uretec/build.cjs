// Kullanım: node build.cjs <sayfa...>   (ör. kayit mekan): panoları PROJ'a (.uretim ya da SISTEM_CIKTI) yazar, yazılanları listeler
const fs = require('fs');
const path = require('path');
const L = require('./lib.cjs');
const want = process.argv.slice(2);
const written = [];
fs.mkdirSync(L.PROJ, { recursive: true });
for (const id of want) {
  const mod = require('./' + id + '.cjs');
  for (const [name, b] of Object.entries(mod.boards)) {
    L.setBoard(name.replace(/[^A-Za-z]/g, '').slice(0, 10).toLowerCase() + '_');
    const body = typeof b.body === 'function' ? b.body() : b.body;
    const html = L.doc({ title: b.title, body, cls: b.cls, css: b.css, paper: b.paper, w: b.w, h: b.h });
    const file = path.join(L.PROJ, name + '.dc.html');
    fs.writeFileSync(file, html);
    written.push(name);
  }
}
console.log(written.join(' '));
