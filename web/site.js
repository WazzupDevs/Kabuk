/* Kampüsünü çağır: oylar henüz sunucuya bağlı değil, oy bu tarayıcıda saklanır. */
(function () {
  var ESIK = 300;
  var okullar = [
    { ad: 'Sakarya Uygulamalı Bilimler Üniversitesi', oy: 0 },
    { ad: 'Boğaziçi Üniversitesi', oy: 0 },
    { ad: 'İstanbul Teknik Üniversitesi', oy: 0 },
    { ad: 'Orta Doğu Teknik Üniversitesi', oy: 0 },
    { ad: 'Yıldız Teknik Üniversitesi', oy: 0 },
    { ad: 'Marmara Üniversitesi', oy: 0 },
    { ad: 'İstanbul Üniversitesi', oy: 0 },
    { ad: 'Hacettepe Üniversitesi', oy: 0 },
    { ad: 'Ankara Üniversitesi', oy: 0 },
    { ad: 'Gazi Üniversitesi', oy: 0 },
    { ad: 'Bilkent Üniversitesi', oy: 0 },
    { ad: 'Koç Üniversitesi', oy: 0 },
    { ad: 'Sabancı Üniversitesi', oy: 0 },
    { ad: 'Galatasaray Üniversitesi', oy: 0 },
    { ad: 'Bahçeşehir Üniversitesi', oy: 0 },
    { ad: 'İstanbul Bilgi Üniversitesi', oy: 0 },
    { ad: 'Kadir Has Üniversitesi', oy: 0 },
    { ad: 'Yeditepe Üniversitesi', oy: 0 },
    { ad: 'Özyeğin Üniversitesi', oy: 0 },
    { ad: 'İstanbul Medipol Üniversitesi', oy: 0 },
    { ad: 'Üsküdar Üniversitesi', oy: 0 },
    { ad: 'İstanbul Aydın Üniversitesi', oy: 0 },
    { ad: 'Altınbaş Üniversitesi', oy: 0 },
    { ad: 'Maltepe Üniversitesi', oy: 0 },
    { ad: 'Beykent Üniversitesi', oy: 0 },
    { ad: 'İstanbul Medeniyet Üniversitesi', oy: 0 },
    { ad: 'Kocaeli Üniversitesi', oy: 0 },
    { ad: 'Düzce Üniversitesi', oy: 0 },
    { ad: 'Bolu Abant İzzet Baysal Üniversitesi', oy: 0 },
    { ad: 'Bursa Uludağ Üniversitesi', oy: 0 },
    { ad: 'Eskişehir Osmangazi Üniversitesi', oy: 0 },
    { ad: 'Anadolu Üniversitesi', oy: 0 },
    { ad: 'Ege Üniversitesi', oy: 0 },
    { ad: 'Dokuz Eylül Üniversitesi', oy: 0 },
    { ad: 'İzmir Ekonomi Üniversitesi', oy: 0 },
    { ad: 'İzmir Yüksek Teknoloji Enstitüsü', oy: 0 },
    { ad: 'Başkent Üniversitesi', oy: 0 },
    { ad: 'Atılım Üniversitesi', oy: 0 },
    { ad: 'TOBB Ekonomi ve Teknoloji Üniversitesi', oy: 0 },
    { ad: 'Akdeniz Üniversitesi', oy: 0 },
    { ad: 'Çukurova Üniversitesi', oy: 0 },
    { ad: 'Mersin Üniversitesi', oy: 0 },
    { ad: 'Pamukkale Üniversitesi', oy: 0 },
    { ad: 'Erciyes Üniversitesi', oy: 0 },
    { ad: 'Selçuk Üniversitesi', oy: 0 },
    { ad: 'Ondokuz Mayıs Üniversitesi', oy: 0 },
    { ad: 'Karadeniz Teknik Üniversitesi', oy: 0 },
    { ad: 'Atatürk Üniversitesi', oy: 0 }
  ];
  var ANAHTAR = 'skall-oy';
  var oyum = null;
  try { oyum = JSON.parse(localStorage.getItem(ANAHTAR) || 'null'); } catch (e) { oyum = null; }
  if (oyum && oyum.yeni) okullar.push({ ad: oyum.okul, oy: 0 });
  if (oyum) okullar.forEach(function (o) { if (o.ad === oyum.okul) o.oy += 1; });

  var kok = document.querySelector('.s-kok');
  // #pilot ile pilot açık hâli denenir
  function pilot() { kok.classList.toggle('pilot-acik', location.hash === '#pilot'); }
  pilot(); window.addEventListener('hashchange', pilot);

  var kart = document.getElementById('oy-kart');
  var ara = document.getElementById('uni-ara');
  var liste = kart.querySelector('.oy-sira').parentNode;
  var durum = document.createElement('div');
  durum.className = 'durum'; durum.hidden = true;
  liste.parentNode.insertBefore(durum, liste);

  var CHECK = '<svg class="ci" viewBox="0 0 24 24" aria-hidden="true"><rect x="2.647" y="13.3" width="9.705" height="3.2" rx="1.6" transform="rotate(45 7.5 14.9)" class="b"></rect><rect x="5.973" y="10.6" width="16.654" height="3.2" rx="1.6" transform="rotate(-48.013 14.3 12.2)" class="a"></rect></svg>';
  var ARA = '<svg class="ci" viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.4" cy="10.4" r="5.6" class="b"></circle><circle cx="10.4" cy="10.4" r="5.6" class="o"></circle><rect x="12.73" y="15.7" width="9.14" height="3.2" rx="1.6" transform="rotate(45 17.3 17.3)" class="a"></rect></svg>';
  var UYARI = '<svg class="ci" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" class="b"/><rect x="10.7" y="6.4" width="2.6" height="7.2" rx="1.3" class="a"/><circle cx="12" cy="16.8" r="1.6" class="a"/></svg>';

  function esc(s) { return s.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function ciz() {
    okullar.sort(function (a, b) { return b.oy - a.oy; });
    var q = ara.value.trim().toLocaleLowerCase('tr');
    var html = '', gorunen = 0;
    okullar.forEach(function (o, i) {
      var gorun = q ? o.ad.toLocaleLowerCase('tr').indexOf(q) > -1 : (i < 6 || (oyum && oyum.okul === o.ad));
      if (gorun) gorunen++;
      var benim = oyum && oyum.okul === o.ad;
      var sag = benim
        ? '<span class="verdin">' + CHECK + 'Oy verdin</span>'
        : '<button class="btn btn-cizgi btn-kucuk" type="button" data-okul="' + esc(o.ad) + '"' + (oyum ? ' disabled' : '') + '>Oy ver</button>';
      html += '<div class="oy-sira"' + (gorun ? '' : ' hidden') + '><span class="ad">' + esc(o.ad) + '</span>' + sag +
        '<div class="cubuk"><div class="yol-c"><div class="dolu" style="width:' + Math.min(100, Math.round(o.oy / ESIK * 100)) + '%"></div></div><span class="sayi">' + o.oy + ' oy</span></div></div>';
    });
    liste.innerHTML = html;
    if (q && !gorunen) {
      durumGoster('', ARA, 'Bu adla bir üniversite bulamadık.', 'Okulun için başvurabilirsin.', '<a class="btn btn-cizgi btn-kucuk" href="#basvur" style="align-self:flex-start;margin-top:8px">Başvur</a>');
    } else if (!durum.dataset.kalici) { durum.hidden = true; }
    document.getElementById('basvur-btn').disabled = !!oyum;
  }

  function durumGoster(tur, ikon, baslik, alt, ek, kalici) {
    durum.className = 'durum ' + tur;
    durum.innerHTML = '<span class="ik">' + ikon + '</span><div class="yigin" style="gap:4px"><p class="g2" style="font-weight:700">' + baslik + '</p><p class="k1 ikincil">' + alt + '</p>' + (ek || '') + '</div>';
    durum.hidden = false;
    if (kalici) durum.dataset.kalici = '1'; else delete durum.dataset.kalici;
  }

  function oyVer(okul, yeni) {
    if (oyum) {
      durumGoster('hata', UYARI, 'Zaten bir okula oy verdin.', 'Her cihaz yalnızca bir okula oy verebilir. Oyun: ' + esc(oyum.okul) + '.', '', true);
      return;
    }
    oyum = { okul: okul, yeni: !!yeni };
    try { localStorage.setItem(ANAHTAR, JSON.stringify(oyum)); } catch (e) {}
    if (yeni) okullar.push({ ad: okul, oy: 1 });
    else okullar.forEach(function (o) { if (o.ad === okul) o.oy += 1; });
    ara.value = '';
    durumGoster('tamam', CHECK, yeni ? 'Başvurun alındı.' : 'Oyun sayıldı.', yeni ? esc(okul) + ' için ilk oy senden.' : 'Arkadaşlarına da haber ver.', '', true);
    ciz();
  }

  liste.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-okul]');
    if (b && !b.disabled) oyVer(b.getAttribute('data-okul'), false);
  });
  ara.addEventListener('input', function () { delete durum.dataset.kalici; ciz(); });

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
    var tamam = true;
    var deger = ad.value.trim();
    ad.parentNode.classList.toggle('hatali', !deger);
    hata.hidden = !!deger; hata.querySelector('span').textContent = 'Üniversitenin adını yaz.';
    if (!deger) tamam = false;
    onayHata.hidden = onay.checked; onayHata.querySelector('span').textContent = 'Devam etmek için 18 yaşından büyük olduğunu onayla.';
    if (!onay.checked) tamam = false;
    if (!tamam) return;
    if (oyum) { oyVer(deger, true); return; }
    var eski = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<svg class="ci donen" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.6" fill="none" stroke="currentColor" stroke-width="3.2" opacity=".5"/><path d="M12 3.4a8.6 8.6 0 0 1 8.6 8.6" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/></svg>Gönderiliyor';
    setTimeout(function () {
      btn.innerHTML = eski;
      var var_ = okullar.some(function (o) { return o.ad.toLocaleLowerCase('tr') === deger.toLocaleLowerCase('tr'); });
      oyVer(var_ ? okullar.filter(function (o) { return o.ad.toLocaleLowerCase('tr') === deger.toLocaleLowerCase('tr'); })[0].ad : deger, !var_);
      form.reset();
      kart.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 900);
  });

  // kaydırma okları: şeridi bir ekran genişliği kadar kaydırır
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

  if (oyum) durumGoster('tamam', CHECK, 'Oyun sayıldı.', 'Oyun: ' + esc(oyum.okul) + '.', '', true);
  ciz();
})();
