/* Pilot mekan başvurusu (docs/decisions/skall-world-formlar.md): /api/mekan-basvuru, Turnstile ile.
   Sunucu her alanı yeniden doğrular; buradaki denetim yalnızca hatayı hemen göstermek için. */
(function () {
  var form = document.getElementById('mekan-form');
  if (!form) return;
  var btn = document.getElementById('mekan-btn');
  var dogrula = window.skallDogrula(document.getElementById('mekan-dogrula'), 'venue');

  var UYARI = '<svg class="ci" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" class="b"/><rect x="10.7" y="6.4" width="2.6" height="7.2" rx="1.3" class="a"/><circle cx="12" cy="16.8" r="1.6" class="a"/></svg>';
  var CHECK = '<svg class="ci" viewBox="0 0 24 24" aria-hidden="true"><rect x="2.647" y="13.3" width="9.705" height="3.2" rx="1.6" transform="rotate(45 7.5 14.9)" class="b"></rect><rect x="5.973" y="10.6" width="16.654" height="3.2" rx="1.6" transform="rotate(-48.013 14.3 12.2)" class="a"></rect></svg>';
  var DONEN = '<svg class="ci donen" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.6" fill="none" stroke="currentColor" stroke-width="3.2" opacity=".5"/><path d="M12 3.4a8.6 8.6 0 0 1 8.6 8.6" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/></svg>';

  // alan adı (sunucunun "fields" listesindeki) → girdi ve hata metni
  var ALANLAR = {
    venueName: { el: 'm-mekan', hata: 'Mekanın adını yaz.' },
    district: { el: 'm-ilce', hata: 'Mekanın ilçesini yaz.' },
    contactName: { el: 'm-yetkili', hata: 'Yetkilinin adını yaz.' },
    phone: { el: 'm-tel', hata: 'Geçerli bir telefon numarası yaz (ör. 0532 123 45 67).' },
    email: { el: 'm-eposta', hata: 'Geçerli bir e-posta adresi yaz.' },
    notice: { el: 'm-kvkk', hata: 'Devam etmek için aydınlatma metnini okuduğunu işaretle.' }
  };

  Object.keys(ALANLAR).forEach(function (k) {
    var a = ALANLAR[k];
    a.girdi = document.getElementById(a.el);
    var p = document.createElement('p');
    p.className = 'yardim hata'; p.hidden = true; p.id = a.el + '-hata';
    p.innerHTML = UYARI + '<span></span>';
    p.querySelector('span').textContent = a.hata;
    var yer = k === 'notice' ? a.girdi.closest('.onay') : a.girdi.closest('.alan');
    if (k === 'notice') yer.insertAdjacentElement('afterend', p); else yer.appendChild(p);
    a.mesaj = p;
    a.girdi.addEventListener('input', function () { isaretle(k, false); });
    a.girdi.addEventListener('change', function () { isaretle(k, false); });
  });

  function isaretle(k, hatali) {
    var a = ALANLAR[k];
    a.mesaj.hidden = !hatali;
    if (k !== 'notice') a.girdi.parentNode.classList.toggle('hatali', hatali);
    if (hatali) a.girdi.setAttribute('aria-describedby', a.mesaj.id); else a.girdi.removeAttribute('aria-describedby');
    a.girdi.setAttribute('aria-invalid', hatali ? 'true' : 'false');
  }

  var durum = document.createElement('div');
  durum.className = 'durum'; durum.hidden = true; durum.setAttribute('role', 'status');
  form.insertBefore(durum, btn);
  function durumGoster(tur, ikon, baslik, alt) {
    durum.className = 'durum ' + tur;
    durum.innerHTML = '<span class="ik">' + ikon + '</span><div class="yigin" style="gap:4px"><p class="g2" style="font-weight:700"></p><p class="k1 ikincil"></p></div>';
    durum.querySelector('.g2').textContent = baslik;
    durum.querySelector('.k1').textContent = alt;
    durum.hidden = false;
  }

  function deger(k) { return ALANLAR[k].girdi.value.trim(); }

  function yerelDenetim() {
    var yanlis = [];
    ['venueName', 'district', 'contactName'].forEach(function (k) { if (!deger(k)) yanlis.push(k); });
    var tel = deger('phone').replace(/\D/g, '');
    if (!/^(90|0)?[2-5]\d{9}$/.test(tel)) yanlis.push('phone');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s.]{2,}$/.test(deger('email'))) yanlis.push('email');
    if (!ALANLAR.notice.girdi.checked) yanlis.push('notice');
    return yanlis;
  }

  function hatalariGoster(yanlis) {
    Object.keys(ALANLAR).forEach(function (k) { isaretle(k, yanlis.indexOf(k) > -1); });
    if (yanlis.length) ALANLAR[yanlis[0]].girdi.focus();
  }

  var gonderiliyor = false;
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (gonderiliyor) return;
    durum.hidden = true;
    var yanlis = yerelDenetim();
    hatalariGoster(yanlis);
    if (yanlis.length) return;
    gonderiliyor = true;
    var eski = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = DONEN + 'Gönderiliyor';
    dogrula.gonder('/api/mekan-basvuru', {
      venueName: deger('venueName'),
      district: deger('district'),
      contactName: deger('contactName'),
      phone: deger('phone'),
      email: deger('email'),
      noticeRead: ALANLAR.notice.girdi.checked
    }).then(function (s) {
      gonderiliyor = false;
      btn.disabled = false;
      btn.innerHTML = eski;
      var kod = s.govde && s.govde.error ? s.govde.error.code : '';
      if (s.durum === 200) {
        form.reset();
        durumGoster('tamam', CHECK, 'Başvurunuz alındı.', 'Teşekkürler. Sizinle iletişime geçeceğiz.');
      } else if (kod === 'bad_fields') {
        hatalariGoster(s.govde.error.fields || []);
      } else if (kod === 'rate_limited') {
        durumGoster('hata', UYARI, 'Bugünlük sınıra ulaşıldı.', 'Yarın tekrar deneyin ya da support@skall.world adresine yazın.');
      } else if (kod === 'verification_failed') {
        durumGoster('hata', UYARI, 'Doğrulama tamamlanmadı.', 'Tekrar deneyin.');
      } else {
        durumGoster('hata', UYARI, 'Başvuru şu an gönderilemedi.', 'Biraz sonra tekrar deneyin ya da support@skall.world adresine yazın.');
      }
    });
  });
})();
