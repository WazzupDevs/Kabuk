# skall arayüz denemesi: devir raporu (v43)

Bu oturum karar vermez ve koda dokunmaz. Aşağıdakiler yönetim oturumunun onayına sunulan öneri ve sorulardır. Bu rapor v25 raporunun yerine geçer; v25'teki bölümler korunup güncellendi.

**Dosya:** `skall-masa-deneme-v43.html` (tek dosya, kendi başına çalışır, telefonda açılır)
**Görünüm:** Yalnızca "Senin görünümün".
**Kapsanan ekranlar:**
- Daha önceden olanlar: Mekan, Masa (sahibi ve katılımcı), Mesajlar, Birebir sohbet, Başkasının profili, Kendi profilin, Arkadaşlar, Profili düzenle, Aktiviteler, Keşfet.
- **Yeni:** Mekan sohbeti, kapsül avatarlar, bildirimler, masa sohbetinde Sohbet kartları ve beş oyunun oyun ekranları: Tabu, Sahtekar, Harf Kapmaca, Şarkıda Geçsin, İbre.

**Deneme şeridi:** Üstteki koyu şerit uygulamanın parçası değil.
- "Masa: Sahibi / Katılımcı" rolü değiştirir.
- "Oyun" satırında bir oyun seçilince o oyunun durum düğmeleri açılır.
- "Bildirim" satırı yeni bildirim düşürür.

**Sınama:** 320x568, 360x640 ve 400x780'de yatay taşma ve JS hatası yok. Süreli oyun ekranları, yazı yüzde 130 büyütülmüşken de kaydırmadan sığıyor.

---

## 1. Uygulamaya aktarma planı (öneri)

| Adım | Ne yapılır | Neden |
| --- | --- | --- |
| 1 | Bölüm 6'daki kararlar verilir | Kararsız kalan her nokta uygulamada tahminle doldurulur, sonra yeniden yapılır |
| 2 | Native bağımlılıklar tek seferde eklenir, tek APK çıkılır (bölüm 7) | Her native modül yeni APK demek; sonrası EAS Update ile gider |
| 3 | Temel katman: renk ve ölçü tokenları, çubuk ikon ailesi, kapsül avatar, hareket sabitleri, düğme, kart ve alt sayfa bileşenleri (bölüm 5) | Ekranlar bu parçalardan kurulur |
| 4 | Ekranlar ayrı işler olarak: Mekan, Mekan sohbeti, Masa ve masa sohbeti, Mesajlar ve bildirimler, Profil, Aktiviteler, Keşfet | Biri bozulursa diğerleri etkilenmez |
| 5 | Oyunlar: önce sunucuda oyun durumu (bölüm 6, Sunucu), sonra ekranlar. Önerilen sıra:<br>1. Sohbet kartları (en basit, sohbetin içinde)<br>2. Tabu<br>3. Sahtekar<br>4. Harf Kapmaca ve Şarkıda Geçsin (ortak kapışma motoru)<br>5. İbre (canlı ibre, en pahalısı) | Gizli bilgi ve süreler sunucuda olmadan oyunlar hileye açık olur |
| 6 | Her ekran prototiple yan yana kontrol edilir: 320 ve 360 px, en büyük yazı boyutu, hareketi azalt açık | Aktarım ancak ölçülerek doğrulanır |
| 7 | Sahte kısımlar gerçek veriye bağlanır (bölüm 8) | Görsel tamam olsa da veri tarafı ayrıca iş ister |

---

## 2. Ekranlar: ne değişti

### Mekan
- **Görünüm:** Palet logo renklerine çekildi. Düğmeler düz; gradyan ve 3B gölge yok.
- **Üst satır:** Solda kırmızı çubuklardan çarpı (Mekandan ayrıl), ortada logo, sağda hızlı anonim anahtarı ve profil fotoğrafı.
- **Mekan sohbeti kartı:** İki balonlu ikon ve aktiflik noktası var. Mekan sohbeti kartıyla masa kartı sabit; masalar altlarından kayıyor.
- **Masa kartı:** "Lobiye aç" ve "Davet et" düğmeleri var. Katılma isteğinde Buluş, beklerken Kesişme, müsait değilse çarpıp geri çekilme hareketi oynuyor. Geri sayım metinde görünüyor.
- **Lobi:** Yüklenirken Tahterevalli, boşken boş durum işareti çıkıyor. Süren masalar tek masa modeline göre listeleniyor.

