// Masa: sahibi, katılımcı, pencereler, davet, masa bitti
const L = require('./lib.cjs');
const { ico, bar, btn, sheet, note, meta, tableIcon, item, msg, day } = L;

// Üst satır (§4.C, v46 masa): geri, simge, ad ve "N kişi" (Masadakiler'i açar); sahipte Bitir, katılımcıda Ayrıl
const top = (name, n, part) => L.innerTop({ lead: tableIcon(name, 's40'), title: name, sub: `<i class="live"></i>${n} kişi`, right: part ? btn('Ayrıl', { size: 's', kind: 'negative', ico: 'exit' }) : btn('Bitir', { size: 's', kind: 'negative', bar: 'end' }) });
// Sahip çubuğu (K-39): lobide değilken Lobiye aç, lobideyken Lobiden çek; yanında Davet et
const ownerRow = (lobby) => L.rowEq(lobby ? btn('Lobiden çek', { size: 's', bar: 'lobby' }) : btn('Lobiye aç', { size: 's', kind: 'primary', bar: 'lobby' }), btn('Davet et', { size: 's', bar: 'add', tone: 'positive' }));
const seg = (tab, chat) => `<div class="seg"><span${tab === 'oyun' ? ' class="on"' : ''}>Oyun Seç (6)</span><span${tab === 'sohbet' ? ' class="on"' : ''}>Masa Sohbeti (${chat})</span></div>`;
const head = (o) => `${top(o.name, o.n, o.part)}<div style="padding: 0 16px 12px; display: flex; flex-direction: column; gap: 12px; flex: none;">${o.part ? '' : ownerRow(o.lobby)}${o.request || ''}${seg(o.tab, o.chat)}</div>`;

// Posterler (v46 .poster, 6 oyun): masadaki telefon alt sınırdan azsa soluk; adımı gelmemiş oyun "Yakında"
const GAMES6 = ['ka', 'ib', 'sg', 'hk', 'sk', 'sh'];
function poster(g, o = {}) {
  const P = L.POSTERS[g];
  const faded = o.soon || (o.n && o.n < P.min);
  const soon = o.soon ? '<span class="tag glass" style="position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);">Yakında</span>' : '';
  return `<div class="card media" style="${o.on ? 'box-shadow: 0 0 0 2px var(--primary);' : ''}${faded ? 'opacity: 0.6;' : ''}"><div class="art" style="height: 150px;${o.soon ? ' filter: grayscale(0.7);' : ''}">${L.posterArt(g)}${o.votes ? `<span class="badge" style="position: absolute; top: 10px; left: 10px;">${o.votes}</span>` : ''}<span class="tag light" style="position: absolute; top: 10px; right: 10px;">${P.min}+ kişi</span>${soon}</div><div class="body" style="flex-direction: column; align-items: flex-start; gap: 2px; padding: 10px 12px 12px;"><span class="t-h3">${P.name}</span><span class="t-note">${P.sub}</span></div></div>`;
}
const cats = () => `<div class="chips scroller"><span class="chip on">Tümü<span class="cnt">6</span></span><span class="chip">Takımlı<span class="cnt">2</span></span><span class="chip">Bire bir<span class="cnt">2</span></span><span class="chip">Çok oyunculu<span class="cnt">4</span></span></div>`;
const grid = (...p) => `<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; flex: none;">${p.join('')}</div>`;
const voteNote = (title, text, icon = 'check') => `<div class="card state" style="padding: 14px 16px;"><span class="glyph" style="width: 40px; height: 40px;">${ico(icon, '', 'width: 20px; height: 20px;')}</span><div class="mid"><span class="t-label">${title}</span><span class="t-note">${text}</span></div></div>`;

