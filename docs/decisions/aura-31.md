# Aura tuvali sürüm 31 eşitlemesi

31 Ekim 2026. Rapor: `docs/design/aura/aktarim-31.md` (16 pano, onaylayan proje sahibi). Ekran grubu başına bir PR.

Proje sahibinin kararları (31 Ekim):

- **Check-in'de rıza kutusu yok; rızayı düğme verir.** Ayrı konum rıza kutusu kalktı (raporun 1. sorusu). Yasal metinler konumun dayanağını açık rıza diye yazdığı için (güvenlik denetimi) "Konumumu kullan"ın üstündeki metin, düğmeye basmanın açık rıza olduğunu söyler; konum rızası sürümü `draft-1` (`_shared/pure/consent.ts`). Eski uygulama kutusunun sürümü `draft-0` de kabul edilir, her check-in gördüğü metnin sürümüyle kaydedilir. Pilottan önce hukuki kontrol.
- **Nokta seçimi noktalı mekanda kalır.** Tuvalde yok, ama masa daveti yalnızca masanın noktasında check-in'i olana gider (kural 4) ve lobi masaları noktaya göre gruplar. Noktası olmayan mekanda giriş sayfası tuvaldeki gibidir.
- **Keşfet her zaman liste; haftanın etkinlikleri mekan sayfasında.** Tek mekan kartı (K-37) kalktı. Tuvalde mekan sayfasının etkinlik listesi de yok; kalırsa haftanın etkinlikleri hiçbir ekranda görünmeyecekti. Liste "Buraya giriş yap"ın altında; Aktiviteler'in boş hâli oraya yönlendirir.

(b) Mekan ve lobi, Masa kur, Masa (oturumun kararları, 31 Ekim; değişmez kurala dokunan yok):

- **Masa kur'da niyet ve oyun çipleri "Lobide görünsün" açıkken kalır.** Tuval anahtarı kapalı çizdi; uygulamada da kapalıyken çip yoktur. Kalkarsa kurarken lobiye açılan masa etiketsiz giderdi ve etiket için lobiden çekip yeniden açmak gerekirdi; SPEC_V4 §4.E `rooms/create { open?, intent?, gameTag? }` aynen. Kural 4'ün "varsa niyet ve oyun etiketi"ne dokunmaz.
- **Masa'da "Lobiye aç" / "Lobiden çek" çubuktan masa kartına iner.** Tuvalin çubuğunda geri, masa sohbeti, Davet et, Masadakiler ve Bitir var; sahibin lobi düğmesi yok. Beşi ve lobi düğmesi 360 dp'lik telefona sığmıyordu. Düğme kartta kişi sayısı · lobi durumu satırının altındadır; 360 dp'den dar telefonda çubuğun düğmeleri 48 yerine 44'tür.
- **Masa kartı birden çok kişide de yüzleri gösterir.** Tuval yalnızca tek kişilik masayı çizdi ("Sen"); tek satıra sığan masada yüzler 58, iki satırda 44, üç satırda 32 (29 Ekim kararı aynen). Yüzlere basmak Masadakiler'i açar.
- **Lobideki ikinci bölüm "Süren masalar" kalır** (raporun 4. sorusu), oyun kartları altısı da kalır (tuval dördünü çizdi), noktalı mekanda nokta etiketi Mekan'ın başında kalır (nokta seçimi kararı).
- Ortak boş hâl simgesi (Açık masa yok) (e) grubunda gelir.

(c) Mesajlar, istekler boş, DM (31 Ekim; değişmez kurala dokunan yok):

- **Mesajlar'daki istek sahnesi kalktı;** bekleyen isteklerin sayısı İstekler sekmesinin rozetinde. Zil yerinde (K-6).
- **Sohbetler / İstekler diski 300 ms'de kayar:** hareket.json swap eğrisine süre vermiyor.
- **DM'nin üstü tuvaldeki gibi:** 48'lik geri ve seçenekler, 56'lık ad hapı (44'lük yüz). 30 Ekim'in ince hapının yerine.
- **DM'nin açık duvarı mavi-lila geçiş ve kapsüller;** koyu duvar bugünkü (tuval koyuyu çizmedi).
- **Yazma alanı 58, gönder 62** bütün sohbetlerde: tek bileşen, sohbetler aynı görünür.
- **Okundu işareti** tuvalin çift tiki, açıkta #4A5CE6; koyuda bugünkü mavi.

(d) Profil, Profili düzenle, Profil fotoğrafı, Kapsülün (31 Ekim; değişmez kurala dokunan yok):

