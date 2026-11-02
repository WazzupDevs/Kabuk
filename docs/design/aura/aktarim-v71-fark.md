# Aura v71 · eklenen ekranlar · fark listesi

Plan onaylı, kararlar `docs/decisions/aura-v71-eklenen.md`. P1 (#372) bölüm A'yı ve F2'yi, P2 bölüm B'yi uyguladı; kalan P3–P4 (fark-2).

Riso blob eşlemesi (canlı tuvalin asset'leri repodakilerle karşılaştırıldı, 2 Kasım): 14f4b3→4957ac, 3ccb82→7d5ef2, 9bb05a→f280a5, e8ff31→3c95b1, 140ee5→`peek-2`, 5618d9→`peek-1`; ötekiler aşağıdaki gibi. G6'daki iki belirsiz de böylece çözüldü. Satır numaraları 2 Kasım koduna göredir.


Kaynak: canlı tuval 1793652390-0881 (yerel kopya `docs/design/aura/project/`, 25 dosya güncellendi). Kod: `apps/mobile`. Koyu = `.dark.pA` (koyu.css). "?" = emin değilim.

Tokenların çoğu zaten v71'le aynı: `theme.ts` açık/koyu `primary`, `border`, `control`, `warnSoft/onWarnSoft`, `lively`, `accent` (koyu #3DDC84), `radius` (xs 6, md 16, lg 22). Farklar bileşenlerin hangi token'ı kullandığında.

## A. Ortak bileşenler (GaleriEklenen → mevcut bileşen)

### A1. Onay kutusu — `src/components/Checkbox.tsx`
- Boyut 24×24, köşe 8 → kodda 22 (`SPACING[5]+SPACING[0.5]`, :33), köşe `radius.xs` 6 (:35). Değişiklik: 24 ve köşe 8 (`KIT.size` → yeni `checkBox: 24`, `checkRadius: 8`).
- Boş: iç çizgi 2 `--border`, zeminsiz → kodda `colors.control` çizgi + `colors.surface` zemin (:37–38). Değişiklik: `colors.border`, zemin şeffaf.
- Dolu açık: `--primary` + check 16 `--on-primary` → aynı (:37–41). Koyu: zemin #3DDC84, check #0B0E0D → kodda koyuda da #0E8745 + beyaz. Değişiklik: koyuda `colors.accent` zemin, `KIT.dark` mürekkep #0B0E0D (yeni kit rengi `checkOnInk`).
- Etiket: panoda `fine` 13/500 `--text` (KayitOnay) → kodda `bodyStrong` 15/600 (:43). Değişiklik: ConsentBoxes'ta `fine`, text rengi. EngelleOnay'daki "Şikayet de et" panoda `h3` 16/600 (?: ConfirmWithReport ayrı fork'ta karşılaştırılmalı) → Checkbox'a `variant` parametresi.
- İkon: `checkmark` → LEGACY ile `check` (zaten kapsül ailesi), değişiklik yok.

### A2. Onay satırı — `src/features/onboarding/ConsentBoxes.tsx`
- En az 64 → kodda `TOUCH.tab` 56 (:105). Değişiklik: 64 (`TOUCH.large`).
- İç boşluk 12/16 (dikey/yatay, iki yanda 16) → kodda sol 16, sağ 12, dikey yok (:106–107). Değişiklik: `paddingVertical 12`, `paddingHorizontal 16` (işaretliyken 2 px çizgi için −1 telafisi kalır).
- Cam, köşe 22 → aynı (`KIT[scheme].glass`, `glassRadiusSm`). ✓
- İşaretli halka: 2 `--primary`, koyu #3DDC84 → kodda her iki temada `KIT.primary` #0E8745 (:112). Değişiklik: koyuda `colors.accent`.
- "Oku": 14/600 `--primary-pressed` (#0A7139), koyu #3DDC84 → kodda `label` 13/600, `tone="accent"` (açık #0B783D, koyu #3DDC84) (:122). Değişiklik: 14/600 (`button-small` boyu), açıkta `colors.primaryPressed`, koyuda `accent`.

### A3. Radyo + seçenek satırı — `src/components/Choice.tsx` (GenderChoice, SpotPicker `app/(app)/spot.tsx`, IdentitySheet, checkin, VenueHead kullanır)
- Radyo yeri: panoda etiketten SONRA, sağda (KayitCinsiyet, Galeri) → kodda solda (:126–137). Değişiklik: radyo sağa. (? SpotPicker/IdentitySheet'te de sağda mı: diğer fork'un panoları — MekanNoktaDegistir, MekanKimlikDegistir — ile doğrulanmalı.)
- Radyo boş: iç çizgi 2 `--border` → kodda `colors.control` + `surface` zemin (:133–135). Değişiklik: `colors.border`, zemin şeffaf.
- Radyo seçili: iç 7 `--primary`, koyu #3DDC84 → kodda 7 `colors.primary` her iki temada. Değişiklik: koyuda `accent`.
- Satır zemini: `--soft-bg` + 1 `--soft-line` + `--soft-shadow` (açık rgba(255,255,255,.74) / #FFF; koyu #121614 / rgba(255,255,255,.10), gölgesiz) → kodda cam gradyanı + `glassEdge` + `glassShadow` (:113–119). Değişiklik: `k.c.soft*` (kitte `.btn.soft` karşılığı zaten var mı ? — `Btn glassy`/`Round` soft değerleri tekrar kullanılabilir).
- Seçili halka: yalnızca 2 `--primary` (koyu #3DDC84) → kodda 2 px `KIT.primary` çizgi + ek `dotRing` `primaryRing` parıltısı (:115–119). Değişiklik: parıltı kalkar, koyuda `accent`.
- Ölçü: en az 56 (nokta seçiminde 60, görsel 44 köşe 14), iç 10/16 → kodda 56, iç 12/16 (:49–51). Değişiklik: `paddingVertical 10`; `minHeight` prop (spot: 60).
- Etiket: `h3` 16/600 → kodda `bodyStrong` 15/600 (:58). Değişiklik: `h3`.

### A4. Uyarı bandı — `src/components/Banner.tsx` (`tone="warn"`)
- Panoda ikon YOK → kodda `info` ikonu 20 (:192). Değişiklik: `warn` ikonsuz (? danger/info/positive tonları v71'de çizilmedi; onlarda ikon kalsın).
- İç boşluk 14/16 → kodda 12/14 (:184–185). Değişiklik: 14/16 (`warn` için ya da hepsi ?).
- Başlık 15/600 (`t-body-strong`) → kodda `label` 13/600 (:195). Metin `fine` 13/500 ✓. Aralık 4 → kodda 2 (:193).
- Renk: açık `warnSoft/onWarnSoft`, koyu #3A2A10/#FFE2B3 → `theme.ts` koyu değerleri aynı ✓. Köşe 22 ✓.

### A5. İzin kapalı kartı — `app/(app)/settings-notifications.tsx:60–77`
- İç boşluk 16 → kodda `KIT.size.pad` 18 (:62). Değişiklik: 16.
- Zemin/yazı: açık `--lively` #FFE6C7 / `--on-lively` #7A4300 → kodda `tags.amber` aynı ✓. Koyu #46290B / #FFD8A3 → kodda zemin `rgba(255,181,71,.16)` (auraKit.ts:370). Değişiklik: koyu kartta `colors.lively` (#46290B).
- Başlık `h3`, metin `fine` → kodda `sec` / `note` (? değerleri aynı olabilir, `KIT_TYPE` kontrolü).

### A6. Tarih kutusu — `app/(onboarding)/birth.tsx:149–184` → `Input box` (`src/components/Input.tsx`)
- Yükseklik 60 → kodda `KIT.size.field` 56 (Input.tsx:117–122). Değişiklik: `box` için 60.
- Zemin `--surface` + `--shadow-raised` (0 2px 8px .08), çizgisiz; koyu #1B211F gölgesiz → kodda cam gradyanı + `glassEdge` + `glassShadow` (Input.tsx:111–114, 87). Değişiklik: `box` için `colors.surface` (koyuda `surface2`), raised gölge, çizgi yok (odakta halka kalır).
- Yazı 21/600 ortalı → kodda `centered` ortalar; boy (? Input'ta `box` yazı boyu KIT_TYPE.field 17 görünüyor) → 21/600 (`title` boyu).
- Oran 1:1:1,6, ara 10, etiket 13/600 üstte 8 → aynı ✓ (birth.tsx:90, 168–169).

### A7. Fotoğraf seçici — `app/(onboarding)/extras.tsx:86–111`
- Çap 120 → kodda `PROFILE_PHOTO_SIZES.hero` 116 (extras.tsx:43, ProfilePhoto.tsx:19). Değişiklik: 120 (seçici ve dolu fotoğraf aynı boy ? — pano yalnız boş hâli çiziyor).
- Kesikli çizgi 3 → kodda `stroke.feature` 2 (:93). Değişiklik: 3.
- Zemin `--surface`, koyu #151A18; çizgi `--control`, koyu #2A332F → `theme.ts` değerleri aynı ✓.
- İkon: kapsül `photo` 40 `--accent` (koyu #3DDC84) → kodda `camera-outline` (→ kapsül `camera`) 28 `BRAND.purple` (:101). F1+F2: `photo`, 40, `colors.accent`.
- Düğme: `btn sm soft` + `photo` 20 → kodda `variant="secondary"` + `camera-outline` (:105–109). F2: ikon `photo`.

### A8. Ayar satırı — `src/features/settings/SettingsRow.tsx` + `RowList`/`Li` (`src/aura/kit.tsx`)
- En az 64, iç 12/16 → `Li` iç 9/16 (`liPadY` 9, auraKit.ts:594), minHeight ? Değişiklik: SettingsRow'da `padY 12`, `minHeight 64`.
- Ayırıcı soldan 52 → `RowList` inset `av.row + liGap` = 16+44+12 = 72 (kit.tsx:875, 892). Değişiklik: ikonlu listede `inset` 24 (16+24+12 = 52).
- İkon 24 `--muted`, ara 12 ✓. İleri oku 20 `--muted` → kodda `forward` `iconSm` (? 16 ise 20'ye).
- Tehlikeli satır `--danger` (koyu #FF977E) → kodda `c.warn` açık #A8301A / koyu #FF977E ✓.

## B. Kayıt panoları

### B0. Ortak: `src/features/onboarding/SignupStep.tsx`
- Adım noktaları: geçmiş/şimdiki `--primary`, koyu #3DDC84 → kodda `KIT.primary` her iki temada (:118). Değişiklik: koyuda `accent`.
- Sonraki nokta rgba(17,23,20,.16), koyu rgba(255,255,255,.18) → kodda `k.c.grab` #C6E0CC / #2A332F (:118). Değişiklik: yeni kit rengi `stepDot`.
- Sağda "n/7" yazısı: panoda yok (44 boş yer) → kodda `KIT_TYPE.stamp` "n/7" (:123–131). Değişiklik: yazı kalkar, 44 boşluk kalır; ekran okuyucu etiketi korunur (? metin kaldırmak "metin değişmez" kuralına dokunur mu — görünüş farkı olarak soruya değer).
- Birincil düğmede ikon: Onay/Foto `check`, Ad/Doğum/Cinsiyet "Devam" ve Telefon "Kod gönder" `forward`, Kod "Doğrula" `check` → kodda `Btn` ikonsuz (:178–184). Değişiklik: `action.icon`.
- Alanın başlıktan uzaklığı panoya göre adım başına: Onay 60, Ad 40, Doğum 50, Cinsiyet 50, Foto 20, Telefon/Kod 70 → kodda peek varsa 70, yoksa 20 (:56, :149). Değişiklik: `SIGNUP_KANKI[step].fieldTop`.
- Riso sahne ve bakan kankiler: panoda BÜTÜN adımlarda riso sahne (`scene-signup`) + riso kankiler + alanın üstünden bakan riso kanki → kodda yalnız Telefon/Kod riso (`RISO`, :59); Onay/Ad/Doğum/Cinsiyet/Foto çizilen kapsül `SayScene` ve peek'siz (:62–70, :162–171). Değişiklik: `SIGNUP_KANKI` (`src/theme/kankiMotion.ts:84`) adımlara genişler, `RISO` hepsini kapsar, `SCENE.look` kalkar (aşağıdaki yerleşimler).
- Riso görsel eşlemesi (pano blob → repo id, Telefon/Kod'dan çıkarıldı): 6a58f3→6f419d, 51fc47→9c96bd, c1f4f1→af811f, 236278→c189a4, 829b17→b83534, 4b2d83→1a80a9. Bilinmeyen 5 blob: 14f4b3, 3ccb82, e8ff31, 9bb05a, 140ee5 (?: repodaki kullanılmayan 7d5ef2, 3c95b1, 4957ac, f280a5, d2fbb5, 1e1bef'ten biri olabilir; tuvalin asset listesinden doğrulanmalı, yoksa `assets/riso/buddies`'e eklenmeli).

### B1. KayitOnay — `app/(auth)/agree.tsx` + ConsentBoxes
- Alan 60 aşağıda; peek 829b17(b83534) left 250 top 0 78×102.
- Sahne: balon left 16 right 128, kuyruk sağda; kankiler 14f4b3 (?) left 14 bottom −12 104×136, 6a58f3(6f419d) right −6 bottom −14 150×197 (konuşan sağdaki ?).
- Kutular arası 8 ✓. Satır/kutu farkları A1–A2.
- Düğme `check` ikonlu (B0).

### B2. KayitAd — `app/(onboarding)/name.tsx`
- Alan: cam, yükseklik 72, iç 22, yazı 21/600, imleç 2×26 `--primary` (koyu #3DDC84) → kodda `Input` varsayılanı 56, yazı `KIT_TYPE.field` 17/500 (Input.tsx:117–122). Değişiklik: Telefon alanıyla aynı büyük alan (`prefix` olmadan `phoneField` boyu) — yeni `Input` seçeneği (ör. `big`).
- Etiket `t-label` 13/600 ✓; ipucu `fine`, yandan 6 içeride → (? Input hint hizası).
- Alan 40 aşağıda; peek 3ccb82 (?) left 232 top 22 80×105.
- Sahne: balon left 116 right 112 (kuyruk sağda); kankiler e8ff31 (?) left 20 100×131, 9bb05a (?) right −4 150×197.

### B3. KayitDogum — `app/(onboarding)/birth.tsx`
- Kutular A6. Alan 50 aşağıda; peek 236278(c189a4) left 6 top 0 78×102.
- Sahne: balon left 16 right 16; kankiler 51fc47(9c96bd) left 18 92×121, 4b2d83(1a80a9) right −4 132×173.
- Onay sheet'i (3. telefon): `.sh` iç 12/20/38, zemin `--canvas` (koyu #121614), başlık `title`, metin `fine`, düğmeler primary + soft, ara 10 → kodda `Sheet` + `Button lg` primary/neutral, `gap-2.5` (:123–143). ✓ (? `neutral` = `.btn.soft` görünüşü mü).

### B4. KayitCinsiyet — `app/(onboarding)/gender.tsx` + GenderChoice
- Seçenekler A3 (radyo sağda, h3, soft zemin, min 56).
- Alan 50 aşağıda; peek 140ee5 (?) left 240 top 4 64×84.
- Sahne: balon left 16 right 16; kankiler c1f4f1(af811f) left 10 84×110, 14f4b3 (?) right −4 100×131.

### B5. KayitFoto — `app/(onboarding)/extras.tsx`
- Geri düğmesi yok ✓ (K3; `onBack` verilmiyor).
- Seçici ve düğme A7; uyarı bandı A4 (ikonsuz, yalnız `fine`; kodda `Banner tone="warn" body=…` :114 → ikon kalkar).
- Seçici ile düğme arası 12 ✓ (`gap-3`); grup ile bant arası 12 → kodda `gap-4` 16 (:81). Değişiklik: 12.
- Alan 20 aşağıda; peek 829b17(b83534) left 40 top 40 74×97.
- Sahne: balon left 16 right 108; tek kanki 3ccb82 (?) right 8 bottom −10 86×113.
- Düğme `check` ikonlu.

### B6. KayitMetinler — `app/(onboarding)/consents.tsx` (`step` yokken)
- Üst çubuk yok, başlık içeriğin 8 altında → kodda boş 44'lük üst satır + `SPACING[7]` 28 (SignupStep.tsx:97–135). Değişiklik: `step` ve `onBack` yokken üst satır çizilmez, başlık üstü 8 (?: `.content` üst boşluğu ekran.css'te; doğrulanmalı).
- Gövde 10 altında ✓. Kutular başlık bloğunun 24 altında → kodda 20 (:149). Değişiklik: 24.
- Sahne yok ✓; ama düğmenin 120 üstünde ortada duran riso kanki 9bb05a (?) left 140 110×144 → kodda yok. Değişiklik: tek riso kanki.
- Pasif düğme `btn off` + `check` ikonu (U10 renkleri zaten kodda ✓ ?).
- Hâller (yükleniyor ortada, hata cloudOff + Tekrar dene) ✓ (consents.tsx:56–79).

### B7. Telefon, Kod — `app/(auth)/phone.tsx`, `otp.tsx`
- Adım 2/7 ve 3/7: kod zaten böyle ✓ (F3; `SIGNUP_STEPS`).
- Kalan farklar B0'daki ortaklar: koyu nokta rengi, sonraki nokta rengi, "n/7" yazısı, düğme ikonları ("Kod gönder" `forward`, "Doğrula" `check`).


Panolar: `docs/design/aura/project/` (v71). Kod: `apps/mobile`. Ortak bileşen farkları (Checkbox, Choice/radyo, Banner warn, ayar satırı A8, fotoğraf seçici) fark-1.md → A1–A8; burada yalnızca atıf. "?" = emin değilim.

## Tümüne yayılan farklar
- G1. `.note` (panolarda yerel sınıf) 13/18 500 muted → kodda `T v="note"` 14/20 (auraKit.ts:68). Hesap, Gizlilik, Engellenenler, SessizeAlinanlar, BildirimAyarlari'da kullanılıyor. Öneri: bu ekranlarda `fine`, ya da `note` token'ını 13/18 yap (? başka ekranları da etkiler, önce grep).
- G2. Liste satırı `.lr`: en az 64, iç 12/16 → `Li` iç 9/16, minHeight yok (kit.tsx:910, auraKit.ts:594). fark-1 A8 ile aynı; `RowList`/`Li`'ye `minHeight 64`, `padY 12` (ya da SettingsRow ve kişi satırları için `padY` parametresi).
- G3. Satırdaki avatar `.av` 44 → kodda `Av size="row"` 48 (auraKit.ts:523). Ayırıcı soldan 72 (16+44+12) → kodda `RowList` varsayılan inset 48+12 → 76. Öneri: Arkadaşlar, Engellenenler, Sessize alınanlarda `Av size="md"` (44), `RowList inset={KIT.size.av.md + liGap}`.
- G4. Ayar satırı ikonu 24, ok 20 → kodda `KIT.size.icon` 22, `iconSm` 18 (auraKit.ts:602–603); ayırıcı soldan 52 → kodda 16+22+12 = 50. Öneri: SettingsRow'da ikon 24, ok 20 (inset otomatik 52).
- G5. Eski bileşenler (`Button` neutral/lg, `Text`, `Card`, `IconButton`, `ScreenHeader`) kit yerine: KapsulKarakterler, YasalMetin, GuncellemeGerekli, IdentitySheet, spot.tsx, ReportModal, ConfirmWithReport, MekanSohbetiProfil sheet'leri. Pano karşılığı `.btn.soft` = `Btn variant="glassy"`, `.btn.primary` = `Btn`, `.btn.danger` = `Btn variant="danger"` (danger-soft zemin). Öneri: kit'e geçir.
- G6. Riso süs kankiler (`.stand`/`.peek`, blob): Arkadaslar (5618d9, listenin üstünden bakar, liste 76 aşağıda başlar), Gizlilik (51fc47→9c96bd, sağ alt 96×126), Engellenenler (236278→c189a4, sol alt 96×126), SessizeAlinanlar (e8ff31 ?, sağ alt 96×126), YasalMetin (4b2d83→1a80a9, Devam düğmesinin üstünden bakar 80×105), GuncellemeGerekli (6a58f3→6f419d, başlığın üstünde 110×144). Kodda hiçbirinde yok. 5618d9, e8ff31: repo karşılığı belirsiz (?: `assets/riso/buddies`'te 7d5ef2, 3c95b1, 4957ac, f280a5, d2fbb5, 1e1bef'ten biri olabilir). Öneri: `RisoKanki`/`Peek` ile, ayrı pakette.

## Ekran ekran

### Arkadaslar — `app/(app)/(tabs)/profile/friends.tsx`
- Geri ve sohbet düğmesindeki ikon `--accent` (`.round.soft .ci`) → kodda `Round` ikonu ink (kit.tsx:~436). Öneri: bu ekranda `Round color={c.accent}` (? yalnız bu panoda var, PageTop geri düğmesi ortak; tuval sahibine sorulabilir).
- Avatar 44, ayırıcı 72, satır 64: G2, G3.
- Kanki ve liste 76 aşağıda: G6.
- Alt solma `.fade` 150 (alt menü üstü) → kodda yok (? `TabBarFade` var mı bak; sekme ekranlarında vardı, U16).
- Hata kartı: `Card tone="note"` + `Button neutral sm refresh-outline` (eski) → rapor "liste varsa üstte not kartı + Tekrar dene"; pano yok. Değişiklik yok, yalnız `Btn sm variant="glassy" icon="refresh"`.

### KapsulKarakterler — `app/(app)/(tabs)/profile/capsules.tsx`
- Üst satır: pano `.hd` iç 52/20/12, geri `round soft` (44) → kodda `SafeAreaView` + `padding SPACING[4]` her yana, `IconButton round chevron-back` (:~25). Öneri: `PageTop` benzeri; başlık `t-heading`, alt `fine` (kodda `Text heading` + `fine` ✓).
- "Üç durum" ve "Anonim kapsüller" `h3` 16/600 → kodda `Text variant="heading"` (?: heading kaç px, büyükse h3).
- Üç durum kartı: `.card` (surface + raised, köşe 22, iç 16/4) → `Card` (?: eşdeğer mi). Yüzler 64: Ece `av lg` 64, varsayılan `.def` 64 control zemin + user ikonu 34 muted, kapsül 64 → kodda `Avatar xl` (96?) ve `LookAvatar 48` (:~45–55). Öneri: üçü 64.
- "İsimleri yenile" `btn sm soft` + ikon md 20 (? ikon adı eşleşmedi, refresh ya da shuffle) → `Button sm secondary icon="refresh"`. Öneri: `Btn sm variant="glassy"`.
- Döşeme: 3 sütun, ara 8, iç 12/4, köşe 22, surface + shadow-card, kapsül 48 → kodda aynı ✓.
- Alt solma (`mask` 560→610) ve alt menü → kodda yok (?).

### Hesap — `app/(app)/settings-account.tsx`
- Telefon değeri `h3 mono` (harf aralığı .04em) → kodda yok (:~45). Öneri: `letterSpacing` 0.64.
- Not G1; satırlar G2, G4; tehlikeli satır `--danger` = kodda `c.warn` (#A8301A / #FF977E) ✓.
- Alt kısım: wordmark, ara 8, üstte 24 ✓.
- Silme sheet'i: metinler `fine` → kodda `note` (G1); düğme arası 10 → kodda `rowGap` 12. Btn danger + trash, glassy Vazgeç ✓.
- K4 ✓ (`maskPhone` "+90 5•• ••• •• NN"; doğum tarihi `useProfileView(own)` kişinin kendisi).

### Gizlilik — `app/(app)/settings-privacy.tsx`
- Satırlarda sayı yok → kodda `count` (Engellenenler, Sessize alınanlar) gösteriliyor. ? (görünüş mü davranış mı; panoya uyulursa `count` kalkar, proje sahibine sor).
- G1, G2, G4, G6 (sağ alt kanki 9c96bd).

### BildirimAyarlari — `app/(app)/settings-notifications.tsx`
- Kart başlığı `h3` 16/600 + `fine` 13/18 → kodda `sec` 18 + `note` 14 (:~60, SwitchRow). Öneri: `h3` + `fine`.
- Bölüm başlığı `.sec2` 16/600, üstte 8 → kodda `sec` 18. Öneri: `h3` + `marginTop 8`.
- Kart iç boşluğu 14/16 → kodda üst kart `Glass sm` (iç ? ), SwitchRow 16/16. Öneri: 14/16.
- İzin kapalı kartı `--lively`/`--on-lively` (koyu #46290B/#FFD8A3) → kodda `tags.amber` (açık #FFE6C7/#7A4300 ✓; koyu rgba(255,181,71,.16) ✗). Öneri: kit'e `lively`/`onLively`, koyu #46290B.
- Kapalıyken soluk .45 → kodda `OFF` 0.6 (:~150).
- "Açık" etiketi `tag green` ✓; toggle ✓ (? boyu kontrol edilmedi).

### Engellenenler — `src/features/chat/BlockedList.tsx`, `settings-blocked.tsx`
- G1, G2, G3; düğme `btn sm soft` = `Btn sm glassy` ✓; kanki G6 (c189a4).

### SessizeAlinanlar — `app/(app)/settings-muted.tsx`
- Anonim satır kapsül 44 + "kapsul-xx55" → kodda `Av name={m.label}` baş harf (:~35). **K8 tutmuyor**: API (`VenueChatMute` = id, label, profiled, createdAt; `_shared/pure/api/venueChat.ts:40`) kapsül görünüşünü taşımıyor. Öneri: yanıta anonim satır için `look` eklemek (sunucu + tip). Rapor "API değişmez" diyor → çakışma, proje sahibine tek soru.
- Profilli satır: pano baş harf (çizim; U11 gereği gerçek fotoğraf) → kodda fotoğraf da yok (yanıt `photoUrl` taşımıyor) (? aynı soru).
- G1, G2, G3, G6.

### YasalMetin — `app/(app)/legal/[doc].tsx`, `src/components/LegalText.tsx`
- Üst: `round soft` geri + `display` başlık + `fine` alt (üstte 4) → kodda `ScreenHeader` (eski) (:~3). Öneri: `PageTop` (`sub`).
- Metin `.legal` 15/24 500, üstte 16 → kodda `Text` varsayılan (? boyu). Öneri: kit `T` 15/24.
- "Devam" `btn soft block`, alttan 46, sabit → kodda `Button neutral`, `mt-auto pt-8`. Öneri: `Btn block variant="glassy"`, sabit alt alan (U9).
- Kanki düğmenin üstünden bakar (G6, 1a80a9).
- `app/kvkk.tsx`, `app/terms.tsx` aynı `LegalText` (?: kontrol edilmedi).

### MekanNoktaDegistir — `app/(app)/spot.tsx`, `src/features/checkin/SpotPicker.tsx`
- Seçenek satırı en az 60, iç 10/16, görsel 44 köşe 14, `--soft-bg` + 1 `--soft-line`, seçili halka 2 `--primary` (koyu #3DDC84), radyo 24 seçili iç 7 `--primary` (tik yok) → kodda 68, görsel 48/14, `raisedRound` zemin + gölge, seçili kenar `accent`, radyo halkası `accent` + `check` tiki (SpotPicker.tsx:99–126). **Çakışma:** aynı SpotPicker check-in'de U18 (CheckInNokta, v65: satır 68, riso 48/14, "seçili halka ve tik accent") ile çizili. GaleriEklenen "nokta seçiminde 60, görsel 44" diyor. ? Öneri: v71 değerleri ikisine de (CheckInNokta panosu v71'de değişti mi bakılmalı) ya da `compact` varyantı; proje sahibine sor.
- "Bu noktadayım" primary + `check` ikonu → kodda `Button lg` ikonsuz. Öneri: `Btn block icon="check"`.
- Vazgeç `btn soft` → kodda `Button neutral`. Öneri: `Btn variant="glassy"`. Düğme arası 10, üstte 4 ✓ (`gap-2.5 pt-1`).
- Hata `Banner tone="danger"` ✓ (pano yok).

### MekanKimlikDegistir — `src/features/checkin/IdentitySheet.tsx`
- Yüzler `.av` 44 (profil ve kapsül), ara 8, ok `forward` md 20 muted → kodda `Avatar lg` (64), `LookAvatar 48`, `AppIcon arrow-forward` (LEGACY → `forward`, görünüş aynı; F2 için adı `forward` yap) (:~80–90). Öneri: ikisi 44.
- Uyarı bandı: ikonsuz, başlık `t-body-strong` 15/600, metin `fine`, köşe 22, iç 14/16 → `Banner tone="warn"` (fark-1 A4).
- Düğmeler: `Btn` primary + `glassy` Vazgeç, ara 10 → kodda `Button lg` + `neutral`.
- "Fotoğraf ekle" `camera-outline` → F2 `photo`.
- K5 ✓: bant düğmelerin üstünde, başlıklar tr.ts:1492/1496/1500 ("Anonim görün?", "Mekan sohbetinde anonim yaz?", "Profilinle görün?"), fotoğrafsızda "Fotoğraf ekle" (tr.ts:1504).

### MekanSohbetiProfil — `app/(app)/venue-chat/[messageId].tsx`
- Üst, hero 120 + kanki, ad display, istek düğmesi `Btn` + `invite` → kodda `ProfileTopBar`/`ProfileHead` (U31'den) ✓ (? pano ikonu eşleştiricide `personRemove` çıktı; `invite` doğru olmalı).
- "Geri" `btn soft block` her zaman alttan 46 → kodda yalnız profil görünmezken (`!view.data`) ve `Btn` primary (:~85). Öneri: sabit alt alan, `glassy` (? davranış değişikliği sayılır mı: düğme hep görünür; proje sahibine).
- İstek onayı sheet'i: ikon diski yok, metin `body` text rengi, primary "İsteği gönder" + soft "Vazgeç" (ara 10) → kodda `icon="person-add-outline"` disk, `Text`, yalnız `Button`, Vazgeç yok (:~122–135). Öneri: diski kaldır, `Btn` + `Btn glassy` Vazgeç (Vazgeç yeni düğme ama aynı kapatma; metin `tr.common.cancel` var).
- Seçenekler menüsü (Şikayet et, Engelle) panoda yok; değişiklik yok.

### SikayetEt — `src/features/chat/ReportModal.tsx`
- Başlık satırı: `report` ikonu 24 başlığın solunda, ara 10 (disk yok) → kodda `Sheet icon="flag-outline"` 56'lık disk, `flag` çizimi (:~30). Öneri: Sheet'e satır içi ikon seçeneği (`titleIcon`), ad `report` (F2).
- Nedenler `btn soft block`, ara 8 → `Button neutral` (? neutral = soft mu). Öneri: `Btn block variant="glassy"`. Vazgeç `ghost` ✓.
- K7 ✓: `reasons` parametresi; `GAME_FLOW_REPORT_REASONS` yalnız oyun akışında (ReportModal.tsx:12).

### EngelleOnay — `src/features/friends/ConfirmWithReport.tsx`
- İkon diski yok → kodda `icon="shield-outline"` disk. Öneri: kaldır.
- "Şikayet de et": `glass sm opt` en az 56 içinde kutu 24 + `h3` → kodda düz `Checkbox` (`bodyStrong`). Öneri: Checkbox'a `boxed` varyantı (fark-1 A1).
- Engelle `btn danger block` + `block` ikonu md 20, danger-soft / on-danger-soft → kodda eski `Button variant="danger"` = kabarık kapsül + kırmızı yazı (Button.tsx:139–155). **K6 görünüşte tutmuyor**. Öneri: `Btn variant="danger" icon="block"`. Ara 8.
- K6 varsayılan boş ✓ (`useState(false)`).
- `historyActions.tsx:88` ve `messages/[threadId].tsx:463` `flag-outline` kullanıyor (F2 → `report`).

### GuncellemeGerekli — `src/features/update/UpdateRequired.tsx`
- Riso kanki 110×144 başlığın üstünde (6f419d) → kodda yok (G6).
- Wordmark üstte 4, altta 12 → kodda `mb-3` (12) ✓; başlık `t-heading` ✓ (`Text heading`); metin `body` ✓ muted (? pano `body` rengi text olabilir).
- Güncelle `btn primary block` → `Button` (eski). Öneri: `Btn block`. Alt boşluk 46 (? `Screen` alt boşluğu).

## F2 — ionicons adları (AppIcon LEGACY eşlemesi, `src/components/AppIcon.tsx`)
Hepsi zaten kapsül çizimine çiziliyor (Ionicons yok), ama eşleme hedeften farklı:
- `camera-outline` → kodda `camera`, hedef `photo`: `app/(onboarding)/extras.tsx:108`, `IdentitySheet.tsx:105`.
- `flag-outline` → kodda `flag`, hedef `report`: `ReportModal.tsx:30`, `historyActions.tsx:88`, `messages/[threadId].tsx:463`.
- `arrow-forward` → `forward` ✓ hedefle aynı: `IdentitySheet.tsx:89` (yalnız adı kapsül adına çevir).
Öneri: çağrı yerlerinde kapsül adı (`photo`, `report`, `forward`); LEGACY'de `camera-outline`/`flag-outline` eşlemesini de hedefe çevirmek bütün eski çağrıları düzeltir (? `camera`/`flag` başka yerde bilerek mi kullanılıyor, grep).
Diğer eski adlar (kapsüle eşlenmiş): `cloud-offline-outline`, `refresh-outline` (friends.tsx), `chevron-back`, `refresh` (capsules.tsx), `eye-off-outline` (venue-chat), `person-add-outline`, `shield-outline`.

## v64 / sıra
- `skall.css` ve `koyu.css` v71'de değişmedi (yerel kopyada fark yok; aktarim-v65 §0: "v64 ve v65 aynı"). auraKit.ts'te "v64" izi yok. Token çakışması yok; farklar bileşen kullanımında.
- Sıra bağımlılığı: fark-1 ortak bileşenleri (Checkbox, Choice, Banner, Li/SettingsRow) önce; bu ekranlar onlara dayanır. SpotPicker değişikliği U18 check-in'i de etkiler.
- Not (kapsam dışı): ilk çatal panoları `add01a6` "Tuval kopyası: v71 eklenen ekran panoları" commit'iyle U8 dalına (#371) koydu ve dal origin'le eşit (push edilmiş görünüyor); #371 artık pano dosyalarını da taşıyor.