function games(o) {
  const votes = { ka: 2, sg: 1 };
  const quiet = o.soon || o.n === 1;
  const posters = GAMES6.map((g) => poster(g, { soon: o.soon, n: o.n, votes: quiet ? 0 : votes[g], on: !quiet && g === 'ka' }));
  const solo = o.n === 1 ? `<div class="card soft" style="flex-direction: row; align-items: center; gap: 12px;">${L.glyphEmpty()}<div class="mid" style="flex: 1; display: flex; flex-direction: column; gap: 2px;"><span class="t-h3">Masada yalnızca sensin</span><span class="t-note">Arkadaşlarını davet et ya da masanı lobiye aç. Oyunların çoğu en az 2 kişiyle başlar.</span></div></div>` : '';
  const vote = o.soon || o.n === 1 ? '' : o.part ? voteNote('Oy verdin: Kapsül Anlat', 'Bir oyuna dokunup oy ver. Oyunu masa sahibi başlatır.') : voteNote('En çok oy: Kapsül Anlat (2)', 'Oylar öneridir; istediğin oyunu başlatabilirsin.');
  const cta = o.part || o.soon || o.n === 1 ? '' : `<div class="foot">${btn("Kapsül Anlat'ı başlat", { kind: 'primary', size: 'l', full: true })}</div>`;
  return `${head({ ...o, tab: 'oyun' })}<div class="scroll" style="padding-bottom: 24px;">${solo}${cats()}${vote}${grid(...posters)}</div>${cta}`;
}
const masaChat = (o, stream) => `${head({ ...o, tab: 'sohbet' })}${L.chat({ stream, placeholder: 'Masaya yaz' })}`;
const OWNER = { name: 'Mor Dalga', n: 6, chat: 4 };
const PART = { name: 'Neşeli Panda', n: 6, chat: 2, part: true };

