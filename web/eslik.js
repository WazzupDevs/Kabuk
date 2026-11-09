/* skall eşlikçi kanki: sayfa boyunca sana eşlik eder, bölüm bölüm hikâye anlatır, arkadaşları yola katılır,
   imleci gözüyle izler, dokunduğun ve baktığın şeylere tepki verir. kanki.js'ten sonra yüklenir. */
(function () {
  if (!window.KT) return;
  var AZ = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var GIZ = 'skall-eslik-gizli', KAN = 'skall-kanki';
  var kok = document.querySelector('.s-kok') || document.body;
  var gorunum = null;
  try { gorunum = JSON.parse(localStorage.getItem(KAN) || 'null'); } catch (e) {}
  if (!gorunum) gorunum = { renk: 'yesil', bas: 'bos', yuz: 'yanak', boyun: 'atki' };

  var MOD = {
    normal: { goz: 'normal', agiz: 'gulus' }, mutlu: { goz: 'mutlu', agiz: 'kocaman' }, saskin: { goz: 'saskin', agiz: 'o' },
    uyku: { goz: 'uykulu', agiz: 'duz' }, sersem: { goz: 'sersem', agiz: 'dalgali' }, kirp: { goz: 'goz-kirp', agiz: 'gulus' }
  };

  // yapı
  var e = document.createElement('div');
  e.className = 'eslik'; e.id = 'eslik';
  e.innerHTML = '<div class="eslik-balon" role="status" aria-live="polite"><p></p></div>' +
    '<div class="eslik-takim" aria-hidden="true"></div>' +
    '<button class="eslik-kk" type="button" aria-label="Kankin. Dokun, konuşsun."><span class="eslik-govde"></span><span class="zzz" aria-hidden="true">z<i>z</i><b>z</b></span></button>' +
    '<button class="eslik-gizle" type="button" aria-label="Kankiyi gizle">×</button>';
  kok.appendChild(e);
  var geri = document.createElement('button');
  geri.className = 'eslik-geri'; geri.type = 'button'; geri.setAttribute('aria-label', 'Kankiyi geri çağır');
  kok.appendChild(geri);

  var balon = e.querySelector('.eslik-balon'), metin = balon.querySelector('p');
  var kk = e.querySelector('.eslik-kk'), govde = e.querySelector('.eslik-govde'), takim = e.querySelector('.eslik-takim');
  var mod = 'normal', modZaman = 0, uyuyor = false;

  function ciz() {
    var s = {}; for (var k in gorunum) s[k] = gorunum[k];
    s.goz = MOD[mod].goz; s.agiz = MOD[mod].agiz;
    govde.innerHTML = KT.svg(s, { id: 'eslik' });
    geri.innerHTML = KT.svg({ renk: s.renk, bas: s.bas, yuz: s.yuz, boyun: 'bos', goz: 'mutlu', agiz: 'gulus' }, { id: 'eslik-geri', vb: '14 8 92 92' });
  }
  function ruh(m, ms) {
    mod = m; ciz(); e.setAttribute('data-mod', m);
    clearTimeout(modZaman);
    if (ms) modZaman = setTimeout(function () { mod = uyuyor ? 'uyku' : 'normal'; ciz(); e.setAttribute('data-mod', mod); }, ms);
  }
  function hop(sinif) {
    if (AZ) return;
    sinif = sinif || 'hop';
    kk.classList.remove('hop', 'takla', 'salla'); void kk.offsetWidth; kk.classList.add(sinif);
    setTimeout(function () { kk.classList.remove(sinif); }, 900);
  }
  var balonZaman = 0, balonSon = 0, balonOnem = 0;
  function soyle(t, ms, onem) {
    onem = onem || 1;
    var simdi = Date.now();
    if (simdi < balonSon && onem < balonOnem) return false;
    metin.textContent = t; e.classList.add('konusuyor');
    balonOnem = onem; balonSon = simdi + (ms || 3600);
    clearTimeout(balonZaman);
    balonZaman = setTimeout(function () { e.classList.remove('konusuyor'); balonOnem = 0; }, ms || 3600);
    return true;
  }

  // arkadaşlar: hikâye ilerledikçe yola katılır
  var ARKADAS = [
    { renk: 'pembe', goz: 'mutlu', agiz: 'gulus', bas: 'fiyonk', yuz: 'yanak', boyun: 'bos' },
    { renk: 'krem', goz: 'normal', agiz: 'gulus', bas: 'bos', yuz: 'burun', boyun: 'atki' },
    { renk: 'lavanta', goz: 'normal', agiz: 'gulus', bas: 'bere', yuz: 'gozluk', boyun: 'bos' }
  ];
  function arkadas() {
    var n = takim.children.length; if (n >= 3) return;
    var s = document.createElement('span');
    s.className = 'kk nefes a' + (n + 1) + ' yeni';
    s.innerHTML = KT.svg(ARKADAS[n], { id: 'eslik-a' + n });
    takim.appendChild(s);
    setTimeout(function () { s.classList.remove('yeni'); }, 700);
  }

  // hikâye: her bölümde bir kez
  var HIKAYE = [
    ['.acilis', 'Selam! Ben senin kankinim. Sayfayı birlikte gezelim.', 'mutlu'],
    ['#nasil', 'Önce mekana gel, check-in yap. Masalar o zaman görünür.', 'normal'],
    ['#oyunlar', 'Masada yedi oyun var. Bir postere dokun, ne düşündüğümü söyleyeyim.', 'saskin', 7],
    ['#kankiler', 'Bak, arkadaşlarım! Biri bizimle geliyor.', 'mutlu', 0],
    ['#tasarla', 'Beni burada süsleyebilirsin. Kaydedersen hep öyle gezerim.', 'kirp'],
    ['#rahat', 'Rahat ol. Katılma isteğin reddedilirse kimse bilmez, ben de söylemem.', 'normal'],
    ['#kampus', 'İlk durak bu iki kampüs. Bir arkadaş daha katıldı!', 'mutlu', 9],
    ['#kampusunu-cagir', 'Okulun listede yoksa çağır, biz de geliriz.', 'saskin'],
    ['.alt', 'Masa tamam! Hepimiz buradayız. Görüşürüz.', 'mutlu']
  ];
  var gorulen = {}, bekleyen = null, siraCalisiyor = false;
  function gorunuyor(h) { var el = document.querySelector(h[0]); if (!el) return false; var r = el.getBoundingClientRect(); return r.top < innerHeight * 0.8 && r.bottom > innerHeight * 0.2; }
  // hikâye: yalnız şu an ekranda olan bölümün satırı söylenir; hızlı geçilen bölüm sonra dönülünce anlatılır
  function siradaki() {
    var h = bekleyen; bekleyen = null;
    if (!h || gorulen[h[0]] || !gorunuyor(h)) { siraCalisiyor = false; return; }
    siraCalisiyor = true; gorulen[h[0]] = 1;
    ruh(h[2], 2600); soyle(h[1], 4200, 2); hop(h[0] === '.alt' ? 'takla' : 'hop');
    if (h[3] !== undefined) setTimeout(function () { arkadas(h[3]); }, 500);
    if (h[0] === '.alt') takim.classList.add('kutla');
    setTimeout(siradaki, 3000);
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (gir) {
      gir.forEach(function (g) {
        if (!g.isIntersecting) return;
        var h = HIKAYE[+g.target.getAttribute('data-hikaye')];
        if (gorulen[h[0]]) return;
        bekleyen = h; if (!siraCalisiyor) setTimeout(siradaki, 200);
      });
    }, { threshold: 0.3 });
    HIKAYE.forEach(function (h, i) { var el = document.querySelector(h[0]); if (el) { el.setAttribute('data-hikaye', i); io.observe(el); } });
  }

  // gözleriyle izler
  var hedefX = innerWidth / 2, hedefY = innerHeight / 2, cerceve = 0;
  function bak() {
    cerceve = 0;
    var r = kk.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height * 0.45;
    var dx = hedefX - cx, dy = hedefY - cy, d = Math.sqrt(dx * dx + dy * dy) || 1, k = Math.min(1, d / 260);
    e.style.setProperty('--gx', (dx / d * 3.4 * k).toFixed(2) + 'px');
    e.style.setProperty('--gy', (dy / d * 3 * k).toFixed(2) + 'px');
    e.style.setProperty('--egil', AZ ? '0deg' : (Math.max(-1, Math.min(1, dx / 500)) * 5).toFixed(2) + 'deg');
  }
  function bakNoktasi(x, y) { hedefX = x; hedefY = y; if (!cerceve) cerceve = requestAnimationFrame(bak); }
  function bakOge(el) { var r = el.getBoundingClientRect(); bakNoktasi(r.left + r.width / 2, r.top + r.height / 2); }
  addEventListener('pointermove', function (v) { bakNoktasi(v.clientX, v.clientY); uyan(); }, { passive: true });
  addEventListener('pointerdown', function (v) { bakNoktasi(v.clientX, v.clientY); uyan(); }, { passive: true });

  // üstüne gelince / dokununca tepki
  var hoverSon = 0, sonOge = null;
  function tepki(el) {
    if (!el || el === sonOge || e.contains(el)) return;
    var t = Date.now(); if (t - hoverSon < 1400) return;
    var c, msg = null, m = 'normal';
    if ((c = el.closest('.oyun'))) { var ad = c.querySelector('h3'); msg = (ad ? ad.textContent : 'Bu') + '! Bunu oynayalım mı?'; m = 'mutlu'; }
    else if (el.closest('.btn-ana')) { msg = 'Bas hadi, bekliyorum!'; m = 'mutlu'; }
    else if (el.closest('.kt-sec')) { msg = 'Bu bana yakışır mı?'; m = 'saskin'; }
    else if (el.closest('.kk, .kt-ana')) { msg = 'Selam arkadaşım!'; m = 'kirp'; }
    else if (el.closest('.kampus-liste li')) { msg = 'Orada buluşalım.'; m = 'mutlu'; }
    else if (el.closest('.liste li')) { msg = 'Bu önemli, oku bence.'; m = 'normal'; }
    else if (el.closest('.oy-sira')) { msg = 'Senin okulun bu mu?'; m = 'saskin'; }
    else if (el.closest('.adim')) { msg = 'Adım adım, acele yok.'; m = 'normal'; }
    if (!msg) return;
    sonOge = c || el; hoverSon = t;
    bakOge(el); if (soyle(msg, 2400, 1)) { ruh(m, 1800); if (m === 'mutlu') hop(); }
  }
  document.addEventListener('pointerover', function (v) { if (v.pointerType === 'mouse') tepki(v.target); });
  document.addEventListener('click', function (v) { if (!e.contains(v.target)) { sonOge = null; hoverSon = 0; tepki(v.target); } });
  document.addEventListener('focusin', function (v) {
    var el = v.target; bakOge(el);
    if (el.id === 'uni-ara') { ruh('saskin', 1500); soyle('Okulunu yaz, bulayım.', 2600, 1); }
    else if (el.id === 'uni-ad') { ruh('saskin', 1500); soyle('Okulunun tam adını yaz.', 2600, 1); }
  });
  document.addEventListener('input', function (v) { if (v.target.matches && v.target.matches('input[type=search],input[type=text]')) bakOge(v.target); });

  // oy ve başvuru sonucu
  function sonuc() {
    setTimeout(function () {
      var d = document.querySelector('.durum');
      if (!d || d.hidden) return;
      if (d.classList.contains('tamam')) { ruh('mutlu', 3000); hop('takla'); konfeti(); soyle('Oyun sayıldı! Arkadaşlarına da haber ver.', 4200, 3); }
      else if (d.classList.contains('hata')) { ruh('saskin', 2200); hop('salla'); soyle('Bir okula zaten oy verdin.', 3200, 3); }
    }, 120);
  }
  document.addEventListener('click', function (v) { if (v.target.closest && v.target.closest('button[data-okul]')) sonuc(); });
  var form = document.getElementById('basvur');
  if (form) form.addEventListener('submit', function () { setTimeout(sonuc, 1000); });
  function konfeti() {
    if (AZ) return;
    var renk = ['#FF4F8B', '#FFB547', '#20CDA5', '#3DDC84', '#B9A6FF'];
    for (var i = 0; i < 14; i++) {
      var p = document.createElement('i'); p.className = 'eslik-konfeti';
      p.style.setProperty('--x', (Math.random() * 160 - 100).toFixed(0) + 'px');
      p.style.setProperty('--y', (-60 - Math.random() * 120).toFixed(0) + 'px');
      p.style.setProperty('--d', (Math.random() * 360).toFixed(0) + 'deg');
      p.style.background = renk[i % renk.length];
      e.appendChild(p); setTimeout(function (q) { return function () { q.remove(); }; }(p), 1200);
    }
  }

  // atölyedeki değişiklikler eşlikçiye yansır
  document.addEventListener('kanki-degisti', function (v) {
    var s = v.detail || {}; ['renk', 'bas', 'yuz', 'boyun'].forEach(function (k) { if (s[k]) gorunum[k] = s[k]; });
    ruh('mutlu', 1600); hop(); soyle('Yakıştı mı?', 1800, 1);
  });
  document.addEventListener('kanki-kaydedildi', function () { ruh('mutlu', 2400); hop('takla'); soyle('Artık hep böyle gezeceğim!', 3200, 3); });

  // kaydırırken bizimle gelir; hızlı kaydırınca tutunur
  var sonY = scrollY, sonT = performance.now(), durZaman = 0, hizliSon = 0;
  addEventListener('scroll', function () {
    var t = performance.now(), y = scrollY, v = (y - sonY) / Math.max(1, t - sonT);
    sonY = y; sonT = t; uyan();
    e.classList.add('yuruyor'); e.classList.toggle('yukari', v < 0);
    if (Math.abs(v) > 3 && Date.now() - hizliSon > 9000) {
      hizliSon = Date.now(); e.classList.add('tutun'); ruh('saskin', 1400);
      soyle(v > 0 ? 'Hop, yavaş! Ben de geliyorum.' : 'Geri mi dönüyoruz?', 2200, 1);
    }
    clearTimeout(durZaman);
    durZaman = setTimeout(function () { e.classList.remove('yuruyor', 'tutun'); }, 180);
  }, { passive: true });

  // boşta uyur
  var uykuZaman = 0;
  function uykuKur() { clearTimeout(uykuZaman); uykuZaman = setTimeout(function () { uyuyor = true; e.classList.add('uyuyor'); ruh('uyku'); }, 15000); }
  function uyan() {
    if (uyuyor) { uyuyor = false; e.classList.remove('uyuyor'); ruh('saskin', 900); hop(); soyle('Uyumuyordum, sadece gözlerimi dinlendiriyordum.', 2600, 2); }
    uykuKur();
  }
  addEventListener('keydown', uyan);

  // ona dokununca
  var dokunuslar = [];
  var LAF = ['Hihi, gıdıklanıyor.', 'Beni süslemek ister misin? Kanki atölyesi aşağıda.', 'Masada görüşürüz.', 'Kaydırmaya devam, gösterecek çok şey var.', 'Arkadaşlarım da birazdan gelir.'];
  var lafSira = 0;
  kk.addEventListener('click', function () {
    var t = Date.now(); dokunuslar = dokunuslar.filter(function (x) { return t - x < 2200; }); dokunuslar.push(t);
    if (dokunuslar.length >= 5) { dokunuslar = []; ruh('sersem', 2000); hop('takla'); soyle('Başım döndü…', 2200, 2); return; }
    ruh(lafSira % 2 ? 'kirp' : 'mutlu', 1500); hop(); soyle(LAF[lafSira++ % LAF.length], 3000, 2);
  });

  // gizle / geri çağır
  function gizle(g) {
    e.hidden = g; geri.hidden = !g;
    try { if (g) localStorage.setItem(GIZ, '1'); else localStorage.removeItem(GIZ); } catch (x) {}
  }
  e.querySelector('.eslik-gizle').addEventListener('click', function () { gizle(true); geri.focus(); });
  geri.addEventListener('click', function () { gizle(false); ruh('mutlu', 1500); hop(); soyle('Geri geldim!', 2000, 2); });
  var gizli = false; try { gizli = localStorage.getItem(GIZ) === '1'; } catch (x) {}

  ciz(); gizle(gizli); uykuKur(); bak();
})();
