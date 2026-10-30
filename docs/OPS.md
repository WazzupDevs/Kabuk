# Çalıştırma ayrıntıları (OPS)

Tek seferlik kurulumlar ve komutların ayrıntısı. Günlük kurallar `CLAUDE.md`'de, tekrarlanan prosedürler `.claude/skills/` altında. Bölüm atıfları (ör. "Test APK'sı", "Neyi ne zaman yayınlamalı") `CLAUDE.md` → "Nerede ne var" tablosuyla bulunur.

Node 22, pnpm 10, Docker (yerel Supabase için). Supabase CLI ve Deno root devDependency'dir; global kurulum gerekmez.

## Komutların ayrıntısı

- `pnpm test:integration` — `supabase/tests/**`, yerel stack'e karşı (önce `pnpm supabase start`, `pnpm db:reset` ve `pnpm supabase functions serve`). Mekan testleri gerçek veri değil `supabase/tests/fixtures/venues.ts` kullanır. Koşu boyunca tüm pg_cron işleri durdurulur (`supabase/tests/globalSetup.ts`), testler iş fonksiyonlarını doğrudan çağırır; koşu yarıda öldürülürse sonraki koşu ya da `pnpm db:reset` işleri geri açar. Yerel `functions serve` isolate'i CPU süresi 1 sn'yi geçince ya da açıldıktan 200 sn sonra emekliye ayırır ve o an gelen isteği fonksiyon çalışmadan reddeder (`WorkerAlreadyRetired`). Red istemciye iki biçimde varır: serve'ün bilinen 500 gövdesi ya da hiç yanıt gelmemesi (`supabase/tests/refusal.ts`). `supabase/tests/local.ts` bu ikisinde isteği bir kez tekrarlar. Gövdesiz 503 de emeklilik anında gelir ama fonksiyon çalıştıktan sonra; yalnızca iki kez gönderilince aynı sonucu verdiği testle kanıtlı çağrılar (`_shared/pure/apiRetry.ts` → `IDEMPOTENT_CALLS`) bir kez tekrarlanır, diğerleri testi düşürür. Kong'un `503 {"message":"name resolution failed"}`ı serve'ün konteyneri yokken gelir, fonksiyon çalışmamıştır (`no-runtime`): `local.ts` `ping` yanıt verene kadar en çok 60 sn bekler, sonra çağrıyı bir kez daha gönderir; bekleme bir kez boşa çıkarsa aynı test dosyasında bir daha beklemez. Her biri fonksiyon ve action adıyla uyarı olarak yazılır; CI iş özetinde toplam, tekrarlanan sayısı ve çağrı başına tür ve tekrar görünür, `no-runtime` ayrıca koşuda uyarı (annotation) olarak. Diğer her 5xx ve ikinci denemede gelen red testi düşürür; 10 sn içinde yanıt gelmeyen istek de iki denemeden sonra testi düşürür. Hata hangi fonksiyonda ve hangi action'da takıldığını söyler. CI'da serve kendiliğinden durursa (18 ve 19 Ekim: konteyner `exit 135`, SIGBUS, birkaç saniyede öldü ve geri gelmedi) `scripts/ci/functions-serve.sh` onu yeniden başlatır: işte en çok iki kez, üçüncüde testleri durdurur ve iş düşer; CHECKIN_SKIP_LOCATION adımının bilerek durdurması sayılmaz. Her duruş saatiyle iş özetinde ve koşuda uyarı olarak; o anki disk, `/dev/shm`, bellek ve `docker stats` `functions-logs` artifact'ında (`serve-state/crash-<n>.txt`; artifact duruş olunca iş yeşil olsa da yüklenir). CI düştüğünde functions.log'un tamamı da oradadır.
- `pnpm seed` — `content/*.json` → `supabase/seeds/content-<id>.sql` (tek dosya, commit'lenir; içerik değişince adı değişir, eskisi silinir). Neden: Supabase CLI bir seed yolunu barındırılan projede yalnızca bir kez çalıştırır; aynı yolun içeriği değişince `db push --include-seed` yalnızca hash'i günceller, SQL'i atlar. Yeni ad, içerik değişikliğinin her push'ta gerçekten uygulanmasını sağlar (`scripts/seed/build.ts`). Dosyayı elle düzenleme, adını değiştirme; `content/` değişince `pnpm seed` çalıştır. `scripts/seed/build.test.ts` klasörde tek dosya olduğunu ve güncel içerikle aynı olduğunu denetler: iki dal da `pnpm seed` çalıştırdıysa birleşmede iki dosya kalır, test düşer, birleşmede `pnpm seed` yeniden çalıştırılır. Her mekanda `kind` zorunlu: `venues-pilot.json` ve `venues-test.json` → `cafe`, `venues-campus.json` → `campus` (`_shared/pure/venueKind.ts`). Kafe türündeki mekanda `category` elle yazılır: `kafe`, `cay_bahcesi` ya da `yemek`; yoksa `kafe` (Keşfet listesi; kampüste yok). `content/venues-test.json` boşsa atlanır (bkz. "Saha testi mekanı"). `content/venues-campus.json`: sınırı ve noktaları olan mekanlar (kampüs; `docs/SPEC_V3.md` §4.1); poligon ve noktalar seed'de doğrulanır, geçersizse `pnpm seed` durur. Nokta eklemek yalnızca JSON + seed. `pnpm seed` ayrıca `content/capsule-catalog.json` ile `content/profanity-tr.json` → `capsuleNick`'ten `_shared/pure/capsuleCatalog.ts`'i üretir (kapsül kataloğu ve nick'te üretilmeyen kısaltmalar ve sayılar, `docs/SPEC_V4.md` §4.D); uygulama ve sunucu aynı dosyayı okur, `scripts/seed/capsule.test.ts` güncel içerikle aynı olduğunu denetler. Elle düzenlenmez. Masa simgeleri (`content/table-icons.json`, K-45) aynı yolla `_shared/pure/tableIcons.ts`'e üretilir ve seed'le `public.table_icons`'a yüklenir (`scripts/seed/tableIcons.test.ts`)
- `pnpm fetch:venues` — OpenStreetMap Overpass API'den Beylikdüzü kafeleri ve nargile kafeleri → `content/venues-pilot.json`. Sonucu elle kontrol et (`isActive: false` ile kapat; tekrar çekişte korunur), sonra `pnpm seed`. `overpass-api.de` erişimi gerekir.
- `pnpm functions:deploy` — `config.toml`'daki bütün `[functions.*]` fonksiyonlarını bağlı projeye tek komutla yayınlar; sonda bağlı projeyi ve sayıyı yazar. Bağlı proje yoksa durur (bkz. "main'den dev projesine yayın" adım 5).
- `pnpm site:build` — `docs/legal/*.md` → `site/` (git'e girmez): gizlilik politikası, KVKK aydınlatma metni, kullanım koşulları, hesap silme sayfası. Uygulama adı `{{APP_NAME}}` yer tutucusundan gelir. Yayın: aşağıda "Yasal sayfalar".
- `pnpm store:screenshots <klasör> [çıktı]` (klasör: bir koşunun açık tema artifact'larının indirildiği yer, `gh run download <koşu> -p 'e2e-run-light-*' -D <klasör>`) — Play telefon görselleri (1080×1920, 9:16) → `dist/store-screenshots/`. Hangi ekranlar ve başlıklar: `docs/store/screenshots.json`. Tema ya da ad değişince yeniden çalıştırılır.
- `pnpm icons` — uygulama ikonu skall işaretinden: `scripts/icon/mark.ts` ("skall Logo Sistemi": kapsül 80 × 240, ikinci kapsül 52 sağa 60 aşağı, kesişim; renkler orada) → `apps/mobile/assets/icon/*.png`: Android uyarlanabilir ön ve arka katman (işaret 66 dp güvenli dairenin içinde, en uzak noktası merkezden 26 dp), temalı ikon için tek renk katman, bildirim ikonu (küçük boy çizimi), Play 512 ve iOS 1024 (ışıklı çizim), sistem açılış ekranı görseli (288 dp tuval, işaret 137 dp, zemin `#14112B` açık ve koyu modda; `app.json` → `imageWidth: 288`; "skall Hareket" → "Sistem açılış ekranı"); `mark.test.ts` ölçüleri ve `app.json` ile eşleşmeyi denetler. Uygulama içinde işaret, dört yükleme göstergesi, Mekan sekmesinin işareti ve yazı logosu görsel değil, View ve react-native-svg ile çizilir (`src/components/Mark.tsx`, `Loader.tsx`, `src/ui/VenueGlyph.tsx`, `src/components/Wordmark.tsx`; geometri ve hareket `src/theme/markMotion.ts`, renkler `src/theme/brand.ts`, `mark.ts` ile eşitliği testli). İkon ailesi `scripts/icon/glyphs.ts` → `apps/mobile/assets/glyph/*.png` (zil ikonu, rozetler, kilit: beyaz, 1x/2x/3x, uygulama `tintColor` ile boyar; harita işaretçisi glifleri MapLibre için SDF; sekme çubuğu v46'nın SVG'leriyle `src/ui/`'da çizilir) ve önizleme `dist/icon-preview/index.html` (48/72/96/192 px, açık/koyu duvar kağıdı, daire/squircle/yuvarlak kare, Android 13 temalı). Renk ya da çizim değişince çalıştır; ikon native alandır: `app.json` → `version` artır ve yeni build.
- `node --experimental-strip-types scripts/art/vampirTable.ts` — Vampir Köylü'nün masası, madalyonu ve kum saatinin ön camı `apps/mobile/src/theme/vampirArt.ts`'teki SVG metninden bir kez çizilir → `apps/mobile/assets/vampir/table/*.webp` (3x, kayıpsız) ve `manifest.json`; telefon bunları her evrede ana iş parçacığında bulanıklaştırmak yerine yalnızca gösterir. SVG metni değişince çalıştır; `vampirArt.test.ts` resimlerin güncel metinden çizildiğini denetler. Zemin resim değil, React Native'in kendi gradyanlarıdır (`groundCss`).
- `pnpm tokens` — v46'nın token'ları envanterden: `docs/design/v46/skall-v46-envanter.json` → `apps/mobile/src/theme/tokens.generated.ts` (adlandırılmış renkler `scripts/v46/palette.ts`, yazı biçimleri, 59 bileşenin açık ve koyu ölçüleri; gölge ve gradyan CSS dizesi). Satır yüksekliği her yerde sayıdır: v46'nın `normal`'ı, tarayıcının çizdiği gibi uygulamanın taşıdığı font dosyalarının ölçülerinden (`scripts/v46/fontMetrics.ts`); 400 gibi v46'nın yüklemediği ağırlık tarayıcının seçtiği dosyayla çizilir (`theme/v46Fonts.ts`, `docs/decisions/v46-native-3a-yazi.md`). Envanterin yazmadığı tek değer, gradyan, kaynak kuralıyla `scripts/v46/supplement.ts`'te. Bileşenlerin envanterde olmayan ölçüleri (iç parçalar, basılı hâl, geçişler, simge çizimleri, 350 px altı; gerçek ekranda ona ulaşan envanter hareket kuralları) v46 galerisinden ve gerçek ekranlardan Chromium'da ölçülür: `PLAYWRIGHT_CHROMIUM=<chromium> node --experimental-strip-types scripts/v46/measure.ts` → `docs/design/v46/olcum/skall-v46-olcum.json` (repoda, uygulamaya girmez; v46 değişince yeniden ölçülür, envanterle aynı v46'dan ölçüldüğü denetlenir). `pnpm tokens` bundan yalnızca bileşenlerin okuduğu değerleri `apps/mobile/src/theme/parts.generated.ts`'e yazar (bugün düğmeler: `scripts/v46/buttons.ts`, `docs/decisions/v46-native-3b-dugmeler.md`). Üretilen iki dosyayı elle düzenleme; envanter ya da ölçüm değişince çalıştır. `scripts/v46/tokens.test.ts` ikisinin de betiğin yazdığıyla aynı olduğunu denetler; `scripts/v46/buttonMotion.test.ts` ölçümün bir düğmeye ulaştırdığı her hareket kuralının üretilen dosyada envanterdeki değerle durduğunu ve onu çizen bileşenin okuduğunu.

## Barındırılan dev projesi kurulumu (tek seferlik)

1. **Supabase:** yeni proje aç (bölge: Frankfurt `eu-central-1`). Proje ref'ini not et.
2. `pnpm supabase login` ve `pnpm supabase link --project-ref <ref>`
3. **Vault anahtarı:** `openssl rand -hex 32` ile üret, parola yöneticisine kaydet, SQL Editor'da çalıştır:
   `select vault.create_secret('<anahtar>', 'phone_hash_key');`
   Anahtar asla değişmez (rotasyon yok; değişirse `banned_phones` geçersiz olur). `supabase/local/secrets.sql`'i barındırılan projede asla çalıştırma.
4. `pnpm supabase db push --include-seed --skip-vault` — migration'lar + `supabase/seeds/*.sql` (takma ad kelimeleri, mekanlar; tekrar çalıştırılabilir). Yerel sırlar seed yolunda değildir, buradan barındırılan projeye gidemez.
5. `pnpm supabase functions deploy` — tüm fonksiyonlar. `verify_jwt = false` ayarı `config.toml`'dan gelir; token'ı fonksiyon kendisi doğrular.
6. **SMS: dev projesinde yok.** Twilio hesabı açılmaz. Telefonla giriş yalnızca panele girilen test numaralarıyla çalışır (7. adım ve aşağıda "Barındırılan projede SMS'siz giriş"). Phone sağlayıcısını açmak için panel sağlayıcı alanlarını ister: Twilio Verify seçili kalır, kutularda sahte değerler durur; hiçbir SMS gönderilmez. Gerçek SMS yalnızca pilot (üretim) projesinde Netgsm kancasıyla gider (aşağıda "Üretim Supabase projesi").
7. **Supabase paneli → Authentication:**
   - Sign In / Providers → **Email: kapalı**. **Phone: açık**, SMS sağlayıcı **Twilio Verify** (kutularda sahte değerler, 6. adım), telefonla kayıt açık.
   - Phone → test numaraları: `905550000001=<kod>` (yalnızca dev projesinde; pilot projesinde olmaz). Dev kodu panelde ve parola yöneticisinde durur, repoya yazılmaz (depo herkese açık).
   - Rate Limits: saatlik SMS **100**; aynı numaraya tekrar gönderim aralığı **60 sn**.
   - Hooks → **Before User Created** → Postgres → şema `private`, fonksiyon `before_user_created`.
   - **Realtime → Settings → Allow public access: kapalı.** Tüm kanallar özeldir; kimin abone olup yayın yapacağına `realtime.messages` politikaları karar verir.
8. **Mobil:** `cp apps/mobile/.env.example apps/mobile/.env`; URL `https://<ref>.supabase.co`, anahtar Settings → API Keys'teki publishable key.
9. Sonraki değişikliklerde: "main'den dev projesine yayın" (aşağıda).

## Yasal sayfalar (GitHub Pages)

Gizlilik politikası, KVKK metni, kullanım koşulları ve hesap silme talebi herkese açık statik sayfalardır; Play gizlilik politikası ve hesap silme için web bağlantısı ister. Kaynak `docs/legal/*.md`, yayın `.github/workflows/pages.yml` (main'e `docs/legal/**` değişikliği gelince ya da elle). Sayfalar taslaktır; her sayfada "Taslak, hukuki kontrol bekliyor" notu durur, hukuki kontrol bitince kaldırılır.

1. Tek seferlik: GitHub → repo **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. main'e merge ya da Actions → **pages** → Run workflow. Adresler: `https://wazzupdevs.github.io/Kabuk/` (dizin), `…/gizlilik-politikasi.html`, `…/kvkk-aydinlatma-metni.html`, `…/kullanim-kosullari.html`, `…/hesap-silme.html`.
3. EAS `preview` ve `production` ortamlarında `EXPO_PUBLIC_PRIVACY_URL` = gizlilik sayfası adresi, sonra `eas update`.
4. Yerelde bakmak için `pnpm site:build` ve `site/index.html`'i tarayıcıda aç.

- Repo gizliye çevrilirse GitHub Pages ücretli plan ister (Pro/Team). O zaman Cloudflare Pages: panelde repoyu bağla, build komutu `pnpm site:build`, çıktı klasörü `site` (bkz. `docs/DECISIONS.md` → "Yasal sayfalar").

## Üretim Supabase projesi (tek seferlik)

Pilot ve Play kullanıcıları için ayrı proje. Pilotun baştan sona yayın sırası, Windows cmd komutlarıyla: `docs/PILOT_RELEASE.md`. Kurulum dev projesiyle aynı sıradadır (yukarıdaki "Barındırılan dev projesi kurulumu"); farklar:

| Konu                              | Dev projesi                                                                                          | Üretim projesi                                                                                                                                                                           |
| --------------------------------- | ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Test numaraları                   | `905550000001=<kod>` ve saha testi numaraları (kodlar panelde ve parola yöneticisinde, repoda değil) | **Yalnızca tek, kalıcı inceleme hesabı:** bir numara, tahmin edilemez 6 haneli kod. Kod yalnızca Play Console → Uygulama erişimi'nde durur (aşağıda "İnceleme hesabı")                   |
| E2E botu (#19)                    | `scripts/e2e/bot-table.ts` bu projeyi kabul eder                                                     | **Reddedilir:** bot yalnızca yerel stack'i ve dev projesinin adresini kabul eder; üretim adresi listeye eklenmez                                                                         |
| SMS                               | **Yok:** yalnızca test numaraları; Twilio kutularında sahte değerler                                 | **Netgsm, Send SMS Hook** (`docs/SPEC_V3.md` §2.3): `SMS_PROVIDER` ve Netgsm sırları, panelde kanca açık; Twilio kutularında sahte değerler; saatlik SMS sınırı 100, aynı numaraya 60 sn |
| Vault anahtarı (`phone_hash_key`) | Dev anahtarı                                                                                         | **Yeni ve farklı** anahtar (`openssl rand -hex 32`), parola yöneticisinde; asla değişmez                                                                                                 |
| `MIN_APP_BUILD`                   | Ayarsız (kapı açık)                                                                                  | İlk production AAB yüklendikten sonra o build'in versionCode'u; eski ya da preview build'ler (aynı sayaç, küçük numara) kapıda kalır. Yeni sürümle birlikte artırılır                    |
| Plan                              | Free (yedek yok, duraklatılabilir)                                                                   | **Pro** (günlük yedek 7 gün, duraklatma yok)                                                                                                                                             |
| Realtime → Allow public access    | Kapalı                                                                                               | **Kapalı** (aynı)                                                                                                                                                                        |
| Seed                              | Test mekanı olabilir                                                                                 | `db push --include-seed`'den önce `content/venues-test.json` boş ya da her mekanı `isActive: false` olmalı; yoksa test mekanı üretimde görünür                                           |
| Mobil ortam                       | EAS `preview` → dev URL ve anahtar                                                                   | EAS `production` → üretim URL'i ve publishable key; `EXPO_PUBLIC_POSTHOG_KEY` (üretim PostHog projesi), `EXPO_PUBLIC_SENTRY_DSN`, `EXPO_PUBLIC_PRIVACY_URL`, `EXPO_PUBLIC_CONTACT_EMAIL` |
| Fonksiyon sırları                 | İsteğe bağlı                                                                                         | `POSTHOG_PERSONAL_API_KEY` ve `POSTHOG_PROJECT_ID` (üretim PostHog projesi; hesap silmede kişi silme)                                                                                    |

Sıra:

1. Yeni proje (Frankfurt `eu-central-1`) ve **Pro plana al** (panel → Organization → Billing). Gerekçe: Free planda otomatik yedek yok ve düşük aktivitede proje haftalık duraklatılır (https://supabase.com/docs/guides/platform/free-project-pausing); Pro'da günlük yedekler 7 gün saklanır (https://supabase.com/docs/guides/platform/backups) ve hesap silme sayfası bu süreyi söyler. Dev projesi Free kalır.
2. `pnpm supabase link --project-ref <üretim ref>`. Dev ve üretim arasında geçerken her komuttan önce `pnpm supabase migration list`'in hangi projeye bağlı olduğunu kontrol et; bitince dev'e geri bağla.
3. Vault anahtarı (yukarıdaki tabloya göre yeni), sonra `db push --include-seed --skip-vault` (seed notu tabloda) ve 18 fonksiyonun deploy'u ("main'den dev projesine yayın" adım 5).
4. Panel → Authentication: Email kapalı, Phone açık (Twilio kutularında sahte değerler; SMS'i Netgsm kancası gönderir, `docs/SPEC_V3.md` §2.3), test numarası yalnızca inceleme hesabı, Rate Limits, Hooks → Before User Created → `private.before_user_created` ve Send SMS Hook.
5. Panel → Realtime → Settings → Allow public access **kapalı**.
6. `pnpm supabase secrets set POSTHOG_PERSONAL_API_KEY=… POSTHOG_PROJECT_ID=…`. `MIN_APP_BUILD` ilk production AAB'den sonra.
7. EAS `production` ortam değişkenleri (tabloda), sonra `eas build --profile production`.

- Asla: `supabase config push`, `supabase/local/secrets.sql`, secret key'i bir dosyaya yazmak, dev Vault anahtarını üretimde kullanmak.

Play inceleme hesabının kodu ve değiştirilmesi: `.claude/skills/supabase-ops` → "İnceleme hesabı".

## Push (isteğe bağlı; hesaplar olmadan build kırılmaz)

- Expo proje id'si (`@wazzupdevs/masa`) `app.config.ts`'te sabit (`EAS_PROJECT_ID`); push token kaydı ve OTA onu kullanır. Ortam değişkeninden okunmaz (bkz. `docs/DECISIONS.md` → "EAS proje kimliği").
- `GOOGLE_SERVICES_JSON`: Firebase'in `google-services.json` yolu (varsayılan `apps/mobile/google-services.json`, git'e girmez). Dosya yoksa Android build'e eklenmez. FCM V1 anahtarı Expo paneline yüklenir.
- Gönderim Expo push API'si ile yapılır, sunucuda anahtar gerekmez.

## Hata raporlama (Sentry)

- `EXPO_PUBLIC_SENTRY_DSN` (EAS ortam değişkeni ya da mobil `.env`); yoksa hiçbir şey gönderilmez. Kullanıcı kimliği olarak yalnızca kullanıcı id'si gider. Telefon, konum, yazılan metin, istek gövdesi ve URL sorgu dizesi `_shared/pure/errorReporting.ts` ile telefondan çıkmadan silinir.
- Kaynak haritası yüklemesi kapalı (`SENTRY_DISABLE_AUTO_UPLOAD=true`, `eas.json`). Açmak için Sentry hesabı ve `SENTRY_AUTH_TOKEN` gerekir.
- Edge Function'dan gelen her 5xx Sentry'ye `function` (ör. `tabu/mark`) ve `status` etiketleriyle gider; istek ve yanıt gövdesi gitmez. Yalnızca `_shared/pure/apiRetry.ts` → `IDEMPOTENT_CALLS` listesindeki çağrılar 5xx sonrası 500 ms bekleyip bir kez daha gönderilir; diğerleri (DM gönderme, istek, oda kurma…) asla tekrar gönderilmez. Ölçüt okuma değil idempotentliktir: iki kez gönderilince bir kez gönderilmiş gibi aynı durum ve yanıt. Her girdinin yanında onu iki kez gönderen entegrasyon testinin adı yazılıdır; `apiRetry.test.ts` bu testlerin var olduğunu denetler. Yeni girdi, böyle bir testle birlikte gelir.
- Her rota grubunun `_layout.tsx`'i `RouteError`'ı `ErrorBoundary` olarak dışa verir: beyaz ekran yerine kısa bir mesaj, "Tekrar dene" ve "Ana ekrana dön".

## Analitik, yasal metinler, mağaza (M7)

- Mobil `.env` (hepsi isteğe bağlı): `EXPO_PUBLIC_POSTHOG_KEY` (yoksa analitik hiçbir şey yapmaz), `EXPO_PUBLIC_POSTHOG_HOST` (varsayılan AB), `EXPO_PUBLIC_PRIVACY_URL` (yoksa uygulama içi taslak metin), `EXPO_PUBLIC_CONTACT_EMAIL`.
- Fonksiyon sırları (hesap silmede PostHog kişi silme; yoksa atlanır): `pnpm supabase secrets set POSTHOG_PERSONAL_API_KEY=… POSTHOG_PROJECT_ID=…` (`POSTHOG_HOST` isteğe bağlı). `pnpm admin:ban` aynı değişkenleri ortamdan okur.
- Event kataloğu ve izinli özellikler: `_shared/pure/analytics.ts`. PostHog'a yalnızca kullanıcı id'si gider.
- Yasal taslaklar `docs/legal/` (hukuki kontrol gerekli), mağaza metinleri `docs/store/listing-tr.md`, EAS profilleri `apps/mobile/eas.json`.

## Mobil (Android fiziksel cihaz, USB hata ayıklama açık)

1. `apps/mobile/.env` barındırılan dev projesini göstermeli (yukarıdaki 8. adım).
2. `pnpm --filter mobile android` — `expo run:android`, dev build'i derleyip cihaza kurar (Android SDK + JDK 17 gerekir)
3. Sonraki çalıştırmalarda `pnpm --filter mobile start` — Metro'yu dev client için başlatır

## Test APK'sı (`preview` profili): alma ve paylaşma

Dev client olmadan, tek başına çalışan bir Android APK'sı. Arkadaşa link ile gönderilir, USB ve Metro gerekmez. `EXPO_PUBLIC_*` değerleri yerel `.env`'den değil EAS ortam değişkenlerinden gelir: `.env` git'e girmediği için EAS'a yüklenmez.

1. **Expo hesabı** (ücretsiz) aç. `eas-cli` bağımlılık değildir, `pnpm dlx` ile çalıştırılır: `cd apps/mobile && pnpm dlx eas-cli login`
2. **Proje:** `@wazzupdevs/masa`; id `app.config.ts`'te sabit, `eas init` ve kabukta `EAS_PROJECT_ID` gerekmez. Başka bir Expo hesabına taşınırsa `pnpm dlx eas-cli init` ile yeni id alınır ve `app.config.ts`'teki sabit değiştirilir.
3. **Ortam değişkenleri** (`preview` ortamı; bir kez, değer değişince tekrar):
   ```
   pnpm dlx eas-cli env:create --environment preview --name EXPO_PUBLIC_SUPABASE_URL --value https://<ref>.supabase.co --visibility plaintext
   pnpm dlx eas-cli env:create --environment preview --name EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY --value <publishable key> --visibility plaintext
   ```
   İsteğe bağlı: `EXPO_PUBLIC_POSTHOG_KEY`, `EXPO_PUBLIC_PRIVACY_URL`, `EXPO_PUBLIC_CONTACT_EMAIL`. Kontrol: `pnpm dlx eas-cli env:list --environment preview`. Publishable key zaten uygulamanın içindedir, gizli değildir. **Secret key asla eklenmez.**
4. **Build:** `pnpm dlx eas-cli build --platform android --profile preview`. İlk seferde Android keystore'u EAS'ın üretmesini kabul et (sonraki APK'lar aynı anahtarla imzalanır, üstüne kurulur). Ücretsiz planda kuyrukla birlikte 15–40 dk sürebilir.
5. **Paylaşma:** Build bitince CLI bir `expo.dev/.../builds/<id>` linki ve QR kodu verir; sonra `pnpm dlx eas-cli build:list` ya da expo.dev'deki proje sayfasından da bulunur. Linki arkadaşına gönder. Android'de linki Chrome'da açar, **Install** ile APK'yı indirir, "bilinmeyen uygulamaları yükleme" iznini Chrome'a verir ve kurar. Play Protect uyarısında "Yine de yükle" seçilir.
6. **Güncelleme:** kod ya da `EXPO_PUBLIC_*` değişince yeni build gerekir (değerler build anında pakete girer). Yeni APK eskisinin üstüne kurulur, oturum korunur. Sunucu değişiklikleri (migration, fonksiyon) yeni APK gerektirmez.
7. Bildirimler bu APK'da da çalışır (bkz. "Push"). Uygulama bildirim iznini ister; izin verilmezse push token kaydedilmez ve uygulama bildirimsiz çalışır.

## Barındırılan projede SMS'siz giriş (test numaraları)

Dev projesinde girişin tek yolu budur (orada SMS yok): gerçek ya da uydurma numaralarla, SMS gönderilmeden, sabit kodla giriş yapılır.

1. Supabase paneli → **Authentication → Sign In / Providers → Phone**.
2. **Test Phone Numbers and OTPs** alanına numara=kod çiftlerini virgülle yaz. Numara `+` olmadan, ülke koduyla: `905321234567=482915,905339876543=730264`.
3. **Test OTPs Valid Until:** testten sonraki güne bir tarih ver; o tarihten sonra bu çiftler çalışmaz.
4. Kaydet. Uygulamada numarayı her zamanki gibi gir (`5xx xxx xx xx`), SMS gelmez; kodu elle gir.

- Kodu `123456` gibi tahmin edilebilir seçme: numarayı ve kodu bilen herkes o hesaba girebilir. Test bitince çiftleri sil.
- Test numarası ban kontrolünden ve 18+/onay akışından muaf değildir. Hesap silme ve `pnpm admin:ban` aynı şekilde çalışır.
- Phone sağlayıcısı açık olmalı. Panel sağlayıcı alanlarını ister: Twilio kutularına sahte değerler yazılır (dev projesinde Twilio yok); test numaralarına SMS gönderilmez.
- Gerçek numara şart değil: dev projesindeki `905550000001=<kod>` gibi uydurma numaralar da aynı yolla çalışır. Dev kodu panelde ve parola yöneticisinde durur, repoya yazılmaz.

## Saha testi mekanı (`content/venues-test.json`)

Pilot listesinde olmayan bir yerde test için elle girilen mekan. Dosya boşsa (`"venues": []`) seed onu atlar.

1. Mekanın koordinatını haritadan al (Google Maps'te noktaya uzun bas; ilk sayı enlem `lat`, ikinci boylam `lng`) ve dosyaya yaz:
   ```json
   {
     "venues": [
       { "ref": "saha-1", "name": "Saha Testi", "kind": "cafe", "lat": 41.00123, "lng": 28.6421 }
     ]
   }
   ```
   `ref` kalıcı kimliktir (değiştirme; aynı `ref` güncellenir). `kind` zorunlu ve `cafe`. İsteğe bağlı: `city` (varsayılan İstanbul), `district` (varsayılan Test), `isActive`, `spots` (kampüsteki gibi noktalar, ör. `[{ "ref": "bahce", "name": "Bahçe" }]`; noktası olan mekanda check-in "Neredesin?" sorar, 300 m kuralı değişmez).
2. `pnpm seed`, sonra `pnpm supabase db push --include-seed --skip-vault` (yerelde `pnpm db:reset`). Seed dosyası (`supabase/seeds/`) commit'lenir, yani koordinat git'e girer: ev adresi değil mekan koordinatı kullan.
3. Check-in 300 m içinden çalışır. İki telefon da mekanın yakınında olmalı.
4. Test bitince mekanı silmek yerine `"isActive": false` yapıp tekrar seed et (seed yalnızca ekler ya da günceller, silmez), ya da listeyi boşalt ve mekanı panelden pasif yap.
5. Uçtan uca senaryo: `docs/FIELD_TEST.md`.

## Branch protection

- **Branch protection (tek seferlik, repo sahibi):** GitHub → repo Settings → Rules → Rulesets → New branch ruleset: ad "main", Enforcement: Active, Target branches: Include default branch. Kurallar: Restrict deletions, Block force pushes, Require a pull request before merging, **Require status checks to pass** → Add checks → `ci` (kaynak GitHub Actions; liste, workflow en az bir kez çalıştıktan sonra dolar). "Require branches to be up to date before merging" **kapalı** kalır: açıkken her PR'a main birleştirilmeden birleşme olmaz ve yukarıdaki "main'i PR'a birleştirmek" kuralı işlemez. Bypass listesine kimse eklenmez.
