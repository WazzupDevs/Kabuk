# Sohbet içi kıyas: Telegram Android ve skall (13 Kasım 2026)

Kapsam: sohbet ekranının içi (mesaj akışı, balon, yazma alanı, mesaj menüsü, zemin, kaydırma ve klavye). Sohbet listesi, aramalar ve kanallar kapsam dışı.

**Yöntem:** Telegram Android'in açık kaynağından (`DrKLO/Telegram`, GPL-2.0) yalnız şu dosyalar seyrek alındı ve arandı, bütün okunmadı:

- `ChatActivity` (sohbet ekranı)
- `Cells/ChatMessageCell` (mesaj hücresi)
- `ActionBar/MessageDrawable` (balon)
- `Components/SizeNotifierFrameLayout` (zemin)
- `Components/ChatActivityEnterView` (yazma alanı)
- `Components/RecyclerListView`
- `recyclerview/ChatListItemAnimator`
- `ActionBar/AdjustPanLayoutHelper`
- `Cells/TextSelectionHelper`

React Native karşılığı için Mattermost Mobile'ın `post_list`'ine bakıldı.

**Lisans:** yalnız yöntem öğrenildi. Kod, sınıf yapısı, metin ve görünüş alınmadı (CLAUDE.md → Çalışma şekli, `.claude/skills/telegram-referans`). Ölçüm sayıları `docs/perf/akicilik-denetimi.md` → 4.2 ve 4.3'ten.

## 1. Özellik kıyası

"Var" yalnız kodda ya da telefonda görülen için yazıldı. Telegram'da olup skall'da olmayan her satır bir ürün kararıdır: CLAUDE.md'ye göre kimsenin istemediği özellik eklenmez, bu tablo öneri değildir.

| Özellik                                  | Telegram                                                         | skall (DM / masa / mekan)                                          | Not                                                |
| ---------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------ | -------------------------------------------------- |
| Yanıtla (sağa kaydırarak ve menüden)     | Var                                                              | Var, üçünde                                                        | `SwipeToReply`, eşikte titreşim                    |
| Alıntıya dokununca mesaja gitme          | Var                                                              | Var                                                                | `goToQuote`, alıntı silinmişse `quoteGone`         |
| Tepki                                    | Var (uzun basışta şerit, çift dokunuşla hızlı tepki, özel emoji) | Var: uzun basışta 6 tepki                                          | Çift dokunuşla hızlı tepki skall'da yok            |
| Kopyala                                  | Var                                                              | Var                                                                |                                                    |
| Metnin bir kısmını seçme                 | Var (`TextSelectionHelper`)                                      | Yok                                                                |                                                    |
| Düzenle                                  | Var                                                              | Yok                                                                | M1-18: ürün kararı                                 |
| Sil                                      | Var (iki taraftan)                                               | Masa sohbetinde var; DM'de yok                                     | M1-18                                              |
| İlet, paylaş                             | Var                                                              | Yok                                                                | Anonimlik kurallarıyla çelişebilir (kural 4)       |
| Sabitle ve sabit mesaj şeridi            | Var                                                              | Yok                                                                |                                                    |
| Çoklu seçim (toplu sil, ilet, kopyala)   | Var                                                              | Yok                                                                |                                                    |
| Bildir                                   | Var                                                              | Var                                                                |                                                    |
| Sessize al, engelle                      | Var (sohbet menüsünden)                                          | Mekan ve semt sohbetinde sessize alma; masada engel                | Kural 5                                            |
| Gönderiliyor, gönderildi, okundu tikleri | Var                                                              | DM'de var (gönderiliyor, gönderildi, iletildi, okundu)             |                                                    |
| Gönderilemedi, tekrar dene, vazgeç       | Var                                                              | Var                                                                | M1-01: DM ve masada tekrar gönderim güvenli değil  |
| Yazıyor bilgisi                          | Var (yazıyor, ses kaydediyor, dosya gönderiyor)                  | DM'de "yazıyor"                                                    |                                                    |
| Okunmamış mesajlar çizgisi               | Var                                                              | Var                                                                | CLAUDE.md → Ekran davranışı                        |
| Aşağı inme düğmesi                       | Var, okunmamış sayısıyla                                         | Var (sağ altta ok)                                                 | Sayı gösterip göstermediği bu kıyasta doğrulanmadı |
| Bahsedilme ve tepki atlama düğmeleri     | Var                                                              | Yok                                                                | Grup sohbetine özgü                                |
| Kayan tarih (kaydırırken üstte gün)      | Var (`floatingDateView`)                                         | Var (yüzen tarih hapı)                                             | PF-53 açık bulgu                                   |
| Tarihe atlama (takvim)                   | Var                                                              | Yok                                                                |                                                    |
| Sohbet içinde arama                      | Var                                                              | Yok                                                                |                                                    |
| Taslağın saklanması                      | Var (sohbetten çıkınca kalır)                                    | Yok                                                                | M1-02                                              |
| Fotoğraf, dosya, konum, anket, kişi eki  | Var                                                              | Yok (sohbette ek yok)                                              |                                                    |
| Sesli ve görüntülü mesaj                 | Var                                                              | Yok                                                                |                                                    |
| Çıkartma, GIF, emoji paneli              | Var                                                              | Sistem klavyesi; yalnız emojiden oluşan mesaj büyük çiziliyor      |                                                    |
| Bağlantı önizlemesi                      | Var                                                              | Yok                                                                |                                                    |
| Zamanlanmış ve sessiz gönderim           | Var                                                              | Yok                                                                |                                                    |
| Çeviri                                   | Var                                                              | Yok                                                                |                                                    |
| Boş sohbette karşılama                   | Var (çıkartmalı)                                                 | Var (boş hâl metni)                                                |                                                    |
| Sohbete özel zemin ve tema               | Var (kullanıcı seçer)                                            | Sohbet türüne göre sabit riso zemin; masa sohbetinde masanın kartı | Aura tuvali                                        |
| Yavaş mod, otomatik silme                | Var                                                              | Mekan sohbetinde hız sınırı; mesajlar zamanla silinir (sunucu)     | Kural 10, D9                                       |
| Profilden ve mesajdan arkadaşlık isteği  | —                                                                | Mekan ve semt sohbetinde var                                       | skall'a özgü                                       |
| Anonim ve profilli kimlik                | —                                                                | Var                                                                | Kural 4                                            |

