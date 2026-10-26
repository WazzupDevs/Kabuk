// Mekan: lobi, senin masan, pencereler
const L = require('./lib.cjs');
const { ico, bar, btn, sheet, note, meta, tableIcon, item } = L;

const people = (n) => ico('people') + n + ' kişi';
const chev = () => ico('chev', '', 'color: var(--muted); width: 20px; height: 20px;');
const venueChat = () =>
  L.list(item({ lead: `<span class="glyph">${L.venueChatIco()}</span>`, title: 'Mekan sohbeti', sub: note('Mekana giriş yapan herkes okur ve yazar.'), end: '<i class="live"></i>' + ico('chev') }));

const left = (spot) => `<div class="meta">${ico('clock')}4 sa 12 dk kaldı</div>${spot ? `<div class="meta">${ico('pin')}Noktan: ${spot}<i class="sep"></i><span class="link" style="font-weight: 700;">Değiştir</span></div>` : ''}`;
function myCard(kind, o = {}) {
  if (kind === 'none' || kind === 'nophoto' || kind === 'nophotoM') {
    const glyph = `<span class="glyph" style="background: var(--surface); border: 2px dashed var(--control);">${bar('add', 'positive')}</span>`;
    const text = kind === 'none' ? 'Masa kur, arkadaşlarını çağır. Ya da açık bir masaya katıl.' : 'Masa kurmak ve masalara katılmak için profil fotoğrafı gerekir.';
    const b = kind === 'none' ? btn('Masa kur', { kind: 'primary', full: true, bar: 'add' })
      : kind === 'nophoto' ? L.rowEq(btn('Fotoğraf ekle', { kind: 'primary', bar: 'photo' }), btn('Anonime geç', { kind: 'secondary' }))
        : btn('Fotoğraf ekle', { kind: 'primary', full: true, bar: 'photo' });
    return L.card(item({ lead: glyph, title: 'Henüz masan yok', sub: note(text) }) + b);
  }
  if (kind === 'part')
    return L.card(item({ lead: tableIcon('Neşeli Panda'), title: 'Neşeli Panda', sub: meta('<i class="live"></i>' + people(6), 'Katıldın'), end: chev() }) + left(o.spot));
  const n = kind === 'owner12' ? 12 : 6;
  const lobby = kind === 'lobby';
  return L.card(item({ lead: tableIcon('Mor Dalga'), title: 'Mor Dalga', sub: meta(people(n), lobby ? '<span style="color: var(--on-success-soft);">Lobide açık</span>' : 'Lobide değil'), end: chev() }) + left(o.spot) +
    `<div class="row-eq">${lobby ? btn('Lobiden çek', { kind: 'secondary', bar: 'lobby' }) : btn('Lobiye aç', { kind: 'primary', bar: 'lobby' })}${btn('Davet et', { kind: 'secondary', bar: 'add' })}</div>`);
}

function lobbyRow(name, n, tag, end, status) {
  const sub = meta(people(n)) + (status || (tag ? `<span class="tag" style="align-self: flex-start; margin-top: 2px;">${tag}</span>` : ''));
  return item({ lead: tableIcon(name), title: name, sub, end });
}
function lobby(o) {
  const joinOff = ['nophoto', 'nophotoM', 'part'].includes(o.my);
  const join = () => btn('Katıl', { kind: 'positive', size: 's', act: true, state: joinOff ? 'disabled' : '' });
  const hint = { owner: 'Katılırsan masandaki 5 kişi de seninle gelir.', owner12: 'Katılırsan masandaki 11 kişi de seninle gelir.', nophoto: 'Masalara katılmak için profil fotoğrafı ekle.', nophotoM: 'Masalara katılmak için profil fotoğrafı ekle.', part: 'Başka bir masaya geçmek için önce masandan ayrıl.' }[o.my];
  let head = L.section('Açık masalar', o.lobby === 'list' ? '3 masa' : '');
  if (hint && o.lobby === 'list') head += note(hint, 'padding: 0 2px;');
  if (o.lobby === 'load') return head + L.stateCard('load', 'Masalar yükleniyor', 'Bir saniye.');
  if (o.lobby === 'empty') return head + L.stateCard('empty', 'Açık masa yok', 'Masa kurup lobiye açarsan mekandakiler katılmak isteyebilir.');
  let req;
  if (o.req === 'unavail') req = ['', L.status('Müsait değil')];
  else if (o.req === 'accepted') req = [`<span class="t-note" style="color: var(--on-success-soft); margin-top: 2px;">Masanın yanına git.</span>`, L.status('Kabul edildi', { tone: 'positive' })];
  else if (joinOff) req = ['', join()];
  else req = [note('İsteğin gönderildi', 'margin-top: 2px;'), `<span class="btn s quiet act"><span class="busy-dots brand"><i></i><i></i><i></i></span>41 sn</span>`];
  return head + L.list(
    lobbyRow('Neşeli Panda', 3, 'Kapsül Anlat', join()),
    lobbyRow('Gece Baykuşu', 2, 'Sohbet', req[1], req[0]),
    lobbyRow('Atak Tilki', 4, 'Sohbet', join()),
  );
}
const ongoing = () =>
  L.section('Süren masalar', '1 masa') + note('Lobide değiller. Oturduğun masa buysa "Bu masadayım"a bas, masa sahibi onaylasın.', 'padding: 0 2px;') +
  L.list(item({ lead: tableIcon('Tatlı Yunus'), title: 'Tatlı Yunus', sub: meta(people(6)), end: btn('Bu masadayım', { kind: 'secondary', size: 's', act: true }) }));

