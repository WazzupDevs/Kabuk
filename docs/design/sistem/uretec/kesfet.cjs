// Keşfet ve Aktiviteler
const L = require('./lib.cjs');
const { ico, bar, btn, sheet, note, chips, venueThumb, gameThumb } = L;

const viewSeg = (mode) =>
  `<div class="seg" style="height: 44px; width: 96px; flex: none;" role="tablist"><span${mode === 'list' ? ' class="on"' : ''} role="tab" aria-label="Liste">${bar('list', 'neutral', 'width: 20px; height: 20px;')}</span><span${mode === 'map' ? ' class="on"' : ''} role="tab" aria-label="Harita">${bar('map', 'neutral', 'width: 20px; height: 20px;')}</span></div>`;
const search = `<div class="field">${ico('search')}Mekan ara</div>`;
const filters = `<div class="chips"><span class="chip on">Tümü</span><span class="chip">Kampüs</span><span class="chip">Kafe ve mekan</span></div>`;
const actions = (a, b, st = '') => `<div class="stack" style="gap: 10px;">${btn(a, { kind: 'primary', size: 'l', full: true, state: st })}${btn(b, { kind: 'quiet', size: 'l', full: true })}</div>`;

// Çizilmiş harita
function mapGround() {
  const f = (v) => `style="fill: var(--${v})"`;
  const st = (v, w, extra = '') => `style="fill: none; stroke: var(--${v}); stroke-width: ${w}px;${extra}"`;
  return `<svg class="ground" viewBox="0 0 360 590" preserveAspectRatio="xMidYMin slice" aria-hidden="true">
<path d="M-20 54 C 80 20, 190 92, 380 40" ${st('map-water', 26, ' stroke-linecap: round;')}/>
<rect x="246" y="150" width="150" height="120" rx="34" ${f('map-park')}/>
<rect x="-40" y="470" width="130" height="120" rx="34" ${f('map-park')}/>
<rect x="64" y="210" width="212" height="170" rx="34" ${f('map-zone')}/>
<path d="M-10 168 H 370 M-10 420 H 370 M 206 100 V 600 M 334 100 V 600" ${st('map-road', 18)}/>
<path d="M 140 210 V 380 M 64 302 H 276" ${st('map-road', 9)}/>
<path d="M-10 168 H 370 M-10 420 H 370 M 206 100 V 600" ${st('hairline', 2, ' stroke-dasharray: 3 7;')}/>
</svg>`;
}
const pin = (kind, x, y, n, here) =>
  `<span class="pin${here ? ' here' : ''}" style="left: ${x - 26}px; top: ${y - 26}px;">${L.VENUE[kind].replace('<svg ', '<svg aria-hidden="true" ')}<span class="badge">${n}</span></span>`;

// Bugünkü etkinlik (K-15, K-44): kapak mekan türünün çizimi, üstte "Etkinlik" ve saat, altta ad ve mekan; sayı ve "ilgileniyorum" yok
const evCard = (kind, when, title, venue) =>
  `<div class="card media"><div class="art">${L.eventCover(kind)}<div class="tags"><span class="tag light">Etkinlik</span><span class="tag glass">${when}</span></div></div><div class="body"><div class="mid"><span class="t-h3">${title}</span><span class="t-label link">${venue}</span></div>${ico('chev', '', 'color: var(--muted);')}</div></div>`;
// Tek mekanın etkinlik satırı (K-37): takvim simgesi, ad, zaman
const evRow = (title, when, now) =>
  L.item({ lead: `<span class="glyph"${now ? ' style="background: var(--brand-pink); color: #FFFFFF;"' : ''}>${ico('calendar')}</span>`, title, sub: note(when) });
