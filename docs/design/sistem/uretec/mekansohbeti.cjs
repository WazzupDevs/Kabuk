// Mekan sohbeti ve sohbet kalıbının ortak hâlleri (basılı tut, yanıtla, en alta in)
const L = require('./lib.cjs');
const M = require('./mekan.cjs');
const { ico, bar, btn, sheet, note, msg, day } = L;

// Kimlik satırı (v46 .vid): kim olarak yazdığın; değişiklik hakkı kullanılınca "Bu girişte değişti"
const idrow = (o = {}) => `<div class="idrow">${o.cap ? L.capAv(o.cap, 's32').replace('class="av s32"', 'class="av s32" style="width: 24px; height: 24px;"') : L.av(o.av || 'Elif', 's32', ' style="width: 24px; height: 24px;"')}<span><b>${o.name || 'Elif'}</b> olarak yazıyorsun</span><span class="link"${o.used ? ' style="color: var(--muted);"' : ''}>${o.used ? 'Bu girişte değişti' : 'Değiştir'}</span></div>`;
const Z = { av: 'Zeynep', who: 'Zeynep', nc: 4, first: true, text: 'Kapsül Anlat için 2 kişi lazım, gelen var mı?', time: '20:49' };
const stream = (o = {}) => [
  msg({ av: 'Kerem', who: 'Kerem', nc: 3, first: true, text: 'Çay ocağı hâlâ açık, az önce aldık', time: '20:37' }),
  msg({ own: true, first: true, text: 'Biz de birazdan Kapsül Anlat açıyoruz', time: '20:45', reacts: [['kahkaha', 2]] }),
  day('Yeni mesajlar', true),
  msg({ ...Z, hl: o.hl === 'z' }),
  msg({ av: 'kapsul-hr12', who: 'kapsul-hr12', nc: 1, first: true, quote: ['Zeynep', 'Kapsül Anlat için 2 kişi lazım, gelen var mı?'], text: 'Biz geliyoruz birazdan', time: '20:50' }),
  msg({ av: 'kapsul-kb88', who: 'kapsul-kb88', nc: 5, first: true, text: "Sahtekar'da iki tur üst üste kazandık", time: '20:53', reacts: [['saskin', 1]] }),
].join('');
const screen = (o = {}) => L.venueChatTop() + L.chat({ stream: o.stream || stream(o), idrow: o.noId ? '' : idrow(o.id), reply: o.reply, extra: o.extra, placeholder: 'Mekana yaz' });
const closeBtn = (t = 'Kapat') => btn(t, { kind: 'quiet', size: 'l', full: true });
const personHead = (avatar, name, sub) => `<div class="row-x" style="gap: 14px;">${avatar}<div class="mid" style="display: flex; flex-direction: column; gap: 2px;"><span class="t-h2">${name}</span><span class="t-note">${sub}</span></div></div>`;
const big = (html) => html.replace(/class="av s48"/, 'class="av s48" style="width: 64px; height: 64px;"');
const personMenu = () => L.menu([{ t: 'Sessize al', ico: 'mute' }, { t: 'Bildir', bar: 'report', neg: true }]);

