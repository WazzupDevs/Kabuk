// Profil, arkadaşlar, profili düzenle, kapsül
const L = require('./lib.cjs');
const { ico, bar, btn, sheet, note, item } = L;

const ME = { c: 'gok', e: 'klasik', f: 'yuvarlak' };
const big = (html, px) => html.replace(/class="av (s\d+)"/, `class="av $1" style="width: ${px}px; height: ${px}px;"`);
const settingsBtn = () => L.round(bar('settings'), 'Ayarlar');
const editBadge = () => `<span class="round" style="position: absolute; right: -4px; bottom: -2px; width: 40px; height: 40px; background: var(--primary); border: 3px solid var(--canvas); color: #FFFFFF;">${ico('edit', '', 'width: 18px; height: 18px;')}</span>`;

// Kendi profilin (K-49, v46 duo): fotoğraf ve kapsül yan yana, masada görünen işaretli; nick 30 günde bir yenilenir (K-9)
function profile(o) {
  o = { name: 'Elif', age: 22, av: 'Elif', look: ME, nick: 'kapsul-kk42', capLabel: 'Anonimken', bio: "Kapsül Anlat'ta anlatıcı benim.", nickNote: 'Anonim adın. Sabit; her girişte aynı.', ...o };
  const ring = ' style="box-shadow: 0 0 0 3px var(--canvas), 0 0 0 5px var(--brand-purple);"';
  const male = o.capLabel === 'Mekan sohbetinde';
  const pre = male ? 'Mekan sohbetinde anonim yazarken bu adla görünürsün. ' : 'Anonim adın. ';
  const nickCard = o.renew === 'wait'
    ? `<div class="card" style="gap: 10px;"><span class="t-h3">${o.nick}</span><span class="t-note">${pre}30 günde bir yenileyebilirsin; kapsülün aynı kalır.</span>${btn("Nick'i yenile", { full: true, ico: 'refresh', state: 'disabled' })}<span class="t-note" style="text-align: center;">12 gün sonra yenileyebilirsin.</span></div>`
    : o.renew
      ? `<div class="card" style="gap: 10px;"><span class="t-h3">${o.nick}</span><span class="t-note">${pre}Yenilersen yeni bir ad alırsın; kapsülün aynı kalır.</span>${btn("Nick'i yenile", { full: true, ico: 'refresh' })}</div>`
      : `<div class="card" style="gap: 2px;"><span class="t-h3">${o.nick}</span><span class="t-note">${o.nickNote}</span></div>`;
  const anon = o.anon;
  const capAvHtml = L.capAv(o.look, 's116');
  return `${L.tabTop('Profil', settingsBtn())}
<div class="scroll" style="align-items: stretch;">
<div style="display: flex; justify-content: center; gap: 22px; padding-top: 6px; flex: none;">
<div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">${o.ghost ? L.ghostAv('s116') : L.av(o.av, 's116', anon ? '' : ring)}<div style="display: flex; flex-direction: column; align-items: center;"><span class="t-label">Profilin</span><span class="t-note"${anon ? '' : ' style="color: var(--link);"'}>${anon ? 'Profilliyken' : 'Masada görünen'}</span></div></div>
<div style="display: flex; flex-direction: column; align-items: center; gap: 8px;"><div style="position: relative;">${anon ? capAvHtml.replace('class="av s116"', 'class="av s116"' + ring) : capAvHtml}${editBadge()}</div><div style="display: flex; flex-direction: column; align-items: center;"><span class="t-label">Kapsülün</span><span class="t-note"${anon ? ' style="color: var(--link);"' : ''}>${anon ? 'Masada görünen' : o.capLabel}</span></div></div>
</div>
<div style="display: flex; justify-content: center; align-items: baseline; gap: 6px; padding-top: 4px; flex: none;"><span class="t-h2">${o.name},</span><span class="t-h2 muted" style="font-weight: 700;">${o.age}</span></div>
${anon ? `<p class="t-note" style="text-align: center; flex: none;">Masada <b style="color: var(--ink);">${o.nick}</b> olarak görünürsün</p>` : ''}
${nickCard}
<p class="t-body" style="text-align: center; color: var(--muted); flex: none;">${o.bio}</p>
<div class="row-eq">${btn('Arkadaşlar', { ico: 'people' })}${btn('Profili düzenle', { ico: 'edit' })}</div>
</div>${o.toast ? `<div class="toast" role="status" style="padding-left: 16px;">${o.toast}</div>` : ''}${L.tabbar('profil')}`;
}
// Başkasının profili (§4.G): arkadaşta Arkadaşsınız ve Mesaj; mekan sohbetinden açılan yabancıda açık istek; masa içinde yalnızca görüntülenir (K-14)
const otherBody = (name, age, bio, row) => `${L.innerTop({ title: '', right: L.round(bar('more'), 'Diğer seçenekler') })}
<div class="scroll" style="align-items: center; text-align: center; gap: 10px; padding-top: 6px;">${L.av(name, 's116')}<div class="row-x" style="gap: 6px; align-items: baseline; margin-top: 4px;"><span class="t-h2">${name},</span><span class="t-h2 muted" style="font-weight: 700;">${age}</span></div><p class="t-body muted">${bio}</p>
${row ? `<div class="row-eq" style="align-self: stretch; margin-top: 6px;">${row}</div>` : ''}</div>`;
const other = () => otherBody('Ece', 22, "Kapsül Anlat'ta yenilmem. Kahve benden.", `<span class="status positive" style="height: 44px; flex: 1;">${ico('check')}Arkadaşsınız</span>${btn('Mesaj', { kind: 'primary', bar: 'send' })}`);
const stranger = (sent) => otherBody('Kerem', 24, 'Sahtekar\'da kimse beni bulamaz.', sent ? `<span class="status" style="height: 44px; flex: 1;">${ico('check')}İstek gönderildi</span>` : btn('Arkadaş ekle', { kind: 'primary', bar: 'add', full: true }));
const strangerMenu = (name) => sheet(name, `<h2 class="t-h2">${name}</h2>${L.menu([{ t: 'Engelle', ico: 'block', neg: true }, { t: 'Bildir', bar: 'report', neg: true }])}${btn('Vazgeç', { kind: 'quiet', size: 'l', full: true })}`);
const friendMenu = (name) => sheet(name, `<h2 class="t-h2">${name}</h2>${L.menu([{ t: 'Arkadaşlıktan çıkar', ico: 'person' }, { t: 'Engelle', ico: 'block', neg: true }, { t: 'Bildir', bar: 'report', neg: true }])}${btn('Vazgeç', { kind: 'quiet', size: 'l', full: true })}`);

