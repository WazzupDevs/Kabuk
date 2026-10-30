---
name: supabase-ops
description: skall Supabase işletimi, admin komutları (ban, hesap silme, etkinlik, cinsiyet ve doğum tarihi düzeltme, fotoğraf), sırlar ve CHECKIN_SKIP_LOCATION, Play inceleme hesabının kodu, dev ve üretim projesi arasında geçiş, Windows satır sonları, SMS kancası ve zorunlu güncelleme kapısı testleri.
---

# Supabase işletimi

Asla: `supabase config push`, `supabase/local/secrets.sql`'i barındırılan projede çalıştırmak, secret key'i ya da bir kodu bir dosyaya yazmak. Secret key yalnızca geliştirici makinesinin kabuğunda ortam değişkenidir. Bölüm atıfları (ör. "Test APK'sı", "Neyi ne zaman yayınlamalı") `CLAUDE.md` → "Nerede ne var" tablosuyla bulunur.

Dev ve üretim arasında geçerken her komuttan önce `pnpm supabase migration list`'in hangi projeye bağlı olduğunu kontrol et; bitince dev'e geri bağla (`pnpm supabase link --project-ref <ref>`).

## Admin komutları

- `pnpm admin:ban <userId>` — ban = telefon hash'ini `banned_phones`'a yazar, sonra hesabı siler (tüm veri cascade ile gider). Yalnızca geliştirici makinesinde, `SUPABASE_URL` ve `SUPABASE_SECRET_KEY` ortam değişkenleriyle çalışır. Secret key hiçbir dosyaya yazılmaz, uygulamaya girmez.
- `pnpm admin:delete <userId>` — e-postayla gelen hesap silme talebi: uygulamadaki "Hesabımı sil" ile aynı adımlar (masayı bitirir, profil fotoğraflarını siler, hesabı siler; bütün veri cascade ile gider; PostHog değişkenleri varsa kişi kaydı da). Ban yapmaz, numara yeniden kayıt olabilir. Kullanıcı kimliği panelde Authentication → Users'ta numarayla bulunur. `admin:ban` gibi yalnızca geliştirici makinesinde, `SUPABASE_URL` ve `SUPABASE_SECRET_KEY` ortam değişkenleriyle.
- `pnpm admin:event add <venueId|sourceRef> "<başlık>" <başlangıç> [<bitiş>]` / `list` / `remove <id>` — Keşfet'teki planlı etkinlikler (`venue_events`). Saat `2026-09-29 20:00` (İstanbul) ya da ofsetli ISO; bitiş verilmezse 3 saat. `admin:ban` gibi yalnızca geliştirici makinesinde, `SUPABASE_URL` ve `SUPABASE_SECRET_KEY` ortam değişkenleriyle.
- `pnpm admin:set-gender <userId> <female|male|unspecified>` — yanlış beyan edilen cinsiyeti düzeltir (`docs/SPEC_V3.md` §23.D; uygulamadan değiştirilemez; e-postayla gelen talep ya da "yanlış cinsiyet beyanı" şikayeti). `admin:ban` gibi yalnızca geliştirici makinesinde, `SUPABASE_URL` ve `SUPABASE_SECRET_KEY` ortam değişkenleriyle.
- `pnpm admin:set-birth-date <userId> <YYYY-MM-DD>` — kayıtta yanlış girilen doğum tarihini düzeltir (uygulamadan değiştirilemez; e-postayla gelen talep). 18 yaş altını reddeder: o hesap `admin:delete` ile silinir. `admin:ban` gibi yalnızca geliştirici makinesinde, `SUPABASE_URL` ve `SUPABASE_SECRET_KEY` ortam değişkenleriyle.
- `pnpm admin:remove-photo <publicId>` — şikayet incelemesinden sonra profil fotoğrafını siler ve `photo_path`'i boşaltır (şikayet kopyası 30 gün kalır). `admin:ban` gibi yalnızca geliştirici makinesinde, `SUPABASE_URL` ve `SUPABASE_SECRET_KEY` ortam değişkenleriyle. Ban ve hesap silme profil fotoğraflarını da siler.
- `pnpm admin:move-photos` — fotoğraf yolları rastgele olmadan önce `{public_id}/{uuid}.jpg`'e yüklenmiş profil fotoğraflarını `p/{rastgele uuid}.jpg`'e taşır (Storage API ile kopya, sonra `move_profile_photo`: profil ve şikayet kopyaları yeni yolu gösterir, sonra eski dosya silinir) ve eski klasörlerde kalanları siler. Fotoğraf yolu imzalı URL'de göründüğü için profil kimliği taşımaz (kural 4). Proje başına bir kez, yeni yollar yayınlandıktan sonra; tekrar çalıştırmak güvenli. `admin:ban` gibi yalnızca geliştirici makinesinde, `SUPABASE_URL` ve `SUPABASE_SECRET_KEY` ortam değişkenleriyle.

## Sırlar

Hangi sır hangi projede: `.claude/skills/yayin` → "main'den dev projesine yayın" adım 7 ve `docs/OPS.md` → "Üretim Supabase projesi" tablosu. Bakmak: `pnpm supabase secrets list`.

