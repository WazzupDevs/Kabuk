> 16 Kasım 2026. Bu bir hukuki görüş değildir; araştırma notudur. Kaynakların doğrulama durumu metinde işaretlidir. İlgili PR: #663.

# skall: kişisel veri akışları ve yurt dışı aktarımlar (koddan çıkarım)

Kaynak: `origin/main` @ c81dd6a (16 Kasım 2026), `git archive` ile çıkarılan kopya. Yalnız okundu; hiçbir dosya, servis ya da sağlayıcıya dokunulmadı. Bu bir hukuki görüş değildir.

Ağ notu: bu oturumda `supabase.com` ve `kvkk.gov.tr` doğrudan açılamadı (oturumun ağ izinleri dışında). C bölümündeki bilgiler web aramasının özetlerinden ve sağlayıcı sayfalarının arama sonuçlarındaki adreslerinden; resmî metinler ayrıca okunmalı.

---

## A) Envanter

### 1. Supabase (DB, Auth, Storage, Realtime, Edge Functions)

- **Çıkan veri:** tüm hesap ve kullanım verisi: telefon (Auth), doğum tarihi, cinsiyet, profil, fotoğraf ve kapak (Storage), mesajlar (masa, mekan, semt, DM), check-in (`venue_id`, `spot_id`), oyun verisi, push token (`profiles.push_token`, `supabase/migrations/20260927090000_rooms_lobby_join_requests.sql:6`), IP (API isteğinin kendisi; Auth denetim kayıtları `auth.audit_log_entries`, `docs/decisions/yasal-metinler.md:21`).
- **Kim gönderiyor:** uygulama `apps/mobile/src/lib/supabase.ts`, `apps/mobile/src/lib/api.ts:116` (`supabase.functions.invoke`), adres `EXPO_PUBLIC_SUPABASE_URL` (`apps/mobile/src/lib/env.ts:10`).
- **Bölge:** belgede Frankfurt `eu-central-1` (`docs/OPS.md:13` dev, `docs/OPS.md` → "Üretim Supabase projesi" sıra 1). Gerçek proje bölgesi repoda görünmüyor: **doğrulanamadı (panelden bakılmalı)**.
- **Önemli bulgu, Edge Functions bölgesi:** istemci fonksiyon çağrısında bölge vermiyor (`api.ts:116`; `x-region`/`region` yok, grep boş). Supabase'in belgesine göre Edge Functions varsayılan olarak **isteği yapana en yakın bölgede** çalışır; bölge `region: FunctionRegion.EuCentral1` ya da `x-region` başlığıyla sabitlenir (https://supabase.com/docs/guides/functions/regional-invocation, https://supabase.com/changelog/36850-update-to-edge-functions-regional-invocations). Yani istek gövdeleri (mesaj metni, fotoğraf yükleme isteği vb.) Frankfurt dışındaki bir bölgede işlenebilir; Türkiye'den gelen istek için en yakın bölgenin hangisi olduğu repodan görünmüyor.
- **Önde CDN/ağ geçidi:** Supabase'in alt işleyen listesinde ağ/CDN sağlayıcısı olup olmadığı burada okunamadı (liste: https://supabase.com/legal/subprocessors).

### 2. SMS: Netgsm (yalnız üretim projesi)

- **Çıkan veri:** telefon numarası (ulusal biçim) + OTP metni.
- **Dosya:** `supabase/functions/sms/index.ts:44-61` (`fetch(NETGSM_OTP_URL…)` satır 50), adres `supabase/functions/_shared/pure/smsProviders/netgsm.ts:14` → `https://api.netgsm.com.tr/sms/send/otp`. Supabase Auth'un Send SMS Hook'u numarayı bu fonksiyona yollar; fonksiyon numarayı ve kodu loglamaz (`sms/index.ts:5,110`).
- **Dev projesi:** SMS yok; Twilio kutularında sahte değer (`docs/OPS.md:21,28`). Twilio'ya veri gitmez (kanca açıkken). Kanca kapalıyken Supabase'in yerleşik Twilio Verify'ı gönderir (`sms/index.ts:3`) — üretimde kanca açık olmalı, yoksa numara Twilio'ya (ABD) gider; panelden doğrulanmalı.
- **Ülke:** Türkiye (alan adı `.com.tr`, yasal metin `docs/legal/gizlilik-politikasi.md:97`). Sunucunun yeri repodan doğrulanamaz. Not: SMS'in kendisi Supabase fonksiyonundan (Frankfurt ya da en yakın bölge) çıkar; Netgsm'e giden veri yurt içine aktarım.