function mekan(o) {
  o = { my: 'none', lobby: 'list', ...o };
  const noPhoto = o.my === 'nophoto' ? 'ghost' : o.my === 'nophotoM' ? 'empty' : '';
  const toast = o.toast ? `<div class="toast" role="status" style="padding-left: 16px;">${o.toast}</div>` : '';
  return `${L.mekanTop({ anon: o.anon, noPhoto, venue: o.venue, count: o.count, me: o.me })}
<div class="scroll">${venueChat()}${myCard(o.my, o)}${lobby(o)}${ongoing()}</div>
${toast}${L.tabbar('mekan')}`;
}
const actions = (a, b) => `<div class="stack" style="gap: 10px;">${a}${btn(b, { kind: 'quiet', size: 'l', full: true })}</div>`;

// Masa kur (§4.C 4.5b): ad masa kurulunca üretilir, sayfada ad yok. Simge seçilir (K-45); seçici açılınca tema çipleri ve 5'li ızgara
const THEMES = ['Kış', 'Yılbaşı', 'Korku', 'Uzay', 'Deniz', 'Parti', 'Sihir'];
function iconPicker(on, taken) {
  const ids = L.ICON_CAT.simgeler.filter((x) => x.tema === 'Uzay');
  const grid = ids.map((x) => `<span class="pickcell${x.id === on ? ' on' : ''}${taken.includes(x.id) ? ' off' : ''}" role="radio" aria-checked="${x.id === on}" aria-label="${x.ad}${taken.includes(x.id) ? ', başka bir masada' : ''}">${tableIcon(x.id, 's48', ' style="width: 100%; height: auto; aspect-ratio: 1;"')}</span>`).join('');
  return `<div class="stack" style="gap: 10px;"><span class="t-label">Simge</span><div class="chips scroller">${THEMES.map((t) => `<span class="chip${t === 'Uzay' ? ' on' : ''}">${t}</span>`).join('')}</div>
<div style="display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 8px;">${grid}</div><span class="t-note">Soluk olanlar mekandaki başka bir masada.</span></div>`;
}
const iconBlock = (id, open) => `<div class="card soft" style="flex-direction: row; align-items: center; gap: 12px; padding: 14px;"><span style="position: relative; flex: none;">${tableIcon(id, 's56')}<span class="round" style="position: absolute; right: -6px; bottom: -6px; width: 26px; height: 26px; background: var(--ink); color: var(--surface); border: 2px solid var(--soft);">${ico('edit', '', 'width: 13px; height: 13px; stroke-width: 2.4;')}</span></span><div class="mid" style="display: flex; flex-direction: column; gap: 2px;"><span class="t-small muted">Masa simgesi</span><span class="t-h3">${L.ICON_CAT.simgeler.find((x) => x.id === id).ad}</span></div>${open ? '' : '<span class="t-label link">Simgeyi değiştir</span>'}</div>`;
function masaKur(o = {}) {
  const lobbyToggle = `<div class="card soft" style="flex-direction: row; align-items: center; gap: 12px; padding: 14px;"><div class="mid" style="flex: 1; display: flex; flex-direction: column; gap: 2px;"><span class="t-h3">Lobide görünsün</span><span class="t-note">Mekandakiler masanı görür ve katılmak isteyebilir. Sonra da değiştirebilirsin.</span></div><span class="switch" role="switch" aria-checked="false" aria-label="Lobide görünsün"></span></div>`;
  const who = `<div class="row-x" style="gap: 10px;">${L.av('Elif', 's32', ' style="width: 24px; height: 24px;"')}<span class="t-note">Masada <b style="color: var(--ink);">Elif</b> olarak görünürsün.</span></div>`;
  const icon = o.pick ? iconBlock('uzay-galaksi', true) + iconPicker('uzay-galaksi', ['uzay-gezegen', 'uzay-ufo']) : iconBlock('uzay-galaksi');
  return mekan({}) + sheet('Masa kur', `<h2 class="t-h2">Masa kur</h2><p class="t-note">Masaya herkes kendi telefonuyla katılır. Masada en çok 12 kişi olur.</p>${icon}${o.pick ? '' : lobbyToggle + who}${o.err ? L.banner('Masa kurulamadı', 'Bağlantını kontrol edip yeniden dene.', 'danger') : ''}${o.pick ? btn('Tamam', { kind: 'primary', size: 'l', full: true }) : actions(btn('Masayı kur', { kind: 'primary', size: 'l', full: true }), 'Vazgeç')}`, 'gap: 12px;');
}
const anonSheet = () =>
  `<div class="row-x" style="gap: 12px; justify-content: center; padding-top: 4px;">${L.av('Elif', 's48', ' style="width: 56px; height: 56px;"')}${ico('arrow', '', 'color: var(--brand-pink);')}${L.capAv('Gözlük', 's48').replace('class="av s48"', 'class="av s48" style="width: 56px; height: 56px;"')}</div>
<h2 class="t-h2">Anonim görün?</h2><p class="t-note">Adın ve fotoğrafın görünmez. Mekan sohbetinde ve masada kapsul-kk42 adıyla, kapsül karakterinle görünürsün.</p>
${L.banner('Bu girişte tek değişiklik hakkın var.', 'Değiştirince bu girişte geri dönemezsin. Yeni mesajların yeni kimlikle görünür, öncekiler eski kimlikte kalır; mekan sohbetini o an izleyen biri iki kimliği eşleştirebilir.', 'warn')}
${actions(btn('Anonim görün', { kind: 'primary', size: 'l', full: true }), 'Vazgeç')}`;