- `CHECKIN_SKIP_LOCATION=1` (fonksiyon sırrı, yalnızca dev projesi): check-in sınır ve 300 m kontrolünü atlar, uygulama sınır dışında ya da konumsuz (bina içi) da devam eder; koordinat yine saklanmaz, her check-in'de uyarı loglanır. Sır yalnızca yerel stack'te ve dev projesinde (`_shared/pure/devProject.ts`) etkilidir, başka projede yok sayılır ve hata loglanır; pilot projesinde tanımlanmaz (`pnpm supabase secrets list`). Kapatmak: `pnpm supabase secrets unset CHECKIN_SKIP_LOCATION`. Testi CI'da ayrı bir `functions serve` ile koşar (`supabase/tests/checkinSkipLocation.test.ts`).

## İnceleme hesabı (Play)

**İnceleme hesabı (Play).** Üretimde tek test numarası; kodu yalnızca Play Console bilir. Kod hiçbir dosyaya, commit'e, sohbete yazılmaz. İlk kurulum ve kod değişikliği aynı adımlar:

1. Yeni kod üret (Windows'ta da çalışır): `node -e "console.log(require('node:crypto').randomInt(100000, 1000000))"`. `123456` gibi tahmin edilebilir kod kullanma.
2. Supabase paneli (üretim) → Authentication → Sign In / Providers → Phone → **Test Phone Numbers and OTPs**: `90<numara>=<kod>` (tek çift). **Test OTPs Valid Until**: ileri bir tarih; dolmadan önce uzat, dolarsa inceleme girişi çalışmaz.
3. Hemen ardından Play Console → Politika → Uygulama içeriği → **Uygulama erişimi** → talimattaki parolayı yeni kodla güncelle ve kaydet. İki yer arasında kalan sürede inceleme başlarsa giriş başarısız olur; ikisini arka arkaya yap.
4. Kodu değiştirmek için: sızdığından şüphelenince, ekipten biri ayrılınca ya da Valid Until uzatılırken. Hesabı sıfırlamak gerekirse önce `pnpm admin:delete <userId>` (inceleme hesabının kullanıcı kimliği panelde numarayla bulunur).

- İnceleme numarası gerçek bir hat olmak zorunda değil; SMS gönderilmez. Ban ve 18+/onay akışından muaf değildir.

## Windows'ta satır sonları

**Windows'ta satır sonları.** Repodaki her metin dosyası, Windows dahil her kopyada LF'dir (`.gitattributes`). Supabase CLI seed dosyasının hash'ini baytlarından hesaplar. CRLF bir Windows kopyasından yapılan `db push`, CI'ın LF kopyasından farklı bir hash kaydeder ve sonraki koşu `(hash update)` ile durur. `.gitattributes`'tan önce alınmış bir Windows kopyası bir kez LF'ye çevrilir. Windows cmd'de, repo kökünde, Metro ve editör kapalıyken:

1. `git status`: "nothing to commit, working tree clean" görünmeli.
   - **Uyarı:** 4. adımdaki `git reset --hard` commit'lenmemiş değişiklikleri siler.
   - Değişiklik varsa önce yedekle: `git stash push -m lf-oncesi`, sonra `git stash list` ile yedeğin listede olduğunu gör. İstersen klasörün tamamını da başka bir yere kopyala.
2. `git checkout main` ve `git pull`: `.gitattributes` gelir.
3. `git rm -r --cached -q .`: yalnızca git'in dizinini boşaltır, dosyalara dokunmaz.
4. `git reset --hard`: izlenen her dosyayı repodan LF ile yeniden yazar. Git'e girmeyen dosyalar (`apps/mobile/.env`, `supabase/.env`, `node_modules`) olduğu gibi kalır.
5. 1. adımda yedek aldıysan: `git stash pop`.
6. Kontrol: `git ls-files --eol supabase/seeds` her satırda `w/lf` göstermeli, `git status` temiz olmalı.

## Testler

- SMS hook testi (Send SMS Hook, `docs/SPEC_V3.md` §2): imzalı çağrılar normal `test:integration` içinde (`smsHook.test.ts`; yerel stack'e özgü imza sırrı ve hiçbir şey göndermeyen `local` sağlayıcısıyla). Test numaralarının kancaya hiç gitmediğini görmek için `config.toml`'daki `[auth.hook.send_sms]` bloğunu aç, `pnpm supabase stop` + `start`, sonra `SMS_HOOK_ENABLED=1 pnpm vitest run -c vitest.integration.config.ts supabase/tests/smsHookEnabled.test.ts`; bitince bloğu yeniden yorum yap ve stop + start.
- Zorunlu güncelleme kapısı testi (kapı kapalıyken): `echo MIN_APP_BUILD=5 > /tmp/gate.env && pnpm supabase functions serve --env-file /tmp/gate.env`, sonra `GATE_MIN_APP_BUILD=5 pnpm vitest run -c vitest.integration.config.ts supabase/tests/updateGate.test.ts`. Normal `test:integration` kapı açıkken çalışır.