// İstek kartı (§4.E, v46 data-req): istekçi masanın adı ve telefon sayısı; profilli istekçinin adı, yaşı ve fotoğrafı
function request(kind) {
  const corner = (face) => `<span style="position: relative; flex: none;">${tableIcon('Atak Tilki', 's48')}<span style="position: absolute; right: -6px; bottom: -6px; border-radius: 50%; box-shadow: 0 0 0 2px var(--surface);">${face}</span></span>`;
  if (kind === 'coming')
    return `<div class="card" style="box-shadow: var(--shadow-float);">${item({ lead: L.glyphLoad(), title: 'Atak Tilki geliyor, 3 kişi', sub: note('Masanın yanına geliyorlar.') })}</div>`;
  const who = {
    anon: item({ lead: L.capAv('Uzaylı', 's48'), title: 'kapsul-ty93 katılmak istiyor', sub: meta('Anonim', '58 sn') }),
    person: item({ lead: L.av('Zeynep', 's48'), title: 'Zeynep, 23 katılmak istiyor', sub: meta('Profiliyle', '58 sn') }),
    table: item({ lead: corner(L.av('Kerem', 's32', ' style="width: 24px; height: 24px;"')), title: 'Atak Tilki katılmak istiyor', sub: meta('3 kişi', 'isteyen Kerem, 24', '52 sn') }),
    full: item({ lead: corner(L.capAv('Uzaylı', 's32').replace('class="av s32"', 'class="av s32" style="width: 24px; height: 24px;"')), title: 'Atak Tilki katılmak istiyor', sub: meta('4 kişi', 'isteyen anonim', '47 sn') }),
  }[kind];
  const full = kind === 'full' ? `<span class="hint error">Birlikte 12 kişiyi geçersiniz. Masada en çok 12 kişi olur.</span>` : '';
  return `<div class="card" style="box-shadow: var(--shadow-float);">${who}${full}${L.rowEq(btn('Reddet', { kind: 'quiet', bar: 'end', tone: 'negative' }), btn('Kabul et', { kind: 'positive', bar: 'accept', state: kind === 'full' ? 'disabled' : '' }))}</div>`;
}
const sheetActs = (a, b = 'Vazgeç') => `<div class="stack" style="gap: 10px;">${a}${btn(b, { kind: 'quiet', size: 'l', full: true })}</div>`;
const inviteSheet = (body, extra = '') => sheet('Masana davet et', `<h2 class="t-h2">Masana davet et</h2><p class="t-note">Davet yalnızca şu an bu mekanda olan arkadaşına ulaşır. Kimin burada olduğu görünmez; her davette "Davet gönderildi" yazar. Davet 2 dakika geçerli.</p>${extra}${body}${btn('Tamam', { kind: 'quiet', size: 'l', full: true })}`);
// Davet listesi (K-2, K-18): bütün arkadaşlar; gönderilende "Davet gönderildi" ve 2 dakikalık geri sayım. "Masanda" yok (§4.C 4.5b)
const inviteRow = (p, sent, off) => item({ lead: L.av(p, 's40'), title: p, sub: sent ? note('Davet gönderildi') : '', end: sent ? `<span class="btn s quiet act"><span class="busy-dots brand"><i></i><i></i><i></i></span>${sent}</span>` : btn('Davet et', { size: 's', kind: 'secondary', act: true, bar: 'add', state: off ? 'disabled' : '' }) });
const inviteList = (o = {}) => `<div style="display: flex; flex-direction: column;">${[['Ece'], ['Fevve'], ['Zeynep', '1:52'], ['Burak'], ['Deniz']].map(([p, t]) => inviteRow(p, o.full ? '' : t, o.full)).join('')}</div>`;
const person = (name, avatar, tags = '') => `<div class="row-x" style="gap: 10px; min-width: 0;">${avatar}<div style="display: flex; flex-direction: column; gap: 4px; min-width: 0;"><span class="t-h3">${name}</span>${tags}</div></div>`;
const pips = (n) => `<span class="row-x" style="gap: 3px;">${[0, 1, 2].map((i) => `<i class="dot" style="background: var(--brand-pink); box-shadow: none; width: 8px; height: 8px;${i >= n ? ' opacity: 0.25;' : ''}"></i>`).join('')}</span>`;
// Masadakiler (v46 data-msheet, K-40): kişiye dokununca Profili gör, Şikayet et, Engelle; sahipte adın kutusu (Başka ad, 3 hak)
const peopleSheet = (owner = true) => sheet('Masadakiler', `<div class="row-x" style="gap: 8px; align-items: baseline;"><h2 class="t-h2">Masadakiler</h2><span class="t-note">6 kişi</span></div><p class="t-note">Herkes kendi telefonuyla katılır. Masada en çok 12 kişi olur.</p>
<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px 12px;">${owner ? person('Elif', L.av('Elif', 's40'), '<div class="row-x" style="gap: 4px; flex-wrap: wrap;"><span class="tag" style="background: var(--ink); color: var(--surface);">Masa sahibi</span><span class="tag">Sen</span></div>') : person('Can', L.av('Can', 's40'), '<span class="tag" style="background: var(--ink); color: var(--surface); align-self: flex-start;">Masa sahibi</span>')}${person('Ece', L.av('Ece', 's40'))}${person('Burak', L.av('Burak', 's40'))}${owner ? person('Can', L.av('Can', 's40')) : person('Elif', L.av('Elif', 's40'), '<span class="tag" style="align-self: flex-start;">Sen</span>')}${person('Deniz', L.av('Deniz', 's40'))}${person('kapsul-vf61', L.capAv('Kaptan', 's40'))}</div>
${owner ? `<div class="card soft" style="flex-direction: row; align-items: center; gap: 12px; padding: 12px 14px;"><div class="mid" style="flex: 1; display: flex; flex-direction: column; gap: 4px;"><span class="t-small muted">Masanın adı</span><span class="t-h3">Mor Dalga</span><span class="row-x" style="gap: 6px;">${pips(3)}<span class="t-note">3 yenileme hakkın var</span></span></div>${btn('Başka ad', { size: 's', ico: 'refresh' })}</div>` : ''}
${btn('Kapat', { kind: 'quiet', size: 'l', full: true })}`);
const personSheet = (name, profiled) => sheet(name, `<div class="row-x" style="gap: 12px;">${profiled ? L.av(name, 's48') : L.capAv('Kaptan', 's48')}<h2 class="t-h2">${name}</h2></div>${L.menu([...(profiled ? [{ t: 'Profili gör', ico: 'person' }] : []), { t: 'Şikayet et', bar: 'report', neg: true }, { t: 'Engelle', ico: 'block', neg: true, sub: 'Masadan çıkarılır. Karşı tarafa bildirilmez.' }])}${btn('Vazgeç', { kind: 'quiet', size: 'l', full: true })}`);

