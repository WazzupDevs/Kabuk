# skall Faz 4: v43

**Onaylı; §4.N sırasıyla uygulanır.** Proje sahibinin onayladığı hedef: uygulamanın tasarımı, arayüzü ve mantığı `docs/design/v43/`'teki denemeye (v43) çevrilir. **Pilot v43'ün tamamıyla çıkar; hazır olmadan Play'e çıkılmaz.**

- Her adım kendi dalı ve PR'ıyla gelir; "onaylandı" olmadan birleşmez.
- Bu belgede olmayan bir karar gerekirse uygulama durur ve sorulur.
- §4.P'deki açık kararlar ilgili adımdan önce proje sahibine sorulur. Karar verilmeden o adımın işi başlamaz.

Alt bölümler harfle (§4.A, §4.B…), **adımlar** sayıyla numaralanır (adım 4.1…4.8; oyunlar 4.6.1…4.6.5; §4.N). Önceki fazlara atıf "SPEC_V3 §…" diye yazılır (`docs/SPEC_V3.md`).

**Kaynaklar.**

- `docs/design/v43/skall-masa-deneme-v43.html`: tek dosyalık deneme. Yalnızca "Senin görünümün" vardır; üstteki koyu deneme şeridi uygulamanın parçası değildir.
- `docs/design/v43/skall-arayuz-devir-raporu-v43.md`: tasarım oturumunun devir raporu. Rapor karar vermez; önerileri ve 25 sorusu bu belgede karara bağlanır ya da §4.P'ye yazılır.
- `docs/design/v44/skall-masa-deneme-v44.html` ve `skall-arayuz-devir-raporu-v44.md` (18 Ekim): koyu tema, v43'te olmayan ekranlar ve v43'ten düzeltmeler. Raporun §6'daki 17 sorusu proje sahibince cevaplandı (§4.P, K-9…K-25).
- `docs/design/v45/skall-masa-deneme-v45.html` ve `skall-arayuz-devir-raporu-v45.md` (18 Ekim): v44'ün üstüne yalnızca ilk ekran giriş animasyonu ve kayıt adımlarındaki kapsül dostları; kayıt sırası K-19'a göre (onaylar başta). Diğer ekranlar v44'le aynıdır. Raporun §6'daki 6 sorusu proje sahibince cevaplandı (§4.P, K-26…K-31). v46'nın tabanıdır.
- `docs/design/v46/skall-masa-deneme-v46.html`, `skall-arayuz-devir-raporu-v46.md` ve `kaynak/` (19 Ekim). v45'in üstüne Fırat'ın paketinden alınan sekiz maddeyi ekler:
  - masa simgeleri;
  - kapsül süsleme ve profil;
  - Masa bitti;
  - bildirim ayarları;
  - Görünüm;
  - doğum tarihi onayı;
  - 12 kişilik oyun ekranları;
  - kontrast ve koyu harita.

  `kaynak/`'ta şunlar var:
  - `masa-simgeleri/`: 100 masa simgesi (256 px WebP) ve `masa-simgeleri.json`;
  - `kapsul/kapsul-katalogu.json`: kapsül kataloğu, 28 hazır görünüşüyle;
  - `kapsul/kapsul-cizim-kutuphanesi.js`: denemenin çizim kodu, başvuru.

    4.4, 4.4b ve 4.5 `content/` ve `apps/mobile/assets` dosyalarını buradan üretir. v46 bu belgenin K-26–K-44 kararlarını çizmedi (raporun girişi); bu kararların maddeleri §4.C'deki listede kalır. Raporun iki açık sorusu cevaplandı (§4.P, K-59 ve K-61). v46 görsel kaynaktır; öncelik §4.C'de.

- Proje sahibinin kararları (§4.B) ve yönetimin "skall v43 dönüşüm raporu" (18 Ekim).

## 4.A Gerekçe, ilke ve kapsam

**Gerekçe.** Faz 3 masaları taraf olarak oynatıyordu:

- sahip ve misafir masa, taraf başına en çok 4 telefon;
- masa kişi sayısını beyan eder, telefonu olmayan kişi de sayılır;
- oyun bir tarafın önerisini diğerinin kabul etmesiyle başlar;
- yetki ve gizli bilgi tarafa bağlıdır.

v43'te herkes kendi telefonuyla **kişi** olarak oynar:

- bir masaya birden fazla masa katılabilir;
- takımlar her oyunda kişi bazlı seçilir, gözlemci rolü vardır;
- oyunu masa sahibi başlatır, masadakiler oy verir;
- anonim kişi masa takma adıyla değil, kapsül avatar ve `kapsul-xx55` nick'iyle görünür;
- bildirimler ve masa daveti gelir;
- görsel sistem yenidir.

Bu yüzden Faz 4 Faz 3'ün devamı değil, yeni bir fazdır. Değişenler: masa modeli, oyunların yetki modeli, anonim kimlik, bildirim katmanı ve görsel sistem.

**İlke.**

- **Kimlik ve red korunur** (Faz 3 ilkesi aynen). Yüzler zaten görünürdür; uygulamanın koruduğu şeyler kişinin adı, profil kimliği ve kimin kimi reddettiğidir. Kimlik yalnızca karşılıklı istekle açılır.
- **Sunucu otoriterdir** (kural 3). Roller oyun başında sunucuda atanır; gizli bilgi role göre ve yalnızca hak eden telefona gider.
- **Önce görüntü, sonra mantık.** Görsel katman (4.2, 4.3) bugünkü mantığın üstüne gider. Kimlik (4.4), masa modeli (4.5), oyunlar (4.6) ve bildirim (4.7) onu izler.
- **İki model yan yana yaşatılmaz.** 4.5'ten sonra yeni modele geçmeyen oyun "Yakında" olarak soluk durur.
- Telefonlarda yalnızca dev projesi vardır. Pilot Faz 4 bitmeden başlamaz; bu yüzden adımlar eski istemciyle uyumluluk yükü taşımaz. Yine de sunucu ile OTA arası kısa tutulur (§4.N).

**Ne değişmez.**

- Katılma isteği ve kabul akışı: 60 sn ömür, saatte 10 istek, red ve zaman aşımının istekçiye aynı görünmesi (`unavailable`), "Kabul edildi, X masasının yanına git".
- Masa sonunda sessiz "Arkadaş ekle", kalıcı red, çift kilidi, oyun geçmişi (3 dakika kuralı), engelleme ve şikayet.
- 18 yaş sınırı (kural 11) ve cinsiyet kuralı (kural 12, yalnızca oyun akışı için): erkek ve belirtmeyen oyun akışında ve masada her zaman profillidir; mekan sohbetinde anonim yazabilir (K-3, §4.D).
- Konum yalnızca check-in'de (kural 6), istemci tablolara yazmaz (kural 1), her tabloda RLS (kural 2), metin ve küfür filtresi (kural 7), service role anahtarı (kural 8).
- Kod, tablo ve kavram adları (`rooms`, `table_sessions`, `tabu`…) değişmez. Değişen, kullanıcıya görünen adlardır ("Kapsül Anlat", "masa").
- İçerik havuzları yeterlidir ve yeni yazılmaz: Kapsül Anlat 547 kart, Harf Kapmaca 174 kategori, İbre 225 ölçek, Şarkıda Geçsin 445 kelime, Sohbet kartları 160 kart, Sahtekar 25 kategori ve 526 kelime. Yalnızca Sohbet kartlarına iki tema eklenir (adım 4.6.2).

**Kalkan.**

- Masanın kişi sayısı beyanı (`table_sessions.headcount`, `rooms.owner_headcount`/`guest_headcount`, `join_requests.requester_headcount`). Masa büyüklüğü telefon sayısıdır.
- Taraf modeli: sahip ve misafir taraf, taraf başına 4 telefon, lider ve üye. Öneri ve kabul (`game_proposals`), Sahtekar'ın koltuk modeli, Tabu'nun hakemli ve iş birliği modları, masalar arası sıralı kapışma ve itiraz hakları.
- Check-in'in masa kurması. Masa adı yalnızca lobide ve masanın kendi başlığında kalır; sohbetlerde kişi nick'iyle ya da gerçek adıyla görünür.
- "Tabu" adı: Taboo Hasbro'nun markasıdır. Oyunun kullanıcıya görünen adı "Kapsül Anlat" olur.

**Kapsam dışı.**

- QR, davet bağlantısı, masa numarası ya da harita üstünde masa yeri.
- Telefonu olmayan oyuncu (§4.B-1).
- Uygulama içi ses ya da mikrofon. SPEC_V3 §20.1 aynen geçerlidir: her şey sesli söylenir, uygulama dinlemez ve ses çalmaz.
- Yeni oyun.
- v43'te, v44'te, v45'te ve v46'da olmayan ekran ya da özellik (§4.C).

**Native değişiklik: tek build** (adım 4.1, `version` 0.5.0):

- `react-native-gesture-handler` eklenir: kaydırıp yanıtlama, kart eğme, ibre sürükleme ve basılı tutma için.
- Hermes için `<application android:gwpAsanMode="never">` (`docs/DECISIONS.md` → "Hermes çökmesi").
- `expo-linear-gradient` eklenmez; gradyanlar kurulu `react-native-svg` ile çizilir.
- `userInterfaceStyle` bugün `automatic`'tir; koyu tema için değişmez.

Sonraki bütün adımlar OTA ile gider. Bir adımda başka bir native bağımlılık gerekirse uygulama durur ve sorulur.

## 4.B Kurgu (proje sahibinin kararları)

Değişmez kabul edilir.

1. **Telefonu olmayan oynayamaz.** Masanın kişi sayısı beyanı kalkar; masa büyüklüğü telefon sayısıdır.
2. **Check-in'de masa kurulmaz; kişi masayı sonradan kurar.** Check-in ile masa veri modelinde ayrılır. Mekan sohbeti ve lobi "aktif masası olan" yerine "mekanda check-in'i olan"a açılır.
3. **Masaya en çok 12 telefon.** Birden fazla masa katılabilir.
4. **Oyunu yalnızca masa sahibi başlatır.** Oylar öneridir; sahip başka oyunu da başlatabilir. Gözlemci rolü vardır.
5. **Herkes kendi telefonunda oynar.** Roller (anlatıcı, rakip, gözlemci, sahtekar) oyun başında sunucuda atanır; gizli bilgi role göre gider. Sunucu otoritesi (kural 3) aynen kalır.
6. **Anonim kimlik:** kapsül avatar ve `kapsul-xx55` nick, hesaba sabit.
   - Anonim ve profilli arasında check-in başına 1 değişiklik.
   - Değişiklikten önce yazılan mesajlar eski kimlikte kalır.
   - Kural 12 aynen: erkek ve belirtmeyende masaya giden anahtar yok. Mekan sohbetinde anonim yazabilirler; anonim seçimleri yalnızca mekan sohbetini etkiler (K-3, §4.D).
7. **Mekan ve masa sohbetinde masa adı yoktur;** yalnızca anonim nick ya da gerçek ad.
8. **Masa daveti:**
   - yalnızca aynı mekanda check-in'i olan arkadaşa gider;
   - mekan adı taşımaz;
   - 2 dakika geçerlidir;
   - yalnızca sahip gönderir;
   - davete katılanın boş masası sessizce kapanır;
   - red ve zaman aşımı aynı görünür;
   - kural 4'e açık istisna olarak yazılır.
9. **Oyun adında "Tabu" geçmez.** Çalışma adı "Kapsül Anlat"; metinlere tek sabitten gelir.
10. **Koyu tema vardır; yazı tipi Plus Jakarta Sans.**
11. **Görsel kaynak v46'dır** (`docs/design/v46/`; öncelik §4.C); Claude Design tuvali arşiv olur. Karar v43 içindi (`docs/design/v43/`). "Kabuk tasarım denemeleri" oturumundan sırayla şunlar geldi:
    - v44 (`docs/design/v44/`, 18 Ekim): koyu tema ve eksik ekranlar;
    - v45 (18 Ekim): ilk ekran giriş animasyonu ve kayıt adımlarındaki kapsül dostları;
    - v46 (19 Ekim): Fırat'ın paketinden alınan sekiz madde (masa simgeleri, kapsül süsleme ve diğerleri).

    v43, v44 ve v45 tarih için kalır.

12. **Pilot v43'ün tamamıyla çıkar;** hazır olmadan Play'e çıkılmaz.

**Kural metinleri için proje sahibinin verdiği ölçüler** (§4.O):

- kural 6: Keşfet'te konuma göre sıralama yok;
- kural 9: İbre'nin canlı ibresi istemcinin yayın yaptığı ikinci kanaldır: oda üyeleriyle sınırlı, yükte yalnızca sayı, yalnızca sürüklerken, saniyede en çok 10;
- kural 5: masa sonundaki "Arkadaş ekle" sessiz kalır; bildirime yalnızca açık arkadaşlık istekleri düşer. K-70 ile eşleşme de ilk basana bildirim olarak düşer; tek taraflı basış sessiz kalır.

## 4.C Tasarım sistemi ve ekranlar (adımlar 4.2, 4.3)

**Kaynak.**

- `docs/design/v46/`: deneme ve devir raporu. Ekranlar, renk, yazı, şekil, bileşen, hareket ve dokunuş buradan alınır.
  - v46, v45'in üstüne Fırat'ın paketinden sekiz madde ekler (v46 raporu, bölüm 1–8). Diğer ekranları v45'le aynıdır.
  - v45, v44'ün üstüne ilk ekran giriş animasyonunu ve kayıt adımlarındaki kapsül dostlarını eklemiş ve kayıt sırasını K-19'a göre kurmuştu. Diğer ekranları v44'le aynıdır (v45 raporu, giriş).
- `docs/design/v46/kaynak/`: masa simgeleri (100 WebP ve `masa-simgeleri.json`), kapsül kataloğu (`kapsul-katalogu.json`) ve çizim kütüphanesi (`kapsul-cizim-kutuphanesi.js`, başvuru).
  - 4.4 ve 4.4b kataloğu `content/`'e, 4.5 simgeleri `apps/mobile/assets`'e ve listelerini `pure/`'a buradan üretir (§4.D, §4.E).
  - Dosyalar teslim edildiği gibi kalır: Prettier ve ESLint `docs/design/`'a bakmaz.
