---
name: tuval-aktarim
description: Aura tuvalinden bir tasarım (aktarım) raporu geldiğinde, raporu koda aktarırken izlenecek yordam. Rapor (`docs/design/aura/aktarim-*.md` ya da sohbette gelen rapor) her geldiğinde kullan.
---

# Tuval aktarımı

Proje sahibinin kararı (1 Kasım): tasarım raporu her geldiğinde bu yordam sırasıyla izlenir. Genel kurallar CLAUDE.md → "Kod kuralları" (görünüş, token'lar) ve "Çalışma şekli" → "Tuval aktarımı"dadır; bu skill onların uygulanış sırasıdır.

## Yordam

1. **Yalnızca raporu ve raporda adı geçen panoları oku.** Tuvalin tamamını (`docs/design/aura/project/` klasörü, canlı tuval) okuma. Pano dosyası büyükse Grep ile ilgili bölümü bul.
2. **Eşleme listesi çıkar (yalnızca kendin için).** Raporun her maddesini bir dosya ve bileşenle eşleştiren kısa bir liste yaz (ör. "Sheet iki bölge → `app/checkin/index.tsx` → `RouteSheet`"). Liste repoya ve PR'a girmez; adım 6'da denetim listesi olarak kullanılır.
3. **Yalnızca tema token'larını ve aura kitini kullan.** Renk, font, boşluk, köşe `apps/mobile/src/theme/` token'larından; gradyan `theme/gradient.ts` → `gradientStyle`; bileşenler `src/aura/` (kit `src/aura/kit.tsx`, `src/theme/auraKit.ts`). Raporda olmayan bir değer gerekiyorsa (ölçü, renk, süre, metin, davranış) **tahmin etme**: proje sahibine tek soru sor, öneriyle. Cevap gelene kadar o maddeyi bekletip diğerlerine devam edebilirsin.
4. **Raporda tanımlı her hâli uygula:** yükleniyor, boş, hata, koyu tema, dar ekran (320 dp, en büyük yazı). Raporun tanımladığı hâl atlanmaz; tanımlamadığı hâl CLAUDE.md → "Ekran davranışı"na göre yapılır.
5. **Hareketi `docs/design/aura/project/hareket.json`'dan ve raporun hareket tablosundan al.** Kodda `src/theme/aura.ts` → `MOTION` (`aura.test.ts` eşitliği denetler); yeni hareket önce `MOTION`'a girer. Süre ya da eğri uydurulmaz; ikisinde de yoksa adım 3'teki gibi sor.
6. **Bitince raporun her maddesini koda karşı tek tek denetle.** Adım 2'deki listeyi sırayla geç: madde koddaki yerinde, raporun değeriyle mi? Eksik varsa PR'dan önce tamamla. Sonra son düzenlemeden sonra `pnpm check`.
7. **PR açıklaması tek satır:** `Raporun N maddesi uygulandı.` Uygulanamayan madde varsa aynı satıra adı ve sebebi eklenir (ör. `Raporun 14 maddesi uygulandı; "Kankiler %90'da gizlenir" uygulanamadı: sheet yüksekliği native ölçülemiyor.`). PR akışının geri kalanı `.claude/skills/pr-akisi`.
