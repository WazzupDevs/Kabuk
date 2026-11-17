# Yeni arayüz tuvali: pano–kod tam denetimi (18 Kasım 2026)

Proje sahibi "komple denetim, her ince detayına kadar, eksik istemiyorum" dedi (17 Kasım'ın beş denetimi semt sohbetinin seçenekler menüsünü kaçırmıştı). Bu dosya dizindir; bulguların tamamı `denetim/grup-NN.md` dosyalarındadır ve 17 Kasım listesinin yerini alır.

## Yöntem

- 203 panonun tamamı (`ESLEME.md` sırasıyla 13'er panoluk 16 grup), her biri ayrı denetçiyle. Her panoda ekrandaki her öğe yukarıdan aşağıya numaralandı; boy, köşe, boşluk, yazı, renk (açık ve koyu), ikon, resim ve metnin kendisi css'ten çözülüp kodun token değeriyle karşılaştırıldı. Ters yön de yazıldı (kodda olup panoda olmayan: FAZLA).
- Dosyalarda yalnız fark satırları durur; uyan öğeler sayılır. Türler: ölçü, boşluk, renk, koyu, yazı, metin, ikon, resim, düzen, sıra, eksik, fazla, davranış, hareket, özellik yok, kural (değişmez kurala değen pano öğesi; karar proje sahibinin).
- Okunan kod: main `26c94e9` (#727 dahil). #728 (hata hâli resimleri, arşiv boş, Kibrit logosu, güncelleme ekranı) ve #729 (gelen istek ve kimlik dialogları, Mekandan ayrıl, nokta seçimi) bu okumadan sonra geldi: o panoların (66, 66a, 01h, 65, 125, 129, 25, 25b, 26, 123) satırları paketlerinde yeniden karşılaştırılır.
- Sınır: hükümler koddan; telefonda görülmedi. Resim içeriği (blob depoda yok), cihazın güvenli alanına bağlı konumlar ve hareketin görünüşü DOĞRULANAMADI kaldı; proje sahibinin telefonunda bakılır.
- Düzeltilen satır kendi grup dosyasından silinir. Her paket yine kendi panosunu baştan sona kodla karşılaştırır.

## Kapsam

| grup | panolar                                                                         | pano | dosya                |
| ---- | ------------------------------------------------------------------------------- | ---- | -------------------- |
| 00   | 01–02e: Mesajlar, Arşiv, uzun basma, DM                                         | 13   | `denetim/grup-00.md` |
| 01   | 03–03n: profil, Profilim, Profili düzenle, Süsle, Ayarlar                       | 13   | `denetim/grup-01.md` |
| 02   | 03o–07a: Hesap, yasal, Bildirimler, İstekler, Arkadaşlar, Aktiviteler           | 13   | `denetim/grup-02.md` |
| 03   | 08–15: Geçmiş, Keşfet, harita, Semte Git, Geçit, semt sohbeti                   | 13   | `denetim/grup-03.md` |
| 04   | 16–27: Odadakiler, mekan detayı, Mekan sekmesi, masa kartı, akış                | 13   | `denetim/grup-04.md` |
| 05   | 28–37: akış, mekan sohbeti, Masa kur, masa sohbeti                              | 13   | `denetim/grup-05.md` |
| 06   | 38–50: masa, oyun lobisi, kayıt                                                 | 13   | `denetim/grup-06.md` |
| 07   | 51–62a: kayıt, mesajdan profil, şikayet, hediye                                 | 13   | `denetim/grup-07.md` |
| 08   | 62b–72: hediye, bildirim ayarı, Masa bitti, güncelleme, hata, hareket, Süsle    | 13   | `denetim/grup-08.md` |
| 09   | 73–85: Süsle sekmeleri ve kayıt, Tüm aksesuarlar, Ortak kurallar                | 13   | `denetim/grup-09.md` |
| 10   | 86–98: yükleniyor, 320 dp, Odadakiler hâlleri, semt sohbeti dolu                | 13   | `denetim/grup-10.md` |
| 11   | 99–111: semt hâlleri, ortak arkadaş, Mesajlar hâlleri, boş hâller               | 13   | `denetim/grup-11.md` |
| 12   | 112–124: Keşfet hâlleri, arama, DM hâlleri, check-in                            | 13   | `denetim/grup-12.md` |
| 13   | 125–137: masa istekleri, lobi hâlleri, Bildirimler, kayıt hata hâlleri, oyun seç | 13   | `denetim/grup-13.md` |
| 14   | 138–150: oyunu oyla, Vampir, Signum, Kinshi, Krot, Sprengja, Kaupholl           | 13   | `denetim/grup-14.md` |
| 15   | 151–158: Kibrit, İbre, Harf Kapmaca, Şarkıda Geçsin                             | 8    | `denetim/grup-15.md` |

Toplam 203 pano; bitmeyen pano yok. Yaklaşık 1.700 fark satırı; büyük kısmı aşağıdaki ortak parçaların her panoda yinelenmesidir.

## Her yerde yinelenen ortak farklar (önce bunlar)

- Dialog: "Vazgeç" ve ikincil düğme panoda dolgusuz (ghost), kodda yumuşak dolgulu; örtü pano .30 + blur 6, kod .42; düğme ikonu 24 (kod 22); üst konum.
- Alt sayfa: tutamak 40×4 (kod 40×5), başlık 700 21/26 (kod 600 21/27), panoda kapat düğmesi yok (kodda var), örtü .20.
- Açılır menü: sohbet seçenekleri (semt 15, mekan 32) ve mesajdan profil ⋮ menüsü panoda düğmeden büyüyen menü, kodda alt sayfa; mesaj menüsü 220 geniş (kod 268), tepki yuvası 40 (kod 42).
- Uzun basılan satır panoda örtünün üstünde kalkık kart (köşe 22, gölge); kodda örtünün altında kararır.
- Düğme ve çip boyları: Keşfet ve lobi çipi 40 (kod 36), üst satır düğmesi 40, satır düğmeleri 32/34/40, Süsle süzgeç çipi 28, büyük düğme 56 (semt, hediye, "Kapsülüne tak"; kod 48), sohbet yazma alanı ve gönder 52 (kod 44). Karar proje sahibinde (çip 36 ve küçük düğme 36 kararı).
- İkonlar: yuvarlak düğme ikonları 24 (kod 22), çizimleri panodan farklı (zil, geri, düzenle, ara, çöp, kopyala, yanıtla, engelle, ⋮); kum saati ikonu yok.
- Yüz: halka dışarıda (dış çap 52, pano 48), zil noktası 9 (kod 13), kimlik anahtarı halkası ve solukluğu.
- Koyu tema: kart ve yüzey panoda düz `#121614` (kod `#151A18` ya da saydam), küçük düğme `#1B211F`, uyarı şeritleri, kenar .08, takım renkleri, harita renkleri.
- Üst bant: pano beyaz .32 + blur (kod tuval rengi .84; cam kapalı kararı).
- Yazı: sayfa başlığı ve ad ağırlıkları (pano 600 28/34, kod 800 31/39), kayıt ve semt başlığı satır yüksekliği, tipografik kesme işareti (’).
- Yükleniyor: işaret ekranın ortasında ve üst bar çizili; kodda üstte ve barsız yerler var.

## Paket sırası (görünüş; her biri bir dal, bir PR)

1. Ortak parçalar 2: dialog, alt sayfa, açılır menü, kalkık satır, ikonlar, yüz, koyu yüzeyler, yükleniyor.
2. Sohbet ailesi: semt, mekan ve masa sohbeti (menü, boş hâl kartı, öneri çipleri, yazma alanı, balon ve ad renkleri, duvar resimleri).
3. Mesajlar ve DM: kaydırılmış başlık, uzun basma, mesaj menüsü, tepki çubuğu, "Sohbet silindi" bildirimi.
4. Profil ailesi: başkasının profili, mesajdan profil, Profilim, Profili düzenle.
5. Süsle ve Tüm aksesuarlar: iskelet (kapsül 290, tepsi), ızgara, Kaydet hâlleri, çıkış onayı, nadirlik noktası.
6. İstekler, Bildirimler, Arkadaşlar, Aktiviteler, hediye kartı, Geçmiş.
7. Keşfet, arama hâli, harita kartı ve pinleri.
8. Mekan sekmesi, mekan detayı, masa kartı, lobi satırları, akış.
9. Kayıt ve semt (doğum tarihi tekerleği, onay satırları, Geçit ve semt sayfaları).
10. Ayarlar ailesi: Hesap, yasal metin, şikayet, bildirim ayarı metinleri.
11. Hediye paketleri (aç, yırt, sonuç, oranlar).
12. Masa ekranı, oyun seç ve oyla, oyun lobisi.
13. Kibrit, Kinshi, Krot, Sprengja düzeltmeleri.
14. Signum, Kaupholl, Vampir (üçü de panoya hiç geçirilmedi; güçlü model, ayrı paketler).
15. Hareket tablosu (71): basma ve seçim eğrisi, satır kalkması, kademeler.

Özelliği olmayan öğeler ve ÖNERİ panoları ayrı paketlerdir (`mimar` dökümü, 18 Kasım): İ1 (uzun basmada Profilini gör ve Engelle, ortak arkadaş listesi 103, semt öneri çipleri, emoji paneli), İ2 (kayıt ÖNERİ'leri, Mekan bilgileri, Yol tarifi), S1 DM sessize alma, S2 şikayet notu, S3 etkinlikte tür ve düzenleyen, S4 DM fotoğrafı, S5 sohbette ara, K2 Masa bitti'de "arkadaş oldunuz" (64a; "onaylandı" ister), S6 sesli mesaj (native). Denetimin eklediği adaylar: mekan detayında Paylaş, DM'de mesajı bildirme, Masa kur'da oyun etiketlerinin yeni altılısı (sunucuda `rooms_game_tag_check` eski altılıya izin veriyor), "Hata kaydını gönder", Profili düzenle'de "bizimle iletişime geç", Süsle'de uzun basınca büyük etiket.

## Proje sahibinin kararını bekleyenler

- Çip ve satır düğmesi boyları (yukarıda).
- Değişmez kurala değen pano öğeleri (kod bugün göstermiyor): lobi ve Keşfet satırında yüz yığını ve masa sayısı (kural 4, K-41); haritada konum noktası, "Konumuma git" ve uzaklık (kural 6); etkinlikte uzaklık (kural 6) ve "Kampanya" (K-15); İstekler'de "Ortak arkadaş" ve masa adı (kural 4); mekan sohbetinde kişi sayısı, "Mekandakiler" ve "yazıyor" (kural 4, 9; semt sohbetinde 18 Kasım'da kaldırıldı); akışta masa kartı ve kimlik anahtarı (kural 4, §4.Y); Odadakiler'de "Arkadaş ekle" ve anonim satırda kapsül (kural 4, 5); Masa bitti'de yaş ve anonim kapsül (kural 4); ortak arkadaş listesinde tarih ve "Mesaj gönder" (kural 4); sonuç ekranlarında herkese "Yeniden oyna" (kural 3); check-in kimlik adımında herkese anonim (kural 12); kayıt 55'te "masalara katılamazsın" metni (kural 4); Gizlilik'te "Engellenenler 3" sayacı.
- Panoda olmayıp kodda duranlar (silinsin mi): Kibrit'te sohbet düğmesi ve "Bildir", Sprengja'da "Kelime kuralları", masa kartında "Lobiye aç / Lobiden çek" ve boş koltuk, Bildirimler'de kapat düğmesi ve davette "Reddet", Aktiviteler'de şehir satırı, başkasının profilinde Rozetler (kalkması kararlaştırıldı), DM'de "Okunmamış mesajlar" çizgisi (pano "2 yeni mesaj"; 30 Ekim kararı).
- "Noktasız" check-in (sunucu nokta ister), "Sohbet kuralları" metni, hediyede "Atla" (8 Kasım: Atla yok), lobide hazır olma ve kişi menüleri, "Mesajı bildirimde göster", "Verilerimin kopyasını iste", "Yakında" üç oyun (İbre, Harf Kapmaca, Şarkıda Geçsin: ekranları ve sunucuları yok).
- Panonun kendi içinde çelişenler: Süsle'de sekme sayısı (panoda 5, karar 6 sekme: Ağız), hediye oranlarında Efsanevi çubuğu %3 yazısı %1, hediye kartının iki panoda iki ayrı çizimi.