### Kapsül avatarlar (yeni)
- **Anonim kullanıcı:** Logodaki çubuklardan kapsül karakter. 28 varyant var, ölçüleri aynı, yalnızca renk ve aksesuar değişiyor (korsan, kaptan, vampir, taç, kulaklık, kedi ve diğerleri). Adı `kapsul-xx55` biçiminde: iki harf, iki rakam.
- **Fotoğrafı olmayan, anonim olmayan kullanıcı:** Soluk hayalet renginde düz kapsül.
- **Varyant adla eşleşiyor:** Aynı ad hep aynı kapsülü alıyor. Uygulamada varyant atama anında sunucuda saklanmalı.

### Mekan sohbeti (yeni)
- **Kişiler görünüyor:** Ya fotoğraf ve gerçek ad, ya da kapsül ve kapsul adı. Masa adı hiç geçmiyor.
- **Düzen:** Üst çubuk sabit. Duvar kağıdı sabit bir katman (logo işaretinden desen ve yumuşak renk ışıkları), mesajlar üstünden kayıyor.
- **Yazma alanı:** Yüzüyor, arkasında şerit yok; mesajlar altından geçiyor. Yazma alanında kendi avatarın yok.
- **Balonlar:** Ad balonun içinde ve kişiye göre sabit renkte. Art arda gelen mesajlar tek avatarla alta diziliyor.
- **Etkileşim:**
  - Mesaja basılı tutunca tepki seçici, Yanıtla ve Bildir çıkıyor; kendi mesajında Sil de var.
  - Kişiye dokununca Profili gör (anonimde kapalı), Sessize al ve Bildir çıkıyor.
  - Seçeneklerde tüm sohbeti sessize alma ve sessize alınanların listesi var.
- **Diğer:** Aşağı in düğmesi yeni mesaj sayısını gösteriyor; yazıyor balonu var.

### Masa (sahibi ve katılımcı)
- **Üst alan:** Sabit. Geri, masa adı ve kişi sayısı (dokununca Masadakiler), sağda Bitir ya da Ayrıl. Sahibinde altında "Lobiye aç" ve "Davet et" var.
- **Sekmeler:** "Oyun Seç" ve "Masa Sohbeti"; kategori çipleri ve altı animasyonlu poster.
- **Oylama ve başlatma:** Postere dokunmak oy veriyor. Başlatma yalnızca sahibinde. Başlat'a basınca her oyun kendi oyun öncesi sayfasına gidiyor; Sohbet kartları ise masa sohbetinde açılıyor.
- **Masa sohbeti:** Mekan sohbetiyle aynı duvar kağıdı ve yüzen yazma alanı. Yeni gelen mesaj artık yazma alanının üstünde kalıyor; önceden altında kalabiliyordu.

### Mesajlar ve bildirimler
- **Liste:** "Sohbet" ve "İstekler" sekmeleri. Önizleme, okunmamış rozeti ve yazıyor göstergesi var. İsteklerde reddet ve kabul et düğmeleri var.
- **Bildirim düğmesi (yeni):** Sağ üstte, çubuk ikon ailesinden bir zil: mor kubbe, pembe çubuk, kesişimde koyu ton, sarı tokmak.
  - Yeni bildirim gelince zil sallanıyor, okunmamış sayısı rozet olarak çıkıyor.
  - Açınca rozet siliniyor; yeni olanlar liste açıkken vurgulu kalıyor.
- **Bildirim listesi:** Alt sayfada "Yeni" ve "Önceki" diye ayrılıyor. Üç tür var:
  1. **Gelen arkadaşlık isteği:** Reddet ya da Kabul et. İstekler sekmesiyle iki yönlü eş zamanlı. Kabul edince satır "artık arkadaşsınız" oluyor ve Mesaj yaz çıkıyor.
  2. **İsteğini kabul eden kişi:** Satıra dokununca birebir sohbet açılıyor.
  3. **Arkadaşın masa daveti:** Masa adı ve kişi sayısı görünüyor. Katıl'a basınca "Kabul edildi, X masasının yanına git" çıkıyor ve o masaya katılımcı olarak giriliyor. Süresi dolan davet soluk görünüyor.
- **Reddetmek sessiz:** Reddedilen istekten ya da davetten karşı taraf haberdar olmuyor.

