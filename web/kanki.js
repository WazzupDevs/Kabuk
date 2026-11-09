/* skall kanki tasarlama: kapsül kanki SVG üreticisi (uygulamadaki kapsül anatomisi: gövde, yan gölge, yüz camı, göz, ağız; süsler yuvalara takılır) */
var KT = (function () {
  var INK = '#16132B';
  var RENK = [
    { id: 'krem', ad: 'Krem', c: '#F2E4C7' }, { id: 'yesil', ad: 'Yeşil', c: '#3DDC84' },
    { id: 'pembe', ad: 'Pembe', c: '#FF7EA8' }, { id: 'kehribar', ad: 'Kehribar', c: '#FFB547' },
    { id: 'teal', ad: 'Turkuaz', c: '#20CDA5' }, { id: 'lavanta', ad: 'Lavanta', c: '#B9A6FF' }
  ];
  var PARCA = {
    goz: [{ id: 'normal', ad: 'Meraklı' }, { id: 'mutlu', ad: 'Mutlu' }, { id: 'goz-kirp', ad: 'Göz kırp' }, { id: 'uykulu', ad: 'Uykulu' }],
    bas: [{ id: 'bos', ad: 'Boş' }, { id: 'fiyonk', ad: 'Fiyonk' }, { id: 'tac', ad: 'Taç' }, { id: 'cicek', ad: 'Çiçek' }, { id: 'hale', ad: 'Hale' }, { id: 'bere', ad: 'Bere' }],
    yuz: [{ id: 'bos', ad: 'Boş' }, { id: 'burun', ad: 'Kırmızı burun' }, { id: 'gozluk', ad: 'Gözlük' }, { id: 'yanak', ad: 'Yanak' }],
    boyun: [{ id: 'bos', ad: 'Boş' }, { id: 'atki', ad: 'Atkı' }, { id: 'papyon', ad: 'Papyon' }, { id: 'kolye', ad: 'Kolye' }]
  };
  var VARSAYILAN = { renk: 'krem', goz: 'normal', bas: 'cicek', yuz: 'yanak', boyun: 'atki' };
  var GOVDE = 'M24 64A36 36 0 0 1 96 64V148Q96 156 88 156H32Q24 156 24 148Z';

  function renk(id) { for (var i = 0; i < RENK.length; i++) if (RENK[i].id === id) return RENK[i].c; return RENK[0].c; }

  // uygulamadaki kapsül anatomisi (Aura Kapsul panosu k-ana): düz renk, kontursuz; yüz camı üstte, sol göz büyük sağ göz küçük, camda küçük x parıltısı
  function goz(t) {
    var s = 'fill="none" stroke="' + INK + '" stroke-width="3.2" stroke-linecap="round"';
    var x = '<path d="M77.2 51.6l3 3M80.2 51.6l-3 3" stroke="#6E6A86" stroke-width="1.5" stroke-linecap="round"/>';
    if (t === 'mutlu') return '<path d="M43 63q7-8 14 0M67.6 63q4-5 8 0" ' + s + '/>' + x;
    if (t === 'uykulu') return '<path d="M43 60q7 6 14 0M67.6 60q4 4 8 0" ' + s + '/>' + x;
    if (t === 'sersem') return '<path d="M45 56l10 10M55 56l-10 10M68 57.4l7 7M75 57.4l-7 7" ' + s + '/>';
    if (t === 'saskin') return '<g class="bakis"><circle cx="50" cy="61" r="9" fill="#fff"/><circle cx="72" cy="61" r="6.4" fill="#fff"/><circle cx="50" cy="61" r="4.6" fill="' + INK + '"/><circle cx="72" cy="61" r="3.2" fill="' + INK + '"/></g>' + x;
    var sag = t === 'goz-kirp' ? '<path d="M68 61.4h8" ' + s + '/>' : '<g class="goz"><circle cx="71.8" cy="61.4" r="3.5" fill="' + INK + '"/></g>';
    return '<g class="bakis"><g class="goz"><circle cx="50" cy="61" r="7.2" fill="' + INK + '"/></g>' + sag + '</g>' + x;
  }
  function agiz(t) {
    var s = 'stroke="' + INK + '" stroke-width="3.2" stroke-linecap="round"';
    if (t === 'o') return '<ellipse cx="60.5" cy="88.4" rx="3.6" ry="4.4" fill="' + INK + '"/>';
    if (t === 'duz') return '<path d="M54 88h13" fill="none" ' + s + '/>';
    if (t === 'kocaman') return '<path d="M50 85q10.5 0 21 0q-2 10-10.5 10t-10.5-10z" fill="' + INK + '" ' + s + ' stroke-linejoin="round"/><path d="M55 91q5.5 3 11 0" fill="none" stroke="#FF7EA8" stroke-width="2.6" stroke-linecap="round"/>';
    if (t === 'dalgali') return '<path d="M50 88q2.6-3 5.2 0t5.2 0 5.2 0 5.2 0" fill="none" ' + s + '/>';
    return '<path d="M51 86q9.5 6 19 0" fill="none" ' + s + '/>';
  }
  function yuz(t) {
    if (t === 'burun') return '<circle cx="60.3" cy="77.6" r="7" fill="#E5452D"/><circle cx="58" cy="75.4" r="2" fill="#FFB9A8"/>';
    if (t === 'gozluk') return '<g fill="rgba(255,255,255,.3)" stroke="' + INK + '" stroke-width="2.4"><circle cx="50" cy="61" r="10.4"/><circle cx="72" cy="61" r="7.6"/></g><path d="M60.4 60q2-1.6 4 0" fill="none" stroke="' + INK + '" stroke-width="2.4"/>';
    if (t === 'yanak') return '<ellipse cx="38" cy="78" rx="5" ry="3" fill="#FF7EA8" opacity=".7"/><ellipse cx="82" cy="78" rx="5" ry="3" fill="#FF7EA8" opacity=".7"/>';
    return '';
  }
  function boyun(t) {
    if (t === 'atki') return '<g clip-path="url(#ID-g)"><path d="M20 93q40 8 80 0v18q-40 8-80 0z" fill="#E5452D"/><path d="M20 98.6q40 8 80 0v3q-40 8-80 0zM20 104.4q40 8 80 0v3q-40 8-80 0z" fill="#2EA35A"/></g><path d="M70 106l12-1.6 4.4 34-11.4 3z" fill="#2EA35A"/>';
    if (t === 'papyon') return '<path d="M60 99l-14-8v16zM60 99l14-8v16z" fill="#FF4F8B"/><rect x="55.4" y="94.4" width="9.2" height="9.2" rx="3.4" fill="#D93A72"/>';
    if (t === 'kolye') return '<path d="M33 92q27 16 54 0" fill="none" stroke="#FFB547" stroke-width="2.8" stroke-linecap="round"/><circle cx="60" cy="101" r="4.8" fill="#20CDA5"/>';
    return '';
  }
  function bas(t) {
    if (t === 'fiyonk') return '<g transform="rotate(14 78 32)"><path d="M78 32l-17-10v20zM78 32l17-10v20z" fill="#FF4F8B"/><circle cx="78" cy="32" r="5" fill="#D93A72"/></g>';
    if (t === 'tac') return '<path d="M38 36l-2-18 12 9 12-14 12 14 12-9-2 18q-22-7-44 0z" fill="#FFB547"/><circle cx="60" cy="24" r="3" fill="#FF4F8B"/><circle cx="44" cy="29" r="2.4" fill="#20CDA5"/><circle cx="76" cy="29" r="2.4" fill="#20CDA5"/>';
    if (t === 'cicek') {
      var c = ['#FF7EA8', '#FFE21E', '#B9A6FF', '#FFB547', '#20CDA5', '#FF7EA8', '#FFE21E'], s = '';
      for (var i = 0; i < 7; i++) { var a = Math.PI * (1.08 - i * 0.16), x = 60 + 37 * Math.cos(a), y = 64 - 37 * Math.sin(a);
        s += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="6.2" fill="' + c[i] + '"/><circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="2.2" fill="#fff"/>'; }
      return s;
    }
    if (t === 'hale') return '<ellipse cx="60" cy="16" rx="27" ry="7" fill="none" stroke="#FFB547" stroke-width="5.4"/><circle cx="96" cy="12" r="2.6" fill="#FFE21E"/><circle cx="25" cy="22" r="2" fill="#FFE21E"/>';
    if (t === 'bere') return '<path d="M22 54A38 38 0 0 1 98 54Z" fill="#20CDA5"/><rect x="20" y="47" width="80" height="9" rx="4.5" fill="#17A98A"/><circle cx="60" cy="22" r="8" fill="#FFF3D6"/>';
    return '';
  }
  // s: seçim, o: {id, vb (viewBox), sinif}
  function svg(s, o) {
    o = o || {}; s = s || VARSAYILAN;
    var id = o.id || 'kt', vb = o.vb || '0 0 120 160';
    var g = '<svg class="kt-svg ' + (o.sinif || '') + '" viewBox="' + vb + '" aria-hidden="true">' +
      '<defs><clipPath id="' + id + '-g"><path d="' + GOVDE + '"/></clipPath></defs><g>' +
      '<path d="' + GOVDE + '" fill="' + renk(s.renk) + '"/>' +
      '<rect x="76" y="0" width="24" height="160" fill="#000" opacity=".11" clip-path="url(#' + id + '-g)"/>' +
      '<rect x="34" y="46" width="51.6" height="28.4" rx="14.2" fill="#E3F1D6"/>' +
      goz(s.goz) + yuz(s.yuz) + agiz(s.agiz) +
      boyun(s.boyun).replace(/ID/g, id) + bas(s.bas) + '</g></svg>';
    return g;
  }
  var KAT = [{ id: 'renk', ad: 'Renk' }, { id: 'goz', ad: 'Göz' }, { id: 'bas', ad: 'Baş' }, { id: 'yuz', ad: 'Yüz' }, { id: 'boyun', ad: 'Boyun' }];
  var KIRP = { renk: '14 8 92 92', goz: '26 30 68 68', bas: '8 0 104 104', yuz: '20 38 80 80', boyun: '14 72 92 92' };
  function kopya(s) { var o = {}; for (var k in s) o[k] = s[k]; return o; }
  // seçili kategorinin seçenek kutuları
  function secenekler(s, kat) {
    var liste = kat === 'renk' ? RENK : PARCA[kat], h = '';
    for (var i = 0; i < liste.length; i++) {
      var p = liste[i], t = kopya(s); t[kat] = p.id;
      var th = kat === 'renk' ? '<span class="th" style="--sw:' + p.c + '">' + svg(t, { id: 'th-' + kat + i, vb: KIRP.renk }) + '</span>'
        : '<span class="th">' + svg(t, { id: 'th-' + kat + i, vb: KIRP[kat] }) + '</span>';
      h += '<button class="kt-sec" type="button" data-k="' + kat + '" data-v="' + p.id + '" aria-pressed="' + (s[kat] === p.id) + '">' + th + '<span class="ad">' + (p.ad) + '</span></button>';
    }
    return h;
  }
  function sekmeler(kat) {
    var h = '';
    for (var i = 0; i < KAT.length; i++) h += '<button class="kt-sekme" type="button" role="tab" data-kat="' + KAT[i].id + '" aria-selected="' + (KAT[i].id === kat) + '">' + KAT[i].ad + '</button>';
    return h;
  }
  return { svg: svg, secenekler: secenekler, sekmeler: sekmeler, KAT: KAT, RENK: RENK, PARCA: PARCA, VARSAYILAN: VARSAYILAN };
})();
if (typeof module !== 'undefined') module.exports = KT;
