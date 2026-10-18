# skall arayüz denemesi: devir raporu (v45)

Bu rapor yalnızca v44'ten farkları yazar. v44 raporunda burada geçmeyen her şey geçerli.

- **Dosya:** `skall-masa-deneme-v45.html`. Tek dosya, kendi başına çalışır. Taban: `docs/design/v44/skall-masa-deneme-v44.html` (bayt bayt aynı dosya).
- **Taslaktan alınanlar:** yalnızca giriş animasyonu (ilk ekran sahnesi) ve kayıt adımlarındaki kapsül dostları. Kaynak: `skall-masa-deneme-v44-taslak.html` ile `ilk-ekran-acik.mp4` ve `ilk-ekran-koyu.mp4`.
- **Taslaktan alınmayanlar:** taslağın kendi kayıt ekranları ve metinleri. Bunlar arasında:
  - Başlamadan önce'deki bilgi satırları ve metin alt sayfası;
  - yaş onayı alt sayfası;
  - kod kutusunun sarsılması;
  - cinsiyet seçeneklerinin açıklamaları;
  - "Hazırsın" ekranı;
  - eski oyun adları ve oyun renkleri.

  v44'ün kayıt ekranları, metinleri ve davranışı aynen duruyor. Değişenler: ilk ekran, dostlar, adım sırası ve son adımın düğme etiketi (aşağıda).
- **SPEC_V4'ün diğer kararları işlenmedi:** v44'ten farklı uygulanacakların arasından yalnızca K-19 (onaylar başta) işlendi. K-17 ve K-20–K-23 gibi diğerleri bu denemede yok; görev giriş ve kayıtla sınırlı.
- **Koda ve repoya dokunulmadı.** Açık kalanlar bölüm 6'da soru olarak duruyor.
- **Diğer ekranlar v44'le aynı:**
  - v44'ün dört stil bloğu (ana, koyu otomatik, v44, koyu elle) bayt bayt aynı.
  - Yeni kurallar iki yeni blokta (`v45`, `v45-dark`) ve yalnızca kayıt sayfasının seçicilerine dokunuyor.
  - Betikte değişen yalnızca kayıt modülü. Avatar modülüne bir işlev eklendi (`AV.fig`: zemin dairesi olmadan kapsül), mevcut işlevler değişmedi.

---

## 1. Kayıtta sıra: onaylar başta (SPEC_V4 K-19)

Kayıt artık ilk ekranla açılır (bölüm 2). "Telefonla devam et" düğmesinden sonraki 7 adım:

| Adım | Ekran | Değişen |
| --- | --- | --- |
| 1/7 | Başlamadan önce | v44'te 7/7 idi |
| 2/7 | Telefon | |
| 3/7 | Kod | |
| 4/7 | Ad | |
| 5/7 | Doğum tarihi (18 altı buradan ayrılır) | |
| 6/7 | Cinsiyet | |
| 7/7 | Fotoğraf | Son adım. Düğme "Bitir"; fotoğraf yoksa "Fotoğrafsız bitir" (v44'te "Devam" ve "Fotoğrafsız devam et") |

- **Geri:** Başlamadan önce'den geri ilk ekrana döner. Sahne perdesiz yeniden oynar.
- **Cinsiyet kapısı** (eski hesap) v44'teki gibi.

## 2. Giriş animasyonu (ilk ekran)

**Sahne:** "Aynı mekanda, aynı masada."
- Kapsüller mekanda tek tek belirir.
- Üç masa kurulur, herkes bir masaya oturur, bir yer boş kalır.
- Yakın masada herkesin kendi telefonu vardır: telefon kişiyle gelir, kişiyle gider.
- Lambalar yanar. Oyun başlayınca yakın masadaki telefonlar birlikte yanar, konfeti saçılır.
- Uzak masadan biri boş yere atlar; onun yeri boşalır.
- Bir kapsüle dokununca kapsül zıplar (taslaktaki gibi).

**Açılış perdesi:** Sahneden önce koyu zeminde logo görünür, pencere logodaki kesişimden açılır. Bu, uygulamadaki LaunchCurtain'in taklididir.

**Kısa:**
- Bütün hareket perde dahil yaklaşık 5 saniyede biter: perde 1,2 sn, sahne 4,7 sn ile örtüşür.
- Döngü yok. Sahne son hâlinde durur.
- Taslaktan farkı: taslakta biri her 4,6 sn'de masa değiştiriyordu; sallanma, göz kırpma, lamba salınımı ve boş yerin parlaması sürekliydi. v45'te her biri bir kez oynar (soru 2).

**Atlanabilir:**
- Giriş sürerken sağ üstte "Geç" düğmesi durur.
- Perdeye dokunmak da geçer.
- Geçince sahne hemen son hâline gelir ve hareket durur.
- "Telefonla devam et" giriş sürerken de çalışır; sahne durur.

**Hareket azaltma açıkken:**
- Perde yok, "Geç" yok.
- Sahne baştan son hâlinde ve durağan; geçiş, konfeti ve kapsüle dokununca zıplama yok.

**Ekran okuyucu:**
- Sahne gizli.
- Okunanlar: logo ("skall"), başlık, açıklama, "Telefonla devam et" ve "skall 18 yaş ve üzeri içindir."

**Yerleşim:**
- Sahne kalan yeri alır; kısa ekranda ve büyük yazıda küçülür (en az 160 px).
- 320x568'de yazı %130'dayken başlık, açıklama ve düğme kaydırmadan görünür.

**Koyu tema:** Taslağın koyu sahnesi (mor gece zemini, açık lamba ışığı, koyu telefonlar).

## 3. Kapsül dostları

Her adımda farklı bir kapsül sağ kenardan bakar:

| Adım | Dost | Ne yapar |
| --- | --- | --- |
| Başlamadan önce | Güneş gözlüklü | Her kutuda başını sallar; ikisi de işaretlenince zıplar |
| Telefon | Korsan şapkalı | Numara geçerli olunca zıplar |
| Kod | Göz bantlı | |
| Ad | Kedi kulaklı | Ad geçerliyse balon: "Selam Elif!" (12 karakterden uzun adda "Selam!") |
| Doğum tarihi | Parti şapkalı | Tarih seçilince zıplar, küçük konfeti |
| Cinsiyet ve cinsiyet kapısı | Sade | Seçimde başını sallar |
| Fotoğraf | Kaptan | Fotoğraf eklenince fotoğraf çerçevesi parlar, dost zıplar |

**Ortak davranış:**
- Bir alana dokununca dost alana bakar.
- Hata metni çıktığında başını iki yana sallar. Bu yalnızca hata metniyle birlikte olur: geçersiz numara, kod gönderilemedi, yanlış kod. Metin kalkınca sallanma da biter.
- Hatayı her zaman metin söyler; düğmeye boşuna basmak gibi metinsiz durumlarda dost tepki vermez.
- Göz bir kez kırpar, sonra durur.

**Süs:**
- Ekran okuyucuya kapalı (`aria-hidden`), dokunulmaz.
- Hiçbir yazının, alanın ya da düğmenin üstüne binmez:
  - binecekse en çok 18 px yukarı kayar (üst satırın altında kalır);
  - yine binecekse o adımda görünmez.
- Balon da bir şeye binecekse gösterilmez.

**Hareket azaltma açıkken:** Dost kaymadan görünür. Zıplama, sallanma, göz kırpma, konfeti ve parlama yok. Bakış yönü anında değişir.

## 4. Uygulamaya geçiş notu

Yeni native paket yok. Hepsi `apps/mobile/package.json`'da olan üç paketle yapılır: `react-native-reanimated` 4.5.1, `react-native-svg` 15.15.4, `expo-haptics`.

**Çizim:**
- Kapsüller bugünkü avatar SVG'sinden, zemin dairesi olmadan çizilir (denemede `AV.fig`).
- Masalar, lambalar ve ışık konisi (`LinearGradient`) `react-native-svg`'yle çizilir.
- Telefonlar ve konfeti `View`.
- Görsel dosya yok.

**Hareket:**
- Hareket `react-native-reanimated` paylaşılan değerleriyle yapılır (`withDelay`, `withSequence`, `withTiming`).
- Masadan masaya atlama üç evrelidir: kapsül masanın arkasında yükselir, havada kavis çizer, hedef masanın arkasına iner. Bu, `translateX`, `translateY`, `scale` ve evre başına `zIndex` ile yapılır.
- Zamanlama tablosu saf bir modülde durur ve testlenir; `launchMotion.ts` gibi.
- Sahne `LaunchCurtain` bittikten sonra başlar; perdenin taklidi uygulamaya girmez, gerçek perde zaten var.

**Hareket azaltma:**
- `useReducedMotion()` (reanimated) açıksa sahne son hâliyle çizilir. Zamanlayıcı, konfeti ve dost hareketi olmaz.
- "Geç" düğmesi `accessibilityRole="button"`; giriş bitince kalkar.

**Erişilebilirlik:**
- Sahne ve dost `importantForAccessibility="no-hide-descendants"` ve `accessibilityElementsHidden` taşır, `pointerEvents="none"`.
- Hata metni bugünkü gibi metin olarak kalır.

**Dostun yerleşimi:**
- `onLayout` ile ölçülür. Dostun kutusu bir başlık, alan ya da düğmeyle kesişirse en çok 18 dp yukarı kayar; yine kesişirse gösterilmez.
- Denemedeki kural `palFit`.

**Titreşim:**
- Yalnızca `haptic(an)` ile.
- Tasarım sisteminin kuralı aynen geçerli: "dokunuş bir sonucu onaylar, her basışı değil". Dost kendi başına titreşim üretmez.

| An | Titreşim | Not |
| --- | --- | --- |
| Başlamadan önce kutuları, cinsiyet seçimi | Mevcut `selection` | |
| Yanlış kod, kod gönderilemedi | Mevcut `failed` (`FEEL_ERROR`) | Dostun sallanması ikinci bir titreşim eklemez |
| Hesap açıldı | Yeni bir başarı anı önerisi (`accountReady`, `notification: success`) | Soru 5 |
| Dokununca bakma, balon, sahne, konfeti | Yok | |

**Sıklık sınırı (öneri):**
- `haptics.ts`'e saf, testli bir sınır eklenir: aynı an 600 ms'den sık çalmaz; herhangi iki dokunuş arasında en az 150 ms olur.
- Yazarken (her tuşta) asla titremez.
- Sınır `hapticMoments.test.ts`'te sınanır.

## 5. Sınama (yalnızca değişen ekranlar)

Diğer ekranlar v44'te sınanmıştı ve değişmedi (giriş bölümündeki kanıt); yeniden koşulmadı.

**17 kayıt durumu:**
1. İlk ekran, son hâl (hareket azaltma)
2. İlk ekran, giriş sürerken (tam hareket, 1,8 sn; "Geç" görünür)
3. Başlamadan önce
4. Başlamadan önce, iki kutu işaretli
5. Telefon (alana dokunulmuş)
6. Telefon, geçersiz numara hatası
7. Telefon, kod gönderilemedi
8. Kod
9. Kod, yanlış kod
10. Ad
11. Ad, "Selam Elif!"
12. Doğum tarihi
13. 18 altı
14. Cinsiyet
15. Fotoğraf (kadın)
16. Fotoğraf (erkek, uyarı)
17. Cinsiyet kapısı

**Sonuçlar** (teslim edilen dosya, 18 Ekim; Chromium):

| Boyut | Tema | Yazı | JS hatası | Yatay taşma | "..." ile kesilen | Dost ya da balon bir şeye biniyor | Kontrast (4.5:1, büyük yazıda 3:1) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 320x568 | Açık | %130 | 0 | 0 | 0 | 0 | 17/17 |
| 320x568 | Koyu | %130 | 0 | 0 | 0 | 0 | 17/17 |
| 360x640 | Açık | %130 | 0 | 0 | 0 | 0 | 17/17 |
| 360x640 | Koyu | %130 | 0 | 0 | 0 | 0 | 17/17 |
| 400x780 | Açık | %130 | 0 | 0 | 0 | 0 | 17/17 |
| 400x780 | Koyu | %130 | 0 | 0 | 0 | 0 | 17/17 |
| 360x640 | Açık | %100 | 0 | 0 | 0 | 0 | 17/17 |
| 360x640 | Koyu | %100 | 0 | 0 | 0 | 0 | 17/17 |

- **Ekran görüntüleri:** hareket azaltmayla, durağan hâlde alındı; 2. durum tam hareketle.
- **Davranış (25 denetim, hepsi geçti):**
  - Giriş: perde ve "Geç" görünür. Bütün hareket 5,2 sn'de biter. Sonra "Geç" kalkar ve sahne son hâlinde durur.
  - Geçmek:
    - perdede ya da sahnede "Geç": hareket hemen durur;
    - perdeye dokunmak da geçer;
    - giriş sürerken "Telefonla devam et" Başlamadan önce'yi açar ve sahneyi durdurur;
    - Başlamadan önce'den geri ilk ekrana döner, perdesiz.
  - Hareket azaltma:
    - ilk ekranda perde ve "Geç" yok, çalışan animasyon yok;
    - dost tepkisinde animasyon ve geçiş yok;
    - doğum tarihinde konfeti yok.
  - Kayıt baştan sona: sıra 1/7'den 7/7'ye doğru. Her adımda dost var ve ekran okuyucuya kapalı. "Selam Elif!" balonu çıkıyor. Son düğme "Fotoğrafsız bitir"; kayıt "Hesabın hazır"la bitiyor.
  - Hata metni: dost başını salladığı her anda ekranda bir hata metni var (geçersiz numara, kod gönderilemedi, yanlış kod).
  - Ekran okuyucu ağacı:
    - ilk ekranda yalnızca logo, başlık, açıklama, düğme ve yaş notu;
    - adımlarda dost yok.
  - Hiçbir koşuda JS hatası yok.
- **Dostun yeri** (üç boyut, yazı %100 ve %130, 15 adım durumu):
  - Her yerde görünür, bir istisnayla: 320x568'de yazı %130'dayken Doğum tarihi'nde başlık dostun kenarına kadar uzandığı için gizli (soru 6).
  - Başlamadan önce'de 360x640 ve 400x780'de yazı %100'deyken 6 px yukarı kayıyor.
  - "Selam Elif!" balonu her boyutta görünür.

## 6. Sorular (karar bekliyor)

1. **İlk ekranın düğmesi:** Onaylar başa gelince "Telefonla devam et" önce Başlamadan önce'yi açıyor. Etiket kalsın mı?
2. **Girişin kısalığı:** Taslaktaki sürekli hareket (her 4,6 sn masa değişimi, sallanma, göz kırpma) kalktı. Bütün hareket ~5 sn'de biter. Sürekli bir sahne istenirse durdurma düğmesi gerekir (5 sn'yi geçen kendiliğinden hareket). Böyle mi kalsın?
3. **Geri dönünce sahne:** Başlamadan önce'den geri gelince sahne perdesiz yeniden oynuyor (taslaktaki gibi). Durağan mı gelsin?
4. **Son adımın düğmesi:** Fotoğraf son adım olunca "Bitir" ve "Fotoğrafsız bitir". Uygun mu?
5. **Hesap açılınca titreşim:** Yeni bir `accountReady` anı eklensin mi, yoksa kayıt titreşimsiz mi bitsin?
6. **Dostun gizlendiği yer:** Sınanan boyutlarda tek durum var: 320x568'de yazı %130'dayken Doğum tarihi. Başlık dostun kenarına kadar uzanıyor, dost o adımda görünmüyor. Bu kabul mü, yoksa böyle durumda dost başka yerde mi dursun?

## 7. Prototipte sahte olanlar (v44'e ek)

- **Açılış perdesi:** taklit; uygulamada LaunchCurtain.
- **Kapsüllerin yerleri:** her açılışta aynı (sabit tohumlu rastgele). Atlayan kapsül rastgele seçilir.