### Birebir sohbet
- **Mevcut özellikler:** Balonlar, gün etiketleri, okundu tiki, emoji tepkisi ve kaydırıp yanıtlama.
- **Yeni:** Üst çubuk sabit, sayfa kaydırılınca kaymıyor. Duvar kağıdı ve yüzen yazma alanı mekan sohbetiyle aynı.
- **Düzeltme:** Kendi mesajına yanıt verince yanıt kutusu 44x44'e çöküyordu; giderildi.

### Profil, Arkadaşlar, Profili düzenle, Aktiviteler, Keşfet
- v25'teki gibi. Anonim ve fotoğrafsız kişilerde artık kapsül avatarlar kullanılıyor.

### Oyunlar: ortak yapı (yeni)
- **Herkes kendi telefonunda oynuyor.** Her oyunun bir oyun öncesi sayfası var: oyuncular ve gözlemciler, ya da takımlar ve gözlemciler. Oyunu yalnızca masa sahibi başlatıyor.
- **Oyun sayfası:** Tam ekran. Zemin oyunun ya da sıradaki takımın renginde, üstünde beyaz desen.
  - Üst çubuk: solda çıkış, ortada tur etiketi, sağda skor.
  - Çıkış: sahibinde "Oyunu bitir" (herkes için biter), katılımcıda "Oyundan çık" (oyun diğerleri için sürer).
- **Kural 10:** Süreli ekranlarda süre, istem ve düğmeler kaydırmadan birlikte görünüyor. Aynı anda tek alt sayfa açık oluyor.
- **Oyun sonu:** Kazanan ve öne çıkanlar gösteriliyor, kazananlara konfeti. Altta "Masaya dön" ve "Yeniden oyna".

| Oyun | Aşamalar |
| --- | --- |
| Tabu | Takımlar, tur öncesi, 3 2 1 geri sayım, oyun (60 sn), tur sonu, oyun sonu |
| Sahtekar | Oyuncular, rol kartı, ipucu turları (2 tur, kişi başı 30 sn), oylama (90 sn), sonuç, son şans (15 sn), oyun sonu |
| Harf Kapmaca | Oyuncular, harf çarkı, soru açık (15 sn), söyleme ve itiraz (6 sn), yeniden açık (8 sn), harf sonu, oyun sonu |
| Şarkıda Geçsin | Oyuncular, geri sayım, kelime açık (20 sn), söyleme ve itiraz (12 sn), yeniden açık (10 sn), oyun sonu |
| İbre | Takımlar, tur öncesi, ipucu (30 sn), ayar (45 sn), sonuç, oyun sonu |
| Sohbet kartları | Tema seçimi, kart (süresiz), kapandı |

### Tabu
- **Takım seçimi:** Mor ve Pembe takım, gözlemciler, henüz seçmeyenler, Karıştır. Her takımda en az 2 kişi gerekiyor. Oyun 6 tur, turda 60 saniye ve 3 pas hakkı.
- **Roller:**
  - **Anlatıcı:** Kartı görüyor. Altta eşit genişlikte iki düğme: Pas (sarı) ve Doğru (yeşil).
  - **Tahminci:** Anlatanın yüzünü, bildikleri doğru sayısını ve son kelimelerin akışını görüyor.
  - **Rakip:** Kartı görüyor. Ortada, tüm satırı kaplamayan kırmızı bir Tabu düğmesi var. Tabu anlatan takıma bir puan kaybettiriyor.
  - **Gözlemci:** Kartı görüyor, oynamıyor.
- **Kart:** Fiziksel bir deste gibi üst üste yığılı. Kenarına dokununca 3B eğiliyor. Üzerinde yalnızca kelime ve yasak kelimeler var: "TABU" etiketi ve kart numarası kalktı. Boyu ekran yüksekliğine göre uzuyor.
- **Bu turun sayıları:** Sağ üstteki skorun hemen altında ikonlu mini tablo: doğru, pas, tabu.
- **Tur sonu ve oyun sonu:** Tur sonunda kelimeler Doğru, Pas ya da Tabu etiketiyle listeleniyor. Oyun sonunda en çok bildiren anlatıcı ve "Tabu avcısı" gösteriliyor.