## 2. Teknik kıyas: aynı iş nasıl çiziliyor

| İş                                                     | Telegram Android                                                                                                                                                                                                        | skall                                                                                                                                                                              | Ölçümle ilişkisi (4.3)                                                                              |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Liste                                                  | `RecyclerView`: ekrandan çıkan hücre yeniden kullanılır; ekleme, kayma ve silme hareketlerini kendi item animatörü yapar (`ChatListItemAnimator`)                                                                       | Ters `FlatList`, hücre yeniden kullanılmaz, `windowSize` 11; `removeClippedSubviews` yok                                                                                           | Kaydırmada UI payı 1,5 ms'nin altında; liste bugün darboğaz değil                                   |
| RN karşılığı                                           | —                                                                                                                                                                                                                       | Mattermost: ters `FlatList`, `removeClippedSubviews`, `windowSize` 10, ilk çizimde küçük parti                                                                                     | Ekran dışındaki satırları çizim ağacından ayırır; `prepareTree` ve görünüm sayısı düşer (ölçülmedi) |
| Mesaj hücresi                                          | Tek bir `View`: metin, saat, tikler, tepkiler, alıntı ve avatar `onDraw` içinde hazır metin düzenleriyle çiziliyor; hücreye alt görünüm eklenmiyor                                                                      | Balon başına çok sayıda RN görünümü: DM ekranında 368 görünüm, ekrandaki 11 balon için yaklaşık 30 görünüm                                                                         | Çizim kaydı ucuz (Draw 0,4 ms); maliyet RenderThread'de                                             |
| Balonun şekli                                          | Yol (`Path`), balonun boyuna göre her çizimde üretilir ve doğrudan boyanır; grup içindeki konumuna göre köşeler küçülür                                                                                                 | SVG yolu (`BubbleShape`, `bubblePath.ts`); paylaşılan SVG resmi; M1-12: hemen her balon kendi resmini üretiyor                                                                     | Doku çizimi kare başına yaklaşık 43 (4.3)                                                           |
| Balonun gölgesi                                        | Köşe yarıçapı türü başına bir kez yapılan küçük (50 x 40 dp) bir resim, dokuz parça olarak gerilip tek çizimde basılıyor; bütün balonlar aynı resmi paylaşıyor                                                          | Gölge bir kez yapılmış resimden dokuz ayrı parça olarak çiziliyor (`ShadowView`, `shadowParts`)                                                                                    | Balon başına gölge için Telegram'da 1, skall'da 9 çizim (çıkarım: sayılmadı)                        |
| Zemin                                                  | Listenin arkasında ayrı tek bir görünüm. Resim ekran boyuna ölçeklenip bir kez çiziliyor; liste kayarken zemin görünümü yeniden kaydedilmiyor, yalnız hazır resmi basılıyor. Paralaks ve hareketli zemin aynı görünümde | Tek tam ekran `Image` (iyi). Üstüne sistem çubuklarının altı için şeritler: şerit başına 1 + 8 dilim, ekranda üç şerit (`WallBand`). Aşırı çizimde zemin ve balonlar 4 kat ve üstü | Komut gönderme 6–7 ms ve GPU beklemesi 3,7 ms; liste yokken 4,7 ms'ye iniyor                        |
| Üst çubuk ve yazma alanının arkası                     | Bulanık çubuk, içeriğin küçük bir kopyasını bulanıklaştırıyor; yalnız değişince yeniden                                                                                                                                 | Canlı cam kapalı (`TAB_BAR_GLASS = false`); açık temada camlı görünüş dolguyla                                                                                                     | Açık temada GPU 12 ms (4.3); kaynağı ayrılmadı                                                      |
| Klavye                                                 | Pencere klavyeyle yeniden boyutlanırken içerik aynı karede kaydırılıyor (`AdjustPanLayoutHelper`, `SizeNotifierFrameLayout`)                                                                                            | `react-native-keyboard-controller`; kaydırma başlayınca klavye iniyor                                                                                                              | Klavyede takılma %9 (4.2)                                                                           |
| Kaydırmayla değişenler (kayan tarih, aşağı in düğmesi) | Kaydırma geri çağrısında, native tarafta, yalnız görünen parça hesaplanıyor                                                                                                                                             | JS'te kaydırma dinleyicisi (A-19), gün başlıkları dolaşılıyor (A-31)                                                                                                               | UI payı küçük; JS ölçülmedi                                                                         |
| Mesaj menüsü                                           | Mesaj yerinde büyütülüp arka plan karartılıyor; tepki şeridi mesajın yanından açılıyor                                                                                                                                  | Aynı davranış (`MessagePop`, "Telegram Android's message menu opening")                                                                                                            | —                                                                                                   |
| Metin                                                  | Metin düzenleri bir kez ölçülüp hücrede tutuluyor                                                                                                                                                                       | RN `Text`; her balonda ayrı yazı görünümü                                                                                                                                          | Yazı atlası çizimi kare başına 19 (4.3)                                                             |

