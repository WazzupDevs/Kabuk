# Kapalı beta hazırlık raporu (iOS TestFlight + Google Play kapalı test)

8 Kasım 2026 · `main` `a32bfc6` · Dış denetim raporunun (8 Kasım) repoya karşı doğrulaması.
Kapsam: kodu, belgeleri ve CI kayıtlarını kapsar. Play Console, App Store Connect, canlı Supabase ve EAS hesapları bu oturumdan görülemez.

## 1. Rapordaki iddiaların doğrulaması

| #   | İddia                                                                           | Sonuç                                     | Kanıt                                                                                                                                                                                                                                                           |
| --- | ------------------------------------------------------------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | iOS'ta "Güncelle" Google Play'e gider                                           | **Doğru**                                 | `apps/mobile/src/lib/appBuild.ts` → `updateUrl()` platforma bakmaz                                                                                                                                                                                              |
| 2   | Android ve iOS tek `MIN_APP_BUILD` eşiğini paylaşır                             | **Doğru, kapalı beta için en ciddi hata** | `_shared/http.ts:126`, `pure/appVersion.ts`; `eas.json` → `appVersionSource: remote` + `autoIncrement`: EAS iki platforma ayrı sayaç tutar. İlk iOS build'i 1 olur; üretimde `MIN_APP_BUILD` > 1 ise her iOS çağrısı `update_required` alır ve uygulama açılmaz |
| 3   | Onay sürümleri `draft-1` / `draft-3`                                            | **Doğru**                                 | `pure/consent.ts`                                                                                                                                                                                                                                               |
| 4   | Yasal metinler taslak, köşeli parantezli alanlar boş                            | **Doğru**                                 | `docs/legal/*.md` (veri sorumlusu, e-posta, saklama süreleri); uygulama içi `LegalText` taslak notu gösterir                                                                                                                                                    |
| 5   | `PILOT_RELEASE.md` 0.3.0 → 0.4.0 anlatıyor, sürüm 0.9.6                         | **Doğru**                                 | `docs/PILOT_RELEASE.md:128-141`, `app.json` → `0.9.6`                                                                                                                                                                                                           |
| 6   | 25 fonksiyonda `verify_jwt = false`                                             | **Doğru, açık değil**                     | 25 fonksiyonun hepsi `requireUser` (ya da `_shared/say.ts` üzerinden) çağırıyor; `ping` kimlik istemiyor (sağlık denetimi)                                                                                                                                      |
| 7   | Gece E2E kırmızı                                                                | **Doğru**                                 | `docs/PROGRESS.md`: 6–8 Kasım kırmızı; PR koşuları `skipped` (hızlı yol). P0 düşüşü (`02-checkin.yaml` → "E2E Kafe İki") kök nedeni çözülmedi                                                                                                                   |
| 8   | Aktif mekanlar: SAÜ Esentepe ve İGÜ Tower; 43 pilot kafe ve 2 test mekanı pasif | **Doğru**                                 | `content/venues-*.json`; SAÜ'nün 3 noktası pasif, İGÜ'de nokta yok                                                                                                                                                                                              |
| 9   | Play kontrol listesinde görünen ad tutarsızlığı                                 | **Kısmen doğru**                          | Sunucuda `displayName` isteğe bağlı (`account/index.ts:28`); Veri güvenliği tablosu "isteğe bağlı" diyor, kayıt akışı ad soruyor. Kayıt ekranındaki gerçek davranışa göre beyan seçilmeli                                                                       |
| 10  | Sentry kaynak haritası üretimde yüklenmiyor                                     | **Doğru**                                 | `eas.json` → `production.env.SENTRY_DISABLE_AUTO_UPLOAD: "true"`                                                                                                                                                                                                |
| 11  | `version` artırma insan hatasına açık                                           | **Doğru**                                 | CI'da native değişiklik ↔ `version` denetimi yok                                                                                                                                                                                                                |
| 12  | Mağaza ekran görüntüleri 320×640'tan büyütülmüş                                 | **Doğru**                                 | `PLAY_CHECKLIST.md` → mağaza görselleri                                                                                                                                                                                                                         |

