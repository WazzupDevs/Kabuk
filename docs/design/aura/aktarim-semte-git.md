# Semte Git ve Geçit · aktarım raporu

Aura tuvali **v146** (sürüm kimliği 1794108682-160c), satır "Semte Git ve Geçit (8 Kas)" y72700. Durum: Gökay onayı bekliyor.
Bu rapor uygulamayı kuran oturum içindir. Yalnız yeni olanı yazar.

## 1. Panolar (hepsi yeni)

| Pano | Yer (x, y) | İçerik |
|---|---|---|
| SemteGitKesfet | 0, 72960 | Keşfet + Semte Git kartı. Açık: check-in var (kart "Şu an buradasın"ın üstünde). Koyu: check-in yok (kart listenin üstünde) |
| SemteGitKonum | 900, 72960 | Semt bulundu, "Semtin: Avcılar" çipi, Devam · açık / koyu |
| SemteGitKonumHal | 1800, 72960 | İzin isteniyor · izin reddedildi (Ayarlara git) · konum alınamadı (Tekrar dene) |
| Gecit | 3130, 72960 | Günün sorusu. Açık: B seçili. Koyu: seçim yok, düğme pasif |
| GecitHal | 4030, 72960 | Gönderiliyor (açık) · hata "Bağlantı yok, tekrar dene" (koyu) |
| GecitAcik | 4930, 72960 | Geçit açıldı! · İçeri gir |
| GecitKapali | 5830, 72960 | Geçit bugün kapalı · doğru cevap · GEÇİT AÇILANA sa:dk:sn · Keşfet'e dön |
| SemtOda | 0, 73924 | Avcılar sohbeti. Açık: Anonim. Koyu: Profilim. Okunmamış çizgisi, Elf set balonu |
| SemtOdaHal | 900, 73924 | Yükleniyor · bağlantı uyarısı + aşağı in (3) · uzun basma menüsü |
| SemtOdaBos | 2230, 73924 | Bugün ilk sen geldin |
| SemtDevam | 3130, 73924 | Devam alt sayfası (açık / koyu) + uygulama kapalıyken bildirim (açık / koyu) |
| SemtDisari | 4460, 73924 | Geçit henüz senin semtinde yok |
| SemtBitti | 5360, 73924 | Oturumun kapandı · Yeniden gir / Keşfet'e dön |
| SemteGitDar | 0, 74888 | 320 dp, yazı 1,3x: Keşfet, Geçit, Geçit kapalı, Oda, Devam, Konum · üst açık, alt koyu |
| GaleriSemteGit | 2200, 74888 | Bütün yeni bileşenler ve küçük hâller · açık / koyu |
| not motionSemteGit | 6730, 72960 | Hareketler (mor not) |

## 2. Yeni ortak bileşenler (`project/semt.css`)

Bu bileşenler yalnız mevcut tokenları kullanır. Ölçüler 2 Kas ölçeğindedir: ana düğme 48, küçük düğme 36, yuvarlak ikon 44, alan 48, çip 36.

- `.sg-card`: Keşfet kartı. Cam yüzey, köşe `--r-lg` 22, iç boşluk 16, aralık 14.
  - Üst etiket `.sg-eb`: açıkta `--primary-pressed` #0A7139, koyuda `--accent` #3DDC84.
  - Kapı görseli `.sg-door`: 72×86, köşe 16.
  - Düğme `.btn.primary.sm` (36).
  - Süre satırı `.sg-meta`: 13/17, 600, saat ikonu 16.
- `.note`: soru kâğıdı. İki temada aynı kâğıt kullanılır.
  - Zemin #FBF6E4, yazı #1B1A14. Köşe 6, iç boşluk 18/18/16, döndürme −1,2°.
  - Gölge açıkta 0 10 20 rgba(3,27,11,.16). Koyuda gölge yok, 1 px rgba(255,255,255,.06) çizgi var.
  - Raptiye: 16 px, #E8457A, üst −8.
  - Etiket `.nl` 12/16, 700, harf aralığı .6, #B0124F (kâğıtta 6:1). Soru `.nq` 21/27, 600, en çok 3 satır.
  - Kâğıt sahnenin alt kenarına 56 dp biner (kapıya iğneli görünür).
- `.tk`: bilet. Bileşen `.tks` içinde 2 sütundur, aralık 10.
  - En az 56 yükseklik, köşe 12. Sol koçan 44 genişlikte, 2 px kesik çizgi var. Koçan çizgisi hizasında 6 px yarıçaplı üst ve alt çentikler (mask) bulunur.
  - Normal: `--surface`, iç çizgi 1 px rgba(3,27,11,.12).
  - Seçili `.on`: açıkta `--success-soft` + 2 px `--primary`. Koyuda rgba(61,220,132,.14) + 2 px `--accent`.
  - Gönderilirken bütün biletler `disabled` olur. Seçili olan kalır, diğerlerinin yazısı `--muted` olur.
  - Rol: `radiogroup`/`radio`.
