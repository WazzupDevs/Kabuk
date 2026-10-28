# Yeni görünüm: renk bulutları, buzlu cam, kapsül kankiler ve hareket (28 Ekim)

## Karar
Proje sahibi, referans videodaki akıcı ve havadar görünümü uygulamanın çalışma ilkesini bozmadan
istedi. Ön izleme tuvali (Claude Design, https://claude.ai/artifact/Fcdza7SJs4i7xyYQJnhRVe) üç
turda düzeltildi: kapsül kankiler her ekrana yerleşti, düğme ikonları uygulamanın dilinde
kapsüllerden çizildi, Mekan ekranının üstüne skall logosu geldi, profildeki kapsül yuvarlak
çerçeveye alındı, sekme çubuğunun ikonları iki şekilli dille yenilendi. Hareket önce panolarda
denendi, panolar tuvalde bozuk oynadığı için kare kare çizilmiş bir filme çevrildi. Proje sahibi
28 Ekim'de "her şey iyi görünüyor, uygulamaya aktar" dedi.

## Kaynak
- Görünüş: `docs/design/aura/project/` (tuvalin panoları, `aura.css`, `canvas.json`). Panolardaki
  görseller `/_blob/<id>` adresindedir; hangi dosya olduğu `docs/design/aura/blobs.json`'da.
- Hareket: `docs/design/aura/project/hareket.json` ve `docs/design/aura/skall-hareket.mp4`
  (film, 60 kare/sn). Filmi çizen kod `docs/design/aura/film/` (`reel.js`: her kare zamanın saf
  fonksiyonu; yaylar Reanimated'ın modeli).
- Kod: değerler `apps/mobile/src/theme/aura.ts` (`AURA`, `MOTION`; `aura.test.ts` hareket.json ile
  eşitliği denetler), bileşenler `apps/mobile/src/aura/`.

## Aktarım sırası
1. Temel: renk bulutlu zemin (her ekran, yalnızca açık ekranda kayar), buzlu cam kartlar, yeni
   sekme çubuğu (iki şekilli ikonlar, uzayıp toparlanan beyaz disk, ikonun zıplaması), sekme
   açılınca ekranın bulanıklıktan gelişi, ekran parçalarının sıralı gelişi.
2. Mekan: logo, masa kartının kapsül kankili sahnesi, lobi satırları, Katıl'ın bekleme ve kabul
   hâli.
3. Masa: satırdan büyüyerek açılış, oturanların tek tek gelişi, buzlu camdan netleşen oyun kartları,
   yeni gelenin koltuğa zıplaması.
4. Mesajlar, DM, mekan sohbeti, bildirimler.
5. Profil ve kapsül.
6. Keşfet, mekan sayfası, check-in.
7. Açılış ve kayıt.

## Maliyet
- Bulanıklık Android 12 ve üstünde sistem çizer; altında geçiş sade solmadır.
- Bulanıklık her görünümde ayrı bir katman ister: yalnızca ekranın tamamında ve ilk iki parçada
  kullanılır, listelerin satırları bulanıklıksız yükselir.
- Bulutlar bulanıklık değil radyal geçişle çizilir; yalnızca açık sekmede kayar, "hareketi azalt"
  açıkken durur.
