/* skall kanki atölyesi: kankini tasarla bölümü + kankilere dokununca zıplama. kanki.js'ten sonra yüklenir. Kayıt bu tarayıcıda saklanır. */
(function () {
  var ANAHTAR = 'skall-kanki';
  var sec = null;
  try { sec = JSON.parse(localStorage.getItem(ANAHTAR) || 'null'); } catch (e) { sec = null; }
  var kayitli = !!sec;
  if (!sec) { sec = {}; for (var k in KT.VARSAYILAN) sec[k] = KT.VARSAYILAN[k]; }
  var kat = 'bas';
  var ana = document.getElementById('kt-ana');
  var sek = document.getElementById('kt-sekmeler');
  var secenek = document.getElementById('kt-secenek');
  var durum = document.getElementById('kt-durum');

  function haber(ad) { try { document.dispatchEvent(new CustomEvent(ad, { detail: sec })); } catch (e) {} }
  function zipla(el) { el.classList.remove('hop'); void el.offsetWidth; el.classList.add('hop'); setTimeout(function () { el.classList.remove('hop'); }, 650); }
  function ciz(hopla) {
    if (!ana) return;
    ana.innerHTML = KT.svg(sec, { id: 'kt-ana' });
    secenek.innerHTML = KT.secenekler(sec, kat);
    sek.innerHTML = KT.sekmeler(kat);
    if (hopla) zipla(ana);
  }
  // kaydedilen kanki alt bilgi rafına katılır (eşlikçi kanki de bu görünüşü alır)
  function yerlestir() {
    var raf = document.getElementById('alt-raf');
    if (raf) {
      var eski = raf.querySelector('.kt-raf'); if (eski) eski.remove();
      var s = document.createElement('span');
      s.className = 'kk dalga kt-raf'; s.innerHTML = KT.svg(sec, { id: 'kt-raf' });
      raf.insertBefore(s, raf.firstChild);
      if (raf.children.length > 8) raf.removeChild(raf.lastElementChild);
    }
  }
  if (ana) {
    sek.addEventListener('click', function (e) {
      var b = e.target.closest('.kt-sekme'); if (!b) return;
      kat = b.getAttribute('data-kat'); ciz(false);
      var y = sek.querySelector('[data-kat="' + kat + '"]'); if (y) y.focus();
    });
    secenek.addEventListener('click', function (e) {
      var b = e.target.closest('.kt-sec'); if (!b) return;
      sec[b.getAttribute('data-k')] = b.getAttribute('data-v'); ciz(true); haber('kanki-degisti');
      var y = secenek.querySelector('[data-v="' + b.getAttribute('data-v') + '"]'); if (y) y.focus();
      durum.textContent = 'Beğendiysen kaydet.';
    });
    document.getElementById('kt-rastgele').addEventListener('click', function () {
      sec.renk = KT.RENK[Math.floor(Math.random() * KT.RENK.length)].id;
      ['goz', 'bas', 'yuz', 'boyun'].forEach(function (k) { var l = KT.PARCA[k]; sec[k] = l[Math.floor(Math.random() * l.length)].id; });
      ciz(true); haber('kanki-degisti'); durum.textContent = 'Zar atıldı. Beğendiysen kaydet.';
    });
    document.getElementById('kt-kaydet').addEventListener('click', function () {
      try { localStorage.setItem(ANAHTAR, JSON.stringify(sec)); } catch (e) {}
      yerlestir(); zipla(ana); haber('kanki-kaydedildi');
      durum.textContent = 'Kankin kaydedildi. Artık sana bu görünüşüyle eşlik ediyor.';
    });
    ciz(false);
    if (kayitli) { yerlestir(); durum.textContent = 'Kaydettiğin kanki yüklendi.'; }
  }
  // her kankiye dokununca zıplar
  document.addEventListener('click', function (e) {
    var k = e.target.closest('.s-kok .kk'); if (k) zipla(k);
  });
})();