## 3. Sonuç

**Ölçüldü (4.3):**

- skall'ın DM kaydırmasında kare yaklaşık 16,5 ms sürüyor. Maliyet RenderThread'de ve GPU'da, balonun içeriğinden bağımsız.

**Çıkarım:** Telegram'ın aynı işi ucuz yapmasının üç yöntemi var:

1. **Zemin:** ayrı bir görünümde tek resim olarak çiziliyor ve kaydırmada yeniden kaydedilmiyor.
2. **Gölge:** balonların hepsi aynı küçük gölge resmini tek çizimle paylaşıyor.
3. **Hücre:** her mesaj alt görünümü olmayan tek bir hücre.

Üçü de görüntüyü değiştirmeden çizim sayısını azaltıyor.

**Aynı görüntüyü daha ucuz çizmek için sıra.** Bu bir yöntem önerisidir, kod değişikliği proje sahibinin onayıyla yapılır:

1. **Zemin şeritleri.** Sistem çubuklarının altındaki şeritlerin dilimlerini, zeminle hizalı tek bir resim katmanında toplamak. Görünüş aynı kalır, çizim sayısı şerit başına 9'dan 1'e iner. OTA ile olur.
2. **Gölge.** Balon gölgesini tek parça gerilen resimle çizmek; yarıçap türü başına bir resim, bütün balonlar paylaşır. Bugünkü resim yerel modülde (`ShadowView`) dokuz parça çiziliyor; tek çizim yerel modül değişikliğidir, yeni build ister.
3. **Görünmeyen tam ekran zeminler.** Zeminin altında kalan, görünmeyen tam ekran zeminleri çizmemek (A-42). OTA ile olur.
4. **Liste.** Mattermost'taki gibi `removeClippedSubviews` ile ekran dışındaki satırları çizim ağacından ayırmak. Etkisi ölçülmeden karar verilmez.

Her adımdan sonra 4.3'teki hâl 1 yeniden ölçülür.

**Ölçülmedi:**

- Açık temadaki 12 ms'lik GPU payının hangi katmandan geldiği.
- Balon başına gölge çizim sayısı.
- JS iş parçacığının kaydırmadaki payı.
