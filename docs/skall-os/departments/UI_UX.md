# UI/UX Studio: departman notları

Ajan `ui-ux-studio`. Yordamlar: `.claude/skills/ui-screen-audit`, `.claude/skills/ui-workshop-workflow`. Bu dosya departmanın kendi hafızasıdır: onaylanan ve reddedilen taslaklar, tekrar eden kalıplar. Kuralların kendisi `CLAUDE.md`'dedir.

## Başlamadan bilinecekler

- Var olan ekranın görünüşünün kaynağı uygulamanın kendisidir; yeni ekranın ve yeni parçanın kaynağı aura tuvalidir (`docs/decisions/tuval-kaynak.md`). Var olan ekrana yalnız istenen parça girer.
- Değerler yalnız tokenlardan: `apps/mobile/src/theme/`, boylar `auraKit.ts` → `KIT.size` (ana düğme 52, küçük 36, ikon 44, alan 48, çip 36), hareket `aura.ts` → `MOTION`. Yeni değer uydurulmaz; gerekiyorsa proje sahibine tek soru.
- Ekran davranışı kuralları `CLAUDE.md` → Ekran davranışı (320 dp, en büyük yazı, yükleniyor, boş ve hata hâli, sabit üst düğmeler).
- Kapalı: canlı cam (`docs/decisions/cam-kapali.md`), sekme açılışında bulanıklık. Öneri bunları geri getirmez.
- Bu ortamda telefon yok. Görüntü proje sahibinin telefonundan ya da CI'daki görsel kapıdan (`.claude/skills/e2e`) gelir; görülmeyen ekran "görülmedi" diye yazılır.

## Açık bulguların yeri

Bütünsel UI denetimi yapıldı: `docs/denetim/uctan-uca-2026-11.md` → "M15" (M15-01 … M15-47; statik tarama, iki cihaz turu, ayrıntılı görsel tarama, 10 Kasım). Yeni denetim aynı bulguyu yeniden yazmaz; numarasına atıf yapar. Eski hata listeleri: `docs/ui-hatalar-2026-11-02.md`, `docs/ui-hatalar-2026-11-03.md`.

## Taslak kaydı

Atölye'deki her taslak bir satır. Durum Atölye kaydındakiyle aynıdır (`workshop/registry.tsx`).

| Taslak (anahtar) | Tarih   | Durum  | Karar ve neden                                | Teslim |
| ---------------- | ------- | ------ | --------------------------------------------- | ------ |
| `buttonOrder`    | 11 Kas. | Taslak | Aracın örneği; ürün önerisi değil, uygulanmaz | —      |

## Tekrar eden kalıplar

Denetimlerde iki kez görülen kalıp buraya bir satırla yazılır (kalıp, ilk görüldüğü bulgu, kural). 11 Kasım 2026 itibarıyla departmanın kendi kaydı yok; M15'in kalıp bulguları (M15-38 … M15-47) denetim belgesindedir.
