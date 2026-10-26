// Ayarlar: bildirimler, gizlilik, hesap, engellenenler, sessize alınanlar
const L = require('./lib.cjs');
const { ico, bar, btn, sheet, note, item } = L;

const top = (t) => L.innerTop({ title: t });
const toggle = (title, text, on, dim) => item({ title, sub: note(text), end: `<span class="switch${on ? ' on' : ''}" role="switch" aria-checked="${on}" aria-label="${title}"${dim ? ' style="opacity: 0.45;"' : ''}></span>` });
function notifSettings(off) {
  const phone = off
    ? `<div class="banner warn" style="flex-direction: column; align-items: stretch; gap: 10px;"><div class="mid"><span class="t-label">Telefon bildirimleri</span><span class="t-note">Kapalı. Masa davetleri 2 dakika geçerli olduğu için kaçırabilirsin.</span></div>${btn('Telefon ayarlarını aç', { kind: 'primary', full: true })}</div>`
    : `<div class="card" style="flex-direction: row; align-items: center; gap: 12px;"><div style="flex: 1; display: flex; flex-direction: column; gap: 2px;"><span class="t-h3">Telefon bildirimleri</span><span class="t-note">Açık. Kapatırsan telefonun ayarlarından yeniden açabilirsin.</span></div><span class="tag positive">Açık</span></div>`;
  return `${top('Bildirim ayarları')}<div class="scroll">${phone}
${L.section('Arkadaşlar')}${L.list(toggle('Arkadaşlık istekleri', 'Biri seni arkadaş olarak eklemek istediğinde', true, off), toggle('Masa davetleri', 'Davetler 2 dakika geçerli; kapatırsan kaçırabilirsin', true, off))}
${L.section('Mesajlar')}${L.list(toggle('Birebir mesajlar', 'Arkadaşlarından gelen mesajlar', true, off))}
<p class="t-note" style="padding: 0 2px;">Masa davetinin bildiriminde ad, masa adı ve mekan yazmaz: "Bir arkadaşın seni masasına çağırıyor". Mekan sohbeti bildirim göndermez.</p></div>`;
}
const account = () => `${top('Hesap')}<div class="scroll"><div class="card" style="gap: 2px;"><span class="t-label muted">Telefon numaran</span><span class="t-h3">+90 5•• ••• •• 01</span></div>
<p class="t-note" style="padding: 0 2px;">Doğum tarihin ve cinsiyetin uygulamadan değiştirilemez ve kimseye gösterilmez. Yanlış girdiysen İletişim'den bize yaz.</p>
${L.menu([{ t: 'İletişim', ico: 'chat', end: ico('chev') }, { t: 'Çıkış yap', ico: 'logout' }, { t: 'Hesabımı sil', ico: 'trash', neg: true }]).replace('class="menu"', 'class="menu" style="background: var(--surface); box-shadow: var(--shadow-card);"')}</div>`;
const listMenu = (rows) => L.menu(rows).replace('class="menu"', 'class="menu" style="background: var(--surface); box-shadow: var(--shadow-card);"');

module.exports = {
  id: 'ayarlar',
  name: 'Ayarlar',
  groups: [
    ['Bildirimler', ['BildirimAyarlari', 'BildirimIzinKapali']],
    ['Gizlilik ve hesap', ['Gizlilik', 'Hesap', 'HesapSil']],
    ['Engellenenler ve sessize alınanlar', ['Engellenenler', 'EngellenenlerBos', 'SessizeAlinanlar']],
  ],
  boards: {
    BildirimAyarlari: { title: 'Bildirim ayarları', body: () => notifSettings(false) },
    BildirimIzinKapali: { title: 'Bildirim izni kapalı', body: () => notifSettings(true) },
    Gizlilik: {
      title: 'Gizlilik',
      body: () => `${top('Gizlilik')}<div class="scroll">${listMenu([{ t: 'Engellenenler', ico: 'block', end: `<span class="row-x" style="gap: 8px;"><span class="t-label muted">2</span>${ico('chev')}</span>` }, { t: 'Sessize alınanlar', ico: 'mute', end: `<span class="row-x" style="gap: 8px;"><span class="t-label muted">2</span>${ico('chev')}</span>` }])}
<p class="t-note" style="padding: 0 2px;">Anonim adın hesabına sabittir: anonimken ziyaretler arasında aynı adla tanınabilirsin. Adın, fotoğrafın ve profil kimliğin yalnızca profilinle göründüğünde ya da arkadaş olduğunda açılır.</p>
${listMenu([{ t: 'Gizlilik politikası', ico: 'doc', end: ico('chev') }, { t: 'KVKK Aydınlatma Metni', ico: 'doc', end: ico('chev') }])}</div>`,
    },
    Hesap: { title: 'Hesap', body: account },
    HesapSil: {
      title: 'Hesabı sil penceresi',
      body: () => account() + sheet('Hesabın silinsin mi', `<h2 class="t-h2">Hesabın silinsin mi?</h2><p class="t-note">Profilin, fotoğrafların, arkadaşlıkların, mesajların ve oyun geçmişin silinir. Masadaysan masadan çıkarsın. Bu geri alınamaz.</p><p class="t-note">Yedeklerden de 7 gün içinde silinir.</p><div class="stack" style="gap: 10px;">${btn('Hesabımı sil', { kind: 'negative', size: 'l', full: true, ico: 'trash' })}${btn('Vazgeç', { kind: 'quiet', size: 'l', full: true })}</div>`),
    },
    Engellenenler: {
      title: 'Engellenenler',
      body: () => `${top('Engellenenler')}<div class="scroll"><p class="t-note" style="padding: 0 2px;">Engellediğin kişi bunu görmez.</p>${L.list(
        item({ lead: L.capAv('Büyücü', 's48'), title: 'kapsul-tr42', sub: note('Mekan sohbetinden') + '<span class="t-small muted">3 gün önce</span>', end: btn('Engeli kaldır', { size: 's', kind: 'quiet', act: true }) }),
        item({ lead: L.av('Fevve', 's48'), title: 'Fevve', sub: note('Oyun geçmişinden') + '<span class="t-small muted">Geçen hafta</span>', end: btn('Engeli kaldır', { size: 's', kind: 'quiet', act: true }) }),
      )}</div>`,
    },
    EngellenenlerBos: { title: 'Engellenenler boş', body: () => `${top('Engellenenler')}<div class="scroll">${L.stateCard('empty', 'Engellediğin kimse yok', 'Bir kişiyi profilinden, mekan sohbetinden ya da oyun geçmişinden engelleyebilirsin.')}</div>` },
    SessizeAlinanlar: {
      title: 'Sessize alınanlar',
      body: () => `${top('Sessize alınanlar')}<div class="scroll"><p class="t-note" style="padding: 0 2px;">Sessize aldığın kişi bunu görmez. Sessize alma o kimliğe bağlıdır: bir kişinin anonim adını sessize almak profilli mesajlarını gizlemez.</p>${L.list(
        item({ lead: L.capAv('Monokl', 's48'), title: 'kapsul-pd17', sub: note('Anonim') + '<span class="t-small muted">Bugün</span>', end: btn('Sesi aç', { size: 's', kind: 'quiet', act: true }) }),
        item({ lead: L.av('Burak', 's48'), title: 'Burak', sub: note('Profiliyle') + '<span class="t-small muted">Dün</span>', end: btn('Sesi aç', { size: 's', kind: 'quiet', act: true }) }),
      )}</div>`,
    },
  },
};
