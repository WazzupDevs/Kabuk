# CI orta yol (18 Kasım 2026, proje sahibinin kararı)

Görsel doğrulama pilotunda bir aile yaklaşık 2,5 saat sürdü; çoğu koşu beklemekti. Ekran paketleri sunucuya dokunmadığı hâlde her push'ta 12 ile 15 dakikalık entegrasyon koşusunu bekliyordu. Proje sahibi orta yolu seçti (`docs/decisions/gorsel-dogrulama.md` → 18 Kasım öğle, karar 5).

## Karar

- **Entegrasyon testleri** (`ci.yml` → `integration`) PR'da yalnız sunucuya ya da ortak koda değebilecek bir dosya değişince koşar. Kural tersinden yazıldı ki bilinmeyen yol güvenli tarafta kalsın: PR'ın **bütün** dosyaları `apps/mobile/`, `docs/`, `e2e/`, `scripts/visual/`, `scripts/e2e/`, `.claude/` altında ya da kökteki `*.md` ise koşmaz; başka her dosya (`supabase/` ve içindeki `_shared/`, `content/`, öteki betikler, iş akışları, kök `package.json`, kilit dosyası, yeni bir klasör) koşturur. Dosya listesi okunamazsa koşar. main'e her birleşmede koşmaya devam eder: atlanan bir kırılma en geç orada görünür.
- **Kanıt adımı ve hızlı denetimler** (`checks`: gizli içerik kapısı, kanıt, typecheck, lint, format, birim testleri) her PR'da koşar.
- **GitHub'daki görsel kapı** gece koşusunda kalır. Proje sahibinin bilgisayarı iki emülatörle bağlanana kadar PR'ın çekimi `gorsel` etiketiyle GitHub'da alınmaya devam eder; bağlandıktan sonra kanıt oradan alınır.
- Tek zorunlu kontrol yine `ci`: `changes` ve `checks` geçmeli; `integration` gerekliyse geçmeli, gerekmediyse atlanmış olmalı (başka her sonuç `ci`'ı düşürür).

## Bilinen açıklık

Uygulama `@shared/*` ile yalnız `supabase/functions/_shared/pure/`'u okur; o klasör `supabase/` altında olduğundan değişikliği entegrasyonu koşturur. Entegrasyon testleri `apps/mobile/`'dan hiçbir şey içe aktarmaz (18 Kasım'da denetlendi: yalnız `scripts/admin/` ve `scripts/seed/`); bir gün aktarırsa bu liste daralır.