const spotChips = (on) => `<div class="form" style="gap: 10px;"><span class="t-label">Neredesin?</span>${chips(['Kantin', 'Kütüphane', 'Mühendislik', 'Çimler'], on)}<span class="t-note">Aynı noktadaki masalarla oynarsın. Noktanı sonra da değiştirebilirsin.</span></div>`;
const giris = (o) => sheet(o.name, `${L.item({ lead: venueThumb(o.kind), title: '', sub: `<h2 class="t-h2">${o.name}</h2>` + L.meta(o.type, o.district), style: 'padding: 0;' })}
${o.spots ? spotChips(o.spot) : ''}
<p class="t-body muted">Mekanda adınla ve fotoğrafınla görünürsün. Bu girişte bir kez anonime geçebilirsin.</p>
${o.extra || '<p class="t-note">Konumun yalnızca giriş için bir kez doğrulanır, kimseyle paylaşılmaz.</p>'}
${actions(o.cta || 'Giriş yap', 'Vazgeç', o.ctaState)}`);
// Geçmiş (4.3o): kayıtta mekan yok; satırda oyun, "X masasıyla", saat ve sonuç. Kayda basınca eylemler alt sayfada
const histRow = (g, name, alias, time, res, tone) =>
  L.item({ lead: gameThumb(g), title: name, sub: note(`${alias} masasıyla`), end: `<div class="end"><span class="t-note">${time}</span>${res ? `<span class="tag${tone ? ' ' + tone : ''}">${res}</span>` : ''}</div>` });
const gecmis = () => `${L.tabTop('Aktiviteler')}
<div class="scroll"><div class="seg"><span>Aktiviteler</span><span class="on">Geçmiş</span></div>
${L.section('Bugün')}${L.list(histRow('ka', 'Kapsül Anlat', 'Ece', '20:10', 'Kazandın', 'positive'), histRow('sg', 'Sahtekar', 'kapsul-vf61', '19:30', 'Buldun', 'positive'))}
${L.section('Dün')}${L.list(histRow('ka', 'Kapsül Anlat', 'Burak', '22:05', 'Kaybettin', 'warn'), histRow('sg', 'Sahtekar', 'Deniz', '21:20', 'Buldun', 'positive'))}
${L.section('Bu hafta')}${L.list(histRow('ka', 'Kapsül Anlat', 'Can', 'Salı', 'Kazandın', 'positive'))}
</div>${L.tabbar('akt')}`;
const kayit = (o) => sheet(o.alias, `<div class="row-x" style="gap: 12px;">${gameThumb('sg')}<div class="mid" style="display: flex; flex-direction: column; gap: 2px;"><h2 class="t-h2">${o.alias}</h2><span class="t-note">Sahtekar · bugün 19:30</span></div></div>
${o.state === 'added' ? `<div class="stack" style="gap: 6px;">${btn('Eklendi', { size: 'l', full: true, kind: 'quiet', ico: 'check' })}<span class="t-note" style="text-align: center;">${o.alias} bunu görmez. O da seni eklerse arkadaş olursunuz. Yeniden basarsan geri alırsın.</span></div>`
    : o.state === 'friends' ? L.rowEq(`<span class="status positive" style="height: 44px; flex: 1;">${ico('check')}Arkadaşsınız</span>`, btn('Mesaj', { kind: 'primary', bar: 'send' }))
      : btn('Arkadaş ekle', { kind: 'positive', size: 'l', full: true, bar: 'add' })}
${L.menu([{ t: 'Şikayet et', bar: 'report', neg: true }, { t: 'Engelle', ico: 'block', neg: true }])}
${btn('Kapat', { kind: 'quiet', size: 'l', full: true })}`);

// Tek aktif mekan (K-37): mekanın kartı, önümüzdeki 7 günün etkinlikleri; şehir, arama, çip ve liste/harita yok
const markSvg = (px) => { const c = L.uid(); return `<svg viewBox="86 86 340 340" width="${px}" height="${px}" aria-hidden="true"><defs><clipPath id="${c}"><rect width="96" height="236" rx="48"/></clipPath></defs><g transform="translate(180 111)"><rect width="96" height="236" rx="48" fill="#7B5CFF"/><rect x="56" y="54" width="96" height="236" rx="48" fill="#FF4F8B"/><g clip-path="url(#${c})"><rect x="56" y="54" width="96" height="236" rx="48" fill="#FFB547"/></g></g></svg>`; };
function tek(events, quiet) {
  const live = quiet ? '<span class="tag">Sessiz</span>' : '<span class="tag positive" style="gap: 6px;"><i class="live"></i>Birkaç açık masa</span>';
  return `${L.tabTop('Keşfet')}
<div class="scroll">
<div class="card media"><div class="art" style="height: 160px; box-sizing: border-box; background: var(--soft); display: flex; align-items: flex-end; justify-content: space-between; padding: 14px 16px 10px;"><span style="align-self: flex-start;">${live}</span><span style="display: flex; flex: none;">${markSvg(104)}</span></div>
<div class="stack" style="gap: 14px; padding: 16px;"><div class="stack" style="gap: 4px;"><h2 class="t-h2">Sakarya Üniversitesi Esentepe Kampüsü</h2><div class="meta">${ico('pin')}Serdivan</div></div>${btn('Buraya giriş yap', { kind: 'primary', size: 'l', full: true })}</div></div>
${L.section('Etkinlikler')}
${quiet ? events : L.list(events)}
<div class="card soft" style="flex-direction: row; align-items: center; gap: 12px;">${markSvg(44)}<span class="t-h3" style="flex: 1;">Yeni mekanlar yakında.</span></div>
</div>${L.tabbar('kesfet')}`;
}