const swap = (a, b) => `<div class="row-x" style="gap: 12px; justify-content: center; padding-top: 4px;">${a}${ico('arrow', '', 'color: var(--brand-pink);')}${b}</div>`;
const big56 = (h) => h.replace(/class="av s48"/, 'class="av s48" style="width: 56px; height: 56px;"');
const ONCE = 'Değiştirince bu girişte geri dönemezsin. Yeni mesajların yeni kimlikle görünür, öncekiler eski kimlikte kalır; mekan sohbetini o an izleyen biri iki kimliği eşleştirebilir.';
// Erkek ve belirtmeyen (§4.D, v46 vcOnly): seçim yalnızca mekan sohbetini etkiler, masaya taşınmaz
const anonSheetM = () => `${swap(big56(L.av('Burak', 's48')), big56(L.capAv('Kaptan', 's48')))}
<h2 class="t-h2">Mekan sohbetinde anonim yaz?</h2><p class="t-note">Mekan sohbetinde adın ve fotoğrafın görünmez; kapsul-vf61 adıyla, kapsül karakterinle yazarsın. Masada ve oyunlarda her zaman profilinle görünürsün.</p>
${L.banner('Bu girişte tek değişiklik hakkın var.', ONCE, 'warn')}
${actions(btn('Anonim yaz', { kind: 'primary', size: 'l', full: true }), 'Vazgeç')}`;
// Anonimken profile dönüş; masadaysa masadaki kimlik masa bitene kadar kalır
const profileSheet = () => `${swap(big56(L.capAv('Gözlük', 's48')), big56(L.av('Elif', 's48')))}
<h2 class="t-h2">Profilinle görün?</h2><p class="t-note">Mekan sohbetinde ve masada adın ve fotoğrafın görünür.</p>
${L.banner('Bu girişte tek değişiklik hakkın var.', ONCE + ' Masadaki kimliğin bu masa bitene kadar değişmez.', 'warn')}
${actions(btn('Profilimle görün', { kind: 'primary', size: 'l', full: true }), 'Vazgeç')}`;
const profileNoPhoto = () => `${swap(big56(L.capAv('Gözlük', 's48')), big56(L.ghostAv('s48')))}
<h2 class="t-h2">Profilinle görün?</h2><p class="t-note">Profilinle görünmek için önce fotoğraf eklemelisin.</p>
${actions(btn('Fotoğraf ekle', { kind: 'primary', size: 'l', full: true, bar: 'photo' }), 'Vazgeç')}`;
const spotSheet = () => sheet('Neredesin?', `<h2 class="t-h2">Neredesin?</h2><p class="t-note">Aynı noktadaki masalarla oynarsın. Masan lobideyken, oyundayken ya da bir isteğin beklerken değiştiremezsin.</p>${L.chips(['Kantin', 'Kütüphane', 'Mühendislik', 'Çimler'], 'Çimler')}${actions(btn('Bu noktadayım', { kind: 'primary', size: 'l', full: true }), 'Vazgeç')}`);
const KAMPUS = { venue: 'Esentepe Kampüsü', count: '41 kişi burada' };

