# skall OS: departmanlar ve ortak hafıza

Kuruluş: 11 Kasım 2026, proje sahibinin onayıyla (`docs/decisions/skall-os.md`). Bu klasör bir dizindir: bilginin kendisi bugünkü kaynağında durur, burada yalnız nerede olduğu ve departmanların kendi notları tutulur. Aynı bilgi iki yere yazılmaz.

## Departmanlar

| Departman          | Ne yapar                                                             | Ajan                                                           | Hafızası                     |
| ------------------ | -------------------------------------------------------------------- | -------------------------------------------------------------- | ---------------------------- |
| UI/UX Studio       | Ekran denetimi, tasarım önerisi, Atölye'de prototip, tasarım teslimi | `ui-ux-studio`                                                 | `departments/UI_UX.md`       |
| Capsule Art Studio | Kapsül ve aksesuar tasarımı, çizim standardı, görsel kayıt           | `capsule-art-studio`                                           | `departments/CAPSULE_ART.md` |
| Engineering Studio | Uygulama, sunucu, performans, güvenlik, test                         | ana oturum, `mobil`, `mimar`; denetim `guvenlik`, `performans` | `departments/ENGINEERING.md` |

Ana oturum yöneticidir (orkestra): talebi alır, departmanı belirler, ajanın dönüşünü kendisi denetler, PR'ı açar. Kurallar `CLAUDE.md` → Çalışma şekli'ndedir; bu klasör onları tekrar etmez.

## Talep nereye gider

| Talep                                                       | Departman          | Yordam                                                            |
| ----------------------------------------------------------- | ------------------ | ----------------------------------------------------------------- |
| "Şu ekran kötü görünüyor", ekran incelemesi, tutarlılık     | UI/UX Studio       | `.claude/skills/ui-screen-audit`                                  |
| Yeni ekran ya da var olan ekranda görünüş değişikliği       | UI/UX Studio       | `.claude/skills/ui-workshop-workflow`, sonra `tuval-aktarim`      |
| Yeni aksesuar, kıyafet, kapsül parçası, set                 | Capsule Art Studio | `.claude/skills/capsule-accessory-design`, `svg-asset-validation` |
| Hata, çökme, yavaşlık, sunucu, veri, test                   | Engineering Studio | ana oturum; ekran işi `mobil`, büyük iş önce `mimar`              |
| `supabase/`, Realtime, gizlilik, değişmez kural             | Engineering Studio | birleşmeden önce `guvenlik`                                       |
| Birden çok departman (ör. yeni aksesuar yeni hareket ister) | Yönetici           | sırayla: tasarım departmanı, teslim belgesi, Engineering          |

Belirsiz talepte yönetici tek soru sorar (`CLAUDE.md` → "Proje sahibine ne zaman sorulur").

## Hafıza: hangi bilgi nerede

| Bilgi                                                   | Kaynak (tek yer)                                                                                            |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Ürün: içerik ve davranış                                | `docs/SPEC_V4.md`; değiştirmediği konuda `docs/SPEC_V3.md`                                                  |
| Değişmez kurallar, kod ve ekran kuralları, stack        | `CLAUDE.md`                                                                                                 |
| Kararlar ve gerekçeleri                                 | `docs/decisions/` (konu başına dosya); 30 Ekim'e kadarkiler `docs/arsiv/DECISIONS.md`                       |
| Açık iş ve devir notu                                   | `docs/PROGRESS.md`'nin başı                                                                                 |
| Denetim bulguları (M1–M15, açık kararlar, yol haritası) | `docs/denetim/uctan-uca-2026-11.md`; performans `docs/denetim/performans-2026-11.md`                        |
| Telefon ölçümleri ve protokol                           | `docs/denetim/olcum-protokolu.md`, ham çıktılar `docs/denetim/kanit/`                                       |
| Tasarım: tuval, aktarım raporları                       | `docs/design/aura/`; tuvalin çizmediği yerde `docs/design/sistem/`                                          |
| Tasarım değerleri                                       | `apps/mobile/src/theme/` (tokenlar), `src/theme/auraKit.ts` → `KIT`, hareket `src/theme/aura.ts` → `MOTION` |
| Kapsül çizimi ve kataloğu                               | `docs/design/kaynak/kapsul/`, `content/capsule-catalog.json`, `content/gift-packs.json`                     |
| Çizilmiş aksesuarların kaydı                            | `assets/kapsul-aksesuarlari.md` (bu klasör)                                                                 |
| Departman notları                                       | `departments/` (bu klasör)                                                                                  |
| Departmanlar arası teslimler                            | `handoffs/` (bu klasör)                                                                                     |
| Kurulum denetimi ve raporu                              | `INSTALLATION_AUDIT.md`, `INSTALLATION_REPORT.md`                                                           |

Kurulum isteğindeki `PRODUCT_BIBLE`, `TECHNICAL_ARCHITECTURE`, `DESIGN_SYSTEM`, `DECISION_LOG` ve `OPEN_ISSUES` dosyaları açılmadı: karşılıkları yukarıdaki tablonun ilk yedi satırıdır.

## Hafıza kuralları

1. Bilgi kaynağına yazılır; buraya yalnız yeri ve departmanın kendi notu.
2. Karar `docs/decisions/` altına tarihiyle ve gerekçesiyle yazılır; eski karar silinmez, yeni dosya ya da "Önceki hâl" satırı onu geçersiz kılar.
3. Reddedilen tasarım silinmez: Atölye'de durumu "Reddedildi" olur ve nedeni departman notuna (aksesuarsa görsel kaydın "Reddedilen" bölümüne) yazılır.
4. Görülen, ölçülen ve çıkarılan ayrı yazılır: "telefonda görüldü", "ölçüldü", "koddan", "belgeye göre", "çıkarım". Doğrulanmamış şey doğrulanmış gibi yazılmaz.
5. Açık sorun `docs/PROGRESS.md` ya da denetim belgesinde açık kalır; çözüldüğü, PR numarası ve nasıl doğrulandığı yazılmadan kapatılmaz.
6. Bir oturuma ya da ajana yalnız ilgili dosyalar verilir; büyük belgeler bütün okunmaz (`CLAUDE.md` → Token kuralları).

## Tasarım akışı

Talep → UI/UX Studio incelemesi → Atölye'de prototip (telefonda, preview build) → proje sahibinin incelemesi → proje sahibinin onayı → teslim belgesi → Engineering uygulaması (`tuval-aktarim`) → bağımsız denetim. Onay gelmeden tasarım gerçek ekrana girmez. Var olan parçalarla yapılan küçük ekleme (menü satırı, onay sayfası) bu akışa girmez (`CLAUDE.md` → Kod kuralları).

Atölye: Ayarlar → Tasarım (test) → Bileşen önizlemesini aç → "Atölye". Kaydı `apps/mobile/src/features/design/workshop/registry.tsx`. Yalnız geliştirme ve preview build'de görünür.

## Onay

Onay gerektirenler ve kimin birleştirdiği `CLAUDE.md` → Çalışma şekli'ndedir ("Kim birleştirir", "Proje sahibine ne zaman sorulur"). Bu kurulum onları değiştirmedi; tasarım için bir kapı ekledi: Atölye'deki taslak "Onaylandı" olmadan uygulanmaz.
