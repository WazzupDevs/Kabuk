# Panoların çizmediği davranışlar

16 Kasım 2026. Yeni arayüz tuvalinin (`docs/decisions/yeni-tuval.md`) 114 panosunun başlıklarına ve kaynağı okunan 17 panoya dayanır; geri kalanlar ilgili pakette pano okunarak doğrulanır. Belgelerde panolar dosya adıyla anılır (numaralar çakışıyor, bkz. C).

## A. Hareket tarifi yok

Panolar statiktir; aşağıdakiler tasarımdan istendi (16 Kasım), tahmin edilmez:

- Uzun basma menüsü
- Merkez dialog
- Satır yer değiştirme
- DM düzenleme
- Süsle ve katalog geçişleri
- Odadakiler geçişi
- Hediye yırtma

## B. Kapsül pilotu

- Süsle yalnız "Baş" sekmesiyle çizili; Renk, Göz, Yüz, Gövde sekmeleri yok.
- Katalogdaki "Ağız" ve "Takımlar" Süsle sekmelerinde yok.
- Kaydet'in bekleme, hata ve değişiklik yok hâli yok.
- Tüm aksesuarlar: seçili parça, arama açık, sonuçsuz ve takım seçimi hâlleri yok.
- Kapsül biletinin hareketli hâli yok.

## C. Ortak

- Onaylar: kimi panoda merkez dialog (01e Sohbeti sil), `docs/design/iskelet.md` 3.5 ise geri alınamaz işlemde alt onay sayfası diyor; tek kural gerek.
- Örtü bulanıklığı uzun basma menüsünde var (panoda 6 px; uygulamada canlı cam kapalı, sabit kopya, `SCRIM_GLASS`), profil ⋮ menüsünde yok.
- Yükleniyor hâli hiçbir panoda yok.
- Hata ve bağlantı yok hâli yalnız Aktiviteler örneğinde (25, 25a).
- 320 dp ve en büyük yazı panosu yok.
- Pano numaraları çakışıyor (05a, 19, 21, 22, 25, 33–35); belgelerde pano dosya adıyla anılır.

## D. Kararların eksik ekranları

- Odadakiler: profilli hâl, uzun liste, satır menüsü, tek kişi.
- Semt sohbetinin dolu, süre bitti, kapalı ve dışarıda hâlleri.
- Ortak arkadaş listesi ekranı.
- 15 dakika sonrası DM menüsü.
- 5 sabit dolunca.
- Arşiv rozeti.

## E. Hiç çizilmemiş (bugünkü hâliyle kalır)

- On oyunun oyun içi ve sonuç ekranları.
- Katılma isteği gelen ve bekleyen; "Bu masadayım"; davet alan; "Masadan çıkarıldın".
- Check-in kimlik ve nokta seçimi.
- Mesajlar, Bildirimler, Arkadaşlar, Keşfet ve DM boş hâlleri.
- Arama açık hâlleri.
- DM'de klavye, yanıt, fotoğraf, tepki çubuğu.
- Kayıtta hatalı kod, yeniden gönder, 18 yaş altı.

## F. Panoda olup sunucu sözleşmesi olmayanlar

- Odadakiler.
- Ortak arkadaş.
- DM sabitle, arşivle, sohbeti sil, düzenle.
- DM sohbetini sessize alma (bugün yalnız mekan ve semt sohbetinde, `venue_chat_mutes`): karar verilmedi, sorulacak.
- Mesajlar menüsünden "Profilini gör" (arkadaşlar arası, uygulanabilir).

"ÖNERİ" etiketli öğeler: Profilini gör, Sohbeti sil, Düzenle, mekan sohbetinden açılan profildeki ortak arkadaş kartı ve "Mekan sohbetinden · <üniversite>" satırı (yerleşke söylenmemeli, kural 4; `guvenlik` denetimi).

- Kayıt: panodaki "Onayla ve devam et" düğmesi ve "okuyup onaylaman" notu alınmadı; KVKK aydınlatma metni okunur, onaylanmaz (yasal neden): düğme "Devam et", not "İkisini de okuman gerekir."

