# skall Faz 4: v43

**Onaylı; §4.N sırasıyla uygulanır.** Proje sahibinin onayladığı hedef: uygulamanın tasarımı, arayüzü ve mantığı `docs/design/v43/`'teki denemeye (v43) çevrilir. **Pilot v43'ün tamamıyla çıkar; hazır olmadan Play'e çıkılmaz.**

- Her adım kendi dalı ve PR'ıyla gelir; "onaylandı" olmadan birleşmez.
- Bu belgede olmayan bir karar gerekirse uygulama durur ve sorulur.
- §4.P'deki açık kararlar ilgili adımdan önce proje sahibine sorulur. Karar verilmeden o adımın işi başlamaz.

Alt bölümler harfle (§4.A, §4.B…), **adımlar** sayıyla numaralanır (adım 4.1…4.8; oyunlar 4.6.1…4.6.5; §4.N). Önceki fazlara atıf "SPEC_V3 §…" diye yazılır (`docs/SPEC_V3.md`).

**Kaynaklar.**

- `docs/design/v43/skall-masa-deneme-v43.html`: tek dosyalık deneme. Yalnızca "Senin görünümün" vardır; üstteki koyu deneme şeridi uygulamanın parçası değildir.
- `docs/design/v43/skall-arayuz-devir-raporu-v43.md`: tasarım oturumunun devir raporu. Rapor karar vermez; önerileri ve 25 sorusu bu belgede karara bağlanır ya da §4.P'ye yazılır.
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
- v43'te ve v44'te olmayan ekran ya da özellik (§4.C).

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
11. **Görsel kaynak v43'tür** (`docs/design/v43/`); Claude Design tuvali arşiv olur. Koyu tema ve eksik ekranlar v44 olarak "Kabuk tasarım denemeleri" oturumundan gelir; 4.2'nin ön koşuludur.
12. **Pilot v43'ün tamamıyla çıkar;** hazır olmadan Play'e çıkılmaz.

**Kural metinleri için proje sahibinin verdiği ölçüler** (§4.O):

- kural 6: Keşfet'te konuma göre sıralama yok;
- kural 9: İbre'nin canlı ibresi istemcinin yayın yaptığı ikinci kanaldır: oda üyeleriyle sınırlı, yükte yalnızca sayı, yalnızca sürüklerken, saniyede en çok 10;
- kural 5: masa sonundaki "Arkadaş ekle" sessiz kalır; bildirime yalnızca açık arkadaşlık istekleri düşer.

## 4.C Tasarım sistemi ve ekranlar (adımlar 4.2, 4.3)

**Kaynak.**

