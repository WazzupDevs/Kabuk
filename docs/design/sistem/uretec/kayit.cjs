// Kayıt ve açılış: 15 ekran
const L = require('./lib.cjs');
const { ico, bar, btn, capsule, sheet, note } = L;

const steps = (n, total = 7, back = true) =>
  `<header class="topbar inner">${back ? L.round(ico('back'), 'Geri') : ''}<div class="steps" role="progressbar" aria-valuemin="1" aria-valuemax="${total}" aria-valuenow="${n}">${Array.from({ length: total }, (_, i) => `<i${i < n ? ' class="on"' : ''}></i>`).join('')}</div>${n ? `<span class="stepn">${n}/${total}</span>` : ''}</header>`;
const lead = (title, text, look) =>
  `<div class="lead"><h1 class="t-h1">${title}</h1><p class="t-note" style="font-size: 14px; line-height: 20px;">${text}</p>${look ? `<span class="peek">${capsule(look, 'fig')}</span>` : ''}</div>`;
const page = (head, content, foot) =>
  `${head}<div class="scroll" style="padding-bottom: 0; gap: 18px;">${content}</div><div class="foot">${foot}</div>`;
const cta = (t, on = true) => btn(t, { kind: 'primary', size: 'l', full: true, state: on ? '' : 'disabled' });

const phoneField = (val, state = 'on') =>
  `<div class="field ${state}"><span class="pre">+90</span>${val ? `<span class="val">${val}</span>` : '5xx xxx xx xx'}</div>`;
const codeRow = (sn) =>
  `<div class="row-x" style="gap: 16px; flex-wrap: wrap;"><span class="t-label muted">Yeniden gönder (${sn} sn)</span><span class="t-label link">Numarayı değiştir</span></div>`;
const select = (label, val, w) =>
  `<div class="form" style="flex: ${w} 1 0; min-width: 0;"><span class="t-label">${label}</span><div class="field box">${val ? `<span class="val">${val}</span>` : 'Seç'}${ico('down', 'end')}</div></div>`;
const dateRow = (d, m, y) => `<div class="row-x" style="gap: 8px; align-items: flex-end;">${select('Gün', d, 0.8)}${select('Ay', m, 1.25)}${select('Yıl', y, 1)}</div>`;
const choices = (on) =>
  ['Kadın', 'Erkek', 'Belirtmek istemiyorum'].map((t) => `<div class="choice${t === on ? ' on' : ''}" role="radio" aria-checked="${t === on}"><span class="radio"></span>${t}</div>`).join('');
const consent = (t) =>
  `<div class="choice" style="align-items: center;"><span class="check" role="checkbox" aria-checked="false"></span><span class="mid" style="font-size: 14px; line-height: 20px;">${t}</span><span class="t-label link">Oku</span></div>`;
const photoPick = () =>
  `<div class="stack" style="align-items: center; gap: 14px; padding-top: 8px;"><span class="picker">${bar('photo')}</span>${btn('Fotoğraf ekle', { size: 's', kind: 'secondary', bar: 'photo' })}</div>`;

const T = {
  onay: lead('Başlamadan önce', 'İkisini de okuyup onaylaman gerekir.', 'Güneş gözlüğü'),
  tel: lead('Telefon numaran', 'Giriş için sana SMS ile kod göndereceğiz. Numaran kimseye görünmez.', 'Korsan şapkası'),
  kod: lead('Kodu gir', '<b style="color: var(--ink);">+90 532 123 45 67</b> numarasına 6 haneli bir kod gönderdik.', 'Göz bandı'),
  isim: lead('Adın', 'Bu adı arkadaşların görür; profilinle göründüğün masalarda ve mekan sohbetinde orada bulunanlar da görür.', 'Kedi kulağı'),
  dogum: lead('Doğum tarihin', 'skall 18 yaş ve üzeri içindir. Doğum tarihin kimseye görünmez, profilinde yalnızca yaşın görünür. Sonra değiştiremezsin.', 'Parti şapkası'),
  cins: lead('Cinsiyetin', 'Kimseye gösterilmez ve sonradan değiştirilemez. Masalara katılırken kadınlar anonim ya da profille katılabilir; erkekler ve belirtmek istemeyenler profilleriyle katılır.', 'Sade'),
  foto: lead('Profil fotoğrafın', 'Profilinle göründüğün yerlerde adınla birlikte görünür. Yüzünün görünmesi gerekmez.', 'Kaptan'),
};

