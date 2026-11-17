# Yeni arayüz tuvali: pano–kod denetimi (17 Kasım 2026)

Beş denetimin ham bulguları (pano kaynağı ile kodun karşılaştırması; telefonda doğrulanmadı, "emin değil" işaretliler dahil). Düzeltilen madde bu dosyadan silinir. Sekme çubuğu (#721) ve A'nın 2–11 maddeleri (ortak parçalar paketi) düzeltildi; A1 zemin, A12 bar bandı ve karar gerektirenler açık.

## B (mesajlar, sosyal)
AKTİVİTELER: 1 etkinlik kartı eski (EventCard.tsx; pano AktivitelerDolu .evc 148/r22 kapak resmi, sarı tür etiketi, düzenleyen) — veri yok (tür, düzenleyen), karar ister. 2 "Bugün · 3" liste başlığı yok. 3 Hediye kartı eski (GIFT_CARD 170 koyu; pano .gift 76 cam, 3 kanki, chevron). 4 başlık üstünde şehir eyebrow fazla. 5 geçmiş satırında sonuç etiketi fazla.
İSTEKLER: 6 reddet 40/Kabul 40 (kod 44/36). 7 satır arası çizgi yok. 8 Masa satırı yüzü: 52 r14 masa resmi + 26 harf rozeti (kod Avatar table/Av). 9 süre: kırmızı 700 + nokta. 10 davet satırı yalnız "Katıl" (kod Reddet+Katıl).
BİLDİRİMLER: 11 "Tümünü okundu say" başlık satırında sağda, her zaman. 12 davet satırı (Katıl tek, "Masa daveti · 1:42" yeşil). 13 Mesaj yaz yuvarlağı 40. 14 Bak: yeni primary sm, eski soft sm. 15 peek kanki 64×80 (kod 56×70).
ARKADAŞLAR: 16 arama üstünde peek kanki yok. 17 "Mesaj gönder" 32 yüksek min 112. 18 arama alanı düz beyaz. 19 Ortak arkadaşlar listesi ekranı (103) yok (bilerek).
MESAJLAR/DM: 20 uzun basma menüsü: Sessize al, Profilini gör, Engelle yok. 21 arşiv boş resmi yok. 22 DM "Sohbette ara" yok (özellik yok). 23 DM yazma alanı ikonları (emoji, dosya, kamera, ses) ve pasif gönder yok; 120/121 ÖNERİ alınmadı.
UYUYOR: Mesajlar, Arşiv dolu, DM sohbet, Geçmiş, Geçmiş masa, Arkadaşlar satırı, Bildirim iskeleti.
## A (ortak parçalar)
1 ZEMİN: panolarda renk bulutu yok (ekran.css .aura display:none; düz #EFF7F1); kod her ekranda AuraBackground (Screen.tsx:207, ChatScreen:1304, TableEnd:78, KibritGame:257, TableScene). Karar belgesi yok.
2 HATA/BAĞLANTI YOK (66/66a): 210×172 riso kanki, başlık 15/20 600, cümle 13/18, "Tekrar dene" soft 44; kod EmptyState.tsx:161-196 disk+ikon, 27 çağrı. Resim depoda yok.
3 BOŞ DURUM: 150×100 kesik resim çerçevesiz, 15/20 600, 13/18, ortada; kod 240×165 kartlı, üstten hizalı (EmptyState.tsx:80-85,226-272).
4 ÜST BAR düğmesi 44 (kod topBtn 46, auraKit.ts:864, motion/TopBar.tsx).
5 SEKME ALTI SOLMA: 150, %70'te tam opak; kod 160, en çok .92 (aura.ts:115,45-50,83-88).
6 AVATAR: halka 2px surface (koyuda #151A18), koyuda gölge yok, gövde düz renk c1..c5; kod beyaz halka, koyuda gölge, gradyan (kit.tsx:1409, auraKit.ts:652).
7 SettingsRow (Hesap vb.): min 56, 16/20 600, ikon metin renginde, ok 18; kod 64, ikon muted, ok 20 (features/settings/SettingsRow.tsx:36).
8 CANLI NOKTA: 8, pembe buzz, halka sabit, hareketsiz; kod yeşil + dalga (kit.tsx:965-1075). emin değil.
9 CheckMark/radyo: 24 r7, ink dolgu, tik 18; kod yeşil r8 tik 16 (Checkbox.tsx:20, Choice.tsx:141). emin değil.
10 Anahtar düğmesi koyuda surface, gölgesiz. küçük.
11 Odak halkası 4px (kod 3; iskelet 5.8 3 diyor).
12 Bar bandı beyaz .32+blur (kod canvas .84; cam kapalı).
KARAR GEREĞİ: Keşfet çipi 40 (kod 36); cam/blur.
UYUYOR: palet, yazı ölçeği, köşe, kenar 20, glass, düğme türleri, çip, tag, seg, mesaj satırı, dialog, menü, sheet, toast, örtü, Loader.
## D (keşfet, mekan, masa)
3 64a "arkadaş oldunuz" toast + "Mesaj at" yok (K-70 emin değil).
5 GELEN İSTEK (125,129) HİÇ: IncomingRequest.tsx eski kart; pano merkez dialog (MasaIstekGelen, MasaBuradayimGelen).
6 Kimlik onayları (25, 25b) alt sayfa; pano merkez dialog (IdentitySheet.tsx).
7 Mekandan ayrıl (26): danger düğme "Mekandan ayrıl" + metin farklı (venue.tsx:67).
8 Mekan menüsü "Mekan bilgileri" (ÖNERİ) yok.
9 KEŞFET kaydırılmış (10c): arama+harita düğmesi+çipler+kompakt Semte Git şeridi birlikte yapışır; kod yalnız arama (explore/index.tsx:355).
10 Keşfet arama hâli (116/117): Semte Git kartı ve kanki gizli, sayı yok.
11 HARİTA kartı bilet biçimi + "Yol tarifi"; kod düz kart (ExploreMap.tsx).
12 Harita pinleri fotoğraflı halka + ad hapı (GL sınırı, emin değil).
13 Harita üst boşluk 60 (kod 53).
14 Keşfet çipi 40 (karar 36).
16 Mekan detayı kapağı mekana özgü fotoğraf yok (aynı sahne); "Bu hafta" oku.
18 CHECK-IN nokta seçimi (123) ayrı alt sayfa, radyo satırları, Noktasız, Devam; kod konum sayfasının içinde eski .opt.
19 124 check-in kimlik seçimi (ÖNERİ) yok. 21 akışta masa paylaşımı kartı (ÖNERİ) yok.
20 Mekan sohbeti kartı başlığı (emin değil).
UYUYOR: Keşfet liste, 112, Mekan detayı, konum sayfaları, Mekan sekmesi, menü, akış, sohbet, Masa ekranı, lobiye aç.
## E (kayıt, semt)
KAYIT: 1 Doğum tarihi tekerleği (52) yok: birth.tsx:147 üç alan; yaş hapı (ÖNERİ). 2 Ad önizlemesi (ÖNERİ) yok. 3 Ad'da fazla gövde metni (name.tsx:42). 4 Foto: "Nerede görünür" (ÖNERİ) yok; "Fotoğraf ekle"de kamera ikonu yok (extras.tsx:71). 5 Onay "Kısaca" 3 satır (ÖNERİ) yok. 6 Onay satırları iki satırlı (başlık + "Okudum…") olmalı (ConsentBoxes.tsx:23,99). 7 Metinler güncellendi hapı (ÖNERİ). 8 18 yaş altı üst boşluk 112 (kod 76); "Tamam" (ÖNERİ). 9 Çok fazla deneme 4:58 geri sayım (kod 60 sn; sunucu?). 10 Telefon "TR +90" yanında ok.
SEMT: 11 Geçit yazıları: başlık 21/700 (kod 16/600), soru 22/29 700, şık 19/700, harf 17/800 (gate.tsx:79,188,303). 12 semt alt düğmeleri 56 (.btn.big) (kod 48; gate, open, ended, outside, locate). 13 semt h1 700 32/38 (kod display 500 32/42, parts.tsx:950). 14 bilet metinleri 800/700 (open.tsx:57-75).
SEMT SOHBETİ: 15 üç öneri çipi (14) yok. 16 üst pill altyazısı "6 kişi burada"/"yazıyor" yok (kural 4 ile çelişir, karar).
ODADAKİLER: 17 sheet tam yükseklik + hairline. 18 tek kişi metin boyu.
SEMT KARTI: 20 süre kalın değil (DistrictCard.tsx:68,175). 21 düğmede fazla ileri oku (DistrictCard.tsx:388).
UYUYOR: Açılış, Telefon, Kod, Cinsiyet, Geçit düzeni, semt resimleri, Odadakiler satırları.
## C (profil, ayarlar, kapsül)
BAŞKASININ PROFİLİ (people/[publicId].tsx): eylem satırı Mesaj + Arkadaşsınız iki 48 düğme yan yana (kod hap + tek düğme); ortak arkadaşlar tek glass satır → 103 listesi (kod kart liste, 103 rotası yok); rozet kartı panoda yok (karar); kapak 250, yüz 112, canvas kenar (kod 230/132 beyaz); ad 600 28/34 (kod 800 31/39, auraKit.ts:156); yükleniyor (87) kapaklı.
MESAJDAN PROFİL (SenderProfileScreen, ProfileCard.tsx:70): ortalı 112 yüz 250 kapak üstünde, tam genişlik istek düğmesi (kod sol yaslı 120 + peek kanki); alt "Geri" fazla; ⋮ menü çıpalı açılır 292 (kod Sheet+Vazgeç), "Sessize al" altyazılı; istek onayı: 64 harf yüzü, "Ece'ye istek gönderilsin mi?", Adın/Yaşın/Fotoğrafın çipleri.
PROFİLİM: alt bölge düz zemin (kod 34 köşeli panel, tutamak, ışık; index.tsx:244-290), aralık 28; kaydırılmış bar (03c; emin değil); kapak alt köşeleri 28.
PROFİLİ DÜZENLE (edit.tsx, profileEdit.ts:17): önizleme 150/22 + "Kapağı değiştir" etiketi, yüz 104, kamera 38 ink; alanlar ayrı (.fi min 52 r16, sayaç, ipucu), doğum tarihi salt okunur kilitli; bar soft geri + h1 19/24 + primary Kaydet.
SÜSLE: tepsi düz surface r28 (kod .72 r34; capsule.tsx:611); kapsül boyu 290/340 (kod 220; emin değil).
TÜM AKSESUARLAR: nadirlik noktası (9 elmas) yok (CatalogTile).
AYARLAR/HESAP (settings-account.tsx): eski düzen; pano SettingsPage ailesi (.sr.inf, kilit, kırmızı satırlar, foot wordmark). Ayarlar notu metni farklı (emin değil). ÖNERİ'ler alınmadı (03l, 03m).
YASAL METİN (LegalText.tsx): footer "Devam"+kanki fazla; meta satırı TASLAK hapı + Yürürlük; h2 700 18/24; gövde 400 15/23; bağlantı ink altı çizili.
ŞİKAYET ET (ReportModal.tsx): adlı başlık, radyo satırları, not alanı 0/280 (sunucu yok), kırmızı "Şikayeti gönder".
HEDİYE: GiftTopBar başlık sola yaslı 21/28 (parts.tsx:175).
GÜNCELLEME GEREKLİ: wordmark üstte, 260×212 resim (depoda yok), h1 24/30, "Güncelle" 56 dipte + sürüm.
UYUYOR: Ayarlar ana, Bildirim ayarları, Gizlilik, Engellenenler, Sessize alınanlar, Hesabı sil onayı, Engelle onayı, Profilim bilet, Süsle sekmeleri, Tüm aksesuarlar ızgara, Hediye ana ve Oranlar.
