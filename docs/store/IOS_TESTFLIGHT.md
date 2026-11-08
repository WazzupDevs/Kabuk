# iOS: TestFlight'a ilk build (test için)

Amaç: uygulamayı iPhone'da TestFlight'tan kurup dev projesine karşı test etmek. Üretim projesine ve App Store incelemesine dokunmaz.

## Bu build ne?

- Profil `testflight` (`apps/mobile/eas.json`): `preview` profilinin aynısı, yalnızca dağıtımı mağaza (`distribution: store`). Bu yüzden:
  - **dev projesine** bağlanır (EAS `preview` ortamı: APK'larla aynı URL ve anahtar; yeni değişken gerekmez),
  - **`preview` kanalını** dinler: main'e her birleşmede `deploy-dev` OTA'sı iPhone'a da gider (OTA iki platforma da yayınlanır),
  - giriş yalnızca dev projesinin panelindeki **test numaralarıyla** olur, SMS gitmez,
  - dev projesinde `CHECKIN_SKIP_LOCATION` açıksa check-in kampüs dışında da yapılır.
- iOS build numarası Android'den ayrı bir sayaçtır; ilk build 1 olur. Zorunlu güncelleme eşiği iOS için `MIN_APP_BUILD_IOS`'tur, Android'in `MIN_APP_BUILD`'i iPhone'u kapatmaz.
- Android'e özel yerel modül (`skall-glass`) ve iki yama iOS'ta devre dışıdır: gölge, cam ve gezinme çubuğu iOS'ta yazılım yoluyla çizilir.

## Bir kez: hazırlık

1. Apple Developer üyeliği etkin olmalı, App Store Connect'te `app.kabuk.mobile` paket kimliğiyle uygulama kaydı açılmış olmalı (Apps → + → New App). Uygulama sayfasındaki **Apple ID** (sayı, ör. `6741234567`) bir kenara yazılır.
2. Bilgisayarda repo güncel olmalı:

```bash
git checkout main
```

```bash
git pull
```

```bash
pnpm install
```

## 1. Build

`apps/mobile` klasöründe:

```bash
pnpm dlx eas-cli build --platform ios --profile testflight
```

İlk seferde EAS sorular sorar; hepsine EAS'ın yönetmesini seçin:

- **Apple hesabına giriş:** Apple ID ve parola, iki adımlı doğrulama kodu. Birden fazla ekip varsa doğru ekibi seçin.
- **Distribution Certificate** ve **Provisioning Profile:** "Generate a new …" → Evet.
- **Push Notifications** anahtarı: "Set up Push Notifications?" → **Evet** (APNs anahtarı; bildirimler bu olmadan iPhone'a gitmez).
- Build numarası için başlangıç değeri sorulursa 1.

Build EAS sunucusunda yaklaşık 15–30 dakika sürer. Bağlantı terminalde ve expo.dev'de görünür. Hata alırsanız günlüğün son satırlarını buraya yapıştırın.

## 2. App Store Connect'e gönderme

```bash
pnpm dlx eas-cli submit --platform ios --profile testflight --latest
```

- Uygulamayı sorarsa 1. adımdaki Apple ID'yi girin.
- "App Store Connect API Key" oluşturmayı önerirse Evet deyin; EAS anahtarı kendi saklar ve sonraki gönderimler parolasız olur.

Gönderimden sonra App Store Connect → uygulama → **TestFlight** sekmesinde build "Processing" görünür, 5–30 dakikada hazır olur. Şifreleme sorusu çıkmaz (`app.json` → `usesNonExemptEncryption: false`).

## 3. Kendi iPhone'una kurma (dahili test)

1. App Store Connect → TestFlight → **Internal Testing** → + → grup oluşturun (ör. "Ekip"), kendinizi ekleyin. Dahili test Apple incelemesine girmez; App Store Connect'te rolü olan en çok 100 kişi eklenebilir.
2. Gruba build'i ekleyin.
3. iPhone'a App Store'dan **TestFlight** uygulamasını kurun, aynı Apple ID ile açın, gelen davetle skall'ı kurun.

## 4. İlk deneme listesi (iPhone)

- [ ] Açılış perdesi ve ilk ekran, "Başla" ve onaylar
- [ ] Test numarası ve kodla giriş, ad, doğum tarihi, cinsiyet, fotoğraf (galeri ve kamera izni)
- [ ] Bildirim izni sorusu ve bir bildirimin gelmesi (ör. arkadaşlık eşleşmesi)
- [ ] Keşfet, harita, mekan sayfası, check-in (konum izni)
- [ ] Masa kurma, Android telefondan katılma, bir oyun turu (iki platform birlikte)
- [ ] Masa ve mekan sohbeti, DM: klavye açılınca giriş alanı ve son mesaj görünüyor mu
- [ ] Profil, Kapsülünü süsle, kapak: akıcılık
- [ ] Ayarlar → yasal metinler, engellenenler, Hesabımı sil (ayrı bir test numarasıyla)
- [ ] Açık ve koyu tema, büyük yazı boyutu

Bulduğunuz her şeyi tek görüntü ve kısa notla iletin; JS düzeltmeleri OTA ile iPhone'a gider, yeni build gerekmez.

## Sonra: harici test ve App Store

- Harici testçiler (Apple hesabı olmayan kişiler) için TestFlight → External Testing; ilk build **Beta App Review**'a girer: inceleme hesabı, giriş adımları ve konum açıklaması gerekir (`docs/denetim/kapali-beta-2026-11-08.md`).
- Gerçek kullanıcılar ve App Store için `production` profiliyle (üretim projesi) ayrı build alınır; üretim yayını proje sahibinindir (`docs/PILOT_RELEASE.md`).
