# skall arayüz denemesi: devir raporu (v46)

Bu rapor yalnızca v45'ten farkları yazar. v45 ve v44 raporlarında burada geçmeyen her şey geçerli.

- **Dosya:** `skall-masa-deneme-v46.html`. Tek dosya, kendi başına çalışır (1,66 MB; masa simgeleri içinde).
- **Taban:** `docs/design/v45/skall-masa-deneme-v45.html` (bayt bayt aynı dosya).
- **Kaynak:** Fırat'ın oturumunun "v44" adıyla ürettiği paket (`skall-v44-devir.zip`, `skall-masa-deneme-v44.html`, raporu). Bu, resmi v44 değil; yalnızca istenen sekiz madde alındı (bölüm 1–8).
- **Ek:** `skall-v46-simgeler-kapsul.zip` içinde:
  - `masa-simgeleri/webp-256/`: 100 simge;
  - `masa-simgeleri/masa-simgeleri.json`;
  - `kapsul/kapsul-katalogu.json`: çıkan parçalar silinmiş, raflar yeniden adlandırılmış; 28 hazır görünüş (`hazir_gorunusler`, bölüm 2);
  - `kapsul/kapsul-cizim-kutuphanesi.js`: denemedeki çizim kodu, aynı düzenlemelerle.
- **Koda ve repoya dokunulmadı.** SPEC_V4'ün v45'ten sonra eklenen kararları (K-26–K-36) bu denemeye işlenmedi.

**v45'ten değişmeyenler:**
- v45'in altı stil bloğu bayt bayt aynı.
- Yeni kurallar üç yeni blokta (`v46`, `v46-dark-auto`, `v46-dark`), simge görselleri ayrı bir blokta (`data-ticons`).
- Diğer ekranlar v45'teki gibi. Betikte değişen yerler:
  - Masa kur;
  - kendi masan kartı ve masa ekranının üst satırı;
  - katılma isteği ve Masadakiler;
  - Profil;
  - Masa bitti;
  - bildirim ayarları;
  - Görünüm;
  - doğum tarihi adımı;
  - beş oyun ekranının 12 kişi düzeni.

**Alınmayanlar** (Fırat'ın paketinde var, v46'da yok):
- Koyu paleti (`#110E1F` ve diğerleri): v45'in koyu paleti aynen kaldı; yeni ekranların koyu hâli v45 paletiyle çizildi.
- Kayıt ekranları ve metinleri ("Telefonla devam et", "Hazırsın" ekranı, 45 sn sayaç, bilgi satırları): v45'in kayıt akışı aynen; yalnızca bölüm 6 eklendi.
- Anonim anahtar hakkı: hak 1 ve "hakkın bu check-in'de biter" kaldı (hak 2 alınmadı).
- Davette yalnızca aynı mekandaki arkadaşlar: alınmadı. K-2 geçerli; davet ekranı v45'teki gibi.
- Keşfet'te şehir ve semt seçimi.
- Eski oyun adları ve renkleri. Oyun "Kapsül Anlat", rakip düğmesi "Yasak!".

**Deneme şeridine eklenenler:**
- "Kapsül: Süsle": süsleme ekranını açar.
- "Süsle, ilk açılış": "Kafama dokun" ipucunu sıfırlayıp açar.
- "Yeni kişi": yeni kaydolmuş biri gibi yeni anonim ad ve 28 hazır görünüşten başka bir kapsül; profili açar. Arka arkaya basınca farklı kişiler görünür.

---

## 1. Masa simgeleri

- **Sahneler:** 20 temada 100 sahne. Görseller zip'teki 256 px WebP'ler; sayfaya gömülü, ayrı stil bloğunda bir kez tanımlı.
- **Biçim:** köşeleri yuvarlatılmış kare, yarıçap her boyda kenarın %28'i. Fırat'ın dosyasında 80 px'te 17 px, 72 px'te 24 px idi; v46'da hepsi %28. İnsanlar yuvarlak kalır.

