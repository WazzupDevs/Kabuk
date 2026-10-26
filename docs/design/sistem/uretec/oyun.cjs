// Oyunlar: pilotun iki oyunu, Kapsül Anlat ve Sahtekar
const L = require('./lib.cjs');
const { ico, bar, btn, note, item } = L;

const WALL = '.stage > .wall{background:url(/_blob/b87337ee9d7ede835c94ef4408ffed8a) 0 0/300px 300px repeat}';
const PASS = '<svg class="bi" viewBox="0 0 24 24" aria-hidden="true"><path d="M5.5 6.5l5.5 5.5-5.5 5.5M12.5 6.5l5.5 5.5-5.5 5.5" fill="none" stroke="#E0A100" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const close = () => '<button class="round glass" aria-label="Oyundan çık">' + ico('close') + '</button>';
const score = (a, b) => `<span class="pillw" aria-label="Skor ${a} ${b}"><i class="tm a"></i>${a}<i class="vl"></i>${b}<i class="tm b"></i></span>`;
const myRole = () => btn('Rolüm', { size: 's', kind: 'primary', ico: 'eye' });
const gbar = (t, right) => `<header class="gbar">${close()}<span class="ttl">${t}</span>${right}</header>`;
const counters = (d, p, y) => `<span class="pillw s">${bar('accept', 'positive')}${d}${PASS}${p}${bar('report', 'negative')}${y}</span>`;
const roleRow = (role, c) => `<div class="grow-row"><span class="tag glass">${role}</span>${c || ''}</div>`;
const timer = (n, pct) => `<div class="timer"><b>${n}</b><span class="track"><i style="width: ${pct}%;"></i></span></div>`;
const wcard = (word, bans) => `<div class="wcard"><div class="word">${word}</div><div class="ban"><span class="t-small">SÖYLEME</span>${bans.map((b) => `<span>${b}</span>`).join('')}</div></div>`;
const stage = (kind, body) => ({ cls: 'stage ' + kind, css: WALL, body: () => '<div class="wall"></div>' + (typeof body === 'function' ? body() : body) });
const ring = (avatar, n, pct = 0.92, size = 132) => {
  const r = size / 2 - 3, c = 2 * Math.PI * r;
  return `<div class="ring" style="width: ${size}px; height: ${size}px;"><svg class="arc" viewBox="0 0 ${size} ${size}" aria-hidden="true"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="rgba(255,255,255,0.22)" stroke-width="4"/><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" stroke-dasharray="${(c * pct).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 ${size / 2} ${size / 2})"/></svg>${avatar.replace(/class="av s116"/, `class="av s116" style="width: ${size - 22}px; height: ${size - 22}px;"`)}${n !== undefined ? `<span class="cnt">${n}</span>` : ''}</div>`;
};
const avChip = (name, avatar) => `<span class="chip" style="padding-left: 4px; gap: 8px;">${avatar.replace(/class="av s32"/, 'class="av s32" style="width: 28px; height: 28px;"')}${name}</span>`;
const P = {
  Ece: () => L.av('Ece', 's32'), Sen: () => L.av('Elif', 's32'), Burak: () => L.av('Burak', 's32'), Can: () => L.av('Can', 's32'),
  'kapsul-vf61': () => L.capAv('Kaptan', 's32'), Deniz: () => L.av('Deniz', 's32'), Zeynep: () => L.av('Zeynep', 's32'), Kerem: () => L.av('Kerem', 's32'),
};
const big = (name) => (name === 'Sen' ? L.av('Elif', 's116') : name === 'kapsul-vf61' ? L.capAv('Kaptan', 's116') : L.av(name, 's116'));
const faces = (names, on, done = []) => `<div class="faces">${names.map((n) => P[n]().replace('class="av s32"', `class="av s32${n === on ? ' on' : done.includes(n) ? ' done' : ''}"`)).join('')}</div>`;
const SG = ['Ece', 'Sen', 'Burak', 'Can', 'kapsul-vf61'];

