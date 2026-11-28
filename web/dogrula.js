/* Formların ortak parçası: Cloudflare Turnstile ve sunucuya gönderme (docs/decisions/skall-world-formlar.md).
   Site anahtarı /api/ayar'dan gelir; Turnstile betiği yalnızca formu olan sayfada, form görününce yüklenir. */
(function () {
  var ayarSozu = null, betikSozu = null;

  function ayar() {
    if (!ayarSozu) {
      ayarSozu = fetch('/api/ayar').then(function (r) {
        if (!r.ok) throw new Error('ayar');
        return r.json();
      });
      ayarSozu.catch(function () { ayarSozu = null; });
    }
    return ayarSozu;
  }

  function betik() {
    if (window.turnstile) return Promise.resolve();
    if (!betikSozu) {
      betikSozu = new Promise(function (coz, red) {
        var s = document.createElement('script');
        s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        s.async = true;
        s.onload = function () { coz(); };
        s.onerror = function () { betikSozu = null; red(new Error('betik')); };
        document.head.appendChild(s);
      });
    }
    return betikSozu;
  }

  // kutu: Turnstile'ın çizileceği öğe; eylem: sunucunun beklediği ad (vote, school, venue).
  window.skallDogrula = function (kutu, eylem) {
    var jeton = null, bekleyen = [], kimlik = null, hazir = null;

    function kur() {
      if (!hazir) {
        hazir = ayar().then(function (a) {
          if (!a.turnstileSiteKey) throw new Error('kapali');
          return betik().then(function () {
            kimlik = window.turnstile.render(kutu, {
              sitekey: a.turnstileSiteKey,
              action: eylem,
              appearance: 'interaction-only',
              language: 'tr',
              theme: document.documentElement.getAttribute('data-theme') || 'auto',
              callback: function (t) { jeton = t; bekleyen.splice(0).forEach(function (f) { f(t); }); },
              'expired-callback': function () { jeton = null; },
              'error-callback': function () { jeton = null; }
            });
          });
        });
        hazir.catch(function () { hazir = null; });
      }
      return hazir;
    }

    // Form görüş alanına girince hazırlanır: gönderirken beklenmez.
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (g) {
        if (g.some(function (x) { return x.isIntersecting; })) { io.disconnect(); kur(); }
      }, { rootMargin: '400px' });
      io.observe(kutu);
    } else { kur(); }

    function al() {
      return kur().then(function () {
        if (jeton) return jeton;
        return new Promise(function (coz, red) {
          bekleyen.push(coz);
          setTimeout(function () { red(new Error('zaman')); }, 30000);
        });
      });
    }

    function sifirla() {
      jeton = null;
      if (kimlik !== null && window.turnstile) window.turnstile.reset(kimlik);
    }

    // POST + JSON; yanıt { durum, govde }. Ağ hatasında durum 0.
    function gonder(yol, veri) {
      return al().then(function (t) {
        veri.token = t;
        return fetch(yol, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(veri) });
      }).then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (g) { return { durum: r.status, govde: g }; });
      }, function (e) {
        return { durum: 0, govde: { error: { code: e && e.message === 'kapali' ? 'closed' : 'network' } } };
      }).then(function (s) { sifirla(); return s; });
    }

    return { gonder: gonder };
  };

  // Tarayıcının kendine ürettiği rastgele cihaz anahtarı (yalnız tek oy için; kişiyi tanımlamaz).
  window.skallCihaz = function () {
    var k = 'skall-cihaz', v = null;
    try { v = localStorage.getItem(k); } catch (e) {}
    if (!v || !/^[0-9a-f-]{36}$/i.test(v)) {
      v = (crypto.randomUUID ? crypto.randomUUID() : '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, function (c) {
        return (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16);
      }));
      try { localStorage.setItem(k, v); } catch (e) {}
    }
    return v;
  };
})();
