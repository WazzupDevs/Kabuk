---
name: ui-screen-audit
description: Bir ekranı ya da akışı kullanılabilirlik, tutarlılık ve ekran davranışı kuralları açısından denetleme yordamı (UI/UX Studio). "Şu ekrana bak", "bu ekran neden kötü görünüyor", bir ekranın yeniden tasarımından önceki inceleme ve tasarım talebinin ilk adımında kullan.
---

# Ekran denetimi

Çıktı bir bulgu listesidir; kod değişmez. Denetimi `ui-ux-studio` ajanı ya da ana oturum yapar.

## 1. Kapsamı sabitle

- Ekranın rotası (`apps/mobile/app/…`) ve onu çizen özellik klasörü (`apps/mobile/src/features/<özellik>/`) bulunur. Yalnız o ekranın dosyaları ve kullandığı ortak bileşenler okunur.
- Elde ne var yazılır: telefon görüntüsü, ekran kaydı, görsel kapı görüntüsü ya da hiçbiri. Hiçbiri yoksa denetim "koddan"dır ve öyle adlandırılır.

## 2. Bilineni tekrar etme

- `docs/denetim/uctan-uca-2026-11.md` içinde ekranın adı Grep ile aranır (M15 ve ilgili modül). Kayıtlı bulgu yeniden yazılmaz; numarası verilir ve bugün hâlâ geçerli mi bakılır. M15'in kalıp bulguları ekran adı taşımaz, her denetimde ayrıca okunur: `grep -n "M15-3[89]\|M15-4[0-7]" docs/denetim/uctan-uca-2026-11.md` ile başlıkları, ilgili olanın satırı.
- `docs/skall-os/departments/UI_UX.md` → "Tekrar eden kalıplar" ve "Taslak kaydı" okunur: bu ekran için reddedilmiş bir öneri varsa aynısı önerilmez.
- Ekranın kararı varsa (`docs/decisions/` içinde Grep) okunur: bilerek öyle yapılmış şey bulgu değildir.

## 3. Denetim listesi

Her madde için ekranın kodunda ve görüntüsünde bakılır; uymayan her şey bir bulgudur.

| Konu              | Bakılan                                                                                                                                                              |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| İskelet           | `Screen` kullanıyor mu; üst düğmeler ve başlık `top`'ta mı (içerikle kaymaz); liste değilse sabit mi                                                                 |
| Hâller            | Yükleniyor (`Loader`, `useLoaderHold`), boş ve hata hâli var mı; her biri ne gösteriyor; ikinci bir sorgu ya da izin gelene kadar ekran yanlış bir hâl gösteriyor mu |
| Boylar            | Düğme, alan, çip ve ikon düğmesi `KIT.size`'tan mı (48, 36, 44, 48, 36); ekran kendi boyunu seçmiş mi                                                                |
| Değerler          | Renk, boşluk, köşe, font yalnız tokenlardan mı; sabit sayı ya da renk kodu var mı                                                                                    |
| Metin             | Bileşende sabit metin var mı (hepsi `tr.ts`'te olmalı); 320 dp ve en büyük yazıda kesilen ya da iki satıra bölünen düğme yazısı                                      |
| Dokunma           | Basılan düğme beklerken ikinci kez basılabiliyor mu; hatası görünen mutation `FEEL_ERROR` taşıyor mu                                                                 |
| Açılanlar         | Menü, çubuk, alt sayfa: dışarı dokununca, kaydırınca ve geri tuşuyla kapanıyor mu; aynı anda ikisi açılabiliyor mu                                                   |
| Üst üste binme    | Uyarı kartı bir düğmenin üstüne biniyor mu; klavye açıkken alan görünüyor mu                                                                                         |
| Tutarlılık        | Aynı iş başka ekranda nasıl yapılmış (aynı tür satır, aynı tür başlık, aynı ikon); fark varsa hangisi kural                                                          |
| Tema              | Açık ve koyu temada okunurluk (`src/theme/contrast.ts`); açık temada zeminde kaybolan öğe                                                                            |
| Hareket           | Hareket `MOTION`'dan mı; hareketi azaltta ne oluyor (`useReduceMotion`)                                                                                              |
| Maliyet           | Aynı anda kaç SVG ve hareketli öğe çiziliyor; sürekli dönen hareket var mı; liste `FlatList` benzeri mi yoksa hepsini mi çiziyor                                     |
| Gizlilik          | Ekran göstermemesi gereken bir şeyi gösteriyor mu (değişmez kural 4, 5, 12)                                                                                          |
| Kullanılabilirlik | Ekranın tek ana eylemi belli mi; kişi ne yapacağını ilk bakışta anlıyor mu; geri dönüş yolu açık mı                                                                  |

## 4. Bulguyu yaz

Her bulgu tek satır: `önem · ekran ve dosya:satır · ne · kanıt sınıfı · önerilen yön`.

- Önem: P1 (kişi işini yapamıyor, kural ihlali), P2 (gözle görülen bozukluk, tutarsızlık), P3 (cila).
- Kanıt sınıfı: **görüldü** (hangi görüntü), **koddan** (hangi satır), **çıkarım** (neden öyle düşünüldüğü). Görülmeyen şey "görüldü" yazılmaz.
- Önerilen yön bir tasarım değil, bir yöndür ("düğme `KIT.size.btn`'e alınır", "boş hâl eklenir"). Görünüş değişikliği gerektiren bulgu `ui-workshop-workflow`'a gider.

## 5. Telefonda bakılacaklar

Koddan karar verilemeyen her şey ayrı listelenir (ekran, ne yapılacak, neye bakılacak). Proje sahibinden aynı ekranın birden çok görüntüsü değil, bir görüntü ve üzerine not istenir.

## 6. Kayıt

- İki kez görülen kalıp `docs/skall-os/departments/UI_UX.md` → "Tekrar eden kalıplar"a bir satır.
- Düzeltilecek bulgular `docs/PROGRESS.md`'deki açık iş listesine ya da proje sahibi öyle isterse denetim belgesine girer; düzeltmenin kendisi Engineering'in işidir (küçük ve görünüşü değiştirmeyen düzeltme doğrudan, görünüş değişikliği `ui-workshop-workflow` ile).