module.exports = {
  id: 'masa',
  name: 'Masa',
  groups: [
    ['Masa sahibi', ['Masa', 'MasaSohbeti', 'MasaLobide', 'MasaYalniz', 'Masa12Kisi', 'MasaPosterlerYakinda']],
    ['Gelen istek (§4.E)', ['MasaIstekGelsin', 'MasaIstekAnonim', 'MasaIstekMasa', 'MasaIstekDolu', 'MasaIstekGeliyor']],
    ['Katılımcı', ['MasaKatilimci', 'MasaKatilimciSohbet', 'MasaKisilerKatilimci']],
    ['Pencereler', ['MasaKisiler', 'MasaKisiSecenekler', 'MasaKisiSeceneklerAnonim', 'MasaSimgeDegistir', 'MasaLobiyeAc', 'MasaBitir', 'MasaAyril']],
    ['Davet (§4.G)', ['Davet', 'MasaDavetDolu', 'MasaDavetYukleniyor', 'MasaDavetHata', 'MasaDavetBos']],
    ['Masa bitti (K-56, K-64, K-68)', ['MasaBitti', 'MasaBittiEklendi', 'MasaBittiEslesti', 'MasaBittiAnonim', 'MasaBittiAyrildin']],
  ],
  games, head, OWNER, PART, top,
  boards: {
    Masa: { title: 'Masa sahibi: oyun seç', body: () => games(OWNER) },
    MasaSohbeti: {
      title: 'Masa sahibi: masa sohbeti', css: L.WALL.masa,
      body: () => masaChat(OWNER, [day('Bugün'), msg({ av: 'Can', who: 'Can', nc: 1, first: true, text: 'Kapsül Anlat mı açıyoruz?', time: '21:42' }), msg({ cap: 'Kaptan', who: 'kapsul-vf61', nc: 2, first: true, text: 'Ben anlatıcı olurum', time: '21:43' }), msg({ av: 'Ece', who: 'Ece', nc: 3, first: true, text: 'Önce Sahtekar olsun', time: '21:43' }), msg({ av: 'Ece', text: 'Kalabalığız, Sahtekar daha eğlenceli olur', time: '21:43' }), msg({ own: true, first: true, text: 'Bence Kapsül Anlat, sonra Sahtekar', time: '21:44', reacts: [['kahkaha', 2]] })].join('')),
    },
    MasaLobide: { title: 'Masa sahibi: masa lobide (K-39)', body: () => games({ ...OWNER, lobby: true }) },
    MasaYalniz: { title: 'Masada yalnızca sen', body: () => games({ ...OWNER, n: 1 }) },
    Masa12Kisi: { title: 'Masa sahibi: 12 kişi', body: () => games({ ...OWNER, n: 12 }) },
    MasaPosterlerYakinda: { title: 'Oyunlar 4.6 öncesi: Yakında', body: () => games({ ...OWNER, soon: true }) },
    MasaIstekGelsin: { title: 'İstek: profilli kişi', body: () => games({ ...OWNER, request: request('person') }) },
    MasaIstekAnonim: { title: 'İstek: anonim kişi', body: () => games({ ...OWNER, request: request('anon') }) },
    MasaIstekMasa: { title: 'İstek: başka masa', body: () => games({ ...OWNER, request: request('table') }) },
    MasaIstekDolu: { title: 'İstek: 12 kişiyi geçer', body: () => games({ ...OWNER, n: 9, request: request('full') }) },
    MasaIstekGeliyor: { title: 'Kabul: "geliyor", tek sefer', body: () => games({ ...OWNER, n: 9, request: request('coming') }) },
    MasaKatilimci: { title: 'Katılımcı: oyun seç', body: () => games(PART) },
    MasaKatilimciSohbet: {
      title: 'Katılımcı: masa sohbeti', css: L.WALL.masa,
      body: () => masaChat(PART, [day('Masaya katıldın'), msg({ av: 'Can', who: 'Can', nc: 1, first: true, text: 'Hoş geldin! Kapsül Anlat mı açıyoruz?', time: '21:42' }), msg({ av: 'Ece', who: 'Ece', nc: 3, first: true, text: 'Önce Sahtekar olsun, kalabalığız', time: '21:43' })].join('')),
    },
    MasaKisilerKatilimci: { title: 'Masadakiler: katılımcı', body: () => games(PART) + peopleSheet(false) },
    MasaKisiler: { title: 'Masadakiler: sahip', body: () => games(OWNER) + peopleSheet(true) },
    MasaKisiSecenekler: { title: 'Kişiye dokununca: profilli', body: () => games(OWNER) + personSheet('Ece', true) },
    MasaKisiSeceneklerAnonim: { title: 'Kişiye dokununca: anonim', body: () => games(OWNER) + personSheet('kapsul-vf61', false) },
    MasaSimgeDegistir: {
      title: 'Simgeye dokununca (K-59)',
      body: () => games(OWNER) + sheet('Masa simgesi', `<h2 class="t-h2">Masa simgesi</h2>${require('./mekan.cjs').iconPicker('uzay-galaksi', ['uzay-gezegen', 'uzay-ufo'])}${btn('Tamam', { kind: 'primary', size: 'l', full: true })}`),
    },
    MasaLobiyeAc: {
      title: 'Lobiye aç penceresi',
      body: () => games(OWNER) + sheet('Masanı lobiye aç', `<h2 class="t-h2">Masanı lobiye aç</h2><p class="t-note">Mekandakiler masanı lobide görür ve katılmak isteyebilir. İstek gelince sana sorulur.</p>
<div class="card soft" style="gap: 10px; padding: 14px;"><span class="t-label">Niyetin (isteğe bağlı)</span>${L.chips(['Etiket yok', 'Oyun', 'Sohbet'], 'Etiket yok')}<span class="t-label" style="margin-top: 4px;">Oyun (isteğe bağlı)</span>${L.chips(['Fark etmez', 'Kapsül Anlat', 'Sahtekar'], 'Fark etmez')}<span class="t-note">Etiketler yalnızca lobide görünür; oyunu başlatmaz.</span></div>
${sheetActs(btn('Lobiye aç', { kind: 'primary', size: 'l', full: true, bar: 'lobby' }))}`),
    },
    MasaBitir: {
      title: 'Masayı bitir: sahibin Ayrılı da burada',
      body: () => games(OWNER) + sheet('Masayı bitir', `<h2 class="t-h2">Masayı bitir?</h2><p class="t-note">Masa herkes için kapanır. Oyun ve sohbet biter.</p><div class="stack" style="gap: 10px;">${btn('Masayı bitir', { kind: 'negative', size: 'l', full: true, bar: 'end' })}${btn('Masadan ayrıl', { size: 'l', full: true, ico: 'exit' })}<span class="t-note" style="text-align: center;">Ayrılırsan masa sürer; sahiplik masaya en erken katılana geçer.</span>${btn('Vazgeç', { kind: 'quiet', size: 'l', full: true })}</div>`),
    },
    MasaAyril: {
      title: 'Masadan ayrıl penceresi',
      body: () => games(PART) + sheet('Masadan ayrıl', `<h2 class="t-h2">Masadan ayrıl?</h2><p class="t-note">Mekana dönersin. Masa diğerleri için sürer.</p>${sheetActs(btn('Masadan ayrıl', { kind: 'negative', size: 'l', full: true, ico: 'exit' }))}`),
    },
    Davet: { title: 'Davet: arkadaş listesi', body: () => games(OWNER) + inviteSheet(inviteList()) },
    MasaDavetDolu: { title: 'Davet: masa dolu', body: () => games({ ...OWNER, n: 12 }) + inviteSheet(inviteList({ full: true }), L.banner('', 'Masa dolu. Masada en çok 12 kişi olur.', 'warn')) },
    MasaDavetYukleniyor: { title: 'Davet: yükleniyor', body: () => games(OWNER) + inviteSheet(L.stateCard('load', 'Arkadaşların yükleniyor', 'Bir saniye.').replace('class="card state"', 'class="card state flat"')) },
    MasaDavetHata: { title: 'Davet: hata', body: () => games(OWNER) + inviteSheet(L.stateCard('error', 'Arkadaşların yüklenemedi', 'Bağlantını kontrol edip yeniden dene.', btn('Yeniden dene', { full: true, ico: 'refresh' })).replace('class="card state col"', 'class="card state col flat"')) },
    MasaDavetBos: { title: 'Davet: arkadaş yok', body: () => games(OWNER) + inviteSheet(L.stateCard('empty', 'Henüz arkadaşın yok', 'Masa bitince oynadığın kişileri arkadaş olarak ekleyebilirsin. Masanı lobiye açarsan mekandakiler katılmak isteyebilir.').replace('class="card state"', 'class="card state flat"')) },
    MasaBitti: { title: 'Masa bitti', body: () => bitti({}) },
    MasaBittiEklendi: { title: 'Masa bitti: eklediğin kişi', body: () => bitti({ added: true }) },
    MasaBittiEslesti: { title: 'Masa bitti: ikiniz de ekledi', body: () => bitti({ added: true, matched: true }) },
    MasaBittiAnonim: { title: 'Masa bitti: anonim katıldın (K-68)', body: () => bitti({ anon: true }) },
    MasaBittiAyrildin: { title: 'Masadan ayrıldın', body: () => bitti({ left: true }) },
  },
};

