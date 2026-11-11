# Kurulum öncesi inceleme (Phase 0, 11 Kasım 2026)

Salt okunur inceleme, main `5eb15b9`. "Gördüm" dosyayı ya da komut çıktısını okudum demektir; sayılar o günün sayımıdır.

## Mevcut yapı

| Konu               | Bulgu (gördüm)                                                                                                                                                |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Depo               | pnpm monorepo: `apps/mobile`, `supabase/`, `scripts/`, `content/`, `web/`, `e2e/`, `docs/`                                                                    |
| Uygulama           | Expo ~57, expo-router ~57, React Native 0.86, React 19, NativeWind 4, Reanimated 4.5, Skia 2.6.2 (`apps/mobile/package.json`)                                 |
| Rotalar            | `app/(auth)`, `app/(onboarding)`, `app/(app)` (sekmeler, check-in, oda, sohbetler, ayarlar), `gorsel` (görsel kapı), `design-preview` (Bileşen önizleme)      |
| Ajanlar            | Dört: `mimar`, `mobil`, `guvenlik`, `performans`; biçim: `name`, `description`, `tools`, `model` ön bilgisi ve gövde                                          |
| Skill'ler          | Altı: `e2e`, `pr-akisi`, `supabase-ops`, `telegram-referans`, `tuval-aktarim`, `yayin`                                                                        |
| Hook'lar           | Bash öncesi yasak komut kapısı, yazma sonrası Prettier (`.claude/settings.json`)                                                                              |
| Ürün belgesi       | `docs/SPEC_V4.md` (1756 satır), `docs/SPEC_V3.md` (2572 satır)                                                                                                |
| Kararlar           | `docs/decisions/` altında 70 dosya; eskileri `docs/arsiv/DECISIONS.md`                                                                                        |
| Açık işler         | `docs/PROGRESS.md` (devir notu başında), `docs/denetim/uctan-uca-2026-11.md`                                                                                  |
| Tasarım            | Aura tuvali ve aktarım raporları `docs/design/aura/`; `docs/design/sistem/`; tokenlar `apps/mobile/src/theme/`                                                |
| Önizleme araçları  | Bileşen önizleme (setler `features/design/previews.tsx`), Çizim ölçümü paneli, görsel kapı (`features/design/gorsel/registry.tsx`, `e2e/visual/states.json`)  |
| Kapsül             | Çizim kitaplığı ve katalog `docs/design/kaynak/kapsul/`; `content/capsule-catalog.json` (173 parça, 23 göz, 16 renk); `content/gift-packs.json` (67 aksesuar) |
| Aksesuar çizimleri | Ayrı SVG dosyaları değil: `apps/mobile/src/theme/capsuleAccessories.ts` → `ACCESSORY_ART` içinde metin; hareketler `capsuleFx.ts` → `FX`                      |
| Test               | vitest (187 dosya, 3617 test), entegrasyon testleri CI'da yerel Supabase'e karşı, Maestro E2E ve görsel kapı gece koşusunda                                   |
| Cihaz              | Bu bulut ortamında telefon ve emülatör yok; telefon ölçümü proje sahibinin yerel oturumuyla, emülatör yalnız CI'da (`e2e.yml`)                                |
| Storybook          | Yok                                                                                                                                                           |

## Denetim çalışmaları (M1–M15)

- `docs/denetim/uctan-uca-2026-11.md`: M1–M14 tamamlandı (10 Kasım; devir notu "denetim kapandı"), yol haritası Y1–Y33 ve açık kararlar M14'te.
- **M15 de yapılmış:** aynı belgede "M15: Bütünsel frontend, UI ve UX denetimi (10 Kasım)": statik tarama, iki cihaz turu, ayrıntılı görsel tarama; bulgular M15-01 … M15-47; görüntüler `docs/denetim/kanit/m15/`. Kurulum isteğindeki "M15 henüz başlatılmayacak" bugünkü durumla uyuşmuyor.
- Bu kurulum denetim belgelerine dokunmadı; bulgular kopyalanmadı, `docs/skall-os/README.md` yerlerini gösterir. Hiçbir bulgu bu kurulumla "kapandı" sayılmadı.
- Öteki denetimler: `docs/denetim/performans-2026-11.md` (B1–B37), `docs/denetim/kapali-beta-2026-11-08.md`, `docs/PROGRESS.md` → "Canlı öncesi denetim" (A–F).