## 2. Raporun atladıkları (yeni bulgular)

1. **İnceleme talimatı eskimiş.** `docs/store/PLAY_CHECKLIST.md` → 3.3 incelemeciye "Beylikdüzü'ndeki ortak mekan" ve "300 m" diyor. Bugün pilot kafelerin hepsi pasif; aktif yerler iki kampüs (sınır içi + 50 m). Metin ve video bugünkü akışa göre yeniden yazılmalı.
2. **Kaupholl üretimde soru olmadan açık.** `content/games.json` → `kaupholl.available: true`; gerçek sorular üretime aktarılmadı (`PROGRESS.md`, 6 Kasım). Betada masa Kaupholl'u seçerse oyun başlamaz. Beta öncesi ya sorular `pnpm admin:kaupholl-import` ile yüklenir ya da `available: false` yapılır.
3. **Hiç iOS build alınmadı.** CI'da iOS derlemesi yok (`apk.yml` yalnız Android). İlk TestFlight build'i iOS'ta ilk derlemedir. İyi haber: `skall-glass` yalnız Android (`expo-module.config.json`) ve JS tarafı her yerde `Platform.OS === 'android'` ile korunuyor; iki yama (`react-native-svg`, `expo-notifications`) yalnız Android dosyalarına dokunuyor. Yani iOS'ta çökme beklenmiyor, ama Android'deki performans düzeltmeleri (SVG önbelleği, gölge, bildirim ikonları) iOS'ta yok: iOS'ta Kapsülünü süsle, profil ve listeler ayrıca denenmeli.
4. **Semte Git üretimde zaten kapalı** (`DISTRICT_VISIBLE`); betaya engel değil.
5. **Kapalı oyunlar:** İbre, Harf Kapmaca, Şarkıda Geçsin, Sohbet kartları `available: false`. Betadaki katalog: Vampir Köylü, Kibrit, Kapsül Anlat, Signum, Sahtekar, Sprengja (+ Kaupholl kararı).
6. **iOS'ta gizlilik bağlantısı:** `EXPO_PUBLIC_PRIVACY_URL` ve `EXPO_PUBLIC_CONTACT_EMAIL` EAS `production` ortamında yoksa uygulama içi taslak metin görünür (`docs/OPS.md:93`). Apple uygulama içinde gizlilik bağlantısı ister.
7. Kayıt ekranında açık rıza ile aydınlatma aynı onay kutusunda; hukukçuya ayrıca sorulmalı (rapordaki not doğru).

## 3. Kapalı beta için yapılacaklar

### A. Kod (build'den önce, tek PR)

- [ ] **Platforma göre zorunlu güncelleme:** istemci `x-app-platform` başlığını gönderir; sunucu `MIN_APP_BUILD_ANDROID` / `MIN_APP_BUILD_IOS` okur, eski `MIN_APP_BUILD` Android için geri uyumlu kalır; başlıksız eski istemci Android sayılır. `updateUrl()` iOS'ta App Store adresine (`EXPO_PUBLIC_IOS_STORE_URL` ya da TestFlight bağlantısı) gider. `appVersion.test.ts` iki platformla. Bu yapılana kadar üretimde `MIN_APP_BUILD` 0 tutulmalı.
- [ ] Kaupholl kararı: soruları yükle ya da `available: false` + `pnpm seed`.
- [ ] `PLAY_CHECKLIST.md` 3.3 ve `PILOT_RELEASE.md` sürüm bölümünü bugüne göre güncelle.
- [ ] Gece E2E'nin P0 düşüşünü (check-in, "E2E Kafe İki") düzelt; kabul için bir yeşil gece koşusu.

### B. Yasal (kapalı beta için de gerekli)