### Sahtekar
- **Sahtekar sayısı:** 7 ve üstü oyuncuda 2 sahtekar var ve birbirlerini bilmiyorlar.
- **Rol kartı:** Basılı tutunca dönüyor. Oyun boyunca "Rolüm" düğmesi basılı tutulunca rol görünüyor. Sahtekar yalnızca kategoriyi görüyor, gözlemci hem kelimeyi hem sahtekarı görüyor.
- **İpucu turları:** İpuçları sesli veriliyor. Konuşan kişinin etrafında halka sayaç dönüyor, sıradaki kişi yazılı. Sırası gelen "Söyledim"e basıyor.
- **Oylama:** Sahtekar sayısı kadar kişi seçiliyor. Kimlerin oy verdiği görünüyor, kime verdikleri görünmüyor.
- **Sonuç:** Oylar çubuk olarak gösteriliyor. En çok oy alan sahtekar sayısı kadar kişi suçlanıyor. Sınırda oy eşitliği varsa o koltuk boş kalıyor. Sahtekarların altında "Yakalandı" ya da "Kaçtı" yazıyor.
- **Son şans:** Yakalanan sahtekarların yazarak tek bir ortak tahmin hakkı var. Karşılaştırmada büyük küçük harf ve noktalama dikkate alınmıyor.
- **Kazanma:** Masa ancak bütün sahtekarlar yakalanır ve tahmin tutmazsa kazanıyor.

### Harf Kapmaca (sesli kapışma)
- **Akış:** Oyun 3 harf sürüyor. Her harfin başında harf çarkı dönüyor, ardından sırayla 5 kategori geliyor.
- **Kapma:** Kart kategoriyi ve harfi gösteriyor ("K harfiyle başlayan bir hayvan söyle"). İlk Kaptım'a basan cevabı yüksek sesle söylüyor.
- **İtiraz:** Kapan kişi dışındaki oyuncuların yarıdan fazlası itiraz ederse cevap geçmiyor. O zaman soru diğerlerine yeniden açılıyor ve kapan kişinin o soruda hakkı bitiyor. İtiraz çıkmazsa 1 puan.
- **Ekranda:** Oyuncuların puanları küçük avatar sırası olarak görünüyor; sağ üstte senin puanın var.
- **Harf sonu ve oyun sonu:** Her harfin sonunda kimin hangi kategoriyi kaptığı listeleniyor. Oyun sonunda ilk üç kişi kürsüde gösteriliyor.

### Şarkıda Geçsin (sesli kapışma)
- **Akış:** Oyun 8 kelime sürüyor. Kelime herkese aynı anda çıkıyor.
- **Kapma:** İlk Söylüyorum'a basan, içinde o kelime geçen bir şarkıdan parça söylüyor. Söyleyenin avatarının iki yanında ekolayzer çubukları oynuyor.
- **İtiraz ve puan:** Kurallar Harf Kapmaca'yla aynı. İki oyun tek bir kapışma motorunu paylaşıyor.
- **Telif:** Uygulama şarkı sözü göstermiyor, yalnızca kelime veriyor; ses de kaydedilmiyor.

### İbre (ortak ibre)
- **Takımlar:** Tabu'daki gibi iki takım ve gözlemciler. Oyun 4 tur; her turda iki takım birer kez oynuyor ve ipucu veren kişi takım içinde sırayla değişiyor.
- **İpucu:** Yarım kadranın iki ucunda bir zıtlık yazıyor (örneğin Soğuk ve Sıcak). Hedefi yalnızca ipucu veren ve gözlemciler görüyor, diğerlerinde kadran örtülü. İpucu veren tek bir ipucunu sesli söylüyor.
- **Ayar:**
  - Takımdaki herkes aynı ibreyi görüyor ve çevirebiliyor. Başkası çevirirken ibrenin üstünde "Can çeviriyor" yazıyor.
  - Takımın tamamı Hazırım deyince ibre kilitleniyor. İbre oynarsa onaylar sıfırlanıyor; süre biterse ibre olduğu yerde kilitleniyor.
  - Rakip takım ibreyi canlı izliyor, ipucu veren ise yalnızca izliyor.
- **Sonuç:** Örtü açılıyor. Hedefin ortasına yakınlığa göre 4, 3 ya da 2 puan veriliyor, ıskalanırsa 0. Oyun sonunda en iyi ipucu veren gösteriliyor.