- **Galeri katmanı ve envanter** (Fırat'ın tasarım oturumu, 20 Ekim; `docs/design/v46/`). Hepsi repodaki `skall-masa-deneme-v46.html`'in üstüne kuruludur (kaynak sha256 `1063519b…`, `skall-v46-galeri-notu.md`):
  - `skall-masa-deneme-v46-galeri.html`: v46'nın kendisi (stil ve betik blokları bayt bayt aynı), üstüne galeri ve URL katmanı. Her durum `?s=<durum>&theme=light|dark&fs=1.3&anim=0&demo=0` ile açılır (127 durum). `page=galeri` 59 ortak bileşeni bütün hâlleriyle gösterir.
  - `skall-v46-envanter.json`: **birincil kaynak.** Değerler hesaplanmış son değerlerdir (canlı `getComputedStyle`, açık ve koyu). Renk ve yazı token'ları, bileşenler, hareketler, etkileşimler ve durumlar buradan alınır. `skall-v46-envanter.md` aynı verinin tablo hâlidir.
  - **Birincil düğme `.btn.btn-room`'dur ve üç boyu vardır** (envanter F4, F5). `.btn-primary` eski bir CSS kalıntısıdır, kullanılmaz.
  - Fırat'ın düzeltilmiş sürümü gelince bu dosyalar aynı adlarla değişir. O zamana kadar v46 native adımları (token betiği, galeri, ortak bileşenler) bu sürümle yapılır.
- **v46 kendi içinde çelişiyorsa** (envanterin `findings` bölümü) v46'nın çoğunluk kalıbı ve CLAUDE.md "Ekran davranışı" geçerlidir (proje sahibi, 20 Ekim). Her biri aşağıdaki "v46'dan farklı uygulananlar" listesine yazılır.
- **Öncelik sırası:** önce aşağıdaki "v46'dan farklı uygulananlar" listesi, sonra v46, sonra v45, sonra v44, sonra v43.
- `docs/design/v45/`, `docs/design/v44/` ve `docs/design/v43/`: önceki denemeler. Sonrakinin değiştirmediği yerde geçerlidir ve tarih için kalır.
- Claude Design ana tuvali (https://claude.ai/artifact/9pfA5eudWS4s5rxUydRuss) ve önceki tasarım denemeleri arşivdir.
- skall tasarım sistemi (https://claude.ai/artifact/TBSmpZEA6Lg29Qc4oVtSX5) 4.2c'de v45'e göre yenilendi. v46'nın eklediği görünümler (masa simgesi, kapsül süsleme) onları getiren adımın PR'ında sisteme eklenir.

**v44: 4.2'nin ön koşulu (18 Ekim'de geldi).** Koyu tema ve v43'te olmayan ekranlar "Kabuk tasarım denemeleri" oturumundan v44 olarak geldi (`docs/design/v44/`, raporun §3'ü). 4.2 v45'e göre yapılır (v45'in diğer ekranları v44'le aynıdır). İstenen ekranlar (v43 raporu §10 ve bu belge):

- bütün ekranların koyu teması;
- kayıt akışı (telefon, kod, profil, doğum tarihi, cinsiyet, fotoğraf, onaylar; onaylar başta, K-19; v45'te çizili) ve cinsiyet kapısı;
- check-in ve mekanda masası olmayan kişinin mekan ekranı ("Masa kur");
- masa kurma ve masa adı (yenileme hakkıyla);
- davet gönderme ekranı: bütün arkadaşların listesi, kimin mekanda olduğu görünmez (K-2, §4.G). Tasarım oturumuna giden "aynı mekandaki arkadaşların listesi" isteği bununla değişir;
- "Masa bitti" ekranı: masadakiler ve kişi başına "Arkadaş ekle";
- bildirim ayarları, gizlilik, hesap (hesap silme dahil), engellenenler, sessize alınanlar;
- anonim anahtarının durumları: değiştirme onayı, "bu check-in'de hakkın bitti"; erkek ve belirtmeyen için yalnızca mekan sohbetini etkileyen anonim seçimi ve masaya taşınmadığını söyleyen metin (K-3, §4.D); fotoğrafı olmayanın profilli seçimi (`photo_required`, K-4);
- oyunların "Yakında" hâli (§4.F);
- Kapsül Anlat adıyla oyun ekranları; rakip düğmesi "Yasak!", ödül "Yasak avcısı" (K-5);
- zil yalnızca Mesajlar'da, alt çubuktaki Mesajlar sekmesinde okunmamış noktası (K-6, §4.G);
- v43'te çizilmemiş ekranların yükleniyor, boş ve hata hâlleri.

  4.3 ve sonraki adımlar ekran başına yukarıdaki öncelik sırasıyla kurulur. v46'da, v45'te, v44'te ve v43'te olmayan bir görünüm gerekirse uygulama durur ve tasarım oturumuna sorulur.

**v46'dan farklı uygulananlar** (proje sahibinin kararları; v46 çizimi bu noktalarda uygulanmaz).

- Maddelerdeki "v44'te" ve "v45'te" notları v46 için de geçerlidir. v46 bu noktalara yalnızca masa simgesini ekledi: masa kartına ve masa ekranının üst satırına.
- v46 bu belgenin K-26–K-44 kararlarını çizmedi (v46 raporu, giriş). Bu kararların maddeleri listede kalır.
- v46'nın çizdiği maddeler listeden çıktı: Görünüm (K-54), doğum tarihi onayı (K-55, K-63) ve Fırat'ın paketinden alınmayanlar (K-57).

- **Soluk posterde oy verilir** (K-17). v44'te soluk poster oy vermiyor. Masanın telefon sayısı alt sınıra ulaşmadan sahip o oyunu başlatamaz.
- **"Anonime geç"** (K-20): fotoğrafı olmayan ve profilli görünmek isteyen kadına "Fotoğraf ekle"nin yanında "Anonime geç" de önerilir. v44'te yalnızca "Fotoğraf ekle".
- **Keşfet sıralaması** (K-21): bugün etkinliği olan mekanlar üstte, sonra ada göre. v44'te yalnızca ada göre.
- **Erkekte ve belirtmeyende "Oyunlara katılım"** (K-22): Ayarlar'da görünür ve yalnızca mekan sohbetindeki girişteki varsayılanı belirler. v44'te gizli.
- **Alt sekme etiketleri** (K-23): en büyük yazıda en çok 1,2 kat büyür (`maxFontSizeMultiplier={1.2}`); 320 dp'de sığmazsa 1. v44'te hiç büyümüyor.
- **Masa içi profilde "Arkadaş ekle" yok** (K-14, P-16): profil masa içinde yalnızca görüntülenir; düğme masa sonunda ve oyun geçmişinde.
- **Aktiviteler'de kampanya ve "ilgileniyorum" yok** (K-15, P-17): Aktiviteler bugünkü etkinlikleri (`venue_events`) ve Geçmiş'i gösterir.
- **Keşfet'te kesin sayı yerine aralık** (K-16, P-18): açık masa sayısı kovadan gelir ("Birkaç açık masa", "Sessiz"). v44'te kesin sayı.
- **Aktiflik noktası** (K-12, P-6): mekan sohbeti kartındaki nokta yalnızca son 10 dakikada mesaj varsa yanar. v44'te her zaman yanıyor.
- **Mekan sohbetinde "yazıyor" yok** (K-11, P-5): üçüncü bir istemci yayın kanalı isterdi (kural 9).
- **Nick yenileme 30 günde bir** (K-9, P-2): v44'te "Karar bekliyor" etiketli ayrı durum.
- **İlk ekranın düğmesi "Başla"** (K-26): önce "Başlamadan önce"yi açar. v45'te "Telefonla devam et".
- **"Başlamadan önce"den geri gelince sahne durağan gelir** (K-28), yeniden oynamaz. v45'te perdesiz yeniden oynuyor.
- **Mekan'daki masa kartında süre, nokta ve ad** (K-35): 4.5'e kadar kalan süre, "Noktanı değiştir" ve "Masa adını değiştir" kartta küçük, sessiz bir ikinci satırda kalır. v45'in kartında yalnızca masa adı, durum satırı, "Lobiye aç" ve "Davet et" var. Masa ekranına taşınmaz: bir odadayken sunucu nokta ve ad değişikliğini `in_room` ile reddediyor. 4.5'te süre ve nokta Mekan'da kalır, ad değiştirme masa ekranına geçer (`rooms.name`).
- **Kartın başlığı masa ekranını açar, oda kurmaz** (K-36): odası olmayan masada başlık odasız masa ekranını (oyunlar) açar. "Masanla oyna" odası yalnızca bir oyun seçilince kurulur; yalnızca bakıp geri dönen için hiçbir şey kurulmaz. v45'te "Masanla oyna" düğmesi yok. Gerekçe: "Masanla oyna" odasındayken lobideki "Katıl" ve "Bu masadayım" kapalı; başlığa merakla basan biri 30 dakika başka masaya katılamazdı.
- **Keşfet'te tek mekan görünümü** (K-37): tek aktif mekan varken Keşfet o mekanın kartını ve önümüzdeki 7 günün etkinliklerini gösterir (SPEC_V3 §4 davranışı), v44'ün renk ve yazısıyla; şehir düğmesi, "Mekan ara" ve tür çipleri görünmez. İki ve üstü mekanda v44 listesi. v44'te her zaman liste.
- **Varsayılan şehir** (K-38): en çok aktif mekanı olan şehir. Son seçim yalnızca telefonda saklanır. Aktif mekanı olan tek şehir varsa şehir düğmesi görünmez. v44'te düğme her zaman var.
- **Masa ekranındaki sahip çubuğu masanın hâline göre** (K-39): odası yokken "Lobiye aç" ve "Davet et", lobide bekleyen masada "Lobiden çek" ve "Davet et". Birleşmiş ve "Masanla oyna" masasında "Davet et" yalnızca o masaya bugün "Bu masadayım" ile girilebiliyorsa görünür; girilemiyorsa çubuk hiç görünmez. Birleşmiş masada tarafta 4 telefon varsa "Davet et" gizlenir. v44'te sahipte her zaman "Lobiye aç" ve "Davet et".
- **Masa ekranında "Diğer" menüsü** (K-40): Bitir ya da Ayrıl'ın yanında bugünkü üç eylemle (liderin "Ayrıl"ı, Şikayet, Engelle). v44'ün üst satırında menü yok.
- **Keşfet'in kova metinleri** (K-41): "Sessiz" (0–2), "Birkaç açık masa" (3–5), "Kalabalık" (6+). v44'te kesin sayı (K-16).
- **Keşfet'in sayım satırı** (K-42): bugün etkinliği olan mekan varken "N mekan · bugün etkinliği olanlar önce", yokken "N mekan · ada göre". v44'te hep "ada göre".
- **Keşfet'te satıra basınca mekan sayfası** (K-43): 4.3'te bugünkü mekan sayfası v44 görünümüyle açılır. v44'ün giriş alt sayfası (nokta çipleri, kimlik notu) 4.5'te gelir (§4.E).
- **Etkinlik kapağı mekan türüne göre** (K-44): v44'ün çizimlerinden iki kapak, kafe ve kampüs. v44'te her etkinliğin kendi çizimi var; `venue_events`'e alan eklenmez.
- **Masa simgesi sonradan da değişir** (K-59).
  - Sahip, masa ekranındaki ya da Mekan'daki kendi masa kartındaki simgeye dokununca Masa kur'daki seçici açılır (`rooms/set-icon`).
  - Başkası dokununca bir şey olmaz. Yeni çizim yok.
  - v46'da simge yalnızca Masa kur'da seçilir.
- **Masa bitti'de anonim katılanın notu** (K-68). Anonim katılan kişinin kendi ekranında, alttaki notun yanında: "Arkadaş olursanız anonim adının sen olduğunu görür. İstersen Profil'den adını yenileyebilirsin." v46'da yok.
- **Katıl'ın pasif hâli** (envanter F7; proje sahibi, 20 Ekim): dolu masada "Katıl" ortak pasif görünümü alır. v46'da Katıl'ın pasif görünümü yok; masa doluyken de aynı görünür. v46'daki öteki pasif hâller de dağınık: gri dolgu, soluk yazı ya da opaklık 0,45. Ortak pasif görünüm ortak bileşenlerde tek tanımdır.
- **Birebir sohbette de uzun basmada titreşim** (envanter F9; proje sahibi, 20 Ekim): mekan sohbetindeki gibi. v46'da uzun basma yalnızca mekan sohbetinde titreşiyor (10 ms).
- **Alt sayfa kapanışı açılışın tersi; sürükleyip kapatma var** (envanter F10; proje sahibi, 20 Ekim; "Ekran davranışı"). v46'da sayfa 320 ms kayma ve 200 ms perdeyle açılıyor, ama kapanışta animasyon yok ve sayfa sürüklenerek kapanmıyor.
- **Yüklenirken birincil düğme mor kalır, gösterge görünür** (envanter F13; proje sahibi, 20 Ekim; "Ekran davranışı": basılan düğme beklediğini gösterir). v46'da yüklenen düğme pasif görünüme düşüyor: gri zemin `#E6E2F2`, koyu temada `#29283A`.
- **Hareket azaltılınca yüklenen düğmenin yazısı kalkmaz, yalnızca solar** (çelişki kuralı; proje sahibi, 20 Ekim). v46'nın `prefers-reduced-motion` bloğundaki `.busy>:not(.ld){transform:none}` kuralı, dosyada sonra gelen `.busy>:not(.ld){opacity:0;transform:translateY(-5px)}` kuralınca eziliyor; v46'da yazı hareket azaltılmışken de 5 px yukarı kayıyor. Uygulanan, v46'nın niyeti.
- **Sekme çubuğu sıvı cam (0.7.0; proje sahibi, 27 Ekim: iOS'un liquid glass'ı kalitesinde).** v46'nın buzlu camı (`backdrop-filter: blur(20px) saturate(1.9)`) yerine skall'ın kendi native modülü (`apps/mobile/modules/skall-glass`): odaktaki sekme ekranı bir RenderNode'a çizilir ve çubuğun altında aynı çizim yeniden oynatılır (kopya yok); hafif bulanıklık (4 dp), üstünde yuvarlak bir mercek: kenara 16 dp kala dışarıdaki görüntü içeri kırılır (en çok 14 dp), renkler hafifçe ayrışır, kenar sol üstten ışık alır (Android 13 ve üstü, AGSL gölgelendirici; Android 12 yalnızca bulanıklaştırır). v46'nın gradyanı camın üstünde %45 gücünde, kenar ve içteki ışık tam. Doygunluk ve gren yok. Değerler `apps/mobile/src/theme/glass.ts`'te. expo-blur kaldırıldı. Android 12'den (API 31) eski telefonlarda cam yok: çubuk opak zeminle çizilir, v46'nın ekran rengi (`canvas`) ve üstünde çubuğun gradyanı (proje sahibi, 20 Ekim; `apps/mobile/src/ui/backdrop.ts` → `blursBehind`). Keşfet haritasının üstünde de opak. iOS'ta cam yok; pilot Android'de.
- **Keşfet haritasının üstünde sekme çubuğu opak.** v46'da harita görünümünde çubuğun arkasında haritanın bulanığı görünür. Uygulamanın haritası MapLibre'nin GL yüzeyidir (`SurfaceView`); Dimezis onu bulanıklaştıramaz (README). Harita açıkken çubuk Android 12 öncesindeki gibi opak çizilir: v46'nın ekran rengi ve üstünde gradyanı (`useTabBarOverMap`, `src/ui/TabBar.tsx` → `opaque`). Harita `TextureView` ile çizilmez (proje sahibi, 21 Ekim): harita görünümünde çubuk opak kalır.
- **Keşfet satırlarının girişi en çok 200 ms bekler** (proje sahibi, 21 Ekim; CTO incelemesi, WazzupDevs/Kabuk#198). v46'nın betiği satırları 40 ms arayla getirir ve gecikmeye sınır koymaz (`i * 40` ms; yedi satırlık listesinde son satır 240 ms bekler). Uygulamada sınır v46'nın en büyük gecikmesi olan 200 ms: sonraki satırlar beklemeden, 200 ms'de birlikte gelir (`apps/mobile/src/ui/VenueRow.tsx` → `ROW_DELAY_MAX_MS`).
- **Keşfet'te aşağı çekip yenileme v46'nın göstergesiyle** (proje sahibi, 21 Ekim; CTO incelemesi, WazzupDevs/Kabuk#201). Liste görünümünde, listenin en üstünde aşağı çekince liste parmakla iner, göstergenin kapsülleri yaklaşır ve 72'de işaret olur; orada bırakınca liste 64 aşağıda durur, işaret döner (Dönüş) ve mekanlar ile şehirleri yeniden gelir. Sayılar v46'nın betiğinden okunur (`V46_PULL`, `scripts/v46/explore.ts` → `pullRefresh`; `apps/mobile/src/ui/PullScroll.tsx`). v46'dan farkları: dönüş v46'da deneme için 1,5 sn sabit, uygulamada liste yeniden gelene kadar ve en az 600 ms (yükleme göstergesinin en kısa süresi); dönen işaret uygulamanın Dönüş göstergesidir (aynı süreler; v46 dönüşü kübik eğriyle, uygulama tasarım sisteminin `cubic-bezier(.65,0,.35,1)`'iyle yapar). Hareket azaltılınca işaret v46'daki gibi dönmez, nefes alır; liste beklemeden yerine oturur.
- **Keşfet listesinin altında OpenStreetMap atfı** ("© OpenStreetMap katkıda bulunanlar"). v46'nın listesinde yok; mekanların konumu OpenStreetMap'ten gelir (`pnpm fetch:venues`) ve ODbL atıf ister. Listenin sonunda, ince yazıyla kalır.
- **Ad alanının yer tutucusu öteki alanlarınki gibi** (çelişki kuralı; proje sahibi, 20 Ekim). v46 kayıttaki ad alanına (`.sup-field input`) yer tutucu rengi vermiyor; tarayıcının kendi grisi görünüyor (`#757575`, iki temada da). v46'nın öteki bütün alanlarında aynı renk var (`.cin`, `.ebio textarea`, `.dsearch input`, `.sup-phone input`: açıkta `#6E6890`, koyuda `#ADA8C8`). Ad alanı onu alır (`scripts/v46/form.ts` → `textFieldScheme`).
- **Alanın hata satırı kendi kuralıyla, kırmızı** (çelişki kuralı). v46'nın hata satırı `.sup-err`: 13/700, açıkta `#B4281A`, koyuda `#FF9C8A`. Kayıt ekranında daha özgül `.sup-pane>p` kuralı onu ezer ve satır ekranın soluk paragrafı gibi çizilir (15/600, `#5E5878`). Niyet uygulanır: satır kendi kuralıyla çizilir (`src/ui/FieldError.tsx`). v46'nın öbür hata satırı da kırmızıdır (`.va .sheet p.kur-err`).
- **Seçim kutusunun oku v46'nın aşağı okuyla.** v46'nın doğum tarihi seçimleri (`.dob select`) kendi oklarını çizmez; görünen ok tarayıcınındır (`appearance: auto`). Uygulamada ok v46'nın kendi aşağı okudur (Keşfet'teki şehir düğmesinin oku) ve tarayıcının okundaki gibi yazının rengindedir (`src/ui/SelectField.tsx`). Seçenekleri ekran açar.
- **Kod kutularında imleç yok.** v46'nın kod alanı altı ayrı alandır ve odaktaki kutuda tarayıcının imleci yanıp söner. Uygulamada kutuların üstünde tek, görünmeyen bir alan durur; yazma, yapıştırma ve SMS'ten kendiliğinden dolma tek alandaki gibi çalışır (bugünkü `CodeInput` gibi). Sıradaki kutu odak görünümünü alır, imleç çizilmez (`src/ui/CodeField.tsx`).
- **"Geliyor" hâli yok** (K-69).
  - Kabul edilen kişiler kabul anında Masadakiler'e normal üye olarak girer; masa ekranının üst satırı "N kişi" yazar.
  - §4.E'deki tek seferlik "Y geliyor, N kişi" bildirimi kalır.
  - v46'da kabul edilen masa, telefonları katılana kadar Masadakiler'de "Geliyor" olarak durur ve üst satır "6 kişi · 3 geliyor" yazar.
- **Görünüşün kaynağı skall tuvali, arayüz temiz sayfa** (proje sahibinin kararları, 26 ve 27 Ekim; `docs/decisions/sistem-kaynak.md`).
  - Görünüşte (ekranlar, renk, yazı, şekil, bileşen) yalnızca `docs/design/sistem/` geçerlidir ve birebir uygulanır; v46 ve öncekiler tarih için kalır. İçerik, davranış ve kurallarda bu spec geçerlidir.
  - Arayüz tuvalden sıfırdan kurulur: tema, bileşen kiti, ekranlar. Veri, sunucu ve mantık korunur. v46'nın ölçüm hattı yeni kit kullanıldıkça kalkar.
  - Hareket ve dokunuş koddaki bugünkü değerlerdir; tuvale hareket panosu eklenince kaynak o olur.
  - Tuval bu listeyle ve K kararlarıyla uzlaştırıldı. Spec'te karşılığı olmayan tuval metinleri `docs/design/sistem/sapmalar.md`'de onay bekler.
- **Tepki seti altı kapsül ifadesi** (proje sahibinin kararı, 26 Ekim). DM, masa ve mekan sohbetinde Beğendim, Bayıldım, Kahkaha, Şaşırdım, Üzüldüm, Kızdım; çizim tuvalden. Bugünkü altı emojiden (`_shared/pure/reactions.ts`) geçiş migration'la; eski tepkilerin eşlemesi tepki PR'ında proje sahibinin onayına gelir.
- **Ayarlar, Bildirimler, mekana giriş ve "Neredesin?" alt sayfa** (proje sahibinin kararı, 27 Ekim). Tuvaldeki gibi açıldıkları ekranın üstünde alt sayfadır (`src/components/RouteSheet.tsx`; rotalar `(app)/_layout.tsx`'te saydam modal). Geri tuşu, perdeye dokunmak ve "Vazgeç" sayfayı kapatır. Ayarlar'ın yolu `/settings`. Mekana giriş tek sayfadır: mekan, noktası varsa "Neredesin?" çipleri, konum rızası, sorun şeritte, sonra "Konumumu kullan"; nokta konumdan önce seçilir (`checkin/spot` kalktı).
- **Tuvalin metinleri onaylandı** (proje sahibinin kararı, 27 Ekim; `docs/design/sistem/sapmalar.md`'den taşındı):
  - Profil, anonim ad: "Anonim adın. 30 günde bir yenileyebilirsin; kapsülün aynı kalır." ve beklerken "N gün sonra yenileyebilirsin."
  - Masayı bitir: "Ayrılırsan masa sürer; sahiplik masaya en erken katılana geçer."
  - Kişi seçenekleri, Engelle: sahipte "Masadan çıkarılır. Karşı tarafa bildirilmez.", katılımcıda "Masadan çıkarsın. Karşı tarafa bildirilmez."
  - Bildirimler, eşleşme satırı: "X ile arkadaş oldunuz", altında "Masa sonunda ikiniz de eklediniz" (satır geldiğinde).
  - Bildirimler, süresi geçen davet: "X seni masasına çağırmıştı" (4.7 ile).
  - Başka mekana giriş: "X girişin biter; bulunduğun masadan ayrılırsın."
  - Konum izni yok: şeridin başlığı "Konum izni yok".
  - Geçmiş kaydının alt sayfası: başlık kişinin adı, altında "Oyun · zaman"; eklenince "X bunu görmez. O da seni eklerse arkadaş olursunuz. Yeniden basarsan geri alırsın." ("Eklendi"ye yeniden basmak eklemeyi geri alır, kural 5).

**Tasarım sistemi (adım 4.2).** Sunucu değişmez; istemci OTA ile gider.

- **Tokenlar** (`apps/mobile/src/theme/`): v43'ün paleti (logo renklerine çekildi) ve v44'ün koyu teması (v44 raporu §1: zemin `#0D0B1E`, yazı `#F3F0FF`, kart `#1C1838`, soluk yazı `#B8B3D2`). Koyu tema tonları, oyun zeminlerinin koyu hâli, koyu zemin logosu ve açık temadaki koyu yarı saydam oyun çipleri 4.2'nin PR'ında ekran görüntüleriyle proje sahibinin onayına gelir (K-25). Isınma `#C4521F`'ten `#B4481A`'ya koyulaştı (4.5:1; K-24). Oyun renkleri (v43 raporu §5):

  | Rol                                                  | Renk                                       |
  | ---------------------------------------------------- | ------------------------------------------ |
  | Takımlar (Mor, Pembe)                                | `#6A47F5`, `#D6336C`                       |
  | Pas, Doğru, Yasak!                                   | `#FFD23F`, `#34D27F`, `#C8331F`            |
  | Sahtekar zemini                                      | `#2A1C66` → `#1B1446`                      |
  | Harf Kapmaca zemini                                  | `#CF4A2A` → `#B8325A`                      |
  | Şarkıda Geçsin zemini                                | `#2B1878` → `#4A22A8`                      |
  | Sohbet kartları zemini (v44)                         | `#C2316F` → `#A92A66`                      |
  | İbre zemini                                          | Sıradaki takımın rengi                     |
  | İbre puan bölgeleri (2, 3, 4)                        | `#FFD86B`, `#FFA94D`, `#FF4F8B`            |
  | Sohbet kartı temaları (Isınma, Kampüs, Derin, Ya da) | `#B4481A`, `#6A47F5`, `#2F2A78`, `#187A48` |
  | Bildirim rozeti                                      | `#C51F62`                                  |

- **Oyun renkleri** `src/theme/gameColors.ts`'te (4.2a). Koyu temada takım rengi koyu zemine OKLab'da %62 karışır (v44: `color-mix(in oklab, renk 62%, #0D0B1E)`); Sahtekar (`#1C1450` → `#120D33`), Harf Kapmaca (`#8E3420` → `#7C2440`), Şarkıda Geçsin (`#1A1150` → `#2E1872`) ve Sohbet kartları (`#7E2150` → `#6C1C46`) v44'ün koyu geçişleridir. Yarı saydam çipler koyu zeminlerde beyaz %18, açık temanın parlak zeminlerinde (iki takım, Harf Kapmaca, Sohbet kartları) mürekkep %24'tür (K-25).
- **Kontrast:** oyun zeminlerinde ve temalarda beyaz yazı en az 4.5:1. Harf Kapmaca'nın turuncu zemininde yarı saydam beyaz çipler (yaklaşık 3.3:1) koyulaştırılır. `theme/contrast.test.ts` yeni tokenlarla güncellenir; renkler `scripts/icon/mark.ts` ile eşitlik testini korur.
- **Yazı tipi:** Plus Jakarta Sans (500, 600, 700, 800). `@expo-google-fonts/plus-jakarta-sans` eklenir. v46'nın `system-ui` dediği metinler (bildirim balonu, v46'da `.toast`) Roboto 700'dür (Android'in sistem yazı tipi; paket değil, lisansıyla `apps/mobile/assets/fonts/` altında bir dosya, aynı yükleme listesinden; proje sahibinin kararı, 20 Ekim, `docs/decisions/ci-gorsel-kapi.md`). Gerekçe: bugünkü Poppins ve Manrope paketleriyle aynı yoldur; JS paketidir, kurulu `expo-font` ile çalışma anında yüklenir ve native değişiklik değildir. Poppins ve Manrope paketleri 4.8'de kalkar.
- **Gradyanlar:** `react-native-svg` ile (`LinearGradient`).
- **Bileşenler** (`src/components/`):
  - düz düğmeler (gradyan ve 3B gölge yok), 56 px oyun düğmesi (ana düğme beyaz zemin üstünde oyun renginde yazı, yan düğme saydam beyaz);
  - kart, alt sayfa, çip, kapsül avatar (§4.D);
  - çubuk ikon ailesi ve zil: çok renkli olduklarından `src/theme/barIcons.ts`'te tanımlı ve react-native-svg ile çizilir (`components/BarIcon.tsx`); `scripts/icon/glyphs.ts`'in tek renkli PNG'lerine girmez (4.2b);
  - halka sayaç, süre çubuğu (son 5 sn turuncu), üstte beliren kısa bildirim, 3-2-1 geri sayım, konfeti;
  - sohbet duvar kağıdı: önceden çizilmiş tek görsel; mesajlar üstünden kayar (`ChatScroll` aynen), yazma alanı yüzer. `src/theme/chatWallpaper.ts`: alanı kaplayan tek SVG, bir kez çizilir (4.2b; ekranlara 4.3'te girer).
  - 4.2b'de: oyun parçaları `src/components/game/`'te (süreler `src/theme/gameMotion.ts`), kapsül avatar `src/theme/capsules.ts` ve `components/CapsuleAvatar.tsx`. Hareketler ve tasarım sisteminin yenilenmesi 4.2c'de.
  - 4.2c'de: hareketler `src/theme/playMotion.ts`'te (eğriler, süreler, anahtar kareler; testli), bileşenleri `src/components/game/` (`TiltDeck`, `RoleCard`, `LetterWheel`, `Vinyl` ve `Equaliser`, `DialCover`) ve `components/BarIcon.tsx` (zil, ikon yayları); tasarım sistemi v45'e göre yenilendi.
- **Hareket:**
  - korunanlar: Buluş, Kesişme, Tahterevalli, boş durum, Dönüş ve ikon yayları (ikon yayları çubuk ikonlarla birlikte 4.2c'de gelir; kareler JS'de, yalnızca hareket sürerken çizilir, uzun listelerde açılmaz);
  - yeniler: kart eğilmesi, rol kartının dönmesi, harf çarkı, plak ve ekolayzer, İbre örtüsünün açılması, zilin sallanması ve rozetin zıplaması;
  - kart eğilmesi ve ibre `react-native-reanimated` ile arayüz iş parçacığında, dokunuşlar `react-native-gesture-handler` ile. Kart parmağı sahiplenmez (karttaki düğmeler ve kaydırma çalışır). İbre arayüz iş parçacığına İbre ekranıyla ve canlı ibre kanalıyla 4.6.5'te geçer; 4.2c bugünkü ibreye dokunmaz;
  - ekran dışındaki hareketler durur; hareketi azalt açıkken hepsi durur ya da yalnızca saydamlık değişir;
  - eğriler `src/theme/` altında testli kalır (`markMotion.ts`, `launchMotion.ts` kalıbı).
- **Dokunuş:** yalnızca `haptic(an)`. v43'teki anlar (kapma, rakip düğmesi, son saniyeler, yanıt eşiği) `hapticMoments.ts`'e eklenir. Sıklık sınırı (K-30, 4.2b): aynı an 600 ms'den sık çalmaz, iki titreşim arasında en az 150 ms olur, yazarken titreşim yok. Sınır saftır ve testlidir (`hapticMoments.ts`); `haptics.ts` her titreşimde uygular. Sekme değişimi sınırdan muaftır (`tabChanged`; proje sahibi, 21 Ekim, 0.6.0 telefon testi: hızlı geçişte 600 ms kuralı her ikinci değişimi yutuyordu): sekme çubuğunda başka bir sekmeyi açan her basış hissedilir, Mekan sekmesinin masasızken Keşfet'i açması da. Sonraki başka bir titreşim ondan yine 150 ms uzak durur.
- **Ekran davranışı** (CLAUDE.md) aynen geçerlidir. v43 320x568, 360x640 ve 400x780'de, yazı yüzde 130 büyükken sınandı. Plus Jakarta Sans geniş bir yazı tipidir: her ekran 320 dp'de ve en büyük yazı boyutunda yeniden ölçülür (E2E'nin büyük yazı koşusu).

**Ekranlar, bugünkü mantıkla (adım 4.3).** Sunucu yalnızca K-34'ün denetimi için değişir; her ekran ayrı PR olabilir.

- **Mekan:**
  - Üst satır: solda "Mekandan ayrıl" (kırmızı çubuklardan çarpı), ortada logo, sağda profil fotoğrafı. Anonim anahtarı 4.4'le gelir; 4.3'te görünmez.
  - Mekan sohbeti kartı ve masa kartı sabittir; masalar altlarından kayar. Mekan sohbeti kartında aktiflik noktası vardır: son 10 dakikada mesaj varsa yanar (K-12).
  - Masa kartı: "Lobiye aç" ve "Davet et". 4.3'te "Davet et" bugünkü açıklama sayfasını açar (masanın adını söyle, arkadaş "Bu masadayım"a bassın). Gerçek davet 4.7'de gelir.
  - Lobi: yükleniyor (Tahterevalli), boş ve dolu hâller; istek durumlarında Buluş, Kesişme, çarpıp geri çekilme; geri sayım metinde.
- **Mekan sohbeti:** v44 görünümü (duvar kağıdı, yüzen yazma alanı, balon içinde ad). Kişi görünümü ve sessize alma 4.4'te.
- **Masa:** sabit üst alan (geri, masa adı ve kişi sayısı → Masadakiler; sahipte "Bitir", katılımcıda "Ayrıl"; sahipte altında "Lobiye aç" ve "Davet et"), "Oyun Seç" ve "Masa Sohbeti" sekmeleri, kategori çipleri ve altı animasyonlu poster. 4.3'te poster bugünkü öneri ve kabulü açar; oylama 4.5'te gelir. Sahip çubuğu K-39, "Diğer" menüsü K-40.
- **Mesajlar** (Sohbet ve İstekler sekmeleri), DM, Profil, Arkadaşlar, Profili düzenle, Aktiviteler, Keşfet: v44 görünümü, bugünkü veriyle. Aktiviteler'de kampanya ve "ilgileniyorum" yoktur (K-15).
- **Oyun ekranları** 4.3'te bugünkü oyun ekranlarıdır (yeni tokenlar ve yazı tipiyle). v44'ün oyun ekranları her oyunun 4.6 adımında gelir.
- **İlk ekran ve kayıt** (v45): kayıt ekranları v45 görünümüyle, sırası K-19'a göre: Başlamadan önce, telefon, kod, ad, doğum tarihi, cinsiyet, fotoğraf (v45 raporu §1). Kapsamda ilk ekran giriş animasyonu ve kayıt adımlarındaki kapsül dostları (v45):
  - İlk ekranın düğmesi "Başla"; önce "Başlamadan önce" açılır (K-26). Son adımın düğmesi "Bitir", fotoğraf yoksa "Fotoğrafsız bitir" (K-29).
  - Doğum tarihi adımından sonra onay alt sayfası (K-55, K-63). Metni v46'daki gibidir: "N yaşındasın" ve "Doğum tarihin 5 Nisan 2001. Sonra değiştiremezsin."
    - Onayla Cinsiyet adımına geçer, Düzelt adımda bırakır.
    - 18 yaş altı da aynı akıştan geçer: Onayla'dan sonra "skall 18 yaş ve üzeri içindir" ekranı gelir (v46 raporu, bölüm 6).
    - Yalnızca istemci; doğum tarihi bugünkü gibi `account/complete-onboarding`'de yazılır.
  - Sahne `LaunchCurtain` bittikten sonra başlar; v45'teki perde taklidi uygulamaya girmez. Sahne kısadır: yaklaşık 5 saniye, tek sefer, döngü yok (K-27). "Geç" ya da "Başla" sahneyi hemen son hâline getirir. "Başlamadan önce"den geri gelinince sahne durağan gelir, yeniden oynamaz (K-28).
  - Hareketi azalt açıkken (`useReducedMotion`) sahne son hâlinde ve durağandır; dostlar kaymadan görünür, zıplama, sallanma, konfeti ve parlama olmaz.
  - Sahne ekran okuyucuya kapalıdır; kapsüle dokununca zıplar (proje sahibinin kararı, v45 §2; dokunuşun bırakılmasıyla, kaydırma başlatan dokunuş zıplatmaz). Dostlar ekran okuyucuya kapalıdır ve dokunulmaz. Dost hiçbir yazının, alanın ya da düğmenin üstüne binmez: binecekse en çok 18 dp yukarı kayar, yine binecekse o adımda görünmez (v45 raporu §3). 320 dp ve en büyük yazıda doğum tarihi adımında dostun gizlenmesi kabul (K-31).
  - Dost başını yalnızca ekrandaki bir hata metniyle birlikte sallar; hatayı her zaman metin söyler.
  - Hesap açılınca tek bir başarı titreşimi: yeni an `accountReady` (`notification: success`), `hapticMoments.ts`'te. Sıklık sınırı (K-30) 4.2b'de gelir (aşağıda "Dokunuş"). Dost kendi başına titreşim üretmez.
  - Yeni native paket yok: `react-native-reanimated`, `react-native-svg` ve `expo-haptics` kurulu. Kapsüller kapsül avatarından zemin dairesi olmadan, masalar, lambalar ve ışık konisi `react-native-svg` ile çizilir; görsel dosya yok. Sahnenin zamanlama tablosu saf bir modülde durur ve testlidir (`launchMotion.ts` kalıbı).
- **Biyografi ve görünen ad** (K-34): telefon, e-posta, kullanıcı adı ya da bağlantı içeren biyografi ve görünen ad reddedilir (maskeleme yok). Denetim `pure/profanity.ts` ve `trText.ts` içindedir (kural 7); kayıt ve Profili düzenle aynı denetimi istemcide gösterir, profil fonksiyonu sunucuda uygular. Biyografi sınırı 80; mevcut uzun biyografiler düzenlenene kadar kalır.
- **Alt sekme etiketleri** en büyük yazıda en çok 1,2 kat büyür (`maxFontSizeMultiplier={1.2}`); 320 dp'de sığmazsa 1 (K-23).
- **Görünüm ayarı** (K-54): Ayarlar'da Sistem, Açık, Koyu; varsayılan Sistem; seçim yalnızca telefonda saklanır (`AsyncStorage`). Yalnızca istemci, OTA. Bugünkü "Tasarım (test)" seçicisi buna dönüşür; E2E'nin tema seçimi bu ayarla yapılır.
- **v46'nın kontrast ve koyu harita düzeltmeleri** (K-65; v46 raporu, bölüm 8) 4.3'ün kalan OTA işleridir:
  - yer tutucu yazı açıkta `#6E6890`, koyuda v45'in `#ADA8C8`'i;
  - oyunlardaki beyaz açıklama yazıları tam beyaz;
  - "İtiraz"ın koyu örtüsü, iki temada;
  - Keşfet haritasında yol ve nehir adlarının renkleri ve koyu temada koyu harita.
    - Uygulamadaki harita v46'daki gibi bir çizim değil, MapLibre haritasıdır (OpenFreeMap stili).
    - Koyu harita ve ad renkleri bu stilin katmanlarında ayarlanır ve PR'da açık ve koyu ekran görüntüsüyle gösterilir.
  - Süresi geçmiş bildirim satırı (%64) bugün yok; zil listesiyle 4.7'de bu değerle gelir.
- **"Tabu" kelimesi** kullanıcıya görünen metinlerden 4.3'te kalkar:
  - Oyunun adı tek sabitten gelir: `supabase/functions/_shared/pure/brand.ts` → `GAME_NAMES` (`tabu: 'Kapsül Anlat'`); `tr.ts` ve mağaza metinleri oradan okur.
  - Rakip düğmesi "Yasak!", "Tabu avcısı" ödülü "Yasak avcısı" olur (K-5).
  - `tr.ts`'te ve `docs/store/`'da "Tabu" kelimesinin geçmediğini bir birim testi denetler (Faz 3'teki "oda" testinin kalıbı).
  - Kod, tablo, içerik dosyası ve kavram adı (`tabu`) değişmez.
- **Keşfet ve Aktiviteler** (kural 6):
  - Konuma göre sıralama yoktur. v43'teki "Yakındaki" listesi ve Aktiviteler'deki "Yakınındaki mekanlardan" başlığı kalkar. Şehir ve semt seçilir (v44); liste bugün etkinliği olan mekanlarla başlar, sonra ada göre sıralanır (K-21).
  - Açık masa sayısı kesin sayı değil, aralıktır: metin bugünkü kovadan (`venue_activity`) gelir, "Sessiz", "Birkaç açık masa", "Kalabalık" (K-16, K-41). Sayım satırı K-42, satıra basınca açılan sayfa K-43, etkinlik kapağı K-44.
  - "Şu an buradasın" kartı kişinin kendi check-in'idir (kendi verisi; kimseyle paylaşılmaz).
  - Mekan adlarına sınır konmaz: adlar içerikten gelir, ekran en çok iki satıra kırar ve gerekirse küçültür (Ekran davranışı).
  - Tek aktif mekanda Keşfet mekanın kartıdır (K-37); varsayılan şehir ve şehir düğmesi K-38'de. Aktiviteler yalnızca bugünün etkinliklerini gösterir (K-15).
  - Mekan türü (proje sahibinin kararı): `venues.category` `kafe`, `cay_bahcesi` ya da `yemek`; içerikte mekan başına elle (`category`, boşsa `kafe`), Keşfet listesi (`explore_venues`) taşır. Kampüs türü değildir: `kind` ile ayrı kalır ve türü yoktur.
- **Bildirim düğmesi** yalnızca Mesajlar'da (K-6, §4.G). Proje sahibi 20 Ekim'de 4.7'den öne aldı; Keşfet ekranının PR'ında Keşfet, Aktiviteler ve Profil'in başından kalktı. Bekleyen istek ya da okunmamış mesaj varken alt çubuktaki Mesajlar sekmesinde nokta görünür; ekran okuyucu ikisini ayrı okur ("Mesajlar, 1 okunmamış, 2 yeni bildirim"). Zilin içeriği bugünkü gibi (sayısı bekleyen istekler, Bildirimler sayfası); v43'ün zili ve listesi 4.7'de gelir.
- **Mekan ve masa (adım 4.5b):**
  - **Masa kur'da ad önizlemesi yok:** v46 sayfada adı ve "Başka ad"ı gösterir. Sunucu adı masa kurulurken üretir ve yenileme masaya bağlıdır (`rooms/reroll-name { roomId }`), bu yüzden ad masa kurulunca görünür ve "Başka ad" Masadakiler'deki sahibe özel ad kutusundadır (v46: `.renamebox`, aynı haklar).
  - **"Lobiye aç" etiketleri:** v46'nın "Masanı lobiye aç" sayfası niyet ve oyun etiketini taşır (SPEC_V3 §23.C aynen). Masa önce kurulup sonra lobiye açıldığı için etiketler `rooms/set-visibility { open, intent?, gameTag? }` ile gider; lobiden çekmek onları siler (`20261109090000_lobby_tags.sql`).
  - **Davet'te "Masanda" yok:** v46 masadaki arkadaşın satırında "Masanda" yazar. Masadakiler profil kimliği taşımadığından (kural 4) uygulama bunu bilemez; satır "Davet et" kalır, sunucu masada oturan arkadaşa giden daveti sessizce yok sayar.
  - **Sahibin "Masadan ayrıl"ı** (K-13, K-40) "Masayı bitir?" sayfasında ikinci düğmedir; v46'da bu yol çizilmemiş.
  - **Gelen istek** v46'da masa ekranının üstündeki satırdır (`data-req`); uygulama bugünkü genel istek kartını korur (her sekmede 60 saniye kaçmaz). Satır görsel adımda gelir.
  - **Kapsül görünüşü:** anonim kişinin kapsülü (4.4'ün katalogu) uygulamada henüz çizilmiyor; anonim kişi adıyla ve varsayılan yüzle görünür. Kapsül çizimi 4.4'ün istemci adımıyla gelir.

## 4.D Kimlik ve mekan sohbeti (adım 4.4)

**Kapsül ve nick.**

- Her hesabın bir kapsül görünüşü ve bir nick'i vardır.
  - Kapsül görünüşü (K-46): `profiles.capsule_look`, kısa bir metin kodu (ör. `c:pembe e:koyu h:kulaklik`): renk ve parçalar. Ölçü hep aynıdır. Başlangıç görünüşü cinsiyetten türetilmez (K-50, kural 12).
  - Hazır görünüşler v46 kataloğundaki 28 koddur (`hazir_gorunusler`, K-61); kayıtta biri rastgele atanır.
    - Çoğu bugünkü 28 varyantla aynı görünür.
    - Melek ve Tavşan krem gövdeli, Viking boynuzlu ve sakallıdır, v46'daki gibi.
    - Kütüphaneye beyaz renk ve miğfer eklenmez: her hazır görünüş kütüphanedeki parçalardan kurulur.
  - Katalog (renkler, parçalar, raflar ve paketler) `content/` altında JSON'dur. 4.4 onu `docs/design/v46/kaynak/kapsul/kapsul-katalogu.json`'dan üretir.
    - İstemci çizim için, sunucu doğrulama için aynı listeyi `pure/` altında üretilmiş bir dosyadan okur; ikisinin eşitliği testlidir (`pnpm seed` kalıbı).
    - Sunucu kodu katalogla doğrular, bilinmeyen parçayı atar.
  - Nick: `kapsul-xx55` biçimi; iki harf (`abcdefghkmnprstuvyz`) ve iki rakam.
- **Hesaba sabittir** (§4.B-6) ve hesapla silinir; yalnızca nick metni, yeniden verilmesin diye emekli listesinde kalır (aşağıda). Profil'den 30 günde bir yenilenir (K-9). Nick yenileme ekranı görünüşün aynı kaldığını söyler: yalnızca nick değişir ("Yenilersen yeni bir ad alırsın; kapsülün aynı kalır.", v46).
- **Atama sunucudadır ve saklanır.** v43'teki "aynı ad hep aynı kapsül" denemenin tohum davranışıdır; uygulamada değer atama anında yazılır: `profiles.capsule_nick` (benzersiz) ve `profiles.capsule_look` (K-46). Kayıtta (`account/complete-onboarding`) atanır; mevcut hesaplara 4.4'ün migration'ı atar.
- Kaba kısaltmalar (`am`, `mk`, `sk`, `sg`, `gt`) ve sayılar (`31`, `69`) üretilmez. Liste `content/profanity-tr.json`'a taşınır; üretim `pure/capsule.ts`'tedir ve testlidir.
- **Kapasite:** `kapsul-xx55` biçimi 19 × 19 × 100 = 36.100 nick verir; elenen kısaltma ve sayılar bunu azaltır. Nick benzersiz ve hesaba sabit olduğu için doluluk arttıkça rastgele üretim çakışmaya düşer.
  - Doluluk (atanmış ve emekli nick'ler) biçimin kapasitesinin (elenenler çıkmış) yüzde 50'sini geçince yeni nick'ler 3 rakamlı biçimden üretilir (`kapsul-xx555`). Mevcut nick'ler değişmez. Kapasite, doluluk ve eşik `pure/capsule.ts`'tedir, testlidir.
  - **Silinen hesabın nick'i yeniden kullanılmaz:** yeni sahibi eski kişiyle karıştırılırdı. Yenilenen nick de aynı işlemde emekliye ayrılır ve kimseye verilmez (K-9). Hesap silinirken nick `retired_capsule_nicks`'e yazılır: yalnızca nick metni; hesapla bağı ve tarihi yoktur (§4.H).
  - Nick, `complete-onboarding`'de 18 yaş denetiminden sonra atanır; 18 yaş altı beyanında nick atanmaz ve hiçbir şey kalmaz (kural 11).
- **Görünüş yazıldığı anda saklanır** (nick gibi): anonim mesaj ve masadaki anonim kişi, o anki görünüşü kendi satırında taşır. Mekan sohbetinde `venue_chat_messages.sender_look`, masa sohbetinde `messages.sender_look`, masada `room_members.look`. Masadaki görünüş masa süresince sabittir (K-10 gibi). Görünüş değişince (süsleme, 4.4b) ya da nick yenilenince eski mesaj eski nick ve görünüşle döner; yeni görünüş yeni mesajlarda ve bir sonraki masada geçerlidir. Profilli mesajda ve profilli kişide kolon boştur: profilli kişinin görünüşü yazılmaz, anonim kimliğiyle eşleşirdi (kural 4).
- **Nick profil kimliği değildir.** `public_id` ile ilişkisi hiçbir yanıtta görünmez; nick ve görünüş kolonları istemciye kapalıdır (`gender` kalıbı), nick ve görünüş yalnızca bir bağlamda (anonim mesaj, masadaki anonim kişi) birlikte o bağlamın kitlesine gider (kural 4).
- **Profillerde kapsül** (K-49): kapsül ve nick profil ekranlarında yalnızca kişinin kendi profil sekmesinde, fotoğrafla yan yana ve "Masada görünen" işaretiyle görünür. Başkasının profilinde, arkadaşınki dahil, hiçbir ekranda kapsül ya da nick görünmez: anonim kimlik gerçek kişiyle eşleşirdi (kural 4). `profile/get` başkası için `capsule_look` ve nick taşımaz. Kendi profilindeki "Anonim adın" kartında kapsül yoktur: yalnızca ad ve açıklama. Kapsül profilde yalnızca fotoğrafla yan yana görünür (K-60).
- **Bilinçli bedel:** nick hesaba sabit olduğu için anonim kişi ziyaretler arasında aynı nick'le tanınır. Bu proje sahibinin kararıdır; gizlilik politikasında açıkça yazılır (§4.L).
- **Kapsül süsleme** (adım 4.4b, K-47): Profil'den açılan ekran. Raflar, paketler, yuvalar; Karıştır, Hepsini çıkar, Kaydet. Kaydet `profile/set-look { look }` ile yazar; sunucu görünüşü 4.4'teki gibi katalogla doğrular.
  - İstek yalnızca `look` taşır (başka alan `bad_request`): kişi yalnızca kendi görünüşünü yazar. Yanıt yazılan kodu döner (`{ capsuleLook }`); bilinmeyen parça atılır, hiçbir renk ya da göz tanınmazsa çizimin varsayılanı (kataloğun ilk rengi, klasik göz) yazılır (adım 4.4b).
  - Süsleme düğmesi profildeki kapsülün sağ altındadır. Profil açılınca iki kez oynar ve 3,1 sn'de durur; hareketi azaltta hiç oynamaz (K-60).
  - Raflar cinsiyetsiz adlıdır (v46'daki adlar; K-50).
  - Katalogdan "Yıldız bıçak" ve "Fes" çıkar; kalp, hayvan kulakları, nazar, çay ve simit kalır. Mevsim paketleri bütün yıl açıktır (K-51).
  - Duygular yalnızca kişinin kendi ekranındadır: sunucuya gitmez, kaydedilmez. "Kafama dokun" ipucu kurulumda bir kez gösterilir (K-52).
  - Listelerde (mekan sohbeti, masa, oyun) görünüş kodu başına bir kez çizilir ve önbelleğe alınır (4.3c'nin kapsül avatar kalıbı, §4.M).
- **Üç görünüm:**
  - fotoğraflı profil: fotoğraf ve gerçek ad;
  - fotoğrafı sonradan gizlenen ya da kaldırılan profil: soluk "hayalet" kapsül ve gerçek ad;
  - anonim: kapsül ve nick.
- **Fotoğraf şartı** (K-4): profilli görünmek profil fotoğrafı ister. Fotoğrafı olmayan (ya da fotoğrafı gizlenmiş: `photo_hidden_at` dolu) kişi profilli kimlik seçemez ve profilli olması gereken yere giremez (`photo_required`, SPEC_V3 §22.G karar 8 aynen). Soluk kapsül yalnızca fotoğraf, kişi zaten profilli görünürken gizlendiyse ya da kaldırıldıysa görünür. Masa kuramayan ve katılamayan fotoğrafsız profilli kadına "Fotoğraf ekle"nin yanında "Anonime geç" de önerilir (K-20); erkek ve belirtmeyende yalnızca "Fotoğraf ekle".

**Anonim anahtarı.**

- Mekan ekranının üst satırındadır; açık anonim demektir.
- Check-in başında değeri `profiles.default_participation`'dır: Ayarlar → "Oyunlara katılım", girişteki varsayılan (v44); kendi varsayılanı anonimdir. Fotoğrafı yoksa ya da gizliyse giriş anonim başlar: profilli kimlik fotoğraf ister (K-4).
- **Erkek ve belirtmeyen** (K-3; kural 12 yalnızca oyun akışı için, aynen):
  - Mekan sohbetinde anonim yazabilir. Bu hesaplar için anonim seçim yalnızca mekan sohbetini etkiler: `identity_mode` onların mekan sohbeti kimliğidir.
  - Oyun akışında ve masada her zaman profillidir. Masaya girişte (masa kurma, Katıl, Bu masadayım, davete katılma) `room_members.profiled = true` ve `alias` gerçek addır; check-in'in anonim kimliği masaya taşınmaz. Fotoğrafı yoksa masaya giremez (`photo_required`).
  - Check-in başına 1 değişiklik kuralı onlar için de geçerlidir.
  - Ayarlar'daki "Oyunlara katılım" onlarda da görünür ve yalnızca mekan sohbetindeki girişteki varsayılanı belirler (K-22). Gerekçe: yoksa hep anonim yazmak isteyen biri her girişte tek değişiklik hakkını harcar.
  - Uygulamada seçim onlarda masaya giden bir anahtar olarak değil, yalnızca mekan sohbetini etkileyen bir seçim olarak görünür ve masaya taşınmadığını söyler (v44, §4.C).
  - Masaya giriş isteği açıkça anonim katılım isterse sunucu `anonymous_not_allowed` döner, sessizce profilliye çevirmez (SPEC_V3 §23.D aynen). 4.5'e kadar eski masa modelinde "Masanla oyna" bugünkü gibi oyun akışı sayılmaz.
- Cinsiyeti boş hesap oyun akışına ve masaya giremez (`gender_required`); check-in ve mekan sohbeti bunu istemez.
- **Check-in başına 1 değişiklik** (K-3; K-48: v46'da da 1).
  - Check-in'in kimliği `table_sessions.identity_mode` (`anonymous` | `profiled`; kadında mekan sohbetinde ve masada, erkek ve belirtmeyende yalnızca mekan sohbetinde) ve değişiklik sayısı `table_sessions.identity_switches` (0 ya da 1).
  - Anahtar `checkin/set-identity { anonymous }` ile değişir; ikinci değişiklik `identity_switch_used` (409), fotoğrafsız profilli seçim `photo_required` (409) döner. Cinsiyet istemez ve `anonymous_not_allowed` döndürmez (o iki kod masaya giriş içindir, yukarıda); aynı kimliği yeniden seçmek hak harcamaz.
  - Açık bir isteği varken (bekleyen ya da süresi dolmamış reddedilen; kural 5) değişiklik `request_pending` (409) döner: sahip isteğin geldiği kimliği görür (`rooms/request-profile`), kişi masada öteki kimlikle oturursa ikisini birbirine bağlardı (kural 4; adım 4.5, CTO incelemesi, WazzupDevs/Kabuk#183). İstek kabul edilince ya da bitince değişiklik yine serbesttir.
  - Uygulama değiştirmeden önce sonucunu söyler: hakkın bu check-in'de biter, yeni mesajların yeni kimlikle görünür. Metin v44'te.
  - Faz 2'nin mekan sohbetine özgü seçimi (`table_sessions.venue_chat_profiled`, `venue_chat_mode_locked`) bu modele taşınır; kolon 4.8'de kalkar.
- **Değişiklikten önce yazılan mesajlar eski kimlikte kalır.**
  - Mesaj kimliği yazıldığı anda saklar: mekan sohbetinde `venue_chat_messages.profiled`, `sender_alias` (anonimde nick) ve `sender_look` (anonimde görünüş), masa sohbetinde `messages.sender_alias`, yeni `messages.profiled` ve `messages.sender_look`.
  - Okuma eski mesajı eski kimlikle döner. Anonim mesajda fotoğraf, ad ve `public_id` asla gitmez (SPEC_V3 §7.2 aynen).
- **Masada:** kişinin masaya girdiği andaki kimliği `room_members.alias`, `profiled` ve `look`'a (anonimde görünüş) yazılır (masayı kurarken, katılırken, davetle); erkek ve belirtmeyende her zaman profillidir (yukarıda). Masadaki kimlik masa süresince sabittir: anahtar değişirse, görünüş değişirse ya da nick yenilenirse yeni kimlik mekan sohbetinde ve bir sonraki masada geçerli olur (K-10).
- **Zamanlama:** anahtar bir kez değişince sonraki mesajlar yeni kimlikle gider. Mekan sohbetini izleyen biri iki kimliği zamanlamayla eşleyebilir. Hak check-in başına 1 olduğu için bu en çok bir kez olur; değiştirme onayı bunu söyler.
- **Eski istemci koruması:** `venue-chat/send` kimliği check-in'den okur; istek gösterdiği kimliği tam olarak bir alanla söyler (ikisi de yoksa ya da ikisi birden varsa `bad_request`).
  - Yeni uygulama `identity` gönderir; check-in'in kimliğinden farklıysa `identity_mismatch` (409) döner, mesaj yazılmaz (Faz 2'nin gerekçesi: anonim sanılan bir mesajın profilli gitmesi gizlilik hatasıdır).
  - Bugünkü uygulama her mesajda `profiled` gönderir ve kimliği ilk mesajla seçer (SPEC_V3 §22.G). Sunucu bu ilk mesajı check-in'in tek değişikliği sayar (aynı kimlikse hak harcanmaz); sonrası bugünkü gibi `venue_chat_mode_locked`. Böylece bugünkü uygulama bozulmaz ve anonim sanılan mesaj yine profilli gitmez. `profiled` alanı 4.8'de kalkar (`docs/decisions/4.4-kimlik.md`).

**Mekan sohbetinde kişi görünümü.**

- Kişi fotoğraf ve gerçek adla ya da kapsül ve nick'le görünür; **masa adı hiç geçmez** (§4.B-7).
- Ad balonun içindedir ve kişiye göre sabit renktedir. Art arda gelen mesajlar tek avatarla dizilir. Telefon bunu yanıttaki `senderKey`'den yapar:
  - `senderKey` sunucuda hesaplanan opak bir anahtardır: göndericinin hesabı, kimliği (anonim ya da profilli), yazdığı ad (nick ya da görünen ad), mekan ve gün üzerinden. Yenilenen nick bu yüzden aynı gün de eskisine bağlanmaz (K-68).
  - Aynı kişinin anonim ve profilli mesajları farklı anahtar alır. Anahtar iki kimliği bağlamaz, hesap id'si ve `public_id` taşımaz.
- **Mesaja basılı tutunca:** tepki, Yanıtla, Bildir; kendi mesajında Sil (SPEC_V3 §21; Sil yeni, aşağıda).
- **Kişiye dokununca:** Profili gör (anonimde kapalı), Sessize al, Bildir.
- **Kendi mesajını silme (v43'ten):** `venue-chat/delete { messageId }`. Mesaj herkes için kalkar; şikayet kopyası (`reports.messages_snapshot`) etkilenmez.
- **Aşağı in düğmesi** yeni mesaj sayısını gösterir (telefonda sayılır).
- **"yazıyor" balonu** pilotta yoktur (K-11): üçüncü bir istemci yayın kanalı isterdi (kural 9). v44'te çizili; uygulanmaz.

**Sessize alma (yeni).**

- Kişiyi sessize alan, o kişinin **o kimlikteki** mesajlarını görmez. Sessize alınan bunu hiçbir biçimde görmez.
- **Kimliğe bağlıdır:** anonim nick'i sessize almak aynı kişinin profilli mesajlarını gizlemez, tersi de. Gizleseydi iki kimlik eşleşirdi (kural 4).
- Sunucuda tutulur: `venue_chat_mutes (id, user_id, muted_user_id, profiled, label, created_at)`. `label` sessize alma anındaki nick ya da görünen addır.
- `venue-chat/mute { messageId }`: sunucu göndericiyi ve kimliği mesajdan bulur; istemci hesap id'si görmez. `venue-chat/unmute { muteId }`.
- Liste `venue_chat_mutes_of(user)` (service role) üzerinden `venue-chat/mutes` ile gelir: etiket ve tarih. Hesap id'si gitmez.
- Okuma (`venue_chat_page_for`) sessize alınan kimliğin mesajlarını döndürmez.
- **Tüm sohbeti sessize alma:** mekan sohbeti bugün push göndermez (SPEC_V3 §7.4). v43'teki "Yeni mesajlar bildirim göndermez" bu yüzden mekan kartındaki aktiflik noktası ve okunmamış sayısı içindir; tercih yalnızca telefonda tutulur, aktiflik noktasını ve okunmamış sayısını kapatır (K-11).

**Erişim.** 4.4'te bugünkü gibidir (check-in ile masa oturumu aynı kayıttır). 4.5'ten sonra "mekanda check-in'i olan" okur ve yazar (§4.E); koşul kaydı değişmez: `table_sessions.status = 'active' and expires_at > now()`.

## 4.E Check-in, masa ve katılım (adım 4.5)

**Check-in.**

- Check-in kişinin mekanda bulunmasıdır. Kaydı `table_sessions`'tır: ad değişmez, Faz 4'ten sonra anlamı "check-in"dir.
- Konum doğrulaması, nokta (`spot_id`), 4 saat süre (`TABLE_SESSION_HOURS`) ve "Mekandan ayrıl" aynen kalır.
- **Check-in masa kurmaz:** kişi sayısı sorulmaz (`headcount` yazılmaz), masa adı üretilmez. `checkin/check-in { venueId, lat, lng, accuracy, spotId? }`.
- Check-in'i olan kişi mekan sohbetini okur ve yazar, lobiyi ve süren masaları görür, masa kurar, istek gönderir, davet alır.
- **Giriş alt sayfası** (K-43): Keşfet'te satıra basınca v44'ün giriş alt sayfası açılır (mekanın adı, kampüste nokta çipleri, kimlik notu, "Giriş yap"); bugünkü mekan sayfasının yerini alır. 4.3'te bugünkü mekan sayfası v44 görünümüyle açılır.
- Yeni check-in eski check-in'i bitirir; kişi bulunduğu masadan ayrılmış sayılır (aşağıda "Ayrılma ve sahiplik").

**Masa.**

- Masa, bir kişinin kurduğu `rooms` satırıdır. Kuran sahiptir (`rooms.owner_session_id`).
- **Masanın adı** masa kurulurken üretilir: `rooms.name` (bugünkü takma ad kelimeleri, `alias_words`). Sahip adı masa başına 3 kez yeniler (bugünkü `ALIAS_REROLLS_PER_CHECKIN`, artık masa başına: `rooms.name_rerolls`).
- **Masa simgesi** (adım 4.5, K-45):
  - 20 temada 100 sahne; uygulamada 256 px WebP (`apps/mobile/assets` altında; SVG canlı çizilmez). Köşeleri yuvarlatılmış karedir (yarıçap kenarın %28'i); kişiler yuvarlaktır.
  - WebP'ler ve liste `docs/design/v46/kaynak/masa-simgeleri/`'nden üretilir (görseller ve `masa-simgeleri.json`). Boyutlar v46 raporunun 1. bölümündedir.
  - `rooms.icon` simgenin kalıcı kimliğidir, metin (ör. `kis-kardanadam`). Sunucu kimliği `pure/` altındaki üretilmiş simge listesiyle doğrular; listede olmayan kimlik reddedilir.
  - Sunucu, mekandaki açık ve süren masalarda kullanılmayan bir simgeyi rastgele atar (`rooms.icon`). Aynı anda kurulan iki masada tekrar olmaz: mekan ve aktif masa üzerinde benzersizlik, çakışmada yeniden seçim.
  - Sahip kurarken seçebilir ve sonra değiştirebilir (`rooms/create { icon? }`, `rooms/set-icon`); ad değişince simge kalır.
    - Sonradan değiştirmek (K-59): sahip, masa ekranındaki ya da Mekan'daki kendi masa kartındaki simgeye dokununca Masa kur'daki seçici açılır.
    - Başkası dokununca bir şey olmaz. Yeni çizim yok.
  - Görünür: lobide, süren masalarda, istek satırında, Masadakiler'de ve masa ekranının üst satırında.
    - Üst satırda simge 36 px'tir, harfli yuvarlağın yerini alır; sahipte ve katılımcıda aynıdır (K-58).
    - Simge kimse hakkında bilgi taşımaz.
- **Durumlar:** lobide değil (`visibility = 'private'`), lobide açık (`'open'`), kapalı (`status = 'closed'`).
  - Tek kişilik masa da masadır. "Masanla oyna" ayrı bir mod olmaktan çıkar: lobide olmayan masa kendi içinde oynar.
- **En çok 12 telefon:** `pure/tables.ts` → `MAX_TABLE_PHONES = 12`; SQL karşılığı `private.max_table_phones()` bir testle aynı değeri verir (`max_side_phones` kalıbı).
- **Masadaki her kişi** bir `room_members` satırıdır: `alias` (girişteki kimliğin adı: nick ya da gerçek ad) ve `profiled`. Taraf (`side`) yoktur.
- Bir kişi aynı anda tek masadadır (bugünkü kısmi benzersiz indeks, `left_at is null`).
- Masa sohbeti (`messages`) ve oyunlar masanındır. Masa sohbetinde kişi nick'iyle ya da gerçek adıyla görünür; masa adı ya da grup adı ("Can · Neşeli Panda") görünmez.

**Masa kur.** `rooms/create { open?, intent?, gameTag? }`.

- Kişinin masası varsa `already_in_table` (409).
- Lobiye açma ve çekme: `rooms/set-visibility { roomId, open }`, yalnızca sahip. "Masanı lobiye aç" sayfası (niyet etiketi ve oyun etiketi, SPEC_V3 §23.C) aynen.

**Katılma yolları.** Üçü de 12 telefon sınırıyla. Toplamı 12'yi aşacak istek gönderilemez (`table_full`, 409); sınır kabul anında yeniden denetlenir.

1. **Katıl (lobi, açık masa):** `rooms/request-join { roomId }`.
   - Bir masanın sahibi kendi masasıyla ya da masası olmayan bir kişi tek başına gönderir. Başka bir masanın katılımcısı gönderemez (`not_owner`); önce masasından ayrılır.
   - Sahip kabul edince istekçi masanın bütün kişileri **aynı işlemde** sahibin masasına taşınır ve istekçi masa sessizce kapanır. Bu, SPEC_V3 §23.C'deki bekleyen masa kalıbıdır; artık her masa için geçerlidir. Taşınanlar kimliklerini korur.
   - İstekçi masanın oyunu sürüyorsa oyun biter (`game_abandoned`).
   - 60 sn, saatte 10 istek, red ve zaman aşımı `unavailable` (kural 5) aynen.
2. **Bu masadayım (süren masalar):** `rooms/request-join { roomId, asMember: true }`.
   - Masası olmayan kişi, fiziksel olarak oturduğu bir masaya tek başına istek gönderir. Kuralı SPEC_V3 §22.C ve kural 5'in Faz 2 ekidir.
   - "Süren masalar" mekandaki lobide olmayan bütün masalardır, tek kişilik masa dahil (teknik karar ve gerekçesi §4.P). Sahip gelen isteği sessizce reddedebilir: red ve zaman aşımı istekçiye aynı görünür (`unavailable`, kural 5).
3. **Davet** (4.7): sahibin davetini kabul eden arkadaş (§4.G).

**İstek kartı** (sahip):

- İstekçi masanın adı ve telefon sayısı.
- Profilli istekçinin, yani isteği gönderen kişinin adı, yaşı ve fotoğrafı (`rooms/request-profile`, SPEC_V3 §23.E aynen; profil kimliği gitmez).
- İstekçi masanın diğer kişilerinin profilleri kabulden önce gitmez. Sahibin masasındaki profiller istekçiye kabulden önce gitmez.

**Kabul buluşmadır** (Faz 3 aynen):

- istekçi tarafta "Kabul edildi, X masasının yanına git";
- sahipte "Y geliyor, N kişi" (v43: "N kişi masanın yanına geliyorlar"), tek seferlik bir bildirim;
- "Geliyor" hâli yoktur (K-69): kabul edilen kişiler kabul anında Masadakiler'e normal üye olarak girer, masa ekranının üst satırı "N kişi" yazar;
- iki masa birbirine istek gönderip aynı anda kabul ederse biri geçer, diğeri `room_not_available` alır (SPEC_V3 §23.K aynen).

**Ayrılma ve sahiplik.**

- Katılımcı "Masadan ayrıl" ile çıkar: mekana döner, masa diğerleri için sürer (`rooms/leave`).
- Sahip "Masayı bitir" ile masayı herkes için kapatır (`rooms/end`; v43'te "Bitir").
- Sahip masadan ya da mekandan ayrılırsa, check-in'i biterse ya da yeni check-in yaparsa sahiplik masaya en erken katılan kişiye geçer ve masa sürer; masada kimse kalmadıysa masa kapanır. "Masayı bitir" ayrıca durur (K-13).
- Masada engel (K-13): sahip birini engellerse engellenen masadan çıkarılır; katılımcı engellerse kendisi çıkar.
- **"Diğer" menüsü 4.5'te** (K-40): Şikayet ve Engelle kişi başına Masadakiler'e taşınır; menüde sahibin "Masadan ayrıl"ı kalır (sahiplik K-13'le geçer). 4.3'te menü bugünkü üç eylemi taşır: liderin "Ayrıl"ı, Şikayet, Engelle.
- Masanın son kişisi çıkınca masa kapanır.
- **Hareketsizlik:** tek kişilik masa 30 dakika hareketsizlikte sessizce kapanır. İki ve daha fazla kişili masa hareketsizlikle kapanmaz (Faz 3 kuralı, "iki taraflı" yerine "iki ve daha fazla kişili"). Lobide bekleyen masaya bekleyen istekler `unavailable` olur.
- Oyundayken masadan ayrılmak oyundan çıkmayı da içerir (§4.F).

**Masa sonu ve arkadaşlık.**

- Masa kapanınca "Masa bitti" ekranı açılır; katılımcı masadan ayrılınca da ("Masadan ayrıldın"). Görünüm v46'nınkidir (K-56, K-64).
  - Listede, masada en az 3 dakika birlikte bulunduğun kişiler. Her satırda sessiz "Arkadaş ekle" (kural 5), anonim katılan dahil.
  - Anonim katılanın adının altında "Anonim katıldı" yazar; yalnızca etikettir, düğmeyi değiştirmez.
  - Basınca düğme "Eklendi" olur; yeniden basmak eklemeyi geri alır (K-67).
  - Karşı taraf da eklediyse "Arkadaş oldunuz" ve "Mesaj". Zaten arkadaş olanlarda düğme yerine "Arkadaşsınız", yalnızca kişi masada profilliyse; anonim oturan kişide düğme normaldir (K-75).
  - Masa süresi ve oyun sayısı yoktur.
  - Mekanizma Faz 3'ünkü (`mutual_friend_intents`). Tek taraf basarsa hiçbir şey olmaz; karşı taraf ne eklemeyi ne geri almayı görür.
- **Çiftler** (K-66, P-15): oyun geçmişi kaydı ve "Arkadaş ekle", masada en az 3 dakika birlikte bulunan her kişi çifti arasındadır. Bugünkü 3 dakika kesişimi geçerlidir; taraf yerine kişi.
  - Birlikte gelenler ayrı tutulmaz: düğme sessizdir ve iki taraf basmadan hiçbir şey olmaz.
  - 3 dakikadan az birlikte bulunan kişi Masa bitti listesinde yoktur ve kayıt almaz.
  - Zaten arkadaş olan çift de kayıt alır (bugünkü gibi); Masa bitti'de ve oyun geçmişinde "Arkadaşsınız" kişi masada profilliyse görünür (K-75).
- **Geri alma** (K-67): "Eklendi"ye yeniden basmak eklemeyi geri alır (`friends/withdraw-add { historyId }`, §4.J). Oyun geçmişindeki düğme de aynıdır.
  - Eşleşme olmuşsa geri alma yok sayılır ve yanıt arkadaş olunduğunu söyler.
  - Karşı taraf bunu hiçbir biçimde görmez (kural 5).
- **Eşleşme bildirimi** (K-70, adım 4.5):
  - Eşleşmeyi kuran basışın karşı tarafına (ilk basana) push gider; ayar `notify_friend_requests`.
    - Yeni kolon yoktur; bildirim ayarlarındaki satır aynıdır.
  - Push mekan ve masa adı taşımaz (bugünkü push ilkesi, SPEC_V3 §18.3a).
  - Eşleşmeyi kuran kişi sonucu ekranında görür ("Arkadaş oldunuz").
  - 4.7'de zil listesinde de bir satır olur (§4.G).
  - Tek taraflı basışta hiçbir şey gitmez (kural 5).
  - v46'daki alt not aynen kalır: "Eklediğin kişi bunu görmez. O da seni eklerse ikinize de haber gelir ve arkadaş olursunuz."
- **Anonim katılanın notu** (K-68): anonim katılan kişinin kendi Masa bitti ekranında, alttaki notun yanında "Arkadaş olursanız anonim adının sen olduğunu görür. İstersen Profil'den adını yenileyebilirsin." yazar.
  - Gerekçe: nick yenilenene kadar kalıcıdır (K-9). K-49 arkadaşa nick'i bu yüzden göstermez; eşleşme ise bu bağı kurar.
- Masa sürerken profilde "Arkadaş ekle" yoktur; profil masa içinde yalnızca görüntülenir. Düğme masa sonunda ve oyun geçmişindedir (K-14).

**Lobi ve süren masalar.**

- **Lobi kartı:** masa adı, telefon sayısı, varsa niyet ve oyun etiketi, "Katıl". Gerçek ad ve 'profilli' işareti lobiye çıkmaz (kural 4, Faz 3).
- **Okuma:** tek RPC `venue_tables(target_venue_id)` → `(room_id, name, phones, open, intent, game_tag, spot_id, spot_name, waiting_since)`. `venue_lobby`, `venue_lobby_phones`, `venue_lobby_tags` ve `venue_running_rooms` 4.8'de kalkar. `public_id`, hesap id'si ve kişi adı taşımaz.
- Lobiye ve süren masalara erişim: check-in'i olan.

**4.5'ten sonra eski oyunlar.** Eski taraf modelinin oyunları yeni masada çalışmaz. Posterleri "Yakında" olarak soluk durur ve basılmaz; her oyun 4.6'daki adımıyla açılır. Sohbet kartları dahil.

## 4.F Oyunlar: çerçeve (adım 4.5) ve beş oyun (adım 4.6)

### Çerçeve (adım 4.5)

**Oylama ve başlatma.**

- Oyun Seç'te herkes bir postere oy verir: kişi başına bir oy, değiştirilebilir ve geri alınabilir (`rooms/vote { roomId, concept | null }`).
- Posterde oy sayısı ve kişinin kendi oyu görünür; kimin neye oy verdiği görünmez.
- **Oyunu yalnızca sahip başlatır.** Oylar öneridir; sahip en çok oy alan dışındaki oyunu da başlatabilir (v43: sahipte "En çok oy: X").
- Sahip "Başlat"a basınca oyunun **oyun öncesi sayfası** açılır: `rooms/open-game { roomId, concept, again? }` → `rooms.game_state.pregame` (`again`: "Yeniden oyna", aşağıda "Oyun sonu"). Masadaki herkes sayfayı `rooms` değişikliğiyle görür. Sohbet kartları istisnadır: tema alt sayfası ve masa sohbeti (adım 4.6.2).
- Oyun başlayınca oylar silinir.
- Masada aynı anda tek oyun ya da tek oyun öncesi sayfası olur.
- **Kategoriler** (v43): Tümü, Takımlı (Kapsül Anlat, İbre), Bire bir (Harf Kapmaca, Şarkıda Geçsin), Çok oyunculu (Sahtekar, Harf Kapmaca, Şarkıda Geçsin, Sohbet kartları). Bir oyun birden fazla kategoride olabilir. Oyunlar veriyle tanımlıdır: `content/games.json` (ad, kişi sınırları, takımlı mı, oyun öncesi sayfası var mı, kategoriler, poster, oynanabilir mi); `pnpm seed` `public.games`'i yükler ve `pure/tableGames.ts`'i üretir. Yeni oyun JSON'a bir satır ve kendi fonksiyonudur, çerçeve değişmez (adım 4.5a-3; bugünkü oyunların `pure/gameCatalog.ts`'i 4.6'da kalkar).
- **Soluk poster** (`tableGameAvailability`, `pure/gameFrame.ts`): masanın telefon sayısı oyunun alt sınırından azsa. Sınırlar: Kapsül Anlat 4, İbre 4, Sahtekar 3, Harf Kapmaca 2, Şarkıda Geçsin 2, Sohbet kartları 1. v43'ün posterlerindeki 2 (Kapsül Anlat ve İbre) takım başına 2 kişi kuralıyla çelişir; 4 alınır (teknik karar, §4.P). Soluk posterde oy verilir; masanın telefon sayısı alt sınıra ulaşmadan sahip o oyunu açamaz ve başlatamaz, sunucu reddeder (K-17).

**Oyun öncesi: oyuncular, takımlar, gözlemciler.**

- **Takımlı oyunlar** (Kapsül Anlat, İbre): Mor takım, Pembe takım, Gözlemciler, Henüz seçmeyenler.
  - Herkes kendi seçer: `rooms/pick { roomId, pick: 'a' | 'b' | 'obs' | null }`.
  - Sahip "Karıştır" ile gözlemci olmayanları iki takıma rastgele dağıtır (`rooms/shuffle`).
  - Her takımda en az 2 kişi olmadan oyun başlamaz.
- **Takımsız oyunlar** (Sahtekar, Harf Kapmaca, Şarkıda Geçsin): Oyuncular ve Gözlemciler. Varsayılan oyuncudur; kişi "Gözlemci ol" ile geçer. Alt sınır: Sahtekar 3, kapışma 2.
- Oyunu sahip başlatır: `<oyun>/start { roomId }`. Sunucu aynı işlemde:
  - oyuncuları ve rolleri dondurur (`game_players`);
  - gizli bilgiyi `game_secrets`'a yazar;
  - açık durumu `game_state`'e yazar ve süreyi başlatır.
- Takımlı oyunda seçim yapmamış kişi oyun başlarken gözlemci olur (teknik karar, §4.P).
- Oyun sırasında masaya gelen kişi o oyunda gözlemcidir; gizli bilgisi olan rol almaz. Bir sonraki oyunda seçer.

**Roller ve gizli bilgi (kural 3).**

- Roller oyun başında sunucuda atanır ve `game_players.role`'e yazılır.
  - Açık roller (takım, anlatıcı, ipucu veren, sıra) `game_state`'tedir.
  - Gizli roller (sahtekar) yalnızca `game_secrets`'tadır.
- Gizli bilgi yalnızca hak eden telefona bir eylemin yanıtıyla gider (`turn-cards`, `view`, `target` kalıbı). `game_state`'e, `game_events`'e ve hiçbir Realtime yüküne girmez (SPEC_V3 §20.1 aynen).
- **Gözlemci** oynamaz, puan almaz, oy vermez ve itiraz etmez. Gizli bilgiden yalnızca oyunun tablosunda yazanı görür (aşağıda).
- **Eylem yetkisi kişiye ve role bağlıdır.**
  - Her eylem bir tur ve adım indeksine bağlıdır; aynı adıma ikinci eylem yok sayılır (`{ ok: true }`, oda değişmez).
  - İki kişi aynı eyleme basarsa ilk gelen geçer (oda satırı kilitlenir).
  - Yetkisiz eylem bugünkü kodlarla döner (`not_describer`, `not_judge` …); yeni kodlar `not_player`, `not_owner`.
- **Süre sunucu saatindendir** (`endsAt`); telefon yalnızca geri sayar. Süre dolunca herhangi bir telefon `<oyun>/advance` çağırır; sunucu süreyi denetler ve idempotenttir. `advance` ve `begin` `IDEMPOTENT_CALLS`'a iki kez gönderen testle girer.
- **Ara ekranlarda geçiş:** tur sonu ve harf sonu ekranında sahip "Sonraki tura geç" ya da "Sonraki harfe geç"e basar. Sahip basmazsa 15 sn sonra herhangi bir telefonun `advance`'i geçirir; oyun cepteki bir telefon yüzünden takılmaz (teknik karar, §4.P).

**Oyundan çıkma ve oyunu bitirme.**

- Sahip "Oyunu bitir": oyun herkes için biter, masaya dönülür (`rooms/end-game`).
- Katılımcı "Oyundan çık": oyun diğerleri için sürer (`rooms/leave-game`). Kişi masada kalır; o oyunda yeniden oyuncu olamaz.
- Masadan ayrılan kişi, hangi yoldan olursa olsun (Masadan ayrıl, Mekandan ayrıl, yeni check-in, engelleme, süre dolumu), oyundan, oyun öncesi sayfadan ve oylardan da çıkar (adım 4.5a-3).
- Masa kapanınca (sahip, son kişi, hareketsizlik, sahibinin "Katıl"ıyla başka masaya taşınma) süren oyun terk edilmiş olarak biter (`game_abandoned`); oyun öncesi sayfa kapanır. Sahibin "Oyunu bitir"i de sonuna varmamış oyunu terk edilmiş sayar; terk edilen oyun sonuç yazmaz (adım 4.5a-3).
  - 4.5b için not (CTO incelemesi, WazzupDevs/Kabuk#185): masa kapanırken yazılan `game_abandoned` Realtime ile kimseye ulaşmaz. Aynı işlemde herkesin `left_at`'ı dolar, `game_events`'i ise yalnızca masada oturan okur; taşınan masada da böyledir. Masa bitti ekranı oyunun yarıda kaldığını `rooms` satırındaki `game_state.lastGame.abandoned`'dan okur.
  - "Oyundan çık" katılımcınındır; sahip oyunu "Oyunu bitir"le bitirir, `rooms/leave-game` sahipte `bad_request` döner (proje sahibinin kararı).
  - Oyuncu sayısı oyunun alt sınırının altındaysa başlatma `not_enough_players`, üst sınırının üstündeyse `too_many_players` döner (proje sahibinin kararı). Bugün her oyunun üst sınırı masanınkidir (12).
- Rol sahibinin çıkışı oyunun kuralıyla çözülür (her oyunda aşağıda). Genel kural: süren tur ya da aşama süresi dolana kadar sürer; çıkanın rolüne özgü eylemi kimse basamaz ve gizli bilgi kimseye yeniden verilmez (SPEC_V3 §22.E kalıbı).
- **Oyun sonu:** kazanan ve öne çıkanlar, kazananlara konfeti. "Masaya dön" herkeste; "Yeniden oyna" yalnızca sahipte (aynı oyunun oyun öncesi sayfasını aynı seçimlerle açar: oyuncular takımlarıyla, oyunun başında izleyenler izleyerek; oyundan sonra gelenler yeniden seçer).

**Sonuç ve rozetler.**

- `game_results` kişi başına yazılır: yalnızca oyuncular, ve yalnızca oyun başında ve sonunda oyunda olanlar (SPEC_V3 §22.E kuralı). Gözlemci satır almaz.
- Oyun sayısı rozetleri buradan sayılır. Kazanma rozeti Kapsül Anlat'ta kalır (bugün Sesli Tabu'nun).
- Aktiviteler → Geçmiş bu kayıtlardan beslenir. v43'teki sonuç metinleri: Kazandın, Kaybettin, Buldun (Sahtekar), 2. oldun (kapışma), Bitti (Sohbet kartları).

### Adım 4.6.1: Kapsül Anlat

- **Takımlar:** Mor ve Pembe, her birinde en az 2 kişi; gözlemciler.
- **Kurallar:** 6 tur, turda 60 sn, turda 3 pas.
  - Turlar takımlar arasında sırayla gider (Mor, Pembe, Mor…).
  - Anlatıcı takım içinde sırayla değişir: takımın n. turunda, oyun başındaki sırayla takımın n. kişisi.
- **Aşamalar:** takımlar → tur öncesi → 3-2-1 geri sayım → oyun (60 sn) → tur sonu → … → oyun sonu.
  - Tur öncesi: anlatıcı "Turu başlat"a basar (`tabu/begin-turn`). Hazır süresi bugünkü gibi 10 sn; dolunca tur kendiliğinden başlar (SPEC_V3 §20.1).
  - Tur sonu: kelimeler Doğru, Pas ya da Yasak! etiketiyle listelenir; sıradaki takım ve anlatıcı yazar.
  - Oyun sonu: kazanan takım, "En çok bildiren anlatıcı" ve "Yasak avcısı": Yasak!'la en çok yakalayan (K-5).
- **Puan:** Doğru +1, Yasak! −1 (anlatan takımdan), Pas 0. Rakip düğmesinin adı "Yasak!"tir (K-5).
- **Roller:**

  | Rol      | Kim                      | Kart   | Eylem                                                      |
  | -------- | ------------------------ | ------ | ---------------------------------------------------------- |
  | Anlatıcı | Sırası gelen kişi        | Görür  | Doğru ve Pas (`tabu/mark`)                                 |
  | Tahminci | Anlatanın takımı         | Görmez | Yok; doğru sayısını ve son kelimeleri görür, cevabı söyler |
  | Rakip    | Karşı takımın her kişisi | Görür  | Yasak!: anlatan takıma −1, kart geçilir; ilk basan geçer   |
  | Gözlemci | Gözlemciler              | Görür  | Yok                                                        |

- **Gizli bilgi:** kart (`tabu/turn-cards`) anlatıcıya, rakip takımın her telefonuna ve gözlemcilere gider; tahmincilere gitmez. Hakemli ve iş birliği modları kalkar.
- **Çıkış:** anlatıcı turda çıkarsa tur süresi dolana kadar sürer, Doğru ve Pas basılamaz. Bir takım 1 kişiye düşerse oyun sürer; o takımın anlatıcısı her turda aynı kişidir.
- **Kart:** üst üste yığılı bir deste gibidir; kenarına dokununca 3B eğilir. Üzerinde yalnızca kelime ve yasak kelimeler vardır. Boyu ekran yüksekliğine göre uzar.
- **Bu turun sayıları:** skorun hemen altında ikonlu mini tablo (Doğru, Pas, Yasak!).
- **Sunucu:** `tabu` fonksiyonu kişi bazlı yeniden yazılır. `tabu_turns.describer_session_id` kalır; `tabu_mode` ve taraf kolonları 4.8'de kalkar.

### Adım 4.6.2: Sohbet kartları

- **Tam ekran oyun değildir;** kartlar masa sohbetine gömülüdür.
- **Başlatma:** sahip Başlat'a basınca tema alt sayfası açılır: Isınma, Kampüs, Derin ve Ya da'dan bir ya da birkaçı. Ardından masa sohbeti açılır (`sohbet/start { roomId, themes }`).
- **Kart:** sohbetin üstünde küçük ve sabittir; temayı, kaçıncı kart olduğunu ve soruyu gösterir. Mesajlar kartın altından kayar.
- **Sohbetteki not:** her yeni kart sohbete küçük bir not olarak düşer; eski cevapların hangi soruya ait olduğu belli kalır. Kartların açılıp kapandığı da tek satırla görünür. Not bir sunucu mesajıdır (`messages.kind = 'card'`); kişi yazamaz.
- **Cevaplar** mesajdır; kart açıkken yazma alanında "Cevabını yaz" yazar. Küfür filtresi (kural 7) aynen.
- **Sahip:** "Kartı geç" ile ilerler (`sohbet/next-card`). Tema adına dokununca temayı değiştirir (kartlar yeniden karışır), kartları karıştırır ya da kapatır (`sohbet/close`). Katılımcı yalnızca kartı görür. Kartı yalnızca sahip geçirir (K-74).
- **Ya da kartı:** iki seçenek kartın içindedir; herkes birini seçer (`sohbet/choose { cardNo, choice }`). Her seçenekte yalnızca kaç kişinin seçtiği görünür; kimin neyi seçtiği görünmez (K-74).
- **Başka oyun başlayınca kartlar kapanır** (K-74). Kapanınca sohbete "Sohbet kartları kapandı · N kart konuşuldu" düşer.
- **İçerik:** temalar Isınma, Kampüs, Derin ve Ya da. Bugün `content/sohbet-cards.json`'da `isinma`, `derin`, `film-dizi-muzik` ve `hic-yaptin-mi` (40'ar) var. Kampüs kartları ve iki seçenekli Ya da kartları yazılır (`cards` satır kısıtı Ya da'nın iki seçeneğini zorunlu tutar). `film-dizi-muzik` ve `hic-yaptin-mi` kartları pasif olur (`is_active = false`); içerik silinmez (K-74).
  - Kampüs ve Ya da kartlarının taslağı 4.6.2'de yazılır. Kullanıcıya görünen içerik olduğu için birleşmeden önce proje sahibinin onayına gelir (K-74).

### Adım 4.6.3: Sahtekar

- **Oyuncular:** en az 3; gözlemciler. 1 sahtekar; 7 ve üstü oyuncuda 2 sahtekar, birbirlerini bilmezler (K-71).
- **Aşamalar:**
  1. **Rol kartı:** kart basılı tutunca döner ve rol görünür. Oyun boyunca "Rolüm" basılı tutunca yine görünür. Oyuncular "Hazırım" der; herkes hazır olunca ya da 30 sn sonra ipucu turları başlar.
  2. **İpucu turları:** 2 tur, kişi başı 30 sn (K-71). İpuçları sesli verilir. Sırayı sunucu belirler; konuşanın etrafında halka sayaç döner, sıradaki kişi yazılıdır. Sırası gelen "Söyledim"e basar (`sahtekar/said`).
  3. **Oylama:** 90 sn. Herkes sahtekar sayısı kadar kişi seçer (`sahtekar/vote`). Kimlerin oy verdiği görünür, kime verdikleri görünmez. Oylar sonuca kadar `game_secrets`'tadır.
  4. **Sonuç:** oylar çubuk olarak görünür. En çok oy alan, sahtekar sayısı kadar kişi suçlanır; sınırda oy eşitliği varsa o koltuk boş kalır. Sahtekarların altında "Yakalandı" ya da "Kaçtı" yazar.
  5. **Son şans:** yakalanan sahtekarların yazarak tek bir ortak tahmin hakkı vardır, 15 sn (`sahtekar/guess { text }`). Karşılaştırmada büyük küçük harf ve noktalama dikkate alınmaz; eşleştirme `pure/trText.ts` ile yapılır (kural 7). Bu, SPEC_V3 §20.1'deki "serbest metin yok" kuralına Sahtekar'ın son şansı için istisnadır; tahmin saklanmaz, yalnızca sonucu yazılır.
  6. **Oyun sonu.**
- **Kazanma:** masa ancak bütün sahtekarlar yakalanır ve tahmin tutmazsa kazanır. Kısmi yakalamada masaya yakalanan her sahtekar için puan yazılır (K-71).
- **Roller:**

  | Rol      | Görür                                                           | Eylem                           |
  | -------- | --------------------------------------------------------------- | ------------------------------- |
  | Oyuncu   | Kelimeyi                                                        | Hazırım, Söyledim, oy           |
  | Sahtekar | Yalnızca kategoriyi; 2 sahtekarda diğerinin kim olduğunu görmez | Hazırım, Söyledim, oy, son şans |
  | Gözlemci | Kelimeyi ve sahtekar(lar)ı                                      | Yok                             |

- **Gizli bilgi:** rol ve kelime kişiye özel `sahtekar/view` ile gider.
- **Çıkış:** konuşan kişi çıkarsa sıra sonrakine geçer. Bir sahtekar oyundan çıkarsa oyun biter ve sonuç "Sahtekar oyundan çıktı" olur; oyunculara puan yazılmaz.
- **Sunucu:** koltuk modeli (`sahtekar_options`, liderin telefonunda dolaşan koltuklar) kalkar; `sahtekar` fonksiyonu kişi bazlı yeniden yazılır.

### Adım 4.6.4: Kapışma motoru (Harf Kapmaca ve Şarkıda Geçsin)

İki oyun tek bir kapışma motorunu paylaşır (`pure/clash.ts`, testli).

- **Ortak akış:**
  - Soru herkese aynı anda açılır. İlk basan ("Kaptım" ya da "Söylüyorum") cevabı yüksek sesle söyler.
  - **İlk basanı sunucu belirler:** tek seferlik koşullu güncelleme, "henüz kapan yoksa kapan bu kişi". Telefon saatine güvenilmez; Wi-Fi ile mobil veri arasındaki gecikme farkı birkaç yüz milisaniyeyi bulabilir.
  - Kapan kişi "Söyledim" (Şarkıda Geçsin'de "Bitirdim") deyince 2 sn itiraz payı kalır, sonra karar verilir; demezse söyleme süresi dolunca.
  - **İtiraz eşiği:** kapan dışındaki oyuncuların yarıdan fazlası (`floor((n - 1) / 2) + 1`); bire birde tek itiraz yeter (K-72). İtiraz geri alınabilir.
  - İtiraz geçerse soru diğerlerine yeniden açılır ve kapanın o soruda hakkı biter. Kimse kalmazsa soru boş geçer.
  - İtiraz çıkmazsa kapana 1 puan.
  - **Bire birde karşı itiraz** (K-72): itiraz geçip soru itiraz edene açılınca, ilk kapanın onun cevabına itiraz hakkı kalır. O da itiraz ederse soru boş geçer; ikisi de puan almaz.
  - Gözlemci itiraz edemez (K-72).
- **Harf Kapmaca:** 3 harf; her harfin başında harf çarkı döner, ardından sırayla 5 kategori gelir. Kapma 15 sn, söyleme ve itiraz 6 sn, yeniden açık 8 sn.
  - Harf sonu: kimin hangi kategoriyi kaptığı listelenir; sahip "Sonraki harfe geç"e basar (15 sn kuralı, çerçeve).
  - Oyun sonu: ilk üç kişi kürsüde.
- **Şarkıda Geçsin:** 8 kelime. Kapma 20 sn, söyleme ve itiraz 12 sn, yeniden açık 10 sn. Söyleyenin avatarının iki yanında ekolayzer çubukları oynar.
  - Uygulama şarkı sözü göstermez, yalnızca kelime verir; ses kaydedilmez.
  - Aynı şarkının yeniden kullanılması serbesttir, itirazla çözülür (K-72).
- **Ekranda:** oyuncuların puanları küçük avatar sırası olarak görünür; sağ üstte kişinin kendi puanı.
- **Roller:** oyuncu, o soruda kapan, gözlemci ("İzliyorsun"). Gizli bilgi yoktur.
- **Sunucu:** `harf` ve `sarki` fonksiyonları ortak motorla yeniden yazılır; masalar arası sıra ve taraf başına itiraz hakları kalkar.

### Adım 4.6.5: İbre

- **Takımlar:** Kapsül Anlat'taki gibi iki takım ve gözlemciler. 4 tur; her turda iki takım birer kez oynar; ipucu veren takım içinde sırayla değişir.
- **Aşamalar:**
  1. **Tur öncesi:** ipucu veren "Hedefi gör"e basar (`ibre/begin`); hedef ona `ibre/target` yanıtıyla gider.
  2. **İpucu (30 sn):** yarım kadranın iki ucunda bir zıtlık yazar (örneğin Soğuk ve Sıcak). Hedefi yalnızca ipucu veren ve gözlemciler görür; diğerlerinde kadran örtülüdür. İpucu veren tek bir ipucunu sesli söyler ve "İpucunu söyledim"e basar.
  3. **Ayar (45 sn):**
     - Takımdaki herkes aynı ibreyi görür ve çevirebilir. Başkası çevirirken ibrenin üstünde "X çeviriyor" yazar.
     - Takımın tamamı "Hazırım" deyince ibre kilitlenir. İbre oynarsa onaylar sıfırlanır. Süre biterse ibre olduğu yerde kilitlenir.
     - Rakip takım ibreyi canlı izler; ipucu veren yalnızca izler.
     - Rakibin sol ya da sağ tahmini kalır (K-73, bugünkü kural): 15 sn; doğruysa rakibe 1 puan; ibre hedefin tam üstündeyse puan yok.
  4. **Sonuç:** örtü açılır. Hedefin ortasına yakınlığa göre 4, 3 ya da 2 puan; ıskalanırsa 0. Bantları sunucu hesaplar (bugünkü `pure/ibre.ts`).
  5. **Oyun sonu:** kazanan takım ve en iyi ipucu veren.
- **İbrenin sunucudaki değeri:** canlı konum hiçbir zaman otorite değildir.
  - Sürükleme bırakılınca telefon son konumu `ibre/move { roundNo, value }` ile yazar. Sunucu `game_state.needle` ve `needleBy`'ı günceller ve hazır onaylarını sıfırlar.
  - "Hazırım" `ibre/ready { roundNo, ready }` ile gider. Takımın tamamı hazırsa ya da süre dolunca kilit `game_state.needle` değeriyle olur.
  - Sürükleme sırasında veritabanına yazılmaz.
- **Canlı ibre (kural 9):** sürüklerken konum `ibre:{room_id}` kanalında istemci yayınıyla gider.
  - Yalnızca sürüklerken ve saniyede en çok 10 kez; bırakınca son konum bir kez daha.
  - Yükte yalnızca sayı: `{ v }`, 0–100. Alıcı başka biçimdeki yükü yok sayar.
  - İzleyen telefonlar ara konumları yumuşatır.
  - Kanal politikası ve hız sınırı §4.I'dadır.
- **Roller:**

  | Rol         | Hedef  | Eylem                                 |
  | ----------- | ------ | ------------------------------------- |
  | İpucu veren | Görür  | Hedefi gör, İpucunu söyledim          |
  | Tahminci    | Görmez | İbreyi çevirir (`ibre/move`), Hazırım |
  | Rakip takım | Görmez | İzler; sol ya da sağ tahmini (K-73)   |
  | Gözlemci    | Görür  | Yok; ibreyi izler                     |

- **Çıkış:** ipucu veren turda çıkarsa tur sürer, kilit tahmincilerle olur. Tahminci çıkarsa hazır onayları kalanlarla sayılır.
- **Sunucu:** `ibre` fonksiyonu kişi bazlı yeniden yazılır; `ibre/lock`'un taraf yetkisi (`lockBy`) kalkar.

### Adım 4.6.6: Vampir Köylü

K-77'nin altı oyunundan ilki; kaynak proje sahibinin dosyası `skall-oyun-vampir-koylu.html` (29 Ekim), kararlar K-78. Masada telefon anlatıcıdır: gece herkes kendi telefonunda bir seçim yapar, gündüz masa sesli tartışır ve oylar.

- **Oyuncular:** 5 ile 12; gözlemciler (oyun öncesi sayfada "Gözlemci ol"). `content/games.json`: `vampir`, takımsız, oyun öncesi sayfası var, Çok oyunculu.
- **Roller** (oyun başında sunucuda dağıtılır, `game_players.role`; oyun bitene kadar değişmez):

  | Rol     | Sayı                                 | Gece                                                                                           | Takım      |
  | ------- | ------------------------------------ | ---------------------------------------------------------------------------------------------- | ---------- |
  | Vampir  | 5–6 oyuncuda 1, 7–9'da 2, 10–12'de 3 | Vampir olmayan yaşayan birini seçer; vampirlerin çoğunluğunun seçtiği ısırılır, eşitlikte kura | Vampirler  |
  | Doktor  | 1                                    | Yaşayan birini korur, kendini de; önceki gece koruduğunu koruyamaz                             | Köylüler   |
  | Gözcü   | 1                                    | Kendisi dışında yaşayan birine bakar; yalnızca vampir olup olmadığını öğrenir                  | Köylüler   |
  | Soytarı | 6 ve üstü oyuncuda 1                 | Göstermelik seçim                                                                              | Tek başına |
  | Köylü   | Kalanlar                             | Göstermelik seçim                                                                              | Köylüler   |

  Gece yaşayan herkes bir seçim yapar: rolü olanla olmayan dışarıdan ayırt edilemez.

- **Aşamalar** (süre sunucu saatindendir, `endsAt`; her aşama `step` ile numaralanır):
  1. **Rol kartı (30 sn):** kart basılı tutunca döner ve rol görünür; vampirin kartında diğer vampirler. Oyuncu "Hazırım" der (`vampir/ready`). Herkes hazır olunca, sahip "Geceyi başlat"a basınca (`vampir/begin`) ya da 30 sn sonra gece başlar (K-78).
  2. **Gece (30 sn):** yaşayan her oyuncu bir kişi seçer, seçim değişmez (`vampir/pick`). Gözcünün sonucu ona seçimin yanıtıyla hemen gider. Vampirler gece diğer vampirlerin kimi seçtiğini canlı görür. Yaşayanların hepsi seçince ya da süre dolunca gece çözülür.
  3. **Sabah (6 sn):** ısırılan, doktor korumadıysa ölür; ölen ve rolü herkese açılır. Kimse ölmediyse "Bu gece kimse ölmedi" yazar; kurtarıldığı söylenmez.
  4. **Gündüz (2 dk):** masa sesli tartışır. Sahip "Oylamaya geç"e basabilir (`vampir/to-vote`).
  5. **Oylama (45 sn):** yaşayanlar kendileri dışında yaşayan birine oy verir, oy değişmez (`vampir/vote`). Oylar açıktır: kim kime oy verdi herkes canlı görür (K-78). En çok oy alan elenir; eşitlikte ya da hiç oy yoksa kimse elenmez. Yaşayanların hepsi oy verince ya da süre dolunca çözülür.
  6. **Eleme (6 sn):** elenen ve rolü herkese açılır. Sonra yeni gece.
  7. **Oyun sonu:** kazanan, herkesin rolü ve hayatta mı öldü mü; kazananlara konfeti. "Masaya dön" herkeste, "Yeniden oyna" sahipte (çerçeve).
- **Kazanma:** sabahtan ve elemeden sonra bakılır. Yaşayan vampir kalmazsa köylüler; yaşayan vampirler diğer yaşayanlar kadar ya da fazla olursa vampirler kazanır. Soytarı oylamayla elenirse oyun hemen biter ve soytarı tek başına kazanır; gece ölürse kaybeder, oyun sürer. Takımı kazanan herkes, ölmüş olsa da kazanmış sayılır.
- **Ölüler:** oy vermez, gece seçim yapmaz; ekranları "Ölüler konuşmaz" der (masada konuşmamak oyunun kuralıdır, uygulama denetlemez).
- **Gizli bilgi:** rol, vampir arkadaşları, kişinin kendi gece seçimi, gözcünün öğrendikleri ve vampirlerin gece seçimleri yalnızca hak eden telefona `vampir/view` ve `vampir/pick` yanıtıyla gider; `game_state`'e ve Realtime yüküne girmez (kural 3). Gece seçimi `rooms`'ta yalnızca seçen sayısını değiştirir; vampir telefonları bu değişiklikle görünümlerini yeniden ister. Gözlemci rolleri oyun sonunda görür.
- **Çıkış** (K-78): oyundan ya da masadan çıkan oyuncu ölmüş sayılır, rolü açılmaz ("Oyundan çıktı"); oyun sonunda da açılmaz ve sonuç yazılmaz. Kazanma hemen yeniden hesaplanır; aşama çıkanla tamamlanıyorsa (herkes hazır, herkes seçti, herkes oy verdi) ya da kazanan belli olduysa süre o an dolar ve sıradaki `advance` çözer. Çıkanın verdiği ve aldığı oylar silinir. Sahip masadan ayrılırsa sahiplik çerçevedeki gibi geçer; oyun sürer.
- **Sonuç:** `game_results` (`concept` ve `mode` `vampir`) oyunun sonunda oyunda olan her oyuncuya: kazandı ya da kaybetti. Oyun sonu bilgisi `game_state.lastGame.vampir`'dedir (kazanan, roller, ölenler, çıkanlar).
- **Sunucu:** `vampir` fonksiyonu: `start`, `view`, `ready`, `begin`, `pick { step, target }`, `to-vote`, `vote { step, target }`, `advance`. Hedefler masa oturum kimliğidir (kural 4). Süre dolunca herhangi bir telefon `advance` çağırır; sunucu süreyi denetler ve idempotenttir (`view` ve `advance` `IDEMPOTENT_CALLS`'ta). Kilitler: check-in → `rooms` → `game_players` → `game_secrets`; oyundan çıkanın tetikleyicisi (`game_players.left_at`) masa tutulurken `game_state`'i günceller ve yeni kilit almaz.
- **Görünüş:** dosyanın ekranları ve renk hikayesi (gece lacivert, gündüz bordo), skall'ın diliyle: renk bulutları, cam kartlar, kitin düğmeleri ve ikonları, kişilerin avatarları; gecede mekan sahnesinin ayı, yıldızları ve yarasaları. Rol kartı resimleri dosyadandır.

## 4.G Bildirim, davet ve arkadaşlık (adım 4.7)

**Zil ve liste.**

- Zil çubuk ikon ailesindendir (mor kubbe, pembe çubuk, kesişimde koyu ton, sarı tokmak).
- **Yeri** (K-6): zil yalnızca Mesajlar'dadır; okunmamış bildirim varken alt çubuktaki Mesajlar sekmesinde nokta görünür. Sekmenin görünümü v44'tedir.
  - Zil diğer sekmelerin köklerinden kalkar. Proje sahibi 20 Ekim'de öne aldı: Keşfet ekranının PR'ında kalktı ve SPEC_V3 §18.3a'daki "Bildirim düğmesi her sekmenin kök ekranında" maddesi aynı PR'da bu metne göre güncellendi.
- Yeni bildirim gelince zil sallanır; okunmamış sayısı rozet olur. Liste açılınca rozet silinir; yeni olanlar liste açıkken vurgulu kalır.
- Liste bir alt sayfadır: "Yeni" ve "Önceki". Boşken: "Henüz bildirim yok. Arkadaşlık istekleri ve arkadaşlarının masa davetleri burada görünür."
- **Dört tür vardır:**
  1. **Gelen arkadaşlık isteği:** Reddet ya da Kabul et. İstekler sekmesiyle iki yönlü eş zamanlıdır. Kabul edince satır "artık arkadaşsınız" olur ve "Mesaj yaz" çıkar.
  2. **İsteğini kabul eden kişi:** satıra dokununca DM açılır.
  3. **Arkadaşın masa daveti:** masa adı ve telefon sayısı, Reddet ya da Katıl. Katıl'da "Kabul edildi, X masasının yanına git" çıkar ve kişi masaya katılımcı olarak girer. Süresi dolan davet soluk görünür.
  4. **Eşleşme** (K-70): masa sonunda ya da oyun geçmişinde eklediğin kişi de seni ekledi, arkadaş oldunuz. Satır yalnızca ilk basanın listesindedir; satıra dokununca DM açılır.
- **Bildirime düşenler** (kural 5): açık istekler (mekan sohbetinden gönderilen istek ve oyun geçmişindeki "İstek gönder") ve eşleşme (K-70).
  - Masa sonundaki ve oyun geçmişindeki sessiz "Arkadaş ekle"nin tek taraflı basışı hiçbir bildirim üretmez; geri alma da üretmez.
  - İki taraf basınca arkadaşlık masa sonunda ve geçmişte görünür (Faz 3 aynen). İlk basana ayrıca push gider ve zil listesinde satır olur.
- **Reddetmek sessizdir:** reddedilen istekten ya da davetten karşı taraf haberdar olmaz.

**Veri.**

- Ayrı bir bildirim tablosu yoktur (SPEC_V3 §18.3'teki karar sürer). Liste salt okunur bir RPC'dir: `my_notifications()` (security definer, yalnızca okur, `set search_path = ''`; kural 1). Adım 4.7'de `my_notifications(target_user_id)` olarak yalnızca service role'e açıktır ve `friends/notifications` çağırır: fotoğrafları imzalar, doğum tarihini yaşa çevirir (`friends/incoming` kalıbı). Kaynakları:
  - gelen ve bekleyen açık arkadaşlık istekleri (`friend_requests`);
  - kişinin kabul edilen istekleri, son 7 gün;
  - eşleşmeyle kurulan arkadaşlıklar (`friendships`, kaynağı `room_end_mutual`), son 7 gün, yalnızca ilk basan için. Kimin önce bastığı `mutual_friend_intents.created_at`'ten okunur; niyetler arkadaşlık sürdükçe kalır (K-70);
  - gelen masa davetleri (`table_invites`), son 1 gün.
- Satırlar hesap id'si ve karşılaşma öncesinde `public_id` taşımaz. Arkadaşlık isteğinde ad, yaş ve fotoğraf bugünkü kurallarla gelir (SPEC_V3 §7.5).
- Rozet: `profiles.notifications_seen_at`; liste açılınca `account/notifications-seen` yazar. Okunmamış = bu zamandan sonraki satırlar.
- Yayın: değişiklik `inbox:{user_id}` kanalına veri içermeyen bir olayla gider (kural 9 aynen).

**Masa daveti** (§4.B-8; kural 4'e açık istisna):

- **Yalnızca sahip** gönderir, yalnızca **arkadaşa**: `rooms/invite { roomId, friendPublicId }`.
- **Davet ekranında bütün arkadaşlar listelenir; kimin mekanda olduğu görünmez** (K-2).
  - Sunucu daveti yalnızca aynı mekanda check-in'i olan arkadaşa iletir.
  - Mekanda olmayana daveti sessizce iletmez; gönderen her durumda aynı "Davet gönderildi"yi ve 2 dakikalık geri sayımı görür (v44, K-18). Geri sayım kabulü, reddi ya da mekanda olmamayı ayırt ettirmez.
  - Böylece istisna yalnızca alıcı tarafındadır: alıcı, arkadaşının aynı mekanda bir masası olduğunu öğrenir. Gönderen, arkadaşının mekanda olup olmadığını davetten öğrenemez.
- Davet masa adını ve telefon sayısını taşır; **mekan adı taşımaz.**
- **2 dakika geçerlidir** (`TABLE_INVITE_TTL_SECONDS = 120`, `pure/tables.ts`).
- Aynı arkadaşa aynı anda tek bekleyen davet; sahip başına saatte 30 davet. Aşım da `{ ok: true }` döner (kural 5'in sessizliği).
- Engel varsa (iki yönlü) davet sessizce yutulur.
- **Davete katılmak:** `rooms/answer-invite { inviteId, accept }`.
  - Davet sahibin onayıdır; ayrıca onay gerekmez.
  - Kişinin bulunduğu masa için "Masadan ayrıl" kuralı uygulanır: tek kişilik boş masası sessizce kapanır; başka bir masanın katılımcısıysa o masadan ayrılır; başka kişilerin bulunduğu bir masanın sahibiyse §4.E'deki sahiplik kuralı (K-13) uygulanır.
  - Masa dolmuşsa, kapanmışsa ya da davetin süresi geçmişse alıcıya tek bir metin görünür: davet artık geçerli değil.
- **Red ve zaman aşımı gönderene aynı görünür:** sahip ikisinde de hiçbir şey görmez. Kabulde kişi masaya gelir (Masadakiler'de görünür).
- **Sunucunun ayrıntıları (adım 4.7):**
  - `rooms/invite`: sahip olmayan `not_owner` alır. Şunların hiçbiri satır yazmaz ve yanıt hep `{ ok: true }`'dur: arkadaş değil (ya da bilinmeyen kimlik), iki yönlü engel (masadaki herhangi biriyle), mekanda check-in'i yok, noktası olan mekanda masanın noktasında değil (proje sahibinin kararı, CTO incelemesi WazzupDevs/Kabuk#195), zaten bu masada, aynı sahipten bekleyen bir davet, saatlik sınır, dolu masa. Davet alıcının `inbox:{user_id}` kanalına veri içermeyen `table_invite` olayıyla duyurulur.
  - Davet masanın adını ve telefon sayısını gönderildiği anki değerleriyle saklar (`table_invites.room_name`, `phones`); liste onları gösterir, masanın sonraki hâlini (açık mı, kaç kişi) hiç göstermez (kural 4; WazzupDevs/Kabuk#195).
  - `rooms/answer-invite`: başkasının davet kimliği `not_found`. Red sessizdir. Katılmada şunların hepsi aynı `invite_unavailable` (409, "Davet artık geçerli değil.") döner: süresi geçmiş, masa kapanmış ya da dolmuş, daveti gönderen artık sahip değil (sahiplik geçmiş) ya da check-in'i bitmiş, ikisi artık arkadaş değil (arkadaşlıktan çıkarma engelle aynı görünür, kural 5), alıcının check-in'i başka mekanda ya da masanın noktasından başka bir noktada, masadaki biriyle engel (WazzupDevs/Kabuk#195). Zaten bu masadaysa davet kabul edilmiş sayılır.
  - Masaya oturuş check-in'in kimliğiyledir (`private.table_seat`; `photo_required`, `gender_required` aynen).
  - Liste satırları (`friends/notifications`): gelen istek bekliyor ya da 7 gün içinde kabul edilmiş (kabulden sonra arkadaşın `public_id`'si); mekan sohbetinden gelen istekte ad, yaş, fotoğraf ve mekan (SPEC_V3 §7.5 aynen), oyun geçmişinden gelende yalnızca masadaki adı ve kayıt. Engel ve biten arkadaşlık satırı kaldırır. Yanıt okunmamış sayısını da taşır (`unseen`).
  - Rozet: `account/notifications-seen { seenAt }`; `seenAt` listenin gösterdiği en yeni satırın `createdAt`'idir. Sunucu onu şimdiyle sınırlar ve işareti yalnızca ileri götürür: liste okunduktan sonra gelen satır yeni kalır, aynı çağrı iki kez ya da geç gelen eski bir çağrı işareti geri almaz (CTO incelemesi, WazzupDevs/Kabuk#195).
  - Bildirim ayarları: `profile/update { notifyInvites }`; üç tercih kişinin kendi satırında okunur.
  - Analitik olayları (§4.L: `invite_sent`, `invite_accepted`, `notifications_opened`) uygulama gönderir; katalog istemci PR'ında.
  - `CURRENT_KVKK_VERSION`: metin bu adımın sunucu PR'ında; sürüm tek seferde, 4.5 ile birlikte main'e girecek istemci PR'ında artar ve 4.4'ün ve bu adımın metnini birlikte onaylatır (proje sahibinin kararı, §4.L).

**Push.**

- Masa daveti push'u: "Bir arkadaşın seni masasına çağırıyor" (`target: 'notifications'`). Ad, masa adı ve mekan push'a girmez (bugünkü push ilkesi, SPEC_V3 §18.3a).
- Gelen arkadaşlık isteği push'u bugünkü gibidir. Kabul edilen istek push üretmez.
- Eşleşme push'u (K-70, adım 4.5): eşleşmeyi kuran basışın karşı tarafına (ilk basana) gider.
  - Tercih `notify_friend_requests`'tir; yeni kolon yoktur. Bildirim ayarlarındaki "Arkadaşlık istekleri" satırı bunu da kapsar.
  - Mekan ve masa adı taşımaz.
- **Bildirim ayarları** (K-53, K-62): kişi başına üç satır.
  - Arkadaşlık istekleri, Masa davetleri, Birebir mesajlar: bugünkü `notify_friend_requests` ve `notify_dm`'in yanına `notify_invites`.
  - Tercih push gönderilmeden önce okunur.
  - Katılma isteği ve kabul push'larının ayarı yoktur; bugünkü gibi gider.
  - Mekan sohbeti yanıtları ve kampanya satırı yoktur (SPEC_V3 §7.4, K-15).
  - Ekran v46'dadır (v46 raporu, bölüm 4).
- Üretim projesi için Firebase anahtarının Expo paneline yüklendiği pilot öncesi doğrulanır (§4.N).

**Arkadaşlık ve mesaj.**

- DM yalnızca arkadaşlar arasındadır (SPEC_V3 §21.3). Arkadaş olmayanın profilinde "Mesaj" düğmesi görünmez; yerine bağlama göre "Arkadaş ekle" vardır:
  - mekan sohbetinden açılan profilde açık istek (SPEC_V3 §7.5);
  - masa sonunda ve oyun geçmişinde sessiz düğme.
- Engelle, Bildir ve Arkadaşlıktan çıkar bugünkü gibidir: engellenen ve şikayet edilen hiçbir şey görmez; çıkarılan taraf çıkarmayı engellemeden ayırt edemez (kural 5).

## 4.H Veri modeli ve migration planı

| Adım    | Migration            | Değişiklik                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 4.1–4.3 | —                    | Yok                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 4.4     | `…_identity.sql`     | `profiles.capsule_nick` (benzersiz) ve `capsule_look text` (kısa görünüş kodu, katalogla doğrulanır; K-46), kolon yetkisi `authenticated`'a kapalı (`gender` kalıbı); mevcut hesaplara atama (28 hazır görünüşten biri). `table_sessions.identity_mode text check (in ('anonymous', 'profiled'))` ve `identity_switches smallint default 0 check (0–1)`; `venue_chat_profiled`'dan taşıma. `messages.profiled boolean not null default false`. `venue_chat_messages`'ta anonim `sender_alias` artık nick. Yazıldığı andaki görünüş: `venue_chat_messages.sender_look`, `messages.sender_look` ve `room_members.look` (`text`, boş olabilir; anonimde dolu, profillide boş). Yeni tablo `venue_chat_mutes` (politikalarıyla). Kendi mesajını silme için `venue_chat_messages.deleted_at`. Yeni tablo `retired_capsule_nicks` (politikalarıyla; silinen hesapların nick'leri). Nick yenileme için (K-9) `profiles.capsule_nick_changed_at`                                             |
| 4.4b    | —                    | Yok: `profile/set-look` 4.4'teki `capsule_look`'u yazar (K-47)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 4.5     | `…_table_model.sql`  | `rooms.name`, `rooms.name_rerolls`, `rooms.phones`; 12 telefon kısıtı. Masa simgesi (K-45): `rooms.icon text` (simgenin kalıcı kimliği, ör. `kis-kardanadam`; `pure/` altındaki üretilmiş listeyle doğrulanır) ve mekan içinde açık ve süren masalarda benzersizlik (kısmi benzersiz indeks `(venue_id, icon)`, kapalı olmayan masalar); çakışmada sunucu yeniden seçer. `room_members.side` boş olabilir (yazılmaz). `join_requests.requester_room_id` (taşınacak masa) ve `requester_phones`. Yeni tablolar `table_votes` ve `game_players` (politikalarıyla). `table_sessions.headcount` boş olabilir (yazılmaz). `table_sessions.alias` boş olabilir ve `(venue_id, alias)` benzersiz indeksi kalkar (kolon 4.8'de); ondan kopyalanan `not null` takma ad kolonlarının yeni kaynakları aşağıda ("4.5'te eski takma ad kolonları"). Yeni okumalar `venue_tables`, `table_vote_counts`, `table_people`. Migration o an açık bütün masaları kapatır (pilot yok; aynı gün OTA, §4.N) |
| 4.6.1   | `…_kapsul_anlat.sql` | `tabu_*` fonksiyonları kişi bazlı; Yasak! istatistiği (Yasak avcısı); hakemli ve iş birliği modu kalkar                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 4.6.2   | `…_sohbet_cards.sql` | `messages.kind text default 'text' check (in ('text', 'card'))` ve kart notu; `sohbet_choices` (Ya da seçimleri); `cards` kısıtına `kampus` ve `ya-da` temaları ve Ya da'nın iki seçeneği                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 4.6.3   | `…_sahtekar_v4.sql`  | Kişi bazlı roller; 2 sahtekar; yazılı son şans; koltuk fonksiyonları kalkar                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 4.6.4   | `…_clash.sql`        | Ortak kapışma durumu; koşullu ilk basan; çoğunluk itirazı                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 4.6.5   | `…_ibre_v4.sql`      | `ibre/move`, `ibre/ready`; takımın ortak ibresi; `realtime_topic_allowed`'a `ibre:`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 4.7     | `…_invites.sql`      | Yeni tablo `table_invites` (politikalarıyla). `profiles.notifications_seen_at`. Bildirim tercihleri (K-53): `profiles.notify_invites`, bugünkü `notify_dm` ve `notify_friend_requests`'in yanında; push öncesi okunur. Okuma `my_notifications()`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 4.8     | `…_v4_cleanup.sql`   | Eski modelin kalanı (aşağıda), 23.4 kalıbıyla iki PR                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |

**Yeni tablolar.**

- **`venue_chat_mutes`** (4.4): `id`, `user_id` (→ `auth.users` cascade), `muted_user_id` (cascade; istemciye kapalı), `profiled`, `label`, `created_at`; benzersiz `(user_id, muted_user_id, profiled)`. RLS açık, istemci politikası yok; okuma `venue-chat/mutes` ile.
- **`retired_capsule_nicks`** (4.4): `nick text primary key`; başka kolon yoktur (hesapla bağı ve tarihi yok). Hesap silinirken nick buraya yazılır; üretim burada olan nick'i vermez. RLS açık, istemci politikası yok.
- **`table_votes`** (4.5): `room_id` (cascade), `session_id` (cascade), `concept`, `created_at`; birincil anahtar `(room_id, session_id)`. RLS açık, istemci politikası yok; okuma `table_vote_counts(room_id)` ile: `(concept, votes, mine)`, yalnızca masanın kişilerine.
- **`game_players`** (4.5): `room_id`, `game_no`, `session_id`, `role`, `team null`, `seat_order`, `joined_at`, `left_at`; birincil anahtar `(room_id, game_no, session_id)`. Gizli rol taşıyabildiği için RLS açık, istemci politikası yok; açık roller `game_state`'tedir.
- **`sohbet_choices`** (4.6.2): `room_id`, `card_no`, `session_id`, `choice`; birincil anahtar `(room_id, card_no, session_id)`. İstemci politikası yok; sayılar `game_state`'tedir.
- **`table_invites`** (4.7): `id`, `room_id` (cascade), `from_session_id`, `to_user_id` (cascade; istemciye kapalı), `created_at`, `expires_at`, `status` (`pending`, `accepted`, `declined`, `expired`). İstemci politikası yok; okuma `my_notifications()` ile.

**Mevcutlar.**

- `rooms.game_state` açık durumu taşır: oyun öncesi sayfa (`pregame`: kavram ve kişilerin seçimleri; masa oturum id'leriyle, kural 4), roller, sıra, süre, puan. Gizli bilgi `game_secrets`'ta kalır.
- `table_sessions` check-in kaydıdır; `alias`, `alias_rerolls`, `headcount`, `team_capable` ve `venue_chat_profiled` 4.8'de kalkar.
- `rooms`'ta `guest_*`, `owner_headcount`, `owner_phones`, `owner_profiled`, `owner_alias` 4.8'de kalkar; `owner_session_id` sahibi gösterir.

**4.5'te eski takma ad kolonları.** 4.5'te check-in masa ve takma ad üretmez; `table_sessions.alias` boş kalır. Bugün o kolondan kopyalanan `not null` kolonlar kaldırılmadan (4.8) yeni bir kaynaktan doldurulur:

| Kolon                                   | 4.5'teki kaynağı                                                                                                                                                                                                 |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rooms.owner_alias`                     | `rooms.name`                                                                                                                                                                                                     |
| `join_requests.requester_alias`         | İstekçinin masası varsa masanın adı (`rooms.name`); yoksa (Bu masadayım) kişinin `room_members`'a gireceği kimliğin adı                                                                                          |
| `play_history.own_alias`, `other_alias` | Her kişinin o masadaki kimliği (`room_members.alias`)                                                                                                                                                            |
| `blocks.blocked_alias`                  | Masada engellemede engellenenin o masadaki kimliği (`room_members.alias`). Diğer yollar bugünkü gibi: oyun geçmişinden `other_alias`, mekan sohbetinden mesajın `sender_alias`'ı, arkadaş profilinden görünen ad |
| `venue_chat_messages.sender_alias`      | Check-in'in kimliği: anonimde nick, profillide görünen ad (4.4'ten beri anonimde nick)                                                                                                                           |

- `messages.sender_alias` ve `room_members.alias` kişinin masaya girdiği andaki kimliğin adıdır (§4.D).
- Kural 4 gereği anonim kişinin oyun geçmişinde ve engelleme kaydında görünen adı nick'idir, gerçek adı değil.

**4.8 temizliği** (23.4 kalıbı: 4.8a okuyan kalmadığını bir birim testiyle gösterir ve fonksiyonları kaldırır, migration yoktur; 4.8b migration'dır):

- `game_proposals` ve öneri fonksiyonları (`rooms_propose_game`, `rooms_answer_game`);
- `rooms_end`'in kullanılmayan `decision_seconds` argümanı (23.4b'den kalan, varsayılanla `null`): fonksiyon `rooms_end(target_user_id)` olur. 23.4b'nin "sonraki adım" olarak yazdığı ayrı küçük migration yerine 4.8b'ye girer (CTO incelemesi, 23.4b; proje sahibi). O zaman yayındaki `rooms` fonksiyonu argümanı göndermez (23.4b'den beri), kaldırmak hiçbir çağrıyı kırmaz;
- taraf kolonları ve fonksiyonları (`room_members.side`, `join_requests.side`, `private.side_headcount`, `private.max_side_phones`, `private.was_on_side`);
- eski lobi okumaları (`venue_lobby`, `venue_lobby_phones`, `venue_lobby_tags`, `venue_running_rooms`);
- kişi sayısı beyanı kolonları; check-in anahtarının araması (`start_table_session` → `checkin_key`) `headcount` ve `team_capable`'ı da karşılaştırır, bu kolonlar kalkarken aramadan da çıkarlar (CTO incelemesi, WazzupDevs/Kabuk#156);
- Sahtekar koltukları, Tabu modları ve kapışmanın taraf hakları;
- Poppins ve Manrope paketleri, eski tokenlar;
- kapsam PR açıklamasında tek tek yazılır.

**Diğer.** `pnpm gen:types` her migration'dan sonra çalışır. Seed yalnızca 4.4 (nick'te üretilmeyecek kısaltmalar) ve 4.6.2'de (Sohbet kartları) değişir. Kapsül kataloğu (K-46) `content/` altında JSON'dur, seed'e girmez: `pure/` altındaki üretilmiş dosyadan okunur. Kataloğun (4.4) ve masa simgelerinin (4.5) kaynağı `docs/design/v46/kaynak/`'tır.

## 4.I RLS ve Realtime

**RLS (kural 2).** Her yeni tablo politikalarıyla aynı migration'da gelir. Yeni tabloların hepsi istemciye kapalıdır (politika yok); okumalar `set search_path = ''` ile tanımlı, yalnızca okuyan security definer RPC'lerledir (kural 1).

**Kolon yetkisi.** `profiles.capsule_nick` ve `capsule_look` `authenticated`'a kapalıdır. Kişi kendi nick'ini ve görünüşünü `profile/get` yanıtında görür. Başkasının nick'i ve görünüşü yalnızca bir bağlamda birlikte gider: anonim mekan sohbeti mesajı, masadaki anonim kişi, oyun ekranı. Başkasının profili ikisini de taşımaz (K-49).

**Realtime.**

- **Oda kanalları** (`room:`, `messages:`, `game:`, `presence:`): masanın o anki kişileri abone olur (`room_members.left_at is null`). Masadan çıkanın erişimi hemen kapanır. Faz 2'nin kuralıdır; taraf yerine kişi (4.5).
- **`venue:` (lobi) ve `venue_chat:`:** check-in'i olan abone olur; yalnızca sunucu yayın yapar. Koşul kaydı değişmez (4.5).
- **`inbox:{user_id}`:** bildirim ve davet olayları da buradan gider; yalnızca sunucu yayın yapar, yük veri içermez (4.7).
- **Yeni kanal türü `ibre:{room_id}`** (4.6.5), istemcinin yayın yaptığı ikinci kanal (kural 9):
  - Abone olma ve yayın: yalnızca masanın o anki kişileri (`private.realtime_topic_allowed`'da `ibre` dalı).
  - Olay `needle`, yük `{ v }` (0–100 sayı). Alıcı başka biçimdeki yükü yok sayar.
  - Gönderim yalnızca sürüklerken, saniyede en çok 10 kez; bırakınca son konum bir kez. Hız ve yük biçimi istemcide zorlanır (`pure/ibre.ts` → kısıcı, testli); RLS üyeliği zorlar. Supabase kanal başına yük biçimini ya da istemci başına hızı politikayla denetlemez; bu yüzden canlı konum hiçbir zaman otorite değildir. Kilit ve puan sunucudaki `game_state.needle` değerindendir (§4.F).
  - Hiçbir şey saklanmaz.
- **Hiçbir Realtime yükü** profil kimliği, hesap id'si, cinsiyet, nick'in hesapla ilişkisi ya da gizli oyun bilgisi taşımaz (kural 4 ve 9 aynen).
- **Presence:** masadaki çevrimiçi bilgisi bugünkü `presence:` kanalındadır; 12 telefonda yükü §4.N'dedir.

## 4.J API (Edge Function'lar)

Kalıp değişmez: fonksiyon başına tek endpoint, `action` alanı, zod v4, `{ error: { code, message } }`. Fonksiyon sayısı değişmez (23.4a'dan sonra 17); eylemler mevcut fonksiyonlara eklenir.

| Fonksiyon       | Değişen                                                                                                                                                                                                                                                                                                                  | Adım     |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| `account`       | `complete-onboarding` nick ve hazır görünüşlerden birini atar (K-46); `notifications-seen`                                                                                                                                                                                                                               | 4.4, 4.7 |
| `profile`       | Kendi `get` yanıtında `capsuleNick`, `capsuleLook`; başkası için ikisi de yok (K-49); `refresh-nick` (30 günde bir, K-9)                                                                                                                                                                                                 | 4.4      |
| `profile`       | `set-look { look }`: görünüş katalogla doğrulanır, bilinmeyen parça atılır (K-47)                                                                                                                                                                                                                                        | 4.4b     |
| `checkin`       | `set-identity { anonymous }` (`identity_switch_used`, `photo_required`, 4.5'ten açık istekte `request_pending`; cinsiyet istemez)                                                                                                                                                                                        | 4.4      |
| `checkin`       | `check-in` kişi sayısı ve masa adı almaz                                                                                                                                                                                                                                                                                 | 4.5      |
| `venue-chat`    | `send` kimliği check-in'den okur; istek `identity` ya da bugünkü uygulamanın `profiled`'ını taşır, tam olarak birini (`identity_mismatch`, `venue_chat_mode_locked`); `page` yanıtında `senderKey`, anonimde nick; `delete`, `mute`, `unmute`, `mutes`                                                                   | 4.4      |
| `rooms`         | `create { icon? }`, `set-icon` (K-45), `set-visibility`, `reroll-name`, `request-join` (masa ya da kişi, `asMember`), `respond`, `request-profile`, `leave`, `end`, `vote`, `open-game { again? }`, `pick`, `shuffle`, `end-game`, `leave-game`; yeni kodlar `already_in_table`, `table_full`, `not_owner`, `not_player` | 4.5      |
| `rooms`         | `invite`, `answer-invite`                                                                                                                                                                                                                                                                                                | 4.7      |
| `tabu`          | `start`, `begin-turn`, `turn-cards`, `mark` (Doğru, Pas, Yasak!), `end-turn`, `advance`; kişi bazlı yetki                                                                                                                                                                                                                | 4.6.1    |
| `sohbet`        | `start { themes }`, `next-card`, `set-themes`, `shuffle`, `choose`, `close`                                                                                                                                                                                                                                              | 4.6.2    |
| `sahtekar`      | `start`, `view`, `ready`, `said`, `vote`, `guess { text }`, `advance`                                                                                                                                                                                                                                                    | 4.6.3    |
| `harf`, `sarki` | `start`, `claim`, `said`, `object`, `advance`; ortak motor                                                                                                                                                                                                                                                               | 4.6.4    |
| `ibre`          | `start`, `begin`, `target`, `clue-given`, `move`, `ready`, `side` (K-73), `advance`                                                                                                                                                                                                                                      | 4.6.5    |
| `friends`       | `withdraw-add { historyId }` (ör.; K-67): masa sonundaki ve oyun geçmişindeki sessiz eklemeyi geri alır. Eşleşme olmuşsa yok sayılır ve yanıt arkadaş olunduğunu söyler. Karşı tarafa hiçbir şey gitmez. `add-from-room`: eşleşmede ilk basana push (K-70, `notify_friend_requests`)                                     | 4.5      |
| `friends`       | `my_notifications()` okuması `friends/notifications` ile (fotoğraflar imzalı)                                                                                                                                                                                                                                            | 4.7      |

- Yeni hata kodları `pure/errors.ts`'e, Türkçe metinleri `tr.ts`'e girer.
- `IDEMPOTENT_CALLS`'a yalnızca iki kez gönderen testi olan çağrılar girer (bugünkü kural): `begin`, `advance`, `end-turn`, `notifications-seen`, okumalar.

## 4.K Kilit sırası (kural 10)

- **4.4:** `venue_chat_mutes` mekan sohbeti zincirinin sonuna girer: `table_sessions` → `venue_chat_rate` → `venue_chat_reaction_rate` → `venue_chat_messages` → `venue_chat_reactions` → `venue_chat_reports` → `venue_chat_mutes`. Kimlik değişikliği yalnızca check-in'i kilitler (`for no key update`).
- **4.5:** masa zinciri `profiles` → `table_sessions` → `rooms` → `room_members` → `join_requests` → `table_votes` → odanın satırları. Odanın satırlarında `game_players` `tabu_turns`'ten önce gelir: `game_players` → `tabu_turns` → `game_secrets` → `room_used_cards`, `messages` → `message_reactions`, `game_events`, `play_history`.
  - Masa taşıyan kabul (Katıl) iki masayı kilitler: istekçinin check-in'i → iki `rooms` satırı `id` sırasıyla → iki masanın `room_members` satırları → `join_requests` (SPEC_V3 §23.K'nın genellemesi).
  - Katıl isteği (`rooms_request_join`) de iki masayı `id` sırasıyla alır: hedef `for no key update`, istekçinin kendi masası `for key share` (isteğin `requester_room_id` yabancı anahtarının alacağı kilit). Birbirine aynı anda Katıl basan iki masa birbirini beklemez; bir sahibin başka bir masaya Katıl'ı ile o masanın kendi masasına isteğini kabulü birbirini bekler, kilitlenmez (`locks` testi; CTO incelemesi, WazzupDevs/Kabuk#183).
  - `locks` testleri: çapraz kabul; 12. telefonun iki istekte aynı anda kabulü (biri geçer, diğeri `table_full`); oy ve seçimin oyun başlatmayla aynı anda gelmesi.
  - Sessiz eklemeyi geri alma (`friends/withdraw-add`, K-67):
    - Basış kişinin kendi `play_history` satırındadır (`friend_action_at`). Satır önce yalnızca kilitlenir (`for update`, değişiklik yok). Kural 10'un sırası: `play_history` → çift kilidi → `friend_requests` → `friendships`, `mutual_friend_intents`.
    - Sonra çift kilidi (`private.lock_pair`) alınır. Arkadaşlık kilit altında görülürse hiçbir şey değişmez: `friend_action_at` dolu kalır ve yanıt arkadaş olunduğunu söyler.
    - Arkadaşlık yoksa iki şey çift kilidi altında birlikte yapılır: niyetin silinmesi (`mutual_friend_intents`) ve `friend_action_at`'in boşalması.
    - Gerekçe (CTO incelemesi, WazzupDevs/Kabuk#174): satır kilitten önce boşalsaydı, arada karşı tarafın eklemesi arkadaşlığı kurabilirdi. Kişi arkadaş olur ama kendi basışı silinmiş görünürdü.
    - `locks` testi (`friends.test.ts` kalıbı): geri alma ile karşı tarafın eklemesi aynı anda gelir. Sonuç ikisinden biridir:
      - arkadaşlık oluşur, geri alma yok sayılır ve `friend_action_at` dolu kalır;
      - ya da niyet silinir, `friend_action_at` boşalır ve arkadaşlık oluşmaz.
- **4.6:** her oyunun eylemleri `rooms` → `game_players` → oyunun satırları sırasıyla kilitler; ilk basanı belirleyen koşullu güncelleme (`harf`, `sarki`) ve aynı adıma iki eylem `locks` testiyle gelir.
- **4.7:** `table_invites` `join_requests`'ten sonra gelir: `table_sessions` → `rooms` → `room_members` → `join_requests` → `table_invites`.
  - Davete katılma: alıcının check-in'i → alıcının bulunduğu masa ve sahibin masası `id` sırasıyla → `room_members` → `table_invites`.
  - `locks` testleri: davete katılma ile masanın dolması ya da kapanması aynı anda.
- **4.8:** kalkan tablolar (`game_proposals`) kural metninden çıkar.

## 4.L Analitik, yasal ve mağaza

**Analitik** (`pure/analytics.ts`; PostHog'a yalnızca kullanıcı id'si gider):

- **Cinsiyet ve vekilleri hiçbir olaya girmez** (SPEC_V3 §23.L ilkesi). Faz 4'te yeni vekiller vardır ve olay olmaz:
  - anonim anahtarının değişmesi ve masadaki anonim kimlik (masada yalnızca kadın anonim olabilir);
  - oyun akışında anonim ya da profilli katılım;
  - kapsül, nick ve sessize alma.
- Nick, masa adı, mekan adı, mesaj ve içerik (kelime, kategori, tahmin) hiçbir olaya girmez.
- Yeni olaylar (izinli özelliklerle; kesin liste ilgili adımın PR'ında):
  - 4.5: `table_created`, `table_opened` (lobi), `table_joined { via: 'request' | 'here' | 'invite' }`, `game_opened { concept }`, `game_started { concept, players, observers }`, `game_left { concept }`;
  - 4.7: `invite_sent`, `invite_accepted`, `notifications_opened`.
- Kalkan: `game_proposed`, `game_accepted` (öneri ve kabul kalkar, 4.5).

**Yasal** (`docs/legal/`; OTA'dan önce):

- **4.4:** kapsül nick hesaba bağlı bir takma addır. Anonim kişi ziyaretler arasında aynı nick'le tanınabilir; nick profil kimliğini açmaz. Sessize alma kaydı: kimin hangi kimliği sessize aldığı, yalnızca sunucuda. Anahtar değişikliğinden önce yazılan mesajların eski kimlikte kaldığı. Silinen hesabın ve yenilenen nick'in metni yeniden verilmez; bunun için yalnızca nick metni, hesapla bağı olmadan saklanır.
- **4.7:** masa daveti, arkadaşına aynı mekanda bir masan olduğunu söyler; mekan adı gitmez. Bildirim listesi ve davet push'u.
- `CURRENT_KVKK_VERSION` tek seferde artar: 4.5 ile birlikte main'e girecek istemci PR'ında; mevcut kullanıcılar 4.4'ün ve 4.7'nin metnini bir kez onaylar. 4.4'ün istemcisi daha önce main'e girerse o PR'da artmaz (proje sahibinin kararı).
- Sayfalar taslaktır; "hukuki kontrol bekliyor" notu kalır.

**Mağaza** (`docs/store/`):

- **Veri güvenliği formu** 4.4 ve 4.7 OTA'larından önce güncellenir (`PLAY_CHECKLIST.md`'deki OTA sınırı: OTA beyan edilmemiş veri toplamaya başlamak için kullanılmaz). Yeni veri türü beklenmez; sessize alma ve davet uygulama etkinliğidir. Beyan PR'da denetlenir.
- **Açıklama, ekran görüntüleri ve inceleme videosu** 4.8'de v43 akışına göre yeniden yazılır: Kapsül Anlat adı, kişi bazlı oyunlar, davet, bildirim. "Tabu" hiçbir yerde geçmez.
- **Ad için hukuki kontrol:** "Kapsül Anlat" adı Play'den önce marka açısından kontrol edilir (pilot ön koşulu, §4.N).

## 4.M Kabul kriterleri ve testler

**Her adımda:**

- `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm format:check` ve entegrasyon testleri temiz.
- Her kod PR'ı birleşmeden önce `e2e` etiketi taşır; etiket PR incelemeye hazır olduğunda (taslaktan çıkarken) eklenir (SPEC_V3 §23.N): etiketli bir taslakta her push 8 E2E işi başlatır. Birleşme şartı `ci`'ın ve E2E'nin son commit'te 8/8 (açık ve koyu) yeşil olması ve proje sahibinin "onaylandı"sıdır (K-8). Telefon kontrolü birleşme şartı değildir; telefondaki kontrol saha testidir.
- Metni ya da gezinmesi değişen akış aynı PR'da güncellenir.
- Davranışı bilerek kalkan beklentiler yalnızca o davranışı kaldıran adımın PR'ında değişir; değişen ya da silinen her test dosyası nedeniyle birlikte PR açıklamasında listelenir.
- Yeni davranış yeni dosyalarda test edilir: `identity.test.ts` (4.4), `tableModel.test.ts` (4.5), oyun başına bir dosya (4.6), `invites.test.ts` (4.7).
- **12 telefon:** yerel test numaraları 12'ye çıkar (`config.toml` → `[auth.sms.test_otp]`, `+905550000009` … `+905550000012`; CLAUDE.md "Yerel test numaraları" aynı PR'da). 4.5'in testleri dolu bir masayı kurar.

**Adım 4.2–4.3.**

- Kontrast testleri yeni tokenlarla; `tr.ts` ve `docs/store/`'da "Tabu" geçmez (birim testi); `GAME_NAMES` tek kaynaktır.
- Sıklık sınırı (K-30, 4.2b) `hapticMoments.test.ts`'te: aynı an 600 ms'den sık çalmaz, iki titreşim arasında en az 150 ms, yazarken titreşim yok; sekme değişimi her seferinde çalar.
- Hareketler (4.2c) `playMotion.test.ts`'te: kartın eğilmesi ve çıkışları, rol kartı, harf çarkı (son harf sorunun açılmasından önce iner), plak ve ekolayzer, İbre örtüsü, zilin ve rozetin anahtar kareleri, ikon yayları (kesişimden başlar, dinlenen çizimde biter); arayüz iş parçacığındaki `bezierAt` `cubicBezier` ile aynıdır.
- Listelerde kapsül avatar (4.3, CTO'nun 4.2b incelemesi): her `CapsuleAvatar` kendi SVG metnini ayrıştırır. 100 mesajlık mekan sohbeti ve 12 kişilik masa listesi düşük donanımlı bir Android'de kaydırılarak ölçülür. Takılma varsa görünüm başına modül düzeyinde önbellek kullanılır (bir kez ayrıştırılmış ağaç ya da `pnpm icons` hattından üretilen PNG). 4.3c: önbellek (bir kez ayrıştırılmış ağaç) baştan kullanılır; bileşen önizleme → "Ölçüm" kaydırırken kare, takılma ve en uzun kareyi gösterir, önbelleksiz çizimle karşılaştırır (`src/lib/frameStats.ts`, testli).
- Biyografi ve görünen ad (K-34, 4.3): telefon, e-posta, kullanıcı adı ve bağlantı birim testleriyle (`profanity.test.ts`, `trText.test.ts`) ve profil fonksiyonunun entegrasyon testiyle reddedilir; Türkçe karakterli olağan adlar ve biyografiler geçer.
- Keşfet ve Aktiviteler konuma göre sıralamaz (birim testi: liste sırası konum almaz). Keşfet'te bugün etkinliği olan mekanlar üstte, sonra ada göre (K-21).
- E2E: bütün akışlar yeni ekranlarda; büyük yazı koşusu 320 dp'de kesilen metin ve iki satıra bölünen düğme bulmaz.
- İlk ekran ve kayıt (v45): sahnenin zamanlama tablosu tek seferde yaklaşık 5 sn'de biter ve döngü içermez (birim testi). Dostun yerleşim kuralı saftır ve testlidir (en çok 18 dp yukarı, yine kesişirse gizli). E2E'nin kayıt akışı "Başla" ve yeni sırayla; giriş sahnesi akışı bekletmez.

**Adım 4.4.**

- Her hesabın benzersiz nick'i ve kapsülü vardır; kayıtta 18 yaş denetiminden sonra atanır, mevcut hesaplara migration atar. Üretilmeyecek kısaltmalar üretilmez (birim testi).
- Kapasite: doluluk yüzde 50'yi geçince yeni nick 3 rakamlıdır, mevcut nick'ler değişmez (birim testi). Silinen hesabın nick'i `retired_capsule_nicks`'e geçer ve yeniden verilmez; tabloda hesapla bağ yoktur. Nick yenileme 30 günde bir; yenilenen nick aynı işlemde emekliye ayrılır (K-9).
- `capsule_nick` ve `capsule_look` `authenticated`'a kapalıdır (`birth_date` testinin kalıbı); başkası için hiçbir yanıt ve Realtime yükü nick ile hesap ya da `public_id` arasındaki ilişkiyi taşımaz (tarama).
- Profil yanıtı başkasına `capsule_look` ve nick taşımaz; arkadaşa da (K-49).
- Görünüş katalogla doğrulanır: bilinmeyen parça atılır. `content/` altındaki katalog ile `pure/` altındaki üretilmiş dosya eşittir (birim testi). Başlangıç görünüşü cinsiyetten türetilmez (K-50).
- Anahtar check-in başına bir kez değişir; ikinci değişiklik `identity_switch_used`. Fotoğrafsız hesap profilli kimlik seçemez (`photo_required`).
- Erkek ve belirtmeyen hesap anonim kimlikle mekan sohbetine yazar; aynı check-in'de masaya girişte kimliği profillidir ve check-in'in anonim kimliği masaya taşınmaz. Açıkça anonim katılım isteyen istek `anonymous_not_allowed`. Bu hesaplarda da ikinci değişiklik `identity_switch_used`.
- Değişiklikten önceki mesajlar eski kimlikle döner; anonim mesajda fotoğraf ve ad yoktur.
- Görünüş değişince ya da nick yenilenince eski mesaj eski görünüşle (ve eski nick'le) döner; masadaki kişinin görünüşü masa süresince değişmez (K-10). Profilli mesaj ve profilli kişi görünüş taşımaz.
- `identity_mismatch`: check-in'in kimliğinden farklı `identity` taşıyan mesaj yazılmaz. Bugünkü uygulamanın `profiled`'lı ilk mesajı check-in'in tek değişikliğidir, sonrası `venue_chat_mode_locked`. Kimliksiz ya da iki alanlı istek `bad_request`.
- `set-identity` cinsiyet istemez ve `anonymous_not_allowed` döndürmez; aynı kimliği yeniden seçmek hak harcamaz.
- Nick'i olmayan hesap (eski fonksiyonla kayıt, başarısız atama) check-in'de ve kendi profilinde nick alır; anonim mesaj hiçbir zaman başka bir adla (masa adı dahil) yazılmaz (`onboarding_required`).
- Sessize alma kimliğe bağlıdır: anonim kimliği sessize almak aynı kişinin profilli mesajlarını gizlemez. Sessize alınan hiçbir yanıtta bunu görmez.
- `senderKey` aynı kişinin iki kimliği için ve nick yenilenince farklıdır, hesap id'si taşımaz.
- Kendi mesajını silme yalnızca göndericinin mesajında çalışır; şikayet kopyası kalır.

**Adım 4.4b.**

- `set-look` katalog dışı parçayı atar ve yalnızca kişinin kendi görünüşünü yazar; duygular sunucuya gitmez (K-52).
- İstemci o anki duyguyu görünüş koduna, göz yuvasına da, asla yazmaz: `mutlu`, `saskin` ve `uykulu` hem duygu hem göz kimliğidir; sunucu `e:mutlu`'yu geçerli göz olarak yazar ve ikisini ayırt edemez. İstemci PR'ında bir testle bağlanır (K-52; 4.4b CTO incelemesi).
- 4.4'ün eski mesaj testi `set-look` ile de koşar: eski mesaj ve süren masa eski görünüşle döner.
- Listelerde görünüş kodu başına bir kez çizilir (4.3c'nin ölçümü).

**Adım 4.5.**

- Check-in masa kurmaz; mekan sohbeti, lobi ve süren masalar check-in'le açılır.
- Masa kurma, lobiye açma ve çekme, ad yenileme (3 hak).
- Katıl: masa taşınır, istekçi masa aynı işlemde kapanır, kimlikler korunur. Red ve zaman aşımı `unavailable`. 12'yi aşan istek ve kabul `table_full`.
- Bu masadayım: masası olmayan kişi.
- 4.5'ten sonra check-in takma adsız yapılır (`table_sessions.alias` boş); aynı mekanda iki check-in çakışmaz. Eski takma ad kopyaları (`rooms.owner_alias`, `join_requests.requester_alias`, `play_history.own_alias` ve `other_alias`, `blocks.blocked_alias`, `venue_chat_messages.sender_alias`) §4.H'deki kaynaklarından dolar; anonim kişinin oyun geçmişindeki ve engelleme kaydındaki adı nick'tir.
- Sahip "Masayı bitir": masa herkes için kapanır. Katılımcı ayrılır, masa sürer. Sahibin ayrılmasında sahiplik en erken katılana geçer; masada engel K-13'e göre.
- Tek kişilik masa 30 dakikada kapanır; iki ve daha fazla kişili masa hareketsizlikle kapanmaz.
- Oylama: kişi başına bir oy; sayılar ve kendi oyu görünür, kimin neye verdiği görünmez. Oyunu yalnızca sahip açar ve başlatır (`not_owner`). Alt sınırın altındaki (soluk) postere oy verilir, oyun açılamaz (K-17).
- Takım seçimi, Karıştır, gözlemci; takım başına 2 kişi olmadan başlamaz. Oyun sırasında gelen kişi gözlemcidir.
- Oyun geçmişi ve "Arkadaş ekle" masada en az 3 dakika birlikte bulunan her çift arasında (K-66).
  - Birlikte gelen iki kişi de kayıt alır.
  - 3 dakikadan az birlikte bulunan kayıt almaz ve Masa bitti listesinde yoktur.
  - Zaten arkadaş olan çift kayıt alır; "Arkadaşsınız" yalnızca kişi masada profilliyse görünür. Masadan önceki arkadaşlık `add-from-room` ve `withdraw-add` yanıtlarında eşleşmeyen basıştan, `friends/request { historyId }`'de anonim oturan kişide başka bir basıştan ayırt edilemez (K-75).
- Geri alma (K-67):
  - Geri alınan niyet silinir: karşı taraf sonra basınca arkadaşlık oluşmaz.
  - Eşleşmeden sonra geri alma yok sayılır ve yanıt arkadaş olunduğunu söyler.
  - Karşı tarafın hiçbir yanıtı, okunabilir satırı ve Realtime yükü eklemeyi ya da geri almayı göstermez.
  - `locks`: geri alma ile karşı tarafın eklemesi aynı anda. İki sonuçta da `friend_action_at` denetlenir: arkadaşlık oluştuysa dolu, oluşmadıysa boş (§4.K).
- Eşleşme bildirimi (K-70):
  - Push, eşleşmeyi kuran basışın karşı tarafına (ilk basana) gider; kurana gitmez.
  - `notify_friend_requests` kapalıyken gitmez.
  - Mekan ve masa adı taşımaz.
  - Tek taraflı basışta ve geri almada hiçbir push ya da yayın gitmez.
- Kalıcı red ve çift kilidi testleri değişmeden yeşil.
- `locks`: çapraz kabul, 12. telefon, oy ve başlatma.
- Eski oyunların posterleri "Yakında" (E2E).
- Masa simgesi (K-45): aynı mekanda açık ve süren iki masa aynı simgeyi taşımaz; aynı anda kurulan iki masada da (`locks` kalıbında eşzamanlı kurma, çakışmada yeniden seçim). Ad değişince simge kalır. `create` ve `set-icon` listede olmayan kimliği reddeder; `pure/` altındaki simge listesi ile uygulamadaki simge dosyaları eşittir (birim testi).

**Adım 4.6 (her oyun).**

- Rol tablosundaki her eylem yalnızca yetkili role açıktır; diğerleri bugünkü ya da yeni yetki kodunu alır.
- Gizli bilgi yalnızca tablodaki rollere gider. Tahminci, rakip olmayan ve gözlemci olmayan hiçbir yanıtta kart, kelime, hedef ya da sahtekar bilgisi almaz (`readableBy` ve `watchRoomChannel` kalıbı; `game_state`, `game_events` ve Realtime yükleri taranır).
- Süreler sunucudan; `advance` idempotent ve iki kez gönderen testle.
- Çıkış kuralları (oyun başına) ve oyun sonu kayıtları (`game_results`: oyuncular evet, gözlemciler hayır).
- 4.6.3: 7 oyuncuda 2 sahtekar, birbirlerini görmezler; son şans `trText` eşleştirmesiyle. Kısmi yakalamada yakalanan her sahtekar için masaya puan (K-71).
- 4.6.4: aynı anda iki "Kaptım"da yalnızca biri kapar (`locks`); eşik ve bire bir.
  - Bire birde karşı itiraz (K-72): itiraz geçip soru itiraz edene açılınca ilk kapan onun cevabına itiraz edebilir. O itiraz geçerse soru boş geçer ve kimse puan almaz.
  - Gözlemcinin itirazı yetki koduyla reddedilir.
- 4.6.5: `ibre:` kanalına masanın kişileri dışındakiler abone olamaz ve yayın yapamaz (`realtime.test.ts` kalıbı); kısıcı saniyede 10'u geçmez (birim testi); kilit `game_state.needle`'dan.

**Adım 4.7.**

- Davet yalnızca sahipten ve arkadaşa; aynı mekanda check-in'i olmayan arkadaşa davet satırı oluşmaz ve gönderen aynı yanıtı alır (K-2). Davet ekranının okuması kimin mekanda olduğunu taşımaz.
- Davet mekan adı taşımaz; 2 dakikada geçersiz olur. Red ve zaman aşımı gönderene aynı görünür (hiçbiri).
- Davete katılma: tek kişilik boş masa kapanır; başka masadaki kişi oradan ayrılır; dolu masa ve geçersiz davet aynı metni verir.
- `my_notifications()`: açık istekler ve eşleşme. Eşleşme satırı yalnızca ilk basanın listesindedir (K-70). Masa sonundaki sessiz düğmenin tek taraflı basışı ve geri alma hiçbir satır üretmez. Rozet `notifications_seen_at`'tan.
- Davet push'u ad, masa ve mekan taşımaz; `notify_invites` kapalıyken gitmez. Üç tercihin her biri push gönderilmeden önce okunur (K-53, K-62). Katılma isteği ve kabul push'u tercihten bağımsız gider.
- `locks`: davete katılma ile masanın dolması.

**Adım 4.8.** Saha testinden sonra gelir ve testte çıkan düzeltmeleri de alır (K-8). Okuyan kalmadığı birim testiyle gösterilir (4.8a, `scripts/reveal-removed.test.ts` kalıbı); migration (4.8b) sonrası `pnpm gen:types`.

**E2E ve bot.**

- Akışların neredeyse tamamı yeniden yazılır: her adım kendi akışlarını aynı PR'da günceller (bugünkü kural).
- Bot kişi bazlı rolleri oynamayı öğrenir: masaya kişi olarak katılır, takım seçer, anlatıcı, rakip, tahminci, sahtekar, kapan ve ipucu veren olur. 12 telefonlu masa için birden fazla bot telefonu aynı masaya katılır (yerel test numaraları).
- Gizli bilginin cihaza gitmediği akışta değil, entegrasyon testinde denetlenir (SPEC_V3 §20.1).
- **Saha testi** 4.6 ve 4.7 ikisi de birleştikten sonra 6–12 telefonla yapılır (K-8). Faz 4'ün tamamını kapsar: push ve davet emülatörde sınanamaz ve başka telefon kontrolü yoktur. `docs/FIELD_TEST.md`'nin Faz 4 sürümü testten önce ayrı bir belge PR'ıyla yazılır; bulgular 4.8'de düzeltilir. Ayrı bir Faz 3 saha testi yapılmaz (K-1): Faz 3'ün bulma yardımı gözlemleri (SPEC_V3 §23.P-2: kabul anındaki iki satır kalabalık mekanda yeterli mi) bu testte yapılır ve P-2 kararı bu testten sonra verilir.

## 4.N Uygulama sırası, yayın, maliyet ve risk

| Adım                           | Sunucu                                                          | İstemci                                                                                                                                                                                                                     | Yayın                                                                | Ön koşul                           |
| ------------------------------ | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ---------------------------------- |
| 4.0 Belge                      | —                                                               | —                                                                                                                                                                                                                           | Bu PR                                                                | —                                  |
| 4.1 Native build 0.5.0 (M0)    | —                                                               | `react-native-gesture-handler`, `gwpAsanMode="never"`; `version` 0.5.0                                                                                                                                                      | `eas build`, APK yeniden kurulur                                     | 4.0                                |
| 4.2 Tasarım sistemi            | —                                                               | Tokenlar (açık ve koyu), Plus Jakarta Sans, ikonlar, kapsül avatar bileşeni, hareketler, temel bileşenler. Üç PR: 4.2a tokenlar ve yazı tipi, 4.2b bileşenler ve dokunuş, 4.2c hareketler ve tasarım sistemi                | OTA (PR başına ayrı)                                                 | 4.1 ve v44                         |
| 4.3 Ekranlar, bugünkü mantıkla | K-34'ün denetimi (`profile`)                                    | Mekan, mekan sohbeti, masa kabuğu, Mesajlar ve DM, Profil, Aktiviteler, Keşfet; ilk ekran ve kayıt (v45: giriş animasyonu, kapsül dostları); "Tabu" metinlerden kalkar; v46'nın kontrast ve koyu harita düzeltmeleri (K-65) | OTA (ekran başına PR olabilir)                                       | 4.2                                |
| 4.4 Kimlik                     | `…_identity.sql`; `account`, `profile`, `checkin`, `venue-chat` | Kapsül, nick, anahtar, mekan sohbetinde kişi görünümü, sessize alma, silme                                                                                                                                                  | Önce yasal metin ve Veri güvenliği; `db push` + deploy; aynı gün OTA | 4.3                                |
| 4.4b Kapsül süsleme            | `profile` → `set-look`                                          | Süsleme ekranı (raflar, paketler, yuvalar, Karıştır, Hepsini çıkar, Kaydet; K-47)                                                                                                                                           | `db push` yok; deploy; OTA                                           | 4.4 (4.5'le aynı anda yürüyebilir) |
| 4.5 Masa modeli                | `…_table_model.sql`; `checkin`, `rooms`                         | Check-in'siz masa, masa simgesi (K-45), çoklu masa, kişi bazlı katılım, oylama, oyun öncesi sayfa, takım ve gözlemci; eski oyunlar "Yakında"                                                                                | `db push` + deploy; **hemen ardından** OTA                           | 4.4                                |
| 4.6.1–4.6.5 Oyunlar            | Oyun başına migration ve fonksiyon                              | Oyun başına v43 ekranları                                                                                                                                                                                                   | Oyun başına PR; `db push` + deploy; OTA                              | 4.5 ve 4.1                         |
| 4.7 Bildirim ve davet          | `…_invites.sql`; `rooms`, `friends`, `account`                  | Zil, liste, davet gönderme ve katılma, push                                                                                                                                                                                 | Önce yasal metin ve Veri güvenliği; `db push` + deploy; OTA          | 4.5                                |
| Saha testi                     | —                                                               | Önce `docs/FIELD_TEST.md`'nin Faz 4 sürümü (ayrı belge PR'ı); test 6–12 telefonla, dev projesinde, Faz 4'ün tamamı                                                                                                          | —                                                                    | 4.6 ve 4.7                         |
| 4.8 Temizlik                   | 4.8a (fonksiyonlar), 4.8b (`…_v4_cleanup.sql`)                  | Ölü kod; saha testinin düzeltmeleri; mağaza metinleri ve görüntüleri                                                                                                                                                        | `db push` + deploy; OTA                                              | Saha testi                         |

**Sıra ve birleşme.**

- Her adımın sunucusu dev'e gider ve hemen ardından istemcisi OTA ile gider. `deploy-dev` otomatik yayını bunu birleşmede kendiliğinden yapar (migration, fonksiyonlar, OTA). Her adımın OTA'sı ayrı gider; adımlar tek OTA'da toplanmaz.
- **Telefon kontrolü birleşme şartı değildir** (K-8). Birleşme şartı `ci`'ın ve E2E'nin son commit'te 8/8 yeşil olması ve proje sahibinin "onaylandı"sıdır. `e2e` etiketi taslaktan çıkarken eklenir (§4.M). Çalışma öncekinin yayınını beklemeden başlayabilir.
- **Telefondaki kontrol saha testidir** (K-8). K-7'deki 0.5.0 APK kontrolü olduğu gibi kalır.
  - Zamanı: 4.6 ve 4.7 ikisi de birleştikten sonra. Push ve davet emülatörde sınanamaz ve başka telefon kontrolü olmadığı için saha testi Faz 4'ün tamamını kapsar.
  - `docs/FIELD_TEST.md`'nin Faz 4 sürümü saha testinden önce ayrı bir belge PR'ıyla yazılır.
  - 4.8 saha testinden sonra gelir ve testte çıkan düzeltmeleri de alır.
- **PR'lar küçük tutulur:** telefonda görünen bir hatayı saha testinde hangi adımın getirdiği bulunabilsin (aşağıda "Maliyet ve risk").
- İstemci işi önce v46'ya bakılarak yapılır (öncelik §4.C); tasarım dosyalarında olmayan görünüm eklenmez.
- **4.5'te sunucu ile OTA arası en kısa tutulur:** 4.5'in sunucusundan sonra eski istemci masa açamaz ve oynayamaz. Pilot kullanıcısı yoktur; dev projesindeki test telefonları etkilenir.
- Büyük adımlar gerekirse 23.2 ve 23.3'teki a/b kalıbıyla bölünür (sunucu önce, bugünkü uygulamayı bozmadan; istemci sonra). Bölünme o adımın planında yazılır.
- **Açık kararlar bekletir:** §4.P'deki her karar, yazılı olduğu adımdan önce.

**Faz 3'ün kapanışı** (K-1):

- 23.4b'nin saha testi şartı kalkar. Böylece 4.5'in migration'ı reveal tablolarıyla yaşamaz.
- Ayrı bir Faz 3 saha testi yapılmaz (SPEC_V3 §23.M'deki "Saha testi" satırı bununla değişir). Bulma yardımı gözlemleri Faz 4 saha testinde yapılır (§4.M).

**Faz 3'ün telefon kontrolü** (K-7):

- "OTA telefonda doğrulandı" 23.3b, 23.4a ve 23.4b için birleşme şartı değildir.
- Telefonda tek kontrol, adım 4.1'in PR'ı birleştikten sonra 0.5.0 preview APK'sı kurulunca yapılır ve üçünü birlikte kapsar. Bu PR'ların "Telefonda kontrol" adımları silinmez, "0.5.0 APK'sı kurulunca" başlığıyla durur.
- 23.4a proje sahibinin "onaylandı"sıyla birleşir.
- 23.4b'nin şartı: 23.4a birleştikten sonraki deploy-dev koşusu yeşil bitti ve `reveal` fonksiyonu dev projesinden elle silindi; birleşme yine "onaylandı"yla. Gerekçe aynı: kolonları okuyan eski istemci ya da eski fonksiyon yayın sırasında kırılmasın. Eski JS paketli bir telefonun bir açılışta hata görmesi dev projesinde kabul edildi.
- SPEC_V3 §23.N'deki "Bir sonraki adımın PR'ı, önceki adımın OTA'sı telefonda kontrol edildikten sonra birleşir" şartı bu üç PR için bununla değişir.

**Pilot ön koşulları** (§4.B-12):

- 4.0–4.7 birleşmiş; v46 ekranları ve koyu tema uygulanmış;
- saha testi (6–12 telefon, `docs/FIELD_TEST.md`'nin Faz 4 sürümüyle) 4.6 ve 4.7'den sonra yapılmış;
- 4.8 birleşmiş ve saha testinin bulguları kapatılmış;
- "Kapsül Anlat" için hukuki kontrol;
- mağaza metinleri, görüntüler ve Veri güvenliği formu;
- üretim projesi `docs/PILOT_RELEASE.md` sırasıyla (Firebase anahtarının Expo panelinde olduğu dahil).

**Yayın.**

- `version` yalnızca 4.1'de artar (0.5.0). Sonrası 0.5.0'a OTA ile gider.
- Yayın sırası her sunucu adımında CLAUDE.md "main'den dev projesine yayın"daki gibidir; otomatik yayın açıkken birleşme yapar.
- Yeni sır ve panel ayarı yoktur.

### Maliyet ve risk

**Masa simgeleri ve kapsül süsleme (Fırat paketi, v46).**

- 100 masa simgesi (256 px WebP) uygulamaya yaklaşık 0,6 MB ekler; OTA'da bir kez iner.
- Süsleme ve simgeler pilota birkaç günlük oturum işi ekler. 4.4b 4.5'le aynı anda yürürse kritik yol uzamaz.

**İbre'nin Realtime maliyeti.**

- Supabase Realtime her yayını bir gönderim artı her alıcı olarak sayar. Pro planda ayda 5 milyon mesaj dahildir; sonrası milyon başına 2,5 dolar.
- Varsayım: tur başına yaklaşık 15 sn sürükleme, saniyede en çok 10 gönderim, oyun başına 8 tur (4 tur × 2 takım).
- Bir gönderim, masadaki telefon sayısı kadar mesaj sayılır (1 gönderim + diğer telefonlar):

  | Masa                    | Bir oyun              | Günde 100 oyunla ay | Dahil kotadan sonra |
  | ----------------------- | --------------------- | ------------------- | ------------------- |
  | 6 telefon, saniyede 10  | yaklaşık 7 bin mesaj  | yaklaşık 22 milyon  | yaklaşık 42 dolar   |
  | 12 telefon, saniyede 10 | yaklaşık 14 bin mesaj | yaklaşık 43 milyon  | yaklaşık 96 dolar   |
  | 6 telefon, kısıtsız     | yaklaşık 40 bin mesaj | yaklaşık 120 milyon | yaklaşık 290 dolar  |

- Önlem: yalnızca sürüklerken ve saniyede en çok 10; bırakınca tek son konum; izleyen telefon yumuşatır; veritabanına yalnızca bırakınca yazılır (§4.F). Dahil kota 6 telefonda günde yaklaşık 20 İbre oyununa yeter; pilotun bunun altında kalması beklenir. Kullanım panelden izlenir.

**12 telefonlu masada Realtime ve presence yükü.**

- Masadaki her değişiklik (oyun eylemi, oy, seçim, mesaj) masanın her telefonuna gider: 12 telefonda her `rooms` ya da `game_events` değişikliği 12 mesaj sayılır. Bir Kapsül Anlat oyunu (6 tur, tur başına yaklaşık 10 eylem, eylem başına iki değişiklik) yaklaşık 1.500 mesajdır; İbre'nin yanında küçüktür.
- Postgres Changes her değişikliği her abonenin yetkisiyle denetler; veritabanı yükü abone sayısıyla büyür. Presence'ta her giriş ve çıkış masadaki herkese gider.
- Önlem: `pnpm latency`'nin oda adımı ve `docs/ROOM_LOAD.md` 12 telefona genişletilir (4.5); sorun çıkarsa sık değişen durum (oy sayıları, seçimler) `rooms` satırı yerine sunucu yayınıyla gönderilir. Pro planın eşzamanlı bağlantı ve saniyede mesaj sınırları saha testi günü panelden okunur.

**E2E'nin ve botun yeniden yazımı.**

- Akışların ve botun neredeyse tamamı değişir; entegrasyon testlerinin taraf, öneri ve koltuk varsayan bölümleri yeniden yazılır. En büyük iş 4.5 ve 4.6'dadır.
- Her adım kendi akışını ve bot eylemlerini aynı PR'da günceller; bir anda bütün akışı yeniden yazmak gerekmez.
- Repo herkese açıkken Actions dakikası ücretsizdir; 12 telefonlu senaryolar yalnızca entegrasyon testinde, E2E'de bir cihaz ve bot telefonlarıyla koşar.

**Telefonda görünen hatalar saha testine kadar birikir** (K-8).

- Adımlar arasında telefon kontrolü yoktur. E2E emülatörde koşar; yalnızca telefonda görünen hatalar (dokunma ve sürükleme, gerçek ağ gecikmesi, push, yazı tipi) saha testine kadar birikir ve testte birlikte çıkar.
- Önlem: hangi adımın bozduğunu bulabilmek için PR'lar küçük tutulur ve her birinin OTA'sı ayrı gider. Düzeltmeler 4.8'e girer.

**Diğer riskler.**

- **Herkesin kendi telefonu** (ürünsel, proje sahibinin kararı): oynayan herkes uygulamayı kurar, kayıt olur, doğum tarihi ve cinsiyet girer. Pilotta en büyük kayıp noktası bu olabilir; saha testinde ölçülür (kayıt süresi, masaya katılamayan kişi).
- **Takvim:** v43 uygulamanın büyük kısmını yeniden yazar ve pilot tamamını bekler; geri bildirim geç gelir. Adımlar arasında telefon kontrolü yoktur; telefondaki kontrol 4.6 ve 4.7'den sonraki saha testidir (K-8).
- **v44:** geldi (18 Ekim). Koyu tema tonları, oyun zeminleri, koyu zemin logosu ve açık temadaki koyu yarı saydam oyun çipleri 4.2'nin PR'ında ekran görüntüleriyle onaya gelir (K-25).
- **Yazı tipi:** Plus Jakarta Sans geniş; 320 dp'de sığma payı azdır. Büyük yazı E2E koşusu (gece ve elle) emülatörde denetler; telefonda görünen kısmı saha testinde.
- **Kontrast:** Harf Kapmaca'nın turuncu zemininde çipler koyulaştırılır (§4.C).
- **Sahtekar'da yazılı tahmin:** serbest metne ilk kez izin verilir; yalnızca son şansta, saklanmaz, `trText` ile eşleşir.
- **Kapsül nick'in hesaba sabit olması:** anonim kişi ziyaretler arasında tanınır (proje sahibinin kararı; gizlilik politikasında yazılı; Profil'den 30 günde bir yenilenir, K-9).

## 4.O Değişmez kurallar: adım adım değişiklikler

Bu PR yalnızca proje paragrafını ve görsel kaynak kod kuralını değiştirir (Faz 2 ve 3 geleneği). Aşağıdaki her değişiklik ilgili adımın PR'ında CLAUDE.md'ye işlenir. O adım gelene kadar bugünkü metin geçerlidir; bugünkü davranışı koruyan kod o adımda değişir.

**Kural 3** (4.5'te yeniden yazılır; oyun cümleleri 4.6'nın adımlarıyla eklenir). Faz 2 eki 4.5'te kalkar: eski oyunlar o adımdan sonra çalışmaz. Yeni metin:

> "Oyun sunucu otoriterdir: tur süresi (`ends_at`), içerik dağıtımı, roller, eylem yetkisi (kim ne zaman hangi eylemi yapabilir) ve skor sunucuda hesaplanır. Herkes kendi telefonunda oynar; telefonu olmayan oynamaz. Oyunu yalnızca masa sahibi başlatır; masadakilerin oyları öneridir. Masada aynı anda tek oyun olur. Roller (anlatıcı, tahminci, rakip, ipucu veren, sahtekar, gözlemci) oyun başında sunucuda atanır ve oyun bitene kadar değişmez; oyun sırasında masaya gelen kişi gözlemcidir. Gizli bilgi (kart, kelime, rol, hedef, oylar) yalnızca rolün hak ettiği telefona bir eylemin yanıtıyla gider; açık oyun durumuna, oyun olaylarına ve Realtime yüküne girmez. Her eylem bir tur ve adım indeksine bağlıdır; sunucu doğrular ve sırayı belirler, aynı adıma ikinci eylem yok sayılır, iki telefon aynı eyleme basarsa ilk gelen geçer. Gözlemci oynamaz, puan almaz, oy vermez ve itiraz etmez."

- **4.6.1** ekler: "Kapsül Anlat'ta Doğru ve Pas'a yalnızca anlatıcı, rakip düğmesine yalnızca karşı takım basar; kart anlatıcıya, karşı takıma ve gözlemcilere gider, anlatıcının takım arkadaşlarına gitmez."
- **4.6.3** ekler: "Sahtekar'da rol ve kelime kişiye özeldir; oylar sonuca kadar gizlidir."
- **4.6.4** ekler: "Kapışma oyunlarında ilk basanı sunucu belirler; itirazı oyuncular verir."
- **4.6.5** ekler: "İbre'de hedef ipucu verene ve gözlemcilere gider; kilit ve puan sunucudaki ibre değerindendir."
- **4.6.6** ekler: "Vampir Köylü'de rol kişiye özeldir: vampirler birbirini ve gece birbirlerinin seçimini görür; kişinin gece seçimi ve gözcünün öğrendiği yalnızca kendi telefonuna gider. Ölenin ve elenenin rolü herkese açılır, oyundan çıkanınki açılmaz. Gündüz oyları açıktır: kim kime oy verdi herkes görür (K-78)."

**Kural 4:**

- **4.4:**
  - "Anonim ya da profilli katılım oda başına seçilir … mekan sohbetinde mesaj başına seçilir" ve Faz 2 ekindeki mekan sohbeti seçimi şu metne döner: "Anonim kişi kapsül avatar ve hesaba sabit `kapsul-xx55` nick'iyle görünür. Nick profil kimliği değildir; nick ile hesap ya da `public_id` arasındaki ilişki hiçbir yanıtta, Realtime yükünde ve analitik olayında görünmez. Anonim ve profilli arasında check-in başına bir değişiklik yapılır; değişiklikten önce yazılan mesajlar eski kimlikte kalır. Kişinin masaya girdiği andaki kimliği masaya yazılır."
  - Yeni cümle: "Mekan ve masa sohbetinde masa adı gitmez; kişi yalnızca nick'iyle ya da gerçek adıyla görünür."
  - "Masa oturum id'si, takma ad gibi check-in süresince geçerli bir takma kimliktir" cümlesi "Check-in kaydının id'si (masa oturum id'si) check-in süresince geçerli bir takma kimliktir ve masanın kişilerine gidebilir" olur.
  - 'Profilimle'nin fotoğraf şartı kalır (K-4): "Profilli görünmek profil fotoğrafı ister."
  - Eklenir (K-3): "Mekan sohbetinde herkes anonim yazabilir. Erkek ve belirtmeyende anonim seçim yalnızca mekan sohbetini etkiler; oyun akışında ve masada her zaman profillidir."
  - Masa içinde kimlik sabittir (K-10): "Kişinin masaya girdiği andaki kimliği masaya yazılır ve masa süresince değişmez."
  - Eklenir (K-49): "Profil ekranlarında kapsül ve nick yalnızca kişinin kendi profil sekmesinde, fotoğrafla yan yana görünür. Başkasının profilinde, arkadaşınki dahil, kapsül ya da nick hiçbir ekranda görünmez; profil yanıtı başkasına kapsül görünüşünü ve nick'i taşımaz."
- **4.5:**
  - "diğer masalara … masa takma adı, kişi sayısı ve varsa niyet etiketi gider" ve Faz 3'ün lobi cümlesi: "masa adı, masa simgesi, telefon sayısı, varsa niyet ve oyun etiketi" (masa simgesi K-45; kimse hakkında bilgi taşımaz).
  - "oda sürerken o odanın üyelerine" ve Faz 2'nin "odanın iki tarafındaki bütün telefonlara" ifadeleri: "masa sürerken masanın bütün kişilerine".
  - "Lobide süren oda yalnızca iki liderin takma adını, taraf başına telefon ve kişi sayısını gösterir" cümlesi: "Süren masalar listesi masa adını ve telefon sayısını gösterir."
  - Faz 3'ün 23.2 cümlesindeki "Oyun akışında (katılma isteği, 'Masanı lobiye aç', 'Bu masadayım'; 'Masanla oyna' oyun akışı sayılmaz)" ifadesi "Oyun akışında ve masada (masa kurma, Katıl, 'Bu masadayım', davete katılma)" olur: "Masanla oyna" ayrı mod olmaktan çıkar (§4.E).
  - Kişi sayısına ve taraflara yapılan diğer atıflar kalkar.
- **4.7:** "Koordinat, mekan ve aktif masa hiçbir kullanıcıya, arkadaşa da gitmez" cümlesinin ardına istisna eklenir: "İstisna (masa daveti): masa sahibi, aynı mekanda check-in'i olan bir arkadaşına masa daveti gönderebilir. Davet masa adını ve telefon sayısını taşır, mekan adı taşımaz ve 2 dakika geçerlidir. Davet ekranı kimin mekanda olduğunu göstermez: sunucu daveti yalnızca aynı mekanda check-in'i olana iletir, gönderen her durumda aynı yanıtı alır."

**Kural 5:**

- **4.4:** "Mekan sohbetinde sessize alınan bunu hiçbir biçimde görmez. Sessize alma kimliğe bağlıdır: anonim kimliği sessize almak aynı kişinin profilli mesajlarını gizlemez."
- **4.5:**
  - Faz 3 eki: "İki taraflı masa hareketsizlikle kapanmaz. Tek taraflı masa (lobide bekleyen ve 'Masanla oyna')…" cümlesi "İki ve daha fazla kişili masa hareketsizlikle kapanmaz. Tek kişilik masa 30 dakika hareketsizlikte sessizce kapanır; lobide bekleyen masaya bekleyen istekler `unavailable` olur" olur.
  - Faz 3 eki (23.3), "Masa sonunda 'Arkadaş ekle' karşı taraftaki her çift için ayrıdır … karşı taraf bunu hiçbir biçimde görmez" (K-66, K-67, K-70), şu metne döner: "Masa sonunda 'Arkadaş ekle' masada en az 3 dakika birlikte bulunan her çift için ayrıdır; birlikte gelenler ayrı tutulmaz. Zaten arkadaş olanlarda düğme yoktur ('Arkadaşsınız'); 3 dakikadan az birlikte bulunan Masa bitti listesine girmez. Aynı sessiz düğme oyun geçmişinden de sunulur (`play_history.friend_open`). İki taraf basarsa arkadaş olunur; tek taraf basarsa hiçbir şey olmaz. Basan, yeniden basarak eklemeyi geri alabilir; eşleşmeden sonra geri alma yok sayılır. Karşı taraf eklemeyi de geri almayı da hiçbir biçimde görmez. Eşleşince ilk basana bildirim gider; bildirim mekan ve masa adı taşımaz."
  - Faz 2 eki (22.2), "Lider kendi tarafındaki bir üyeyi engellerse … Aynı taraftaki telefonlar arasında oyun geçmişi ve 'Arkadaş ekle' yoktur" (K-13, K-66), şu metne döner: "Masada sahip birini engellerse engellenen masadan çıkarılır; katılımcı kimi engellerse engellesin kendisi çıkar. Oyun geçmişi masada en az 3 dakika birlikte bulunan her çift arasında yazılır."
  - Aynen kalanlar: katılma isteğinde ve "Bu masadayım"da red ve zaman aşımının aynı görünmesi; arkadaşlık isteğinde red ve kalıcı red; arkadaşlıktan çıkarma; mekan sohbetinden gelen isteğin günlük sınırı.
- **4.7:** "Masa sonundaki ve oyun geçmişindeki 'Arkadaş ekle'nin tek taraflı basışı sessizdir ve bildirim üretmez. Bildirime açık arkadaşlık istekleri (mekan sohbetinden istek, oyun geçmişinden 'İstek gönder') ve eşleşme düşer; eşleşme yalnızca ilk basana bildirilir (K-70). Masa davetinde red ve zaman aşımı gönderene aynı görünür; reddedilen istekten ya da davetten karşı taraf haberdar olmaz."

**Kural 6 (4.3):** eklenir: "Keşfet ve Aktiviteler'de konuma göre sıralama ya da 'yakındaki' listesi yoktur; şehir ve semt seçilir; bugün etkinliği olan mekanlar üstte, sonra ada göre sıralanır. Kişinin kendi check-in'i yalnızca kendisine gösterilir."

**Kural 9:**

- **4.5:**
  - "oda kanallarına yalnızca odanın iki masası" ve Faz 2 eki: "Oda kanallarına (`room:`, `messages:`, `game:`, `presence:`) masanın o anki kişileri abone olur; masadan çıkanın erişimi hemen kapanır."
  - "lobi kanalına mekandaki masalar abone olur" ve `venue_chat:`'in "o mekanda aktif masası olanlar" ifadesi: "mekanda check-in'i olanlar".
- **4.6.5:** "`dm_typing:` istemcinin yayın yaptığı tek kanal" ifadesi "iki kanaldan biri" olur ve eklenir: "`ibre:{room_id}` istemcinin yayın yaptığı ikinci kanaldır: yalnızca masanın o anki kişileri abone olur ve yayın yapar; olay `needle`, yük yalnızca 0–100 arası bir sayıdır; yalnızca ibre sürüklenirken ve saniyede en çok 10 kez gönderilir; hiçbir şey saklanmaz. Canlı konum otorite değildir: kilit ve puan sunucudaki değerdendir."
- Faz 3 eki (tanışma penceresi) 23.4b'de güncellenmiş hâliyle kalır.

**Kural 10:**

- **4.4:** mekan sohbeti zincirinin sonuna `venue_chat_mutes` eklenir (§4.K).
- **4.5:**
  - "Masa oturumu" ifadesi "check-in (masa oturumu)" olur; `for no key update` kuralı aynen.
  - Zincir: `profiles` → `table_sessions` → `rooms` → `room_members` → `join_requests` → `table_votes` → `game_proposals` (4.8'e kadar) → odanın satırları (`game_players`, `tabu_turns`, `game_secrets`, `room_used_cards`, `messages` → `message_reactions`, `game_events`, `play_history`).
  - Faz 2 eki: "Masaya katılma, masadan ayrılma ve sahiplik devri bu sırayla kilitler; her biri `locks` kalıbında testle gelir."
  - Faz 3 eki genelleşir: "Bir masanın başka bir masaya katılması iki masayı kilitler: istekçinin check-in'i → iki `rooms` satırı `id` sırasıyla → iki masanın `room_members` satırları → `join_requests`; birbirini aynı anda kabul eden iki masada biri geçer, diğeri `room_not_available` alır."
- **4.7:** `table_invites` `join_requests`'ten sonra gelir; davete katılma alıcının check-in'ini, iki masayı `id` sırasıyla, `room_members`'ı ve daveti kilitler.
- **4.8:** `game_proposals` metinden çıkar.

**Kural 12:** yalnızca oyun akışı için, aynen kalır (K-3). Erkek ve belirtmeyenin mekan sohbetinde anonim yazması kural 12'nin dışındadır ve 4.4'te kural 4'e yazılır. Tek metin değişikliği 4.5'tedir: "Masanla oyna" kalktığı için "('Masanla oyna' oyun akışı sayılmaz)" parantezi kalkar ve cümle "oyun akışındaki ve masadaki anonimlik kuralını uygular" olur.

**Değişmeyen kurallar:** 1, 2, 7, 8 ve 11.

**Bu PR'da işlenenler:** proje paragrafı (ilk cümle Faz 4 kurgusuyla; Faz 4 ve pilotun v43'ün tamamıyla çıkması) ve kod kuralındaki görsel kaynak (`docs/design/v43/`; ana tuval arşiv).

## 4.P Kararlar

**Proje sahibinin kararları.**

- §4.B'deki 12 madde ve kural metinleri için verilen üç ölçü (18 Ekim; "skall v43 dönüşüm raporu" ve bu belgenin isteği).
- CTO incelemelerinden, v44 raporunun 17 sorusundan ve v45 raporunun 6 sorusundan sonra verilen kararlar (18 Ekim), Fırat paketi ve v46 (19 Ekim). Metinde "K-n" diye anılır:

| No          | Karar                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Nerede                       |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| K-1         | 23.4b'nin saha testi şartı kalkar. Ayrı bir Faz 3 saha testi yapılmaz; bulma yardımı gözlemleri Faz 4 saha testinde yapılır. (23.4b'nin birleşme şartı K-7 ile değişti.)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | §4.M, §4.N                   |
| K-2         | Davet ekranı: bütün arkadaşlar listelenir, kimin mekanda olduğu görünmez; sunucu mekanda olmayana daveti sessizce iletmez; gönderen her durumda aynı yanıtı görür                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | §4.C, §4.G, kural 4          |
| K-3 (P-1)   | Erkek ve belirtmeyen mekan sohbetinde anonim yazabilir; oyun akışında ve masada her zaman profillidir (kural 12 yalnızca oyun akışı için, aynen). Bu hesaplar için anonim seçim yalnızca mekan sohbetini etkiler; check-in başına 1 değişiklik kuralı onlar için de geçerlidir                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | §4.D, kural 4 ve 12          |
| K-4 (P-4)   | Profilli görünmek profil fotoğrafı ister (`photo_required`). Soluk kapsül yalnızca fotoğrafı sonradan gizlenen ya da kaldırılan profil içindir                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | §4.D, kural 4                |
| K-5 (P-12)  | Rakip düğmesi "Yasak!", ödül "Yasak avcısı"                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | §4.C, §4.F                   |
| K-6 (P-13)  | Zil yalnızca Mesajlar'da; alt çubuktaki Mesajlar sekmesinde okunmamış noktası. SPEC_V3 §18.3a bu adımda (4.7) değişir                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | §4.C, §4.G                   |
| K-7         | "OTA telefonda doğrulandı" 23.3b, 23.4a ve 23.4b için birleşme şartı değildir. Telefonda tek kontrol, 4.1 birleştikten sonra 0.5.0 preview APK'sı kurulunca yapılır ve üçünü birlikte kapsar. 23.4b'nin şartı: 23.4a'dan sonraki deploy-dev koşusu yeşil ve `reveal` dev projesinden elle silindi. Eski JS paketli telefonun bir açılışta hata görmesi dev projesinde kabul edildi                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | §4.N; SPEC_V3 §23.N          |
| K-8         | Faz 4 adımları arasında telefon kontrolü birleşme şartı değildir: birleşme şartı `ci` ve E2E 8/8 yeşil ve "onaylandı"; `e2e` etiketi taslaktan çıkarken eklenir (2. CTO incelemesinden sonra proje sahibi). Telefondaki kontrol saha testidir; K-7'deki 0.5.0 APK kontrolü kalır. Saha testi 4.6 ve 4.7 birleştikten sonra, Faz 4'ün tamamını kapsar; `docs/FIELD_TEST.md`'nin Faz 4 sürümü testten önce ayrı belge PR'ıyla yazılır; 4.8 testten sonra gelir ve düzeltmeleri alır. Yalnızca telefonda görünen hatalar teste kadar birikir: PR'lar küçük, OTA'lar ayrı                                                                                                                                                                                                                                                                                           | §4.M, §4.N                   |
| K-9 (P-2)   | Nick Profil'den 30 günde bir yenilenir. Eski nick aynı işlemde `retired_capsule_nicks`'e yazılır ve kimseye verilmez; yeni nick eski mesajları değiştirmez, sessize alma düşmez. Kapasite: eşik emekli nick'leri saydığı için doğru çalışır, ama yenileme kapasiteyi tüketir: en kötü durumda 1.000 kişi bir yılda yaklaşık 12.000 nick harcar; 2 rakamlı biçim 36.100 nick verir (elenenler çıkmadan), yüzde 50 eşiği yaklaşık 18.000'dedir                                                                                                                                                                                                                                                                                                                                                                                                                    | §4.D, §4.H, §4.M             |
| K-10 (P-3)  | Masadaki kimlik girişte yazılır ve masa süresince sabittir; anahtar değişirse yeni kimlik mekan sohbetinde ve bir sonraki masada geçerli olur                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | §4.D, kural 4                |
| K-11 (P-5)  | Mekan sohbetinde "yazıyor" pilotta yok. Tüm sohbeti sessize alma yalnızca telefonda; aktiflik noktasını ve okunmamış sayısını kapatır (push yok)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | §4.C, §4.D                   |
| K-12 (P-6)  | Mekan sohbeti aktiflik noktası: son 10 dakikada mesaj varsa yanar                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | §4.C                         |
| K-13 (P-14) | Sahip masadan ya da mekandan ayrılırsa, check-in'i biterse: sahiplik masaya en erken katılan kişiye geçer, masa sürer; masada kimse kalmadıysa kapanır ("Masayı bitir" ayrıca durur). Engel: sahip engellerse engellenen masadan çıkarılır; katılımcı engellerse kendisi çıkar                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | §4.E, §4.G, kural 5          |
| K-14 (P-16) | Masa sürerken profilde "Arkadaş ekle" yok; düğme masa sonunda ve oyun geçmişinde                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | §4.C, §4.E                   |
| K-15 (P-17) | Aktiviteler'de kampanya türü ve "ilgileniyorum" pilotta yok: bugünkü etkinlikler (`venue_events`) ve Geçmiş                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | §4.C                         |
| K-16 (P-18) | Keşfet'te açık masa sayısı kesin sayı değil, kova ("Birkaç açık masa", "Sessiz")                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | §4.C                         |
| K-17        | Soluk posterde oy verilir; masanın telefon sayısı alt sınıra ulaşmadan sahip o oyunu başlatamaz (v44 raporu soru 8)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | §4.C, §4.F, §4.M             |
| K-18        | Davette geri sayım gönderende görünür; v44'teki gibi (soru 10)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | §4.G                         |
| K-19        | Kayıtta onaylar başta kalır (bugünkü uygulama gibi): telefon, kod ve profil bilgilerinden önce (soru 11). v45'te uygulandı (1/7): telefondan önce (K-33)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | §4.C                         |
| K-20        | Fotoğrafı olmayan ve profilli görünmek isteyen kadına "Fotoğraf ekle"nin yanında "Anonime geç" de önerilir (soru 12)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | §4.C, §4.D                   |
| K-21        | Keşfet: bugün etkinliği olan mekanlar üstte, sonra ada göre (soru 13)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | §4.C, kural 6                |
| K-22        | Erkek ve belirtmeyende Ayarlar'daki "Oyunlara katılım" görünür ve yalnızca mekan sohbetindeki girişteki varsayılanı belirler. Gerekçe: yoksa hep anonim yazmak isteyen biri her girişte tek değişiklik hakkını harcar (soru 14)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | §4.C, §4.D                   |
| K-23        | Alt sekme etiketleri en büyük yazıda en çok 1,2 kat büyür (`maxFontSizeMultiplier`); 320 dp'de sığmazsa 1 (soru 15)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | §4.C                         |
| K-24        | Isınma rengi `#B4481A` (soru 16)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | §4.C                         |
| K-25        | Koyu tema tonları, oyun zeminleri, koyu zemin logosu ve açık temadaki koyu yarı saydam oyun çipleri 4.2'nin PR'ında ekran görüntüleriyle proje sahibinin onayına gelir (soru 17)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | §4.C, §4.N                   |
| K-26        | İlk ekrandaki düğme "Başla"; önce "Başlamadan önce" açılır. v45'te "Telefonla devam et" (v45 raporu soru 1)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | §4.C                         |
| K-27        | Giriş sahnesi kısa kalır: yaklaşık 5 saniye, tek sefer, döngü yok (soru 2)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | §4.C                         |
| K-28        | "Başlamadan önce"den geri gelinince sahne durağan gelir, yeniden oynamaz. v45'te yeniden oynuyor (soru 3)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | §4.C                         |
| K-29        | Son adımda "Bitir" ve "Fotoğrafsız bitir" (soru 4)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | §4.C                         |
| K-30        | Hesap açılınca tek bir başarı titreşimi (`accountReady`). Raporun sıklık sınırları geçerli: aynı an 600 ms'den sık çalmaz, iki titreşim arasında en az 150 ms, yazarken titreşim yok (soru 5)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | §4.C, §4.M                   |
| K-31        | Doğum tarihi adımında 320 dp ve en büyük yazıda dostun gizlenmesi kabul (soru 6)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | §4.C                         |
| K-32 (P-19) | v43 tasarım istisnaları kabul (spec önerisi): Kapsül Anlat'ta iki renkli eşit Pas ve Doğru, bildirim satırlarında birden çok "Kabul et", Ya da kartında iki seçenek; "…" yalnızca mesaj önizlemesinde ve alıntıda (bugünkü Ekran davranışı kuralı). 4.2'de tasarım sistemine istisna olarak yazılır                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | §4.C                         |
| K-33 (P-20) | Onaylar telefondan önce (v45 gibi; v45 raporu §1, 1/7): "Başlamadan önce" kayıtta ilk adımdır. Sunucu değişmez: onaylar bugünkü gibi hesap açılırken `account/complete-onboarding` ile kaydedilir; metinleri güncellenen mevcut kullanıcı "Başlamadan önce"yi bugünkü gibi girişten sonra görür. K-19'un "bugünkü uygulama gibi" gerekçesi bununla düzelir (bugün onaylar koddan sonra geliyordu)                                                                                                                                                                                                                                                                                                                                                                                                                                                               | §4.C                         |
| K-34 (P-7)  | Biyografi ve görünen ad (spec önerisi): telefon, e-posta, kullanıcı adı ve bağlantı içeren biyografi ve görünen ad reddedilir, maskeleme yok. Denetim kural 7 gereği `pure/profanity.ts` ve `trText.ts` içinde, testli; istemci ve Edge Function aynı denetimi kullanır. Biyografi sınırı 160'tan 80'e iner; mevcut uzun biyografiler düzenlenene kadar kalır. 4.2b'nin PR'ında yazıldı; uygulaması 4.3'te                                                                                                                                                                                                                                                                                                                                                                                                                                                      | §4.C, §4.M                   |
| K-35        | Mekan'daki masa kartında kalan süre, "Noktanı değiştir" ve "Masa adını değiştir" 4.5'e kadar küçük, sessiz bir ikinci satırda (proje sahibi kararı, 4.3). Masa ekranına taşınmaz: odadayken sunucu ikisini de `in_room` ile reddediyor. 4.5'te süre ve nokta Mekan'da kalır, ad değiştirme masa ekranına geçer (`rooms.name`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | §4.C                         |
| K-36        | Masa kartının başlığı masa ekranını açar; odası olmayan masada oda kurulmaz, "Masanla oyna" odası yalnızca bir oyun seçilince kurulur (proje sahibi kararı, 4.3). Gerekçe: "Masanla oyna" odasındayken lobideki "Katıl" ve "Bu masadayım" kapalı; başlığa merakla basan biri 30 dakika başka masaya katılamazdı                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | §4.C                         |
| K-37        | Keşfet'te tek aktif mekan varken o mekanın kartı ve önümüzdeki 7 günün etkinlikleri (SPEC_V3 §4 davranışı), v44'ün renk ve yazısıyla; şehir düğmesi, "Mekan ara" ve tür çipleri görünmez. İki ve üstü mekanda v44 listesi. Aktiviteler K-15 gibi yalnızca bugünü gösterir (proje sahibi kararı, 4.3)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| K-38        | Keşfet'in varsayılan şehri en çok aktif mekanı olan şehirdir. Son seçim yalnızca telefonda saklanır, sunucuya gitmez. Aktif mekanı olan tek şehir varsa şehir düğmesi görünmez (proje sahibi kararı, 4.3)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| K-39        | Masa ekranındaki sahip çubuğu: odası yokken "Lobiye aç" ve "Davet et"; lobide bekleyen masada "Lobiden çek" ve "Davet et"; birleşmiş ve "Masanla oyna" masasında "Davet et" yalnızca o masaya bugün "Bu masadayım" ile girilebiliyorsa görünür, girilemiyorsa çubuk hiç görünmez (proje sahibi kararı, 4.3). Sunucunun bugünkü kuralı (`rooms_request_join`): "Masanla oyna" masası lobide değildir (`visibility = 'private'`), "Bu masadayım" ona hiç girmez; birleşmiş masaya iki masa da takım yetenekliyse (`team_capable`) ve o tarafta 4'ten az telefon varsa girer. Entegrasyon testiyle (`teams.test.ts`). Uygulama karşı masanın takım yeteneğini görmez: bugünkü uygulama her check-in'de gönderdiği için kabul, sunucu değişikliği yok. Birleşmiş masada tarafta 4 telefon varsa "Davet et" gizlenir (uygulama telefon sayısını bilir)               |
| K-40        | Masa ekranında "Diğer" menüsü Bitir ya da Ayrıl'ın yanında bugünkü üç eylemle kalır: liderin "Ayrıl"ı, Şikayet, Engelle. 4.5'te Şikayet ve Engelle kişi başına Masadakiler'e taşınır, menüde sahibin "Ayrıl"ı kalır (§4.E) (proje sahibi kararı, 4.3)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| K-41        | Keşfet'in kova metinleri: "Sessiz" (0–2), "Birkaç açık masa" (3–5), "Kalabalık" (6+) (proje sahibi kararı, 4.3; K-16'nın metinleri)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| K-42        | Keşfet'in sayım satırı: bugün etkinliği olan mekan varken "N mekan · bugün etkinliği olanlar önce", yokken "N mekan · ada göre" (proje sahibi kararı, 4.3)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| K-43        | Keşfet'te satıra basınca 4.3'te bugünkü mekan sayfası v44 görünümüyle açılır. v44'ün giriş alt sayfası (nokta çipleri, kimlik notu) 4.5'te gelir (§4.E) (proje sahibi kararı, 4.3)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| K-44        | Aktiviteler'de etkinlik kapağı mekan türüne göre iki çizimdir (kafe, kampüs), v44'ün çizimlerinden; `venue_events`'e alan eklenmez (proje sahibi kararı, 4.3)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| K-45        | Masa simgeleri (adım 4.5): 20 temada 100 sahne, uygulamada 256 px WebP (`apps/mobile/assets` altında; SVG canlı çizilmez). `rooms.icon` simgenin kalıcı kimliğidir, metin (ör. `kis-kardanadam`); sunucu `pure/` altındaki üretilmiş listeyle doğrular. Sunucu, mekandaki açık ve süren masalarda kullanılmayan bir simgeyi rastgele atar. Aynı anda kurulan iki masada tekrar olmaz: mekan ve aktif masa üzerinde benzersizlik, çakışmada yeniden seçim. Sahip kurarken ve sonra değiştirebilir (sonra: K-59); ad değişince simge kalır. Köşeleri yuvarlatılmış kare (kişiler yuvarlak). Lobide, süren masalarda, istek satırında ve Masadakiler'de görünür. Kural 4'ün lobi cümlesine "masa simgesi" eklenir (§4.O). Simge kimse hakkında bilgi taşımaz (Fırat paketi, v46)                                                                                   |
| K-46        | Kapsül görünüşü (adım 4.4): `profiles.capsule_variant` (0–27) yerine `profiles.capsule_look` (kısa metin kodu, ör. `c:pembe e:koyu h:kulaklik`). 28 varyant hazır görünüş olarak kalır, kayıtta biri atanır (v46 kataloğundaki 28 kod, K-61). Sunucu kodu katalogla doğrular, bilinmeyen parçayı atar. Katalog `content/` altında JSON; istemci çizim için, sunucu doğrulama için aynı listeyi `pure/` altındaki üretilmiş bir dosyadan okur, eşitliği testli. Kolon istemciye kapalı kalır (`gender` kalıbı); başkalarına yalnızca bağlamında (anonim mesaj, masadaki anonim kişi) nick'le birlikte gider. Görünüş, nick gibi, yazıldığı anda saklanır: `venue_chat_messages.sender_look`, `messages.sender_look`, `room_members.look` (masada sabit, K-10 gibi); görünüş değişince ya da nick yenilenince eski mesaj eski görünüşle döner (Fırat paketi, v46) |
| K-47        | Kapsül süsleme ekranı (yeni adım 4.4b; 4.4'ten sonra, 4.5'le aynı anda yürüyebilir): raflar, paketler, yuvalar, Karıştır, Hepsini çıkar, Kaydet. Sunucuda `profile/set-look`; görünüş 4.4'teki gibi doğrulanır. Listelerde görünüş kodu başına bir kez çizilir, önbelleğe alınır (4.3c kalıbı) (Fırat paketi, v46)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| K-48        | Anonim anahtar hakkı check-in başına 1 kalır (K-3 aynen; v46'da da 1) (Fırat paketi, v46)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| K-49        | Kapsül yalnızca kişinin kendi profil sekmesinde fotoğrafla yan yana görünür ("Masada görünen" işareti). Başkasının profilinde, arkadaşınki dahil, hiçbir ekranda kapsül ya da nick görünmez: anonim kimlik gerçek kişiyle eşleşirdi (kural 4). §4.D'de ve kural 4'ün Faz 4 ekinde (§4.O); 4.4'ün testlerinde "profil yanıtı başkasına `capsule_look` ve nick taşımaz" (Fırat paketi, v46)                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| K-50        | Süsleme rafları cinsiyetsiz adlıdır (v46'daki adlar). Başlangıç görünüşü cinsiyetten türetilmez (kural 12) (Fırat paketi, v46)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| K-51        | Katalogdan "Yıldız bıçak" ve "Fes" çıkar. Kalp, hayvan kulakları, nazar, çay ve simit kalır. Mevsim paketleri bütün yıl açık (Fırat paketi, v46)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| K-52        | Duygular yalnızca kişinin kendi ekranında; sunucuya gitmez, kaydedilmez. "Kafama dokun" ipucu kurulumda bir kez (Fırat paketi, v46)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| K-53        | Bildirim ayarları (adım 4.7): kişi başına üç tercih (K-62); push gönderilmeden önce okunur. Mekan sohbeti yanıtları ve kampanya satırı yoktur (SPEC_V3 §7.4, K-15). §4.H'deki `profiles.notify_invites` bu tercihlerin içine taşınır (Fırat paketi, v46)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| K-54        | Görünüm ayarı (adım 4.3): Ayarlar'da Sistem, Açık, Koyu; varsayılan Sistem; seçim yalnızca telefonda saklanır. Yalnızca istemci, OTA. Bugünkü "Tasarım (test)" seçicisi buna dönüşür (Fırat paketi, v46)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| K-55        | Doğum tarihi onay alt sayfası (adım 4.3): kayıtta doğum tarihinden sonra "N yaşındasın" ve "Doğum tarihin 5 Nisan 2001. Sonra değiştiremezsin." (v46'nın metni, K-63), Onayla ya da Düzelt. Yalnızca istemci (Fırat paketi, v46)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| K-56        | Masa bitti ekranı (adım 4.5): masadaki her kişinin yanında sessiz "Arkadaş ekle" (kural 5); çiftler K-66'da, görünüm K-64'te (Fırat paketi, v46)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| K-57        | Fırat'ın v44 paketinden alınmayanlar: koyu paleti (K-25 aynen), kayıt ekranları ve metinleri (K-26, K-29), davette yalnızca aynı mekandaki arkadaşlar (K-2 aynen: kimin mekanda olduğu görünmez), Keşfet'te konuma göre sıralama (Fırat paketi, v46)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| K-58        | Masa ekranının üst satırında harfli yuvarlak yerine masa simgesi (36 px), sahipte ve katılımcıda (adım 4.5; v46)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | §4.E                         |
| K-59        | Simge değişikliği (K-45; adım 4.5): sahip, masa ekranındaki ya da Mekan'daki kendi masa kartındaki simgeye dokununca Masa kur'daki seçici açılır (`rooms/set-icon`); başkası dokununca bir şey olmaz. Yeni çizim yok (v46 raporunun 1. açık sorusu)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | §4.C, §4.E                   |
| K-60        | Profil (adım 4.4b): "Anonim adın" kartında kapsül yok. Süsleme düğmesi profil açılınca iki kez oynar ve 3,1 sn'de durur; hareketi azaltta hiç oynamaz (v46)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | §4.D                         |
| K-61        | Hazır görünüşler (adım 4.4) v46 kataloğundaki 28 koddur (`hazir_gorunusler`). Melek, Tavşan (krem) ve Viking (boynuz, sakal) v46'daki gibi kalır. Kütüphaneye beyaz renk ve miğfer eklenmez, çünkü her hazır görünüş kütüphanedeki parçalardan kurulur (v46 raporunun 2. açık sorusu)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | §4.D                         |
| K-62        | Bildirim ayarları (K-53; adım 4.7) üç satır: Arkadaşlık istekleri, Masa davetleri, Birebir mesajlar. Katılma isteği ve kabul push'larının ayarı yok, bugünkü gibi gider (v46)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | §4.G, §4.M                   |
| K-63        | Doğum tarihi onayının (K-55; adım 4.3) metni v46'daki gibi: "N yaşındasın" ve "Doğum tarihin 5 Nisan 2001. Sonra değiştiremezsin." K-55'in metni buna göre düzeltildi                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | §4.C                         |
| K-64        | Masa bitti (K-56; adım 4.5): anonim katılan dahil listedeki herkeste "Arkadaş ekle". Basınca "Eklendi"; eşleşince "Arkadaş oldunuz" ve "Mesaj". Masa süresi ve oyun sayısı yok (v46)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | §4.E                         |
| K-65        | v46'nın kontrast ve koyu harita düzeltmeleri (v46 raporu, bölüm 8) 4.3'ün kalan OTA işleridir (proje sahibinin önerisi): yer tutucu yazı, oyunlardaki beyaz açıklama yazıları, "İtiraz"ın örtüsü, Keşfet haritası. Süresi geçmiş bildirim satırı bugün yok; 4.7'de zil listesiyle gelir                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | §4.C, §4.N                   |
| K-66 (P-15) | Oyun geçmişi kaydı ve sessiz "Arkadaş ekle" (adım 4.5): masada en az 3 dakika birlikte bulunan her çift. Zaten arkadaş olanlarda düğme yerine "Arkadaşsınız". Birlikte gelenler ayrı tutulmaz. 3 dakikadan az birlikte bulunan Masa bitti listesinde yok. Kural 5'in "karşı taraftaki her çift" ifadesi ve Faz 2'nin taraf cümleleri buna göre yeniden yazılır (§4.O)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | §4.E, §4.M, §4.O             |
| K-67        | "Eklendi"ye yeniden basmak eklemeyi geri alır; karşı taraf bunu hiçbir biçimde görmez (kural 5). Oyun geçmişindeki düğme de aynı. Adım 4.5'te yeni sunucu eylemi (ör. `friends/withdraw-add { historyId }`). Kişinin `play_history` satırı önce yalnızca kilitlenir; sonra çift kilidi. Arkadaşlık yoksa niyetin silinmesi ve `friend_action_at`'in boşalması çift kilidi altında birlikte yapılır (CTO incelemesi, WazzupDevs/Kabuk#174). `locks` kalıbında test; iki sonuçta da `friend_action_at` denetlenir. Eşleşme olmuşsa geri alma yok sayılır ve yanıt arkadaş olunduğunu söyler                                                                                                                                                                                                                                                                       | §4.E, §4.J, §4.K, §4.M, §4.O |
| K-68        | Anonim katılan kişinin kendi Masa bitti ekranında (adım 4.5), alttaki notun yanında: "Arkadaş olursanız anonim adının sen olduğunu görür. İstersen Profil'den adını yenileyebilirsin." Gerekçe: nick yenilenene kadar kalıcıdır (K-9). K-49 arkadaşa nick'i bu yüzden göstermez; eşleşme ise bu bağı kurar                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | §4.C, §4.E                   |
| K-69        | "Geliyor" hâli yok (adım 4.5): kabul edilen kişiler kabul anında Masadakiler'e normal üye olarak girer, masa ekranının üst satırı "N kişi". §4.E'deki tek seferlik "Y geliyor, N kişi" bildirimi kalır. v46'da gelen masa telefonları katılana kadar "Geliyor"                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | §4.C, §4.E                   |
| K-70        | Eşleşme bildirimi (adım 4.5; sunucu değişikliği, PR proje sahibinin onayına gelir): eşleşmeyi kuran basışın karşı tarafına (ilk basana) push, `notify_friend_requests` ayarıyla. Yeni kolon yok; bildirim ayarlarında satır aynı. Push mekan ve masa adı taşımaz. 4.7'de zil listesinde de bir satır. Tek taraflı basışta hiçbir şey gitmez (kural 5). v46'daki not metni aynen kalır                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | §4.E, §4.G, §4.J, §4.M, §4.O |
| K-71 (P-8)  | Sahtekar (adım 4.6.3): ipucu kişi başı 30 sn; 7 ve üstü oyuncuda 2 sahtekar, birbirini bilmez; kısmi yakalamada masaya yakalanan her sahtekar için puan                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | §4.F, §4.M                   |
| K-72 (P-9)  | Kapışma (adım 4.6.4): itiraz eşiği kapan dışındakilerin yarıdan fazlası; bire birde tek itiraz yeter; gözlemci itiraz edemez; Şarkıda Geçsin'de aynı şarkı serbest, itirazla çözülür. Ek: bire birde itiraz geçip soru itiraz edene açılınca ilk kapanın onun cevabına itiraz hakkı kalır; o da itiraz ederse soru boş geçer                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | §4.F, §4.M                   |
| K-73 (P-10) | İbre (adım 4.6.5): rakibin sol ya da sağ tahmini kalır (bugünkü kural: 15 sn, doğruysa rakibe 1 puan; ibre hedefin tam üstündeyse puan yok)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | §4.F, §4.J                   |
| K-74 (P-11) | Sohbet kartları (adım 4.6.2): kartı sahip ilerletir; başka oyun başlayınca kartlar kapanır; Ya da'da yalnızca sayılar görünür. `film-dizi-muzik` ve `hic-yaptin-mi` kartları pasif olur (`is_active = false`), içerik silinmez. Ek: Kampüs ve Ya da kartlarının taslağı 4.6.2'de yazılır ve kullanıcıya görünen içerik olduğu için birleşmeden önce proje sahibinin onayına gelir                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | §4.F                         |
| K-75        | K-66 düzeltmesi (kural 4; CTO incelemesi, WazzupDevs/Kabuk#182): "Arkadaşsınız" yalnızca kişi masada profilliyse görünür (uygulama kendi arkadaş listesinden `public_id` ile bilir). Anonim oturan kişide düğme normaldir ve basış arkadaşlıkta hiçbir şey değiştirmez. Sunucu masadan önceki arkadaşlığı `add-from-room`'da ve `withdraw-add`'de eşleşmeyen basıştan ayırt edilemez döndürür (`friends: false`); `friends: true` yalnızca arkadaşlık bu karşılaşmada kurulduysa (iki taraf da bastı). Eski "İstek gönder" yolunda (`friends/request { historyId }`) kayıttaki kişi masada anonimse zaten arkadaş olmak `ok` döner ve hiçbir şey olmaz (kural 5'in sessiz yutma kalıbı); `already_friends` yalnızca profilli oturan kişide (CTO tekrar kontrolü, proje sahibi)                                                                                  | §4.E, §4.M, kural 4          |
| K-76        | Masanın adı simgesidir (proje sahibinin kararı, 27 Ekim): kurarken ve simge değişince masanın adı seçilen simgenin adı olur (ör. "Uzay istasyonu"). Simge mekanda açık ve süren masalarda benzersiz olduğundan ad da benzersizdir. Hiç boş simge kalmazsa sunucu "Sıfat İsim" çeker. Masadakiler'deki "Başka ad" kalkar (`reroll-name` sunucuda kalır, uygulama çağırmaz). K-45'in "ad değişince simge kalır" cümlesi bu kararla "simge değişince ad da değişir" olur                                                                                                                                                                                                                                                                                                                                                                                           | §4.E                         |
| K-77        | Masa ekranının oyun kısmı sıfırdan (proje sahibinin dosyası skall-oyun-kartlari, 27 Ekim): altı kart, adları ve satırları Vampir Köylü (Vampirleri bul, 5-12), Signum (Kodu çöz, 4+), Kinshi (Yasaklıyı söyleme, 4+), Krot (Aramızdaki kim?, 3+), Sprengja (Bombayı çabuk at, 3+), Kaupholl (En yakına yatır, 3+); süzgeç Tümü, Takımlı, Çok oyunculu. Kartlar dosyanın çizimidir (`apps/mobile/assets/game-card/`). Oyunların kendisi 4.6'daki adımlarıyla gelir; o zamana kadar her kart "Yakında" ve basılmaz. Sunucunun oyun listesi (`_shared/pure/tableGames.ts`) ve oyun etiketleri 4.6'da bu adlarla eşlenir                                                                                                                                                                                                                                            | §4.E                         |
| K-78        | Vampir Köylü (adım 4.6.6; proje sahibinin kararları, 29 Ekim): gündüz oyları açık ve canlı (kim kime oy verdi herkes görür; kural 3 eki); oyundan ya da masadan çıkan oyuncu ölmüş sayılır, rolü açılmaz; rol kartında 30 sn sınırı, herkes hazır olunca ya da sahip başlatınca gece erken başlar                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | §4.F                         |
| K-79        | Test botları (proje sahibinin kararı, 29 Ekim): tek telefonla oyun denemek için masa sahibi masasına bot oturtur (Masa → "Test botları": "Bot ekle", "4 bot ekle", "Botları kaldır"; `rooms/test-bots`, `add-bots`, `remove-bots`). Yalnızca yerel stack'te ve dev projesinde (`_shared/pure/devProject.ts` → `testBotsAllowed`); pilotta sunucu yok der ve kart görünmez. Bot, hiç giriş yapmayan bir hesaptır; kişinin yolundan oturur (check-in, Katıl ya da Bu masadayım, sahibin kabulü), anonim kapsülle görünür. Oyunda kendiliğinden oynar (Vampir Köylü: `test_bots_vampir`, oyunun kendi eylemleriyle); sonraki oyunlar botlarını kendi adımlarıyla ekler                                                                                                                                                                                             | §4.E, §4.F                   |

**Fırat paketi (v46).** Proje sahibinin onayladığı kararlar K-45–K-57'dir; pakette K-41–K-53 diye numaralanmışlardı. K-41–K-44 o sırada Keşfet ve Aktiviteler kararlarına verildiği için numaralar dört kaydı (proje sahibinin kuralı: çakışmada main'deki son K'dan devam; Fırat paketi en son).

**v46 (19 Ekim).** K-58–K-65 v46 geldiğinde verilen kararlardır. K-66–K-74 proje sahibinin aynı gün verdiği kararlardır; K-71–K-74 son dört açık kararı (P-8–P-11) kapatır. v46 raporunun iki açık sorusu K-59 (simge değişikliği) ve K-61 (üç hazır görünüş) ile, v46'nın iki farkı K-69 ("Geliyor") ve K-70 (eşleşme bildirimi) ile cevaplandı.

**Açık kararlar.** İlgili adımdan önce proje sahibine sorulur; karar verilmeden o adımın işi başlamaz. P-1, P-4, P-12 ve P-13 (K-3…K-6), sonra P-2, P-3, P-5, P-6, P-14, P-16, P-17 ve P-18 (K-9…K-16), sonra P-19 (K-32) ve P-20 (K-33), sonra P-7 (K-34), sonra P-15 (K-66), sonra P-8–P-11 (K-71–K-74) karara bağlandı. Açık karar kalmadı.

**Bu belgede önerilen teknik kararlar (onay bekler).**

- **Check-in kaydı `table_sessions` olarak kalır** (§4.E): ad değişmez; anlamı değişir. Mekan sohbeti ve lobi koşulu kayıt olarak aynıdır.
- **Masa adı masanındır** (`rooms.name`), 3 yenileme hakkı masa başına (§4.E).
- **"Masanla oyna" ayrı mod olmaktan çıkar** (§4.E): lobide olmayan masa kendi içinde oynar.
- **Katıl isteği masa taşır** (§4.E): istekçi masanın kişileri kabulde aynı işlemde taşınır, istekçi masa kapanır (23.1 kalıbının genellemesi). Başka bir masanın katılımcısı Katıl gönderemez.
- **"Süren masalar" mekandaki lobide olmayan bütün masalardır, tek kişilik masa dahil** (§4.E; proje sahibi: kalsın). Liste yalnızca masa adını ve telefon sayısını gösterir. Gerekçe:
  - "Bu masadayım" fiziksel olarak masada oturan kişinin yoludur. Bir grup oturunca masayı biri kendi telefonunda kurar; diğerleri katılana kadar masa tek telefonludur. Tek telefonlu masayı gizlemek en sık başlangıcı kapatırdı.
  - Telefon sayısı masada kaç kişinin oturduğunu söylemez. 2 telefon eşiği yalnız oturan kişiyi listeden çıkarırdı ama arkadaşlarıyla oturan ve ilk katılanı bekleyen kişiyi de çıkarırdı.
  - Yabancıdan gelen istek sessizce reddedilebilir: red ve zaman aşımı istekçiye aynı görünür (`unavailable`, kural 5). İstek sahibe istekçinin adı, yaşı ve fotoğrafıyla gelir (profilli istekçide), sahip kimi tanıdığına bakarak karar verir.
- **Tek lobi okuması `venue_tables`** (§4.E): dört eski okuma 4.8'de kalkar.
- **4.5 migration'ı açık masaları kapatır** (§4.H): pilot yoktur, OTA aynı gün gider.
- **Kapsül nick sunucuda atanır ve saklanır** (§4.D); kolonlar istemciye kapalıdır.
- **Emekli nick'ler** (§4.D): silinen hesabın nick'i (ve yenilenen nick, K-9) `retired_capsule_nicks`'te yalnızca metin olarak tutulur (hesapla bağı ve tarihi yok); doluluk hesabına girer.
- **4.5'te eski takma ad kolonları** (§4.H): `table_sessions.alias` boş olabilir ve benzersiz indeksi kalkar; `not null` kopyalar 4.8'e kadar yeni kaynaklarından dolar.
- **`senderKey`** (§4.D): kimliğe göre ayrılan opak anahtar; iki kimliği bağlamaz.
- **Sessize alma sunucuda ve kimliğe bağlı** (§4.D): kimliğe bağlı olmasaydı iki kimlik eşleşirdi.
- **Mekan sohbetinde kendi mesajını silme** (§4.D): v43'te var.
- **`identity_mismatch`** (§4.D): eski istemcinin anonim sandığı mesaj profilli gitmez.
- **Takım seçmeyen kişi oyun başında gözlemcidir; oyun sırasında gelen kişi gözlemcidir** (§4.F).
- **Poster alt sınırı Kapsül Anlat ve İbre için 4** (§4.F): takım başına 2 kişi kuralı.
- **Ara ekranda 15 sn kuralı** (§4.F): sahip geçmezse herhangi bir telefon geçirir.
- **Sahtekar:** "Hazırım"da 30 sn üst sınır; sahtekar oyundan çıkarsa oyun puansız biter; son şans yazılı ve `trText` ile eşleşir (§4.F).
- **Kapsül Anlat'ta 1 kişiye düşen takım oynamaya devam eder** (§4.F).
- **İbre'nin değeri bırakınca yazılır** (`ibre/move`), canlı konum yalnızca yayındır (§4.F).
- **Bildirim tablosu yok;** liste `my_notifications()` okumasıdır, rozet `notifications_seen_at` (§4.G).
- **Davet sınırları:** aynı arkadaşa tek bekleyen davet, sahip başına saatte 30 (§4.G).
- **Davete katılmak "Masadan ayrıl" kuralını uygular** (§4.G).
- **Davet push'u ad, masa ve mekan taşımaz** (§4.G).
- **Fonksiyon sayısı değişmez** (§4.J): eylemler mevcut fonksiyonlara eklenir; 23.4a'dan sonra 17.

### v43 raporunun 25 sorusu

Numaralar devir raporunun §6'sındakidir. "Kural" atıfları raporun brief numaralarıdır, CLAUDE.md'ninkiler değil; cevaplarda CLAUDE.md numaraları kullanılır.

| No  | Soru                                                                                      | Cevap                                                                                                                                                                                                                       |
| --- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Sahip en çok oy alan dışında bir oyunu başlatabilir mi?                                   | Evet (§4.B-4, §4.F)                                                                                                                                                                                                         |
| 2   | Kategoriler ve oyunların dağılımı                                                         | v43'teki gibi: Takımlı (Kapsül Anlat, İbre), Bire bir (Harf Kapmaca, Şarkıda Geçsin), Çok oyunculu (Sahtekar, Harf Kapmaca, Şarkıda Geçsin, Sohbet kartları) (§4.F)                                                         |
| 3   | İstekler sekmesi ve gelen istek bildirimi: istek karşı tarafa görünecek mi?               | Yalnızca açık istekler görünür (mekan sohbetinden istek, oyun geçmişinden "İstek gönder"); masa sonundaki "Arkadaş ekle" sessizdir (kural 5, §4.G); eşleşme ilk basana bildirilir (K-70)                                    |
| 4   | Arkadaş olmayana mesaj                                                                    | DM yalnızca arkadaşlar arasında; "Mesaj" düğmesi arkadaş değilken görünmez, yerine bağlama göre "Arkadaş ekle" (§4.G)                                                                                                       |
| 5   | Anonim katılım nerede seçilir, masa sırasında kilitlenir mi?                              | Mekan ekranının üst satırındaki anahtar; check-in başına bir değişiklik (§4.D). Erkek ve belirtmeyende seçim yalnızca mekan sohbetini etkiler (K-3). Masa içinde kimlik sabit (K-10)                                        |
| 6   | Mekan sohbeti aktiflik noktası                                                            | Son 10 dakikada mesaj varsa (K-12)                                                                                                                                                                                          |
| 7   | Okundu tiki ve yazıyor                                                                    | DM'de var (SPEC_V3 §18.2). Mekan sohbetinde "yazıyor" yok (K-11)                                                                                                                                                            |
| 8   | Engelle, Bildir, Arkadaşlıktan çıkar: karşı taraf ne görür?                               | Engellenen ve şikayet edilen hiçbir şey görmez; çıkarılan çıkarmayı engellemeden ayırt edemez (kural 5). Masada engel K-13                                                                                                  |
| 9   | Bio sınırı ve iletişim bilgisi filtresi                                                   | K-34 (P-7)                                                                                                                                                                                                                  |
| 10  | Masa bitince akış                                                                         | "Masa bitti" ekranı: masadakiler ve kişi başına sessiz "Arkadaş ekle" (§4.E); ekran v44'te                                                                                                                                  |
| 11  | Başka mekana girişte eski masa kapanınca katılımcılara ne olur?                           | Yeni check-in eski check-in'i bitirir; kişi masadan ayrılmış sayılır. Masa diğerleri için sürer; sahipse sahiplik en erken katılana geçer (K-13, §4.E)                                                                      |
| 12  | Aktiviteleri kim girer?                                                                   | Geliştirici, `pnpm admin:event` ile. Kampanya türü pilotta yok (K-15)                                                                                                                                                       |
| 13  | Oyun geçmişi kaydedilecek mi?                                                             | Evet: `play_history` (3 dakika kuralı) ve `game_results`; Aktiviteler → Geçmiş bunlardan (§4.F)                                                                                                                             |
| 14  | "Yakındaki" sıralaması                                                                    | Konuma göre sıralama yok (kural 6, §4.C); bugün etkinliği olan mekanlar üstte, sonra ada göre (K-21)                                                                                                                        |
| 15  | Mekan adlarına karakter sınırı                                                            | Sınır yok; ad içerikten gelir, ekran en çok iki satıra kırar ve küçültür (§4.C)                                                                                                                                             |
| 16  | Mekan sohbeti gizliliği, ad engel listesi                                                 | Görünen ad ve biyografi küfür filtresinden geçer (kural 7); nick'te kaba kısaltmalar üretilmez, liste `content/profanity-tr.json`'da (§4.D)                                                                                 |
| 17  | Bildirim yeri                                                                             | Zil yalnızca Mesajlar'da; alt çubuktaki Mesajlar sekmesinde okunmamış noktası (K-6, §4.G)                                                                                                                                   |
| 18  | Masa daveti: kapsam, süre, kim davet eder, davete katılanın masası, davet gönderme ekranı | Aynı mekanda check-in'i olan arkadaşa, mekan adı olmadan, 2 dakika, yalnızca sahip; boş masa sessizce kapanır (§4.B-8, §4.G). Gönderme ekranı bütün arkadaşları listeler, kimin mekanda olduğu görünmez (K-2); ekran v44'te |
| 19  | Pas ve Doğru'nun iki renkli olması istisna mı?                                            | Evet: K-32 (P-19), 4.2'de tasarım sistemine istisna olarak yazılır                                                                                                                                                          |
| 20  | Sahtekar: 30 sn, 2 sahtekar, kısmi yakalama                                               | K-71 (P-8)                                                                                                                                                                                                                  |
| 21  | Kapışma: eşik, bire bir, gözlemci, aynı şarkı                                             | K-72 (P-9)                                                                                                                                                                                                                  |
| 22  | İbre: "herkes hazırsa kilitlenir", sol-sağ tahmini, tur sayısı ve süreler                 | "Herkes hazırsa kilitlenir" ve süre sonunda kilit kabul; 4 tur, ipucu 30 sn, ayar 45 sn (§4.F). Sol-sağ K-73 (P-10)                                                                                                         |
| 23  | Sohbet kartları: kim geçirir, başka oyun başlarsa, Ya da'da kim neyi seçti                | K-74 (P-11)                                                                                                                                                                                                                 |
| 24  | Kartlar ve kelime havuzları                                                               | Havuzlar hazır (Kapsül Anlat 547, Harf Kapmaca 174 kategori, İbre 225, Şarkıda Geçsin 445, Sohbet kartları 160, Sahtekar 526 kelime); yalnızca Kampüs ve Ya da temaları yazılır (§4.F)                                      |
| 25  | Masa sohbetinde grup adı                                                                  | Kalkar: kişi yalnızca nick'iyle ya da gerçek adıyla görünür (§4.B-7)                                                                                                                                                        |

**Raporun §10 açık soruları:** kural çakışmaları §4.O'da; yazı tipi Plus Jakarta Sans (§4.B-10); koyu tema ve denenmeyen ekranlar v44'te (§4.C); oyun geçmişi Aktiviteler'i besler (soru 13).
