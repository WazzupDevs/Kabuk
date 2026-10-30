---
name: pr-akisi
description: skall reposunda dal açma, push öncesi kontrol, PR açma, ci bekleme, birleştirme ve çakışma çözümü. Her PR'da kullan.
---

# PR akışı

1. Dal main'den açılır: `git fetch origin main && git switch -c <kısa-ad> origin/main`. Önceki paketin dalının üstüne dal açılmaz; bağımlı iş önce öncekinin birleşmesini bekler (squash birleştirme üst üste dallarda çakışma çıkarır).
2. Dal değiştirmeden önce commit ya da `git stash`.
3. Toplu düzenleme Edit aracıyla yapılır; betikle yapılırsa her değişikliğin uygulandığını denetleyen, uygulanmayınca duran betikle.
4. Push'tan hemen önce, son düzenlemeden sonra: `pnpm check` (typecheck, lint, format:check, test). `supabase/`'e dokunan PR'da `pnpm test:integration` CI'da koşar.
5. PR açıklaması kısadır (şablon `.github/pull_request_template.md`): ne değişti ve "Yayın" (OTA, yeni build ya da önce sunucu). Native değişiklikte `app.json` → `version` artar (`.claude/skills/yayin`).
6. Değişmez kurallara, `supabase/`'e, Realtime'a ya da gizliliğe dokunan PR birleşmeden önce `guvenlik` ajanından geçer; bulgular aynı PR'da düzeltilir.
7. Birleştirme: `ci` yeşilse squash, dal silinir (`gh pr merge <n> --squash --delete-branch`). Kimin onayı gerektiği: `CLAUDE.md` → Çalışma şekli → "Kim birleştirir". Birleşince proje sahibine tek satır.
8. Çakışma: iki dal da `pnpm seed` çalıştırdıysa `supabase/seeds/` altında iki dosya kalır; birleşmede `pnpm seed` yeniden çalıştırılır (`docs/OPS.md` → `pnpm seed`). Üretilen dosyalar (`*.generated.ts`, `database.ts`, `capsuleCatalog.ts`, `tableIcons.ts`) elle birleştirilmez, betiği yeniden çalıştırılır.
9. `integration` düşerse: hata hangi fonksiyonda ve action'da takıldığını söyler; functions.log ve duruş dökümü `functions-logs` artifact'ında (`docs/OPS.md` → `pnpm test:integration`).

- **main'i PR'a birleştirmek:** yeşil bir PR'a main yalnızca GitHub çakışma gösteriyorsa birleştirilir. Çakışma yoksa PR olduğu gibi birleştirilir: birleşmeden sonra main'deki `ci` ve gece E2E'si iki PR'ın birlikte bozduğu durumu yakalar. İstisna: PR'ın dalında olmayan bir workflow değişikliği (ör. yeni bir etiket) ya da main'de düzeltilmiş bir hata yüzünden koşu başlayamıyor ya da geçemiyorsa main çakışma olmasa da birleştirilir. Etiketi kaldırıp yeniden eklemek koşuyu güncel main'le kurmaz: birleşik commit yalnızca dala push gelince yenilenir.
- **Koşu beklemek:** koşu bekleyen oturum saat başı yoklamaz; koşunun beklenen süresine göre uyanır (`ci` yaklaşık 12 dk, E2E yaklaşık 20 dk, `e2e-large`'lı 25 dk). PR bildirimi alabiliyorsa onu kullanır. Kırmızıda önce `e2e-screenshots-pr-<n>` dalındaki `report.xml`'e, sonra düşen adımın ekran görüntüsüne (`screenshots/step-…png`) ve ekran ağacına (`screen-hierarchy/step-…json`) bakar; logun tamamını okumaz.