### Sohbet kartları (masa sohbetine gömülü)
- **Tam ekran oyun değil:** Kartlar sohbet etmek için var.
- **Başlatma:** Başlat'a basınca tema alt sayfası açılıyor; Isınma, Kampüs, Derin ve Ya da'dan bir ya da birkaçı seçiliyor. Ardından masa sohbeti açılıyor.
- **Kart:** Sohbetin üstünde küçük ve sabit duruyor; temayı, kaçıncı kart olduğunu ve soruyu gösteriyor. Mesajlar kartın altından kayıyor.
- **Sohbetteki not:** Her yeni kart sohbete küçük bir not olarak da düşüyor, böylece eski cevapların hangi soruya ait olduğu belli kalıyor. Kartların açılıp kapandığı da sohbette tek satırla görünüyor.
- **Cevaplar:** Mesaj olarak yazılıyor. Kart açıkken yazma alanında "Cevabını yaz" yazıyor.
- **Masa sahibi:** "Kartı geç" ile ilerliyor. Tema adına dokununca temayı değiştirebiliyor, kartları yeniden karıştırabiliyor ya da kapatabiliyor. Katılımcı yalnızca kartı görüyor.
- **Ya da kartları:** İki seçenek kartın içinde; her seçenekte yalnızca kaç kişinin seçtiği görünüyor.

---

## 3. Dokunduğu kurallar ve spec bölümleri

| Kural ya da bölüm | Ne oldu |
| --- | --- |
| Logo (kural 1) | Değişmedi |
| Lobi (kural 2) | Uyuldu |
| Katılma akışı (kural 3) | Uyuldu. Davette de aynı metin kullanılıyor: "Kabul edildi, X masasının yanına git" |
| "Oda" kelimesi (kural 4) | Görünmüyor. Mekan sohbetinin adı "Mekan sohbeti" |
| Konum, mekan, aktif masa (kural 5) | Masa daveti arkadaşın masasını bildiriyor: çakışma. Öneri bölüm 6'da |
| Tek taraflı arkadaş ekleme (kural 6) | Gelen istek bildirimi isteği karşı tarafa görünür yapıyor: çakışma. Reddedilen istek yine bekleyenle aynı görünüyor |
| Yaş, doğum tarihi (kural 7) | Uyuldu |
| Dil ve metin (kural 8) | Emoji yalnızca sohbet tepkilerinde. Mesaj önizlemesinde ve alıntıda "…" var, istisna gerekiyor. Düğmeler eylem bildiriyor ama Türkçede fiil sonda ("Sonraki tura geç", "Masaya dön"); "fiille başlar" kuralı böyle okunmalı mı, onay gerekiyor |
| 11 px, 44 px, tek birincil düğme (kural 9) | En küçük yazı 11 px, dokunma alanları 44 px. İstisnalar:<br>1. Tabu'da Pas ve Doğru iki renkli, eşit düğme.<br>2. Bildirim listesinde her satırda bir "Kabul et" ya da "Katıl".<br>3. Ya da kartında iki seçenek. |
| Süreli ekranlar ve alt sayfalar (kural 10) | Uyuldu; 320x568'de ve yazı yüzde 130 büyükken de sığıyor |
| Yeni özellik işareti (kural 11) | Bölüm 4'teki her madde "spec kararı gerekir" |
| Brief'teki Sahtekar süresi | İpucu turu kişi başı 15 sn'den 30 sn'ye çıktı |
| Sesli Tabu | Adı Tabu oldu |

---

## 4. Yeni özellikler (hepsi spec kararı gerekir)

1. **Kapsül avatarlar ve `kapsul-xx55` adları;** fotoğrafsız profil için soluk kapsül.
2. **Mekan sohbeti:** Kişi görünümü, kişiyi ya da tüm sohbeti sessize alma, mesaja tepki ve yanıt.
3. **Oyunlarda gözlemci rolü** (Tabu, Sahtekar, Harf Kapmaca, Şarkıda Geçsin, İbre).
4. **Tabu:** 3B eğilen kart destesi ve turun ikonlu mini tablosu.
5. **Sahtekar:** 7 ve üstünde 2 sahtekar, sınır eşitliği kuralı, ortak son tahmin, kısmi yakalamada sahtekarların kazanması.
6. **Kapışma oyunları:** Çoğunluk itirazı, itirazda sorunun yeniden açılması, kapan kişinin "Söyledim" demesinden sonra 2 saniye itiraz payı.
7. **İbre:** Ortak ibre, "herkes hazırsa kilitlenir" kuralı, ibre oynayınca onayların sıfırlanması.
8. **Sohbet kartları:** Sohbete gömülü kart, sohbete düşen kart notu, Ya da oylaması, birden çok tema seçimi.
9. **Bildirim düğmesi ve listesi;** masa daveti bildirimi.

---

## 5. Tasarım sistemi önerisi (tasarım sistemi kararı gerekir)

### Renkler (v25'e ek olarak)