### 3. Expo push servisi (exp.host)

- **Sunucudan çıkan:** Expo push token + bildirim başlığı ve metni + `data.kind`/`target` (`supabase/functions/_shared/push.ts:3,9-21`). Metinler `supabase/functions/_shared/pure/push.ts`: çoğu sabit ("Yeni bir mesajın var" vb.), **katılma isteğinde yalnız kişi sayısı, ad yok** (`pure/push.ts` → `joinRequestPush`, çağrı `supabase/functions/rooms/index.ts:291`). Mesaj içeriği push'a girmez.
- **Uygulamadan çıkan:** `Notifications.getExpoPushTokenAsync({ projectId })` (`apps/mobile/src/features/push/push.ts:52`): Expo'ya cihazın FCM token'ı ve proje kimliği gider (SDK davranışı; Expo'nun cihaz kimliği gönderip göndermediği koddan görünmüyor). Push isteğe bağlı, izin yoksa hiçbir şey (`push.ts:47-49`).
- **Alıcı:** Expo (650 Industries, Inc.), ABD. Expo alt işleyen sayfası (arama sonucu, 7 Ağu 2023): AWS (ABD), Slack, Stripe, Twilio (https://expo.dev/privacy/subprocessors). Yasal metin "ABD" diyor (`gizlilik-politikasi.md:98`).

### 4. Google FCM (Android push'un taşıyıcısı)

- **Çıkan:** Expo, FCM'e cihaz token'ı + bildirim başlığı/metni + data iletir; cihaz FCM'e Google Play Hizmetleri üzerinden bağlanır.
- **Ayar:** `GOOGLE_SERVICES_JSON` varsa build'e eklenir (`apps/mobile/app.config.ts:143-156`; `google-services.json` git'te yok). FCM V1 anahtarı Expo paneline yüklenir (`docs/OPS.md` → "Push"). Ülke: Google (ABD/küresel) — **doğrulanamadı**.

### 5. Expo EAS Update (OTA)

- **Çıkan:** uygulama açılışında `https://u.expo.dev/9692ae9b-…` adresine güncelleme sorgusu (`app.config.ts:163`). İstek IP taşır; SDK runtime sürümü, platform ve kanal gönderir. Expo'nun güncelleme isteklerine kurulum kimliği eklediği SDK belgelerinden doğrulanmalı (koddan görünmüyor).
- **Alıcı:** Expo, ABD.

### 6. Expo EAS Build

- Kullanıcı verisi taşımaz. Build ortam değişkenleri (`EXPO_PUBLIC_*`, publishable key, Sentry DSN, PostHog proje anahtarı) EAS'ta durur (`docs/PILOT_RELEASE.md:140-150`). Kişisel veri: yok (yalnız geliştirici hesabı).

### 7. Sentry

- **Çıkan:** kullanıcı id'si (`apps/mobile/src/lib/errorReporting.ts:23-26`), hata mesajı ve yığın (telefon/koordinat regex'le silinir, `supabase/functions/_shared/pure/errorReporting.ts:22-27`), breadcrumb'lar (console ve ui.input atılır, ağ breadcrumb'ında yalnız method/status/sorgusuz URL, `:31-46`), Edge Function 5xx etiketi (`errorReporting.ts:35-41`). `ip_address: null` (`pure/errorReporting.ts:53`), `sendDefaultPii: false`, ekran görüntüsü ve görünüm ağacı kapalı, `tracesSampleRate: 0` (`errorReporting.ts:11-20`).
- **Silinmeyen:** SDK'nın varsayılan cihaz/işletim sistemi/uygulama bağlamı (`contexts`) `scrubEvent`'te ele alınmıyor; ayrıca bağlantının kendisi IP taşır (Sentry `ip_address: null`'ı saklamama talimatı sayar; panelde "Prevent Storing of IP Addresses" ayrıca açılabilir, `docs/PILOT_RELEASE.md:156`).
- **Anahtar:** `EXPO_PUBLIC_SENTRY_DSN` yoksa hiçbir şey gönderilmez (`errorReporting.ts:7,10`). Build'e girer (EAS ortamı).
- **Bölge:** DSN repoda yok; yasal metin "Almanya" diyor (`gizlilik-politikasi.md:100`). **Doğrulanamadı**: DSN'in host'u `…ingest.de.sentry.io` ise AB (Frankfurt) bölgesidir; `…ingest.us.sentry.io` ya da `…ingest.sentry.io` ise ABD. EAS `production` ortamındaki DSN'e bakılmalı. Şirket: Functional Software, Inc. (ABD).

### 8. PostHog

- **Uygulamadan çıkan:** distinct id = kullanıcı id'si (`apps/mobile/src/lib/analytics.ts:78-81`), olay adları ve izinli özellikler (`supabase/functions/_shared/pure/analytics.ts`, katalog `ALLOWED`; mekan, metin, cinsiyet yok), SDK'nın varsayılan özellikleri (cihaz modeli, OS, uygulama sürümü, dil, saat dilimi, anonim cihaz kimliği — SDK davranışı, koddan değil) ve bağlantının IP'si. `disableGeoip: true`, session replay ve yaşam döngüsü olayları kapalı (`analytics.ts:31-42`). Kullanıcı Ayarlar → Gizlilik'ten kapatabilir, tercih okunmadan hiçbir şey gitmez (`analytics.ts:15-25,46-52`).
- **Sunucudan çıkan:** hesap silmede kullanıcı id'siyle kişi arama ve silme (`supabase/functions/_shared/posthog.ts:13-33`), varsayılan `https://eu.posthog.com` (`pure/analytics.ts:152`).
- **Host:** `EXPO_PUBLIC_POSTHOG_HOST ?? 'https://eu.i.posthog.com'` (`analytics.ts:13`) — kodda AB varsayılan; EAS ortamında üzerine yazılıp yazılmadığı **doğrulanamadı**. IP saklama: panelde "Discard client IP data" açık olmalı (`docs/PILOT_RELEASE.md:156`) — **panelden bakılmalı**. Şirket: PostHog Inc. (ABD) — AB bulutunda bile sözleşme tarafı ABD'li olabilir; doğrulanmadı.
- **Anahtar:** `EXPO_PUBLIC_POSTHOG_KEY` yoksa hiçbir şey (`analytics.ts:12,30`); sunucu tarafı `POSTHOG_PERSONAL_API_KEY`/`POSTHOG_PROJECT_ID` yoksa atlanır (`posthog.ts:14-16`).

### 9. Harita karoları: OpenFreeMap

- **Çıkan:** IP + istenen stil/karo adresleri (bakılan harita bölgesi ve yakınlık). Kullanıcının konumu gösterilmez ve gönderilmez (kural 6; `ExploreMap.tsx`'te konum katmanı yok).
- **Dosya:** `apps/mobile/src/features/explore/ExploreMap.tsx:45-50` (`https://tiles.openfreemap.org/styles/liberty` ve `/dark`), stil indirme `apps/mobile/src/features/explore/mapStyle.ts:22` (`fetch(url)`); yazı tipleri ve sprite stil dosyasının gösterdiği adreslerden gelir.
- **Anahtar:** `EXPO_PUBLIC_MAP_STYLE_URL`, `EXPO_PUBLIC_MAP_STYLE_URL_DARK` (`ExploreMap.tsx:48-49`) — başka bir karo sunucusuna çevrilebilir.
- **Alıcı:** OpenFreeMap (bireysel işletilen açık proje). Gizlilik politikası: erişim kayıtlarında IP yok; hata kayıtlarında IP ve URL 7 gün; kötüye kullanımda 30 güne kadar IP kaydı (https://openfreemap.org/privacy/). Sunucu ülkesi ve önünde CDN olup olmadığı **doğrulanamadı**. MapLibre'nin kendi telemetrisi yok (kütüphane düzeyinde; kodda ayrı istek yok).

### 10. Web sitesi: Cloudflare ve Google Fonts

- **Cloudflare:** `skall.world` statik site (`wrangler.jsonc`), ziyaretçinin IP'si ve istek bilgisi. Uygulama kullanıcı verisi göndermez (uygulama yasal metinleri kendi içinde gösterir, `docs/OPS.md` → "Yasal sayfalar" madde 4; dış bağlantılar `apps/mobile/src/components/LegalText.tsx:20,55` yalnız tıklanınca).
- **Google Fonts:** yok. Poppins (SIL OFL) siteden sunulur: `web/fonts/`, `web/site.css` başındaki `@font-face`. Ana sayfa, 404 ve yasal sayfalar dış istek yapmaz. Site analitiği/çerez yok (`grep` boş; `gizlilik-politikasi.md:137`).

### 11. Zoho (e-posta)

- **Kodda yok.** Yalnız adres `support@skall.world` (`supabase/functions/_shared/pure/legalEntity.ts`) ve yasal metin satırı (`gizlilik-politikasi.md:103`). MX kaydı bu oturumdan sorgulanamadı: **doğrulanamadı**.

### 12. Google Play / App Store

- Uygulama kodu Play'e veri göndermez; `appVersion.ts:36` yalnızca mağaza bağlantısı. Mağaza kendi verisini kendi politikasıyla işler (`gizlilik-politikasi.md:109`). Play Console'a geliştirici tarafından girilen: inceleme hesabının numarası ve kodu (`docs/PILOT_RELEASE.md` § 5), test kullanıcılarının e-postaları.

### 13. GitHub

- Kullanıcı verisi yok. CI yerel Supabase'e karşı çalışır; `dev-live.yml:42-44` dev projesinin test numarası ve kodu sır olarak; `deploy-dev.yml` dev projesine yayın. Üretim verisi yok. E2E görüntüleri test botlarının ekranları.

### 14. Kodda bulunup listede olmayanlar

- **Google Play Hizmetleri konum sağlayıcısı (expo-location):** Android'de cihazın konum servisi; koordinat uygulamada kalır, sunucuya gitmez (kural 6). Google'ın kendi işlemesi işletim sistemi düzeyinde. Bilgi notu.
- **OpenStreetMap Overpass** (`pnpm fetch:venues`, `docs/OPS.md:11`): yalnız geliştirici makinesinden mekan çekme; kullanıcı verisi yok.
- **Maestro indirmesi** (`e2e.yml:241`): CI aracı; kullanıcı verisi yok.
- **Apple APNs:** yasal metinde var; iOS yayını ilk sürümde yoksa akış yok.

---

## B) Gereklilik ve en az işli yol

| Servis | İlk sürüm (pilot + Play) | Kapatılırsa kaybolan | Kişisel verisiz/az veriyle yol | Kodda anahtar | Değişiklik boyu |
| ---------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| Supabase | Zorunlu | Uygulamanın tamamı | Proje bölgesi AB; Edge Functions'ı `eu-central-1`'e sabitle | Yok (bölge) | Küçük PR: `api.ts:116`'da `region: FunctionRegion.EuCentral1` (ve `broadcast.ts` gibi sunucu içi çağrılar zaten aynı projeye) |
| Netgsm | Zorunlu (gerçek SMS girişi) | Telefonla giriş | — (yurt içi) | `SMS_PROVIDER` | Yok |
| Expo push + FCM | Zorunlu değil (push isteğe bağlı, `docs/OPS.md` "Push (isteğe bağlı…)") | DM, arkadaşlık, davet, katılma isteği bildirimleri; uygulama içi gelen kutusu kalır | Katılma isteği metninde ad yok, yalnız kişi sayısı (`pure/push.ts` → `joinRequestPush`); token ve IP yine gider | `google-services.json` yoksa Android push yok; `EAS_PROJECT_ID` sabit | Pilotta push kapatmak: `registerForPush` çağrısını kapatmak küçük PR + `google-services.json`'suz build (native, yeni build). Metni sabitlemek: tek satır |
| EAS Update (OTA) | Zorunlu değil ama "Hızlı yol" OTA'ya dayanıyor (CLAUDE.md "Çalışma şekli") | OTA ile düzeltme; her düzeltme yeni build + Play incelemesi | — (IP + kurulum bilgisi) | `updates.enabled` (`app.config.ts:163`) | Tek satır ama native: yeni build; operasyon yükünü artırır |
| EAS Build | Zorunlu (build yolu) | — | Kullanıcı verisi yok | — | — |
| Sentry | Zorunlu değil | Çökme raporları | Zaten az: id + scrub. Kullanıcı id'sini de kaldırmak mümkün (`setReportingUser`) | `EXPO_PUBLIC_SENTRY_DSN` yoksa kapalı (`errorReporting.ts:7`) | Pilotta kapatmak: EAS ortamından DSN'i silmek (kod yok, yeni build ya da OTA ile env) ; AB bölgesi: DSN'i AB projesinden almak |
| PostHog | Zorunlu değil | Ürün istatistikleri | — | `EXPO_PUBLIC_POSTHOG_KEY` yoksa kapalı (`analytics.ts:12`); sunucu sırları yoksa silme atlanır | Pilotta kapatmak: EAS'tan anahtarı silmek; yasal metinden satırı çıkarmak (metin + onay sürümü, küçük PR) |
| OpenFreeMap | Keşfet haritası için gerekli; liste görünümü haritasız çalışır (`explore_viewed: list | map`) | Harita görünümü | IP gider; başka sunucuya `EXPO_PUBLIC_MAP_STYLE_URL` ile çevrilebilir (kendi barındırma büyük iş) | `EXPO_PUBLIC_MAP_STYLE_URL(_DARK)` | Haritayı pilotta gizlemek küçük PR (ürün kararı) |
| Cloudflare | Zorunlu (Play gizlilik ve hesap silme bağlantısı) | Yasal sayfaların web adresi | Yalnız ziyaretçi IP'si | — | — |
| Google Fonts | Kaldırıldı | Yok: Poppins siteden sunulur (`web/fonts/`, SIL OFL; yapıldı, PR #675) | — | — | — |
| Zoho | E-posta iletişimi için (yasal metin adres veriyor) | Destek e-postası | Kodda yok | — | Operasyonel |

---

## C) Sağlayıcı araştırması (bulunan, yorum katmadan)

### Supabase

- **Hukuki kimlik:** Supabase, Inc.; ana şirket ABD Delaware (üçüncü taraf sayfa; resmî sözleşmeden doğrulanmalı). Bölgeler: Frankfurt `eu-central-1` dahil AB bölgeleri var (repo bunu kullanıyor).
- **DPA:** https://supabase.com/legal/dpa ; PDF'ler https://supabase.com/downloads/docs/Supabase+DPA+260601.pdf (ve 260317). PDF'teki ifade (arama özeti): DPA "Customer signs or otherwise agrees" tarihinden itibaren sözleşmenin parçası olur; üçüncü taraf bir blog DPA'nın şartlar kabul edilince bağladığını ve tek tek imzalanmadığını söylüyor (https://complydog.com/blog/is-supabase-gdpr-compliant) — resmî olarak doğrulanmadı.
- **Alt işleyenler:** https://supabase.com/legal/subprocessors (12 Ekim 2026 güncellemesi görünüyor), PDF https://supabase.com/legal/subprocessor-list/June-1-2026.pdf; veri yeri SSS https://supabase.com/legal/privacy-resources/data-residency-and-transfers-faq.
- **KVKK standart sözleşmesi:** Supabase'in Kurul'un standart sözleşmesini imzaladığına dair resmî bir açıklama ya da örnek **bulunamadı**. Benzer bir sağlayıcıda (Railway) kullanıcılar bu talebi açmış, yanıt yok: https://station.railway.com/feedback/turkish-kvkk-standard-contract-control-f69432fc .

### Türkiye süreci (KVKK m. 9, Yönetmelik)

- Standart sözleşme metni **değiştirilmeden** kullanılır; yabancı dil sürümünde Türkçe metin esas; imzalardan sonra **5 iş günü** içinde Kurum'a fiziki, KEP ya da Standart Sözleşme Bildirim Modülü ile bildirilir; imzalayanların yetki belgeleri eklenir; Şubat 2025 duyurusuna göre iki tarafın imza tarihleri metinde yer almalı (Yönetmelik m. 14 metni: https://prighter.com/resources/laws/turkish-kvkk/by-laws/the-procedures-and-principles-for-the-transfer-of-personal-data-abroad/articles/article-14 ; modül duyurusu: https://www.mondaq.com/turkey/data-protection/1539716/the-standard-contract-notification-module-launched ; Şubat 2025 duyurusu: https://www.mondaq.com/turkey/data-protection/1583232/public-announcement-on-key-considerations-for-standard-contracts-in-cross-border-personal-data-transfers-issued ; Kurum sayfası (bu oturumda açılamadı): https://kvkk.gov.tr/Icerik/7929/Standart-Sozlesmeler).
- Standart sözleşme Kurul onayı gerektirmez (bağlayıcı şirket kurallarından farkı); bildirim yükümlülüğü ayrı.
- **Yeterlilik kararı:** Kurul'un ilan ettiği bir ülke listesi bulunamadı (EY rehberi: "henüz yayımlanmadı"; tarihi belirsiz). Bu, Almanya/AB'deki sağlayıcıların da m. 9 kapsamında "yurt dışı" sayılacağı anlamına gelir; yasal metinler de buna göre yazılmış (`gizlilik-politikasi.md:105`, `kvkk-aydinlatma-metni.md:40`).
- **Arızi aktarım (m. 9/6, Yönetmelik m. 16/2):** Kurum sayfasının ifadesi (arama özeti): arızi aktarım "sadece Kanunun 9 uncu maddesinin altıncı fıkrası ve Yönetmeliğin 16 ncı maddesinin ikinci fıkrasında sayılan hallerden birinin varlığı halinde mümkündür" (https://www.kvkk.gov.tr/Icerik/2053/Yurtdisina-Aktarim). Haller arasında: risklerden bilgilendirilmiş açık rıza; veri sorumlusu ile ilgili kişi arasındaki sözleşmenin ifası için zorunluluk. Rehbere dayanan kaynaklar: "olağan faaliyet akışı içinde yapılan aktarımlar arızi aktarım olarak kabul edilmemektedir" (https://mihci.av.tr/kisisel-verilerin-yurt-disina-aktarilmasi/). Bir uygulamanın her kullanımda yaptığı aktarım bu tanıma girmiyor gibi okunuyor; kesin yorum hukukçunun.
- Küçük veri sorumlusu için başka resmî yol: **bulunamadı**.

### Expo (650 Industries)

- Alt işleyen sayfası https://expo.dev/privacy/subprocessors (7 Ağu 2023): AWS (ABD), Slack, Stripe, Twilio. Expo DPA'sı ya da KVKK standart sözleşmesi: **bulunamadı**.

### Google / FCM

- Bu oturumda araştırılmadı (ağ sınırı); Firebase'in veri işleme şartları Firebase konsolunda kabul edilir. KVKK standart sözleşmesine dair Google açıklaması: **bulunamadı**.

### Netgsm

- Türkiye şirketi; yurt dışı aktarım değil. Veri işleyen sözleşmesi (KVKK m. 12) ayrı konu: **araştırılmadı**.

---

## D) Hukukçu soruları

1. AB'de (Frankfurt) barındırılan ama sözleşme tarafı ABD şirketi olan sağlayıcı (Supabase Inc., PostHog Inc., Functional Software Inc.) için standart sözleşmenin tarafı ve modülü (veri sorumlusu → veri işleyen) hangisidir?
2. Sağlayıcı standart sözleşmeyi değiştirilmeden imzalamazsa, tıklamayla kabul edilen GDPR DPA'sı/SCC ile yapılan aktarım KVKK'ya göre hangi durumda kalır ve geçici olarak ne yapılmalı?
3. Push bildirimi (Expo → FCM), OTA sorgusu ve harita karosu gibi yalnız IP ve cihaz token'ı taşıyan akışlar standart sözleşme gerektiren "kişisel veri aktarımı" mıdır?
4. Bireysel ve ücretsiz kullanılan açık servisle (OpenFreeMap; Google Fonts artık kullanılmıyor, Poppins siteden sunulur) sözleşme imzalamak mümkün değilken bu akış için hangi dayanak kullanılabilir, yoksa kaldırılmalı mı?
5. Uygulamanın her kullanımda yaptığı aktarımlar için m. 9/6'daki "sözleşmenin ifası için zorunlu" hali "arızi" şartını karşılar mı?
6. Netgsm ile yurt içinde ayrıca veri işleyen sözleşmesi (m. 12) yapılması gerekir mi, Netgsm'in standart abonelik sözleşmesi yeterli mi?

## E) Doğrulanamayanlar (panelden bakılacak)

- Supabase üretim ve dev projelerinin gerçek bölgesi (Settings → General / Infrastructure); Edge Functions'ın hangi bölgede çalıştığı (fonksiyon logları, `x-sb-edge-region` yanıt başlığı).
- Üretimde Send SMS Hook'un açık olduğu (kapalıyken Twilio'ya numara gider).
- EAS `production` ortamındaki `EXPO_PUBLIC_SENTRY_DSN` host'u (`ingest.de.sentry.io` mı) ve Sentry kuruluşunun veri bölgesi; "Prevent Storing of IP Addresses".
- EAS ortamında `EXPO_PUBLIC_POSTHOG_HOST` üzerine yazılmış mı; PostHog projesinin AB bulutunda olduğu; "Discard client IP data"; saklama süresi.
- `EXPO_PUBLIC_MAP_STYLE_URL(_DARK)` EAS'ta başka bir adrese ayarlanmış mı.
- `skall.world` MX kaydı (Zoho mu, hangi veri merkezi: zoho.eu / zoho.com).
- Firebase projesinin bölgesi ve FCM V1 anahtarının Expo'daki projesi.
- Supabase'in, Expo'nun, Sentry'nin ve PostHog'un sözleşme tarafı şirket ve ülkesi (imzalanan DPA'lardan).
