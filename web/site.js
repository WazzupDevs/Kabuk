/* Kampüsünü çağır: oylar ve okul başvuruları sunucuda (Cloudflare Worker + D1, docs/decisions/skall-world-formlar.md).
   Cihaz başına tek oy; başvurulan okul onaylanınca listede görünür. */
(function () {
  var kok = document.querySelector('.s-kok');
  // #pilot ile pilot açık hâli denenir
  function pilot() { kok.classList.toggle('pilot-acik', location.hash === '#pilot'); }
  pilot(); window.addEventListener('hashchange', pilot);

  var ESIK = 300;
  var kart = document.getElementById('oy-kart');
  if (!kart) { okDugmeleri(); return; }
  var okullar = [], yuklendi = false;
  var ANAHTAR = 'skall-oyum';
  // Oylar sunucuya bağlanmadan önceki, yalnız tarayıcıda kalan eski oy sayılmaz.
  try { localStorage.removeItem('skall-oy'); } catch (e) {}
  var oyum = null;
  try { oyum = JSON.parse(localStorage.getItem(ANAHTAR) || 'null'); } catch (e) { oyum = null; }
  function oyumuYaz(o) { oyum = o; try { localStorage.setItem(ANAHTAR, JSON.stringify(o)); } catch (e) {} }

  var ara = document.getElementById('uni-ara');
  var liste = document.getElementById('oy-liste');
  var durum = document.createElement('div');
  durum.className = 'durum'; durum.hidden = true; durum.setAttribute('role', 'status');
  liste.parentNode.insertBefore(durum, liste);
  var oyDogrula = window.skallDogrula(document.getElementById('oy-dogrula'), 'vote');
  var okulDogrula = window.skallDogrula(document.getElementById('basvur-dogrula'), 'school');

  var CHECK = '<svg class="ci" viewBox="0 0 24 24" aria-hidden="true"><rect x="2.647" y="13.3" width="9.705" height="3.2" rx="1.6" transform="rotate(45 7.5 14.9)" class="b"></rect><rect x="5.973" y="10.6" width="16.654" height="3.2" rx="1.6" transform="rotate(-48.013 14.3 12.2)" class="a"></rect></svg>';
  var ARA = '<svg class="ci" viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.4" cy="10.4" r="5.6" class="b"></circle><circle cx="10.4" cy="10.4" r="5.6" class="o"></circle><rect x="12.73" y="15.7" width="9.14" height="3.2" rx="1.6" transform="rotate(45 17.3 17.3)" class="a"></rect></svg>';
  var UYARI = '<svg class="ci" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" class="b"/><rect x="10.7" y="6.4" width="2.6" height="7.2" rx="1.3" class="a"/><circle cx="12" cy="16.8" r="1.6" class="a"/></svg>';
  var DONEN = '<svg class="ci donen" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.6" fill="none" stroke="currentColor" stroke-width="3.2" opacity=".5"/><path d="M12 3.4a8.6 8.6 0 0 1 8.6 8.6" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/></svg>';

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  var gonderiliyor = false;
  function ciz() {
    var q = ara.value.trim().toLocaleLowerCase('tr');
    var html = '', gorunen = 0;
    okullar.forEach(function (o, i) {
      var benim = oyum && oyum.okul === o.name;
      var gorun = q ? o.name.toLocaleLowerCase('tr').indexOf(q) > -1 : (i < 6 || benim);
      if (gorun) gorunen++;
      var sag = benim
        ? '<span class="verdin">' + CHECK + 'Oy verdin</span>'
        : '<button class="btn btn-cizgi btn-kucuk" type="button" data-id="' + o.id + '"' + (oyum || gonderiliyor ? ' disabled' : '') + '>Oy ver</button>';
      html += '<div class="oy-sira"' + (gorun ? '' : ' hidden') + '><span class="ad">' + esc(o.name) + '</span>' + sag +
        '<div class="cubuk"><div class="yol-c"><div class="dolu" style="width:' + Math.min(100, Math.round(o.votes / ESIK * 100)) + '%"></div></div><span class="sayi">' + o.votes + ' oy</span></div></div>';
    });
    liste.innerHTML = html;
    if (yuklendi && q && !gorunen) {
      durumGoster('', ARA, 'Bu adla bir üniversite bulamadık.', 'Okulun için başvurabilirsin.', '<a class="btn btn-cizgi btn-kucuk" href="#basvur" style="align-self:flex-start;margin-top:8px">Başvur</a>');
    } else if (!durum.dataset.kalici) { durum.hidden = true; }
    document.getElementById('basvur-btn').disabled = !!oyum || gonderiliyor;
  }

  function durumGoster(tur, ikon, baslik, alt, ek, kalici) {
    durum.className = 'durum ' + tur;
    durum.innerHTML = '<span class="ik">' + ikon + '</span><div class="yigin" style="gap:4px"><p class="g2" style="font-weight:700">' + baslik + '</p><p class="k1 ikincil">' + alt + '</p>' + (ek || '') + '</div>';
    durum.hidden = false;
    if (kalici) durum.dataset.kalici = '1'; else delete durum.dataset.kalici;
  }

  // Eşlikçi kanki sonucu buradan duyar (eslik.js).
  function duyur(tur, soz) { document.dispatchEvent(new CustomEvent('skall-oy', { detail: { tur: tur, soz: soz } })); }

  function yukle() {
    durumGoster('', DONEN, 'Okullar yükleniyor.', 'Bir saniye.', '', true);
    fetch('/api/okullar').then(function (r) { if (!r.ok) throw new Error(); return r.json(); }).then(function (v) {
      okullar = v.schools || []; yuklendi = true;
      delete durum.dataset.kalici; durum.hidden = true;
      if (oyum) oyumuGoster();
      ciz();
    }, function () {
      durumGoster('hata', UYARI, 'Okul listesi şu an açılmadı.', 'Bağlantını kontrol edip tekrar dene.', '<button class="btn btn-cizgi btn-kucuk" type="button" data-yenile style="align-self:flex-start;margin-top:8px">Tekrar dene</button>', true);
    });
  }

  function oyumuGoster() {
    if (oyum.durum === 'pending') durumGoster('tamam', CHECK, 'Başvurun alındı.', (oyum.okul ? esc(oyum.okul) : 'Okulun') + ' onaylanınca listede görünür; oyun ona sayıldı.', '', true);
    else durumGoster('tamam', CHECK, 'Oyun sayıldı.', 'Oyun: ' + esc(oyum.okul) + '.', '', true);
  }

  // Sunucunun hatası → kullanıcıya görünen hâl.
  function hataGoster(s) {
    var kod = s.govde && s.govde.error ? s.govde.error.code : '';
    if (kod === 'already_voted') {
      // Sunucu okulun adını yalnız onaylıysa verir.
      var verilen = s.govde.error.school;
      if (verilen) oyumuYaz({ okul: verilen, durum: 'approved' });
      else if (!oyum && s.govde.error.school === null) oyumuYaz({ okul: null, durum: 'pending' });
      durumGoster('hata', UYARI, 'Bu cihazdan zaten oy verildi.', 'Her cihaz yalnızca bir okula oy verebilir.' + (oyum && oyum.okul ? ' Oyun: ' + esc(oyum.okul) + '.' : ''), '', true);
      duyur('hata', 'Bir okula zaten oy verdin.');
    } else if (kod === 'rate_limited') {
      durumGoster('hata', UYARI, 'Bugünlük sınıra ulaşıldı.', 'Bu bağlantıdan bugün çok oy verildi. Yarın tekrar dene.', '', true);
      duyur('hata', 'Bugünlük bu kadar, yarın dene.');
    } else if (kod === 'verification_failed') {
      durumGoster('hata', UYARI, 'Doğrulama tamamlanmadı.', 'Sayfayı yenileyip tekrar dene.', '', true);
      duyur('hata', 'Bir daha deneyelim.');
    } else if (kod === 'not_found') {
      durumGoster('hata', UYARI, 'Bu okul listede yok.', 'Liste yenilendi, tekrar bak.', '', true);
      duyur('hata', 'Bu okulu bulamadım.'); yukle();
    } else {
      durumGoster('hata', UYARI, 'Şu an oy alamıyoruz.', 'Biraz sonra tekrar dene.', '', true);
      duyur('hata', 'Şu an olmadı, birazdan dene.');
    }
  }

  function oyVer(id, dugme) {
    if (oyum || gonderiliyor) return;
    gonderiliyor = true;
    var eski = dugme.innerHTML;
    liste.querySelectorAll('button[data-id]').forEach(function (b) { b.disabled = true; });
    dugme.innerHTML = DONEN + 'Gönderiliyor';
    oyDogrula.gonder('/api/oy', { schoolId: id, device: window.skallCihaz() }).then(function (s) {
      gonderiliyor = false;
      dugme.innerHTML = eski;
      if (s.durum === 200) {
        oyumuYaz({ okul: s.govde.school, durum: 'approved' });
        okullar.forEach(function (o) { if (o.id === id) o.votes += 1; });
        ara.value = '';
        durumGoster('tamam', CHECK, 'Oyun sayıldı.', 'Arkadaşlarına da haber ver.', '', true);
        duyur('tamam', 'Oyun sayıldı! Arkadaşlarına da haber ver.');
      } else hataGoster(s);
      ciz();
    });
  }

  liste.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-id]');
    if (b && !b.disabled) oyVer(+b.getAttribute('data-id'), b);
  });
  durum.addEventListener('click', function (e) { if (e.target.closest('[data-yenile]')) yukle(); });
  ara.addEventListener('input', function () { if (!oyum) delete durum.dataset.kalici; ciz(); });

  // başvuru formu
  var form = document.getElementById('basvur');
  var ad = document.getElementById('uni-ad');
  var onay = document.getElementById('uni-18');
  var btn = document.getElementById('basvur-btn');
  var hata = document.createElement('p');
  hata.className = 'yardim hata'; hata.hidden = true;
  hata.innerHTML = UYARI + '<span></span>';
  ad.closest('.alan').appendChild(hata);
  var onayHata = hata.cloneNode(true);
  onay.closest('.onay').insertAdjacentElement('afterend', onayHata);

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (gonderiliyor) return;
    var tamam = true;
    var deger = ad.value.trim();
    ad.parentNode.classList.toggle('hatali', !deger);
    hata.hidden = !!deger; hata.querySelector('span').textContent = 'Üniversitenin adını yaz.';
    if (!deger) tamam = false;
    onayHata.hidden = onay.checked; onayHata.querySelector('span').textContent = 'Devam etmek için 18 yaşından büyük olduğunu onayla.';
    if (!onay.checked) tamam = false;
    if (!tamam) return;
    if (oyum) { hataGoster({ govde: { error: { code: 'already_voted' } } }); kart.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
    var eski = btn.innerHTML;
    gonderiliyor = true; btn.disabled = true;
    btn.innerHTML = DONEN + 'Gönderiliyor';
    okulDogrula.gonder('/api/okul-basvuru', { name: deger, adult: true, device: window.skallCihaz() }).then(function (s) {
      gonderiliyor = false;
      btn.innerHTML = eski;
      if (s.durum === 200) {
        oyumuYaz({ okul: s.govde.school, durum: s.govde.status });
        if (s.govde.status === 'approved') {
          okullar.forEach(function (o) { if (o.name === s.govde.school) o.votes += 1; });
          durumGoster('tamam', CHECK, 'Okulun zaten listedeydi.', 'Oyun ' + esc(s.govde.school) + ' için sayıldı.', '', true);
        } else {
          durumGoster('tamam', CHECK, 'Başvurun alındı.', esc(s.govde.school) + ' onaylanınca listede görünür; ilk oy senden.', '', true);
        }
        duyur('tamam', 'Başvurun alındı! Arkadaşlarına da haber ver.');
        form.reset();
      } else if (s.govde && s.govde.error && s.govde.error.code === 'bad_name') {
        ad.parentNode.classList.add('hatali'); hata.hidden = false; hata.querySelector('span').textContent = 'Üniversitenin tam adını yaz.';
        ciz(); return;
      } else hataGoster(s);
      ciz();
      kart.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  okDugmeleri();
  yukle();
  ciz();

  // kaydırma okları: şeridi bir ekran genişliği kadar kaydırır
  function okDugmeleri() {
    document.querySelectorAll('.ok').forEach(function (b) {
      var s = document.getElementById(b.getAttribute('aria-controls'));
      if (!s) return;
      b.addEventListener('click', function () { s.scrollBy({ left: s.clientWidth * 0.8 * (+b.getAttribute('data-yon')), behavior: 'smooth' }); });
    });
    function okDurum(s) {
      document.querySelectorAll('.ok[aria-controls="' + s.id + '"]').forEach(function (b) {
        var y = +b.getAttribute('data-yon');
        b.disabled = y < 0 ? s.scrollLeft < 4 : s.scrollLeft + s.clientWidth > s.scrollWidth - 4;
      });
    }
    document.querySelectorAll('.kaydir').forEach(function (s) { s.addEventListener('scroll', function () { okDurum(s); }, { passive: true }); okDurum(s); });
    window.addEventListener('resize', function () { document.querySelectorAll('.kaydir').forEach(okDurum); });
  }
})();