// Masa bitti (K-56, K-64, K-68): listede herkes, anonim dahil; Arkadaş ekle, Eklendi, eşleşince Arkadaş oldunuz ve Mesaj
function bitti(o) {
  const add = (on) => on ? btn('Eklendi', { kind: 'quiet', size: 's', act: true, ico: 'check' }) : btn('Arkadaş ekle', { kind: 'positive', size: 's', act: true });
  const mark = (() => { const c = L.uid(); return `<span class="glyph" style="width: 88px; height: 88px; border-radius: 28px;"><svg viewBox="86 86 340 340" width="58" height="58" aria-hidden="true"><defs><clipPath id="${c}"><rect width="96" height="236" rx="48"/></clipPath></defs><g transform="translate(180 111)"><rect width="96" height="236" rx="48" fill="#7B5CFF"/><rect x="56" y="54" width="96" height="236" rx="48" fill="#FF4F8B"/><g clip-path="url(#${c})"><rect x="56" y="54" width="96" height="236" rx="48" fill="#FFB547"/></g></g></svg></span>`; })();
  const can = o.matched
    ? item({ lead: L.av('Can', 's48'), title: 'Can', sub: '<span class="t-note" style="color: var(--on-success-soft);">Arkadaş oldunuz</span>', end: btn('Mesaj', { kind: 'primary', size: 's', act: true, bar: 'send' }) })
    : item({ lead: L.av('Can', 's48'), title: 'Can', end: add(o.added) });
  const foot = o.added && !o.matched ? 'Can bunu görmez. O da seni eklerse ikinize de haber gelir ve arkadaş olursunuz. Yeniden basarsan geri alırsın.' : 'Eklediğin kişi bunu görmez. O da seni eklerse ikinize de haber gelir ve arkadaş olursunuz.';
  const anonNote = o.anon ? `<div class="card soft" style="flex-direction: row; align-items: flex-start; gap: 10px; padding: 12px 14px;">${L.capAv('Gözlük', 's32')}<span class="t-note" style="flex: 1;">Arkadaş olursanız anonim adının sen olduğunu görür. İstersen Profil'den adını yenileyebilirsin.</span></div>` : '';
  return `<div class="scroll" style="padding: ${o.anon ? 24 : 40}px 16px 0; align-items: stretch;">
<div class="stack" style="align-items: center; text-align: center; gap: 8px;">${mark}<h1 class="t-h1" style="margin-top: 6px;">${o.left ? 'Masadan ayrıldın' : 'Masa bitti'}</h1><p class="t-note" style="font-size: 14px; line-height: 20px;">Mor Dalga · 6 kişi. Beğendiğin kişileri ekle.</p></div>
${L.list(
    item({ lead: L.av('Ece', 's48'), title: 'Ece', end: L.status('Arkadaşsınız', { tone: 'positive' }) }),
    o.anon ? '' : item({ lead: L.av('Burak', 's48'), title: 'Burak', end: L.status('Arkadaşsınız', { tone: 'positive' }) }),
    can,
    item({ lead: L.av('Deniz', 's48'), title: 'Deniz', end: add(false) }),
    o.anon ? item({ lead: L.av('Zeynep', 's48'), title: 'Zeynep', end: add(false) }) : item({ lead: L.capAv('Kaptan', 's48'), title: 'kapsul-vf61', sub: note('Anonim katıldı'), end: add(false) }),
  )}
<p class="t-note" style="text-align: center; padding: 0 12px;">${foot}</p>${anonNote}
</div><div class="foot">${btn('Mekana dön', { kind: 'primary', size: 'l', full: true })}</div>`;
}