module.exports = {
  id: 'mekan',
  name: 'Mekan',
  mekan, anonSheet, anonSheetM, iconPicker,
  titles: { Mekan: 'Masa sahibi, mekana dönmüş', Haller: 'Yükleniyor, boş, hata' },
  groups: [
    ['Lobi', ['MekanMasasiz', 'MekanLobiYukleniyor', 'MekanLobiBos', 'MekanIstekMusaitDegil', 'MekanIstekKabul']],
    ['Senin masan', ['Mekan', 'MekanLobide', 'MekanKatilimci', 'Mekan12Kisi', 'MekanKampus', 'MekanNoktaDegistir']],
    ['Fotoğraf ve kimlik', ['MekanFotosuz', 'MekanFotosuzErkek', 'MekanAnonim', 'MekanAnonimGecis', 'MekanAnonimGecisErkek', 'MekanProfilGecis', 'MekanProfilGecisFotosuz', 'MekanGecisKullanildi']],
    ['Masa kur ve hâller', ['MekanMasaKur', 'MekanMasaKurSimge', 'MekanMasaKurulamadi', 'Haller']],
  ],
  boards: {
    MekanMasasiz: { title: 'Masasız, lobi dolu', body: () => mekan({}) },
    MekanLobiYukleniyor: { title: 'Lobi yükleniyor', body: () => mekan({ lobby: 'load' }) },
    MekanLobiBos: { title: 'Lobi boş', body: () => mekan({ lobby: 'empty' }) },
    MekanIstekMusaitDegil: { title: 'Katılma isteği: müsait değil', body: () => mekan({ req: 'unavail' }) },
    MekanIstekKabul: { title: 'Katılma isteği: kabul edildi', body: () => mekan({ req: 'accepted' }) },
    MekanKatilimci: { title: 'Katılımcı, mekana dönmüş', body: () => mekan({ my: 'part' }) },
    Mekan12Kisi: { title: 'Masan 12 kişi', body: () => mekan({ my: 'owner12' }) },
    MekanFotosuz: { title: 'Fotoğrafı kaldırılmış kadın (K-20)', body: () => mekan({ my: 'nophoto' }) },
    MekanFotosuzErkek: { title: 'Fotoğrafsız erkek: yalnızca Fotoğraf ekle', body: () => mekan({ my: 'nophotoM' }) },
    MekanLobide: { title: 'Masan lobide açık', body: () => mekan({ my: 'lobby' }) },
    MekanKampus: { title: 'Kampüste: süre ve nokta', body: () => mekan({ my: 'owner', spot: 'Kütüphane', ...KAMPUS }) },
    MekanNoktaDegistir: { title: 'Noktanı değiştir', body: () => mekan({ my: 'owner', spot: 'Kütüphane', ...KAMPUS }) + spotSheet() },
    MekanAnonimGecisErkek: { title: 'Erkek: mekan sohbetinde anonim yaz', body: () => mekan({ me: 'Burak' }) + sheet('Mekan sohbetinde anonim yaz', anonSheetM()) },
    MekanProfilGecis: { title: 'Anonimken profile dön', body: () => mekan({ anon: true }) + sheet('Profilinle görün', profileSheet()) },
    MekanProfilGecisFotosuz: { title: 'Profile dönmek fotoğraf ister', body: () => mekan({ anon: true }) + sheet('Profilinle görün', profileNoPhoto()) },
    MekanGecisKullanildi: { title: 'Değişiklik hakkı kullanıldı', body: () => mekan({ anon: true, toast: 'Bu girişteki değişiklik hakkını kullandın' }) },
    MekanAnonim: { title: 'Anonim görünüyorsun', body: () => mekan({ anon: true }) },
    MekanMasaKur: { title: 'Masa kur', body: () => masaKur() },
    MekanMasaKurSimge: { title: 'Masa kur: simge seçici (K-45, K-59)', body: () => masaKur({ pick: true }) },
    MekanMasaKurulamadi: { title: 'Masa kurulamadı', body: () => masaKur({ err: true }) },
    MekanAnonimGecis: { title: 'Anonim görün penceresi', body: () => mekan({}) + sheet('Anonim görün', anonSheet()) },
  },
};
