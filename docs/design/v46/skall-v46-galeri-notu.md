# skall v46 galeri ve URL katmanı: eklenenler

## Kaynak

| alan | değer |
|---|---|
| kaynak dosya | skall-masa-deneme-v46.html (repodaki son v46) |
| kaynak sha256 | 1063519b7e116fe2a9039b3746e08b7d8675ed6bd7818c288003f831c477d2d4 |
| kaynak boyut | 1659519 bayt |
| çıktı dosya | skall-masa-deneme-v46-galeri.html |
| çıktı sha256 | d7c487686b8035252c048dd49e381a3d5634a5187b750ca8a795ffc37c6aebd5 |

## Dosyalar

| dosya | içerik |
|---|---|
| skall-masa-deneme-v46-galeri.html | kaynak v46 + iki yeni betik bloğu (galeri, URL parametreleri, animasyonsuz mod) |
| skall-v46-envanter.json | tam envanter (makine için birincil kaynak). Anahtarlar: meta, url_params, ready_flags, states, tokens, type_styles, components, motion, interaction, motion_by_state, findings |
| skall-v46-envanter.md | aynı verinin tablo hali |

## Kaynağa dokunulmadı

| kontrol | sonuç |
|---|---|
| kaynağın 12 style/script bloğu | çıktıda bayt bayt aynı, sıra aynı |
| bloklar dışındaki işaretleme | aynı |
| eklenen statik bloklar | `<script id="v46-arac-bas">`, `<script id="v46-arac">` |
| çalışma anında eklenen stil blokları | yalnız parametre verilince: `#v46-arac-css` (anim=0, demo=0), `#arac-css` ve `#gal-press-css` (page=list, page=galeri) |
| parametresiz açılış | araç katmanı hiçbir şey yapmaz; yalnız 600 ms sonra `html[data-ready="1"]` yazar |

## URL

`?s=<durum>&theme=light|dark&fs=1.3&anim=0&demo=0&seed=<n>&wait=<ms>`

| param | etki |
|---|---|
| s | durumu gerçek tıklamalarla açar (127 durum, envanter `states`); kaynağa kanca eklenmedi, kayıt adımları alan doldurup düğmeye basarak ilerler |
| theme | temayı zorlar, localStorage'a yazmaz (yan yana iki çerçeve birbirini bozmaz) |
| fs | v46'nın yazı büyütme işlevi `window.__fs(k)` |
| anim=0 | CSS animasyon ve geçiş süreleri 0, Element.animate süresi 0, saat durur |
| demo=0 | deneme şeridi gizli |
| seed | Math.random tohumlu, saat 20.10.2026 21:00'dan başlar; `s` verilince varsayılan seed=1 (başlangıç kapsülü de bununla sabitlenir) |
| wait | adımlardan sonra hazır demeden önceki bekleme, varsayılan 900 ms |
| page=list | bütün durumlar, açık ve koyu bağlantılarıyla |
| page=galeri | açık ve koyu yan yana (iki çerçeve) |
| page=galeri&theme=X | tek tema galeri (otomatik görüntü için) |
| page=galeri&theme=X&format=json | galeri ölçüleri `<pre id="spec">` içinde |

## Hazır bayrakları

| bayrak | anlam |
|---|---|
| html[data-ready="1"] | görüntü alınabilir |
| html[data-state] | açılan durum |
| html[data-state-ok="1"] | beklenen sayfa, alt sayfa ve görünür öğe doğrulandı; "0" ise durum bozuk |

Önerilen görüntü komutu: aç, `html[data-ready="1"]` bekle, `data-state-ok` 1 değilse hata say. Sabit görüntü için `anim=0&demo=0`.

## Galeri

| konu | değer |
|---|---|
| bileşen sayısı | 59 (envanter `components`) |
| yöntem | her bileşen kaynağın gerçek bir ekran durumundan kopyalanır, aynı ata sınıf zinciriyle kaynağın kendi CSS'iyle çizilir |
| basılı hal | kaynaktaki :active kuralları çalışma anında .gal-press kopyasına çevrilir |
| yükleniyor hali | gerçek durumdan yakalanır (dokunduktan hemen sonra); gösterge karesi durağan |

## Doğrulama (hepsi bu kaynakla yeniden koşuldu)

| test | sonuç |
|---|---|
| durumlar açılıyor mu, açık tema, 360x740 (127 durum: 84 ana, 43 eski oyun) | 127 durumdan 0 sorunlu (data-state-ok, JS hatası, yatay taşma) |
| aynısı koyu tema | 127 durumdan 0 sorunlu |
| aynısı 320x568, yazı 1,3 | 127 durumdan 0 sorunlu |
| kaynakla piksel eşitliği, açık tema, 84 ana durum, aynı tıklamalar | 84 durumdan 83 tamamen aynı, 0 durumda 50 pikselden büyük fark; en büyük fark 4 piksel (yükleme göstergesi karesi) |
| kaynakla piksel eşitliği, koyu tema | 84 durumdan 77 tamamen aynı, 0 durumda 50 pikselden büyük fark; en büyük fark 33 piksel |
| galeri kopyası ile canlı öğe, 27 stil değeri | light temada 0 fark, dark temada 0 fark |

## Sınırlar

| konu | not |
|---|---|
| rAF yükleme göstergeleri | anim=0 durdurmaz; kare görüntüden görüntüye değişebilir (piksel farkının tek kaynağı) |
| geri sayımlar | yalnız anim=0 ile tamamen sabit |
| eski oyun durumları | `scope: eski_oyun`; uygulamada değişecek, görsel eşitlik dışı |
| yazı tipi | Plus Jakarta Sans Google Fonts'tan; ağ yoksa yedek yazı tipine düşer, görüntüler o makinede farklı olur |
| src_line | kaynağın ana betiğinin (`<script>` bloğu, 1211407. karakter) içindeki satır |
| durum listesindeki tek ek | `profil-yeni-kisi`: kaynaktaki yeni "Yeni kişi" deneme düğmesi |