module.exports = {
  id: 'mekansohbeti',
  name: 'Mekan sohbeti',
  groups: [
    ['Mekan sohbeti', ['MekanSohbeti', 'MekanSohbetiBos', 'MekanSohbetiSecenekler', 'MekanSohbetiKisi', 'MekanSohbetiKisiProfilli', 'MekanSohbetiKimlik', 'MekanSohbetiKimlikErkek', 'MekanSohbetiAnonim']],
    ['Sohbet kalıbı: DM, masa ve mekan sohbetinde aynı', ['SohbetBasiliTut', 'SohbetKendiMesaj', 'SohbetYanit', 'SohbetYeniMesaj']],
  ],
  titles: { MekanSohbeti: 'Mekan sohbeti' },
  boards: {
    MekanSohbetiBos: {
      title: 'Mekan sohbeti: günün ilk mesajı', css: L.WALL.mekan,
      body: () => screen({ stream: `<div class="card" style="align-self: stretch; text-align: center; align-items: center; gap: 4px; margin-bottom: 8px;"><span class="glyph">${L.venueChatIco()}</span><span class="t-h3" style="margin-top: 6px;">Mekandaki herkes okur</span><span class="t-note">Mesajların adınla ve fotoğrafınla görünür. Gün sonunda hepsi silinir.</span></div>${day('Bugün')}` }),
    },
    MekanSohbetiSecenekler: {
      title: 'Mekan sohbeti seçenekleri', css: L.WALL.mekan,
      body: () => screen() + sheet('Mekan sohbeti', `<h2 class="t-h2">Mekan sohbeti</h2>
<div class="card soft" style="flex-direction: row; align-items: center; gap: 12px; padding: 14px;"><div class="mid" style="flex: 1; display: flex; flex-direction: column; gap: 2px;"><span class="t-h3">Sessize al</span><span class="t-note">Yeni mesajlar bildirim göndermez.</span></div><span class="switch" role="switch" aria-checked="false" aria-label="Sessize al"></span></div>
<div class="form" style="gap: 4px;"><span class="t-label">Sessize aldıkların</span><span class="t-note">Sessize aldığın kimse yok.</span></div>
${closeBtn('Tamam')}`),
    },
    MekanSohbetiKisi: {
      title: 'Mesajdaki kişi: anonim', css: L.WALL.mekan,
      body: () => screen() + sheet('kapsul-hr12', `${personHead(big(L.av('kapsul-hr12', 's48')), 'kapsul-hr12', 'Anonim katılıyor')}<p class="t-note">Anonim kişinin profili görünmez.</p>${personMenu()}${closeBtn()}`),
    },
    MekanSohbetiKisiProfilli: {
      title: 'Mesajdaki kişi: profilli', css: L.WALL.mekan,
      body: () => screen() + sheet('Zeynep', `${personHead(big(L.av('Zeynep', 's48')), 'Zeynep', 'Profilli katılıyor')}${btn('Profili gör', { kind: 'primary', size: 'l', full: true })}${personMenu()}${closeBtn()}`),
    },
    MekanSohbetiKimlik: { title: 'Kimliği değiştir: kadın', css: L.WALL.mekan, body: () => screen() + sheet('Anonim görün', M.anonSheet()) },
    MekanSohbetiKimlikErkek: { title: 'Kimliği değiştir: erkek, yalnızca sohbette', css: L.WALL.mekan, body: () => screen({ id: { av: 'Burak', name: 'Burak' } }) + sheet('Mekan sohbetinde anonim yaz', M.anonSheetM()) },
    MekanSohbetiAnonim: { title: 'Anonim yazıyorsun, hak kullanıldı', css: L.WALL.mekan, body: () => screen({ id: { cap: 'Gözlük', name: 'kapsul-kk42', used: true } }) },
    SohbetBasiliTut: {
      title: 'Mesaja basılı tut', css: L.WALL.mekan,
      body: () => screen() + L.pressMenu({ top: 294, on: '', msg: msg({ ...Z, hl: true }), actions: L.menu([{ t: 'Yanıtla', bar: 'reply' }, { t: 'Bildir', bar: 'report', neg: true }]).replace(/^<div class="menu">|<\/div>$/g, '') }),
    },
    SohbetKendiMesaj: {
      title: 'Kendi mesajına basılı tut', css: L.WALL.mekan,
      body: () => screen() + L.pressMenu({ top: 143, own: true, on: '', msg: msg({ own: true, first: true, text: 'Biz de birazdan Kapsül Anlat açıyoruz', time: '20:45', hl: true }), actions: L.menu([{ t: 'Yanıtla', bar: 'reply' }, { t: 'Sil', bar: 'end', neg: true }]).replace(/^<div class="menu">|<\/div>$/g, '') }),
    },
    SohbetYanit: {
      title: 'Yanıt yazarken', css: L.WALL.mekan,
      body: () => screen({ noId: true, reply: L.replyBar('Zeynep', 'Kapsül Anlat için 2 kişi lazım, gelen var mı?') }),
    },
    SohbetYeniMesaj: {
      title: 'Yukarıdayken yeni mesaj', css: L.WALL.mekan,
      body: () => screen({
        stream: [
          msg({ av: 'Kerem', who: 'Kerem', nc: 3, first: true, text: 'Çay ocağı hâlâ açık, az önce aldık', time: '20:37' }),
          msg({ av: 'Burak', who: 'Burak', nc: 2, first: true, text: 'Sahtekar için bir masa daha arıyoruz', time: '20:42' }),
          msg({ av: 'Burak', text: 'Lobideyiz, katılın', time: '20:42' }),
          msg({ own: true, first: true, text: 'Biz de birazdan Kapsül Anlat açıyoruz', time: '20:45', reacts: [['kahkaha', 2]] }),
          msg({ av: 'Zeynep', who: 'Zeynep', nc: 4, first: true, text: 'Süper, bekliyoruz', time: '20:46' }),
        ].join(''),
        extra: `<button class="round jump" style="bottom: 140px;" aria-label="En alta in">${ico('down')}<span class="badge">3</span></button>`,
      }),
    },
  },
};
