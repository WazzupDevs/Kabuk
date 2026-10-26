// Sistem sayfasına ek pano: ekranlar eklenirken çıkan yeni parçalar
const L = require('./lib.cjs');
const { ico, bar, btn } = L;

const lab = (t) => `<span class="lab">${t}</span>`;
const col = (w, inner) => `<div style="width: ${w}px; display: flex; flex-direction: column; gap: 12px;">${inner}</div>`;

function body() {
  const form = lab('FORM · ADIM, ALAN HÂLLERİ, KOD, SEÇİM') + `<div class="card" style="gap: 12px;">
<div class="row-x" style="gap: 10px;"><div class="steps"><i class="on"></i><i class="on"></i><i class="on"></i><i></i><i></i><i></i><i></i></div><span class="stepn">3/7</span></div>
<div class="field">Boş alan</div>
<div class="field on">Odakta</div>
<div class="form"><div class="field error"><span class="pre">+90</span><span class="val">532 12</span></div><span class="hint error">Hata yazısı alanın altında, kırmızı.</span></div>
<div class="otp"><span>4</span><span>8</span><span class="on"></span><span></span><span></span><span></span></div>
<div class="otp error"><span>0</span><span>0</span><span>0</span><span>0</span><span>0</span><span>0</span></div>
<div class="choice on"><span class="radio"></span>Seçili</div>
<div class="choice"><span class="radio"></span>Seçili değil</div>
<div class="choice"><span class="check on">${ico('check')}</span><span class="mid" style="font-size: 14px;">Onay kutusu</span><span class="t-label link">Oku</span></div>
</div>`;
  const alerts = lab('UYARI ŞERİDİ · DÖRT TON, AYNI KALIP') + `<div class="stack" style="gap: 8px;">
${L.banner('Uyarı', 'Sonucu olan bir seçim.', 'warn')}
${L.banner('Hata', 'İşlem olmadı; ne yapılacağı yazar.', 'danger')}
${L.banner('Bilgi', 'Ek açıklama.', 'info', bar('report', 'neutral'))}
${L.banner('Tamam', 'Olumlu sonuç.', 'positive', bar('accept', 'positive'))}
</div>` + lab('BOŞ, YÜKLENİYOR, HATA') + L.stateCard('empty', 'Henüz bir şey yok', 'Ne olunca dolacağı yazar.');
  const menus = lab('MENÜ · ALT SAYFADA EYLEM LİSTESİ') + L.menu([{ t: 'Sessize al', ico: 'mute' }, { t: 'Arkadaşlıktan çıkar', ico: 'person' }, { t: 'Engelle', ico: 'block', neg: true }, { t: 'Bildir', bar: 'report', neg: true }]) +
    lab('SATIR SONU · HEP 108 × 36') + `<div class="card" style="gap: 10px;">
<div class="row-x" style="gap: 8px; flex-wrap: wrap;">${btn('Katıl', { size: 's', kind: 'positive', act: true })}${btn('Arkadaş ekle', { size: 's', kind: 'positive', act: true })}${btn('Eklendi', { size: 's', kind: 'quiet', act: true, ico: 'check' })}</div>
<div class="row-x" style="gap: 8px; flex-wrap: wrap;">${L.status('Arkadaşsınız', { tone: 'positive' })}${L.status('Gönderildi')}<span class="btn s quiet act"><span class="busy-dots brand"><i></i><i></i><i></i></span>41 sn</span></div>
<div class="row-x" style="gap: 8px;"><div class="pair">${L.round(bar('end', 'negative'), 'Reddet').replace('class="round"', 'class="round negative"')}${L.round(bar('accept', 'positive'), 'Kabul et').replace('class="round"', 'class="round positive"')}</div><span class="t-note">İstekte iki yuvarlak, yine 108 içinde</span></div>
</div>` + lab('BİLGİ BALONU VE PUSH') + `<div style="position: relative; height: 48px;"><div class="toast" style="bottom: 0; left: 0; right: 0; padding-left: 16px;"><span>Bu girişteki değişiklik hakkını kullandın</span></div></div><div style="position: relative; height: 66px;">${L.push('Bir arkadaşın seni masasına çağırıyor').replace('class="push"', 'class="push" style="top: 0; left: 0; right: 0;"')}</div><span class="t-note">Push ad, masa adı ve mekan taşımaz.</span>`;
  const game = lab('OYUN SAHNESİ · ÜÇ ZEMİN, AYNI PARÇALAR') + `<div class="phone stage mor" style="width: 100%; height: 300px; border-radius: 22px;"><header class="gbar"><button class="round glass" aria-label="Oyundan çık">${ico('close')}</button><span class="ttl">Tur 1/6</span><span class="pillw"><i class="tm a"></i>2<i class="vl"></i>0<i class="tm b"></i></span></header><div class="timer"><b>59</b><span class="track"><i style="width: 90%;"></i></span></div><div class="gmid" style="padding-top: 8px;"><div class="wcard" style="padding: 6px;"><div class="word" style="padding: 14px; font-size: 24px;">OTOBÜS</div><div class="ban" style="padding: 6px 12px 2px;"><span class="t-small">SÖYLEME</span><span style="padding: 4px 0;">durak</span></div></div></div></div>
<div class="row-x" style="gap: 8px;">${['mor', 'pembe', 'gece'].map((k) => `<span class="phone stage ${k}" style="width: 96px; height: 40px; border-radius: 12px; align-items: center; justify-content: center; font-size: 11px; font-weight: 800;">${k === 'mor' ? 'Mor takım' : k === 'pembe' ? 'Pembe takım' : 'Sahtekar'}</span>`).join('')}</div>
<span class="t-note">Sahnede birincil düğme beyazdır; ikincil cam çerçeveli. Kart içi yazı her zaman mürekkep rengi.</span>`;
  return `<div class="sk paper" style="width: 1400px; height: 800px; gap: 22px;">
<div style="display: flex; align-items: baseline; justify-content: space-between;"><h1>Bileşenler 2</h1><span class="t-note">Bütün ekranlar eklenirken çıkan parçalar. Her biri en az iki ekranda kullanılıyor.</span></div>
<div style="display: flex; gap: 28px; flex: 1; min-height: 0;">${col(320, form)}${col(320, alerts)}${col(340, menus)}${col(330, game)}</div></div>`;
}

module.exports = {
  id: 'sistem',
  name: 'Sistem',
  groups: [['Sistem: her ekran bu parçalardan kurulur', ['Main', 'Ikonlar', 'Bilesenler', 'Bilesenler2']]],
  boards: { Bilesenler2: { title: 'Bileşenler 2: form, uyarı, menü, oyun', paper: true, w: 1400, h: 800, body } },
};
