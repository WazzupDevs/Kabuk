# skall tuvali (görsel kaynak)

Uygulamanın görünüşünün kaynağı bu klasördür: Claude Design tuvalinin repodaki kopyası. Proje sahibinin kararı (26 Ekim): "Kaynak bu tuval olsun, birebir." Karar kaydı: `docs/decisions/sistem-kaynak.md`.

- Tuval (düzenlenen yer): https://claude.ai/artifact/3Ur2iwacMTbqUt23GvRB38
- Bu klasör tuvalin son yayınından aktarılır; burada elle düzenlenmez.

## Öncelik

| Konu | Geçerli kaynak |
| --- | --- |
| İçerik, davranış, kurallar (ne görünür, kime görünür, hangi metin) | `docs/SPEC_V4.md`: K kararları ve §4.C "v46'dan farklı uygulananlar" |
| Görünüş (renk, yazı, şekil, boşluk, bileşen, düzen) | Bu tuval |
| Hareket ve dokunuş, tuvalin henüz çizmediği ekranlar | v46 (`docs/design/v46/`), sonra v45, v44, v43 |

Tuvaldeki bir metin spec'le çelişirse spec geçerlidir ve tuval düzeltilir. Spec'te karşılığı olmayan tuval metinleri `sapmalar.md` → "Onay bekleyen metinler"dedir; onaylanmadan uygulamaya girmez.

## İçerik

| Yol | Ne |
| --- | --- |
| `index.html` | Bütün panolar sayfa sayfa, açık ve koyu |
| `ekran/<Pano>.html` | Tek pano. `?tema=koyu` koyu tema, `?genislik=320` dar ekran |
| `skall.css` | Sistemin tek stil dosyası: renk görevleri, yazı, bileşenler |
| `tokens.json` | `skall.css`'teki açık (`.sk`) ve koyu (`.sk.dark`) değişkenler |
| `durumlar.json` | Panoların listesi: kimlik, sayfa, başlık, tema desteği, boyut |
| `varlik/` | Panoların kullandığı görseller (masa simgeleri, sohbet desenleri) |
| `sapmalar.md` | Tuvalin v46'dan ve spec'ten ayrıldığı yerler, onay bekleyen metinler |
| `tuval/` | Tuvalin dizini (`canvas.json`) ve elle çizilen panoların kaynağı |
| `uretec/` | Panoları üreten betikler ve örnek veri; aktarım betiği |

Panolar 360 × 780 dp telefon çerçevesidir (sistem sayfası 1400 × 800). Her pano 360 ve 320 dp'de, açık ve koyu temada taşmadan çizilir.

## Bir oturum nasıl kullanır

- Oturuma yalnızca işiyle ilgili panolar verilir (`ekran/<Pano>.html`), klasörün tamamı verilmez.
- Ekran bu panolardan yeniden kurulur; renk ve ölçü `skall.css`'teki adlarla eşleşir. Hareket ve titreşim için v46'nın aynı ekranına bakılır.
- Panodaki örnek veri (adlar, saatler, mekanlar) uygulamaya girmez.

## Güncelleme (tuvalden repoya)

Tuval değişince aynı gün bir belge PR'ıyla aktarılır.

1. Panolar üreteçle çizildiyse repo kökünde: `node docs/design/sistem/uretec/aktar.cjs`. Üreteç `uretec/*.cjs` modüllerinden panoları kurar, `tuval/`'deki elle çizilenleri ekler ve `ekran/`, `index.html`, `tokens.json`, `durumlar.json`'ı yeniden yazar.
2. Tuvalde elle değişiklik yapıldıysa tuvalin `project/` dosyaları indirilir: `node docs/design/sistem/uretec/aktar.cjs --kaynak <indirilen project dizini>`. Elle çizilen panolar `tuval/`'e de kopyalanır.
3. Üreteçte değişiklik yapıldıysa panolar tuvale de yayınlanır (`SISTEM_CIKTI=<tuval dizini> node docs/design/sistem/uretec/build.cjs <sayfa…>`, dizin için `uretec/layout.cjs`). Tuval ile bu klasör aynı kalır.

Betikler Node 22 ile bağımlılıksız çalışır; kapsül çizimi ve masa simgeleri `docs/design/v46/kaynak/`'tan okunur.

## Henüz tuvale geçmeyenler

| Ne | Bugün | Geçiş |
| --- | --- | --- |
| Token üretimi (`pnpm tokens`) | v46 envanterinden | Tuvalin `tokens.json`'ına geçer (`docs/decisions/sistem-kaynak.md`, adım 2) |
| Görsel kapının yumuşak raporu | v46 prototipine karşı | Tuvalin `ekran/` sayfalarına karşı (adım 3) |
| Hareket panosu | Yok; v46 geçerli | Tuvale eklenir (adım 4) |
| Oyunlar | Kapsül Anlat ve Sahtekar çizili, dördü değil | 4.6'da oyun oyun |
