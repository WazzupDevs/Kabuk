// Mesajlar, istekler, bildirimler, birebir sohbet
const L = require('./lib.cjs');
const { ico, bar, btn, sheet, note, item, msg, day } = L;

// Zil (§4.G): okunmamış sayısı rozet; liste açılınca silinir
const bell = (n = 3) => `<button class="round" style="position: relative;" aria-label="Bildirimler${n ? ', ' + n + ' yeni' : ''}">${bar('bell')}${n ? `<span class="badge" style="position: absolute; top: -4px; right: -4px; box-shadow: 0 0 0 2px var(--canvas);">${n}</span>` : ''}</button>`;
const push = L.push;
const seg = (tab, n = 2) => `<div class="seg"><span${tab === 'sohbet' ? ' class="on"' : ''}>Sohbet</span><span${tab === 'istek' ? ' class="on"' : ''}>İstekler (${n})</span></div>`;
const end = (time, extra = '', strong) => `<div class="end"><span class="t-note"${strong ? ' style="color: var(--link); font-weight: 800;"' : ''}>${time}</span>${extra}</div>`;
const threads = () => L.list(
  item({ lead: L.av('Ece', 's48'), title: 'Ece', sub: `<span class="t-label" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">Yarın Kapsül Anlat'a var mısın?</span>`, end: end('21:40', '<span class="badge">2</span>', true) }),
  item({ lead: L.av('Kerem', 's48'), title: 'Kerem', sub: '<div class="row-x" style="gap: 6px;"><span class="t-label link">yazıyor</span><span class="typing" style="padding: 0;"><i></i><i></i><i></i></span></div>', end: end('21:12') }),
  item({ lead: L.av('Fevve', 's48'), title: 'Fevve', sub: note('Bi masa kur hele'), end: end('Dün') }),
  item({ lead: L.av('Burak', 's48'), title: 'Burak', sub: `<div class="meta">${ico('read', '', 'color: var(--link);')}Yarın kampüsteyim</div>`, end: end('2 Eki') }),
  item({ lead: L.av('Deniz', 's48'), title: 'Deniz', sub: note("Sahtekar'da beni yakaladın"), end: end('1 Eki') }),
);
const requests = (n) => L.list(...[['Kerem', '2 sa'], ['Zeynep', 'Dün'], ['Can', 'Şimdi']].slice(3 - n).reverse().map(([p, t]) =>
  item({ lead: L.av(p, 's48'), title: p, sub: note('Arkadaşlık isteği') + `<span class="t-small muted">${t}</span>`, end: `<div class="pair">${L.round(bar('end', 'negative'), 'Reddet').replace('class="round"', 'class="round negative"')}${L.round(bar('accept', 'positive'), 'Kabul et').replace('class="round"', 'class="round positive"')}</div>` })));
function screen(o = {}) {
  const body = o.empty
    ? L.stateCard('empty', 'Henüz mesaj yok', 'Masa bitince arkadaş eklediğin kişilerle burada yazışırsın.')
    : o.tab === 'istek' ? requests(o.n || 2) : threads();
  return `${L.tabTop('Mesajlar', bell(o.bell ?? 3))}<div class="scroll">${seg(o.tab || 'sohbet', o.n || 2)}${body}</div>${o.push ? push(o.push) : ''}${L.tabbar('mesaj')}`;
}
const mini = (kind) => kind === 'table' ? `<span class="mini"><img src="/_blob/${'e4ecb3a6a8d42cd88e3b7d5d3aa34823'}" alt=""></span>` : `<span class="mini">${bar(kind === 'ok' ? 'accept' : 'add', 'positive')}</span>`;
const notif = (o) => `<div class="notif${o.new ? ' new' : ''}"${o.off ? ' style="opacity: 0.64;"' : ''}><span class="who">${L.av(o.p, 's40').replace('class="av s40"', 'class="av s40" style="width: 44px; height: 44px;"')}${mini(o.kind)}</span><div class="mid"><span>${o.text}</span><span class="t-note">${o.meta}</span>${o.acts ? `<div class="acts">${o.acts}</div>` : ''}</div>${o.new ? '<i class="dot"></i>' : ''}</div>`;
const rejAcc = (yes) => btn('Reddet', { size: 's', kind: 'quiet' }) + btn(yes, { size: 's', kind: 'positive', bar: yes === 'Kabul et' ? 'accept' : '' });

const dmTop = (name, sub) => L.innerTop({ lead: L.av(name, 's40'), title: name, sub, right: L.round(bar('more'), 'Diğer seçenekler') });
const dmStream = () => [
  day('Dün'),
  msg({ first: true, text: 'Bugünkü Kapsül Anlat çok iyiydi', time: '22:10' }),
  msg({ own: true, first: true, quote: ['Ece', 'Bugünkü Kapsül Anlat çok iyiydi'], text: 'Evet ya, son tur efsaneydi', time: '22:12', read: true, reacts: [['ask', 1]] }),
  day('Bugün'),
  msg({ first: true, text: "Yarın Kapsül Anlat'a var mısın?", time: '21:39' }),
  msg({ text: 'Geçen sefer çok iyiydi, bu sefer kesin kazanırız', time: '21:40' }),
].join('');