// Karşılama sahnesi: dağınık kapsül kankiler
const SCENE = [
  ['Ninja', 12, 34, 62, -8], ['Güneş gözlüğü', 15, 64, 70, 5], ['Parti şapkası', 33, 74, 74, -4],
  ['Göz bandı', 37, 10, 60, 7], ['Vampir', 38, 40, 66, -9], ['Taç', 52, 56, 70, 3],
  ['Kaptan', 63, 82, 72, -6], ['Kedi kulağı', 70, 14, 62, 9], ['Bıyık', 72, 46, 68, -3], ['Korsan şapkası', 89, 58, 70, 6],
];
const scene = () =>
  `<div style="position: relative; flex: 1; min-height: 0;" aria-hidden="true" data-bleed>${SCENE.map(([k, x, y, h, r]) => { const w = (h * 48) / 66; return `<span style="position: absolute; left: calc(${x}% - ${(w / 2).toFixed(1)}px); top: calc(${y}% - ${h / 2}px); width: ${w.toFixed(1)}px; height: ${h}px; transform: rotate(${r}deg);">${capsule(k, 'fig', 'width="100%" height="100%"')}</span>`; }).join('')}</div>`;

module.exports = {
  id: 'kayit',
  name: 'Kayıt ve açılış',
  groups: [
    ['Karşılama ve onay', ['KayitHosgeldin', 'KayitOnay', 'KayitTelefon', 'KayitTelefonGecersiz', 'KayitTelefonHata']],
    ['Kod ve kimlik', ['KayitKod', 'KayitKodHata', 'KayitIsim', 'KayitDogum', 'KayitDogumOnay']],
    ['Cinsiyet ve fotoğraf', ['KayitCinsiyet', 'KayitFoto', 'KayitFotoErkek', 'Kayit18Alti', 'KayitCinsiyetKapisi']],
  ],
  boards: {
    KayitHosgeldin: {
      title: 'Hoş geldin', cls: 'hero',
      body: () => {
        const wm = L.reid(L.WORDMARK).replace('height="22" width="65.5"', 'height="30" width="89.3"');
        return `<header class="topbar" style="justify-content: space-between;"><span style="flex: 1;"></span>${wm}<span style="flex: 1; display: flex; justify-content: flex-end;">${btn('Geç', { size: 's', kind: 'secondary' })}</span></header>
${scene()}
<div class="stack" style="padding: 0 20px; gap: 10px; flex: none;"><h1 class="t-h1" style="font-size: 34px; line-height: 40px;">Aynı mekanda, aynı masada.</h1><p class="t-body muted">Girdiğin mekandaki masaları gör, birine katıl ya da kendi masanı kur. Oyunu herkes kendi telefonundan oynar.</p></div>
<div class="foot" style="padding-top: 20px;">${cta('Başla')}<span class="t-note" style="text-align: center;">skall 18 yaş ve üzeri içindir.</span></div>`;
      },
    },
    KayitOnay: { title: 'Onaylar', body: () => page(steps(1), T.onay + `<div class="stack" style="gap: 10px;">${consent("Kullanım Koşulları'nı okudum ve kabul ediyorum.")}${consent("KVKK Aydınlatma Metni'ni okudum.")}</div>`, cta('Onayla ve devam et', false)) },
    KayitTelefon: { title: 'Telefon', body: () => page(steps(2), T.tel + phoneField('', 'on'), cta('Kod gönder', false)) },
    KayitTelefonGecersiz: {
      title: 'Telefon: geçersiz numara',
      body: () => page(steps(2), T.tel + `<div class="form">${phoneField('532 12', 'error')}<span class="hint error">Geçerli bir cep telefonu numarası gir (5xx xxx xx xx).</span></div>`, cta('Kod gönder', false)),
    },
    KayitTelefonHata: {
      title: 'Telefon: kod gönderilemedi',
      body: () => page(steps(2), T.tel + phoneField('500 000 00 00', '') + L.banner('Kod gönderilemedi', 'Bağlantını kontrol edip yeniden dene.', 'danger'), cta('Kod gönder')),
    },
    KayitKod: { title: 'Doğrulama kodu', body: () => page(steps(3), T.kod + `<div class="otp"><span class="on"></span><span></span><span></span><span></span><span></span><span></span></div>` + codeRow(58), cta('Doğrula', false)) },
    KayitKodHata: {
      title: 'Doğrulama kodu yanlış',
      body: () => page(steps(3), T.kod + `<div class="form" style="gap: 10px;"><div class="otp error">${'<span>0</span>'.repeat(6)}</div><span class="hint error">Kod yanlış. Yeniden dene.</span></div>` + codeRow(57), cta('Doğrula')),
    },
    KayitIsim: { title: 'İsim', body: () => page(steps(4), T.isim + `<div class="form"><span class="t-label">Görünen ad</span><div class="field on">Adın</div><span class="hint">2–24 karakter.</span></div>`, cta('Devam', false)) },
    KayitDogum: { title: 'Doğum tarihi', body: () => page(steps(5), T.dogum + dateRow('', '', ''), cta('Devam', false)) },
    KayitDogumOnay: {
      title: 'Doğum tarihi onayı',
      body: () => page(steps(5), T.dogum + dateRow('12', 'Mayıs', '2001'), cta('Devam')) +
        sheet('Doğum tarihini onayla', `<h2 class="t-h2">25 yaşındasın</h2><p class="t-note" style="font-size: 14px; line-height: 20px;">Doğum tarihin 12 Mayıs 2001. Sonra değiştiremezsin.</p><div class="stack" style="gap: 10px;">${btn('Onayla', { kind: 'primary', size: 'l', full: true })}${btn('Düzelt', { kind: 'quiet', size: 'l', full: true })}</div>`),
    },
    KayitCinsiyet: { title: 'Cinsiyet', body: () => page(steps(6), T.cins + `<div class="stack" style="gap: 10px;">${choices('')}</div>`, cta('Devam', false)) },
    KayitFoto: { title: 'Fotoğraf, kadın', body: () => page(steps(7), T.foto + photoPick(), cta('Fotoğrafsız bitir')) },
    KayitFotoErkek: {
      title: 'Fotoğraf, erkek',
      body: () => page(steps(7), T.foto + photoPick() + L.banner('', "Fotoğrafın yoksa masa kuramaz ve masalara katılamazsın. Fotoğrafı sonra Profil'den de ekleyebilirsin.", 'warn'), cta('Fotoğrafsız bitir')),
    },
    Kayit18Alti: {
      title: '18 yaş altı',
      body: () => `${steps(7, 7, false).replace(/<i>/g, '<i class="on">').replace('<span class="stepn">7/7</span>', '')}
<div class="hero-empty"><span class="art">${L.glyphEmpty().replace('class="glyph"', 'class="glyph" style="width: 96px; height: 96px; border-radius: 48px;"').replace('width="34" height="34"', 'width="64" height="64"')}</span><h1 class="t-h2">skall 18 yaş ve üzeri içindir</h1><p class="t-note" style="font-size: 14px; line-height: 20px;">Hesabın açılmadı ve bilgilerin saklanmadı.</p></div>
<div class="foot">${cta('Kapat')}</div>`,
    },
    KayitCinsiyetKapisi: {
      title: 'Cinsiyet kapısı (eski hesap)',
      body: () => page(L.innerTop({ title: '' }), lead('Cinsiyetini seç', 'Masalara nasıl katılacağın buna bağlı. Bir kez sorulur. Kimseye gösterilmez ve sonradan değiştirilemez.', 'Sade') + `<div class="stack" style="gap: 10px;">${choices('')}</div>`, cta('Kaydet', false)),
    },
  },
};
