# Capsule Art Studio: departman notları

Ajan `capsule-art-studio`. Yordamlar: `.claude/skills/capsule-accessory-design`, `.claude/skills/svg-asset-validation`. Görsel hafıza: `../assets/kapsul-aksesuarlari.md` (çizilmiş her aksesuar bir satır).

## Çizimin yapısı (koddan, 11 Kasım 2026)

- Kapsül bir çizim kitaplığıyla çizilir: kaynak `docs/design/kaynak/kapsul/kapsul-cizim-kutuphanesi.js`, uygulamadaki kopyası `apps/mobile/src/theme/capsuleDrawing.js`. Görünüş bir kod metnidir (`c:pembe e:koyu x:kistakimi`): renk, göz, parçalar, aksesuar.
- Kapsülün kendi parçaları katalogdadır: `content/capsule-catalog.json` (173 parça, 23 göz, 16 renk, 6 yuva, 28 hazır görünüş). Sunucuya ve uygulamaya `pnpm seed` ile gider; üretilen dosyalar elle düzenlenmez (`CLAUDE.md` → Komutlar).
- Paket aksesuarları ayrı bir katalogdur: `content/gift-packs.json` (67 aksesuar: 12 Sıradan, 12 Nadir, 12 Destansı, 31 Efsanevi; iki skin seti, Elf ve Ninja). Çizimleri `apps/mobile/src/theme/capsuleAccessories.ts` → `ACCESSORY_ART`.
- Aksesuar çizimi 100 birimlik kutudadır. Gövde 52 birim geniş, üstü 22'de, vizörün ortası 45,2'de. Çapa çizimin oturduğu yerdir (`head`, `face`, `mid`, `body`); katmanlar `back` (gövdenin arkası), `skin` (gövdenin üstü, vizörün altı), `art` (her şeyin üstü).
- Hareket eden grup `<g data-fx="…" data-o="x y" data-k="…">` ile işaretlenir; hareketin tanımı `apps/mobile/src/theme/capsuleFx.ts` → `FX`. Yeni hareket yeni kod demektir: Engineering'e teslimle gider.
- Yuvalar: `c` Renk, `e` Göz, `h` Baş, `f` Yüz, `m` Ağız, `n` Boyun. Destansı takımlar iki yuvalıdır. Skin setinin parçaları Efsanevi'dir (`docs/decisions/skin-setleri.md`).

- Öğe sayıları (çizim etiketi; 11 Kasım 2026, sayım): Sıradan 1–12 (ortanca 4), Nadir 6–17 (ortanca 10), Destansı 16–176 (ortanca 30), Efsanevi 12–120 (ortanca 19). Emekli olmayan 60 aksesuarın çapası `body`'dir; emekli yedisi `head`, `face` ya da `mid`.

## Kurallar

- Ürün kuralı `docs/SPEC_V4.md` §4.U ve `docs/decisions/hediye-paketleri.md`. Kademe, ağırlık ve oran ürün kararıdır; departman öneremez, yalnız proje sahibi verir.
- Hiçbir uygulamadan ya da hazır setten çizim, ikon ve görsel kopyalanmaz ya da uyarlanmaz (`CLAUDE.md` → "Lisansa takılacak hiçbir şey yapılmaz"). Her çizim sıfırdan, kendi yollarımızla.
- Masa simgesi ve kapsül kimse hakkında bilgi taşımaz (değişmez kural 4); aksesuar cinsiyet, yaş ya da kimlik ima eden bir işaret olarak tasarlanmaz.
- Çizim maliyeti ölçülmüş bir sınırdır: çok öğeli ve klip içinde hareket eden aksesuar küçük avatarda pahalıdır (`docs/denetim/olcum-protokolu.md` → T1, T2). Öğe sayısı ve hareket teslimde yazılır.

## Açık konular

- Tasarım performans prensipleri (bütçe, boya göre kademe, izinli hareket listesi, içerik sayım testi) karar bekliyor; `docs/PROGRESS.md` → Skia build'i devir notu, madde 5.
- Görsel kayıttaki "Not" sütunu 11 Kasım 2026'da boş başladı: var olan 67 aksesuarın tasarım gerekçesi kayda geçmemişti. Bir aksesuara dokunan iş notunu da yazar.
