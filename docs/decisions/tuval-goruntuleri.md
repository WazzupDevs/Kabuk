# E2E görüntüleri tuval için ayrı dalda (12 Kasım 2026)

Karar (proje sahibi, 12 Kasım 2026 00:33): tasarım tuvali uygulamanın gerçek görüntülerinden kurulur; kaynak gece E2E koşusunun ekran görüntüleridir. Tasarım oturumu GitHub artifact'larını indiremiyor, repodaki dalları git ile okuyabiliyor. Bu yüzden görüntüler `tuval-goruntuleri` dalına da yazılır.

Önceki hâl: `e2e.yml` görüntüleri yalnız koşunun artifact'larında tutuyordu ("ekran görüntüsü dalı yok, repoya binary girmez"). Bu karar onu bilerek değiştirir; main'in geçmişine görüntü yine girmez.

## Nasıl

- İş: `.github/workflows/e2e.yml` → `tuval-goruntu`. Yalnız gece koşusunda ve main'de elle başlatılan koşuda; PR'da çalışmaz. Sekiz parça, dört büyük yazı parçası ve görsel kapı bitince çalışır; biri düşse de çalışır (düşen parçanın çektikleri kadar yazılır). İptal edilen koşuda çalışmaz.
- İzin: `contents: write` yalnız bu işte; öteki işler `contents: read`. İşin action'ları commit'e sabittir (`deploy-dev.yml`'ninkiler); artifact'lar `gh run download` ile iner.
- Dal: `tuval-goruntuleri`, kökü ayrı (orphan), her koşuda tek commit olarak yeniden yazılır (zorla push). Eski görüntüler birikmez.
- Düzen (`scripts/e2e/tuval-images.ts`, testli): `light/<ad>.png`, `dark/<ad>.png`, `large/<ad>.png` (ad, akıştaki `takeScreenshot` adı; parça numarası klasöre girmez), `visual/<ad>.png` (görsel kapının adayları). İlk denemenin görüntüleri (`attempt-1/`) alınmaz. Çözünürlük emülatörün çektiği gibidir.
- `manifest.json`: koşunun commit SHA'sı, koşu adresi, tarih (UTC); her görüntü için ad, tema, akış dosyası, parça, geçti ya da düştü.

## Bilerek böyle

- Aynı ad birden çok parçada çekilir (her parça aynı kurulum akışlarıyla başlar): en küçük numaralı parçanınki tutulur, `shard` onu söyler.
- `passed` görüntünün akışının değil, parçanın bütününün (görsel kapıda kapının) sonucudur: Maestro'nun raporu parça başına tek sonuç verir. Rapor yoksa `null`.
- Hiç görüntü çıkmayan koşu (o gece main değişmediyse parçalar çalışmaz) dalı olduğu gibi bırakır.
- Görüntüler test hesaplarının ve yerel yığının verisidir (E2E'nin kendi mekanları ve botları); gerçek kullanıcı verisi içermez. Depo herkese açıktır, dal da öyle.

## Doğrulanmadı

İş ilk kez main'de bir gece ya da elle koşuda çalışır; PR'da çalışmadığı için birleşmeden önce denenemedi. Bakılacaklar: Maestro'nun `takeScreenshot` dosyalarını `screenshots/` altında nereye koyduğu (betik alt klasörleri de tarar), dalın korumasının zorla push'a izin verdiği.