- `.spin`: bekleyen düğme halkası. 20 px, yazı aynı kalır, `aria-busy="true"` taşır. "Geçide söyle", "Devam" (izin beklerken) ve "Semtin bulunuyor" çipinde kullanılır.
- `.tchip`: kalan süre çipi. Cam yüzey, 36 yükseklik, 13/17, saat ikonu 16. Odada üst çubuğun altında, y132'de ortalanır.
- `.cd`: geri sayım kartı. Cam yüzey, köşe 22, iç boşluk 16. Etiket "GEÇİT AÇILANA" eyebrow. Sayı 30/34, 800, `tabular-nums`, `role="timer"`.
- `.wrow`: uyarı satırı. Köşe 16, 10/14 iç boşluk, 13/18 600.
  - Bağlantı uyarısı: `--warn-soft`/`--on-warn-soft`.
  - `.err` (hata): `--danger-soft`/`--on-danger-soft`.
  - Satır her zaman akışta, düğmenin üstünde durur ve hiçbir düğmeye binmez.
- `.prog`: Devam süre çubuğu. 6 yükseklik, iz `--track`, dolgu açıkta `--primary`, koyuda `--accent`.
- `.idst`: kimlik şeridi. Cam, köşe 22.
  - Sol: 30 px kapsül + "Kapsülünle yazıyorsun" (Profilim seçiliyken fotoğraf/harf + "Profilinle yazıyorsun").
  - Sağ: `.seg` (Anonim | Profilim), her bölüm 36 yükseklik.
  - 320 dp'de seçici alt satıra kayar (flex-wrap). Metin kesilmez.
- `.sk`: iskelet. Açıkta `--soft-bg`, koyuda #1B211F.
- `.godown`: aşağı in. Yuvarlak 44 + rozet 20 (`.badge`).
- `.foot`: sabit alt alan. Sol ve sağ 20, alt 46, düğmeler arası 8.
- `.scn`: riso sahne. Genişlik %100, oran 350:240 (`.s230` 350:230, `.s250` 350:250), köşe 28. Açıkta gölge 0 10 22 rgba(3,27,11,.10), koyuda gölge yok.

Sohbet panoları MekanSohbeti sınıflarını aynen kullanır: duvar kâğıdı, bant, `.hdr`, `.stream`, `.cmp`, balonlar. Uzun basma menüsü SohbetTepki tepki çubuğunu aynen kullanır. Elf set balonu BalonElf `.e2` stilini aynen kullanır.

## 3. Ekranlar: kabul maddeleri

**SemteGitKesfet**
- K1. Check-in varsa kart, çiplerin altında ve "Şu an buradasın"ın üstündedir. Check-in yoksa çiplerin altında ve listenin hemen üstündedir. Aralık 12.
- K2. Kart dört hâlde gösterilir (GaleriSemteGit):
  - Soru bekliyor: [Semte Git].
  - Bugün kapalı: kilitli kapı + "Açılmasına 7 sa 42 dk".
  - Odadasın: "1 sa 12 dk kaldı" + [Odaya dön].
  - Semt dışı: düğme yok.
- K3. Kartın yükleniyor (iskelet) ve hata ([Tekrar dene] küçük yumuşak düğme) hâlleri vardır.

**SemteGitKonum**
- K4. Bu ekran yalnız ilk seferde açılır. Sayfa sabittir, sahne 350×230'dur.
- K5. "Semtin: Avcılar" 36'lık bir çiptir. İçinde kapsül iğne ikonu vardır, emoji yoktur. Devam düğmesi sabit alt alandadır.
- K6. Hâller:
  - İzin isteniyor: çip "Semtin bulunuyor" + halka, Devam pasif ve bekliyor.
  - İzin reddedildi: `.wrow.err` + [Ayarlara git].
  - Konum alınamadı: `.wrow` + [Tekrar dene].

**Gecit**
- K7. Üst çubuk (geri 44) içerikle kaymaz. Sahne 350×240, üstünde soru kâğıdı, altında 2×2 bilet bulunur.
- K8. Seçmek göndermez. Seçim yokken [Geçide söyle] pasiftir (`--disabled`).
- K9. Gönderilirken düğmede halka döner ve biletler kilitlidir. Hata satırı düğmenin üstünde akışta durur, seçim korunur.
- K10. 320 dp + 1,3x'te soru 3 satır olur. Biletler, kâğıt ve düğme kaydırmadan aynı anda görünür (SemteGitDar).

