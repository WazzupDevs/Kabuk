# Aktarım raporu: Grup 1 · Check-in

31 Eki 2026 · Aura tuvali sürüm 37 · Gökay onayladı (31 Ekim 05:26). Okuyan: uygulamayı kuran oturum.

Tuval: https://claude.ai/artifact/Fcdza7SJs4i7xyYQJnhRVe · Kararlar `docs/decisions/aura-31.md` ile birlikte okunur; oradaki kararların hiçbiri değişmedi. Mekan ve lobi panoları bu turda değişmedi.

## 1. Panolar

**Değişen:** Check-in (`project/CheckIn.dc.html`). Kankiler artık sheet kenarının üstünde kesiliyor, sheet altta duruyor ve içeriği kadar uzuyor. Sheet metni uygulamanın onaylı rıza metni (`tr.checkin.locationBody`); yeni metin yok.

**Yeni (satır "Check-in: hâller"):**

- Check-in: nokta seçimi (`CheckInNokta`), açık tema. "Neredesin?" satırları, nokta seçilmedi, düğme pasif.
- Check-in: yükleniyor (`CheckInYukleniyor`), koyu tema. "Konum alınıyor…" ve yükleyici.
- Check-in: izin reddi (`CheckInIzin`), açık tema. Uyarı kartı ve "Ayarları aç".
- Check-in: mekân sınırı dışında (`CheckInDisarida`), koyu tema.
- Check-in: 320 dp, en büyük yazı (`CheckInDar`), 320 genişlik, yazı 1,3 kat (`maxFontSizeMultiplier`), izin reddi. En uzun hâl: sheet ekranın %90 sınırında, üst içerik kayar, düğmeler sabit.

**Yeni (satır "Galeri"):** Galeri: Check-in düğmesi ve uyarılar (`GaleriCheckIn`), açık ve koyu yan yana. Düğmenin üç hâli, yedi uyarı kartı, nokta satırı.

## 2. Yeni ve değişen bileşenler

**Sheet yerleşimi: kaydırılabilir üst içerik, sabit alt düğmeler** (RouteSheet, `checkin/index.tsx`)

- Sheet iki bölgedir. Üstte kaydırılabilir içerik: tutamağın altında mekân adı, rıza metni, varsa "Neredesin?" ve nokta satırları, varsa uyarı kartı. Altta sabit düğme alanı: koşullu "Ayarları aç", "Konumumu kullan", "Vazgeç".
- Sheet içeriği kadar uzar, en çok ekranın %90'ı. İçerik sığıyorsa kaydırma yoktur.
- İçerik sığmıyorsa yalnızca üst bölge dikey kayar ve başından başlar. Bölgenin alt kenarı düz kesilir; solma ya da renkli örtü yoktur. Kaydırma native, gösterge platformun kendi göstergesi.
- Düğmeler kaydırma boyunca yerinde kalır, içerikle üst üste binmez. İçerik ile düğme alanı arası 18 (sheet aralığı 14 + 4).
- Sheet overflow kırpması (cam, köşe 36) korunur; çözüm kaydırılabilir bölgedir.
- Ölçüler: köşe 36, iç boşluk 12 / 20 / 22, bloklar arası 14, düğme 58 yükseklik ve 10 aralık. Başlık 23/29, gövde 15/22; 1,3 katta 30/38 ve 20/29.
- 320 dp / 1,3 kat ölçümü (tarayıcıda): sheet ekranın %88,9'u; üst bölge 481 görünür, 562 içerik; düğmelerin yeri kaydırmadan önce ve sonra aynı.

**Kankiler** (`aura/Peek`)

- Yalnızca sheet'in üst kenarının üstünde görünür, kenarda kesilir; başlık ve metnin üstüne hiçbir hâlde binmez.
- 350 genişlikte yerleşir (x 26 / 146 / 260, üst 0 / −14 / 4, boy 110) ve sheet genişliğine oranla ölçeklenir. Şerit yüksekliği 58 × (sheet genişliği / 350).
- Sheet uzayınca kenarla birlikte yükselir; en yüksek boyuna (%90) ulaşınca gösterilmez. Koyu temada aynı yerleşim.

**Check-in düğmesi**

| Hâl | Görünüş | Ne zaman |
| --- | --- | --- |
| Boşta | konum ikonu + "Konumumu kullan" | açılışta ve her hatadan sonra |
| Yükleniyor | Loader "meet" + "Konum alınıyor…" | izin verildikten sonra konum alınırken ve sunucu doğrularken: tek, kesintisiz hâl |
| Pasif | opaklık 0.45 | noktalı mekânda nokta seçilene kadar |
| Başarı | yükleniyor hâlinde kalır | sunucu onayında sheet iner, Mekân açılır |

Düğmenin boyu ve yeri hâller arasında değişmez; yazı tek satırdır. Başarıda düğme boşta hâline dönmez (K4).

**Uyarı kartı** (renkler ve metinler değişmedi): izin reddi (danger, "Konum izni yok", `checkin.permissionDenied`, altta "Ayarları aç"), konum alınamadı (danger, `checkin.locationFailed`), kampüs / mekân sınırı dışında (warn, `checkin.outsideBoundary`), çok uzakta (warn, `errors.too_far`), sunucu hatası (danger), başka mekândan çıkış (warn, `checkin.replaces`). Uyarı yalnızca koşulu varken, üst bölgede çizilir; yeni denemede kaybolur.

**Nokta seçimi** (değişmedi; SpotPicker). Nokta seçilene kadar "Konumumu kullan" pasiftir.

**Başarılı giriş (K4):** başarı ekranı, bekleme ya da boşta hâline dönüş yoktur. Sheet iner, aynı anda Mekân açılır (bugünkü geçiş).

## 3. Hareketler

| # | Tetik | Süre ve eğri | Reduced Motion |
| --- | --- | --- | --- |
| 1 | giriş | 320 ms ease-out; kankiler pop (260 / 17), 80 ms arayla | anında, kankiler durgun |
| 2 | Vazgeç, perde, aşağı çekme, geri tuşu | 320 ms, aynı eğri | anında |
| 3 | izin sonrası "Konumumu kullan" | press (500 / 22); ikon ve yazı swap 200 ms | anında |
| 4 | izin reddi, konum alınamadı, sınır dışı, çok uzak, sunucu hatası | düğme swap 200 ms; sheet swap 300 ms; kart dissolve 450 ms arrive, 70 ms sonra | anında |
| 5 | yeni deneme | kart 220 ms leave; sheet swap 300 ms | anında |
| 6 | sunucu onayı | 320 ms; düğme yükleniyor hâlinde kalır, ara ekran yok | Mekân anında |
| 7 | nokta satırı | press; işaret pop; düğme swap 200 ms | anında |

Kaydırma native ve yalnızca içerik sığmadığında. Sheet %90'a ulaşırsa uzama durur, içerik kayar, kankiler gizlenir. Titreşim anı tanımlanmadı.

## 4. Açık sorular

- Titreşim anları (genel karar açık).
- Kaydırılabilir bölgenin ek görsel ipucu: yalnızca platformun göstergesi; ek ipucu ayrı karar ister.
