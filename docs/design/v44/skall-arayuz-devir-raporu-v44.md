# skall arayüz denemesi: devir raporu (v44)

Bu rapor yalnızca v43'ten farkları yazar; v43 raporunda burada geçmeyen her şey geçerli.

- **Kaynaklar:** Proje sahibinin v44 listesi, beş kararı (18 Ekim) ve `docs/SPEC_V4.md` (#137, §4.C, §4.D, §4.E, §4.G; §4.F ve §4.P de okundu). Çelişkide spec geçerli sayıldı.
- **Karar verilmedi, koda ve repoya dokunulmadı.** Spec'ten farklı çizilmesi gereken ya da açık kalan her nokta bölüm 6'da soru olarak duruyor.
- **Logo değişmedi.** Yalnızca koyu zeminde logo sisteminin koyu zemin sürümü kullanıldı.

**Dosya:** `skall-masa-deneme-v44.html` (tek dosya, kendi başına çalışır). SPEC_V4 §4.C'ye göre `docs/design/v44/`'e belge PR'ıyla girer.

**Bekleyen Aktiviteler kod PR'ı:** Açılmış bir Aktiviteler kod PR'ı yok; kapatılacak bir şey olmadı, dal da yok.

**Deneme şeridine eklenenler (uygulamanın parçası değil):**

| Satır | Ne yapar |
| --- | --- |
| Görünüm | Tema (Açık/Koyu), Yazı (%100/%130) |
| Kayıt | Kayıt akışı |
| Masa | Masasız, Sahibi, Katılımcı; 6/12 kişi; İstek gelsin (sırayla anonim kişi, profilli kişi, masa); Masa bitti |
| Davet | Arkadaşlar, Yükleniyor, Hata, Arkadaş yok |
| Posterler | Hepsi açık / Yakında; Masa kurulamadı |
| Profil | Kadın / Erkek |
| Fotoğraf | Var / Kaldırıldı; Cinsiyet kapısı |
| Nick | Sabit / Yenile (karar bekliyor) |
| Ayarlar | Bildirimler (izin açık ya da kapalı), Gizlilik, Hesap, Engellenenler, Sessize alınanlar, Boş liste |

---

## 1. Model değişiklikleri

### Check-in masa kurmaz; masa sonradan kurulur (§4.B-2, §4.E)
- **Masasız mekan ekranı:**
  - Mekan sohbeti kartının altında "Henüz masan yok" kartı ve "Masa kur" var.
  - Mekan sohbeti kartında "Mekana giriş yapan herkes okur ve yazar."
- **Masa kur alt sayfası:**
  - **Masa adı:** Kurarken üretiliyor. "Başka ad" masa başına 3 yenileme hakkından düşüyor; hak noktaları burada ve Masadakiler'de ortak.
  - **"Lobide görünsün":** Varsayılanı kapalı. Açılınca niyet ("Etiket yok", "Oyun", "Sohbet") ve oyun etiketi ("Fark etmez" ya da altı oyundan biri) çıkıyor; ikisi de isteğe bağlı (SPEC_V3 §23.C aynen).
  - **Kimlik satırı:** "Masada Elif olarak görünürsün" ya da kapsul adı.
  - **Hata hâli:** "Masa kurulamadı. Bağlantını kontrol edip yeniden dene."
- **Masa kurulunca:**
  - Mekan ekranındaki kart masa kartına dönüşüyor: masa adı, telefon sayısı, "Lobide değil" ya da "Lobide açık". Katılımcının kartında "Katıldın" yazıyor.
  - "Lobiye aç" artık "Masanı lobiye aç" alt sayfasını açıyor (niyet ve oyun etiketi). "Lobiden çek" doğrudan çalışıyor.
- **Tek kişilik masa:** Masa ekranının üstünde "Masada yalnızca sensin" kartı var.

### Herkes kendi telefonuyla; en çok 12 telefon (§4.B-1, §4.B-3)
- **Kişi sayısı beyanı yok.** Masanın kişi sayısı, telefon sayısı.
- **Masadakiler:** Düz liste, iki sütun; "Masa sahibi" ve "Sen" etiketleri var. 12 kişi 320 dp'de ve %130 yazıda yatay taşmadan sığıyor; uzun listede alt sayfa kendi içinde kayıyor.
- **Masadaki kimlik girişte yazılıyor.** Anahtar masa sürerken değişirse Masadakiler'de eski kimlik kalıyor (P-3 önerisi; soru 9).
- **Katılma isteği (sahip görür):**
  - Masası olmayan kişiden: ad, yaş ve fotoğraf; anonimse kapsül ve kapsul adı.
  - Bir masadan: masa adı, telefon sayısı ve isteyen kişi ("Atak Tilki katılmak istiyor · 3 kişi · isteyen anonim"). Masanın diğer kişilerinin profilleri kabulden önce gitmiyor.
  - Kabulde "Atak Tilki geliyor, 3 kişi" ya da "Defne geliyor" yazıyor; kişiler masaya ekleniyor.
  - Toplamı 12'yi geçecekse "Birlikte 12 kişiyi geçersiniz" yazıyor ve Kabul et kapalı.
- **Oyunlarda 12 kişi:** Takım ve oyuncu listeleri masadaki telefonlardan kuruluyor; 320 dp'de sığıyor.

### Katılma yolları (§4.E)
- **Katıl:**
  - Masası olmayan kişi tek başına gönderiyor.
  - Masa sahibi masasıyla gönderiyor; lobinin üstünde "Katılırsan masandaki 2 kişi de seninle gelir" yazıyor. Kabulde masa sahibin masasına taşınıyor.
  - Katılımcıda Katıl yok: "Başka bir masaya geçmek için önce masandan ayrıl."
  - İki masa birlikte 12'yi geçecekse Katıl kapalı.
- **Bu masadayım:** Yalnızca masası olmayan kişide.
- **Fotoğraf şartı (karar 3):** Fotoğrafı olmayan profilli kişi (erkek, belirtmeyen ya da profilli görünen kadın) masa kuramıyor ve katılamıyor:
  - "Henüz masan yok" kartında "Masa kurmak ve masalara katılmak için profil fotoğrafı gerekir" yazıyor; düğme "Fotoğraf ekle" olup Profili düzenle'yi açıyor.
  - Lobide "Masalara katılmak için profil fotoğrafı ekle" yazıyor; Katıl ve Bu masadayım gizli.
  - Davet bildiriminde Katıl yerine "Fotoğraf ekle" var.
- **Soluk kapsül** yalnızca fotoğrafı sonradan kaldırılan ya da gizlenen profilde. Şeritteki "Fotoğraf: Kaldırıldı" bunu gösteriyor. Kayıttaki fotoğraf adımında soluk kapsül yerine boş çerçeve ve kamera var.

### Oy ve başlatma (§4.B-4, §4.F)
- **Oylama:** Herkes, sahip de, bir postere oy veriyor; posterde oy sayısı ve kendi oyu görünüyor.
- **Başlatma:** Oyunu yalnızca sahip başlatıyor. Sahipte "En çok oy: Kapsül Anlat (2). Oylar öneridir; istediğin oyunu başlatabilirsin." yazıyor; katılımcıda "Oyunu masa sahibi başlatır."
- **Soluk poster:** Masanın telefon sayısı oyunun alt sınırından azsa poster soluk, üstünde "4+ kişi" yazıyor ve basılınca oy vermiyor. Alt sınırlar: Kapsül Anlat 4, İbre 4, Sahtekar 3, Harf Kapmaca 2, Şarkıda Geçsin 2, Sohbet kartları 1.
- **"Yakında":** Yeni modele geçmemiş oyunun posteri soluk, üstünde "Yakında" yazıyor ve basılmıyor.
- **Oyun öncesi:** Takımlı oyunda "Henüz seçmeyenler"in altında "Oyun başlarken seçmeyenler gözlemci olur."
- **Ara ekran ve oyun sonu:**
  - Ara ekranda katılımcıya "Masa sahibi geçince sonraki tur başlar; geçmezse 15 sn sonra kendiliğinden başlar" yazıyor.
  - "Yeniden oyna" yalnızca sahipte; katılımcıda tek "Masaya dön".

### Sohbetlerde masa adı yok (§4.B-7)
- **Masa sohbeti:** Balonda yalnızca ad ya da kapsul adı var; ad rengi kişiye göre sabit (6 renk, iki temada 4.5:1).
- **Boş hâl:** "Henüz mesaj yok. İlk mesajı sen yaz."

### Anonim kimlik ve tek değişiklik (§4.B-6, §4.D; kararlar 2 ve 3)
- **Nick sabit:** Kapsul adı ve kapsül hesaba sabit. Profilde kapsül, kapsul adı ve "Sabit; her girişte aynı" yazan kart var, erkekte de: erkek mekan sohbetinde bu adla yazar.
- **Kadın:**
  - Üst satırdaki anahtar bu girişin kimliğini değiştiriyor, check-in başına bir kez.
  - Değiştirmeden önce onay alt sayfası açılıyor: önceki ve sonraki avatar, ardından şu metin: "Bu girişte tek değişiklik hakkın var. Değiştirince bu girişte geri dönemezsin. Yeni mesajların yeni kimlikle görünür, öncekiler eski kimlikte kalır; mekan sohbetini o an izleyen biri iki kimliği eşleştirebilir." Masadaysa ayrıca: "Masadaki kimliğin bu masa bitene kadar değişmez."
  - Hak kullanılınca anahtarda kilit rozeti var, ikinci basışta anahtar sallanıyor ve "Bu girişteki değişiklik hakkını kullandın" uyarısı çıkıyor. Hak yeni check-in'de yenileniyor.
- **Erkek ve belirtmeyen (karar 2, ayrı durum):**
  - Üst satırda anahtar yok; masada ve oyunlarda her zaman profilli.
  - Anonim seçimi yalnızca mekan sohbetinde: yazma alanının üstünde "Arda olarak yazıyorsun · Değiştir" çipi var. Basınca "Mekan sohbetinde anonim yaz?" onayı açılıyor: "Masada ve oyunlarda her zaman profilinle görünürsün."
  - Check-in başına bir değişiklik kuralı aynen geçerli. Kadında aynı çip anahtarın değerini gösteriyor ve aynı onayı açıyor.
- **Ayarlar → "Oyunlara katılım":**
  - Artık girişteki varsayılan (`default_participation`): "Her girişte bununla başlarsın." Bu girişin kimliği ve hakkın durumu altında yazıyor.
  - Erkekte: "Masada ve oyunlarda her zaman profilinle görünürsün. Mekan sohbetinde anonim yazmayı sohbetin içinden seçebilirsin."
- **Fotoğrafsız profilliye geçiş:** Onay önce fotoğraf eklemeyi istiyor.
- **"Nick'i yenile":** Ayrı durum, "Karar bekliyor" etiketli (P-2).

### Masa daveti (§4.B-8, §4.G; karar 1)
- **Yalnızca sahip gönderiyor.** "Davet et" katılımcıda yok.
- **Davet ekranı bütün arkadaşları listeliyor;** kimin mekanda olduğu görünmüyor. Üstte şu açıklama var: "Davet yalnızca şu an bu mekanda olan arkadaşına ulaşır. Kimin burada olduğu görünmez; her davette "Davet gönderildi" yazar. Davet 2 dakika geçerli."
- **Gönderilince:** Her satır aynı "Davet gönderildi"yi ve 2 dakikalık geri sayımı gösteriyor; süre bitince yeniden "Davet et". Kabul edenin satırı "Masanda" oluyor, kişi Masadakiler'de görünüyor. Red ve zaman aşımında sahip hiçbir şey görmüyor.
- **Hâller:** yükleniyor (Tahterevalli), hata ("Arkadaşların yüklenemedi · Yeniden dene"), arkadaş yok, masa dolu.
- **Alıcının bildirimi:**
  - İçerik: masa adı, telefon sayısı ve geri sayım ("Sarı Martı · 3 kişi · 1:59 kaldı"); mekan adı yok.
  - Katıl'da "Kabul edildi, X masasının yanına git" çıkıyor; kişi masaya katılımcı olarak giriyor, sahibin onayı gerekmiyor.
  - Süresi dolan davet soluk: "Davet artık geçerli değil".
  - Masası olan alıcıya "Masadan ayrıl" kuralı yazıyor:
    - tek kişilik masada "Katılınca boş masan kapanır";
    - katılımcıyken "Katılınca şimdiki masandan ayrılırsın";
    - başkalarının bulunduğu masanın sahibiyken "Katılınca masandan ayrılırsın; masa sahipliği masaya en erken katılan kişiye geçer" (P-14 önerisi; soru 2).

### Bildirim zili (karar 5, P-13)
- **Zil yalnızca Mesajlar'da.** Alt çubuktaki Mesajlar sekmesinde okunmamış noktası var: okunmamış bildirim ya da mesaj varken. Diğer sekmelerde zil yok.

### Kapsül Anlat (§4.B-9; karar 4)
- **Ad her yerde Kapsül Anlat.** Arayüzde "Tabu" geçmiyor; yalnızca kod yorumlarında var.
- **Rakibin düğmesi "Yasak!":** Tur sonu etiketi ve bildirimler de "Yasak!". Ödül "Yasak avcısı". Poster alt yazısı "Yasak kelimeyi söyleme" kaldı.

### Koyu tema (§4.B-10)
- **Kapsam:** Her ekranın koyu hâli var, oyun zeminleri dahil. Varsayılan telefonun teması (`userInterfaceStyle: automatic` zaten öyle).
- **Renkler:**
  - Zemin #0D0B1E ve yazı #F3F0FF.
  - Kartlar #1C1838: sistemdeki yüzey #17142E'den bir ton açık, kart zeminden ayrışsın diye.
  - Soluk yazı #B8B3D2: sistemdeki #ADA8C8'den bir ton açık; ikisi de 4.5:1'i geçiyor.
- **Elle ayarlananlar:**
  - **Logo:** Koyu zeminde yazı ve kesişim beyaz.
  - **Seçili çipler:** Ters renkte.
  - **Bildirim baloncuğu:** Açık zeminli.
  - **Uyarı kutuları:** Koyu kahve.
  - **Oyun zeminleri:** Oyunun rengi koyu zemine %62 karışıyor. Harf Kapmaca, Şarkıda Geçsin, Sohbet kartları ve Sahtekar için ayrı koyu geçişler var.
  - **Oyun zeminindeki beyaz göstergeler:** Süre çubuğu, ilerleme noktaları ve kürsü beyaz kalıyor.
  - **Oyun düğmeleri:** Ana düğme açık. Pas ve Doğru'da koyu yazı.

---

## 2. v43'ten düzeltmeler

1. **Keşfet (kural 6):**
   - Konuma göre sıralama kalktı. Yerine "Sakarya · Tüm semtler" düğmesi geldi; şehir ve semt alt sayfadan seçiliyor.
   - Sıralama ada göre ("5 mekan · ada göre").
   - Semtte mekan yoksa boş hâl çıkıyor.
   - Aktiviteler'de "Sakarya'daki mekanlardan".
2. **Arkadaş olmayanın profili:** "Mesaj" yok, yalnızca "Arkadaş ekle".
3. **Harf Kapmaca'nın turuncu zemininde çipler:** Kontrast 3.3–3.7'den 4.5'in üstüne çıktı. Çipler, hayalet düğmeler ve çıkış düğmesi yarı saydam koyu zemine geçti; harf karosu koyulaştı.
4. **320 dp ve %130'da çıkan, v43'ten kalan yerleşim sorunları:**
   - **Uzun alt sayfalar:** Üstleri ekran dışında kalıyordu; artık ekranı geçmiyor ve kendi içinde kayıyor. Kayarken düğmeler de ezilmiyor.
   - **Mekan ekranının sabit üst alanı:** Ekranın yarısını geçip açık masaları ve "Katıl"ı altında bırakıyordu. %45'i geçerse artık sayfayla kayıyor.
   - **Profil düğmeleri:** Büyük yazıda alt alta iniyor.
   - **Alt sekme etiketleri:** Üst üste biniyordu. Öneri: yazı boyutuyla büyümesinler (React Native: `maxFontSizeMultiplier={1}`); denemedeki %130 böyle. Soru 15.
5. **Ölçünce çıkan, v43'ten kalan açık temadaki kontrast açıkları:**
   - Oyun zeminlerindeki yarı saydam beyaz çipler ve düğmeler 3.6–4.25 arasındaydı.
   - Oyun sonu takım puanları 4.1'di.
   - Sahtekar rol kartı 2.5'ti.
   - Sahtekar sonuç etiketi 3.1'di.
   - Kendi mesaj balonundaki saat 4.0'dı.
   - Isınma teması 4.46'ydı: #C4521F, #B4481A oldu. Spec'in token tablosunda hâlâ #C4521F yazıyor; uygulamada da değişmeli.

---

## 3. Yeni ekranlar (SPEC_V4 §4.C listesi)

| Ekran | Durumlar |
| --- | --- |
| Masasız mekan, Masa kur, Masanı lobiye aç | Hata ("Masa kurulamadı"), fotoğraf şartı |
| Davet gönderme (bütün arkadaşlar) | Dolu, yükleniyor, hata, boş, masa dolu |
| Masa bitti (kişi başına sessiz "Arkadaş ekle") | İstedin, Arkadaş oldunuz, zaten arkadaş, boş |
| Kayıt: telefon, kod, profil (görünen ad), doğum tarihi, cinsiyet, fotoğraf, onaylar | Hatalı numara, "Kod gönderilemedi", hatalı kod, 18 yaş altı, fotoğrafsız erkek ve belirtmeyen uyarısı |
| Cinsiyet kapısı (cinsiyeti boş eski hesap, bir kez) | "Cinsiyetini seç · Masalara nasıl katılacağın buna bağlı. Bir kez sorulur." |
| Bildirim ayarları: Masa davetleri, Arkadaşlık istekleri, Mesajlar (`notify_invites`, `notify_friend_requests`, `notify_dm`) | Telefonun izni kapalı |
| Gizlilik: Engellenenler, Sessize alınanlar, gizlilik politikası, KVKK metni, sabit nick'in bedeli | |
| Hesap: telefon (maskeli), İletişim, Çıkış yap, Hesabımı sil | Silme onayı ("Yedeklerden de 7 gün içinde silinir"), "Hesabın silindi" |
| Engellenenler, Sessize alınanlar (kimliğe bağlı) | Boş |
| Anonim anahtarı | Değiştirme onayı, hak bitti, erkekte anahtarsız üst satır ve mekan sohbeti çipi |
| Poster | Soluk (alt sınır) ve "Yakında" |

### Ayrıntılar

- **Kayıt** 7 adım; üstte ilerleme çubuğu ve "3/7".
  - **Metinler:** Bugünkü uygulamanın `tr.ts`'inden alındı: görünen ad açıklaması, doğum tarihi ve cinsiyet notları, "Başlamadan önce", "Kullanım Koşulları'nı okudum ve kabul ediyorum.", "KVKK Aydınlatma Metni'ni okudum.", "Onayla ve devam et".
  - **18 yaş altı:** "skall 18 yaş ve üzeri içindir · Hesabın açılmadı ve bilgilerin saklanmadı."
  - **Fotoğraf adımı (erkek ve belirtmeyen):** "Fotoğrafın yoksa masa kuramaz ve masalara katılamazsın. Fotoğrafı sonra Profil'den de ekleyebilirsin." Düğme "Fotoğrafsız devam et".
  - **Denemede:** 500 000 00 00 kod gönderemez, 000000 yanlış kod.
- **Masa bitti:**
  - Sahip bitirince "Masa bitti", katılımcı ayrılınca "Masadan ayrıldın".
  - Kartın üstünde: "İkiniz de basarsanız arkadaş olursunuz. Yalnızca biriniz basarsa kimse bir şey görmez."
  - Basınca "İstedin · O da isterse arkadaş olursunuz"; karşı taraf da istemişse hemen "Arkadaş oldunuz" ve "Mesaj".
- **Sessize alınanlar:** Şu not var: "Sessize alma o kimliğe bağlıdır: bir kişinin anonim adını sessize almak profilli mesajlarını gizlemez."
- **Bildirim ayarları:** Altta şu not var: "Masa davetinin bildiriminde ad, masa adı ve mekan yazmaz: "Bir arkadaşın seni masasına çağırıyor". Mekan sohbeti bildirim göndermez."

---

## 4. Sınama

- **Kapsam:**
  - Boyutlar: 320x568, 360x640 ve 400x780.
  - Temalar: açık ve koyu.
  - Yazı: %100 ve %130 (sayfadaki px yazı ve satır yükseklikleri 1,3 ile çarpılıyor, şeritteki düğme gibi).
  - 137 senaryo: bütün ekranlar, alt sayfalar ve beş oyunun bütün aşamaları.
- **Bakılanlar:**
  - JS hatası.
  - Yatay taşma; kendi içinde kayan çip satırları hariç.
  - Süreli oyun ekranında süre, istem ve düğmelerin kaydırmadan görünmesi.
  - "..." ile kesilen metin.
  - Görünen her metnin kontrastı: 4.5:1, büyük yazıda 3:1.
- **Sonuçlar:** Bölüm 7.

---

## 5. Kurallarla ilişki

SPEC_V4 §4.O değişmez kuralları adım adım yeniden yazıyor. v44 bu yeni metinlere göre çizildi. Kalan farklar:

| Konu | Durum |
| --- | --- |
| Kural 4, davet istisnası | §4.G'ye göre çizildi: gönderen kimin mekanda olduğunu görmüyor; istisna yalnızca alıcı tarafında |
| Kural 4, erkekte mekan sohbetinde anonim | Karar 2 ile P-1 kapandı; çip yalnızca mekan sohbetinde |
| Kural 12 (fotoğrafsız erkek ve belirtmeyen) | Karar 3 ile P-4 kapandı: `photo_required` kapısı çizildi |
| Kural 9 (mekan sohbeti kanalı) | §4.B-2'ye göre "check-in'i olan"; metin §4.O'da |
| Kural 5 (masa sonu) | "Arkadaş ekle" sessiz; bildirim yalnızca açık istekler |

---

## 6. Sorular (karar bekliyor)

### Spec'teki açık kararlara bağlı olanlar
1. **P-2, Nick yenileme:** Haftada bir mi? Denemede ayrı durum olarak duruyor ("Karar bekliyor").
2. **P-14, Sahiplik devri:** Sahip davete katılınca ya da mekandan ayrılınca sahiplik en erken katılana mı geçer? Denemedeki bildirim metni bunu varsayıyor.
3. **P-16, Masa sürerken "Arkadaş ekle":** Öneri "yok". Denemede masadakilerden açılan profilde v43'teki gibi "Arkadaş ekle" var. Kalkacaksa profil masa içinde yalnızca görüntülenir.
4. **P-17, Aktiviteler:** Kampanya türü ve "ilgileniyorum" denemede v43'teki gibi duruyor.
5. **P-18, Keşfet'te açık masa sayısı:** Denemede kesin sayı ("1 açık masa"); öneri kova ("Birkaç açık masa").
6. **P-6, Aktiflik noktası:** Mekan sohbeti kartındaki nokta v43'teki gibi her zaman yanıyor.
7. **P-5, "Yazıyor" balonu:** Pilotta yok önerisi; denemede v43'teki gibi duruyor.

### v44'te farklı çizilmesi gerekebilecekler
8. **Soluk posterde oy:** Denemede soluk poster oy vermiyor. Spec yalnızca "soluk" diyor. Oy verilebilir mi?
9. **Masadaki kimlik sabit (P-3 önerisi):** Değişiklik onayında "Masadaki kimliğin bu masa bitene kadar değişmez" yazıyor. P-3 başka çıkarsa metin değişir.
10. **Davette geri sayım:** Gönderen her satırda 2 dakikalık geri sayımı görüyor; bu, kabul, red ya da mekanda olmamayı ayırt ettirmiyor. Yine de yalnızca "Davet gönderildi" mi yazsın?
11. **Kayıtta onayların yeri:** Spec onayları en sona koyuyor; bugünkü uygulama başta soruyor ("Başlamadan önce"). Denemede sonda. Hangisi?
12. **Profilli görünen fotoğrafsız kadın:** Masa kuramıyor ve katılamıyor. Denemede "Fotoğraf ekle"ye yönlendiriliyor; "Anonime geç" de önerilsin mi?
13. **Keşfet'te etkinliğe göre sıralama:** §4.C "şehir, semt, etkinlik ve ada göre" diyor; denemede yalnızca şehir, semt ve ad var. Etkinliği olan mekan önce mi gelsin?
14. **Ayarlar'daki "Oyunlara katılım":** Erkekte gizli. Erkek için mekan sohbetinde girişteki varsayılan (anonim ya da profilli) seçilebilsin mi?
15. **Alt sekme etiketleri:** En büyük yazıda büyümesinler mi?
16. **Isınma teması:** #C4521F'in #B4481A olarak değişmesi kabul mü?

### Tasarım sistemi (adım 4.2)
17. Koyu tema için tasarım sistemi onayı:
    - oyun zeminlerinin koyulaştırılması;
    - logonun koyu zemin sürümü;
    - kart (#1C1838) ve soluk yazı (#B8B3D2) tonları;
    - açık temada koyu yarı saydam oyun çipleri.

---

## 7. Sınama sonuçları

Teslim edilen dosya üzerinde, 18 Ekim. Her koşu 137 senaryo (Chromium, hareket azaltılmış).

| Boyut | Tema | Yazı | JS hatası | Yatay taşma | Süreli ekranda sığmayan | "..." ile kesilen |
| --- | --- | --- | --- | --- | --- | --- |
| 320x568 | Açık | %130 | 0 | 0 | 0 | 9 senaryo, hepsi önizleme ya da alıntı |
| 320x568 | Koyu | %130 | 0 | 0 | 0 | 9 senaryo, hepsi önizleme ya da alıntı |
| 360x640 | Açık | %130 | 0 | 0 | 0 | 9 senaryo, hepsi önizleme ya da alıntı |
| 360x640 | Koyu | %130 | 0 | 0 | 0 | 9 senaryo, hepsi önizleme ya da alıntı |
| 360x640 | Açık | %100 | 0 | 0 | 0 | 3 senaryo, mekan sohbetinde alıntı |
| 400x780 | Açık | %130 | 0 | 0 | 0 | 3 senaryo, mekan sohbetinde alıntı |
| 400x780 | Koyu | %130 | 0 | 0 | 0 | 3 senaryo, mekan sohbetinde alıntı |
| 400x780 | Koyu | %100 | 0 | 0 | 0 | 3 senaryo, mekan sohbetinde alıntı |

- **Kesilenler:** Yalnızca kuralın izin verdiği iki yer:
  - Mesajlar'daki satırın son mesaj önizlemesi. Bildirim ve davet alt sayfalarının arkasında da görünüyor.
  - DM'de ve mekan sohbetinde yanıtın alıntısı.
- **Kontrast (360x640, %100):**
  - Açık: 137 senaryonun hepsi geçti.
  - Koyu: 134 senaryo geçti. Kalan üçü (mekan sohbeti) aynı hataydı: alıntıdaki adın rengi koyu zeminde 3,33:1'di. Düzeltildi; sohbet senaryoları iki temada yeniden geçti.
  - Eşikler: 4.5:1, büyük yazıda 3:1. Oyun zeminleri ve çipler dahil.
- **320x568'de tek senaryo yeniden koşuldu:** "Davet → sahibin mekan ekranı" senaryosundaki test adımı kapalı bir kapatma düğmesine basıyordu. Uygulama hatası değildi. Adım düzeltildi, senaryo iki temada yeniden geçti.
- **Elle bakılanlar** (ekran görüntüleri):
  - 12 kişilik liste, takımlar ve oyuncu ızgaraları;
  - alt sayfaların en küçük ekranda kayması;
  - mekan ekranının sabit üst alanı;
  - kayıt adımları;
  - oyunların koyu zeminleri.
- **Bilinen sınır:** Alt sekme etiketleri %130'da büyütülmedi (soru 15).

---

## 8. Prototipte sahte olanlar (v43'e ek)

- Davetin kabulü: denemede yalnızca Fevve "mekanda" ve kabul ediyor.
- Masa bitti'deki eşleşme: bir kişi önceden istemiş.
- Kod doğrulama ve kod gönderme hataları.
- Fotoğraf seçimi.
- Şehir ve semt verisi.
- Bildirim izni.
- Engellenenler ve Sessize alınanlar listeleri.
- Hesap silme.
- Katılma isteği sırası: anonim kişi, profilli kişi, anonim masa, profilli masa.