// Kapsül Anlat: takım seçimi
function kaTeams() {
  const team = (name, mark, n, members) => `<div class="card" style="gap: 10px; padding: 14px;"><div class="row-x" style="gap: 8px; align-items: flex-start;"><i style="width: 6px; height: 34px; border-radius: 3px; background: ${mark}; display: block; flex: none;"></i><div style="display: flex; flex-direction: column;"><span class="t-h3">${name}</span><span class="t-note">${n} kişi</span></div></div>${members.map((m) => `<div class="row-x" style="gap: 8px;">${P[m]().replace('class="av s32"', 'class="av s32" style="width: 28px; height: 28px;"')}<span class="t-label">${m}</span></div>`).join('')}<div style="flex: 1;"></div>${btn('Katıl', { size: 's', full: true })}</div>`;
  return `${L.innerTop({ title: 'Kapsül Anlat', sub: 'Takımını seç' })}
<div class="scroll" style="padding-bottom: 0;"><div class="row-x" style="gap: 6px; flex-wrap: wrap;"><span class="tag">6 tur</span><span class="tag">Turda 60 sn</span><span class="tag">Turda 3 pas</span></div>
<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; flex: none;">${team('Mor takım', '#7B5CFF', 1, ['Ece'])}${team('Pembe takım', '#FF4F8B', 2, ['Can', 'Burak'])}</div>
<div class="card" style="flex-direction: row; align-items: center; gap: 12px;"><div style="flex: 1; display: flex; flex-direction: column; gap: 2px;"><span class="t-h3">Gözlemciler</span><span class="t-note">Kartı görür, oynamaz.</span></div>${btn('Gözlemci ol', { size: 's' })}</div>
<div class="card" style="gap: 8px;"><span class="t-h3">Henüz seçmeyenler</span><span class="t-note">Oyun başlarken seçmeyenler gözlemci olur.</span><div class="row-x" style="gap: 6px; flex-wrap: wrap;">${avChip('Sen', P.Sen())}${avChip('Deniz', P.Deniz())}${avChip('kapsul-vf61', P['kapsul-vf61']())}</div></div>
</div><div class="foot"><span class="t-note" style="text-align: center;">Her takımda en az 2 kişi olmalı.</span>${L.rowEq(btn('Karıştır', { size: 'l', ico: 'shuffle' }), btn('Oyunu başlat', { kind: 'primary', size: 'l', state: 'disabled' }))}</div>`;
}
const KA_BANS = ['durak', 'şoför', 'bilet', 'yolcu', 'kart'];