- `docs/design/v43/`: deneme ve rapor. Ekranlar, renk, yazı, şekil, bileşen ve hareket buradan alınır.
- Claude Design ana tuvali (https://claude.ai/artifact/9pfA5eudWS4s5rxUydRuss) ve önceki tasarım denemeleri arşivdir. Çelişkide v43 geçerlidir.
- skall tasarım sistemi (https://claude.ai/artifact/TBSmpZEA6Lg29Qc4oVtSX5) 4.2'de v43 ve v44'e göre yenilenir; o zamana kadar bugünkü tokenların açıklaması olarak kalır.

**v44: 4.2'nin ön koşulu.** Koyu tema ve v43'te olmayan ekranlar "Kabuk tasarım denemeleri" oturumundan v44 olarak gelir ve belge PR'ıyla `docs/design/v44/`'e girer. v44 gelmeden 4.2 başlamaz. Beklenen ekranlar (v43 raporu §10 ve bu belge):

- bütün ekranların koyu teması;
- kayıt akışı (telefon, kod, profil, doğum tarihi, cinsiyet, fotoğraf, onaylar) ve cinsiyet kapısı;
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

  4.3 ve sonraki adımlar ekran başına v43'e ya da v44'e göre kurulur. v44'te de olmayan bir görünüm gerekirse uygulama durur ve tasarım oturumuna sorulur.

**Tasarım sistemi (adım 4.2).** Sunucu değişmez; istemci OTA ile gider.

- **Tokenlar** (`apps/mobile/src/theme/`): v43'ün paleti (logo renklerine çekildi) ve v44'ün koyu teması. Oyun renkleri (v43 raporu §5):

  | Rol                                                  | Renk                                       |
  | ---------------------------------------------------- | ------------------------------------------ |
  | Takımlar (Mor, Pembe)                                | `#6A47F5`, `#D6336C`                       |
  | Pas, Doğru, Yasak!                                   | `#FFD23F`, `#34D27F`, `#C8331F`            |
  | Sahtekar zemini                                      | `#2A1C66` → `#1B1446`                      |
  | Harf Kapmaca zemini                                  | `#CF4A2A` → `#B8325A`                      |
  | Şarkıda Geçsin zemini                                | `#2B1878` → `#4A22A8`                      |
  | İbre zemini                                          | Sıradaki takımın rengi                     |
  | İbre puan bölgeleri (2, 3, 4)                        | `#FFD86B`, `#FFA94D`, `#FF4F8B`            |
  | Sohbet kartı temaları (Isınma, Kampüs, Derin, Ya da) | `#C4521F`, `#6A47F5`, `#2F2A78`, `#187A48` |
  | Bildirim rozeti                                      | `#C51F62`                                  |

- **Kontrast:** oyun zeminlerinde ve temalarda beyaz yazı en az 4.5:1. Harf Kapmaca'nın turuncu zemininde yarı saydam beyaz çipler (yaklaşık 3.3:1) koyulaştırılır. `theme/contrast.test.ts` yeni tokenlarla güncellenir; renkler `scripts/icon/mark.ts` ile eşitlik testini korur.
- **Yazı tipi:** Plus Jakarta Sans (500, 600, 700, 800). `@expo-google-fonts/plus-jakarta-sans` eklenir. Gerekçe: bugünkü Poppins ve Manrope paketleriyle aynı yoldur; JS paketidir, kurulu `expo-font` ile çalışma anında yüklenir ve native değişiklik değildir. Poppins ve Manrope paketleri 4.8'de kalkar.
- **Gradyanlar:** `react-native-svg` ile (`LinearGradient`).
- **Bileşenler** (`src/components/`):
  - düz düğmeler (gradyan ve 3B gölge yok), 56 px oyun düğmesi (ana düğme beyaz zemin üstünde oyun renginde yazı, yan düğme saydam beyaz);
  - kart, alt sayfa, çip, kapsül avatar (§4.D);
  - çubuk ikon ailesi ve zil (`scripts/icon/glyphs.ts`'e eklenir);
  - halka sayaç, süre çubuğu (son 5 sn turuncu), üstte beliren kısa bildirim, 3-2-1 geri sayım, konfeti;
  - sohbet duvar kağıdı: önceden çizilmiş tek görsel; mesajlar üstünden kayar (`ChatScroll` aynen), yazma alanı yüzer.
- **Hareket:**
  - korunanlar: Buluş, Kesişme, Tahterevalli, boş durum, Dönüş ve ikon yayları;
  - yeniler: kart eğilmesi, rol kartının dönmesi, harf çarkı, plak ve ekolayzer, İbre örtüsünün açılması, zilin sallanması;
  - kart eğilmesi ve ibre `react-native-reanimated` ile arayüz iş parçacığında, dokunuşlar `react-native-gesture-handler` ile;
  - ekran dışındaki hareketler durur; hareketi azalt açıkken hepsi durur ya da yalnızca saydamlık değişir;
  - eğriler `src/theme/` altında testli kalır (`markMotion.ts`, `launchMotion.ts` kalıbı).
- **Dokunuş:** yalnızca `haptic(an)`. v43'teki anlar (kapma, rakip düğmesi, son saniyeler, yanıt eşiği) `hapticMoments.ts`'e eklenir.
- **Ekran davranışı** (CLAUDE.md) aynen geçerlidir. v43 320x568, 360x640 ve 400x780'de, yazı yüzde 130 büyükken sınandı. Plus Jakarta Sans geniş bir yazı tipidir: her ekran 320 dp'de ve en büyük yazı boyutunda yeniden ölçülür (E2E'nin büyük yazı koşusu).

**Ekranlar, bugünkü mantıkla (adım 4.3).** Sunucu değişmez; her ekran ayrı PR olabilir.

- **Mekan:**
  - Üst satır: solda "Mekandan ayrıl" (kırmızı çubuklardan çarpı), ortada logo, sağda profil fotoğrafı. Anonim anahtarı 4.4'le gelir; 4.3'te görünmez.
  - Mekan sohbeti kartı ve masa kartı sabittir; masalar altlarından kayar. Mekan sohbeti kartında aktiflik noktası vardır (tanımı §4.P).
  - Masa kartı: "Lobiye aç" ve "Davet et". 4.3'te "Davet et" bugünkü açıklama sayfasını açar (masanın adını söyle, arkadaş "Bu masadayım"a bassın). Gerçek davet 4.7'de gelir.
  - Lobi: yükleniyor (Tahterevalli), boş ve dolu hâller; istek durumlarında Buluş, Kesişme, çarpıp geri çekilme; geri sayım metinde.
- **Mekan sohbeti:** v43 görünümü (duvar kağıdı, yüzen yazma alanı, balon içinde ad). Kişi görünümü ve sessize alma 4.4'te.
- **Masa:** sabit üst alan (geri, masa adı ve kişi sayısı → Masadakiler; sahipte "Bitir", katılımcıda "Ayrıl"; sahipte altında "Lobiye aç" ve "Davet et"), "Oyun Seç" ve "Masa Sohbeti" sekmeleri, kategori çipleri ve altı animasyonlu poster. 4.3'te poster bugünkü öneri ve kabulü açar; oylama 4.5'te gelir.
- **Mesajlar** (Sohbet ve İstekler sekmeleri), DM, Profil, Arkadaşlar, Profili düzenle, Aktiviteler, Keşfet: v43 görünümü, bugünkü veriyle.
- **Oyun ekranları** 4.3'te bugünkü oyun ekranlarıdır (yeni tokenlar ve yazı tipiyle). v43'ün oyun ekranları her oyunun 4.6 adımında gelir.
- **"Tabu" kelimesi** kullanıcıya görünen metinlerden 4.3'te kalkar:
  - Oyunun adı tek sabitten gelir: `supabase/functions/_shared/pure/brand.ts` → `GAME_NAMES` (`tabu: 'Kapsül Anlat'`); `tr.ts` ve mağaza metinleri oradan okur.
  - Rakip düğmesi "Yasak!", "Tabu avcısı" ödülü "Yasak avcısı" olur (K-5).
  - `tr.ts`'te ve `docs/store/`'da "Tabu" kelimesinin geçmediğini bir birim testi denetler (Faz 3'teki "oda" testinin kalıbı).
  - Kod, tablo, içerik dosyası ve kavram adı (`tabu`) değişmez.
- **Keşfet ve Aktiviteler** (kural 6):
  - Konuma göre sıralama yoktur. v43'teki "Yakındaki" listesi ve Aktiviteler'deki "Yakınındaki mekanlardan" başlığı kalkar; sıralama şehir, semt, etkinlik ve ada göredir.
  - "Şu an buradasın" kartı kişinin kendi check-in'idir (kendi verisi; kimseyle paylaşılmaz).
  - Mekan adlarına sınır konmaz: adlar içerikten gelir, ekran en çok iki satıra kırar ve gerekirse küçültür (Ekran davranışı).
- **Bildirim düğmesi** 4.3'te bugünkü yerinde ve bugünkü içerikle kalır; v43'ün zili ve listesi 4.7'de gelir ve zil o adımda Mesajlar'a taşınır (K-6, §4.G).

## 4.D Kimlik ve mekan sohbeti (adım 4.4)

**Kapsül ve nick.**

- Her hesabın bir kapsül varyantı ve bir nick'i vardır.
  - Kapsül: 28 varyanttan biri. Ölçü hep aynıdır; renk ve aksesuar değişir (korsan, kaptan, vampir, taç, kulaklık, kedi…).
  - Nick: `kapsul-xx55` biçimi; iki harf (`abcdefghkmnprstuvyz`) ve iki rakam.
- **Hesaba sabittir** (§4.B-6) ve hesapla silinir; yalnızca nick metni, yeniden verilmesin diye emekli listesinde kalır (aşağıda). Yenileme §4.P'dedir.
- **Atama sunucudadır ve saklanır.** v43'teki "aynı ad hep aynı kapsül" denemenin tohum davranışıdır; uygulamada değer atama anında yazılır: `profiles.capsule_nick` (benzersiz) ve `profiles.capsule_variant`. Kayıtta (`account/complete-onboarding`) atanır; mevcut hesaplara 4.4'ün migration'ı atar.
- Kaba kısaltmalar (`am`, `mk`, `sk`, `sg`, `gt`) ve sayılar (`31`, `69`) üretilmez. Liste `content/profanity-tr.json`'a taşınır; üretim `pure/capsule.ts`'tedir ve testlidir.
- **Kapasite:** `kapsul-xx55` biçimi 19 × 19 × 100 = 36.100 nick verir; elenen kısaltma ve sayılar bunu azaltır. Nick benzersiz ve hesaba sabit olduğu için doluluk arttıkça rastgele üretim çakışmaya düşer.
  - Doluluk (atanmış ve emekli nick'ler) biçimin kapasitesinin (elenenler çıkmış) yüzde 50'sini geçince yeni nick'ler 3 rakamlı biçimden üretilir (`kapsul-xx555`). Mevcut nick'ler değişmez. Kapasite, doluluk ve eşik `pure/capsule.ts`'tedir, testlidir.
  - **Silinen hesabın nick'i yeniden kullanılmaz:** yeni sahibi eski kişiyle karıştırılırdı. Nick yenileme onaylanırsa (P-2) yenilenen nick de aynı işlemde emekliye ayrılır. Hesap silinirken nick `retired_capsule_nicks`'e yazılır: yalnızca nick metni; hesapla bağı ve tarihi yoktur (§4.H).
  - Nick, `complete-onboarding`'de 18 yaş denetiminden sonra atanır; 18 yaş altı beyanında nick atanmaz ve hiçbir şey kalmaz (kural 11).
- **Nick profil kimliği değildir.** `public_id` ile ilişkisi hiçbir yanıtta görünmez; nick kolonları istemciye kapalıdır, nick yalnızca bir bağlamda (anonim mesaj, masadaki anonim kişi) o bağlamın kitlesine gider (kural 4).
- **Bilinçli bedel:** nick hesaba sabit olduğu için anonim kişi ziyaretler arasında aynı nick'le tanınır. Bu proje sahibinin kararıdır; gizlilik politikasında açıkça yazılır (§4.L).
- **Üç görünüm:**
  - fotoğraflı profil: fotoğraf ve gerçek ad;
  - fotoğrafı sonradan gizlenen ya da kaldırılan profil: soluk "hayalet" kapsül ve gerçek ad;
  - anonim: kapsül ve nick.
- **Fotoğraf şartı** (K-4): profilli görünmek profil fotoğrafı ister. Fotoğrafı olmayan (ya da fotoğrafı gizlenmiş: `photo_hidden_at` dolu) kişi profilli kimlik seçemez ve profilli olması gereken yere giremez (`photo_required`, SPEC_V3 §22.G karar 8 aynen). Soluk kapsül yalnızca fotoğraf, kişi zaten profilli görünürken gizlendiyse ya da kaldırıldıysa görünür.

**Anonim anahtarı.**

- Mekan ekranının üst satırındadır; açık anonim demektir.
- Check-in başında değeri anonimdir (SPEC_V3 §5.4: varsayılan her zaman anonim; `profiles.default_participation` okunmaz ve 4.8'de kalkar).
- **Erkek ve belirtmeyen** (K-3; kural 12 yalnızca oyun akışı için, aynen):
  - Mekan sohbetinde anonim yazabilir. Bu hesaplar için anonim seçim yalnızca mekan sohbetini etkiler: `identity_mode` onların mekan sohbeti kimliğidir.
  - Oyun akışında ve masada her zaman profillidir. Masaya girişte (masa kurma, Katıl, Bu masadayım, davete katılma) `room_members.profiled = true` ve `alias` gerçek addır; check-in'in anonim kimliği masaya taşınmaz. Fotoğrafı yoksa masaya giremez (`photo_required`).
  - Check-in başına 1 değişiklik kuralı onlar için de geçerlidir.
  - Uygulamada seçim onlarda masaya giden bir anahtar olarak değil, yalnızca mekan sohbetini etkileyen bir seçim olarak görünür ve masaya taşınmadığını söyler (v44, §4.C).
  - Masaya giriş isteği açıkça anonim katılım isterse sunucu `anonymous_not_allowed` döner, sessizce profilliye çevirmez (SPEC_V3 §23.D aynen). 4.5'e kadar eski masa modelinde "Masanla oyna" bugünkü gibi oyun akışı sayılmaz.
- Cinsiyeti boş hesap oyun akışına ve masaya giremez (`gender_required`); check-in ve mekan sohbeti bunu istemez.
- **Check-in başına 1 değişiklik.**
  - Check-in'in kimliği `table_sessions.identity_mode` (`anonymous` | `profiled`; kadında mekan sohbetinde ve masada, erkek ve belirtmeyende yalnızca mekan sohbetinde) ve değişiklik sayısı `table_sessions.identity_switches` (0 ya da 1).
  - Anahtar `checkin/set-identity { anonymous }` ile değişir; ikinci değişiklik `identity_switch_used` (409), fotoğrafsız profilli seçim `photo_required` (409) döner.
  - Uygulama değiştirmeden önce sonucunu söyler: hakkın bu check-in'de biter, yeni mesajların yeni kimlikle görünür. Metin v44'te.
  - Faz 2'nin mekan sohbetine özgü seçimi (`table_sessions.venue_chat_profiled`, `venue_chat_mode_locked`) bu modele taşınır; kolon 4.8'de kalkar.
- **Değişiklikten önce yazılan mesajlar eski kimlikte kalır.**
  - Mesaj kimliği yazıldığı anda saklar: mekan sohbetinde `venue_chat_messages.profiled` ve `sender_alias` (anonimde nick), masa sohbetinde `messages.sender_alias` ve yeni `messages.profiled`.
  - Okuma eski mesajı eski kimlikle döner. Anonim mesajda fotoğraf, ad ve `public_id` asla gitmez (SPEC_V3 §7.2 aynen).
- **Masada:** kişinin masaya girdiği andaki kimliği `room_members.alias` ve `profiled`'a yazılır (masayı kurarken, katılırken, davetle); erkek ve belirtmeyende her zaman profillidir (yukarıda). Anahtar masa sürerken değişirse masadaki kimliğin değişip değişmeyeceği §4.P'dedir.
- **Zamanlama:** anahtar bir kez değişince sonraki mesajlar yeni kimlikle gider. Mekan sohbetini izleyen biri iki kimliği zamanlamayla eşleyebilir. Hak check-in başına 1 olduğu için bu en çok bir kez olur; değiştirme onayı bunu söyler.
- **Eski istemci koruması:** `venue-chat/send` kimliği check-in'den okur. İstek `profiled` taşıyor ve check-in'in kimliğinden farklıysa `identity_mismatch` (409) döner, mesaj yazılmaz (Faz 2'nin gerekçesi: anonim sanılan bir mesajın profilli gitmesi gizlilik hatasıdır).

**Mekan sohbetinde kişi görünümü.**

- Kişi fotoğraf ve gerçek adla ya da kapsül ve nick'le görünür; **masa adı hiç geçmez** (§4.B-7).
- Ad balonun içindedir ve kişiye göre sabit renktedir. Art arda gelen mesajlar tek avatarla dizilir. Telefon bunu yanıttaki `senderKey`'den yapar:
  - `senderKey` sunucuda hesaplanan opak bir anahtardır: göndericinin hesabı, kimliği (anonim ya da profilli), mekan ve gün üzerinden.
  - Aynı kişinin anonim ve profilli mesajları farklı anahtar alır. Anahtar iki kimliği bağlamaz, hesap id'si ve `public_id` taşımaz.
- **Mesaja basılı tutunca:** tepki, Yanıtla, Bildir; kendi mesajında Sil (SPEC_V3 §21; Sil yeni, aşağıda).
- **Kişiye dokununca:** Profili gör (anonimde kapalı), Sessize al, Bildir.
- **Kendi mesajını silme (v43'ten):** `venue-chat/delete { messageId }`. Mesaj herkes için kalkar; şikayet kopyası (`reports.messages_snapshot`) etkilenmez.
- **Aşağı in düğmesi** yeni mesaj sayısını gösterir (telefonda sayılır).
- **"yazıyor" balonu** v43'te vardır ama istemci yayını ister (kural 9); §4.P.

**Sessize alma (yeni).**

- Kişiyi sessize alan, o kişinin **o kimlikteki** mesajlarını görmez. Sessize alınan bunu hiçbir biçimde görmez.
- **Kimliğe bağlıdır:** anonim nick'i sessize almak aynı kişinin profilli mesajlarını gizlemez, tersi de. Gizleseydi iki kimlik eşleşirdi (kural 4).
- Sunucuda tutulur: `venue_chat_mutes (id, user_id, muted_user_id, profiled, label, created_at)`. `label` sessize alma anındaki nick ya da görünen addır.
- `venue-chat/mute { messageId }`: sunucu göndericiyi ve kimliği mesajdan bulur; istemci hesap id'si görmez. `venue-chat/unmute { muteId }`.
- Liste `venue_chat_mutes_of(user)` (service role) üzerinden `venue-chat/mutes` ile gelir: etiket ve tarih. Hesap id'si gitmez.
- Okuma (`venue_chat_page_for`) sessize alınan kimliğin mesajlarını döndürmez.
- **Tüm sohbeti sessize alma:** mekan sohbeti bugün push göndermez (SPEC_V3 §7.4). v43'teki "Yeni mesajlar bildirim göndermez" bu yüzden mekan kartındaki aktiflik noktası ve okunmamış sayısı içindir; tercih telefonda tutulur (§4.P).

**Erişim.** 4.4'te bugünkü gibidir (check-in ile masa oturumu aynı kayıttır). 4.5'ten sonra "mekanda check-in'i olan" okur ve yazar (§4.E); koşul kaydı değişmez: `table_sessions.status = 'active' and expires_at > now()`.

## 4.E Check-in, masa ve katılım (adım 4.5)

**Check-in.**

- Check-in kişinin mekanda bulunmasıdır. Kaydı `table_sessions`'tır: ad değişmez, Faz 4'ten sonra anlamı "check-in"dir.
- Konum doğrulaması, nokta (`spot_id`), 4 saat süre (`TABLE_SESSION_HOURS`) ve "Mekandan ayrıl" aynen kalır.
- **Check-in masa kurmaz:** kişi sayısı sorulmaz (`headcount` yazılmaz), masa adı üretilmez. `checkin/check-in { venueId, lat, lng, accuracy, spotId? }`.
- Check-in'i olan kişi mekan sohbetini okur ve yazar, lobiyi ve süren masaları görür, masa kurar, istek gönderir, davet alır.
- Yeni check-in eski check-in'i bitirir; kişi bulunduğu masadan ayrılmış sayılır (aşağıda "Ayrılma ve sahiplik").

**Masa.**

- Masa, bir kişinin kurduğu `rooms` satırıdır. Kuran sahiptir (`rooms.owner_session_id`).
- **Masanın adı** masa kurulurken üretilir: `rooms.name` (bugünkü takma ad kelimeleri, `alias_words`). Sahip adı masa başına 3 kez yeniler (bugünkü `ALIAS_REROLLS_PER_CHECKIN`, artık masa başına: `rooms.name_rerolls`).
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
- sahipte "Y geliyor, N kişi" (v43: "N kişi masanın yanına geliyorlar");
- iki masa birbirine istek gönderip aynı anda kabul ederse biri geçer, diğeri `room_not_available` alır (SPEC_V3 §23.K aynen).

**Ayrılma ve sahiplik.**

- Katılımcı "Masadan ayrıl" ile çıkar: mekana döner, masa diğerleri için sürer (`rooms/leave`).
- Sahip "Masayı bitir" ile masayı herkes için kapatır (`rooms/end`; v43'te "Bitir").
- Sahip mekandan ayrılırsa, check-in'i biterse ya da yeni check-in yaparsa ne olacağı §4.P'dedir.
- Masanın son kişisi çıkınca masa kapanır.
- **Hareketsizlik:** tek kişilik masa 30 dakika hareketsizlikte sessizce kapanır. İki ve daha fazla kişili masa hareketsizlikle kapanmaz (Faz 3 kuralı, "iki taraflı" yerine "iki ve daha fazla kişili"). Lobide bekleyen masaya bekleyen istekler `unavailable` olur.
- Oyundayken masadan ayrılmak oyundan çıkmayı da içerir (§4.F).

**Masa sonu ve arkadaşlık.**

- Masa kapanınca "Masa bitti" ekranı açılır (v44): masada bulunmuş kişiler ve kişi başına sessiz "Arkadaş ekle". Mekanizma Faz 3'ünkü (`mutual_friend_intents`); tek taraf basarsa hiçbir şey olmaz ve görünmez.
- Oyun geçmişi kaydı (3 dakika kesişim) taraflar arası değil, kişi çiftleri arasında yazılır. Hangi çiftlerin kayıt alacağı §4.P'dedir.
- Masa sürerken profildeki "Arkadaş ekle" §4.P'dedir.

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
- Sahip "Başlat"a basınca oyunun **oyun öncesi sayfası** açılır: `rooms/open-game { roomId, concept }` → `rooms.game_state.pregame`. Masadaki herkes sayfayı `rooms` değişikliğiyle görür. Sohbet kartları istisnadır: tema alt sayfası ve masa sohbeti (adım 4.6.2).
- Oyun başlayınca oylar silinir.
- Masada aynı anda tek oyun ya da tek oyun öncesi sayfası olur.
- **Kategoriler** (v43): Tümü, Takımlı (Kapsül Anlat, İbre), Bire bir (Harf Kapmaca, Şarkıda Geçsin), Çok oyunculu (Sahtekar, Harf Kapmaca, Şarkıda Geçsin, Sohbet kartları). Bir oyun birden fazla kategoride olabilir; dağılım `pure/gameCatalog.ts`'tedir.
- **Soluk poster** (`gameAvailability`): masanın telefon sayısı oyunun alt sınırından azsa. Sınırlar: Kapsül Anlat 4, İbre 4, Sahtekar 3, Harf Kapmaca 2, Şarkıda Geçsin 2, Sohbet kartları 1. v43'ün posterlerindeki 2 (Kapsül Anlat ve İbre) takım başına 2 kişi kuralıyla çelişir; 4 alınır (teknik karar, §4.P).

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
- Rol sahibinin çıkışı oyunun kuralıyla çözülür (her oyunda aşağıda). Genel kural: süren tur ya da aşama süresi dolana kadar sürer; çıkanın rolüne özgü eylemi kimse basamaz ve gizli bilgi kimseye yeniden verilmez (SPEC_V3 §22.E kalıbı).
- **Oyun sonu:** kazanan ve öne çıkanlar, kazananlara konfeti. "Masaya dön" herkeste; "Yeniden oyna" yalnızca sahipte (aynı oyunun oyun öncesi sayfasını aynı seçimlerle açar).

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
- **Sahip:** "Kartı geç" ile ilerler (`sohbet/next-card`). Tema adına dokununca temayı değiştirir (kartlar yeniden karışır), kartları karıştırır ya da kapatır (`sohbet/close`). Katılımcı yalnızca kartı görür. (Kartı kimin geçeceği §4.P.)
- **Ya da kartı:** iki seçenek kartın içindedir; herkes birini seçer (`sohbet/choose { cardNo, choice }`). Her seçenekte yalnızca kaç kişinin seçtiği görünür (§4.P).
- **Başka oyun başlayınca kartlar kapanır** (§4.P). Kapanınca sohbete "Sohbet kartları kapandı · N kart konuşuldu" düşer.
- **İçerik:** temalar Isınma, Kampüs, Derin ve Ya da. Bugün `content/sohbet-cards.json`'da `isinma`, `derin`, `film-dizi-muzik` ve `hic-yaptin-mi` (40'ar) var. Kampüs kartları ve iki seçenekli Ya da kartları yazılır (`cards` satır kısıtı Ya da'nın iki seçeneğini zorunlu tutar). `film-dizi-muzik` ve `hic-yaptin-mi` §4.P'dedir.

### Adım 4.6.3: Sahtekar

- **Oyuncular:** en az 3; gözlemciler. 1 sahtekar; 7 ve üstü oyuncuda 2 sahtekar, birbirlerini bilmezler (§4.P).
- **Aşamalar:**
  1. **Rol kartı:** kart basılı tutunca döner ve rol görünür. Oyun boyunca "Rolüm" basılı tutunca yine görünür. Oyuncular "Hazırım" der; herkes hazır olunca ya da 30 sn sonra ipucu turları başlar.
  2. **İpucu turları:** 2 tur, kişi başı 30 sn (§4.P). İpuçları sesli verilir. Sırayı sunucu belirler; konuşanın etrafında halka sayaç döner, sıradaki kişi yazılıdır. Sırası gelen "Söyledim"e basar (`sahtekar/said`).
  3. **Oylama:** 90 sn. Herkes sahtekar sayısı kadar kişi seçer (`sahtekar/vote`). Kimlerin oy verdiği görünür, kime verdikleri görünmez. Oylar sonuca kadar `game_secrets`'tadır.
  4. **Sonuç:** oylar çubuk olarak görünür. En çok oy alan, sahtekar sayısı kadar kişi suçlanır; sınırda oy eşitliği varsa o koltuk boş kalır. Sahtekarların altında "Yakalandı" ya da "Kaçtı" yazar.
  5. **Son şans:** yakalanan sahtekarların yazarak tek bir ortak tahmin hakkı vardır, 15 sn (`sahtekar/guess { text }`). Karşılaştırmada büyük küçük harf ve noktalama dikkate alınmaz; eşleştirme `pure/trText.ts` ile yapılır (kural 7). Bu, SPEC_V3 §20.1'deki "serbest metin yok" kuralına Sahtekar'ın son şansı için istisnadır; tahmin saklanmaz, yalnızca sonucu yazılır.
  6. **Oyun sonu.**
- **Kazanma:** masa ancak bütün sahtekarlar yakalanır ve tahmin tutmazsa kazanır. Kısmi yakalamada puan §4.P'dedir.
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
  - **İtiraz eşiği:** kapan dışındaki oyuncuların yarıdan fazlası (`floor((n - 1) / 2) + 1`); bire birde tek itiraz yeter (§4.P). İtiraz geri alınabilir.
  - İtiraz geçerse soru diğerlerine yeniden açılır ve kapanın o soruda hakkı biter. Kimse kalmazsa soru boş geçer.
  - İtiraz çıkmazsa kapana 1 puan.
  - Gözlemci itiraz edemez (§4.P).
- **Harf Kapmaca:** 3 harf; her harfin başında harf çarkı döner, ardından sırayla 5 kategori gelir. Kapma 15 sn, söyleme ve itiraz 6 sn, yeniden açık 8 sn.
  - Harf sonu: kimin hangi kategoriyi kaptığı listelenir; sahip "Sonraki harfe geç"e basar (15 sn kuralı, çerçeve).
  - Oyun sonu: ilk üç kişi kürsüde.
- **Şarkıda Geçsin:** 8 kelime. Kapma 20 sn, söyleme ve itiraz 12 sn, yeniden açık 10 sn. Söyleyenin avatarının iki yanında ekolayzer çubukları oynar.
  - Uygulama şarkı sözü göstermez, yalnızca kelime verir; ses kaydedilmez.
  - Aynı şarkının yeniden kullanılması serbesttir, itirazla çözülür (§4.P).
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
     - Rakibin sol ya da sağ tahmini §4.P'dedir (öneri: kalsın).
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

  | Rol         | Hedef  | Eylem                                         |
  | ----------- | ------ | --------------------------------------------- |
  | İpucu veren | Görür  | Hedefi gör, İpucunu söyledim                  |
  | Tahminci    | Görmez | İbreyi çevirir (`ibre/move`), Hazırım         |
  | Rakip takım | Görmez | İzler; sol ya da sağ tahmini kalırsa o (§4.P) |
  | Gözlemci    | Görür  | Yok; ibreyi izler                             |

- **Çıkış:** ipucu veren turda çıkarsa tur sürer, kilit tahmincilerle olur. Tahminci çıkarsa hazır onayları kalanlarla sayılır.
- **Sunucu:** `ibre` fonksiyonu kişi bazlı yeniden yazılır; `ibre/lock`'un taraf yetkisi (`lockBy`) kalkar.

## 4.G Bildirim, davet ve arkadaşlık (adım 4.7)

**Zil ve liste.**

- Zil çubuk ikon ailesindendir (mor kubbe, pembe çubuk, kesişimde koyu ton, sarı tokmak).
- **Yeri** (K-6): zil yalnızca Mesajlar'dadır; okunmamış bildirim varken alt çubuktaki Mesajlar sekmesinde nokta görünür. Sekmenin görünümü v44'tedir.
  - Zil diğer sekmelerin köklerinden kalkar. SPEC_V3 §18.3a'daki "Bildirim düğmesi her sekmenin kök ekranında" maddesi 4.7'nin PR'ında bu metne göre güncellenir; o adıma kadar bugünkü yer geçerlidir.
- Yeni bildirim gelince zil sallanır; okunmamış sayısı rozet olur. Liste açılınca rozet silinir; yeni olanlar liste açıkken vurgulu kalır.
- Liste bir alt sayfadır: "Yeni" ve "Önceki". Boşken: "Henüz bildirim yok. Arkadaşlık istekleri ve arkadaşlarının masa davetleri burada görünür."
- **Üç tür vardır:**
  1. **Gelen arkadaşlık isteği:** Reddet ya da Kabul et. İstekler sekmesiyle iki yönlü eş zamanlıdır. Kabul edince satır "artık arkadaşsınız" olur ve "Mesaj yaz" çıkar.
  2. **İsteğini kabul eden kişi:** satıra dokununca DM açılır.
  3. **Arkadaşın masa daveti:** masa adı ve telefon sayısı, Reddet ya da Katıl. Katıl'da "Kabul edildi, X masasının yanına git" çıkar ve kişi masaya katılımcı olarak girer. Süresi dolan davet soluk görünür.
- **Yalnızca açık istekler bildirime düşer** (kural 5): mekan sohbetinden gönderilen istek ve oyun geçmişindeki "İstek gönder". Masa sonundaki ve oyun geçmişindeki sessiz "Arkadaş ekle" hiçbir bildirim üretmez; iki taraf basınca arkadaşlık masa sonunda ve geçmişte görünür (Faz 3 aynen).
- **Reddetmek sessizdir:** reddedilen istekten ya da davetten karşı taraf haberdar olmaz.

**Veri.**

- Ayrı bir bildirim tablosu yoktur (SPEC_V3 §18.3'teki karar sürer). Liste salt okunur bir RPC'dir: `my_notifications()` (security definer, yalnızca okur, `set search_path = ''`; kural 1). Kaynakları:
  - gelen ve bekleyen açık arkadaşlık istekleri (`friend_requests`);
  - kişinin kabul edilen istekleri, son 7 gün;
  - gelen masa davetleri (`table_invites`), son 1 gün.
- Satırlar hesap id'si ve karşılaşma öncesinde `public_id` taşımaz. Arkadaşlık isteğinde ad, yaş ve fotoğraf bugünkü kurallarla gelir (SPEC_V3 §7.5).
- Rozet: `profiles.notifications_seen_at`; liste açılınca `account/notifications-seen` yazar. Okunmamış = bu zamandan sonraki satırlar.
- Yayın: değişiklik `inbox:{user_id}` kanalına veri içermeyen bir olayla gider (kural 9 aynen).

**Masa daveti** (§4.B-8; kural 4'e açık istisna):

- **Yalnızca sahip** gönderir, yalnızca **arkadaşa**: `rooms/invite { roomId, friendPublicId }`.
- **Davet ekranında bütün arkadaşlar listelenir; kimin mekanda olduğu görünmez** (K-2).
  - Sunucu daveti yalnızca aynı mekanda check-in'i olan arkadaşa iletir.
  - Mekanda olmayana daveti sessizce iletmez; gönderen her durumda aynı "Davet gönderildi"yi görür.
  - Böylece istisna yalnızca alıcı tarafındadır: alıcı, arkadaşının aynı mekanda bir masası olduğunu öğrenir. Gönderen, arkadaşının mekanda olup olmadığını davetten öğrenemez.
- Davet masa adını ve telefon sayısını taşır; **mekan adı taşımaz.**
- **2 dakika geçerlidir** (`TABLE_INVITE_TTL_SECONDS = 120`, `pure/tables.ts`).
- Aynı arkadaşa aynı anda tek bekleyen davet; sahip başına saatte 30 davet. Aşım da `{ ok: true }` döner (kural 5'in sessizliği).
- Engel varsa (iki yönlü) davet sessizce yutulur.
- **Davete katılmak:** `rooms/answer-invite { inviteId, accept }`.
  - Davet sahibin onayıdır; ayrıca onay gerekmez.
  - Kişinin bulunduğu masa için "Masadan ayrıl" kuralı uygulanır: tek kişilik boş masası sessizce kapanır; başka bir masanın katılımcısıysa o masadan ayrılır; başka kişilerin bulunduğu bir masanın sahibiyse §4.E'deki sahiplik kuralı (§4.P) uygulanır.
  - Masa dolmuşsa, kapanmışsa ya da davetin süresi geçmişse alıcıya tek bir metin görünür: davet artık geçerli değil.
- **Red ve zaman aşımı gönderene aynı görünür:** sahip ikisinde de hiçbir şey görmez. Kabulde kişi masaya gelir (Masadakiler'de görünür).

**Push.**

- Masa daveti push'u: "Bir arkadaşın seni masasına çağırıyor" (`target: 'notifications'`). Ad, masa adı ve mekan push'a girmez (bugünkü push ilkesi, SPEC_V3 §18.3a).
- Gelen arkadaşlık isteği push'u bugünkü gibidir. Kabul edilen istek push üretmez.
- **Bildirim ayarları:** bugünkü `notify_dm` ve `notify_friend_requests`'e `notify_invites` eklenir. Ekran v44'tedir.
- Üretim projesi için Firebase anahtarının Expo paneline yüklendiği pilot öncesi doğrulanır (§4.N).

**Arkadaşlık ve mesaj.**

- DM yalnızca arkadaşlar arasındadır (SPEC_V3 §21.3). Arkadaş olmayanın profilinde "Mesaj" düğmesi görünmez; yerine bağlama göre "Arkadaş ekle" vardır:
  - mekan sohbetinden açılan profilde açık istek (SPEC_V3 §7.5);
  - masa sonunda ve oyun geçmişinde sessiz düğme.
- Engelle, Bildir ve Arkadaşlıktan çıkar bugünkü gibidir: engellenen ve şikayet edilen hiçbir şey görmez; çıkarılan taraf çıkarmayı engellemeden ayırt edemez (kural 5).

## 4.H Veri modeli ve migration planı

| Adım    | Migration            | Değişiklik                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ------- | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 4.1–4.3 | —                    | Yok                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 4.4     | `…_identity.sql`     | `profiles.capsule_nick` (benzersiz) ve `capsule_variant smallint check (0–27)`, kolon yetkisi `authenticated`'a kapalı (`gender` kalıbı); mevcut hesaplara atama. `table_sessions.identity_mode text check (in ('anonymous', 'profiled'))` ve `identity_switches smallint default 0 check (0–1)`; `venue_chat_profiled`'dan taşıma. `messages.profiled boolean not null default false`. `venue_chat_messages`'ta anonim `sender_alias` artık nick. Yeni tablo `venue_chat_mutes` (politikalarıyla). Kendi mesajını silme için `venue_chat_messages.deleted_at`. Yeni tablo `retired_capsule_nicks` (politikalarıyla; silinen hesapların nick'leri). Nick yenileme onaylanırsa (§4.P) `profiles.capsule_nick_changed_at` |
| 4.5     | `…_table_model.sql`  | `rooms.name`, `rooms.name_rerolls`, `rooms.phones`; 12 telefon kısıtı. `room_members.side` boş olabilir (yazılmaz). `join_requests.requester_room_id` (taşınacak masa) ve `requester_phones`. Yeni tablolar `table_votes` ve `game_players` (politikalarıyla). `table_sessions.headcount` boş olabilir (yazılmaz). `table_sessions.alias` boş olabilir ve `(venue_id, alias)` benzersiz indeksi kalkar (kolon 4.8'de); ondan kopyalanan `not null` takma ad kolonlarının yeni kaynakları aşağıda ("4.5'te eski takma ad kolonları"). Yeni okumalar `venue_tables`, `table_vote_counts`, `table_people`. Migration o an açık bütün masaları kapatır (pilot yok; aynı gün OTA, §4.N)                                      |
| 4.6.1   | `…_kapsul_anlat.sql` | `tabu_*` fonksiyonları kişi bazlı; Yasak! istatistiği (Yasak avcısı); hakemli ve iş birliği modu kalkar                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 4.6.2   | `…_sohbet_cards.sql` | `messages.kind text default 'text' check (in ('text', 'card'))` ve kart notu; `sohbet_choices` (Ya da seçimleri); `cards` kısıtına `kampus` ve `ya-da` temaları ve Ya da'nın iki seçeneği                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 4.6.3   | `…_sahtekar_v4.sql`  | Kişi bazlı roller; 2 sahtekar; yazılı son şans; koltuk fonksiyonları kalkar                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 4.6.4   | `…_clash.sql`        | Ortak kapışma durumu; koşullu ilk basan; çoğunluk itirazı                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 4.6.5   | `…_ibre_v4.sql`      | `ibre/move`, `ibre/ready`; takımın ortak ibresi; `realtime_topic_allowed`'a `ibre:`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 4.7     | `…_invites.sql`      | Yeni tablo `table_invites` (politikalarıyla). `profiles.notifications_seen_at`, `profiles.notify_invites`. Okuma `my_notifications()`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 4.8     | `…_v4_cleanup.sql`   | Eski modelin kalanı (aşağıda), 23.4 kalıbıyla iki PR                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |

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
- kişi sayısı beyanı kolonları;
- Sahtekar koltukları, Tabu modları ve kapışmanın taraf hakları;
- Poppins ve Manrope paketleri, eski tokenlar;
- kapsam PR açıklamasında tek tek yazılır.

**Diğer.** `pnpm gen:types` her migration'dan sonra çalışır. Seed yalnızca 4.4 (nick'te üretilmeyecek kısaltmalar) ve 4.6.2'de (Sohbet kartları) değişir.

## 4.I RLS ve Realtime

**RLS (kural 2).** Her yeni tablo politikalarıyla aynı migration'da gelir. Yeni tabloların hepsi istemciye kapalıdır (politika yok); okumalar `set search_path = ''` ile tanımlı, yalnızca okuyan security definer RPC'lerledir (kural 1).

**Kolon yetkisi.** `profiles.capsule_nick` ve `capsule_variant` `authenticated`'a kapalıdır. Kişi kendi nick'ini `profile/get` yanıtında görür. Başkasının nick'i yalnızca bir bağlamda gider: anonim mekan sohbeti mesajı, masadaki anonim kişi, oyun ekranı.

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

| Fonksiyon       | Değişen                                                                                                                                                                                                                                                                          | Adım     |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `account`       | `complete-onboarding` nick ve kapsül atar; `notifications-seen`                                                                                                                                                                                                                  | 4.4, 4.7 |
| `profile`       | Kendi `get` yanıtında `capsuleNick`, `capsuleVariant`; nick yenileme onaylanırsa `refresh-nick`                                                                                                                                                                                  | 4.4      |
| `checkin`       | `set-identity { anonymous }` (`identity_switch_used`, `anonymous_not_allowed`, `gender_required`)                                                                                                                                                                                | 4.4      |
| `checkin`       | `check-in` kişi sayısı ve masa adı almaz                                                                                                                                                                                                                                         | 4.5      |
| `venue-chat`    | `send` kimliği check-in'den okur (`identity_mismatch`); `page` yanıtında `senderKey`, anonimde nick; `delete`, `mute`, `unmute`, `mutes`                                                                                                                                         | 4.4      |
| `rooms`         | `create`, `set-visibility`, `reroll-name`, `request-join` (masa ya da kişi, `asMember`), `respond`, `request-profile`, `leave`, `end`, `vote`, `open-game`, `pick`, `shuffle`, `end-game`, `leave-game`; yeni kodlar `already_in_table`, `table_full`, `not_owner`, `not_player` | 4.5      |
| `rooms`         | `invite`, `answer-invite`                                                                                                                                                                                                                                                        | 4.7      |
| `tabu`          | `start`, `begin-turn`, `turn-cards`, `mark` (Doğru, Pas, Yasak!), `end-turn`, `advance`; kişi bazlı yetki                                                                                                                                                                        | 4.6.1    |
| `sohbet`        | `start { themes }`, `next-card`, `set-themes`, `shuffle`, `choose`, `close`                                                                                                                                                                                                      | 4.6.2    |
| `sahtekar`      | `start`, `view`, `ready`, `said`, `vote`, `guess { text }`, `advance`                                                                                                                                                                                                            | 4.6.3    |
| `harf`, `sarki` | `start`, `claim`, `said`, `object`, `advance`; ortak motor                                                                                                                                                                                                                       | 4.6.4    |
| `ibre`          | `start`, `begin`, `target`, `clue-given`, `move`, `ready`, `side` (§4.P), `advance`                                                                                                                                                                                              | 4.6.5    |
| `friends`       | Değişmez; `my_notifications()` okuması `friends/notifications` ile (fotoğraflar imzalı)                                                                                                                                                                                          | 4.7      |

- Yeni hata kodları `pure/errors.ts`'e, Türkçe metinleri `tr.ts`'e girer.
- `IDEMPOTENT_CALLS`'a yalnızca iki kez gönderen testi olan çağrılar girer (bugünkü kural): `begin`, `advance`, `end-turn`, `notifications-seen`, okumalar.

## 4.K Kilit sırası (kural 10)

- **4.4:** `venue_chat_mutes` mekan sohbeti zincirinin sonuna girer: `table_sessions` → `venue_chat_rate` → `venue_chat_reaction_rate` → `venue_chat_messages` → `venue_chat_reactions` → `venue_chat_reports` → `venue_chat_mutes`. Kimlik değişikliği yalnızca check-in'i kilitler (`for no key update`).
- **4.5:** masa zinciri `profiles` → `table_sessions` → `rooms` → `room_members` → `join_requests` → `table_votes` → odanın satırları. Odanın satırlarında `game_players` `tabu_turns`'ten önce gelir: `game_players` → `tabu_turns` → `game_secrets` → `room_used_cards`, `messages` → `message_reactions`, `game_events`, `play_history`.
  - Masa taşıyan kabul (Katıl) iki masayı kilitler: istekçinin check-in'i → iki `rooms` satırı `id` sırasıyla → iki masanın `room_members` satırları → `join_requests` (SPEC_V3 §23.K'nın genellemesi).
  - `locks` testleri: çapraz kabul; 12. telefonun iki istekte aynı anda kabulü (biri geçer, diğeri `table_full`); oy ve seçimin oyun başlatmayla aynı anda gelmesi.
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

- **4.4:** kapsül nick hesaba bağlı bir takma addır. Anonim kişi ziyaretler arasında aynı nick'le tanınabilir; nick profil kimliğini açmaz. Sessize alma kaydı: kimin hangi kimliği sessize aldığı, yalnızca sunucuda. Anahtar değişikliğinden önce yazılan mesajların eski kimlikte kaldığı. Silinen hesabın nick'i yeniden verilmez; bunun için yalnızca nick metni, hesapla bağı olmadan saklanır.
- **4.7:** masa daveti, arkadaşına aynı mekanda bir masan olduğunu söyler; mekan adı gitmez. Bildirim listesi ve davet push'u.
- `CURRENT_KVKK_VERSION` 4.4'te artar; mevcut kullanıcılar yeniden onaylar. 4.7 değişikliği aynı sürüme alınabiliyorsa birlikte, değilse ikinci kez artar.
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
- Keşfet ve Aktiviteler konuma göre sıralamaz (birim testi: liste sırası konum almaz).
- E2E: bütün akışlar yeni ekranlarda; büyük yazı koşusu 320 dp'de kesilen metin ve iki satıra bölünen düğme bulmaz.

**Adım 4.4.**

- Her hesabın benzersiz nick'i ve kapsülü vardır; kayıtta 18 yaş denetiminden sonra atanır, mevcut hesaplara migration atar. Üretilmeyecek kısaltmalar üretilmez (birim testi).
- Kapasite: doluluk yüzde 50'yi geçince yeni nick 3 rakamlıdır, mevcut nick'ler değişmez (birim testi). Silinen hesabın nick'i `retired_capsule_nicks`'e geçer ve yeniden verilmez; tabloda hesapla bağ yoktur.
- `capsule_nick` `authenticated`'a kapalıdır (`birth_date` testinin kalıbı); başkası için hiçbir yanıt ve Realtime yükü nick ile hesap ya da `public_id` arasındaki ilişkiyi taşımaz (tarama).
- Anahtar check-in başına bir kez değişir; ikinci değişiklik `identity_switch_used`. Fotoğrafsız hesap profilli kimlik seçemez (`photo_required`).
- Erkek ve belirtmeyen hesap anonim kimlikle mekan sohbetine yazar; aynı check-in'de masaya girişte kimliği profillidir ve check-in'in anonim kimliği masaya taşınmaz. Açıkça anonim katılım isteyen istek `anonymous_not_allowed`. Bu hesaplarda da ikinci değişiklik `identity_switch_used`.
- Değişiklikten önceki mesajlar eski kimlikle döner; anonim mesajda fotoğraf ve ad yoktur.
- `identity_mismatch`: check-in'in kimliğinden farklı `profiled` taşıyan mesaj yazılmaz.
- Sessize alma kimliğe bağlıdır: anonim kimliği sessize almak aynı kişinin profilli mesajlarını gizlemez. Sessize alınan hiçbir yanıtta bunu görmez.
- `senderKey` aynı kişinin iki kimliği için farklıdır ve hesap id'si taşımaz.
- Kendi mesajını silme yalnızca göndericinin mesajında çalışır; şikayet kopyası kalır.

**Adım 4.5.**

- Check-in masa kurmaz; mekan sohbeti, lobi ve süren masalar check-in'le açılır.
- Masa kurma, lobiye açma ve çekme, ad yenileme (3 hak).
- Katıl: masa taşınır, istekçi masa aynı işlemde kapanır, kimlikler korunur. Red ve zaman aşımı `unavailable`. 12'yi aşan istek ve kabul `table_full`.
- Bu masadayım: masası olmayan kişi.
- 4.5'ten sonra check-in takma adsız yapılır (`table_sessions.alias` boş); aynı mekanda iki check-in çakışmaz. Eski takma ad kopyaları (`rooms.owner_alias`, `join_requests.requester_alias`, `play_history.own_alias` ve `other_alias`, `blocks.blocked_alias`, `venue_chat_messages.sender_alias`) §4.H'deki kaynaklarından dolar; anonim kişinin oyun geçmişindeki ve engelleme kaydındaki adı nick'tir.
- Sahip "Masayı bitir": masa herkes için kapanır. Katılımcı ayrılır, masa sürer. Sahibin ayrılması §4.P'nin kararıyla.
- Tek kişilik masa 30 dakikada kapanır; iki ve daha fazla kişili masa hareketsizlikle kapanmaz.
- Oylama: kişi başına bir oy; sayılar ve kendi oyu görünür, kimin neye verdiği görünmez. Oyunu yalnızca sahip açar ve başlatır (`not_owner`).
- Takım seçimi, Karıştır, gözlemci; takım başına 2 kişi olmadan başlamaz. Oyun sırasında gelen kişi gözlemcidir.
- Oyun geçmişi ve "Arkadaş ekle" §4.P'nin kararıyla; kalıcı red ve çift kilidi testleri değişmeden yeşil.
- `locks`: çapraz kabul, 12. telefon, oy ve başlatma.
- Eski oyunların posterleri "Yakında" (E2E).

**Adım 4.6 (her oyun).**

- Rol tablosundaki her eylem yalnızca yetkili role açıktır; diğerleri bugünkü ya da yeni yetki kodunu alır.
- Gizli bilgi yalnızca tablodaki rollere gider. Tahminci, rakip olmayan ve gözlemci olmayan hiçbir yanıtta kart, kelime, hedef ya da sahtekar bilgisi almaz (`readableBy` ve `watchRoomChannel` kalıbı; `game_state`, `game_events` ve Realtime yükleri taranır).
- Süreler sunucudan; `advance` idempotent ve iki kez gönderen testle.
- Çıkış kuralları (oyun başına) ve oyun sonu kayıtları (`game_results`: oyuncular evet, gözlemciler hayır).
- 4.6.3: 7 oyuncuda 2 sahtekar, birbirlerini görmezler; son şans `trText` eşleştirmesiyle.
- 4.6.4: aynı anda iki "Kaptım"da yalnızca biri kapar (`locks`); eşik ve bire bir.
- 4.6.5: `ibre:` kanalına masanın kişileri dışındakiler abone olamaz ve yayın yapamaz (`realtime.test.ts` kalıbı); kısıcı saniyede 10'u geçmez (birim testi); kilit `game_state.needle`'dan.

**Adım 4.7.**

- Davet yalnızca sahipten ve arkadaşa; aynı mekanda check-in'i olmayan arkadaşa davet satırı oluşmaz ve gönderen aynı yanıtı alır (K-2). Davet ekranının okuması kimin mekanda olduğunu taşımaz.
- Davet mekan adı taşımaz; 2 dakikada geçersiz olur. Red ve zaman aşımı gönderene aynı görünür (hiçbiri).
- Davete katılma: tek kişilik boş masa kapanır; başka masadaki kişi oradan ayrılır; dolu masa ve geçersiz davet aynı metni verir.
- `my_notifications()`: yalnızca açık istekler; masa sonundaki sessiz düğme hiçbir satır üretmez. Rozet `notifications_seen_at`'tan.
- Davet push'u ad, masa ve mekan taşımaz; `notify_invites` kapalıyken gitmez.
- `locks`: davete katılma ile masanın dolması.

**Adım 4.8.** Saha testinden sonra gelir ve testte çıkan düzeltmeleri de alır (K-8). Okuyan kalmadığı birim testiyle gösterilir (4.8a, `scripts/reveal-removed.test.ts` kalıbı); migration (4.8b) sonrası `pnpm gen:types`.

**E2E ve bot.**

- Akışların neredeyse tamamı yeniden yazılır: her adım kendi akışlarını aynı PR'da günceller (bugünkü kural).
- Bot kişi bazlı rolleri oynamayı öğrenir: masaya kişi olarak katılır, takım seçer, anlatıcı, rakip, tahminci, sahtekar, kapan ve ipucu veren olur. 12 telefonlu masa için birden fazla bot telefonu aynı masaya katılır (yerel test numaraları).
- Gizli bilginin cihaza gitmediği akışta değil, entegrasyon testinde denetlenir (SPEC_V3 §20.1).
- **Saha testi** 4.6 ve 4.7 ikisi de birleştikten sonra 6–12 telefonla yapılır (K-8). Faz 4'ün tamamını kapsar: push ve davet emülatörde sınanamaz ve başka telefon kontrolü yoktur. `docs/FIELD_TEST.md`'nin Faz 4 sürümü testten önce ayrı bir belge PR'ıyla yazılır; bulgular 4.8'de düzeltilir. Ayrı bir Faz 3 saha testi yapılmaz (K-1): Faz 3'ün bulma yardımı gözlemleri (SPEC_V3 §23.P-2: kabul anındaki iki satır kalabalık mekanda yeterli mi) bu testte yapılır ve P-2 kararı bu testten sonra verilir.

## 4.N Uygulama sırası, yayın, maliyet ve risk

| Adım                           | Sunucu                                                          | İstemci                                                                                                                 | Yayın                                                                | Ön koşul   |
| ------------------------------ | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ---------- |
| 4.0 Belge                      | —                                                               | —                                                                                                                       | Bu PR                                                                | —          |
| 4.1 Native build 0.5.0 (M0)    | —                                                               | `react-native-gesture-handler`, `gwpAsanMode="never"`; `version` 0.5.0                                                  | `eas build`, APK yeniden kurulur                                     | 4.0        |
| 4.2 Tasarım sistemi            | —                                                               | Tokenlar (açık ve koyu), Plus Jakarta Sans, ikonlar, kapsül avatar bileşeni, hareketler, temel bileşenler               | OTA                                                                  | 4.1 ve v44 |
| 4.3 Ekranlar, bugünkü mantıkla | —                                                               | Mekan, mekan sohbeti, masa kabuğu, Mesajlar ve DM, Profil, Aktiviteler, Keşfet; "Tabu" metinlerden kalkar               | OTA (ekran başına PR olabilir)                                       | 4.2        |
| 4.4 Kimlik                     | `…_identity.sql`; `account`, `profile`, `checkin`, `venue-chat` | Kapsül, nick, anahtar, mekan sohbetinde kişi görünümü, sessize alma, silme                                              | Önce yasal metin ve Veri güvenliği; `db push` + deploy; aynı gün OTA | 4.3        |
| 4.5 Masa modeli                | `…_table_model.sql`; `checkin`, `rooms`                         | Check-in'siz masa, çoklu masa, kişi bazlı katılım, oylama, oyun öncesi sayfa, takım ve gözlemci; eski oyunlar "Yakında" | `db push` + deploy; **hemen ardından** OTA                           | 4.4        |
| 4.6.1–4.6.5 Oyunlar            | Oyun başına migration ve fonksiyon                              | Oyun başına v43 ekranları                                                                                               | Oyun başına PR; `db push` + deploy; OTA                              | 4.5 ve 4.1 |
| 4.7 Bildirim ve davet          | `…_invites.sql`; `rooms`, `friends`, `account`                  | Zil, liste, davet gönderme ve katılma, push                                                                             | Önce yasal metin ve Veri güvenliği; `db push` + deploy; OTA          | 4.5        |
| Saha testi                     | —                                                               | Önce `docs/FIELD_TEST.md`'nin Faz 4 sürümü (ayrı belge PR'ı); test 6–12 telefonla, dev projesinde, Faz 4'ün tamamı      | —                                                                    | 4.6 ve 4.7 |
| 4.8 Temizlik                   | 4.8a (fonksiyonlar), 4.8b (`…_v4_cleanup.sql`)                  | Ölü kod; saha testinin düzeltmeleri; mağaza metinleri ve görüntüleri                                                    | `db push` + deploy; OTA                                              | Saha testi |

**Sıra ve birleşme.**

- Her adımın sunucusu dev'e gider ve hemen ardından istemcisi OTA ile gider. `deploy-dev` otomatik yayını bunu birleşmede kendiliğinden yapar (migration, fonksiyonlar, OTA). Her adımın OTA'sı ayrı gider; adımlar tek OTA'da toplanmaz.
- **Telefon kontrolü birleşme şartı değildir** (K-8). Birleşme şartı `ci`'ın ve E2E'nin son commit'te 8/8 yeşil olması ve proje sahibinin "onaylandı"sıdır. `e2e` etiketi taslaktan çıkarken eklenir (§4.M). Çalışma öncekinin yayınını beklemeden başlayabilir.
- **Telefondaki kontrol saha testidir** (K-8). K-7'deki 0.5.0 APK kontrolü olduğu gibi kalır.
  - Zamanı: 4.6 ve 4.7 ikisi de birleştikten sonra. Push ve davet emülatörde sınanamaz ve başka telefon kontrolü olmadığı için saha testi Faz 4'ün tamamını kapsar.
  - `docs/FIELD_TEST.md`'nin Faz 4 sürümü saha testinden önce ayrı bir belge PR'ıyla yazılır.
  - 4.8 saha testinden sonra gelir ve testte çıkan düzeltmeleri de alır.
- **PR'lar küçük tutulur:** telefonda görünen bir hatayı saha testinde hangi adımın getirdiği bulunabilsin (aşağıda "Maliyet ve risk").
- İstemci işi önce v43 ya da v44'e bakılarak yapılır; tasarım dosyalarında olmayan görünüm eklenmez.
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

- 4.0–4.7 birleşmiş; v44 ekranları ve koyu tema uygulanmış;
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
- **v44 bağımlılığı:** koyu tema ve eksik ekranlar gelmeden 4.2 başlamaz.
- **Yazı tipi:** Plus Jakarta Sans geniş; 320 dp'de sığma payı azdır. Büyük yazı E2E koşusu (gece ve elle) emülatörde denetler; telefonda görünen kısmı saha testinde.
- **Kontrast:** Harf Kapmaca'nın turuncu zemininde çipler koyulaştırılır (§4.C).
- **Sahtekar'da yazılı tahmin:** serbest metne ilk kez izin verilir; yalnızca son şansta, saklanmaz, `trText` ile eşleşir.
- **Kapsül nick'in hesaba sabit olması:** anonim kişi ziyaretler arasında tanınır (proje sahibinin kararı; gizlilik politikasında yazılı; yenileme §4.P).

## 4.O Değişmez kurallar: adım adım değişiklikler

Bu PR yalnızca proje paragrafını ve görsel kaynak kod kuralını değiştirir (Faz 2 ve 3 geleneği). Aşağıdaki her değişiklik ilgili adımın PR'ında CLAUDE.md'ye işlenir. O adım gelene kadar bugünkü metin geçerlidir; bugünkü davranışı koruyan kod o adımda değişir.

**Kural 3** (4.5'te yeniden yazılır; oyun cümleleri 4.6'nın adımlarıyla eklenir). Faz 2 eki 4.5'te kalkar: eski oyunlar o adımdan sonra çalışmaz. Yeni metin:

> "Oyun sunucu otoriterdir: tur süresi (`ends_at`), içerik dağıtımı, roller, eylem yetkisi (kim ne zaman hangi eylemi yapabilir) ve skor sunucuda hesaplanır. Herkes kendi telefonunda oynar; telefonu olmayan oynamaz. Oyunu yalnızca masa sahibi başlatır; masadakilerin oyları öneridir. Masada aynı anda tek oyun olur. Roller (anlatıcı, tahminci, rakip, ipucu veren, sahtekar, gözlemci) oyun başında sunucuda atanır ve oyun bitene kadar değişmez; oyun sırasında masaya gelen kişi gözlemcidir. Gizli bilgi (kart, kelime, rol, hedef, oylar) yalnızca rolün hak ettiği telefona bir eylemin yanıtıyla gider; açık oyun durumuna, oyun olaylarına ve Realtime yüküne girmez. Her eylem bir tur ve adım indeksine bağlıdır; sunucu doğrular ve sırayı belirler, aynı adıma ikinci eylem yok sayılır, iki telefon aynı eyleme basarsa ilk gelen geçer. Gözlemci oynamaz, puan almaz, oy vermez ve itiraz etmez."

- **4.6.1** ekler: "Kapsül Anlat'ta Doğru ve Pas'a yalnızca anlatıcı, rakip düğmesine yalnızca karşı takım basar; kart anlatıcıya, karşı takıma ve gözlemcilere gider, anlatıcının takım arkadaşlarına gitmez."
- **4.6.3** ekler: "Sahtekar'da rol ve kelime kişiye özeldir; oylar sonuca kadar gizlidir."
- **4.6.4** ekler: "Kapışma oyunlarında ilk basanı sunucu belirler; itirazı oyuncular verir."
- **4.6.5** ekler: "İbre'de hedef ipucu verene ve gözlemcilere gider; kilit ve puan sunucudaki ibre değerindendir."

**Kural 4:**

- **4.4:**
  - "Anonim ya da profilli katılım oda başına seçilir … mekan sohbetinde mesaj başına seçilir" ve Faz 2 ekindeki mekan sohbeti seçimi şu metne döner: "Anonim kişi kapsül avatar ve hesaba sabit `kapsul-xx55` nick'iyle görünür. Nick profil kimliği değildir; nick ile hesap ya da `public_id` arasındaki ilişki hiçbir yanıtta, Realtime yükünde ve analitik olayında görünmez. Anonim ve profilli arasında check-in başına bir değişiklik yapılır; değişiklikten önce yazılan mesajlar eski kimlikte kalır. Kişinin masaya girdiği andaki kimliği masaya yazılır."
  - Yeni cümle: "Mekan ve masa sohbetinde masa adı gitmez; kişi yalnızca nick'iyle ya da gerçek adıyla görünür."
  - "Masa oturum id'si, takma ad gibi check-in süresince geçerli bir takma kimliktir" cümlesi "Check-in kaydının id'si (masa oturum id'si) check-in süresince geçerli bir takma kimliktir ve masanın kişilerine gidebilir" olur.
  - 'Profilimle'nin fotoğraf şartı kalır (K-4): "Profilli görünmek profil fotoğrafı ister."
  - Eklenir (K-3): "Mekan sohbetinde herkes anonim yazabilir. Erkek ve belirtmeyende anonim seçim yalnızca mekan sohbetini etkiler; oyun akışında ve masada her zaman profillidir."
  - Masa içinde kimliğin sabitliği §4.P-3'ün cevabıyla yazılır.
- **4.5:**
  - "diğer masalara … masa takma adı, kişi sayısı ve varsa niyet etiketi gider" ve Faz 3'ün lobi cümlesi: "masa adı, telefon sayısı, varsa niyet ve oyun etiketi".
  - "oda sürerken o odanın üyelerine" ve Faz 2'nin "odanın iki tarafındaki bütün telefonlara" ifadeleri: "masa sürerken masanın bütün kişilerine".
  - "Lobide süren oda yalnızca iki liderin takma adını, taraf başına telefon ve kişi sayısını gösterir" cümlesi: "Süren masalar listesi masa adını ve telefon sayısını gösterir."
  - Faz 3'ün 23.2 cümlesindeki "Oyun akışında (katılma isteği, 'Masanı lobiye aç', 'Bu masadayım'; 'Masanla oyna' oyun akışı sayılmaz)" ifadesi "Oyun akışında ve masada (masa kurma, Katıl, 'Bu masadayım', davete katılma)" olur: "Masanla oyna" ayrı mod olmaktan çıkar (§4.E).
  - Kişi sayısına ve taraflara yapılan diğer atıflar kalkar.
- **4.7:** "Koordinat, mekan ve aktif masa hiçbir kullanıcıya, arkadaşa da gitmez" cümlesinin ardına istisna eklenir: "İstisna (masa daveti): masa sahibi, aynı mekanda check-in'i olan bir arkadaşına masa daveti gönderebilir. Davet masa adını ve telefon sayısını taşır, mekan adı taşımaz ve 2 dakika geçerlidir. Davet ekranı kimin mekanda olduğunu göstermez: sunucu daveti yalnızca aynı mekanda check-in'i olana iletir, gönderen her durumda aynı yanıtı alır."

**Kural 5:**

- **4.4:** "Mekan sohbetinde sessize alınan bunu hiçbir biçimde görmez. Sessize alma kimliğe bağlıdır: anonim kimliği sessize almak aynı kişinin profilli mesajlarını gizlemez."
- **4.5:**
  - Faz 3 eki: "İki taraflı masa hareketsizlikle kapanmaz. Tek taraflı masa (lobide bekleyen ve 'Masanla oyna')…" cümlesi "İki ve daha fazla kişili masa hareketsizlikle kapanmaz. Tek kişilik masa 30 dakika hareketsizlikte sessizce kapanır; lobide bekleyen masaya bekleyen istekler `unavailable` olur" olur.
  - "karşı taraftaki her çift" ifadesi §4.P-15'in cevabına döner.
  - Faz 2'nin taraf cümleleri (liderin üyeyi engellemesi, aynı taraftakiler) §4.P-14 ve §4.P-15'in cevaplarıyla yeniden yazılır.
  - Aynen kalanlar: katılma isteğinde ve "Bu masadayım"da red ve zaman aşımının aynı görünmesi; arkadaşlık isteğinde red ve kalıcı red; arkadaşlıktan çıkarma; mekan sohbetinden gelen isteğin günlük sınırı.
- **4.7:** "Masa sonundaki ve oyun geçmişindeki 'Arkadaş ekle' sessizdir ve bildirim üretmez; bildirime yalnızca açık arkadaşlık istekleri düşer (mekan sohbetinden istek, oyun geçmişinden 'İstek gönder'). Masa davetinde red ve zaman aşımı gönderene aynı görünür; reddedilen istekten ya da davetten karşı taraf haberdar olmaz."

**Kural 6 (4.3):** eklenir: "Keşfet ve Aktiviteler'de konuma göre sıralama ya da 'yakındaki' listesi yoktur; sıralama şehir, semt, etkinlik ve ada göredir. Kişinin kendi check-in'i yalnızca kendisine gösterilir."

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
- CTO incelemesinden sonra verilen kararlar (18 Ekim). Metinde "K-n" diye anılır:

| No         | Karar                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Nerede              |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| K-1        | 23.4b'nin saha testi şartı kalkar. Ayrı bir Faz 3 saha testi yapılmaz; bulma yardımı gözlemleri Faz 4 saha testinde yapılır. (23.4b'nin birleşme şartı K-7 ile değişti.)                                                                                                                                                                                                                                                                                                                                                                                              | §4.M, §4.N          |
| K-2        | Davet ekranı: bütün arkadaşlar listelenir, kimin mekanda olduğu görünmez; sunucu mekanda olmayana daveti sessizce iletmez; gönderen her durumda aynı yanıtı görür                                                                                                                                                                                                                                                                                                                                                                                                     | §4.C, §4.G, kural 4 |
| K-3 (P-1)  | Erkek ve belirtmeyen mekan sohbetinde anonim yazabilir; oyun akışında ve masada her zaman profillidir (kural 12 yalnızca oyun akışı için, aynen). Bu hesaplar için anonim seçim yalnızca mekan sohbetini etkiler; check-in başına 1 değişiklik kuralı onlar için de geçerlidir                                                                                                                                                                                                                                                                                        | §4.D, kural 4 ve 12 |
| K-4 (P-4)  | Profilli görünmek profil fotoğrafı ister (`photo_required`). Soluk kapsül yalnızca fotoğrafı sonradan gizlenen ya da kaldırılan profil içindir                                                                                                                                                                                                                                                                                                                                                                                                                        | §4.D, kural 4       |
| K-5 (P-12) | Rakip düğmesi "Yasak!", ödül "Yasak avcısı"                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | §4.C, §4.F          |
| K-6 (P-13) | Zil yalnızca Mesajlar'da; alt çubuktaki Mesajlar sekmesinde okunmamış noktası. SPEC_V3 §18.3a bu adımda (4.7) değişir                                                                                                                                                                                                                                                                                                                                                                                                                                                 | §4.C, §4.G          |
| K-7        | "OTA telefonda doğrulandı" 23.3b, 23.4a ve 23.4b için birleşme şartı değildir. Telefonda tek kontrol, 4.1 birleştikten sonra 0.5.0 preview APK'sı kurulunca yapılır ve üçünü birlikte kapsar. 23.4b'nin şartı: 23.4a'dan sonraki deploy-dev koşusu yeşil ve `reveal` dev projesinden elle silindi. Eski JS paketli telefonun bir açılışta hata görmesi dev projesinde kabul edildi                                                                                                                                                                                    | §4.N; SPEC_V3 §23.N |
| K-8        | Faz 4 adımları arasında telefon kontrolü birleşme şartı değildir: birleşme şartı `ci` ve E2E 8/8 yeşil ve "onaylandı"; `e2e` etiketi taslaktan çıkarken eklenir (2. CTO incelemesinden sonra proje sahibi). Telefondaki kontrol saha testidir; K-7'deki 0.5.0 APK kontrolü kalır. Saha testi 4.6 ve 4.7 birleştikten sonra, Faz 4'ün tamamını kapsar; `docs/FIELD_TEST.md`'nin Faz 4 sürümü testten önce ayrı belge PR'ıyla yazılır; 4.8 testten sonra gelir ve düzeltmeleri alır. Yalnızca telefonda görünen hatalar teste kadar birikir: PR'lar küçük, OTA'lar ayrı | §4.M, §4.N          |

**Açık kararlar.** İlgili adımdan önce proje sahibine sorulur; karar verilmeden o adımın işi başlamaz. P-1, P-4, P-12 ve P-13 karara bağlandı (K-3…K-6); diğer numaralar değişmez.

| No   | Karar                                                                                                                                                                                                     | Önerim                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Ne zaman     |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| P-2  | Nick yenileme                                                                                                                                                                                             | Profil'den haftada bir. Yeni nick eski mesajları değiştirmez; sessize alma hesaba ve kimliğe bağlı olduğu için yenilemeyle düşmez. Yenileme eski nick'i aynı işlemde `retired_capsule_nicks`'e yazar: eski mesajlarda ve oyun geçmişinde görülen nick başka bir hesaba verilmez. Kapasite (karara girdi): eşik emekli nick'leri saydığı için doğru çalışır, ama haftalık yenileme kapasiteyi hızlı tüketir; en kötü durumda 1.000 kişi bir yılda 52.000 nick harcar, 2 rakamlı biçim 36.100 nick verir (elenenler çıkmadan) | 4.4'ten önce |
| P-3  | Anahtar masanın içinde masa süresince sabit mi?                                                                                                                                                           | Evet. Masadaki kimlik girişte yazılır; anahtar değişirse yeni kimlik mekan sohbetinde ve bir sonraki masada geçerli olur                                                                                                                                                                                                                                                                                                                                                                                                    | 4.4          |
| P-5  | Mekan sohbetinde "yazıyor" balonu ve tüm sohbeti sessize alma                                                                                                                                             | "Yazıyor" pilotta yok: üçüncü bir istemci yayın kanalı ister (kural 9). Tüm sohbeti sessize alma yalnızca telefonda; aktiflik noktasını ve okunmamış sayısını kapatır (push yok)                                                                                                                                                                                                                                                                                                                                            | 4.4          |
| P-6  | Mekan sohbeti aktiflik noktasının tanımı                                                                                                                                                                  | Son 10 dakikada mesaj varsa                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | 4.3          |
| P-7  | Biyografi: iletişim bilgisi filtresi ve sınır (bugün 160, v43'te 80)                                                                                                                                      | Telefon, e-posta, kullanıcı adı ve bağlantı içeren biyografi ve görünen ad reddedilir (maskeleme yok); denetim kural 7 gereği `pure/profanity.ts` ve `trText.ts` içinde, testli. Sınır 80; mevcut uzun biyografiler düzenlenene kadar kalır                                                                                                                                                                                                                                                                                 | 4.3          |
| P-8  | Sahtekar                                                                                                                                                                                                  | İpucu kişi başı 30 sn. 7 ve üstünde 2 sahtekar, birbirlerini bilmezler. Kısmi yakalamada masaya yakalanan her sahtekar için puan                                                                                                                                                                                                                                                                                                                                                                                            | 4.6.3        |
| P-9  | Kapışma                                                                                                                                                                                                   | İtiraz eşiği kapan dışındakilerin yarıdan fazlası; bire birde tek itiraz yeter; gözlemci itiraz edemez; Şarkıda Geçsin'de aynı şarkı serbest, itirazla çözülür                                                                                                                                                                                                                                                                                                                                                              | 4.6.4        |
| P-10 | İbre: rakibin sol ya da sağ tahmini                                                                                                                                                                       | Kalsın (bugünkü kural: 15 sn, doğruysa rakibe 1 puan; ibre hedefin tam üstündeyse puan yok). İzleyen takımın bir işi olur                                                                                                                                                                                                                                                                                                                                                                                                   | 4.6.5        |
| P-11 | Sohbet kartları                                                                                                                                                                                           | Kartı sahip ilerletir; başka oyun başlayınca kartlar kapanır; Ya da'da yalnızca sayılar görünür. `film-dizi-muzik` ve `hic-yaptin-mi` kartları pasif olur (`is_active = false`), içerik silinmez                                                                                                                                                                                                                                                                                                                            | 4.6.2        |
| P-14 | Sahip masadan ya da mekandan ayrılırsa, check-in'i biterse; masada biri diğerini engellerse                                                                                                               | Sahiplik masaya en erken katılan kişiye geçer, masa sürer; masada kimse kalmadıysa kapanır ("Masayı bitir" ayrıca durur). Engel: sahip engellerse engellenen masadan çıkarılır; katılımcı engellerse kendisi çıkar                                                                                                                                                                                                                                                                                                          | 4.5          |
| P-15 | Oyun geçmişi kaydı ve sessiz "Arkadaş ekle" hangi çiftler arasında? Taraf yok                                                                                                                             | Masada 3 dakika kesişen her çift (zaten arkadaş olanlar hariç). Birlikte gelenler ayrı tutulmaz: düğme sessizdir ve iki taraf basmadan hiçbir şey olmaz                                                                                                                                                                                                                                                                                                                                                                     | 4.5          |
| P-16 | Masa sürerken profilde "Arkadaş ekle"                                                                                                                                                                     | Yok. Düğme masa sonunda ve oyun geçmişindedir (Faz 3)                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | 4.5          |
| P-17 | Aktiviteler: Kampanya türü ve "ilgileniyorum" sayacı (v43'te var, spec'te yok)                                                                                                                            | Pilotta yok: Aktiviteler bugünkü etkinlikleri (`venue_events`) ve Geçmiş'i gösterir. Kampanya ve ilgilenme ayrı bir karardır                                                                                                                                                                                                                                                                                                                                                                                                | 4.3          |
| P-18 | Keşfet'te açık masa sayısı: v43 kesin sayı gösteriyor ("3 açık masa", "Sessiz"); bugün kova (`venue_activity`)                                                                                            | Kova kalsın; metin kovadan gelir ("Birkaç açık masa", "Sessiz")                                                                                                                                                                                                                                                                                                                                                                                                                                                             | 4.3          |
| P-19 | v43 tasarım istisnaları (v43 raporu §3, soru 19): Kapsül Anlat'ta iki renkli eşit Pas ve Doğru, bildirim satırlarında birden çok "Kabul et", Ya da kartında iki seçenek; mesaj önizlemesi ve alıntıda "…" | Hepsi kabul; 4.2'de tasarım sistemine istisna olarak yazılır. "…" yalnızca önizlemede ve alıntıda (bugünkü Ekran davranışı kuralı)                                                                                                                                                                                                                                                                                                                                                                                          | 4.2          |

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
- **Emekli nick'ler** (§4.D): silinen hesabın nick'i (ve P-2 onaylanırsa yenilenen nick) `retired_capsule_nicks`'te yalnızca metin olarak tutulur (hesapla bağı ve tarihi yok); doluluk hesabına girer.
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
| 3   | İstekler sekmesi ve gelen istek bildirimi: istek karşı tarafa görünecek mi?               | Yalnızca açık istekler görünür (mekan sohbetinden istek, oyun geçmişinden "İstek gönder"); masa sonundaki "Arkadaş ekle" sessizdir (kural 5, §4.G)                                                                          |
| 4   | Arkadaş olmayana mesaj                                                                    | DM yalnızca arkadaşlar arasında; "Mesaj" düğmesi arkadaş değilken görünmez, yerine bağlama göre "Arkadaş ekle" (§4.G)                                                                                                       |
| 5   | Anonim katılım nerede seçilir, masa sırasında kilitlenir mi?                              | Mekan ekranının üst satırındaki anahtar; check-in başına bir değişiklik (§4.D). Erkek ve belirtmeyende seçim yalnızca mekan sohbetini etkiler (K-3). Masa içinde sabitlik P-3                                               |
| 6   | Mekan sohbeti aktiflik noktası                                                            | P-6                                                                                                                                                                                                                         |
| 7   | Okundu tiki ve yazıyor                                                                    | DM'de var (SPEC_V3 §18.2). Mekan sohbetinde "yazıyor" P-5                                                                                                                                                                   |
| 8   | Engelle, Bildir, Arkadaşlıktan çıkar: karşı taraf ne görür?                               | Engellenen ve şikayet edilen hiçbir şey görmez; çıkarılan çıkarmayı engellemeden ayırt edemez (kural 5). Masada engel P-14                                                                                                  |
| 9   | Bio sınırı ve iletişim bilgisi filtresi                                                   | P-7                                                                                                                                                                                                                         |
| 10  | Masa bitince akış                                                                         | "Masa bitti" ekranı: masadakiler ve kişi başına sessiz "Arkadaş ekle" (§4.E); ekran v44'te                                                                                                                                  |
| 11  | Başka mekana girişte eski masa kapanınca katılımcılara ne olur?                           | Yeni check-in eski check-in'i bitirir; kişi masadan ayrılmış sayılır. Masa diğerleri için sürer; sahipse sahiplik P-14 (§4.E)                                                                                               |
| 12  | Aktiviteleri kim girer?                                                                   | Geliştirici, `pnpm admin:event` ile. Kampanya türü P-17                                                                                                                                                                     |
| 13  | Oyun geçmişi kaydedilecek mi?                                                             | Evet: `play_history` (3 dakika kuralı) ve `game_results`; Aktiviteler → Geçmiş bunlardan (§4.F)                                                                                                                             |
| 14  | "Yakındaki" sıralaması                                                                    | Konuma göre sıralama yok (kural 6, §4.C)                                                                                                                                                                                    |
| 15  | Mekan adlarına karakter sınırı                                                            | Sınır yok; ad içerikten gelir, ekran en çok iki satıra kırar ve küçültür (§4.C)                                                                                                                                             |
| 16  | Mekan sohbeti gizliliği, ad engel listesi                                                 | Görünen ad ve biyografi küfür filtresinden geçer (kural 7); nick'te kaba kısaltmalar üretilmez, liste `content/profanity-tr.json`'da (§4.D)                                                                                 |
| 17  | Bildirim yeri                                                                             | Zil yalnızca Mesajlar'da; alt çubuktaki Mesajlar sekmesinde okunmamış noktası (K-6, §4.G)                                                                                                                                   |
| 18  | Masa daveti: kapsam, süre, kim davet eder, davete katılanın masası, davet gönderme ekranı | Aynı mekanda check-in'i olan arkadaşa, mekan adı olmadan, 2 dakika, yalnızca sahip; boş masa sessizce kapanır (§4.B-8, §4.G). Gönderme ekranı bütün arkadaşları listeler, kimin mekanda olduğu görünmez (K-2); ekran v44'te |
| 19  | Pas ve Doğru'nun iki renkli olması istisna mı?                                            | P-19                                                                                                                                                                                                                        |
| 20  | Sahtekar: 30 sn, 2 sahtekar, kısmi yakalama                                               | P-8                                                                                                                                                                                                                         |
| 21  | Kapışma: eşik, bire bir, gözlemci, aynı şarkı                                             | P-9                                                                                                                                                                                                                         |
| 22  | İbre: "herkes hazırsa kilitlenir", sol-sağ tahmini, tur sayısı ve süreler                 | "Herkes hazırsa kilitlenir" ve süre sonunda kilit kabul; 4 tur, ipucu 30 sn, ayar 45 sn (§4.F). Sol-sağ P-10                                                                                                                |
| 23  | Sohbet kartları: kim geçirir, başka oyun başlarsa, Ya da'da kim neyi seçti                | P-11                                                                                                                                                                                                                        |
| 24  | Kartlar ve kelime havuzları                                                               | Havuzlar hazır (Kapsül Anlat 547, Harf Kapmaca 174 kategori, İbre 225, Şarkıda Geçsin 445, Sohbet kartları 160, Sahtekar 526 kelime); yalnızca Kampüs ve Ya da temaları yazılır (§4.F)                                      |
| 25  | Masa sohbetinde grup adı                                                                  | Kalkar: kişi yalnızca nick'iyle ya da gerçek adıyla görünür (§4.B-7)                                                                                                                                                        |

**Raporun §10 açık soruları:** kural çakışmaları §4.O'da; yazı tipi Plus Jakarta Sans (§4.B-10); koyu tema ve denenmeyen ekranlar v44'te (§4.C); oyun geçmişi Aktiviteler'i besler (soru 13).
