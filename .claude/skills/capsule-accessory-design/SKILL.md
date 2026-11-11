---
name: capsule-accessory-design
description: Yeni bir kapsül aksesuarı, kıyafeti ya da set parçası tasarlama ve çizme yordamı (Capsule Art Studio); var olan bir aksesuarın yeniden çiziminde de geçerli. Aksesuar, kıyafet, obje, skin seti ya da kapsül görseli istendiğinde kullan.
---

# Kapsül aksesuarı tasarımı

Aksesuarın iki yüzü vardır: **ürün** (kimliği, adı, kademesi, yuvası, seti, ağırlığı: `content/gift-packs.json`, ürün kararı) ve **çizim** (`apps/mobile/src/theme/capsuleAccessories.ts` → `ACCESSORY_ART`). Bu yordam çizimi yapar; ürün tarafı proje sahibinin kararıyla ve ana oturumun eliyle gelir.

## 1. Talebi sabitle

Şunlar belli olmadan çizime başlanmaz; eksik olanı ajan ana oturuma, ana oturum proje sahibine tek soruyla sorar:

- Kademe (Sıradan, Nadir, Destansı, Efsanevi) ve yuva (`c` Renk, `e` Göz, `h` Baş, `f` Yüz, `m` Ağız, `n` Boyun; Destansı takım iki yuvalı).
- Set parçası mı (Elf, Ninja ya da yeni set; set parçaları Efsanevi'dir).
- Tema ya da fikir (bir cümle); renk serbest mi.
- Katalog girdisi: yeni aksesuarın `content/gift-packs.json` girdisini (kimlik, ad, kademe, yuva, ağırlık) ana oturum, proje sahibinin kararıyla, çizimden **önce** aynı dala ekler ve `pnpm seed`'i koşar. Girdisi olmayan aksesuar çizilmez: çizimin ve kaydın testleri kataloğa bakar.

Ürün kuralı: `docs/SPEC_V4.md` §4.U (Grep ile), `docs/decisions/hediye-paketleri.md`, `docs/decisions/skin-setleri.md`.

## 2. Hafızaya bak

- `docs/skall-os/assets/kapsul-aksesuarlari.md` baştan sona okunur. Aynı fikir ya da çok yakını varsa çizilmez; hangisi olduğu ve farkın ne olacağı söylenir. "Reddedilen" bölümünde aynı deneme varsa nedeni okunur.
- Aynı yuvadaki ve aynı kademedeki iki üç aksesuarın çizimi `ACCESSORY_ART`'tan kimliğiyle bulunup okunur (dosyanın tamamı değil): çizgi kalınlığı, renk sayısı, ayrıntı düzeyi oradan alınır.
- Panolar gerekirse: `docs/design/aura/project/Aksesuar<Kademe>.dc.html` (yalnız ilgili kademe).

## 3. Tasarım dilini belirle

Çizime geçmeden üç satır yazılır: siluet (uzaktan ne görünür), en çok üç dört renk, kademeye göre ayrıntı ve hareket.

- Kademe ayrıntıyı ve hareketi belirler: Sıradan ve Nadir durur, yalnız Destansı ve Efsanevi hareket eder (`capsuleFx.test.ts` bunu denetler).
- Aksesuar küçük avatarda da (yaklaşık 56 dp) okunmalıdır: ince ayrıntı siluetin yerini tutmaz.
- Kapsülün yüzü okunur kalır: vizörü ve gözleri kapatan aksesuar yalnız Göz ve Yüz yuvasında, bilerek.
- Kimlik, cinsiyet ya da yaş ima eden işaret olmaz; marka, logo ve tanınan karakter çizilmez; hiçbir yerden çizim alınmaz.

## 4. Çiz

- Kutu 100 birim. Gövde 52 birim geniş, üstü y=22'de, vizörün ortası y=45,2'de, kapsülün ekseni x=50. Çapa `body` (emekli olmayan 60 aksesuarın hepsi böyledir; `head`, `face`, `mid` yalnız emekli yedi aksesuarın yerleşimidir).
- Katmanlar: `art` her şeyin üstünde; `back` gövdenin arkasında (hale, pelerin); `skin` gövdenin üstünde ve vizörün altında (Renk yuvası).
- Yalnız `path`, `circle`, `ellipse`, `rect`, `g`, gerekiyorsa `defs` içinde `linearGradient`, `radialGradient`, `clipPath`, `mask`. Metin, resim, filtre, dış bağlantı yok.
- Renkler onaltılık yazılır (`#RRGGBB`) ya da `none`; saydamlık `fill-opacity` ile.
- `id` verilen her tanım aksesuarın kimliğiyle başlar (`<kimlik>-g1`): iki aksesuar birlikte takılınca adlar çakışmaz (`capsuleLook.test.ts` denetler).
- Hareket eden grup: `<g data-fx="<hareket>" data-o="x y" data-k="…">`; `data-fx` yalnız `apps/mobile/src/theme/capsuleFx.ts` → `FX`'te tanımlı bir addır. Yeni hareket gerekiyorsa çizim hareketsiz bırakılır ve hareket teslimde Engineering'den istenir.
- Yeni çizimde koordinatlar en çok iki ondalık.

## 5. Teknik denetim

`.claude/skills/svg-asset-validation` baştan sona uygulanır; düşen madde düzeltilmeden ilerlenmez.

## 6. Tutarlılığı değerlendir

Kayıttaki en yakın iki aksesuarla karşılaştırılır ve yazılır: çizgi kalınlığı aynı aralıkta mı, renk sayısı kademesine uygun mu, öğe sayısı aynı kademedekilerin aralığında mı, siluet onlardan ayırt ediliyor mu.

## 7. Kayda geçir

- `docs/skall-os/assets/kapsul-aksesuarlari.md`'ye satır: kimlik, ad, kademe, yuva, set, çapa, ek katman, hareket, not (fikir, benzediği aksesuar ve farkı). Değişen aksesuarın satırı ve notu güncellenir. Reddedilen deneme "Reddedilen" bölümüne adı, tarihi ve nedeniyle.
- `scripts/skall-os.test.ts` kataloğun her aksesuarının kayıtta, kayıttaki her satırın katalogda olduğunu denetler: katalog girdisi (ana oturum, proje sahibinin kararıyla) ve çizim aynı PR'da gelir.

## 8. Teslim ve onay

- Çizimi bu ortamda kimse görmedi: proje sahibi telefonda görmeden aksesuar "bitti" sayılmaz. Aksesuar dev'e OTA ile gider; Kapsül ölçümü → "Skia yan yana" ve Kapsülünü süsle'de bakılır.
- Engineering'den iş isteniyorsa (yeni hareket, katalog girdisi ve `pnpm seed`, sunucu tarafı) `docs/skall-os/handoffs/` şablonuyla teslim yazılır: öğe sayısı, kullandığı hareketler, küçük avatardaki beklenen maliyet, telefonda bakılacaklar.
- Dönüş: `capsule-art-studio` ajanının teslim formatı.