// Sahtekar: oyuncular
function sgPlayers(big7) {
  const names = big7 ? ['Ece', 'Sen', 'Burak', 'Can', 'kapsul-vf61', 'Zeynep', 'Kerem'] : SG;
  return `${L.innerTop({ title: 'Sahtekar', sub: 'Kimler oynuyor' })}
<div class="scroll" style="padding-bottom: 0;"><div class="row-x" style="gap: 6px; flex-wrap: wrap;"><span class="tag">2 ipucu turu</span><span class="tag">Kişi başı 30 sn</span><span class="tag">Oylama 90 sn</span><span class="tag${big7 ? ' danger' : ''}">${big7 ? '2 sahtekar' : '1 sahtekar'}</span></div>
<div class="card" style="gap: 10px;"><div class="row-x" style="gap: 8px; align-items: baseline;"><span class="t-h3">Oyuncular</span><span class="t-note">${names.length} kişi</span></div><div class="row-x" style="gap: 6px; flex-wrap: wrap;">${names.map((n) => avChip(n, P[n]())).join('')}</div></div>
<div class="card" style="gap: 10px;"><div class="row-x" style="gap: 12px;"><div style="flex: 1; display: flex; flex-direction: column; gap: 2px;"><span class="t-h3">Gözlemciler</span><span class="t-note">Kelimeyi ve sahtekarı görür, oy vermez.</span></div>${btn('Gözlemci ol', { size: 's' })}</div><div class="row-x">${avChip('Deniz', P.Deniz())}</div></div>
<p class="t-note">Bir kişi gizlice sahtekar seçilir. Herkes kelimeyi görür, sahtekar yalnızca kategoriyi. Sırayla kelimeyle ilgili tek kelime söylersiniz, sonra sahtekarı oylarsınız. 7 ve üstü oyuncuda 2 sahtekar olur; birbirlerini bilmezler.</p>
</div><div class="foot"><span class="t-note" style="text-align: center;">Herkes hazırsa oyunu başlat.</span>${btn('Oyunu başlat', { kind: 'primary', size: 'l', full: true })}</div>`;
}
// Sahtekar: rol kartı
function roleCard(face) {
  if (!face) {
    const c = L.uid();
    return `<div class="wcard" style="background: var(--team); padding: 0; border: 6px solid #FFFFFF; height: 330px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; color: #FFFFFF;"><svg viewBox="86 86 340 340" width="84" height="84" aria-hidden="true"><defs><clipPath id="${c}"><rect width="96" height="236" rx="48"/></clipPath></defs><g transform="translate(180 111)"><rect width="96" height="236" rx="48" fill="#7B5CFF" stroke="#FFFFFF" stroke-width="10"/><rect x="56" y="54" width="96" height="236" rx="48" fill="#FF4F8B"/><g clip-path="url(#${c})"><rect x="56" y="54" width="96" height="236" rx="48" fill="#FFB547"/></g></g></svg><span class="t-h3" style="color: #FFFFFF;">Basılı tut</span><span class="t-note">Rolünü yalnızca sen gör</span></div>`;
  }
  const lab = (t, c) => `<span class="t-small" style="letter-spacing: 0.8px; color: ${c};">${t}</span>`;
  const inner = {
    word: lab('KELİMEN', 'var(--muted)') + '<span style="font-size: 40px; line-height: 46px; font-weight: 800; letter-spacing: -1px;">KAHVE</span><span class="t-label muted">Kategori: İçecek</span><p class="t-note" style="margin-top: 8px;">Aranızda kelimeyi bilmeyen biri var.</p>',
    imp: `<span style="width: 74px; height: 102px; display: block;">${L.capsule('Ninja', 'fig', 'width="100%" height="100%"')}</span>` + lab('SAHTEKARSIN', 'var(--unread)') + '<span class="t-label muted">Kategori: İçecek</span><p class="t-note" style="margin-top: 8px;">Kelimeyi bilmiyorsun. Belli etme.</p>',
    obs: lab('GÖZLEMCİSİN', 'var(--muted)') + '<span style="font-size: 40px; line-height: 46px; font-weight: 800; letter-spacing: -1px;">KAHVE</span><span class="t-label muted">Kategori: İçecek</span><p class="t-note" style="margin-top: 8px;">Sahtekar: <b style="color: var(--ink);">Burak</b>. Kimseye söyleme.</p>',
  }[face];
  return `<div class="wcard" style="border: 6px solid #FFFFFF; height: 330px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; text-align: center; padding: 20px;">${inner}</div>`;
}
const roleScreen = (face, ready) => stage('gece', () => `${gbar('Rolünü gör', myRole())}
<div class="gmid" style="justify-content: flex-start; padding-top: 22px;">${roleCard(face)}<p class="t-note" style="margin-top: 6px;">Kartı basılı tut, rolünü gör. Kimse görmesin.</p><span class="t-label">Hazır: ${ready}/5</span>${faces(SG, '', ready > 1 ? ['Ece', 'Sen'] : ['Ece']).replace(/class="av s32"/g, 'class="av s32 dim"')}</div>
<div class="gfoot">${face === 'obs' ? '' : btn('Hazırım', { kind: 'primary', size: 'l', full: true, state: face ? '' : 'disabled' })}</div>`);