**GecitAcik / GecitKapali / SemtDisari / SemtBitti**
- K11. Sağ üstte Kapat (44) bulunur. Sahne 350×240 (SemtDisari'de 350×250), başlık `display` 32/42 ortalı, metin `body`. Düğmeler sabit alt alandadır.
- K12. GecitKapali geri sayımı sa:dk:sn biçimindedir, saniyede bir güncellenir ve İstanbul saatiyle 00:00'a sayar.
- K13. SemtBitti'de iki düğme alt alta durur: [Yeniden gir] ana, [Keşfet'e dön] yumuşak.

**SemtOda**
- K14. Üst çubukta geri, "Avcılar sohbeti" ve menü (⋯) vardır. Kişi sayısı, avatar yığını, çevrimiçi noktası ya da son yazanlar şeridi yoktur.
- K15. Kalan süre çipi üst çubuğun altında sabittir. Mesaj akışı çipin altından başlar (top 176).
- K16. Balonlar mekân sohbetiyle aynıdır:
  - Anonim kişi kapsül + kapsul-xxxx ile görünür.
  - Profilli kişi fotoğraf/harf + ad ile görünür.
  - Set balonu (Elf) aynen çalışır.
- K17. Okunmamış mesajlar çizgisi mekân sohbetindeki "Yeni mesaj" çizgisinin stilindedir. Metni "Okunmamış mesajlar"dır (taslak).
- K18. Uzun basma: tepki çubuğu + Yanıtla, Bildir (tehlike rengi), Sessize al, Arkadaşlık isteği.
- K19. Hâller:
  - Yükleniyor: iskelet balonlar.
  - Bağlantı uyarısı: `.wrow` çipin altında.
  - Aşağı in: 44 + rozet, yazma alanının 12 üstünde.

**SemtOdaBos**
- K20. Bank sahnesi 350×230 olur. Başlık `title` 21/27, metin `body`.

**SemtDevam**
- K21. Alt sayfada süre çubuğu ve kalan süre metni bulunur. Düğmeler 390 dp'de de alt alta durur, çünkü "Evet, 2 saat daha" yan yana sığmaz: önce ana [Evet, 2 saat daha], sonra yumuşak [Hayır, çık].
- K22. Alt sayfa dışarı dokununca ve geri tuşuyla kapanır.
- K23. Uygulama kapalıyken gelen bildirimin metni brief'teki gibidir.

## 4. Hâller tablosu

| Ekran | Yükleniyor | Boş | Hata | Ayrı pano |
|---|---|---|---|---|
| Keşfet kartı | iskelet kart (Galeri) | yok (kart gizlenmez, semt dışı hâli var) | "Geçit şu an yüklenemedi" + Tekrar dene (Galeri) | SemteGitKesfet |
| Konum | Semtin bulunuyor | yok | izin reddedildi, alınamadı | SemteGitKonumHal |
| Geçit | soru kâğıdı iskeleti (Galeri) | yok | soru yüklenemedi (Galeri); gönderme hatası | GecitHal |
| Oda | iskelet balonlar | SemtOdaBos | bağlantı uyarısı | SemtOdaHal |
| Devam, Açık, Kapalı, Dışarı, Bitti | yok | yok | yok | yok |

Koyu tema her panoda sağ telefondur. 320 dp + 1,3x için bkz. SemteGitDar.

## 5. Riso görseller

Bütün görseller 3x webp'tir: `/mnt/project-files/semte-git/riso/`.

Mürekkepler brief'teki gibidir:
- pembe #E8457A, turkuaz #2BB39A, sarı #F2C230, siyah #16141C;
- kâğıt #E3EFD9.

Yöntem riso-bos ailesiyle aynıdır:
- yarım ton açıları 15/75/0/45°;
- mürekkep kayması 3x'te ±3 px;
- gren ve kâğıt lifi.

Kankiler riso-bos `kk()` çizimidir.

| Dosya | dp | Kullanım |
|---|---|---|
| gecit-kapali.webp | 350×240 | Gecit, GecitHal, SemtBitti |
| gecit-acik.webp | 350×240 | GecitAcik (hareketi azalt için son kare) |
| gecit-kilitli.webp | 350×240 | GecitKapali (hareketi azalt için durağan) |
| harita-anten-kanki.webp | 350×230 | SemteGitKonum |
| bank-kanki.webp | 350×230 | SemtOdaBos |
| yol-tabelasi-valizli-kanki.webp | 350×250 | SemtDisari |
| kesfet-kucuk-kapi.webp, kesfet-kucuk-kapi-kilitli.webp | 88×104 (72×86 gösterilir) | Keşfet kartı |
| uzgun-kanki.webp (saydam) | 39×64 | Yeni kanki hâli: gözler kapalı, iç kaşlar kalkık, ağız aşağı, yanakta turkuaz damla |