function edit(bio, n, dirty) {
  return `${L.innerTop({ title: 'Profili düzenle' })}
<div class="scroll" style="padding-bottom: 0;">
<div class="card" style="align-items: center; text-align: center; gap: 12px; padding: 20px 16px;">${L.av('Elif', 's116', ' style="box-shadow: 0 0 0 4px var(--surface), var(--shadow-float);"')}${btn('Fotoğrafı değiştir', { size: 's', bar: 'photo' })}<span class="t-note">Fotoğrafında yüzünün görünmesi gerekmez.</span></div>
<div class="card" style="gap: 10px;"><div class="row-x" style="justify-content: space-between;"><span class="t-h3">Biyografi</span><span class="t-small muted">${n}/80</span></div><div class="field area on" style="color: var(--ink);">${bio}</div></div>
</div><div class="foot">${btn('Kaydet', { kind: 'primary', size: 'l', full: true, state: dirty ? '' : 'disabled' })}</div>`;
}

// Kapsül süsleme
const tile = (look, label, on) => `<div class="card${on ? '' : ' flat'}" style="align-items: center; gap: 4px; padding: 10px 4px; border-radius: 16px;${on ? ' border: 2px solid var(--primary); box-shadow: none;' : ''}">${L.capAv(look, 's48')}<span class="t-small" style="text-align: center;">${label}</span></div>`;
function susle(o = {}) {
  const hint = o.first ? '<span class="tag" style="position: absolute; top: 4px; right: 0; height: 32px; padding: 0 12px; background: var(--surface); box-shadow: var(--shadow-chip); font-size: 13px;">Kafama dokun</span>' : '';
  const slots = ['Renk', 'Göz', 'Baş', 'Yüz', 'Ağız', 'Boyun'];
  return `${L.innerTop({ title: 'Kapsülün', sub: 'kapsul-kk42', right: btn('Karıştır', { size: 's', kind: 'quiet', ico: 'shuffle' }) })}
<div class="scroll" style="padding-bottom: 0; gap: 10px;">
<div style="position: relative; display: flex; justify-content: center; padding: 4px 0;">${big(L.capAv(o.look || ME, 's116'), 168).replace('style="', 'style="box-shadow: 0 0 0 6px var(--surface), var(--shadow-float); ')}${hint}</div>
<div class="stack" style="align-items: center; gap: 6px;"><span class="t-label muted">Takılı</span><div class="chips" style="flex-wrap: wrap; justify-content: center;">${(o.on || ['Yuvarlak gözlük']).map((t) => `<span class="chip" style="height: 32px; padding-right: 8px;">${t}${ico('close', 'sm')}</span>`).join('')}</div></div>
<div class="seg" style="height: 44px;"><span>Şık</span><span>Karakter</span><span class="on">Tema</span></div>
<div class="chips scroller">${slots.map((s) => `<span class="chip${s === 'Baş' ? ' on' : ''}">${s}</span>`).join('')}</div>
<div style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px;">${tile(ME, 'Baş boş', true)}</div>
<div class="row-x" style="justify-content: space-between;"><div style="display: flex; flex-direction: column;"><span class="t-h3">Hayvanlar paketi</span><span class="t-note">2 yuvaya parça</span></div>${btn('Paketi tak', { size: 's', kind: 'quiet' })}</div>
<div style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px;">${[['kedi', 'Kedi kulağı'], ['tavsan', 'Tavşan kulağı'], ['ayi', 'Ayı kulağı'], ['tilki', 'Tilki kulağı']].map(([h, t]) => tile({ ...ME, h }, t)).join('')}</div>
</div><div class="foot" style="padding-top: 10px;">${L.rowEq(btn('Hepsini çıkar', { size: 'l' }), btn('Kaydet', { kind: 'primary', size: 'l', state: o.dirty ? '' : 'disabled' }))}</div>`;
}
function gallery() {
  const looks = ['Sade', 'Göz bandı', 'Korsan şapkası', 'Kaptan', 'Vampir', 'Güneş gözlüğü', 'Parti şapkası', 'Taç', 'Kulaklık'];
  const nicks = ['kapsul-yg16', 'kapsul-db40', 'kapsul-nf78', 'kapsul-du91', 'kapsul-hk00', 'kapsul-pa84', 'kapsul-sc13', 'kapsul-td48', 'kapsul-pc63'];
  const three = [['Ece', L.av('Ece', 's48'), 'Fotoğraflı profil'], ['Selin', L.ghostAv('s48'), 'Fotoğrafı kaldırılmış profil'], ['kapsul-vf61', L.capAv('Kaptan', 's48'), 'Anonim']];
  return `${L.innerTop({ title: 'Kapsül karakterler', sub: '28 anonim karakter' })}
<div class="scroll"><p class="t-note">Anonim katılan kişi masada bu karakterlerden biriyle ve kapsul-xx55 biçiminde bir adla görünür. Kapsülün ölçüsü hep aynı; renk ve aksesuar değişir.</p>
${L.section('Üç durum')}<div class="card" style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px;">${three.map(([n, a, t]) => `<div style="display: flex; flex-direction: column; align-items: center; gap: 4px; text-align: center;">${big(a, 56)}<span class="t-label">${n}</span><span class="t-small muted">${t}</span></div>`).join('')}</div>
<div class="section" style="align-items: center;"><span class="t-h3">Anonim kapsüller</span>${btn('İsimleri yenile', { size: 's', ico: 'refresh' })}</div>
<div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; flex: none;">${looks.map((k, i) => `<div class="card" style="align-items: center; gap: 4px; padding: 12px 4px; text-align: center;">${big(L.capAv(k, 's48'), 52)}<span class="t-label">${nicks[i]}</span><span class="t-small muted">${k}</span></div>`).join('')}</div></div>`;
}
// Oyunlara katılım (K-22): girişteki varsayılan; erkek ve belirtmeyende yalnızca mekan sohbetini belirler
const settingsSheet = (male) => sheet('Ayarlar', `<h2 class="t-h2">Ayarlar</h2>
<div class="card soft" style="gap: 10px; padding: 14px;"><div style="display: flex; flex-direction: column; gap: 2px;"><span class="t-h3">Oyunlara katılım</span><span class="t-note">Her girişte bununla başlarsın.</span></div><div class="seg" style="height: 44px; background: var(--surface);"><span class="on" style="background: var(--soft);">Profilli</span><span>Anonim</span></div><span class="t-note">${male ? 'Masada ve oyunlarda her zaman profilinle görünürsün. Mekan sohbetinde anonim yazmayı sohbetin içinden seçebilirsin.' : 'Bu girişte profilinle görünüyorsun. Değiştirmek için mekan ekranındaki anahtarı kullan; hakkın bir kez.'}</span></div>
<div class="card soft" style="gap: 10px; padding: 14px;"><span class="t-h3">Görünüm</span><div class="seg" style="height: 44px; background: var(--surface);"><span>Sistem</span><span class="on" style="background: var(--soft);">Açık</span><span>Koyu</span></div></div>
${L.menu([{ t: 'Bildirim ayarları', bar: 'bell', end: ico('chev') }, { t: 'Gizlilik', ico: 'shield', end: ico('chev') }, { t: 'Hesap', ico: 'person', end: ico('chev') }, { t: 'Çıkış yap', ico: 'logout', neg: true }])}
${btn('Tamam', { kind: 'quiet', size: 'l', full: true })}`, 'gap: 12px;');

