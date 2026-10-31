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

Raporun açık sorularında (titreşim, lobideki ikinci bölüm başlığı, Profili düzenle'de Kaydet, geçmiş satırına dokunma, koyu tema / yükleniyor / hata hâlleri, galeri, Aktiviteler simgesi) uygulamanın bugünkü davranışı korunur.