## Eksik olanlar

- Tasarım için ajan yok: ekran denetimi ve tasarım önerisi ana oturumda, yordamsız yapılıyordu.
- Kapsül ve aksesuar için ajan, yordam ve görsel kayıt yok: çizilmiş aksesuarların bilgisi katalog, çizim dosyası ve karar dosyaları arasında dağınıktı; tasarım gerekçeleri kayıtlı değildi.
- Bir önerinin alternatiflerini telefonda yan yana gösteren yer yok (Bileşen önizleme yalnız var olan bileşenleri gösteriyordu).
- Departmanlar arası yazılı teslim şablonu yok (aura aktarım raporları dışında).

## İstekle var olan düzen arasındaki çakışmalar

| #   | İstek                          | Var olan kural                                                                                     | Sonuç (proje sahibinin onayı, 11 Kasım)                     |
| --- | ------------------------------ | -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| 1   | M15 başlamadı sayılsın         | M15 yapılmış, bulguları belgede                                                                    | Olduğu gibi kaydedildi: yapıldı, bulguları açık             |
| 2   | Beş yeni ajan                  | "Yalnızca dört ajan, başka rol kullanılmaz" (30 Ekim, 9 Kasım)                                     | İki yeni ajan; üçünün işi var olan dört ajanda              |
| 3   | Birden çok ajan aynı anda      | "Aynı anda en çok bir ajan"                                                                        | Yalnız okuyanlar paralel, yazan tek                         |
| 4   | Push, merge ve deploy onayla   | Hızlı yol (27 Ekim): `ci` yeşilse Claude birleştirir, dev'e yayın otomatik                         | Hızlı yol kaldı; ek kapı yalnız tasarım onayı               |
| 5   | Tasarım yalnız UI Workshop'ta  | Yeni görünüşün kaynağı aura tuvali, var olanın kaynağı uygulama; `tuval-aktarim` zorunlu (8 Kasım) | Tuval kaynak kaldı; Atölye telefonda prototip ve onay adımı |
| 6   | Sekiz hafıza dosyası           | Aynı bilgiler bugün başka dosyalarda; istek de kopyayı yasaklıyor                                  | Yönlendiren tek dizin; beş dosya açılmadı                   |
| 7   | On skill                       | Altısının işi `tuval-aktarim`, `pr-akisi`, `e2e` ve belge şablonlarında                            | Dört yeni skill                                             |
| 8   | Gerçek cihaz ve emülatör testi | Bulut oturumunda cihaz yok                                                                         | Bugünkü yol: yerel oturum, CI'daki görsel kapı              |

## UI Workshop için teknik yaklaşım

| Seçenek                               | Değerlendirme                                                                                                                                 |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Bileşen önizlemeye yeni set (seçilen) | Bağımlılık yok; gerçek bileşen ve token; preview build'de telefonda; üretimde kapalı; görsel kapının `galeri/<set>` durumu olarak çekilebilir |
| Storybook (React Native)              | Yeni bağımlılıklar ve Metro ayarı; var olan önizlemenin yaptığını tekrarlar                                                                   |
| Ayrı Expo uygulaması                  | Yerel modüller (`skall-glass`, Skia, MapLibre) yüzünden ikinci native build; bileşenleri paylaşmak için paket ayrımı gerekir                  |
| HTML prototip                         | Bağımlılık yok ama gerçek bileşen değil; telefonda farklı çizilir (`docs/decisions/tuval-kaynak.md`'nin gerekçesi)                            |

Seçilenin bedeli: Atölye uygulamanın paketinde yaşar; "ana uygulamadan tam ayrı araç" değildir. Üretim akışına bağlı değildir: ekran `designPickerEnabled` kapalıyken ana sayfaya yönlenir.

## Riskler

- İki yeni ajan token harcar; `CLAUDE.md` → Token kuralları onlar için de geçerlidir (yalnız iş tanımı ve dosya yolları, kısa dönüş).
- Tasarım ajanları ekranı göremez: önerileri ve denetimleri "koddan"dır; telefonda bakılacaklar listesi vermeleri bu yüzden zorunlu.
- Aksesuar kaydının "Not" sütunu boş başlıyor; doldurulmazsa hafıza yalnız katalogun dökümü olarak kalır.
- Atölye kaydı (`registry.tsx`) bileşen çizdiği için birim testi onu okuyamıyor; kayıt hatası ekranda yazıyla görünür.
