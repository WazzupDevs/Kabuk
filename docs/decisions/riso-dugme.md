# Riso düğmeler (8 Kasım 2026)

**Karar (proje sahibi, 8 Kasım; önizlemede öneri A):** uygulamanın düğmeleri riso baskı dilinde. Ortak `Btn`'de (`src/aura/kit.tsx`); ekran başına iş yok, yeni ekran da böyle gelir.

- Ana: yeşil mürekkep (`KIT.riso.ink`), altında pembe (`offset`) ikinci mürekkep 3 kaymış.
- İkincil (`glassy`): kâğıt beyazı, 2 koyu yeşil kenar, aynı pembe kayma.
- Tehlikeli: kırmızı mürekkep, koyu kırmızı kayma (mor arayüzde yok, `violetGuard.test.ts`).
- Küçük (36) ve çubuk içindeki küçük: kayma yok, yalnız kenar ve doku (proje sahibinin onayı).
- Üstünde nokta tramı ve kâğıt greni: `assets/riso/button/texture-*.png`, 8 dp'lik karo, tekrarlanır (`scripts/icon/risoButton.ts`). Karede filtre yok; bulanık gölge yok.
- Basınca baskı ikinci mürekkebin üstüne oturur (70 ms). Soluk: aynı baskı yarı saydam. Bekleme: yazının yerinde Buluş.
- `dark` (çip gibi düğme), yuvarlak ikon düğmeleri ve çipler değişmedi.
- Kontrast: yazılar mürekkeplerinde AA (`contrast.test.ts` → riso buttons).