- [ ] `docs/legal/` köşeli parantezleri doldur (veri sorumlusu, iletişim e-postası, saklama süreleri, yurt dışı aktarım: Supabase, PostHog AB, Sentry, Expo/FCM/APNs).
- [ ] Onay sürümlerini artır (`consent.ts`), uygulama içi metni yayımlanan sayfaya bağla, "Taslak" notunu kaldır. Hukuki onay bitmeden en azından metinler eksiksiz ve doğru olmalı; Play ve Apple kapalı testte de gizlilik URL'si ister.

### C. EAS ve hesaplar (proje sahibi)

- [ ] EAS `production` ortamı: `EXPO_PUBLIC_SUPABASE_URL`, `..._PUBLISHABLE_KEY` (üretim), `EXPO_PUBLIC_PRIVACY_URL`, `EXPO_PUBLIC_CONTACT_EMAIL`, `EXPO_PUBLIC_SENTRY_DSN`, `EXPO_PUBLIC_POSTHOG_KEY`, `GOOGLE_SERVICES_JSON`.
- [ ] iOS: `eas credentials` ile dağıtım sertifikası, provisioning ve **APNs anahtarı** (push için şart); `eas build -p ios --profile production`, `eas submit -p ios`. `eas.json` → `submit.production.ios` boş: `ascAppId` eklenmeli.
- [ ] Sentry kaynak haritaları: `SENTRY_AUTH_TOKEN` EAS sırrı olarak eklenip `SENTRY_DISABLE_AUTO_UPLOAD` production'da kaldırılır (repoya token girmez).
- [ ] Üretim projesi: migration'lar ve 25 fonksiyon güncel, `CHECKIN_SKIP_LOCATION` yok, test botları kapalı, `MIN_APP_BUILD` = 0, SMS sağlayıcısı TR numarada çalışıyor, inceleme numarası tanımlı.

### D. Mağaza tarafı

**TestFlight**

- [ ] Önce **dahili test** (App Store Connect kullanıcıları, en çok 100; Beta App Review yok).
- [ ] Harici test için Beta App Review: inceleme numarası + kod (yalnız App Store Connect'e), giriş adımları, konum açıklaması ve check-in sonrası akış videosu. Test bilgisi, geri bildirim e-postası, gizlilik URL'si.

**Play kapalı test**

- [ ] Dahili test kanalında ilk AAB (`submit.production.android.track: internal`).
- [ ] Kapalı test (alpha) kanalı; kişisel hesapsa **12+ test kullanıcısı, 14 gün kesintisiz**. Sayaç ilk kapalı test yayınıyla başlar: mümkün olan en erken gün açılmalı.
- [ ] Uygulama içeriği: gizlilik URL'si, hesap silme URL'si, veri güvenliği (ad beyanını kayıt akışına göre düzelt), hedef kitle 18+, UGC beyanı, uygulama erişimi (güncel metin).

### E. Beta kapsamı ve kabul

- [ ] Beta kampüsü: SAÜ Esentepe mi, İGÜ Tower mı, ikisi mi? Testçiler oradan seçilmeli (konum zorunlu). İGÜ sınırı sahada doğrulanmadı.
- [ ] Gerçek cihaz turu, her platformda en az 2 telefon, tercihen 4: kayıt (SMS), check-in, masa kurma/katılma, her açık oyundan bir tur, arkadaş ekleme, DM, push, şikayet/engelleme, hesap silme.
- [ ] iOS'a özgü: klavye ve sohbet, kapsül çizimlerinde akıcılık, harita, fotoğraf yükleme (HEIC → JPEG, metadata silme), bildirim izni.
- [ ] Moderasyon: şikayetleri kimin, ne sıklıkla okuyacağı ve `pnpm admin:ban` kullanımı yazılı olsun.

## 4. Karar

- **Dahili test (TestFlight dahili, Play dahili):** A'daki zorunlu güncelleme düzeltmesi ya da üretimde `MIN_APP_BUILD = 0` ve C maddeleriyle **hemen çıkılabilir**.
- **Harici TestFlight ve Play kapalı test:** A + B + C + güncel inceleme talimatı tamamlanınca.
- **Herkese açık yayın:** hukuki onay, E2E ve görsel kabul yeşil, beta geri bildirimleri kapanmış olmalı. Bugün değil.