Hareket katmanları `riso/katman/` klasöründedir. Saydam olanlar kırpılmıştır. Konumlar 350×240 sahne dp'siyle verilir:
- gecit-acik-zemin: ışıksız kapı boşluğu.
- gecit-acik-isik: kapı boşluğu + yere vuran ışık.
- gecit-kanat-kapali: kapı boşluğu x119–231, y54–204.
- gecit-acik-kanat: açık kanadın son hâli.
- gecit-kanki-1..3: merkezler (147,172), (179,166), (205,176), 22×44.
- gecit-kilitli-zemin.
- gecit-kilit: merkez (175,140).
- gecit-damla: buluttan 4 damla, (230..260, 138..152).
- bank-kanki-zemin.
- bank-nokta: (176,66), (190,66), (204,66), r 3,8.

Üretici kaynak `/mnt/project-files/semte-git/kaynak/` klasöründedir:
- `node run.js [ad]` → out/*.png;
- riso2.py;
- `gen.py` panoları üretir.

## 6. Hareketler

Değerler `hareket.json` → `semteGit` alanında ve tuvaldeki mor not motionSemteGit'tedir.
- Geçit açılışı toplam 880 ms sürer:
  - kanat rotateY 0→−78°, 0–420 ms, arrive;
  - ışık 120–520 ms;
  - kankiler 360/440/520 ms'de pop yayıyla gelir.
- Kapalı ekranda iki yavaş döngü vardır:
  - kilit ±4°, 1.600 ms;
  - damlalar 18 dp, 1.200 ms, 300 ms arayla.
- Boş oda: üç nokta 1.200 ms döngüyle, 200 ms arayla yanıp söner.
- Bekleyen düğme halkası turunu 800 ms'de tamamlar.
- Devam çubuğu 600 sn'de doğrusal azalır.
- Keşfet kartından Geçit ekranına geçiş morph yayıyla yapılır.
- Hareketi azalt açıkken hepsi durağandır ve tam riso görsel gösterilir.
- Yeni titreşim eklenmez.

## 7. Sınır dışı istek

Yok. Tüm hareketler konum, döndürme, ölçek ve opaklıktır; yeni efekt türü yoktur.

## 8. Açık sorular ve taslaklar

1. Örnek soru ve seçenekler taslaktır: "Bir koşuda ikinciyi geçtin. Şimdi kaçıncısın?" ve A Birinci, B İkinci, C Üçüncü, D Sonuncu. Gerçek soru havuzu ürün kararıdır.
2. Brief'te olmayan, taslak yazılmış metinler şunlar:
   - kart kapalı: "Yarın yeni soru gelir.", "Açılmasına …";
   - kart odadasın: "Avcılar sohbetindesin";
   - "Semtin bulunuyor";
   - "Konum izni kapalı. Semtini bulmak için izin ver.";
   - "Konum alınamadı.";
   - "Bağlantı koptu. Yeniden bağlanıyor…";
   - "Okunmamış mesajlar";
   - "Geçit şu an yüklenemedi";
   - "Soru yüklenemedi.";
   - "Profilinle yazıyorsun";
   - Geçit üst çubuğu "Avcılar · Günün sorusu".
3. Devam sayfası dışarı dokunuşla kapanırsa ne olur: cevap verilmemiş sayılıp 10 dk dolunca mı kapanır? Tuvaldeki notta bu varsayıldı, karar bekliyor.
4. SemtBitti'de [Yeniden gir] o gün sorusuz girer. Bunun yeni 2 saat başlattığı varsayıldı.

## 9. Proje sahibinin kararları (8 Kasım) — raporun önüne geçer

- §8.3: Devam sayfası dışarı dokunuşla kapanırsa cevap sayılmaz; odadaki kalan süre çipi "Devam?" olur, dokununca sayfa yeniden açılır; 10 dk dolunca oturum kapanır.
- §8.4: [Yeniden gir] sorusuz girer ve yeni 2 saat başlatır.
- GecitKapali: doğru cevap gösterilmez (hiçbir telefona gitmez). Onun yerine "Kankin seninle gurur duyuyor." yazar.
- GecitKapali geri sayım etiketi "GEÇİDİN AÇILMASINA".
- SemteGitKonum metni "bir kez" demez: "Konumun yalnızca hangi semtte olduğunu bulmak için alınır. Konumun saklanmaz, yalnızca semtin kaydedilir." Konum uygulamanın her açılışında bir kez alınır (yalnız daha önce izin vermiş kişide; açılışta izin sorulmaz).
- Ortak sınıra 500 m'den yakın olana iki semt sunulur ("Semtini seç": iki çip, SemteGitKonum'un bir hâli olarak, mevcut bileşenlerle).
- §8.2'deki taslak metinler onaylandı; bağlantı uyarısı mekan sohbetindeki metni kullanır.
- Ürün metni ve davranış: `docs/SPEC_V4.md` §4.V.
