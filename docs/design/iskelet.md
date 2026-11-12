# skall: ortak tasarım ve hareket dili (iskelet)

Proje sahibinin onayladığı kararlar (12 Kasım 2026; `docs/decisions/iskelet.md`). CTO oturumu ve tasarım oturumu bu dosyaya göre çalışır. Görsel kaynak (birebir referans): https://claude.ai/artifact/WJmhCyXCHejJcnaFk8ZfcR. Canvas bir HTML taslağıdır: değerler bu belgede yazdığı gibi uygulanır, HTML'deki CSS uygulamaya kopyalanmaz. Hareketin tek kaynağı `theme/aura.ts` içindeki `MOTION`'dır; yeni değerler oraya eklenir, başka yerde sayı yazılmaz.

Bölüm numaraları iş paketinin numaralarıdır (2 ile 6); atıflar bu numaralarladır.

Değişmeyenler: veri, sunucu, mantık ve navigasyon yapısı; renk paleti, Plus Jakarta Sans, riso çizimler, kapsül kankiler, masa kartları ve skall logosu; mesaj balonu renkleri (DM'de karşı taraf #2670E0, mekan sohbeti #17834D, masa sohbeti #C2185B, kendi balonun beyaz; okundu tiki #2C63D6); package id, slug, `masa` şeması ve repo adı.

## 2. Bileşen kuralları

### 2.1 Butonlar: hepsi cam (riso butonlardan kalktı)

8 Kasım riso buton kararı (`docs/decisions/riso-dugme.md`) geçersiz. Değişiklik ortak Btn bileşeninde (`src/aura/kit.tsx`) yapılır; ekranlara tek tek dokunulmaz. Riso, butonlardan kalkar ama çizimlerde ve kankilerde kalır.

| Tür       | Kullanım                                                                                                    | Görünüm                                                                                                                                                                                                                                                             |
| --------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| prominent | Ekran gövdesindeki ana eylem (Mesaj, Semte Git, Masa kur, Lobiye aç, Mekana dön, Ekle, Gönder)             | Yeşil cam: dikey geçiş #28AA64 ile #0E8745 arası, yüzde 92 opak. Üst kenarda 1 px beyaz parlama (yüzde 45), alt kenarda 1 px koyu çizgi (#00280F, yüzde 25), 1 px iç beyaz çerçeve (yüzde 18). Gölge 0 8 20, #0E8745 yüzde 30. Yazı beyaz, 800                       |
| clear     | İkincil eylem (Davet et, Vazgeç, Paketlere bak) ve üst çubuktaki her şey                                   | Beyaz yüzde 62 dolgu, 1 px beyaz çerçeve (yüzde 90), üst kenarda 1 px parlama, gölge 0 8 22, #031B0B yüzde 10. Yazı #031B0B ya da #0B5A2D                                                                                                                           |
| danger    | Geri alınamayan işlemin onayı (Engelle, Çıkış yap)                                                         | Kırmızı cam: #E24E3A ile #C8331F arası, gölge #C8331F yüzde 30                                                                                                                                                                                                      |
| disabled  | Her tür                                                                                                     | Aynı buton, yüzde 45 opaklık, dokunuş kapalı                                                                                                                                                                                                                        |

- Basma: Tap davranışı (2.3).
- Yükseklikler: üst çubuk butonları 46, gövdedeki ana butonlar 50 ile 56, satır içi küçük butonlar 36 ile 40. Sheet başlığındaki X 38.
- Üst çubuktaki Kaydet de clear cam: değişiklik yokken yazı #9AAEA1, varken #0E8745 ve 800. Kaydedince yazı "Kaydedildi" olur, buton boyu sabit kalır (en az 96 genişlik).

### 2.2 Cam yüzeyler ve performans

- Gerçek (canlı) blur sadece şunlarda: üst bar bandı, tab bar, sheet'ler, menüler, sabitlenen şeritler. Mevcut buzlu cam modülü kullanılır (Liquid Glass merceği değil).
- Butonlarda ve kartlarda canlı blur yok: yarı saydam dolgu, iç parlama ve gölgeyle sahte cam çizilir. Aura arka planı statik olduğu için gözle fark edilmez. Listelerde onlarca canlı blur Android'i kilitler; bu kural kesin.
- Blur kaydırma sırasında yeniden hesaplanmaz: katman bir kez çizilir, kaydırmada sadece opaklığı değişir.
- Kartlar: beyaz yüzde 86 dolgu, 1 px beyaz çerçeve, iki katmanlı gölge (0 1 2 yüzde 4 ve 0 14 34 yüzde 7, renk #031B0B), üst kenarda 1 px iç parlama.

### 2.3 Tap (tek basma bileşeni)

- Basılabilen her şey Tap'ten geçer; çıplak Pressable yasak.
- Basınca ölçek `MOTION.press.scale` (0.96), `MOTION.press.downMs`. Bırakınca `MOTION.springs.press` yayı.
- Titreşim rolüne göre (`src/lib/haptics.ts`): birincil buton hafif, seçim değişimi selection, başarı success.
- Kaydırma başlarsa basma durumu iptal edilir. Şu an profilde kaydırırken satırlar basılmış görünüyor; bu düzelir.

### 2.4 Köşeler, kontür, ikonlar

- İç içe köşe: içteki yarıçap, dıştaki eksi iç boşluk. Örnek: kart 26, boşluk 12, içteki görsel 14.
- Fotoğraf kontürü: sadece renkli ya da görsel zemin üstünde 2 ile 4 px beyaz kontür (profil kapağı, mekan kapağı). Gölge yok, ikinci halka yok. Beyaz kart içindeki üst üste avatarlarda kontür yok; onun yerine kartın zemin renginde 2.5 px boşluk ve hafif gölge (0 2 6 yüzde 16).
- İkonlar: hepsi aynı çizgi stilinde, 2 ile 2.2 kalınlık, yuvarlak uç. Dolu ve iki tonlu ikonlar kaldırılır. Ayar satırlarında ikon, renkli kare zemin üstünde beyaz (32 kare, 10 yarıçap).

### 2.5 Kapsül kankiler

- Kankiler repodaki riso görsellerdir (`assets/riso/buddies`, peek-1/2). Göz kırpma: açık ve kapalı göz görselleri dönüşümlü, `MOTION.idle` değerleri (160 ms kapalı, 4 ile 6 saniyede bir). Süzülme: `MOTION.idle.floatPx`, `floatMs`. Bu döngüler UI thread'de çalışır, JS'te çalışmaz.
- Kullanıcının kapsül avatarı düz çizim olarak kalır; anonim kimlik biletinin zemininde riso tram kullanılır.

## 3. Ekran iskeleti

### 3.1 TopBar türleri (ekranlar kendi başlığını yazmaz)

| Tür         | Ekranlar                                         | Davranış                                                                                                                                                                                                                              |
| ----------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| buyukBaslik | Sekme ana ekranları                              | Büyük başlık içerikle birlikte kayar ve 5 ile 100 px arasında söner (ölçek 1'den 0.94'e, köşe sol alt). Ana arama ya da filtre alanı varsa o alan tepeye yapışır (3.2); yoksa başlık bara geçer                                       |
| sayfa       | Arkadaşlar, Profili düzenle, ayar sayfaları      | Üst çubukta geri (46 cam). Altında büyük başlık (34, 800). Kaydırınca başlık 5 ile 50 px arasında söner, bar bandı belirir, bardaki ortalanmış küçük başlık 40 ile 70 px arasında gelir                                               |
| kapak       | Kendi profilin, başkasının profili, mekan detayı | 5.7, 5.6 ve 5.2'deki gibi                                                                                                                                                                                                             |
| sohbet      | DM, masa ve mekan sohbeti                        | Geri ve ayrı cam kapsülde avatar, isim, menü                                                                                                                                                                                          |

Bar bandı: yükseklik 118, zemin #EFF7F1 yüzde 84 ve 22 blur, alt yüzde 28'i şeffaflaşarak biter (sert çizgi yok). Opaklık kaydırmayla 0'dan 1'e gider.

### 3.2 Yapışan alanlar

- Ekranın ana arama ya da filtre alanı varsa kaydırınca o alan bar hizasına (top 52 ile 54) yapışır ve ayrı bir başlık barı çıkmaz: Keşfet'te arama kapsülü, Aktiviteler'de Etkinlikler ve Geçmiş seçimi, Mesajlar'da arama (5.4) ve onun altında Sohbetler ve İstekler seçimi.
- Yapışan alanın üstündeki içerik, tepeye varmadan önce kaybolur: son 80 px'te opaklık 1'den 0'a, ölçek 1'den 0.95'e iner. Örnek: Aktiviteler'deki hediye paketi kartı.
- Yapışınca bant yüksekliği alanın altına kadar uzar.

### 3.3 Tab bar

- Yüzen cam tab bar, etiketli: ikon 22 ve etiket 10.5. Aktif sekme yeşil tonlu bir hapın içinde (#0E8745 yüzde 12), ikon ve yazı yeşil.
- Kaydırma: 120 px'ten sonra aşağı yönde kare başına 3 px'ten hızlı kaydırınca tab bar küçülür; yukarı kaydırınca, 50 px'in altına inince ya da bara basınca açılır. Küçülünce genişlik 350'den 76'ya iner, sadece aktif sekme kalır, diğerleri söner. Hareket `MOTION.springs.tabLead` ile.
- Alt kenar: 160 px yüksekliğinde, şeffaftan #EFF7F1 yüzde 92'ye geçen ve alt yarısında 8 blur olan bir bant; içerik tab barın altına sert kesilmeden girer.

### 3.4 Liste ve kartlar

- Varlıklar (mekanlar, masalar) ayrı kartlarda; kayıtlar (geçmiş, sohbetler, arkadaşlar, ayarlar) gruplu liste kartında, satırlar arasında sağa dayalı 1 px ayırıcı (#E6EDE8).
- Boş durumlar küçük yatay kart: solda 104x72 riso çizim, sağda başlık ve tek cümle; gerekiyorsa altında clear buton. Ekranın yarısını kaplayan boş durum yok.
- Yatay kayan her şerit kenarlarda sert kesilmez; iki uçta yumuşakça silinir (maske). Şerit, panelin kenarına kadar uzanır.

### 3.5 Menü ve sheet

- Bir butondan açılan seçenekler o butondan doğan cam bir menüdür: genişlik 256 ile 272, köşe 26, 28 blur, ölçek 0.18'den 1'e, köken butonun konumu, yay (4.3 → `springs.menu`). Dışına basınca kapanır, Vazgeç yok. Yıkıcı seçenek en altta, 6 px'lik bir aralıkla ayrılmış, kırmızı.
- Alttan açılan sheet sadece içerik ve onay içindir. Kenarlardan 8 px içeride yüzer, köşe 40. Tutamaç ve başlık sabit; sağ üstte 38 X. Altta Tamam ya da Kapat butonu yok. Aşağı çekilerek de kapanır. İçerik başlığın altına bantsız ve yumuşak girer.
- Geri alınamayan işlemler (Engelle, Arkadaşlıktan çıkar, Çıkış yap, Mekandan ayrıl) ayrı bir onay sheet'inden geçer: kişinin ya da mekanın görseli, ne olacağını anlatan tek cümle, danger buton ve clear Vazgeç.

## 4. Hareket kuralları

### 4.1 Temel kural

Kaydırmaya bağlı hiçbir harekette yumuşatma eğrisi yoktur; her şey parmakla birebir gider (doğrusal interpolate, clamp). Yaylar ve eğriler sadece parmak bırakıldıktan sonraki hareketlerde kullanılır: yerine oturma, basma, açılıp kapanma, öğe girişi. Bütün kaydırma işleri UI thread'de çalışır (`useAnimatedScrollHandler` ve `useAnimatedStyle`); JS'e kare başına setState gitmez.

### 4.2 Motion kit

- `src/motion` altında tek kit: Tap, Rise, PopIn, Sheet, Menu, TopBar, ScrollScreen, StickyField, TabBar.
- Ekran ve feature dosyalarında Animated ya da Reanimated'ın doğrudan import edilmesi styleGuard testiyle yasaklanır; ihlaller kite taşınır.
- Kit, içeride hangi motorun daha verimli olduğuna kendisi karar verir; `loopGuard.test.ts`'teki Android uyarısı korunur.

### 4.3 MOTION'a eklenecek değerler

| Ad                    | Değer                                                   | Kullanım                                                                        |
| --------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------- |
| springs.sheet         | stiffness 260, damping 24, mass 1                       | Sheet açılışı (aşağıdan 80 px'ten, opaklık 0.3'ten)                             |
| springs.menu          | stiffness 300, damping 24, mass 1                       | Menünün butondan doğması                                                        |
| springs.pop (var)     | 260, 17                                                 | Yeni mesaj, "Gönderildi" rozeti, aksesuar takılması, gönder butonunun belirmesi |
| springs.tabLead (var) | 420, 30                                                 | Tab bar küçülme ve açılma                                                       |
| springs.seg           | stiffness 380, damping 30                               | Segmentli seçimdeki göstergenin kayması                                         |
| scroll.titleFade      | 5 ile 100 px                                            | Büyük başlık sönmesi                                                            |
| scroll.stickyFadePx   | 80                                                      | Yapışanın üstündeki içeriğin kaybolması                                         |
| tabMin                | eşik 120 px, hız 3 px, açılma 50 px, genişlik 350 ve 76 | Tab bar küçülme                                                                 |

### 4.4 Sayfa geçişleri

- İleri gitme: bütün stack'lerde ios_from_right (Android dahil), kenardan geri kaydırma her sayfada açık.
- Sheet ve menü: 3.5.
- Sekme değişimi: içerik `MOTION.dissolve` ile yerinde gelir.

## 5. Ekranlar (canvas'taki sırayla)

### 5.1 Keşfet (liste ve harita)

- Başlığın üstünde günün zamanı küçük satırı (telefon saatinden: "PERŞEMBE AKŞAMI"); başlık 36, 800, "oturuyorsun?" yeşil.
- Arama ve liste/harita seçimi tek cam kapsül (54). Kaydırınca tepeye yapışır ve 48'e incelir; ayrı başlık barı yok. Kapsülün üstünden bir kanki bakar, içerikle kayar.
- Semte Git: ekranın tek öne çıkan kartı, koyu mürekkep (feature) zemin, nabız atan yeşil nokta, eğik geçit çıkartması ve yanında bir kanki, prominent buton.
- Mekanlar ayrı kartlar: 76 görsel, ad, tür ve semt, noktalı durum etiketi, ok. "Ada göre" sıralama clear buton.
- Harita: tam ekran; büyük başlık yok. Arama ve çipler cam olarak üstte yüzer. Pinlerin altında isim etiketi var, şehir adlarına binmez. Seçili pin büyür, yeşil halka ve hale alır. Altta seçili mekan kartı yayla yükselir. Konum ve bilgi butonları sağ üstte tek cam sütunda. Seçili harita ikonu yeşil. Pinler haritanın işaretçi katmanında, görselleri önbellekte çizilir.

### 5.2 Mekan detayı (kapak)

- Kapak 360, kaydırınca 0.45 hızda kayar (paralaks). Üstte 130 px koyu geçiş (#031B0B yüzde 38'den 0'a).
- İçerik kapağın üstüne 34 köşeli kart gibi biner. Bilgi satırı: Kampüs, semt ve şehir, sağda durum etiketi. Başlık 31.
- Mekana dön: prominent. Etkinlikler boş durumu küçük kart.
- Bar bandı 240 ile 280 px arasında gelir; geri butonunun yanına mekanın küçük görseli ve adı 300 ile 330 px arasında gelir.

### 5.3 Aktiviteler

- Hediye paketi kartı tek katman koyu kart; paketler kartın üstünden taşar (gümüş -12 derece, altın 12 derece, bronz ortada büyük). Clear "Paketlere bak".
- Etkinlikler ve Geçmiş yapışan seçim (3.2); hediye kartı yapışmadan önce söner.
- Geçmiş gruplu liste: oyun görseli 56, ad, kişi sayısı, sağda saat (eşit genişlikli rakam). Başlığın yanında oyun sayısı.
- Oyun detayı sheet'i: başlıkta oyun görseli, gerçek oyun adı, tarih ve kişi sayısı; yeşil tonlu not kutusu; "MASADAKİLER" gruplu listesi. Satırda kanki avatar, isim, "Anonim", küçük prominent Ekle ve üç nokta. Ekle'ye basınca yayla "İstek gitti" olur.

### 5.4 Mesajlar

- Arama (yeni): başlığın altında cam arama kapsülü, Keşfet'tekinin aynısı. Kaydırınca tepeye yapışır, Sohbetler ve İstekler seçimi onun altına gelir.
- Zil clear cam; okunmamış bildirim varsa pembe nokta.
- Okunmamış sohbet: isim ve önizleme kalın, saat yeşil, sağda yeşil sayı rozeti.
- "Henüz mesaj yok" italik ve soluk. İstekler sekmesinde bekleyen sayısı rozet olarak.
- Bildirimler sheet'i: X, metin "Furkan isteğini kabul etti" ve tarih, sheet açılınca kenardan yayla bakan peek kankiler.
- Yeni sohbet butonu prominent yuvarlak.

### 5.5 DM sohbeti

- Başlıkta isim altında "yazıyor..." (`useDmTyping`), yoksa boş.
- Balon gruplama: aynı kişinin art arda balonları birbirine bakan köşelerde 7, diğerlerinde 20; kuyruk sadece grubun son balonunda. Grup içinde 3 px, kişi değişince 12 px boşluk.
- Saat, son satırın sonunda durur (ayrı satıra düşmez); balonun içinde sağ alta yerleşir, metnin sonunda boşluk bırakılır.
- Gün ayırıcı cam hap ("Dün", "Bugün").
- Tepede ve altta bantsız, yumuşak buzlu kenar.
- Yazma alanı tek cam kapsül (52); gönder butonu içinde sağda, 38 dolu yeşil daire ve beyaz yukarı ok. Boşken görünmez, yazınca `springs.pop` ile 0.4'ten 1'e büyür.
- Yeni mesaj: alttan 18 px ve 0.86 ölçekten `springs.pop` ile girer, sohbet yumuşakça aşağı kayar.
- Seçenekler: üç noktadan doğan menü. Sıra: Konuşmayı şikayet et, Arkadaşlıktan çıkar, ayrı grupta kırmızı Engelle. Engelle onay sheet'i açar.
- Duvar kağıdı (wall-dm-light 1290x2796, 2,5 MB) ekran çözünürlüğüne küçültülür, bir kez çözülüp önbellekte tutulur.

### 5.6 Başkasının profili

- Kendi profilinle aynı düzen: kapak (yoksa riso kâğıt tramı), ortada fotoğraf ve 4 px beyaz kontür, yanında göz kırpan kapsülü, isim, soluk biyografi, "Arkadaşsınız" etiketi.
- Tek ana buton prominent Mesaj. Arkadaşlıktan çıkar sadece menüde. Menü DM menüsüyle aynı.
- Rozetler (`ProfileView.badges`) gruplu kartta; rozet yoksa bölüm gizlenir.
- Birlikte oynanan oyunlar (yeni): profilde ortak oyun geçmişi bölümü. Sunucuya bir sorgu ekle (iki kullanıcının ortak `play_history` kayıtları: oyun, tarih, kişi sayısı), son 5 kaydı göster. Gizlilik: sadece arkadaşlar ve aynı odadakiler görebilir; mevcut profil erişim kuralına bağlanır.
- Kaydırma: kapak 0.5 paralaks, fotoğraf 60 ile 180 px arasında 0.75'e küçülür ve 120 ile 190 px arasında söner, isim bara geçer.

### 5.7 Kendi profilin (iki bölüm)

- Üst bölüm sabit katman: kapak (230; alt yarısı hem şeffaflaşarak hem de 14 px bulanık kopyasıyla temaya karışır; bulanık kopya bir kez hazırlanır), üstte 110 px koyu geçiş, fotoğraf 124 ve 4 px beyaz kontür, isim, soluk biyografi. Altında yan yana iki clear buton: kalem ikonlu "Profili düzenle" ve üst üste 28'lik avatarlı "4 arkadaş", ikisi de 48 yüksekliğinde.
- Alt bölüm, 34 köşeli ve tutamaçlı kapsül paneli: anonim kimlik bileti (zemin riso tramı, kapsül göz kırpar), Set balonu (boş slotlar 62).
- Yukarı kaydırınca panel üst bölümün üstüne biner. Üst bölüm -0.35y kayar, 120 ile 300 px arasında söner, ölçeği 0.92'ye iner. Panel barın altına geldiğinde (316 px) listenin başı kapsül biletidir.
- Fotoğraf ve isim bara uçar, doğrusal ve parmakla birebir. t = clamp(y / 316). Fotoğraf boyu 124'ten 30'a, merkezi (195, 196 - 0.35y(1 - t)) noktasından (152, 73) noktasına, kontür 4'ten 1.5'e. İsim ölçeği 1'den 0.516'ya, merkezi (195, 291 - 0.35y(1 - t)) noktasından (214, 73) noktasına. Ekranda tek fotoğraf ve tek isim vardır; barda ayrı kopya yok. Mevcut "süzülen fotoğraf kopyası" mantığı bu varış noktasıyla kullanılır.
- Panelin boş üst kısmı dokunuşu yutmaz; alttaki butonlara geçirir.

### 5.8 Profili düzenle ve Arkadaşlar

- Profili düzenle: sayfa türü. Kapak ve fotoğraf profildeki gibi tek önizlemede. Kapağın üstündeki clear "Kapak" butonu Değiştir ve Kaldır menüsünü açar; fotoğrafta clear kamera butonu var. Alanlarda sayaç ve odakta yeşil halka (3 px, #0E8745 yüzde 18). Doğum tarihi bir ayar satırı: kilit ve "Değiştirilemez". Kaydet üst çubukta clear.
- Arkadaşlar: sayfa türü, alt başlık "4 arkadaş". Gruplu liste, satırda clear cam mesaj butonu (46). Peek kanki listenin kenarından bakar.

### 5.9 Ayarlar (sheet)

- Sıra: Bildirimler, Gizlilik, Hesap (renkli kare ikonlu satırlar); OYUNLARA KATILIM seçimi ve kısa açıklama; GÖRÜNÜM seçimi; ayrı grupta kırmızı Çıkış yap (onay sheet'i); en altta TEST SÜRÜMÜ satırları (sadece test sürümünde).
- Başlık ve X sabit, Tamam yok.

### 5.10 Kapsülün (düzenleyici)

- Sayfa türü; Kaydet üst çubukta clear.
- Kapsül, halkası olmayan riso tramlı bir sahnede: tam boy, süzülür, göz kırpar, altında nefes alan gölge. Aksesuar takılınca `springs.pop` ile başına düşer. Önizlemenin altındaki boş gri öğe kaldırılır.
- Sahnenin alt köşelerinde clear "Hepsini çıkar" ve zar (rastgele).
- Kategoriler: ikonlu hap çipler (Renk, Göz, Baş, Yüz, Ağız, Boyun), yatay kayar, kenarlarda silinir. Seçili çip koyu. Çiplerin üstünde ince ikinci satır: tema paketleri (Tümü, Yılbaşı, Korku...). Paket seçilince şerit o paketin parçalarını gösterir.
- Ürünler: deneme şeridi. Yatay, ortaya kenetlenen (snap) 84'lük yuvarlak öğeler; kutuda sadece aksesuar çizilir, bütün kapsül tekrar çizilmez. Ortaya gelen öğe kapsüle anında takılır, ortadaki öğe 1.14 ölçek ve yeşil halka, diğerleri 0.9. Şerit panel genişliğinde, iki kenarda silinir. Altında seçili öğenin adı ve nokta göstergesi.

### 5.11 Mekan

- Üstte skall logosu ve clear üç nokta. Mekan adı tek başına büyük (23). Altında nabız atan "Mekandasın" etiketi.
- Masan yokken: kart, sağa yaslı çizim ve yazının arkasında kâğıt renginde geçiş; prominent "Masa kur".
- Masan varken: tek katmanlı kart. Masa kartı görseli tam genişlikte (210), ad görselin altındaki koyu geçişin üstünde (geçiş her kartta aynı). Köşede cam durum etiketi: "Lobide değil" ya da "Dolu". Altında oturanlar tek sırada (32'lik avatarlar, kendi fotoğrafın ve kankiler, kartın zemin renginde boşlukla ayrılmış), yer varsa sonda kesikli boş sandalye. Altında ince doluluk çubuğu (yer varken yeşil, doluyken pembe) ve bir cümle ("Sadece sen varsın", "5 kişi oturuyor", "Masa dolu. Biri kalkınca yer açılır."). Renkli kişi çubukları ve sayı yazısı kaldırılır. Prominent Lobiye aç ve clear Davet et; masa doluyken ikisi de pasif.
- Mekan sohbeti kartı: içinde doğrudan yazma alanı ve gönder.
- Açık masalar: başlığın yanında sayı; boş durum küçük kart.
- Kaydırma (doğrusal, parmakla birebir): her şey parmakla kayar; masa kartının üstü bar altına (104) değince durur ve alt kenarı parmakla gelerek kart 72'lik şeride küçülür (görsel 52, ad, durum, küçük prominent Lobiye aç ya da Masa kur). Kart yüksekliği 170'in altına inince içerik şerit görünümüne geçer (opaklık geçişi 70 px). Ardından mekan sohbeti aynı yöntemle 54'lük şeride küçülür. İkisi de sabitlenir; açık masalar altlarından akar.
- Üç nokta menüsü: "Mekanda kalma süren" ve dolan çubuk; "Profiline geç" ("Şu an anonimsin. Bir kez değiştirebilirsin."); ayrı grupta kırmızı "Mekandan ayrıl" (onay sheet'i).
- Davet sheet'i: X, iki satır açıklama, gruplu arkadaş listesi, satırda clear "Davet et". Basınca "Gönderildi" olur ve yanındaki halka 2 dakika boyunca dolar.

## 6. Tasarımdan bağımsız hatalar

| No  | Hata                                                                                                                                                                                             | Yer                                                    |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------ |
| 1   | Geçmiş listesi ve rozetler eski GAME_NAMES listesini kullanıyor ("Sahtekar", "Kapsül Anlat", "Sohbet"). Güncel adlar kullanılmalı: Krot, Kinshi, Sohbet kartları                                 | `supabase/functions/_shared/pure/brand.ts`, `i18n/tr.ts` |
| 2   | Dolu bir masa lobiye açılabiliyor. Buton pasif olmalı ve sunucu da isteği reddetmeli                                                                                                             | Lobi ve masa uç noktaları                              |
| 3   | Kapsül düzenleyicide önizlemenin altında boş, gri bir öğe var                                                                                                                                    | Kapsül ekranı                                          |
| 4   | Kaydırmaya başlarken satırlar basılmış görünüyor                                                                                                                                                 | Tap (2.3)                                              |
| 5   | iPhone'da 120 Hz kapalı: Info.plist'e `CADisableMinimumFrameDurationOnPhone = true` eklenmeli. Native build ister, OTA ile gelmez; bir sonraki build'e ekle                                      | `app.config.ts`                                        |
| 6   | Sistemde "saydamlığı azalt" açıksa cam yerine dolu ve tonlu yüzey kullanılmalı                                                                                                                   | Cam bileşenleri                                        |