module.exports = {
  id: 'oyun',
  name: 'Oyunlar',
  groups: [
    ['Kapsül Anlat: takım, roller', ['KaTakimlar', 'KaAnlatici', 'KaTahminci', 'KaRakip', 'KaGozlemci']],
    ['Kapsül Anlat: tur ve oyun sonu', ['KaTurSonu', 'KaOyunSonu']],
    ['Sahtekar: oyuncular ve roller', ['SgOyuncular', 'SgKalabalik', 'SgRol', 'SgRolKelime', 'SgRolSahtekar', 'SgRolGozlemci']],
    ['Sahtekar: ipucu, oylama, sonuç', ['SgSiraSende', 'SgIpucu', 'SgOylama', 'SgSonuc', 'SgSonSans', 'SgOyunSonu']],
  ],
  boards: {
    KaTakimlar: { title: 'Kapsül Anlat: takımlar', body: kaTeams },
    KaAnlatici: { title: 'Kapsül Anlat: anlatıcı', ...stage('mor', `${gbar('Tur 1/6', score(0, 0))}${roleRow('Anlatıcısın', counters(0, 0, 0))}${timer(59, 96)}<div class="gmid">${wcard('OTOBÜS', KA_BANS)}</div><div class="gfoot">${L.rowEq(btn('Pas · 3', { size: 'l', kind: 'secondary' }).replace('Pas · 3', PASS.replace('class="bi"', 'class="bi" style="width: 18px; height: 18px;"') + 'Pas · 3'), btn('Doğru', { size: 'l', kind: 'positive', bar: 'accept' }))}</div>`) },
    KaTahminci: { title: 'Kapsül Anlat: tahminci', ...stage('mor', `${gbar('Tur 3/6', score(2, 2))}${roleRow('Tahmincisin', counters(0, 0, 0))}${timer(59, 96)}<div class="gmid">${ring(big('Ece'))}<span class="t-h2" style="margin-top: 8px;">Ece anlatıyor</span><span class="t-note">Cevabı yüksek sesle söyle.</span><div class="row-x" style="gap: 6px; align-items: baseline; margin-top: 10px;"><span style="font-size: 56px; line-height: 60px; font-weight: 800;">0</span><span class="t-label">doğru</span></div></div><div class="gfoot"></div>`) },
    KaRakip: { title: 'Kapsül Anlat: rakip', ...stage('pembe', `${gbar('Tur 2/6', score(2, 0))}${roleRow('Rakipsin', counters(0, 0, 0))}${timer(59, 96)}<div class="gmid">${wcard('TELEFON', ['aramak', 'ekran', 'şarj', 'mesaj', 'cep'])}<span class="t-label">Can anlatıyor</span></div><div class="gfoot">${btn('Yasak!', { size: 'l', kind: 'negative', bar: 'report', full: true })}</div>`) },
    KaGozlemci: { title: 'Kapsül Anlat: gözlemci', ...stage('mor', `${gbar('Tur 1/6', score(0, 0))}${roleRow('Gözlemcisin', counters(0, 0, 0))}${timer(59, 96)}<div class="gmid">${wcard('OTOBÜS', KA_BANS)}<span class="t-label">Ece anlatıyor, Mor takım</span></div><div class="gfoot"></div>`) },
    KaTurSonu: {
      title: 'Kapsül Anlat: tur sonu',
      ...stage('mor', `${gbar('Tur 1/6', score(2, 0))}<div class="gmid" style="justify-content: flex-start;"><span class="tag glass">Süre bitti</span><h2 class="t-h1">Mor takım +2</h2>${L.list(...[['OTOBÜS', 'Doğru', 'positive'], ['YAĞMUR', 'Doğru', 'positive'], ['VİZE', 'Doğru', 'positive'], ['YEMEKHANE', 'Pas', ''], ['KAMPÜS', 'Yasak!', 'danger']].map(([w, t, c]) => `<div class="item" style="min-height: 52px; padding: 10px 16px;"><span class="t-h3" style="flex: 1; text-align: left;">${w}</span><span class="tag${c ? ' ' + c : ''}">${t}</span></div>`)).replace('class="list"', 'class="list" style="align-self: stretch; margin-top: 6px;"').replace(/left: 78px/g, 'left: 16px')}</div><div class="gfoot"><span class="t-note" style="text-align: center;">Sıradaki: <b style="color: #FFFFFF;">Pembe takım</b>, Can anlatacak</span>${btn('Sonraki tura geç', { kind: 'primary', size: 'l', full: true })}</div>`),
    },
    KaOyunSonu: {
      title: 'Kapsül Anlat: oyun sonu',
      ...stage('mor', `${gbar('Oyun bitti', score(8, 7))}<div class="gmid"><span class="tag glass">6 tur bitti</span><h1 class="t-h1">Mor takım kazandı</h1><div class="row-x" style="gap: 8px;"><span class="pillw"><i class="tm a"></i>Mor 8</span><span class="pillw" style="background: rgba(255,255,255,0.16); color: #FFFFFF;">7 Pembe<i class="tm b"></i></span></div><div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; align-self: stretch; margin-top: 10px;">${[['Can', 'En çok bildiren anlatıcı, 6'], ['Ece', 'Yasak avcısı, 2']].map(([n, t]) => `<div class="card" style="align-items: center; text-align: center; gap: 4px; padding: 14px 10px;">${L.av(n, 's48')}<span class="t-h3">${n}</span><span class="t-note">${t}</span></div>`).join('')}</div></div><div class="gfoot">${L.rowEq(btn('Masaya dön', { size: 'l' }), btn('Yeniden oyna', { kind: 'primary', size: 'l' }))}</div>`),
    },
    SgOyuncular: { title: 'Sahtekar: oyuncular', body: () => sgPlayers(false) },
    SgKalabalik: { title: 'Sahtekar: 7 ve üstü kişi', body: () => sgPlayers(true) },
    SgRol: { title: 'Sahtekar: rol kartı', ...roleScreen('', 1) },
    SgRolKelime: { title: 'Sahtekar: kelimen', ...roleScreen('word', 2) },
    SgRolSahtekar: { title: 'Sahtekar: sahtekarsın', ...roleScreen('imp', 2) },
    SgRolGozlemci: { title: 'Sahtekar: gözlemci', ...roleScreen('obs', 2) },
    SgSiraSende: { title: 'Sahtekar: sıra sende', ...stage('gece', `${gbar('İpucu turu 1/2', myRole())}${faces(SG, 'Sen', ['Ece'])}<div class="gmid">${ring(big('Sen'), 29, 0.96)}<span class="t-h2" style="margin-top: 16px;">Sıra sende</span><span class="t-note">Kelimeyle ilgili tek kelime söyle. Kelimeyi söyleme.</span></div><div class="gfoot">${btn('Söyledim', { kind: 'positive', size: 'l', full: true, bar: 'accept' })}</div>`) },
    SgIpucu: { title: 'Sahtekar: ipucu', ...stage('gece', `${gbar('İpucu turu 1/2', myRole())}${faces(SG, 'Ece')}<div class="gmid">${ring(big('Ece'), 29, 0.96)}<span class="t-h2" style="margin-top: 16px;">Ece ipucu veriyor</span><span class="t-note">Dinle. Kelimeyi bilmeyeni yakalamaya çalış.</span><span class="t-label" style="margin-top: 6px;">Sıradaki: Sen</span></div><div class="gfoot"></div>`) },
    SgOylama: {
      title: 'Sahtekar: oylama',
      ...stage('gece', `${gbar('Oylama', myRole())}${timer(89, 98)}<div class="gmid" style="justify-content: flex-start; padding-top: 18px;"><h2 class="t-h2">Sahtekar kim?</h2><div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; align-self: stretch; margin-top: 8px;">${['Ece', 'Burak', 'Can', 'kapsul-vf61'].map((n) => `<div class="tile${n === 'Burak' ? ' on' : ''}" role="radio" aria-checked="${n === 'Burak'}">${P[n]().replace('class="av s32"', 'class="av s48"')}${n}</div>`).join('')}</div><span class="t-label" style="margin-top: 8px;">Oy verenler 1/5</span></div><div class="gfoot">${btn('Oyumu ver', { kind: 'primary', size: 'l', full: true })}</div>`),
    },
    SgSonuc: {
      title: 'Sahtekar: sonuç',
      ...stage('gece', `${gbar('Sonuç', myRole())}<div class="gmid" style="justify-content: flex-start; padding-top: 8px;"><div class="card bars" style="align-self: stretch; padding: 16px;">${[['Burak', 3, 'hot'], ['Ece', 2, ''], ['Sen', 0, ''], ['Can', 0, ''], ['kapsul-vf61', 0, '']].map(([n, v, h]) => `<div class="barrow">${P[n]()}<span style="width: 92px; text-align: left; overflow-wrap: anywhere;">${n}</span><span class="mid"><i class="${h}" style="width: ${(v / 3) * 100}%;"></i></span><span style="width: 14px; text-align: right;">${v}</span></div>`).join('')}</div><div style="margin-top: 14px;">${L.av('Burak', 's116').replace('class="av s116"', 'class="av s116" style="width: 96px; height: 96px; box-shadow: 0 0 0 4px #FFFFFF;"')}</div><span class="tag" style="background: var(--unread); color: #FFFFFF; margin-top: -6px;">Sahtekar</span><h2 class="t-h2">Burak yakalandı</h2><span class="t-note">Son şans: kelimeyi bilirse yine de kazanır.</span></div><div class="gfoot"></div>`),
    },
    SgSonSans: {
      title: 'Sahtekar: son şans (sahtekarın ekranı)',
      ...stage('gece', `${gbar('Son şans', myRole())}${timer(14, 46)}<div class="gmid">${ring(L.av('Burak', 's116'), undefined, 0.46)}<h2 class="t-h2" style="margin-top: 10px;">Kelimeyi tahmin et</h2><span class="t-note">Kategori: İçecek</span><div class="field on" style="align-self: stretch; margin-top: 8px;">Kelime</div></div><div class="gfoot">${btn('Tahmini gönder', { kind: 'primary', size: 'l', full: true, state: 'disabled' })}</div>`),
    },
    SgOyunSonu: {
      title: 'Sahtekar: oyun sonu',
      ...stage('gece', `${gbar('Sonuç', myRole())}<div class="gmid"><span class="tag glass">Oyun bitti</span><h1 class="t-h1">Masa kazandı</h1><span class="t-note">Sahtekar yakalandı ve kelimeyi bilemedi (tahmini: ÇAY).</span><div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; align-self: stretch; margin-top: 10px;"><div class="card" style="align-items: center; text-align: center; gap: 4px; padding: 14px 10px;">${L.av('Burak', 's48')}<span class="t-small muted" style="letter-spacing: 0.8px;">SAHTEKAR</span><span class="t-h3">Burak</span></div><div class="card" style="align-items: center; justify-content: center; text-align: center; gap: 2px; padding: 14px 10px;"><span class="t-small muted" style="letter-spacing: 0.8px;">KELİME</span><span class="t-h2">KAHVE</span><span class="t-small muted" style="letter-spacing: 0.8px;">İÇECEK</span></div></div><div class="row-x" style="gap: 10px; margin-top: 6px;"><span class="t-label">Doğru oy verenler</span>${faces(['Ece', 'Sen', 'kapsul-vf61'], '')}</div></div><div class="gfoot">${L.rowEq(btn('Masaya dön', { size: 'l' }), btn('Yeniden oyna', { kind: 'primary', size: 'l' }))}</div>`),
    },
  },
};