| Yer | Boyut |
| --- | --- |
| Açık masalar (lobi) ve süren masalar | 80 px |
| Kendi masan kartı (Mekan) | 72 px |
| Masa kur, ad satırı (kalem işaretli düğme) | 52 px |
| Masa ekranının üst satırı (masa adının solu; v45'teki harfli yuvarlağın yerine) | 36 px |
| Katılma isteği satırı (masa isterse) | 40 px. Köşede isteyenin avatarı (22 px), v45'teki gibi profilliyse fotoğrafı |
| Masadakiler, gelen masa satırı | 36 px. Satırda "Atak Tilki, 3 kişi" ve "Geliyor" |

- **Masa kur:**
  - Simgeye dokununca seçici açılır. Üstte kayan tema sekmeleri, altta temanın beş sahnesi beş sütunda.
  - Mekandaki başka bir masada kullanılan sahne soluk görünür ve seçilemez; ekran okuyucu ", başka bir masada" der.
  - Masa kurulurken boştaki sahnelerden biri rastgele gelir. Simge masanın adından türetilmez; "Başka ad" simgeyi değiştirmez.
- **Gelen masa:**
  - Kabul edilen masa, telefonları katılana kadar Masadakiler'de simgesiyle "Geliyor" olarak durur.
  - Masa ekranının üst satırı "6 kişi · 3 geliyor" yazar.
  - v45'te gelen kişiler hemen sayıya ekleniyordu.
  - 12 sınırı gelenleri de sayar.

## 2. Kapsül süsleme ve profil

**Kendi profilin:**
- Fotoğrafın ve kapsülün yan yana.
- Masada hangisi görünüyorsa altında "Masada görünen" yazar:
  - kadın anonimken kapsül, profilliyken fotoğraf;
  - erkek ve belirtmeyende fotoğraf "Masada görünen", kapsül "Mekan sohbetinde".
- Kapsülün sağ altında süsleme düğmesi var: renk halkalı; görünür 36 px, dokunma alanı 44 px.
  - Profil açılınca iki kez oynar (sallanma, halka dönüşü, parıltı) ve durur; hepsi 3,1 sn'de biter.
  - Hareket azaltma açıkken hiç oynamaz.
- "Anonim adın" kartı kapsülsüz: yalnızca ad ve açıklama. Kapsül profilde yalnızca ikilide görünür.

**Başkasının profili:**
- Kişinin kapsülü hiçbir ekranda görünmez. İkili ve süsleme düğmesi yalnızca kendi profilinde.
- Avatar fotoğraftır ya da v45'teki gibi fotoğrafı kaldırılmış profilin genel soluk silüetidir.
- Anonim kişinin profili zaten açılmaz.
- Kod, anonim bir adla açılan profilde bile kapsül göstermez.

**Süsleme ekranı (Fırat'ın ekranı):**
- Profildeki düğmeden açılır: kapsülün renginde daire ekranı kaplar, kapsül büyük dairedeki yerine uçar.
- Takılı parçalar çip olarak görünür.
- Raf ve yuva sekmeleri (Renk, Göz, Baş, Yüz, Ağız, Boyun) üstte yapışık kalır. Kaydırınca üst çubukta küçük kapsül belirir.
- Paketler "Paketi tak" ile takılır. Karıştır, Hepsini çıkar, Kaydet.
- Kaydetmeden çıkınca "Değişiklikler kaydedilmedi" alt sayfası açılır.
- **Duygular:** kafaya dokununca sıradaki duygu gelir (Mutlu, Şaşkın, Aşık, Kahkaha, Utangaç, Üzgün, Kızgın, Uykulu). Kaydedilmez, kimseye gitmez.
- Hareket azaltma açıkken animasyon yok.

**Fırat'ın ekranından farklar:**

| Konu | Fırat | v46 |
| --- | --- | --- |
| Raf adları | Kadın, Erkek, Düz | **Şık, Karakter, Tema**. Kimlikler `stil`, `karakter`, `tema`; katalogda ve çizim kodunda da |
| Parçalar | 175 | **173**: "Yıldız bıçak" (Ninja) ve "Fes" (Bizden) çıktı. Ninja paketinde 3, Bizden'de 5 parça kaldı. Kalp, hayvan kulakları, nazar, çay, simit ve mevsim paketleri kaldı |
| Başlangıç görünüşü | Sabit (pembe gövde, koyu vizör, kulaklık) | **28 hazır görünüşten rastgele biri**, kayıtta atanır. Cinsiyetten türetilmez, cinsiyet değişince değişmez |
| Süsleme düğmesi | Sürekli: dönen halka, parıltı, 7 sn'de bir sallanma | Profil açılınca iki kez oynar ve durur; hareket azaltmada hiç |
| "Kafama dokun" ipucu | Her oturumda bir kez | Yalnızca ilk açılışta. Telefonda saklanır; denemede tarayıcıda |
| Koyu tema | Fırat'ın paleti | v45 paleti (zemin `#0D0B1E`, kart `#1C1838`, dolgu `#262148`, çizgi `#3A3563`, seçili `#8F78FF`) |

**28 hazır görünüş:**
- v45'in 28 kapsülüdür, süsleme parçalarıyla kurulur. Kişi süsleme ekranında bunlardan başlar; her parçasını değiştirebilir.
- Kodlar katalogda (`hazir_gorunusler`, ör. "Kaptan" `c:pembe e:klasik h:korsan f:gozbandi`).
- Çoğu v45'teki kapsülle aynı görünür. Üçü biraz farklı (açık soru 2):
  - **Melek ve Tavşan:** beyaz gövde yerine kütüphanedeki en açık renk Krem; Krem'in zemini koyu mor.
  - **Viking:** kütüphanede miğfer yok; boynuz ve sakal.

**v45'te değişen:**
- "Nick'i yenile" artık kapsülü değiştirmez, çünkü kapsülü kişi süslüyor. Metin "Yenilersen yeni bir ad ve kapsül alırsın." yerine "Yenilersen yeni bir ad alırsın; kapsülün aynı kalır."
- Profildeki "Anonim adın" kartında kapsül yok.

## 3. Masa bitti

Fırat'ın görünümü, v45'in akışıyla:
- Üstte kapsül çifti, "Masa bitti" (katılımcıda "Masadan ayrıldın") ve "Mor Dalga · 6 kişi. Beğendiğin kişileri ekle."
- Her kişinin satırında, anonim katılan dahil, "Arkadaş ekle" (kural 5: kişi başına sessiz ekleme; anonimi hariç tutmaz).
  - Basınca düğme yeşil "Eklendi" olur. Eklenen kişi bunu görmez. Yeniden basınca geri alınır.
  - Karşı taraf da eklediyse ad altında "Arkadaş oldunuz" ve v45'teki "Mesaj" düğmesi; sohbeti açar.
  - Arkadaşsa "Arkadaşsınız".
  - Anonim katılanın adının altında "Anonim katıldı" yazar; yalnızca etiket, düğmeyi değiştirmez.
- Altta: "Eklediğin kişi bunu görmez. O da seni eklerse ikinize de haber gelir ve arkadaş olursunuz."
- "Mekana dön".
- v45'in boş hâli ("Masada senden başka kimse yoktu") kaldı.
- Dar ekranda ad ve düğme sığmazsa düğme alt satıra, sağa geçer; ad bölünmez.
- v45'teki masa süresi ve oyun sayısı yok.

## 4. Bildirim ayarları

Fırat'ın görünümü:
- Başlık "Bildirim ayarları".
- "Telefon bildirimleri" satırı: "Açık. Kapatırsan telefonun ayarlarından yeniden açabilirsin." ve "Açık" etiketi.
- Yalnızca bugün push gönderen üç tür:
  - **Arkadaşlar:** Arkadaşlık istekleri, Masa davetleri ("Davetler 2 dakika geçerli; kapatırsan kaçırabilirsin").
  - **Mesajlar:** Birebir mesajlar.
- Fırat'ın ekranındaki "Kabul edilen istekler", "Masa sohbeti", "Mekan sohbetinde yanıtlar" ve "Mekanlar" bölümü ("Etkinlik ve kampanyalar") yok; bunların push'u yok.

**v45'ten kalanlar:**
- **İzin kapalı hâli:** aynı satır sarı zeminde "Kapalı. Masa davetleri 2 dakika geçerli olduğu için kaçırabilirsin." ve "Telefon ayarlarını aç". Anahtarlar kapalı.
- **Alttaki not:** davet bildiriminde ad, masa adı ve mekan yazmaz; mekan sohbeti bildirim göndermez.

## 5. Görünüm

- Ayarlar'da "Oyunlara katılım"ın altında: Sistem, Açık, Koyu, tek satırda.
- Varsayılan Sistem: telefonun temasına uyar ve telefon temayı değiştirince hemen değişir.
- Altında kısa not: "Telefonunun ayarına uyar." / "Her zaman açık tema." / "Her zaman koyu tema."
- Seçim saklanır (denemede tarayıcıda). Deneme şeridindeki Tema düğmesi aynı seçimi değiştirir.

## 6. Doğum tarihi onayı

- v45'in doğum tarihi adımında "Devam"a basınca alt sayfa açılır: "25 yaşındasın" ve "Doğum tarihin 5 Nisan 2001. Sonra değiştiremezsin."
- **Onayla:** Cinsiyet adımına geçer.
- **Düzelt:** adımda bırakır.
- 18 altı da aynı akıştan geçer: Onayla'dan sonra v45'in "skall 18 yaş ve üzeri içindir" ekranı.
- Metin v45'in dilinde: v45'in adım metni "Sonra değiştiremezsin" diyor. Fırat'ın "Sonradan değiştirilemez" ve "14 Mart 2003" biçimi alınmadı.

## 7. 12 kişilik masada oyun ekranları

Sahtekar'da 9 ve üstü oyuncuda (oylamada 10 ve üstü aday):
- ipucu sırası iki satıra sarılır;
- hazır satırı küçülür;
- oylama ızgarası dört sütun;
- sonuç listesi iki sütun, öndeki pembe.

Kapışma oyunlarında (Harf Kapmaca, Şarkıda Geçsin) 8 ve üstü oyuncuda puan tahtası küçülür ve sarılır. Süre, istem ve düğmeler kaydırmadan görünür.

## 8. Kontrast, küçük ekran ve koyu harita

Fırat'ın düzeltmelerinden v45'te karşılığı olanlar, v45'in paletiyle ölçülerek:

| Yer | v45 | v46 |
| --- | --- | --- |
| Yer tutucu yazı (Masaya yaz, Mesaj yaz, Mekan ara, biyografi, telefon) | `#8A85A0`, 3,5:1 | `#6E6890`, 5,2:1. Koyu temada v45'in `#ADA8C8`'i |
| Oyunlarda beyaz açıklama yazıları (anlatıyor, ibre, ipucu, sonuç) | %92 saydam | tam beyaz |
| "İtiraz et" | açık örtü | koyu örtü, iki temada |
| Süresi geçmiş bildirim satırının yazısı | %55 | %64 |
| Keşfet haritası yol ve nehir adları | `#8A85A0`, `#7A93C8` | `#625C84`, `#44609A` |
| Keşfet haritası, koyu tema | açık çizim | koyu çizim (Fırat): zemin, yollar, park, nehir, yazılar |

- v45'in ölçümü yer tutucu yazıyı saymıyordu; açık bu yüzden v45'te kalmıştı.
- Fırat'ın listesindeki diğerleri v45'te zaten kendi değerleriyle düzeltilmişti; Fırat'ın değerleri alınmadı:
  - kendi balonundaki saat ve alıntı;
  - oyun çipleri;
  - Sahtekar kartı;
  - sonuç etiketi;
  - harf karosu;
  - Isınma;
  - alt sayfaların küçük ekranda kayması.

## 9. Sınama

Teslim edilen dosya üzerinde, 19 Ekim, Chromium. 170 senaryo:
- v44'ün 128 ekran ve oyun durumu;
- v45'in 17 kayıt durumu (doğum tarihi onayından geçerek);
- v46'nın 25 yeni durumu: Masa kur seçicisi, gelen masa, süsleme ekranının hâlleri, duygu, kaydedilmedi alt sayfası, profil ikilisi, Görünüm, doğum tarihi onayı, 12 kişilik Sahtekar ve kapışma ekranları, Masa bitti'de anonim kişiyi ekleme, iki "Yeni kişi".

**Tarama:** her genişlik açık ve koyu temada, 170 senaryonun hepsi.

| Ekran | Tema | JS hatası | Yatay taşma | Sığmayan süreli ekran | Satır çakışması | Dost çakışması | "..." | Kontrast |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 320×568, yazı %130 | Açık | 0 | 0 | 0 | 0 | 0 | 9 | 170/170 |
| 320×568, yazı %130 | Koyu | 0 | 0 | 0 | 0 | 0 | 9 | 170/170 |
| 320×568 | Açık | 0 | 0 | 0 | 0 | 0 | 4 | 170/170 |
| 320×568 | Koyu | 0 | 0 | 0 | 0 | 0 | 4 | 170/170 |
| 360×640 | Açık | 0 | 0 | 0 | 0 | 0 | 3 | 170/170 |
| 360×640 | Koyu | 0 | 0 | 0 | 0 | 0 | 3 | 170/170 |
| 400×780 | Açık | 0 | 0 | 0 | 0 | 0 | 3 | 170/170 |
| 400×780 | Koyu | 0 | 0 | 0 | 0 | 0 | 3 | 170/170 |

- **"..." sütunu** yalnızca kuralın izin verdiği önizleme ve alıntılardır (v45'teki gibi):
  - Mesajlar'daki son satır ("Yarın Kapsül Anlat'a var");
  - DM'deki alıntı;
  - mekan sohbetindeki alıntı.
- **Kontrast:** yazı 4,5:1, büyük yazı ve simge 3:1.
- **Satır çakışması** v46'da eklenen denetim: aynı satırdaki iki öğe üst üste biniyor mu.
  - İlk taramada 320 px %130'da Masa bitti satırında "Arkadaş oldunuz" etiketi "Sohbetiniz Mesajlar'da açıldı" yazısının üstüne biniyordu.
  - Satır artık sarılıyor; denetim eski düzende çakışmayı buluyor, yenisinde 0.
  - İncelemeden sonra Masa bitti satırında ad bölünmesin diye düğme gerekince bütünüyle alt satıra geçiyor; 320 px'te anonim ad tek parça.

**Davranış (36 denetim, hepsi geçti):**
- **İpucu:** yalnızca ilk açılışta; ikinci açılışta ve sayfa yenilenince çıkmaz; "ilk açılış" düğmesi sıfırlar.
- **Raflar ve parçalar:** raf adları Şık, Karakter, Tema; "Yıldız bıçak" ve "Fes" hiçbir rafta yok.
- **Kapsül ve cinsiyet:** kapsül cinsiyet değişince değişmez.
- **Başlangıç kapsülü:** "Yeni kişi" altı basışta her seferinde başka bir hazır görünüş; beş yeniden açılışta beş farklı kapsül.
- **Profil:** "Anonim adın" kartında kapsül yok.
- **Süsleme düğmesi:** profil açılınca iki kez oynar, 3,1 sn'de durur; hareket azaltmada hiç oynamaz.
- **Başkasının profili:** ikili ve süsleme düğmesi yok, avatar senin kapsülün değil; anonim kişinin profili açılmıyor.
- **Masa kur:**
  - başka masadaki simge soluk ve seçilemez;
  - seçilen simge Masa kur'da ve kendi masan kartında.
- **Masa ekranının üst satırı:** sahipte kendi masasının, katılımcıda masanın simgesi; harf yok.
- **Gelen masa:** simgesiyle "Geliyor"; telefonlar gelince "9 kişi".
- **Görünüm:**
  - Sistem telefonun temasına uyar;
  - Açık saklanır ve yenilenince kalır;
  - üç seçenek tek satırda.
- **Doğum tarihi onayı:** yaş ve tarih doğru; Düzelt adımda bırakır, Onayla Cinsiyet'e geçer.
- **Bildirim ayarları:** yalnızca Arkadaşlık istekleri, Masa davetleri, Birebir mesajlar; izin kapalıyken anahtarlar kapalı.
- **Masa bitti:**
  - anonim katılan kişide de Arkadaş ekle, "Anonim katıldı" yalnızca etiket;
  - Arkadaş ekle → Eklendi → yeniden basınca geri; "İstek gönderildi" hiçbir yerde yok;
  - karşılıklıysa Arkadaş oldunuz ve Mesaj; Mesaj sohbeti açar.
- **JS hatası:** hiçbir denetimde yok.

**Kontrastta sayılmayanlar:**
- Pasif düğmelerin yazısı kontrast kuralı dışında.
- Simgelerin ve kapsül çizimlerinin içi görsel; yazı yok.

## 10. Uygulamaya geçiş notu

- **Masa simgesi:**
  - Masa ekranının üst satırında da (36 px), harfli yuvarlak kalkar.
  - 256 px WebP, uygulamada `Image` ile; köşe yarıçapı kenarın %28'i.
  - Canlı SVG çizilmez (Fırat'ın notu; kaynak SVG'lerdeki bulanıklık efektleri `react-native-svg`'de yok).
  - Sunucuda masanın simge kimliği saklanır; mekandaki açık masalarda tekrar etmez, atama yarışsız olur.
  - Repodaki `tableAvatar.ts` (addan 12 simge) bu tasarımla değişir.
- **Kapsül:**
  - Kısa kodla saklanır (`c:pembe e:koyu h:kulaklik`); bilinmeyen parça atlanır.
  - Kayıtta 28 hazır görünüşten biri rastgele atanır (katalogda `hazir_gorunusler`); cinsiyet kullanılmaz.
  - Parça kütüphanesi istemcide (`kapsul-cizim-kutuphanesi.js` başvuru), çizim `react-native-svg`, hareket Reanimated.
  - Listelerde aynı kodun çizimi önbelleğe alınır (SPEC_V4: `CapsuleAvatar` ölçümü).
- **Görünüm:** `Appearance` ve telefonda saklanan tercih. Koyu tema rolleri v45'in paletiyle tek tema dosyasında.
- **İpucu bayrağı:** telefonda saklanır, sunucuya gitmez.
- **Yeni native paket:** yok.

## 11. Prototipte sahte olanlar (v45'e ek)

- **Masa simgeleri:** masalara verilmiş simgeler ve "başka masada" listesi elle verilmiş deneme verisi.
- **Gelen masa:** telefonları 6 saniye sonra hep birlikte katılıyor.
- **Kapsül görünümü:** sayfa yenilenince yeni bir hazır görünüş gelir (yeni kişi gibi). İpucu bayrağı ve Görünüm seçimi tarayıcıda saklanır.
- **Başkalarının anonim kapsülleri:** v45'teki gibi addan seçilen 28 kapsülden biri, v45'in çizim koduyla. Uygulamada herkesinki aynı kütüphaneyle, kendi koduyla çizilir.
- **Bildirim ayarları:** kaydedilmiyor.

## 12. Sorular

**İncelemede cevaplananlar (19 Ekim):**

| Soru | Cevap | v46'da |
| --- | --- | --- |
| Raf adları | Şık, Karakter, Tema kalır | Değişiklik yok |
| Masa ekranının üst satırı | Masa simgesi olsun | Bölüm 1 |
| "Anonim adın" kartında kapsül | Kapsülsüz | Bölüm 2 |
| Nick yenileme | Yalnızca ad değişir, kapsül kalır | Değişiklik yok |
| Süsleme düğmesinin hareketi | Profil açılınca 2 kez oynasın, dursun; hareket azaltmada hiç | Bölüm 2 |
| Başlangıç kapsülü | 28 hazır görünüşten rastgele, cinsiyetten bağımsız | Bölüm 2 |
| "Kabul edilen istekler" ve "Masa sohbeti" bildirimleri | Kalksın; push'ları yok | Bölüm 4 |
| Diğer kapsül parçaları | Kalır | Değişiklik yok |
| Masa bitti: Mesaj, süre, oyun sayısı | Eşleşince Mesaj geri gelsin; süre ve oyun sayısı gerekmez | Bölüm 3 |
| Soluk silüet | Kalır | Değişiklik yok |
| İncelemeden ayrıca | Anonim katılanda da Arkadaş ekle; "İstek gönderildi" yerine "Eklendi" | Bölüm 3 |

**Açık kalanlar:**

1. **Simge değişikliği:** kişi simgeyi Masa kur'da değiştirebiliyor. Masa kurulduktan sonra da değiştirebilsin mi? Denemede değiştiremiyor.
2. **Üç hazır görünüş v45'ten biraz farklı** (bölüm 2). Böyle mi kalsın, yoksa kütüphaneye beyaz renk ve miğfer parçası mı eklensin?
   - Melek ve Tavşan krem gövdeli, koyu mor zeminli.
   - Viking miğfer yerine boynuz ve sakallı.
