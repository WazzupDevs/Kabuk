---
name: tuval-aktarim
description: Onaylı bir tasarım (aktarım) raporunu koda aktarırken izlenecek zorunlu yordam. Rapor (`docs/design/aura/aktarim-*.md` ya da sohbette gelen rapor) her geldiğinde, her onaylı tasarım aktarımında kullan.
---

# Tuval aktarımı

Proje sahibinin kararı (1 Kasım): her onaylı tasarım aktarımı bu yordamla yapılır (CLAUDE.md → Çalışma şekli → "Tuval aktarımı"). Amaç aktarımın doğruluğudur: raporun her maddesi uygulanır, var olan zorunlu davranış kaybolmaz, hiçbir değer tahmin edilmez.

## 0. Tuval mi, uygulama mı (8 Kasım)

- Uygulamada var olan ekranın görünüşünün kaynağı uygulamanın kendisidir; tuval revize turlarının gerisinde kalabilir (`docs/decisions/tuval-kaynak.md`). Var olan ekrana yalnızca raporun istediği parça girer; panonun ekranın geri kalanında çizdiği eski hâl (cam, bulanıklık, eski boşluk, eski düzen) koda geri taşınmaz.
- Pano ile telefondaki hâl, raporun istemediği bir yerde ayrışıyorsa telefondaki hâl korunur ve `K` listesine yazılır; raporun istediği yerde ayrışıyorsa açık soru olur.
- Yeni ekran panodan temiz sayfa kurulur.

## 1. Yalnızca gerekeni oku

- Okunan: aktarım raporu; raporda belirtilen sürümün ilgili panoları (`docs/design/aura/project/<Pano>.dc.html`); raporun atıf yaptığı karar dosyaları (`docs/decisions/…`); değişiklik için gereken kod ve test dosyaları.
- Okunmayan: tuvalin tamamı (`project/` klasörü, canlı tuval) ve ürün belgelerinin tamamı (`docs/SPEC_*.md`, `docs/arsiv/`). Belgeden bir bölüm gerekiyorsa Grep ile o bölüm bulunur.
- **Sürüm denetimi:** raporun yazdığı tuval sürümü ile repodaki panoların sürümü uyuşmuyorsa (pano raporda adı geçen hâli çizmiyor, rapor daha yeni sürümü anlatıyor) uygulamaya geçilmez; proje sahibine tek soruyla bildirilir.

## 2. Gereksinim tablosu (yalnızca oturum içinde)

- Rapordaki her uygulanabilir gereksinime kısa bir kimlik verilir (`R1`, `R2`, …). Her biri ilgili bileşen, dosya ve varsa testle eşleşir.
  Ör. `R3 · sheet iki bölge, düğmeler sabit · app/checkin/index.tsx → RouteSheet · —`
- Ayrı iki liste: **korunacaklar** (`K1`, …: değişmemesi gereken var olan davranış, veri bağlantısı, geçiş, metin) ve **açık sorular** (`S1`, …).
- Tablo repoya, commit'e ve PR'a girmez; oturum içinde kalır ve adım 7'de denetim listesidir.

## 3. Hangi kaynak neye karar verir

| Konu                                                   | Kaynak                                                                                                                                                          |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ürün mantığı, gizlilik, var olan zorunlu davranış      | CLAUDE.md (değişmez kurallar, ekran davranışı), ürün belgesi (`docs/SPEC_V4.md`, değiştirmediği yerde `SPEC_V3.md`), onaylı kararlar (`docs/decisions/`)        |
| Görünüş                                                | yeni ekran ve raporun istediği parça: onaylı rapor ve panoları; var olan ekranın geri kalanı: uygulamanın bugünkü hâli                                          |
| Görsel değerler (renk, font, boşluk, köşe, gölge, cam) | tema token'ları (`apps/mobile/src/theme/`; gradyan `theme/gradient.ts` → `gradientStyle`) ve aura kit (`src/aura/`, `src/aura/kit.tsx`, `src/theme/auraKit.ts`) |
| Hareket                                                | `docs/design/aura/project/hareket.json` ve raporun hareket tablosu; kodda `src/theme/aura.ts` → `MOTION` (`aura.test.ts` eşitliği denetler)                     |
| Titreşim                                               | var olan sistem: `src/lib/haptics.ts` → `haptic(an)`, anlar `hapticMoments.ts`                                                                                  |

Rapor ile ürün mantığı ya da bir değişmez kural çelişirse ürün mantığı ve kural geçerlidir; çelişki açık soru olur.

## 4. Kaldırma, tahmin etme, sor

- Tuvalde görünmediği için var olan zorunlu davranış kaldırılmaz (ör. hata hâli, geri tuşuyla kapanma, beklerken basılamayan düğme, anonimlik).
- Yeni görsel değer (ölçü, renk, süre, eğri) ya da yeni ürün davranışı tahmin edilmez. Raporda ve token'larda yoksa gerçek bir karar belirsizliğidir: proje sahibine **tek soru**, öneriyle. Cevap beklenirken o madde bekler, diğerleri sürer.
- Teknik uygulama yolu (hangi bileşen, hangi native yol, nasıl ölçülür) var olan kurallar içinde CTO oturumunun sorumluluğudur; bunun için soru sorulmaz (gerekirse `.claude/skills/telegram-referans`).

## 5. Bütün hâller

- Raporda tanımlı her hâl uygulanır.
- Raporda olsun olmasın şunlar kod üzerinden denetlenir: açık ve koyu tema; yükleniyor, boş, hata; 320 dp ve en büyük yazı; platform farkları; hareketi azalt (`src/lib/useReduceMotion.ts`); ilgili ekranda klavye ve safe-area.
- Raporda olmayan yeni efekt (gölge, parıltı, geçiş, hareket) üretilmez.

## 6. Ortak bileşen önce, var olanı koru

- Önce ortak bileşenler: `src/aura/`, `src/components/` (`Screen`, `Button`, `Loader`, `ChatList`, `StageFit`, `LiquidGlass` …). Yeni bileşen yalnızca ortak olan karşılamıyorsa.
- Veri bağlantıları (sorgular, mutation'lar, Realtime), ekran geçişleri, i18n metinleri (`src/i18n/tr.ts`) ve davranışlar korunur; yeni metin yalnızca `tr.ts`'e girer.
- Değişen davranışın testleri aynı PR'da güncellenir.

## 7. Kapanış denetimi

- Tablodaki her kimlik koda karşı tek tek geçilir; her biri **tamamlandı**, **engelli** (sebebiyle) ya da **kapsam dışı** (sebebiyle) diye açıklanabilmelidir. Korunacaklar da geçilir.
- Uygulanabilir ama eksik madde PR'dan önce tamamlanır.
- Son düzenlemeden sonra `pnpm check`.
- Bu denetim kod üzerinden yapılır; görsel birebirliği kanıtlamaz. Her hâl için ekran görüntüsü alınmaz; görsel kontrol proje sahibinin telefonundadır.

## 8. PR ve sonuç

- PR `.claude/skills/pr-akisi` ile açılır; şablon (`.github/pull_request_template.md`) korunur. "Yayın" bölümü atlanmaz (OTA, yeni build ya da önce sunucu; `.claude/skills/yayin`).
- Proje sahibine yalnızca kısa sonuç: `N/N madde · PR · CI · yayın türü`
  Ör. `14/14 madde · WazzupDevs/Kabuk#340 · CI yeşil · OTA`
- Engelli madde varsa adı ve gerekçesi aynı mesaja eklenir: `13/14 madde · … · R9 engelli: sheet yüksekliği native ölçülemiyor`.
