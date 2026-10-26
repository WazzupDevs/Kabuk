// Tuvali repoya aktarır: her pano için durağan bir sayfa (ekran/), dizin (index.html), token'lar ve durum listesi.
//
// Kullanım (docs/design/sistem/ içinde ya da repo kökünden):
//   node docs/design/sistem/uretec/aktar.cjs                  üreteçle panoları kurar, tuval/'deki elle çizilenleri ekler
//   node docs/design/sistem/uretec/aktar.cjs --kaynak <dizin> tuvalden indirilen project/ dizinini olduğu gibi aktarır
//
// Kaynak tuvaldir (README.md). Bu betik yalnızca aktarır; ekran/ elle düzenlenmez.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const HAND = path.join(ROOT, 'tuval');
const OUT = path.join(ROOT, 'ekran');
const VARLIK = JSON.parse(fs.readFileSync(path.join(__dirname, 'varlik.json'), 'utf8'));
const MODULES = ['sistem', 'kayit', 'kesfet', 'mekan', 'mekansohbeti', 'masa', 'oyun', 'mesaj', 'profil', 'ayarlar'];

const args = process.argv.slice(2);
const at = args.indexOf('--kaynak');
let SRC;
if (at >= 0) {
  SRC = path.resolve(args[at + 1]);
} else {
  SRC = path.join(ROOT, '.uretim');
  fs.rmSync(SRC, { recursive: true, force: true });
  fs.mkdirSync(SRC, { recursive: true });
  execFileSync(process.execPath, [path.join(__dirname, 'build.cjs'), ...MODULES], { env: { ...process.env, SISTEM_CIKTI: SRC }, stdio: 'ignore' });
  for (const f of fs.readdirSync(HAND)) fs.copyFileSync(path.join(HAND, f), path.join(SRC, f));
}
const C = JSON.parse(fs.readFileSync(path.join(SRC, 'canvas.json'), 'utf8'));

const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const blobs = (s, rel) =>
  s.replace(/\/_blob\/([0-9a-f]{32})/g, (m, id) => {
    if (!VARLIK[id]) throw new Error('varlik.json bu blob\'u tanımıyor: ' + id);
    return rel + 'varlik/' + VARLIK[id];
  });
// Tema ve genişlik: ?tema=koyu, ?genislik=320 (görsel kapı ve oturumlar aynı adresle açar)
const PARAMS = `<script>(function(){var q=new URLSearchParams(location.search),k=q.get('tema')==='koyu',w=parseInt(q.get('genislik')||'',10),s=document.createElement('style');s.textContent=(k?'body{background:#0D0B1E}':'')+(w>=280&&w<=400?'.phone{width:'+w+'px!important}':'');document.head.appendChild(s);if(k)document.addEventListener('DOMContentLoaded',function(){var r=document.querySelector('.sk');if(r)r.classList.add('dark');});})();</script>`;
const FONTS = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&amp;display=swap">';

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
const boards = [];
for (const [file, b] of Object.entries(C.boards)) {
  const id = file.replace(/\.dc\.html$/, '');
  if (id.startsWith('Koyu')) continue; // tuvaldeki koyu kopyalar: her sayfa ?tema=koyu ile açılır
  const s = fs.readFileSync(path.join(SRC, file), 'utf8');
  const inner = s.split('<x-dc>')[1].split('</x-dc>')[0];
  const css = ((inner.match(/<helmet>[\s\S]*?<\/helmet>/) || [''])[0].match(/<style>([\s\S]*?)<\/style>/) || ['', ''])[1];
  const body = inner.replace(/<helmet>[\s\S]*?<\/helmet>/, '').replace(/\{\{\s*rootClass\s*\}\}/g, 'sk').trim();
  const phone = body.includes('class="sk phone');
  const html = `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(b.title || id)}</title>
${FONTS}
<link rel="stylesheet" href="../skall.css">
<style>
body{margin:0;background:#FFFFFF}${blobs(css, '../').replace(/body\{margin:0\}/, '')}
</style>
${phone ? PARAMS : ''}
</head>
<body>
${blobs(body, '../')}
</body>
</html>
`;
  fs.writeFileSync(path.join(OUT, id + '.html'), html);
  boards.push({ id, sayfa: b.page, baslik: b.title || id, tema: phone, genislik: b.w || 360, yukseklik: b.h || 780 });
}

