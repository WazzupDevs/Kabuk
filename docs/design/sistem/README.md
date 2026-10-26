# skall tuvali (görsel kaynak)

Uygulamanın görünüşünün kaynağı bu klasördür: Claude Design tuvalinin repodaki kopyası. Proje sahibinin kararları: "Kaynak bu tuval olsun, birebir." (26 Ekim) ve arayüz tuvalden temiz sayfa kurulur (27 Ekim). Karar kaydı: `docs/decisions/sistem-kaynak.md`.

- Tuval (düzenlenen yer): https://claude.ai/artifact/3Ur2iwacMTbqUt23GvRB38
- Bu klasör tuvalin son yayınından aktarılır; burada elle düzenlenmez.

## Öncelik

| Konu | Geçerli kaynak |
| --- | --- |
| İçerik, davranış, kurallar (ne görünür, kime görünür, hangi metin) | `docs/SPEC_V4.md`: K kararları ve §4.C "v46'dan farklı uygulananlar" |
| Görünüş (renk, yazı, şekil, boşluk, bileşen, düzen) | Yalnızca bu tuval; çizilmemiş ekran önce tuvale çizilir |
| Hareket ve dokunuş | Koddaki bugünkü değerler; tuvale hareket panosu eklenince o |

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
- Ekran bu panolardan, tuvalin bileşen kitiyle yeniden kurulur; renk ve ölçü `skall.css`'teki adlarla eşleşir. Hareket ve titreşim ekranın koddaki bugünkü değerleridir.
- Panodaki örnek veri (adlar, saatler, mekanlar) uygulamaya girmez.

## Güncelleme (tuvalden repoya)

Tuval değişince aynı gün bir belge PR'ıyla aktarılır.

1. Panolar üreteçle çizildiyse repo kökünde: `node docs/design/sistem/uretec/aktar.cjs`. Üreteç `uretec/*.cjs` modüllerinden panoları kurar, `tuval/`'deki elle çizilenleri ekler ve `ekran/`, `index.html`, `tokens.json`, `durumlar.json`'ı yeniden yazar.
2. Tuvalde elle değişiklik yapıldıysa tuvalin `project/` dosyaları indirilir: `node docs/design/sistem/uretec/aktar.cjs --kaynak <indirilen project dizini>`. Elle çizilen panolar `tuval/`'e de kopyalanır.
3. Üreteçte değişiklik yapıldıysa panolar tuvale de yayınlanır (`SISTEM_CIKTI=<tuval dizini> node docs/design/sistem/uretec/build.cjs <sayfa…>`, dizin için `uretec/layout.cjs`). Tuval ile bu klasör aynı kalır.

Betikler Node 22 ile bağımlılıksız çalışır; kapsül çizimi ve masa simgeleri `docs/design/v46/kaynak/`'tan okunur.

## Geçiş (temiz sayfa)

| Sıra | İş | Ne zaman biter |
| --- | --- | --- |
| 1 | Bu klasör ve kurallar | Bu PR |
| 2 | Temel: tema `skall.css`'ten; tuvale karşı testler (tema ve `tokens.json` eşitliği, `aktar.cjs` çıktısı repodakiyle aynı); görsel kapının yumuşak raporu `ekran/`'a | Temel PR'ı |
| 3 | Bileşen kiti: Sistem sayfasının parçaları | 3–4 PR |
| 4 | Ekranlar sayfa sayfa; v46 hattı (envanter, ölçüm, `scripts/v46/`, v46 galerisi, `src/ui`'nin v46 bileşenleri) son kullanıcısı gidince kalkar | 8–10 PR |
| Paralel | Tuvale hareket panosu (koddaki değerlerle) | Tuvalde |
| 4.6 | Oyunlar: önce tuvale çizilir, sonra oyun oyun | 4.6 adımları |