| Rol | Renk |
| --- | --- |
| Tabu takımları (Mor, Pembe) | #6A47F5, #D6336C |
| Sahtekar zemini | #2A1C66 ile #1B1446 arası geçiş |
| Harf Kapmaca zemini | #CF4A2A ile #B8325A arası geçiş |
| Şarkıda Geçsin zemini | #2B1878 ile #4A22A8 arası geçiş |
| İbre zemini | Sıradaki takımın rengi |
| Pas, Doğru, Tabu düğmeleri | #FFD23F, #34D27F, #C8331F |
| İbre puan bölgeleri (2, 3, 4) | #FFD86B, #FFA94D, #FF4F8B |
| Sohbet kartı temaları (Isınma, Kampüs, Derin, Ya da) | #C4521F, #6A47F5, #2F2A78, #187A48 |
| Bildirim rozeti | #C51F62 |

Oyun zeminlerinin ve temaların ana renkleri beyaz yazıyla en az 4.5:1 kontrastta. Bir istisna var: yarı saydam beyaz çipler, Harf Kapmaca'nın turuncu zemininde bu oranın altına düşüyor (yaklaşık 3.3:1). Uygulamada çip zemini koyulaştırılmalı.

### Bileşenler
- **Oyun düğmesi:** 56 px yüksek kapsül. Ana düğme beyaz zemin üstünde oyun renginde yazı; yan düğme saydam beyaz.
- **Ortak oyun parçaları:**
  - Halka sayaç (konuşan ya da kapan kişi için)
  - Süre çubuğu (son 5 saniyede turuncuya dönüyor)
  - Üstte beliren kısa bildirim
  - 3 2 1 Başla geri sayımı
  - Konfeti
- **Sohbet duvar kağıdı:** Logo işaretinden desen ve üç yumuşak renk ışığı. Native'de önceden çizilmiş tek bir görsel olmalı (bölüm 9).
- **Zil:** Çubuk ikon ailesinden. Yeni bildirimde sallanıyor, rozet zıplıyor.
- **Yazı tipi:** Plus Jakarta Sans. Tasarım sistemi Poppins ve Manrope diyor; karar gerekiyor.

### Hareket
- **Önceki hareketler korunuyor:** Buluş, Kesişme, Tahterevalli, boş durum, Dönüş ve ikon yayları.
- **Yeni hareketler:**
  - Tabu kartının eğilmesi
  - Sahtekar rol kartının dönmesi
  - Harf çarkı
  - Plak dönüşü ve ekolayzer
  - İbre örtüsünün açılması
  - Zilin sallanması
- **Hareketi azalt açıkken:** Hepsi duruyor ya da yalnızca saydamlık değişiyor.

---

## 6. Gereken kararlar

### Spec: v25'ten açık kalanlar
1. Sahibi en çok oy alan dışında bir oyunu başlatabilir mi?
2. Kategoriler ve oyunların dağılımı.
3. Kural 6 ile İstekler sekmesi ve gelen istek bildirimi: istek karşı tarafa görünecek mi? Prototip "görünür" varsayıyor.
4. Arkadaş olmayana mesaj kapalı (düğme görünüyor, çalışmıyor): onay.
5. Anonim katılım nerede seçilecek, masa sırasında kilitlenecek mi?
6. Mekan sohbeti aktiflik noktasının tanımı.
7. Okundu tiki ve yazıyor göstergesi olacak mı?
8. Engelle, Bildir, Arkadaşlıktan çıkar: karşı taraf ne görecek?
9. Bio sınırı ve iletişim bilgisi filtresi.
10. Masa bitince akış nasıl olacak?
11. Başka mekana girişte eski masa kapanınca katılımcılara ne olacak?
12. Aktiviteleri kim girecek?
13. Oyun geçmişi kaydedilecek mi?
14. "Yakındaki" sıralaması neye göre yapılacak?
15. Mekan adlarına karakter sınırı.

### Spec: yeni
16. **Mekan sohbeti gizliliği:** Ad ve fotoğraf mekandaki herkese açık. Ad engel listesi gerekiyor.
17. **Bildirim yeri:** v25'teki "bildirimler nerede toplanır" sorusuna öneri, Mesajlar'daki zil ve liste. Alt çubuktaki Mesajlar sekmesinde ayrıca bir nokta olsun mu?
18. **Masa daveti ve kural 5:**
    - Öneri: davet yalnızca aynı mekana giriş yapmış arkadaşlara gitsin. Bildirimde lobide görünenden fazlası olmasın: masa adı ve kişi sayısı, mekan ya da konum yok.
    - Davet ne kadar süre geçerli?
    - Yalnızca masa sahibi mi davet edebilir?
    - Kendi masası açıkken davete katılanın masası kapanır mı?
    - Davet gönderme ekranı yok: "Davet et" hâlâ "masa adını söyle" diyor.