// Durum listesi: tuvalin sırası; görsel kapı ve oturumlar buradan seçer
const order = (C.order || []).map((f) => f.replace(/\.dc\.html$/, ''));
boards.sort((a, z) => order.indexOf(a.id) - order.indexOf(z.id));
const pages = C.pages.filter((p) => p.id !== 'koyu');
fs.writeFileSync(path.join(ROOT, 'durumlar.json'), JSON.stringify({ sayfalar: pages, panolar: boards }, null, 1) + '\n');

// Token'lar: skall.css'teki açık (.sk) ve koyu (.sk.dark) değişkenler
const css = fs.readFileSync(path.join(ROOT, 'skall.css'), 'utf8');
const block = (sel) => {
  const i = css.indexOf(sel + ' {');
  if (i < 0) throw new Error('skall.css içinde yok: ' + sel);
  const body = css.slice(i, css.indexOf('}', i));
  return Object.fromEntries([...body.matchAll(/--([a-z0-9-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
};
fs.writeFileSync(path.join(ROOT, 'tokens.json'), JSON.stringify({ acik: block('.sk'), koyu: block('.sk.dark') }, null, 1) + '\n');

// Dizin: sayfa sayfa panolar, açık ve koyu
const groups = pages.map((p) => {
  const list = boards.filter((b) => b.sayfa === p.id);
  const cards = list
    .map((b) => {
      const w = b.genislik, h = b.yukseklik, k = b.tema ? 0.5 : 0.3;
      return `<a class="pano" href="ekran/${b.id}.html" data-tema="${b.tema ? 1 : 0}" style="width:${w * k}px"><span class="kutu" style="width:${w * k}px;height:${h * k}px"><iframe loading="lazy" tabindex="-1" src="ekran/${b.id}.html" style="width:${w}px;height:${h}px;transform:scale(${k})"></iframe></span><b>${esc(b.baslik)}</b><small>${b.id}</small></a>`;
    })
    .join('\n');
  return `<section><h2>${esc(p.name)} <small>${list.length} pano</small></h2><div class="izgara">\n${cards}\n</div></section>`;
});
fs.writeFileSync(
  path.join(ROOT, 'index.html'),
  `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>skall tuvali</title>
${FONTS}
<style>
body{margin:0;padding:24px;font-family:"Plus Jakarta Sans",system-ui,sans-serif;background:#F5F3FC;color:#14112B}
body.koyu{background:#0D0B1E;color:#F3F0FF}
header{display:flex;align-items:center;gap:16px;flex-wrap:wrap}
h1{margin:0;font-size:28px}
h2{font-size:20px;margin:32px 0 12px}
h2 small,a small{font-weight:600;opacity:.6;font-size:12px}
p{max-width:720px;line-height:1.5}
button{font:inherit;font-weight:700;padding:8px 16px;border-radius:999px;border:0;background:#6A47F5;color:#fff;cursor:pointer}
.izgara{display:flex;flex-wrap:wrap;gap:20px}
.pano{display:flex;flex-direction:column;gap:4px;color:inherit;text-decoration:none}
.pano b{font-size:13px;line-height:1.3}
.kutu{display:block;overflow:hidden;border-radius:14px;box-shadow:0 2px 10px rgba(20,17,43,.12);background:#fff;position:relative}
.kutu iframe{border:0;transform-origin:0 0;pointer-events:none;position:absolute;left:0;top:0}
</style>
</head>
<body>
<header><h1>skall tuvali</h1><button type="button" id="tema">Koyu tema</button></header>
<p>Uygulamanın görsel kaynağı. Her pano ayrı bir sayfadır: <code>ekran/&lt;Pano&gt;.html</code>, koyu tema için <code>?tema=koyu</code>, dar ekran için <code>?genislik=320</code>. Öncelik ve güncelleme: README.md.</p>
${groups.join('\n')}
<script>
document.getElementById('tema').addEventListener('click',function(){var k=document.body.classList.toggle('koyu');this.textContent=k?'Açık tema':'Koyu tema';document.querySelectorAll('.pano[data-tema="1"] iframe').forEach(function(f){f.src=f.src.split('?')[0]+(k?'?tema=koyu':'');});});
</script>
</body>
</html>
`,
);
if (at < 0) fs.rmSync(SRC, { recursive: true, force: true });
console.log(`${boards.length} pano, ${pages.length} sayfa aktarıldı`);
