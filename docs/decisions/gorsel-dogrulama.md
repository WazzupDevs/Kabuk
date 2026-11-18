# Görsel doğrulama düzeni (18 Kasım 2026, proje sahibinin kararı)

Proje sahibi telefonda sürekli panoya uymayan ekran bulup tek tek bildirmek zorunda kaldı: oturum hiçbir ekranı görmüyor, yalnız pano kaynağını kodla karşılaştırıyordu. Karar bütün tuval için geçerlidir ve 27 Ekim "hızlı yol"un iki maddesinin yerini alır ("oturum kendi görsel kontrolünü yapmaz", "görsel kapı birleşme şartı değildir"); CLAUDE.md "Çalışma şekli" düzenin kurulduğu PR'da (PR-1) güncellenir.

## Karar

1. Her pano (203) uygulamadaki ekran, açılış yolu, hâl ve temayla eşlenir. Her paketin başında doğrulanacak görünümler panodan belirlenir; çekim senaryosu yazılmamış alt ekran ya da menü de kapsamda görünür.
2. Birleşmeden önce aday sürümün Android görüntüsü pano görüntüsüyle karşılaştırılır: paketin 2–4 ana ekranı; ilk kez aktarılan düzenler ve değişen etkileşimler ayrıca (menüde gerçek düğmeye basılır); koyu tema aile başına temsilî bir ekranda.
3. Metin, öğe sırası, konum ve hiza denetlenir; piksel farkı yalnız şüpheli bölgeyi bulur. Panoya uygunluğu doğrulanmış Android görüntüleri sonraki bozulmalar için baz olur.
4. Tek ajan kod yazar; ilk kez kabul edilen ya da riskli görünümleri ayrı, salt okunur bir denetçi inceler. "Doğrulandı" için pano, aday sürümün görüntüsü ve karşılaştırma sonucu PR'da kayıtlıdır; eksik kanıt birleşmeyi durdurur; oturum kesilirse yenisi kayıttan devam eder.
5. Her OTA'dan sonra proje sahibine sürüm kimliğiyle kısa rapor: doğrulanan ekran ve tema, hâlâ eski olan, kayıtlı hata, telefonda denenecek yer ve oraya nasıl gidileceği.

Ek kararlar (18 Kasım): pano görüntüleri bir kez çizilip ayrı bir dala yazılır (`pano-goruntuleri`; main'e resim ve tuvalin çalıştırma dosyası `support.js` girmez; tuval değişince yeniden çizilir). Görsel kapının emülatörü panonun boyuna (390×844 dp) geçer; var olan 7 baz yeniden kabul edilir.

## Plan (`mimar`, 18 Kasım)

- **PR-1 (betik ve test, `ci`'da):** `e2e/visual/kapsam.json` (203 pano × 2 tema: pano, dosya, rota, açılış, hâl, tema, `states.json` durum kimliği ya da boş, durum `eski | yazildi | goruntuyle-dogrulandi | telefonda-dogrulandi | cizilmeyecek`, sebep, kanıt PR no). Üreten `scripts/visual/kapsam.ts` (`ESLEME.md` ve `denetim/grup-NN.md` → "Kod:" satırlarından; var olan satırın durumunu korur). `scripts/visual/kapsam.test.ts` (`pnpm test`): her pano tema başına bir satır; doğrulanmış satırın durumu, baz görüntüsü (`e2e/visual/baz/<id>-<tema>-1.png`) ve kanıtı var; `cizilmeyecek` sebepsiz olamaz; rotasız satır `yazildi` olamaz. `scripts/visual/kanit.ts` + `ci.yml` → `checks` adımı `pnpm visual:kanit` (yalnız PR'da, sır kullanmaz): PR'ın değiştirdiği dosya bir satırın koduna değiyorsa o satır bu PR'ı kanıt gösteren `goruntuyle-dogrulandi` olmalı ya da sebepli `eski` kalmalı; değilse düşer (`ci` zaten tek zorunlu kontrol). `scripts/visual/rapor.ts` (OTA raporu). Yeni salt okunur ajan `.claude/agents/gorsel-denetci.md` (Read, Grep, Glob, Bash). Ayarlar → "Test sürümü" altına güncelleme kimliğinin kısa hâli ve build satırı (bugün yalnız `launchStore.ts` → `Updates.updateId`, kullanıcıya görünmüyor).
- **PR-2:** `e2e.yml`'de yalnız görsel kapıyı koşturan `gorsel` etiketi (concurrency, `changed`, `build`, `visual` koşulları; sekiz E2E parçası hariç; `build` işinin sır okuyup okumadığı doğrulanacak: okuyorsa proje sahibinin "onaylandı"sı gerekir). Emülatör 390×844 dp (`-skin 780x1688`, density 320), 7 bazın yeniden kabulü. Pano görüntüsü dalından okuma ve `gate-report.ts`'te yan yana birleşik resim (`yanyana/<id>-<tema>.png`: pano | aday | fark). `flow.ts` ve `states.ts`'e uygulama adımı (`uygulamaAdimlar: {bas: testID} | {bekle: ms}`), testi `visual.test.ts`'te. `.claude/skills/e2e` ve `tuval-aktarim`'e "paket başında kapsam satırları" adımı.
- **Pano görüntüleri:** panolar `support.js` (depoda yok; `<sc-for>`, `data-dc-script`) ve `/_blob/<hash>` resimleri olmadan boş çizilir. Oturumda Artifact aracıyla tuvalden alınıp Playwright'la çizilir, PNG'ler `pano-goruntuleri` dalına yazılır.
- **Örnek ekran kalıbı:** `apps/mobile/src/features/design/gorsel/semtFixture.tsx` (üretim bileşenleri, kendi `QueryClient`'ı ve `setQueryData`, no-op eylemler), kayıt `registry.tsx` → `GATE_STATES`, saat ve rastgelelik `deterministic.ts`; ekran başına 40–90 satır; rota dosyasında mantık gömülüyse önce bileşen ayrılır.
- **PR-3 (pilot):** Ayarlar ailesi (#734) ve semt seçenekler menüsü (gerçek ⋮ basışıyla). Önce hatalı sürümde (`c9ef619`: menü alttan sayfa; main'de Ayarlar alt ekranları) iki hatanın yakalandığı gösterilir, sonra düzeltilmiş sürümün kanıtı.
- **PR-4…:** birleşmiş paketlerin geriye dönük doğrulaması (zemin ve ortak parçalar, hata hâlleri, dialoglar, sohbetler), aile başına bir PR; sonra her yeni paket kendi PR'ında.
- Gece E2E'sinin girişte takılması ayrı düzeltme PR'ı.

Bu düzenin yakalayamayacakları: gerçek sunucu verisiyle çıkan hâller, hareket ve zamanlama, cam ve bulanıklık, dokunsal geri bildirim, büyük yazı ve 320 dp (durumu yazılmadıkça), cihaz farkı. En büyük belirsizlik: panoların tuvaldeki gibi çizilebilmesi ve 390 dp emülatörde var olan bazların tutması.

Kurulana kadar: #734 (Ayarlar) ve Mesajlar/DM paketi `ci` yeşil olsa da birleştirilmez; kanıtları pilotla gelir.