19. **Tabu:** Pas ve Doğru'nun iki renkli olması kural 9'a istisna mı sayılacak?
20. **Sahtekar:**
    - Kişi başı 30 sn kalıcı mı?
    - 7 ve üstünde 2 sahtekar ve birbirlerini bilmemeleri.
    - Kısmi yakalamada sahtekarların kazanması dengesiz olabilir; yakalanan her sahtekara puan veren bir kural düşünülebilir.
21. **Kapışma oyunları:**
    - İtiraz eşiği "yarıdan fazlası" mı olsun?
    - Bire birde rakibin tek itirazı yetiyor; bu kabul edilebilir mi?
    - Gözlemci itiraz edemiyor; doğru mu?
    - Şarkıda Geçsin'de aynı şarkının tekrar kullanılması serbest mi?
22. **İbre:**
    - "Herkes hazırsa kilitlenir" kuralı.
    - Rakip takıma "sağ mı sol mu" tahmini eklensin mi?
    - Tur sayısı ve süreler.
23. **Sohbet kartları:**
    - Kartı yalnızca masa sahibi mi geçirecek?
    - Kartlar açıkken başka bir oyun başlarsa kartlar kapansın mı?
    - Ya da oylarında kim neyi seçti gösterilsin mi?
24. **Kartlar ve kelime havuzları:**
    - Denemede Tabu 12 kart, Sahtekar 10 kelime, Harf Kapmaca 18 harf ve 12 kategori, Şarkıda Geçsin 16 kelime, İbre 12 zıtlık, Sohbet kartları 24 kart.
    - Pilot için her birinde birkaç yüz giriş ve içerik gözden geçirmesi gerekiyor.
25. **Masa sohbetinde grup adı:** Ad yanında hâlâ grup adı görünüyor ("Can · Neşeli Panda"). Tek masa modelinde kaldırılsın mı?

