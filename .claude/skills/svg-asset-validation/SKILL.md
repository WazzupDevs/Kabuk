---
name: svg-asset-validation
description: Bir kapsül aksesuarının ya da uygulamaya giren başka bir SVG çiziminin teknik denetimi: yapı, adlar, hareket işaretleri, öğe sayısı, ölçeklenebilirlik ve testler. Yeni ya da değişen her çizimde, birleşmeden önce kullan.
---

# SVG varlık denetimi

Her madde geçer ya da düşer; sonuç maddesiyle birlikte yazılır. Çalıştırılmayan denetim "çalıştırılmadı" yazılır.

## 1. Testler

```
pnpm exec vitest run apps/mobile/src/theme/capsuleLook.test.ts apps/mobile/src/theme/capsuleFx.test.ts apps/mobile/src/theme/capsuleSkia.test.ts scripts/skall-os.test.ts
```

Bunlar şunları denetler: kataloğun her aksesuarının çizimi var; her `id` tek aksesuara ait ve her `url(#…)` kendi çiziminde tanımlı; çizimdeki her `data-fx` `FX`'te tanımlı; yalnız Destansı ve Efsanevi hareket eder; kataloğun her aksesuarı görsel kayıtta. Ardından `pnpm typecheck`.

## 2. Yapı (çizimin metninde, Grep ile)

| Madde           | Kural                                                                                                                                   |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| İzinli öğeler   | Yalnız `path`, `circle`, `ellipse`, `rect`, `g`, `defs`, `linearGradient`, `radialGradient`, `stop`, `clipPath`, `mask`                 |
| Yasak           | `text`, `image`, `use` ile dış kaynak, `filter`, `foreignObject`, `style`, `script`, `href` ile dış bağlantı, gömülü taban64 veri       |
| Renk            | Onaltılık (`#RGB`, `#RRGGBB`), `none` ya da kendi `url(#…)` gradyanı; adlı renk (`red`) ve `rgb()` yok                                  |
| Kutu            | Bütün koordinatlar 100 birimlik kutunun dilinde; kapsülün ekseni x=50; çizim kutudan taşıyorsa bilerek (hale, pelerin)                  |
| Adlar           | Her `id` aksesuarın kimliğiyle başlar (bugünkü 67 çizimde tek istisna `buyucu-c`; test yalnız adın tek aksesuara ait olduğunu denetler) |
| Hareket işareti | `data-fx` olan grup `data-o` (köken, "x y") ve `data-k` (birim) taşır; iç içe hareket grubu yok                                         |
| Etiketler       | Her açılan etiket kapanır; öznitelikler çift tırnakla                                                                                   |
| Ondalık         | Yeni çizimde en çok iki ondalık basamak (bugünkü çizimlerde 37 yerde daha uzunu var; onlar bu yüzden yeniden yazılmaz)                  |

## 3. Maliyet

Öğe sayısı sayılır (çizim etiketleri: `path`, `circle`, `ellipse`, `rect`) ve yazılır; aynı kademedeki öteki aksesuarların sayısıyla karşılaştırılır. Sayım:

```
node -e "const s=process.argv[1];console.log((s.match(/<(path|circle|ellipse|rect)\b/g)||[]).length)" "<çizimin metni>"
```

- Her SVG öğesi telefonda bir yerel görünümdür; sayı arttıkça küçük avatarın ve Kapsülünü süsle karosunun maliyeti artar (ölçüm: `docs/denetim/olcum-protokolu.md` → T1, T2).
- Klip ya da maske içinde hareket (`clipPath`/`mask` altındaki `data-fx`) en pahalı türdür; gerekçesi teslimde yazılır.
- Bugünkü çizimlerin öğe sayısı (11 Kasım 2026, sayım): Sıradan 1–12 (ortanca 4), Nadir 6–17 (ortanca 10), Destansı 16–176 (ortanca 30; en ağırı `hawaiitakimi`), Efsanevi 12–120 (ortanca 19; en ağırı `gokkusagiatki`).
- Kesin bir üst sınır henüz karar değildir (tasarım performans prensipleri açık, `docs/skall-os/departments/CAPSULE_ART.md` → Açık konular). O güne kadar ölçüt: aynı kademenin bugünkü en ağır aksesuarını geçen çizim gerekçesiz geçmez.

## 4. Ölçeklenebilirlik

- En ince çizgi küçük avatarda (yaklaşık 56 dp, kutu 100 birim: 1 birim ≈ yarım dp) görünür mü: 1 birimden ince çizgi ve 2 birimden küçük ayrıntı küçük boyda kaybolur; siluet onlara dayanmaz.
- Çizim büyük kapsülde (Kapsülünü süsle) boş ya da kaba kalmıyor mu: tek renkli büyük alan yerine ikinci ton.
- Açık ve koyu zeminde okunurluk: zemine yakın tek renk (çok açık ya da çok koyu) kenar çizgisi olmadan kullanılmaz.

## 5. Birlikte takılma

- Aynı anda takılabilen öteki yuvaların aksesuarlarıyla üst üste gelince okunur mu (ör. Baş ile Yüz): çakıştığı bölge yazılır.
- Renk yuvası (`skin`) vizörü ve gözleri kapatmaz.

## 6. Görülmeyenler

Bu ortamda çizim ekranda görülmez. Dönüşte "telefonda bakılacak" listesi verilir: küçük avatar, büyük kapsül, açık ve koyu tema, hareketin başı ve sonu, Skia ile SVG yan yana (Kapsül ölçümü → "Skia yan yana"; klip içi hareket varsa).

## Aksesuar dışındaki SVG'ler

Masa simgeleri, ikonlar ve desenler üretilen dosyalardan gelir (`pnpm seed`, `pnpm icons`; kaynak `content/table-icons.json`, `docs/design/kaynak/`, `docs/design/aura/ikonlar/`). Onlarda 2. ve 4. bölüm aynen geçerlidir; üretilen dosya elle düzenlenmez, kaynağı değişir ve betiği çalıştırılır.
