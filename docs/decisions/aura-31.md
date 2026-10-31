# Aura tuvali sürüm 31 eşitlemesi

31 Ekim 2026. Rapor: `docs/design/aura/aktarim-31.md` (16 pano, onaylayan proje sahibi). Ekran grubu başına bir PR.

Proje sahibinin kararları (31 Ekim):

- **Check-in'de rıza kutusu yok; rızayı düğme verir.** Ayrı konum rıza kutusu kalktı (raporun 1. sorusu). Yasal metinler konumun dayanağını açık rıza diye yazdığı için (güvenlik denetimi) "Konumumu kullan"ın üstündeki metin, düğmeye basmanın açık rıza olduğunu söyler; konum rızası sürümü `draft-1` (`_shared/pure/consent.ts`). Eski uygulama kutusunun sürümü `draft-0` de kabul edilir, her check-in gördüğü metnin sürümüyle kaydedilir. Pilottan önce hukuki kontrol.
- **Nokta seçimi noktalı mekanda kalır.** Tuvalde yok, ama masa daveti yalnızca masanın noktasında check-in'i olana gider (kural 4) ve lobi masaları noktaya göre gruplar. Noktası olmayan mekanda giriş sayfası tuvaldeki gibidir.
- **Keşfet her zaman liste; haftanın etkinlikleri mekan sayfasında.** Tek mekan kartı (K-37) kalktı. Tuvalde mekan sayfasının etkinlik listesi de yok; kalırsa haftanın etkinlikleri hiçbir ekranda görünmeyecekti. Liste "Buraya giriş yap"ın altında; Aktiviteler'in boş hâli oraya yönlendirir.

Raporun açık sorularında (titreşim, lobideki ikinci bölüm başlığı, Profili düzenle'de Kaydet, geçmiş satırına dokunma, koyu tema / yükleniyor / hata hâlleri, galeri, Aktiviteler simgesi) uygulamanın bugünkü davranışı korunur.