### Sunucu
- **Oyun durumu sunucuda tutulmalı:**
  - Her oyun bir durum makinesi (bölüm 2'deki aşamalar tablosu).
  - Süreler sunucu saatinden: sunucu bitiş zamanını gönderir, telefon yalnızca geri sayar.
- **Gizli bilgi yalnızca hak edene gitmeli:**
  - Tabu kartı: anlatıcı, rakip ve gözlemci.
  - Sahtekar rolü ve kelimesi: kişiye özel.
  - İbre hedefi: ipucu veren ve gözlemciler.
  - Bunlar hiçbir zaman tüm masaya yayınlanmamalı.
  - Sahtekar oyları sonuç anına kadar gizli kalmalı.
- **Kapışmada ilk basanı sunucu belirlemeli:** Tek seferlik koşullu güncelleme, yani "henüz kapan yoksa kapan bu kişi". Telefon saatine güvenilmemeli. Wi-Fi ile mobil veri arasındaki gecikme farkı birkaç yüz milisaniyeyi bulabiliyor.
- **İbre canlı ibresi:**
  - Yalnızca sürüklerken, saniyede en çok 10 kez gönderilmeli. Bırakınca son konum yollanmalı; izleyen telefonlar ara konumları yumuşatmalı.
  - Maliyet hesabı bölüm 9'da.
- **Yeni tablolar:**
  - Bildirimler: tür, kimden, kime, durum, son geçerlilik zamanı, okundu.
  - Masa davetleri.
  - Mekan sohbeti sessize almaları.
  - Oyun oturumları ve sonuçları.
  - Sohbet kartı mesaj türü ve masadaki aktif kart.
  - Kapsül varyantı ve kapsul adı ataması.
- **Önceki maddeler:**
  - Yazıyor sinyali birkaç saniyede bir gönderilmeli.
  - Okundu bilgisi toplu gönderilmeli.
  - Profil fotoğrafı yüklemeden önce telefonda küçültülmeli.

### Tasarım sistemi
- Bölüm 5'teki palet, oyun renkleri, ikon ailesi, kapsül avatar ve yazı tipi.

---

## 7. Native bağımlılıklar

| Paket | Ne için | Not |
| --- | --- | --- |
| react-native-svg | İkonlar, posterler, kapsül avatarlar, İbre kadranı, halka sayaç | Büyük ihtimalle projede var |
| react-native-reanimated | Yay hareketleri, Tabu kartının eğilmesi, rol kartının dönmesi, ibre | Eğilme ve ibre arayüz iş parçacığında çalışmalı |
| react-native-gesture-handler | Kaydırıp yanıtla, kart eğme ve kaydırma, ibre sürükleme, basılı tutma | Expo projelerinde genelde var |
| expo-haptics | Oyunlarda son saniyeler, kapma, Tabu, yanıt eşiği | Yoksa yeni APK |
| expo-linear-gradient | Tabu kartındaki ışık parlaması, oyun zeminleri | Yoksa yeni APK; düz renkle vazgeçilebilir |
| expo-notifications ve Firebase Cloud Messaging | Uygulama kapalıyken davet ve istek bildirimi | Yeni native modül, yeni APK ve Firebase kurulumu. Davetler zamana bağlı olduğu için push olmadan değeri düşer |
| expo-image-picker, expo-image-manipulator | Profil fotoğrafı | v25'teki gibi |
| expo-blur | Gerekmiyor | Bulanıklık kullanılmadı |

Hepsi tek APK'da toplanmalı; sonrası EAS Update.

---

## 8. Prototipte sahte olanlar

- Bütün veriler: mekanlar, masalar, kişiler, mesajlar, bildirimler, etkinlikler, geçmiş.
- Diğer oyuncuların hareketleri zamanlayıcıyla taklit ediliyor: hazır olma, ipucu, oy, kapma, itiraz, ibre çevirme, sohbet cevapları.
- Oyun süreleri ve kazanan hesabı telefonda yapılıyor; gerçekte sunucuda olacak.
- Harita, konum doğrulama, okundu tiki ve yazıyor göstergesi, fotoğraf yükleme.
- Push bildirimi yok; yalnızca uygulama içindeki liste var.

---

## 9. Performans ve maliyet uyarıları

- **İbre'nin Realtime maliyeti:** Supabase Realtime'da bir canlı mesaj, gönderim artı her alıcı ayrı ayrı sayılıyor. Pro planda ayda 5 milyon mesaj dahil, sonrası milyon başına 2,5 dolar. Tur başına yaklaşık 15 saniye sürükleme ve 6 kişilik masa varsayımıyla:

  | Gönderim | Bir oyun | Günde 100 oyunla ay sonu |
  | --- | --- | --- |
  | Parmak hareketi olduğu gibi | Yaklaşık 40 bin mesaj | Yaklaşık 300 dolar |
  | Saniyede en çok 10 kez | Yaklaşık 7 bin mesaj | Yaklaşık 40 dolar |

  Diğer oyunların mesaj yükü önemsiz.
- **Animasyonlar:** Masada altı poster, Aktiviteler'de dört kapak, oyunlarda plak, ekolayzer ve kart hareketleri var. Ekran dışındakiler durmalı, hareketi azalt açıkken durağan olmalı.
- **Tabu kartının eğilmesi:** JS iş parçacığında yapılırsa ucuz Android'de takılır; reanimated ile arayüz iş parçacığında yapılmalı.
- **Sohbet duvar kağıdı:** Desen her mesajda yeniden çizilirse kaydırma takılır. Tek bir önceden çizilmiş görsel ve FlatList kullanılmalı.
- **Küçük ekranda yer:**
  - 320x568'de masa sohbetinin üst alanı Sohbet kartıyla birlikte ekranın yarısını alıyor; mesajlara yaklaşık 210 px kalıyor.
  - Seçenekler: kart açıkken "Lobiye aç" ve "Davet et" satırını sohbet sekmesinde gizlemek ya da kaydırınca kartı yalnızca tema ve sıra satırına indirmek.
- **Yazı tipi:** Plus Jakarta Sans geniş bir yazı tipi; 320 px'de sığma payı az.

---

## 10. Açık sorular

1. Bölüm 6'daki kural 5 ve kural 6 çakışmaları nasıl çözülecek?
2. Tasarım sistemi yazı tipi: Plus Jakarta Sans mı, Poppins ve Manrope mu?
3. Koyu tema bu denemede yok.
4. Henüz denenmeyen ekranlar: kayıt akışı, "Masa bitti" ekranı, davet gönderme ekranı, Bildirim ayarları.
5. Oyun geçmişi ve Aktiviteler'deki Geçmiş sekmesi oyun sonuçlarıyla beslenecek mi?