module.exports = {
  id: 'mesaj',
  name: 'Mesajlar',
  groups: [
    ['Mesajlar ve istekler', ['Mesajlar', 'MesajlarBos', 'MesajlarIstekler']],
    ['Bildirimler (§4.G)', ['Bildirimler', 'BildirimlerKabul', 'BildirimlerBos', 'BildirimIstek', 'BildirimEslesme', 'BildirimDavet']],
    ['Birebir sohbet', ['Dm', 'DmYaziyor', 'DmSecenekler']],
  ],
  titles: { Mesajlar: 'Mesajlar dolu', Dm: 'Birebir sohbet' },
  boards: {
    MesajlarBos: { title: 'Mesajlar boş', body: () => screen({ empty: true }) },
    MesajlarIstekler: { title: 'Arkadaşlık istekleri', body: () => screen({ tab: 'istek' }) },
    Bildirimler: {
      title: 'Bildirimler: dört tür',
      body: () => screen({ bell: 0 }) + sheet('Bildirimler', `<h2 class="t-h2">Bildirimler</h2>
<div class="stack" style="gap: 6px;"><span class="t-label muted">Yeni</span>
${notif({ new: true, p: 'Fevve', kind: 'table', text: '<b>Fevve</b> seni masasına çağırıyor', meta: L.meta('Mavi Kirpi', '4 kişi', '1:42 kaldı'), acts: rejAcc('Katıl') })}
${notif({ new: true, p: 'Can', kind: 'ok', text: '<b>Can</b> ile arkadaş oldunuz', meta: L.meta('Masa sonunda ikiniz de eklediniz', '5 dk') })}
${notif({ new: true, p: 'Zeynep', kind: 'ok', text: '<b>Zeynep</b> arkadaşlık isteğini kabul etti', meta: L.meta('Artık mesajlaşabilirsiniz', '20 dk') })}
<span class="t-label muted" style="margin-top: 6px;">Önceki</span>
${notif({ p: 'Kerem', kind: 'add', text: '<b>Kerem</b> sana arkadaşlık isteği gönderdi', meta: '2 sa', acts: rejAcc('Kabul et') })}
${notif({ p: 'Burak', kind: 'table', off: true, text: '<b>Burak</b> seni masasına çağırmıştı', meta: L.meta('Davet artık geçerli değil', 'Dün') })}</div>
${btn('Kapat', { kind: 'quiet', size: 'l', full: true })}`, 'gap: 10px;'),
    },
    BildirimlerKabul: {
      title: 'Bildirimler: istek ve davet kabul edilince',
      body: () => screen({ bell: 0 }) + sheet('Bildirimler', `<h2 class="t-h2">Bildirimler</h2>
<div class="stack" style="gap: 6px;"><span class="t-label muted">Yeni</span>
${notif({ new: true, p: 'Fevve', kind: 'table', text: '<b>Fevve</b> seni masasına çağırıyor', meta: '<span style="color: var(--on-success-soft); font-weight: 700;">Kabul edildi, Mavi Kirpi masasının yanına git.</span>' })}
<span class="t-label muted" style="margin-top: 6px;">Önceki</span>
${notif({ p: 'Kerem', kind: 'ok', text: '<b>Kerem</b> ile artık arkadaşsınız', meta: '2 sa', acts: btn('Mesaj yaz', { size: 's', kind: 'primary', bar: 'send' }) })}</div>
${btn('Kapat', { kind: 'quiet', size: 'l', full: true })}`, 'gap: 10px;'),
    },
    BildirimlerBos: {
      title: 'Bildirimler boş',
      body: () => screen({ bell: 0 }) + sheet('Bildirimler', `<h2 class="t-h2">Bildirimler</h2>${L.stateCard('empty', 'Henüz bildirim yok', 'Arkadaşlık istekleri ve arkadaşlarının masa davetleri burada görünür.').replace('class="card state"', 'class="card state flat"')}${btn('Kapat', { kind: 'quiet', size: 'l', full: true })}`),
    },
    BildirimIstek: { title: 'Push: arkadaşlık isteği', body: () => screen({ n: 3, push: 'Yeni bir arkadaşlık isteğin var' }) },
    BildirimEslesme: { title: 'Push: eşleşme, yalnızca ilk basana (K-70)', body: () => screen({ push: 'Masada eklediğin biriyle arkadaş oldunuz' }) },
    BildirimDavet: { title: 'Push: masa daveti', body: () => screen({ push: 'Bir arkadaşın seni masasına çağırıyor' }) },
    DmYaziyor: {
      title: 'Birebir sohbet: yazıyor', css: L.WALL.dm,
      body: () => dmTop('Kerem', '<span class="t-label link">yazıyor</span><span class="typing" style="padding: 0;"><i></i><i></i><i></i></span>') + L.chat({ stream: [day('Bugün'), msg({ own: true, first: true, text: 'Akşam masa açıyor musun?', time: '21:05', read: true }), msg({ first: true, text: 'Bakıyorum şimdi', time: '21:10' }), L.typingMsg()].join('') }),
    },
    DmSecenekler: {
      title: 'Sohbet seçenekleri', css: L.WALL.dm,
      body: () => dmTop('Ece') + L.chat({ stream: dmStream() }) + sheet('Ece', `<h2 class="t-h2">Ece</h2>${L.menu([{ t: 'Arkadaşlıktan çıkar', ico: 'person' }, { t: 'Engelle', ico: 'block', neg: true }, { t: 'Bildir', bar: 'report', neg: true }])}${btn('Vazgeç', { kind: 'quiet', size: 'l', full: true })}`),
    },
  },
};