module.exports = {
  id: 'kesfet',
  name: 'Keşfet ve Aktiviteler',
  groups: [
    ['Keşfet: iki ve üstü mekan', ['Kesfet', 'KesfetHarita', 'KesfetKonum']],
    ['Keşfet: tek mekan (K-37)', ['KesfetTekMekan', 'KesfetTekMekanBos']],
    ['Giriş alt sayfası ve konum (K-43)', ['KesfetMekan', 'KesfetGirisKampus', 'KesfetKonumRiza', 'KesfetKonumIzin', 'KesfetKonumDisarida']],
    ['Aktiviteler', ['Aktiviteler', 'AktivitelerBos', 'AktivitelerGecmis', 'AktivitelerGecmisKayit', 'AktivitelerGecmisEklendi']],
  ],
  boards: {
    KesfetHarita: {
      title: 'Keşfet: harita',
      body: () => `${L.tabTop('Keşfet', viewSeg('map'))}
<div class="scroll" style="padding-bottom: 0; flex: none;">${search}${filters}</div>
<div class="map" style="top: 204px;">${mapGround()}
<span class="maplabel" style="left: 18px; top: 18px; color: var(--muted);">Sakarya Nehri</span>
<span class="maplabel" style="left: 80px; top: 222px;">Esentepe Kampüsü</span>
<span class="maplabel" style="left: 12px; top: 428px; color: var(--muted);">Üniversite Caddesi</span>
<span class="maplabel" style="left: 252px; top: 146px; color: var(--muted);">Adapazarı yönü</span>
<span class="hint-pill" style="top: 64px;">Haritayı sürükleyerek gez</span>
${pin('kampus', 172, 272, 6, true)}<span class="tag positive" style="position: absolute; left: 136px; top: 312px;">Buradasın</span>
${pin('cay', 296, 214, 1)}${pin('kafe', 240, 346, 3)}${pin('kafe', 70, 512, 2)}
</div>
${L.tabbar('kesfet')}`,
    },
    KesfetKonum: {
      title: 'Keşfet: şehir ve semt',
      body: () => L.fromBoard('Kesfet') + sheet('Şehir ve semt', `<h2 class="t-h2">Şehir ve semt</h2><p class="t-note">Mekanlar konumuna göre değil, seçtiğin şehir ve semte göre listelenir. Sıralama ada göre.</p>
<div class="form" style="gap: 10px;"><span class="t-label">Şehir</span>${chips(['Sakarya', 'İstanbul'], 'Sakarya')}</div>
<div class="form" style="gap: 10px;"><span class="t-label">Semt</span>${chips(['Tüm semtler', 'Serdivan', 'Adapazarı'], 'Tüm semtler')}</div>
${actions('Göster', 'Vazgeç')}`),
    },
    KesfetMekan: {
      title: 'Giriş alt sayfası: kafe',
      body: () => L.fromBoard('Kesfet') + giris({ name: 'Çınar Altı Çay Bahçesi', kind: 'cay', type: 'Çay bahçesi', district: 'Serdivan', extra: '<p class="t-note">Konumun yalnızca giriş için bir kez doğrulanır, kimseyle paylaşılmaz.</p>' + L.banner('', 'Esentepe Kampüsü girişin biter; bulunduğun masadan ayrılırsın.', 'warn') }),
    },
    KesfetGirisKampus: {
      title: 'Giriş alt sayfası: kampüs, nokta seçimi',
      body: () => L.fromBoard('Kesfet') + giris({ name: 'Esentepe Kampüsü', kind: 'kampus', type: 'Kampüs', district: 'Serdivan', spots: true, spot: 'Kütüphane' }),
    },
    KesfetKonumRiza: {
      title: 'İlk girişte konum rızası',
      body: () => L.fromBoard('Kesfet') + sheet('Konumun', `<span class="glyph" style="width: 56px; height: 56px;">${ico('pin', '', 'width: 26px; height: 26px;')}</span><h2 class="t-h2">Konumun</h2><p class="t-body muted">Mekanda olduğunu doğrulamak için konumunu bir kez kullanıyoruz. Konumun saklanmaz.</p>
<div class="choice" style="align-items: center;"><span class="check on" role="checkbox" aria-checked="true">${ico('check')}</span><span class="mid" style="font-size: 14px; line-height: 20px;">Konumumun bu amaçla kullanılmasına açık rıza veriyorum.</span></div>
${actions('Konumumu kullan', 'Vazgeç')}`),
    },
    KesfetKonumIzin: {
      title: 'Konum izni yok',
      body: () => L.fromBoard('Kesfet') + giris({ name: 'Hush Coffee', kind: 'kafe', type: 'Kafe', district: 'Serdivan', extra: L.banner('Konum izni yok', 'Konum izni olmadan mekanda olduğunu doğrulayamıyoruz. İzni ayarlardan verebilirsin.', 'danger'), cta: 'Ayarları aç' }),
    },
    KesfetKonumDisarida: {
      title: 'Mekanın dışındasın',
      body: () => L.fromBoard('Kesfet') + giris({ name: 'Hush Coffee', kind: 'kafe', type: 'Kafe', district: 'Serdivan', extra: L.banner('Mekanın içinde görünmüyorsun', 'Mekana girince tekrar dene.', 'warn'), cta: 'Tekrar dene' }),
    },
    KesfetTekMekan: {
      title: 'Keşfet: tek aktif mekan',
      body: () => tek([evRow('Kapsül Anlat turnuvası', 'Şimdi', true), evRow('Canlı müzik', 'Bugün 21:00'), evRow('Sahtekar gecesi', 'Yarın 20:00'), evRow('Bahar şenliği buluşması', 'Cumartesi 14:00')].join('')),
    },
    KesfetTekMekanBos: {
      title: 'Keşfet: tek mekan, etkinlik yok',
      body: () => tek(`<div class="card" style="flex-direction: row; align-items: center; gap: 12px;"><span class="glyph">${ico('calendar')}</span><span class="t-body muted" style="flex: 1;">Bu hafta planlı etkinlik yok.</span></div>`, true),
    },
    Aktiviteler: {
      title: 'Aktiviteler: bugünün etkinlikleri',
      body: () => `${L.tabTop('Aktiviteler')}
<div class="scroll"><div class="seg"><span class="on">Aktiviteler</span><span>Geçmiş</span></div>
${note("Sakarya'daki mekanlardan", 'padding: 2px 2px 0;')}
${evCard('campus', 'Şimdi', 'Kapsül Anlat turnuvası', 'Esentepe Kampüsü')}
${evCard('cafe', 'Bugün 21:00', 'Canlı müzik', 'Hush Coffee')}
${evCard('cafe', 'Bugün 22:30', 'Akustik akşam', 'Köşe Kahve')}
</div>${L.tabbar('akt')}`,
    },
    AktivitelerBos: {
      title: 'Aktiviteler: bugün etkinlik yok',
      body: () => `${L.tabTop('Aktiviteler')}
<div class="scroll"><div class="seg"><span class="on">Aktiviteler</span><span>Geçmiş</span></div>
${L.stateCard('empty', 'Bugün etkinlik yok', 'Mekanların bugünkü etkinlikleri burada görünür; haftanın geri kalanı Keşfet’te.')}
</div>${L.tabbar('akt')}`,
    },
    AktivitelerGecmis: { title: 'Aktiviteler: geçmiş', body: gecmis },
    AktivitelerGecmisKayit: { title: 'Geçmişte kayda basınca (anonim kişi)', body: () => gecmis() + kayit({ alias: 'kapsul-vf61' }) },
    AktivitelerGecmisEklendi: { title: 'Geçmişte: eklendi', body: () => gecmis() + kayit({ alias: 'kapsul-vf61', state: 'added' }) },
  },
};