- **Rozetler Profil'de yok (değişiklik değil).** Uygulama rozetleri 27 Ekim'den beri hiçbir profil ekranında göstermiyor (proje sahibinin kararı); tuval de çizmiyor. Kural 4 profilin (rozetler dahil) kime gidebileceğini sınırlar, gösterilmesini istemez; sunucu `badges`'i aynen taşır, veri değişmedi.
- **Profil:** 36'lık başlık ve 52'lik ayarlar, 210'luk kartlarda 112'lik yüzler ve 15'lik yazılar, 34'lük ad, 17'lik tanıtım, 50'lik iki düğme; liste satırları 14 / 18 içten, 18'lik başlık, 14'lük not ("27 gün sonra yenileyebilirsin." ve pasif Yenile bugünkü gibi). Başkasının profil kartı da 210 ve 34'lük adla (aynı kart).
- **Profil fotoğrafı:** koyu perde (#14112B, %86) üstünde kenardan 22, 30 köşeli beyaz kart; fotoğraf zeminden 300 ms sonra pop'la gelir (`MOTION.cardOpen`, hareket.json `cardOpen.contentAfterMs`). Kapatma bugünkü gibi: dokunuş ya da geri tuşu.
- **Profili düzenle:** 48'lik geri, 36'lık başlık, fotoğraf kartı (112'lik yüz, 36'lık beyaz kamera rozeti, "Fotoğrafı değiştir"), 56'lık alanlar (tanıtım 108) ve 14'lük notlar, doğum tarihi notu küçük camda. Kaydet bugünkü yerinde, sayfanın altında (raporun 5. sorusu).
- **Kapsülün:** 48'lik düğmeler, 19'luk başlık, 152'lik kapsül (zemini kapsülün kendi renginden, bugünkü gibi), 40'lık yuva çipleri; boş parça karosu 104 ve seçiliyken mor halka; paket kartı 16 içten, 19'luk ad, 44'lük "Paketi tak"; paketin parçaları 70 yüksek karolarda adsız (ad ekran okuyucuda), satırda üç; altta 50'lik "Hepsini çıkar" ve "Kaydet". Takılı parçaların çıkarma etiketleri, paket renkleri ve kaydırınca katlanma bugünkü gibi.

(e) Aktiviteler ve ortak boş hâl (31 Ekim; değişmez kurala dokunan yok):

- **Ortak boş hâl tek bileşende** (`EmptyState kind="empty"` → `src/aura/EmptyMark.tsx`): dolu mor kapsül, arkasında kesikli pembe kapsül çizgisi (28 × 42), 19'luk başlık ve 15/21'lik not; lobide 18 ve 14/20. Bütün boş ekranlar (lobi, İstekler, Aktiviteler, Mesajlar, bildirimler, arkadaşlar, engellenenler…) aynı görünür. İşaret durgun: tuval ve hareket.json boş hâle hareket vermiyor (önceki canlı işaret yükleniyor ve hata hâllerinde kalır).
- **Aktiviteler:** 36'lık başlık, 48'lik kayan diskli Etkinlikler / Geçmiş, 15'lik yer ve gün satırları; geçmiş satırı 54'lük resim, 18'lik oyun adı, 14'lük "… ile", sağda 15'lik zaman. **Sonuç etiketi kalır** (tuval çizmedi; SPEC_V4 "Aktiviteler → Geçmiş" sonuç metinlerini istiyor), zamanın altında. Etkinlik kartları bugünkü gibi; satıra dokunma bugünkü gibi kişileri açar (raporun 6. sorusu), sekme simgesi bugünkü (9. soru).

Sürüm 35, Grup 1 · Mekan ve lobi (31 Ekim; rapor `docs/design/aura/aktarim-35-mekan.md`, değişmez kurala dokunan yok):

- **Mekan sohbeti kartı:** yükleniyor (300 ms sonra iki durgun yer tutucu satır, en az 600 ms), hata ("Tekrar dene" yalnızca kartı yeniden okur, karta basmak sohbeti açar) ve boş hâli ayrı. Rozet ile "şu an aktif" iki ayrı gösterge; dar ekranda "şu an aktif" alt satıra iner.
- **Rozet yalnızca gerçek okunmamışta:** veri taşımayan `venue_chat` yayını artık 1 sayılmaz; kart sayfayı yeniden okur (yalnızca Mekan öndeyken, yakın yayınlar tek okuma; arkadayken duyulan yayın Mekan'a dönünce okunur). Kişinin kendi mesajı ve yeniden abonelik rozet ve aktiflik üretmiyor, boş sohbet aktif görünmüyor. `venueChatLastAt` kalktı.
- **Önizleme (proje sahibinin kararı):** Android'de satır kaydırması kapalı yatay ScrollView'da, `fadingEdgeLength` (son 44) ile sistemin kenar solması; native yama yok, build gerekmez, "…" yok. iOS'ta "…". RN'nin yatay ScrollView'ı solmanın gücünü kaydırmadan bağımsız sabit verir: solma her satırın sağ 44'ünde çizilir; kısa satırda orası boş olduğu için görünmez, kartın sonuna 44'ten az kalan sığan satırın son harfleri hafifçe solar.
- **Lobi:** yükleniyor ve hatada iki bölümde de sayı yok, "Süren masalar" altında açıklama, işaret ve satır yok; süren masa yokken açıklama yok. 360 dp'den dar (yazı boyutuna bölünmüş genişlik; 320 dp ya da 1,3 kat yazı) satırın eylemi yazıların altına iner. Satırlar 60 ms arayla dissolve'la gelir.
- **Sekme ekranlarının altı:** son satır sekme çubuğunun 26 üstünde biter (aura.css `.scroll-pad`), gezinme alanı ayrıca.

Raporun açık sorularında (titreşim, lobideki ikinci bölüm başlığı, Profili düzenle'de Kaydet, geçmiş satırına dokunma, koyu tema / yükleniyor / hata hâlleri, galeri, Aktiviteler simgesi) uygulamanın bugünkü davranışı korunur.
