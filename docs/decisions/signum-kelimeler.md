# Signum kelime havuzu (5 Kasım 2026)

Proje sahibinin kararı: Signum'un kelimeleri `content/signum-words.json`'dadır. Kinshi (`tabu-cards.json`) ve Krot (`sahtekar-words.json`) yalnızca başlangıç kaynağıdır, doğrudan kopyalanmaz.

- **Kaynak:** 1073 kayıt (547 Kinshi, 526 Krot).
- **Elenenler:** 206 tekrar, 127 çok kelimeli ya da harf dışı işaretli, 6 tanesi 3 harften kısa, küfür filtresinden (`profanity.ts`) 0, 37 px'ten geniş 443. Geriye 291 kelime kaldı.
- **Benzerler:** türemiş olduğu için kısası kalanlar Dişçi (Diş), Uzaylı (Uzay), Fırıncı (Fırın). Yalnızca aynı harflerle başlayan 19 çift havuzda kaldı (Golf/Gol, Balık/Bal, Kartal/Kar…); sunucunun pano kuralı (`alikeWords`) zaten ikisini aynı panoya koymaz.
- **Elle çıkarılanlar:** özel ad ve kısaltma (İzmir, Paris, AVM), yabancı yazım (Latte, Selfie, Emoji, Pizza), din (Cami, Kilise). İftar, Sahur, Aşure, Fal ve Eşek kaldı.
- **Sonuç:** 279 kelime. Bu havuzdan 25 geçerli kelimelik pano her denemede çıkar (`scripts/seed/signum.test.ts`).
- **Genişlik:** Plus Jakarta Sans 800, 12 px, harf aralığı %2 (harf başına 0,24 px). Tablo fontun `hmtx` ve GPOS `kern` tablolarından `pnpm seed` ile üretilir (`scripts/seed/signumWidths.generated.ts`). Üretildiği gün Chromium'un ölçümüyle en çok 0,02 px farklıydı. Kelimeler yazıldıkları gibi ölçüldü; karo büyük harf gösterirse yeniden ölçülür.
- **Açık:** 37 px sınırı (39 px yazı alanı, 2 px pay) ve karodaki yazım proje sahibinin Android cihazında doğrulanana kadar geçicidir. Oyun o zamana kadar "Yakında" kalır. 500 kelimeye genişletme ayrı bir iştir.
