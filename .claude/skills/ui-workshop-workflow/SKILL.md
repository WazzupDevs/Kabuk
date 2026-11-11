---
name: ui-workshop-workflow
description: Bir tasarım talebini Atölye'de (UI Workshop; Bileşen önizleme → Atölye) gerçek bileşenlerle taslağa ve alternatiflere çevirme, proje sahibinin onayını alma ve onaylı taslağı Engineering'e teslim etme yordamı. Yeni ekran, var olan ekranda görünüş değişikliği ve "şunun iki hâlini yan yana göreyim" isteklerinde kullan.
---

# Atölye yordamı

Akış: talep → inceleme → Atölye taslağı → proje sahibinin incelemesi → onay → teslim → uygulama (`tuval-aktarim`) → bağımsız denetim. **Onay gelmeden hiçbir üretim ekranı değişmez.**

Atölye nedir: `apps/mobile/src/features/design/workshop/`. Taslaklar `registry.tsx` → `WORKSHOP_DRAFTS` içinde durur; her taslağın anahtarı, başlığı, durumu (`draft`, `approved`, `rejected`) ve varyantları vardır. Telefonda Ayarlar → Tasarım (test) → Bileşen önizlemesini aç → Atölye'de açılır; yalnız geliştirme ve preview build'de görünür (`designPickerEnabled`), üretimde yoktur. Figma ya da ücretli araç kullanılmaz.

Atölye'ye girmeyen iş: var olan parçalarla yapılan küçük ekleme (menü satırı, onay sayfası), metin düzeltmesi, hata düzeltmesi (`CLAUDE.md` → Kod kuralları). Onlar doğrudan yapılır.

## 1. İncele

- Var olan ekransa önce `ui-screen-audit` (kısa hâliyle: kapsam, bilinen bulgular, kararlar). Ekranın bugünkü hâli kaynaktır; taslak yalnız istenen parçayı değiştirir.
- Yeni ekransa ürün belgesinde ilgili bölüm Grep ile bulunur (`docs/SPEC_V4.md`); belgede olmayan davranış taslağa konmaz, proje sahibine tek soru olur.
- Aura tuvalinde ilgili pano var mı bakılır (`docs/design/aura/project/<Pano>.dc.html`, yalnız ilgili pano). Tuval yeni görünüşün kaynağıdır; Atölye onun telefondaki, gerçek bileşenli hâlini gösterir.

## 2. Gereksinimi yaz (oturum içinde)

Kısa liste: ne değişecek (`R1`…), ne korunacak (`K1`…: veri bağlantısı, hâller, davranış, metin), açık sorular (`S1`…). Token'larda olmayan her değer bir açık sorudur; taslağa tahminle girmez.

## 3. Taslağı kur

- `registry.tsx`'e yeni girdi: anahtar (küçük harf, İngilizce, ör. `venueHeader`), `status: 'draft'`, varyantlar. İlk varyant her zaman **bugünkü hâl**dir (var olan ekranda); ötekiler öneriler. En çok üç öneri.
- Varyant gerçek bileşenlerle çizilir (`src/components/`, `src/aura/`), örnek veriyle; sunucuya, sorguya ve mutation'a bağlanmaz. Büyük taslak kendi dosyasında durur (`workshop/<anahtar>.tsx`).
- Üretim bileşeni taslak için değiştirilmez. Öneri bileşenin yeni bir hâlini gerektiriyorsa o hâl taslağın dosyasında, yerel olarak kurulur; üretime onaydan sonra Engineering taşır.
- Metinler `tr.ts` → `design.workshop` altında. Değerler yalnız tokenlardan ve `KIT`'ten.
- Her varyant `render(width)` ile kendi genişliğini alır: 320 dp'de de kesilmeden çizilmelidir.
- `docs/skall-os/departments/UI_UX.md` → "Taslak kaydı"na satır eklenir (durum Taslak).

## 4. Doğrula ve görüntü üret

- `pnpm typecheck`, `pnpm lint`, `pnpm test` (kayıttaki hata, ör. iki kez kullanılan anahtar, testte değil Atölye'nin üstünde yazıyla görünür: kayıt bileşen çizdiği için test onu okuyamaz).
- Görüntü iki yoldan biriyle; hangisi kullanıldıysa o yazılır:
  1. **Telefon:** değişiklik birleşince dev'e OTA ile gider (`.claude/skills/yayin`); proje sahibi Atölye'yi açar. "Yan yana" iki varyantı aynı ekranda gösterir.
  2. **Görsel kapı:** Atölye bir önizleme setidir, yani kapının `galeri/workshop` durumudur. `e2e/visual/states.json`'a `{"id": "galeri-atolye", "app": "galeri/workshop", "baz": false}` deneme girdisi eklenip `e2e.yml` → `visual` elle koşturulur; görüntüler koşunun `e2e-run-visual` artifact'ındadır (`.claude/skills/e2e`). Deneme girdisi iş bitince kaldırılır.
- Bu ortamda uygulama çalışmaz: görüntü alınmadıysa "görülmedi" yazılır, taslak görülmüş gibi sunulmaz.

## 5. Proje sahibine sun ve bekle

Tek mesaj: taslağın anahtarı, varyantlar ve aralarındaki fark (birer satır), her varyantın bedeli (yeni bileşen, çizim maliyeti, dokunduğu ekranlar), açık sorular, öneri. Sonra beklenir. PR'daki yorum, ajanın dönüşü ya da sessizlik onay değildir; onay proje sahibinin sohbetteki açık sözüdür.

## 6. Kararı kaydet

- **Onay:** `registry.tsx`'te durum `approved`, `note` seçilen varyantı söyler; "Taslak kaydı" satırı güncellenir (tarih, seçilen varyant). Gerekçesi olan karar `docs/decisions/<konu>.md`'ye.
- **Red:** durum `rejected`, `note` nedeni söyler; "Taslak kaydı"na neden yazılır. Reddedilen taslak silinmez; aynı öneri yeniden yapılmasın diye durur. Kayıt kalabalıklaşırsa uygulaması birleşmiş onaylı taslaklar kaldırılır (satırı kayıtta kalır).
- **Revizyon:** yeni varyant eklenir (`C`, `D`), eskiler durur; 4. adıma dönülür.

## 7. Teslim

`docs/skall-os/handoffs/README.md`'deki şablonla teslim belgesi yazılır: seçilen varyantın dosyası, etkilenen üretim dosyaları, dokunulmayacaklar (`K` listesi), değerler token adıyla, kabul kriterleri, test gereksinimleri. "Kullanıcı onayı" başlığına onayın cümlesi ve tarihi girer.

## 8. Uygulama ve denetim

- Engineering teslimi `.claude/skills/tuval-aktarim` yordamıyla uygular (ekran işi `mobil`). Teslimde olmayan değer tahmin edilmez; teknik itiraz teslimin "İtiraz" bölümüne yazılır ve karar tasarım tarafına döner.
- Uygulayan kendi işini onaylamaz: ana oturum farkı okur ve `pnpm check`'i koşar; ekran büyükse `performans`, gizliliğe dokunuyorsa `guvenlik`.
- Teslimin "Sonuç" bölümüne PR numarası ve nasıl doğrulandığı yazılır.