- Masa (panolar `Masa`, `MasaSecenek`, `Masadakiler`, `MasaAt`, `MasaDavet`, 17 Kasım): ⋮ menüsündeki kişi sayısı ("12 kişi") ve "Sohbet kuralları" alınmadı (davranışı tanımsız); oyun kartındaki oynat rozeti alınmadı, kartın köşe etiketi (oy, "Aç", "Yakında", kişi sınırı) kalır; kartın 40'lık düğmeleri kitin küçük düğmesiyle (36); panonun "At / Masadan at" metni yerine K-88'in "Masadan çıkar"ı (satırda "Çıkar"; mekan kartının düğmeleri de 36); çıkarma onayı açılınca Masadakiler kapanır (tek açık kural, pano ikisini üst üste çiziyor); Masadakiler 320 dp ve en büyük yazıda tek sütun.
- Oyun lobisi ve oyun seçimi (panolar `OyunLobi`, `OyunLobiHazir`, `OyunLobiKatilimci`, `OyunLobiKatilimciHazir`, `OyunLobiKisiMenu`, `OyunLobiGozlemci`, `DarOyunLobi`, `TakimLobi`, `TakimLobiKisiMenu`, `MasaOyunSec`, `MasaOyunOyla`; 17 Kasım): alınmadı: lobide "hazır" yok (sunucuda lobi hazırlığı yok): "10/12 hazır" halkası, kişideki onay işareti ve "Bekleniyor", katılımcının "Hazırım" ve "Hazır değilim" düğmesi (`OyunLobiKatilimci`, `OyunLobiKatilimciHazir`, `OyunLobiHazir`'ın "Herkes hazır." notu) ve sahibin "2 kişi bekleniyor" notu; bugünkü not ("Herkes hazırsa oyunu başlat.", "Oyunu masa sahibi başlatır.") ve uyarı kalır. Kişi ⋮ menüsü (`OyunLobiKisiMenu`, `TakimLobiKisiMenu`: "Gözlemciye al", "Mor/Pembe takıma al", "Masadan at") alınmadı: lobide bugün kişi eylemi yok, sahip başkasını takıma ya da gözlemciye alamaz (yalnız kendi seçimi, `rooms/pick`); masadan çıkarma Masadakiler'de kalır. "Nasıl oynanır" satırının oku alınmadı (açtığı sayfa yok): satır kuralın metnini altında taşır. "Oyunu başlat"ın oynat ikonu alınmadı (ikon setinde yok). Gözlemcilerin altındaki "İzliyor" ve satırdaki kişi sayısı alınmadı (bölüm adı ve liste aynı şeyi söyler). Takım renkleri oyunların bugünkü renkleri (pembe #E8336F), panonunki değil. Oyun kartında köşe etiketi panonun beyaz oynat rozeti değil, kitin etiketi (17 Kasım kararı); oylar sağ altta ayrı etikette, kendi oyun kartı halkalı. "Yakında" kartı bugünkü hâliyle.
- Hediye paketi yırtma (pano `HediyeYirt`): pano "Atla" düğmesi çiziyor, 8 Kasım kararı "Atla yok"; uygulanmadı, proje sahibinin kararı bekleniyor.
- Odadakiler (panolar `Odadakiler`, `OdaProfilli`, `OdaUzun`, `OdaTek`, `DarOdadakiler`; 17 Kasım): satır ⋮ menüsü (`OdaMenu`), panonun "Arkadaş ekle" düğmesi ve anonim satırdaki "Sessize aldın" alınmadı; profilli satır basılınca o kişinin profilini açar (17 Kasım gece; sayfa kapanır, profil ekranı açılır; istek ve şikayet orada yok), anonim satır ve "Sen" basılamaz; anonim satırda sessize alma yok çünkü satırı nick'e ve hesaba bağlardı (`docs/SPEC_V4.md` §4.V). Girişin yeri Seçenekler sayfasının ilk satırı (panoda açılır menünün ilk satırı); "Seçeneklere dön" okunun yerine sayfanın kendi kapatma düğmesi var, kapanınca Seçenekler yeniden açılmaz. Odadakiler sayfası açılış başına yeniden okunur, yayın dinlemez (sunucu yayınlamaz). Tek kişide altyazı "sadece sen buradasın" (pano). Tek kişi hâlinin dürbünlü kanki resmi depoda yok, yerine kitin boş durum işareti; anonim satırlarda panonun değişen kapsülleri yerine herkese aynı işaret (kapsül satırı kimliğe bağlardı); "Sen" anonimse kendi kapsülün. "Az önce geldi" ilk iki dakika (zaman dakikaya yuvarlanır).
- Semt ekranları (panolar `GecitSoru`, `GecitAcik`, `SemtKapandi`, `SemtDisarida`, `SemtKonum`, 17 Kasım): Geçit sorusundaki "Geçit nasıl çalışır" (i) düğmesi alınmadı (açtığı şey çizilmemiş); Geçit açıldı'daki hareket (kanat, ışık, kankiler) panoda yok, resim durağan; ışık ve kanat katmanları kullanılmıyor. Yanlış cevap sonrası `closed.tsx` (kapalı Geçit, geri sayım) bu pakette değişmedi (panosu yok). Semt sohbetindeki "süre bitti" sorusu (`SemtSureBitti`, 99; 17 Kasım gece) alt sayfadan merkez dialoga geçti: saat ikonu, başlık, cümle, kalan süre yumuşak hapta, "Evet, 2 saat daha" ve "Hayır, çık"; "Vazgeç" düğmesi yok, dışarı dokunmak ve geri tuşu cevap sayılmaz (ek süre işler, çip "Devam?" ile yeniden açar). Alt sayfadaki ilerleme çubuğu panoda yok, kalktı; hata dialogun üstündeki bildirimde. Bilet ve seçenek kenarındaki çentikler zemin renginde çizilir (renk bulutlarının üstünde hafif ton farkı olabilir).
- Kinshi (panolar `KinshiAnlatici` 143, `KinshiSonuc` 144; 17 Kasım): yalnız anlatıcının turu ve oyun sonu yeni görünüşte; tur hazırlığı, 3-2-1, tahminci, rakip, gözlemci ve tur arası bugünkü hâliyle. Saat ikonu panonun kum saati değil, ikon setindeki saat (kum saati yok). Panoda sohbet düğmesi anlatıcı turunda çizilmemiş: yeri korundu (süreden sonra); dar ekranda ve en büyük yazıda başlıktaki logo kalkar. Doğru düğmesi panodaki gibi birincil (eskiden yeşil `signal`); Sayaçlar simgesiz düz etiket (Doğru 2, Pas 1, Yasak 0). Panonun logosu (`/_blob/8e86f32f290f9e85f5738fbe7a0ee61a`) ve sonuç satırlarındaki fotoğraflar (`/_blob/5b08ad2794fd1d89773aad25ff20b4e6`, `/_blob/7666823f3088ce0c372fbbfce4611447`) örnek veri; logo yerinde oyunun afişi. Sonuç ekranındaki konfeti ve kanki sahnesi panoda yok, kalktı.
- Krot (panolar `KrotIpucu`, `KrotSonuc`, 17 Kasım): yalnız ipucu turu ve oyun sonu geçti; rol gösterimi, oylama, sonuç ve Son şans aşamaları bugünkü hâliyle. Alınmadı: ipucu satırlarındaki "Söyledi: dalga" (söylenen kelime sunucuda tutulmaz, yalnız "Söyledi"); sonuçtaki "tahmin: Liman" (tahmin saklanmaz, §4.F); "Masa kazandı"nın altındaki tek sahtekar satırı sahtekar oyundan çıktıysa gelmez. Süre panonun saat kapsülü (ikon setinde kum saati yok: saat ikonu); "Rolüm" bugünkü gibi basılı tutulur, panonun kartı artık altta ve basılı tutulunca liste yerine rol kartı çıkar (panoda çizilmemiş). Yeniden oyna yalnız masa sahibinde (panoda herkeste). Resim: kanki ve sahne resimleri bu iki panoda yok; oyun resmi blob `6db0caee1c4f22b6d53177f77be1ffb7` depodaki `poster.webp`; satır yüzleri blob olarak çizili, uygulamada kişinin gerçek yüzü.
- Kibrit (panolar `KibritOy`, `KibritSonuc`, 17 Kasım): yalnız gizli oy ve oyun sonu yeni görünüşte; yazma, kavanoz, çekme, çekilen kâğıt, "Oy verildi" ve tur sonucu bugünkü hâliyle. Oyun logosu yerine Kibrit afişi (`b-poster`; panonun blob `93260fe0f4b5591f07b97a839cf3679e`'si depoda yok); zamanlayıcıdaki kum saati ikon setinde yok, yerine saat ikonu; gizli oyda panonun çizmediği sohbet düğmesi kaldı (başta, zamanlayıcının yanında; dar ekranda ya da büyük yazıda zamanlayıcı başın altına iner); oy kutucuklarında panonun fotoğrafları yerine kişinin yüzü (profilliyse fotoğraf, anonimse kapsül); oyun sonunda panonun satır başı çizgisi 56'dan başlar.
- Ortak parçalar (17 Kasım gece, pano–kod denetimi `pano-kod-denetimi.md`): canlı noktada panolar durağan, uygulamadaki nabız (iki halka yayılır) korunuyor, karar proje sahibinde. Hata ve bağlantı yok hâlinin riso resimleri (kırık fincan, fişi çıkmış kanki) depoda yok; o zamana kadar işaret çiziliyor. Mekan sohbeti üst barındaki canlı nokta panoda yok, duruyor.
- Sprengja (panolar `SprengjaBomba`, `SprengjaSonuc`, 17 Kasım): sonuç sahnesi (masa resmi, konfeti, kazanan yüzleri ve damgası) pano çizmediği için kalktı; Bomba sende'de halka, yay ve harf paneli yerine panonun kartı ve atış sırası şeridi var, "Kelime kuralları" düğmesi şeridin altında kaldı; "Süre gizli" düz etiket olarak alındı (K-85'e aykırı değil), dar ekranda başın altına iner.
- Masa kur ve Masa bitti (32a, 32b, 32c, 64, 132; 17 Kasım gece): Rastgele başka bir boş görsel seçer, ÖNERİ elle seçilene kadar görünür; Masa görseli sayfa içinde açılır, geri tuşu Masa kur'a döner; yaş, süre ve anonim kapsül çizilmedi (veri yok); anonim kişi eklenebilir kaldı ("eklenemez" alınmadı); satır düğmeleri ve çipler 36 (pano 40); "Bu görseli seç" (ek yok); oyun çiplerinde resim yalnız afişi olan oyunlarda; 64a alınmadı (K-70 kararı bekliyor).
- Gelen istek, kimlik onayı, Mekandan ayrıl, nokta seçimi (125, 129, 25, 25b, 26, 123; 18 Kasım): istek dialogu dışarı dokunma ya da geri tuşuyla gizlenir, yanıt gönderilmez; istek bekledikçe masa ekranında basılabilir "{ad} · 42 sn" satırı kalır ve dialogu yeniden açar. Panodaki masa simgesi (istek verisinde yok, harf diski çizildi), "Noktasız" satırı (sunucu noktası olan mekanda nokta ister, karar proje sahibinde) ve "ÖNERİ" rozeti (veri yok) çizilmedi. "Reddet" ve "Vazgeç" ortak dialogun düğme biçiminde kaldı; kimlik dialogunda uyarı şeridi ikonsuz, yüzler 58.
- Sohbet ailesi (14, 15, 98, 31, 32, 37; 18 Kasım): seçenekler ⋮ düğmesinden açılan menüdür; "Sessize aldıkların" Sessize alınanlar sayfasını açar, kimse yoksa soluk ve "Kimse yok" yazar; "Sohbet kuralları" altı maddelik ayrı sayfadır (metni proje sahibine gösterildi). Öneri çipleri (SemtSohbet, MasaSohbet `.sug`) yalnız boş hâlde görünür, basınca metni aynı yoldan ve aynı filtreden mesaj olarak gönderir. Grup sohbetlerinde gönder düğmesi hep görünür, alan boşken soluk. Panodan bilerek ayrılanlar: kişi sayısı altyazıları, "yazıyor", menüde "1 kişi" ve "Mekandakiler" (proje sahibi, 18 Kasım; kural 4 ve 9), emoji düğmesi (emoji paneliyle gelecek), masa sohbetinin ⋮ düğmesi (açacağı satır yok), "Okunmamış mesajlar" çizgisi (30 Ekim). Mekan sohbetinin boş hâlinin panosu yok, eski kart durur.