module.exports = {
  id: 'profil',
  name: 'Profil ve kapsül',
  groups: [
    ['Kendi profilin', ['Profil', 'ProfilAnonim', 'ProfilErkek', 'ProfilFotoKaldirildi', 'ProfilYeniKisi', 'ProfilAyarlar', 'ProfilAyarlarErkek']],
    ['Nick yenileme (K-9)', ['ProfilNickYenile', 'ProfilNickYenilendi', 'ProfilNickBekle']],
    ['Başkası ve arkadaşlar', ['ProfilBaskasi', 'ProfilBaskasiSecenekler', 'ProfilYabanci', 'ProfilYabanciGonderildi', 'ProfilYabanciSecenekler', 'ProfilMasaIci', 'Arkadaslar']],
    ['Profili düzenle', ['ProfilDuzenle', 'ProfilDuzenleFoto', 'ProfilDuzenleCikis']],
    ['Kapsül', ['KapsulGaleri', 'KapsulSusle', 'KapsulSusleIlk', 'KapsulSusleDegisti', 'KapsulSusleCikis']],
  ],
  titles: { Profil: 'Kendi profilin, kadın' },
  boards: {
    ProfilErkek: { title: 'Kendi profilin, erkek', body: () => profile({ name: 'Arda', age: 23, av: 'Can', capLabel: 'Mekan sohbetinde', nickNote: 'Mekan sohbetinde anonim yazarken bu adla görünürsün. Sabit; her girişte aynı.', bio: "Sahtekar'da kimse beni yakalayamaz." }) },
    ProfilNickYenile: { title: 'Nick yenilenebilir (30 gün doldu)', body: () => profile({ renew: true }) },
    ProfilNickYenilendi: { title: 'Nick yenilendi', body: () => profile({ renew: 'wait', nick: 'kapsul-ns07', toast: 'Yeni anonim adın: kapsul-ns07' }) },
    ProfilNickBekle: { title: 'Nick: 30 gün dolmadı', body: () => profile({ renew: 'wait' }) },
    ProfilAnonim: { title: 'Kendi profilin, anonimken (kadın)', body: () => profile({ anon: true }) },
    ProfilFotoKaldirildi: { title: 'Fotoğrafı kaldırılmış: hayalet kapsül', body: () => profile({ ghost: true, anon: true }) },
    ProfilYabanci: { title: 'Mekan sohbetinden açılan profil', body: () => stranger(false) },
    ProfilYabanciGonderildi: { title: 'Mekan sohbetinden: istek gönderildi', body: () => stranger(true) },
    ProfilYabanciSecenekler: { title: 'Arkadaş olmayan: seçenekler', body: () => stranger(false) + strangerMenu('Kerem') },
    ProfilMasaIci: { title: 'Masa içinde profil: yalnızca görüntülenir (K-14)', body: () => otherBody('Deniz', 23, 'Hep ilk tahmin benden.', '') },
    ProfilYeniKisi: { title: 'Yeni kişi: başka başlangıç kapsülü', body: () => profile({ look: 'Vampir', nick: 'kapsul-an98' }) },
    ProfilAyarlar: { title: 'Ayarlar penceresi', body: () => profile({}) + settingsSheet() },
    ProfilAyarlarErkek: { title: 'Ayarlar: erkek ve belirtmeyen (K-22)', body: () => profile({ name: 'Arda', age: 23, av: 'Can', capLabel: 'Mekan sohbetinde' }) + settingsSheet(true) },
    ProfilBaskasi: { title: 'Başkasının profili', body: other },
    ProfilBaskasiSecenekler: { title: 'Başkasının profili: seçenekler', body: () => other() + friendMenu('Ece') },
    Arkadaslar: {
      title: 'Arkadaşlar',
      body: () => `${L.innerTop({ title: 'Arkadaşlar', sub: '4 arkadaş' })}<div class="scroll">${L.list(...[['Ece', 22], ['Burak', 24], ['Fevve', 21], ['Deniz', 23]].map(([n, a]) => item({ lead: L.av(n, 's48'), title: n, sub: note(String(a)), end: btn('Mesaj', { size: 's', kind: 'quiet', act: true, bar: 'send' }) })))}</div>`,
    },
    ProfilDuzenle: { title: 'Profili düzenle', body: () => edit("Kapsül Anlat'ta anlatıcı benim.", 31, false) },
    ProfilDuzenleFoto: {
      title: 'Fotoğraf penceresi',
      body: () => edit("Kapsül Anlat'ta anlatıcı benim.", 31, false) + sheet('Profil fotoğrafı', `<h2 class="t-h2">Profil fotoğrafı</h2>${L.menu([{ t: 'Fotoğraf çek', bar: 'photo' }, { t: 'Galeriden seç', ico: 'palette' }, { t: 'Fotoğrafı kaldır', ico: 'trash', neg: true }])}${btn('Vazgeç', { kind: 'quiet', size: 'l', full: true })}`),
    },
    ProfilDuzenleCikis: {
      title: 'Kaydetmeden çık penceresi',
      body: () => edit('Yeni bir şey', 12, true) + sheet('Kaydetmeden çıkılsın mı', `<h2 class="t-h2">Kaydetmeden çıkılsın mı?</h2><p class="t-note">Yaptığın değişiklikler silinir.</p><div class="stack" style="gap: 10px;">${btn('Kaydetmeden çık', { kind: 'negative', size: 'l', full: true })}${btn('Düzenlemeye dön', { kind: 'quiet', size: 'l', full: true })}</div>`),
    },
    KapsulGaleri: { title: 'Kapsül galerisi', body: gallery },
    KapsulSusle: { title: 'Kapsülü süsle', body: () => susle() },
    KapsulSusleIlk: { title: 'Kapsülü süsle, ilk açılış', body: () => susle({ first: true }) },
    KapsulSusleDegisti: { title: 'Kapsülü süsle, değişiklik var', body: () => susle({ look: { ...ME, h: 'kedi', n: 'can' }, on: ['Kedi kulağı', 'Yuvarlak gözlük', 'Çıngıraklı tasma'], dirty: true }) },
    KapsulSusleCikis: {
      title: 'Süsleme: kaydetmeden çık',
      body: () => susle({ look: { ...ME, h: 'kedi', n: 'can' }, on: ['Kedi kulağı', 'Yuvarlak gözlük', 'Çıngıraklı tasma'], dirty: true }) + sheet('Değişiklikler kaydedilmedi', `<h2 class="t-h2">Değişiklikler kaydedilmedi</h2><p class="t-note">Kaydetmeden çıkarsan kapsülün eski hâline döner.</p><div class="stack" style="gap: 10px;">${btn('Kaydet ve çık', { kind: 'primary', size: 'l', full: true })}${btn('Kaydetmeden çık', { kind: 'quiet', size: 'l', full: true })}</div>`),
    },
  },
};
