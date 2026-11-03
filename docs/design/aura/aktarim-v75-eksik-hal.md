# skall · Eksik hâller (rapor 12.8) · CTO aktarım raporu

- **Tasarım kaynağı:** Aura tuvali v75 (1793668221-e9f6), https://claude.ai/artifact/Fcdza7SJs4i7xyYQJnhRVe
  - Satır "Eksik hâller", y52240; panolar y52500.
  - Mor not: motionEksikHal.
- **Onay:** Gökay, 3 Kas 2026 01:12. Aktarım de Gökay'ın talimatıyla yapılıyor.
- **Kaynak kod:** Kabuk 00b1b14.
- **Önceki raporlarla ilişki:**
  - Birleşik teslim v64 (cto-teslim-v64/birlesik-aktarim-raporu.md) bölüm 6 ve 12.8'deki **E** hâllerini kapatır.
  - 2 Kasım kararları (ui-2kasim/aktarim-raporu.md, Aura v73) önce gelir. Bu panolar o ölçeği kullanır: ana düğme 48, küçük 36, yuvarlak 44, çip 36, alan 48, koyuda halesiz ana düğme.
  - Boş durum risoları (P-H) bu rapora dahil değildir; onlar v73 raporundadır.

## Bu devrin niteliği
Yeni ekran, metin, eylem veya davranış yok. Rapor üç şey getiriyor:
- Var olan ekranların çizilmemiş hâlleri: dolu, yükleniyor, hata, 320 dp ve en büyük yazı.
- İki yeni riso görsel: kayıt sahnesinin koyu sürümü ve etkinlik kartı sahnesi.

Metinlerin hepsi tr.ts'teki mevcut metinlerdir.

## Pano ↔ kod
| Pano | Kod | Ne değişir |
|---|---|---|
| KayitKoyu (x0, 1250): Açılış, Telefon, Kod koyu | app/(auth)/welcome.tsx, phone.tsx, otp.tsx; src/aura/RisoKanki.tsx (SIGNUP_GROUND) | Koyu temada sahne zemini koyu riso olur. Kod kutuları ve adım göstergesi koyu değerlere geçer (aşağıda). |
| KayitMetinler, KayitOnay, KayitAd, KayitDogum, KayitCinsiyet, KayitFoto (yalnız koyu yarı) | app/(auth)/agree.tsx, app/(onboarding)/*.tsx | Aynı koyu sahne. Açık yarı değişmedi. |
| AktivitelerEtkinlik (x1330) | app/(app)/(tabs)/activities.tsx (Events), src/features/activities/EventCard.tsx | Kartın sahnesi riso-etkinlik görseli olur. Gathering + MarkDisk kaldırılır. Etiketler aynı yerde kalır. |
| AktivitelerHal (x2230), AktivitelerHalKoyu (x3130) | activities.tsx Events: yükleniyor ve isError dalları; src/components/EmptyState.tsx | Yükleniyor ve hata hâllerinin görünüşü. |
| AktivitelerDar (x4030) | aynı | 320 dp ve en büyük yazı. |
| KesfetHaritaDar (x4790) | app/(app)/(tabs)/explore/index.tsx, src/features/explore/ExploreMap.tsx | 320 dp ve en büyük yazı. |
| MasaDar (x5550) | app/(app)/room/[id].tsx | 320 dp ve en büyük yazı. |

## Yeni varlıklar
| Dosya | Ölçü | Kullanım | Tuval blob |
|---|---|---|---|
| eksik-hal/riso-kayit-koyu.png | 800x920 (@2x) | Kayıt sahnesi zemini, yalnız koyu tema. assets/riso/scene-signup-dark.webp olarak dışa aktarılabilir. | 2b04d3e792d6a3b86c290ce068234074 |
| eksik-hal/riso-etkinlik.png | 800x400 (@2x, 2:1) | Etkinlik kartı sahnesi, açık ve koyu temada aynı. | 3bc7d15f403a37e02958ae6312d5dd5c |

Kaynaklar eksik-hal/kaynak/ altında:
- Kayıt koyu: koyu.js + run.js, tohum 91.
- Etkinlik: etk.js + runetk.js, tohum 17.

İkisi de arayuz-revize/26-riso-tamamlama ile aynı boru hattını kullanır (lib.js, comp.js, ikon.js, riso.py). @3x gerekirse yeniden üretilir; büyütülerek kullanılmaz.

## Değerler

### E1 Kayıt koyu (U39–U41'e ek)
- Koyu temada zemin #000000, aura yok. Sahne `riso-kayit-koyu`, cover, alttan hizalı. Açık temada `riso-kayit` aynı kalır.
- Kanki gölgesi (`.stand i`) koyuda rgba(0,0,0,.5); açıkta rgba(4,73,35,.24) kalır.
- Kod kutuları (otp):
  - Dolu kutu #1B211F, yazı `--text` #EEF3F0.
  - Boş kutu #151A18.
  - Odaktaki kutu: 2 px #3DDC84 halka, dış hale yok. İmleç #3DDC84.
- Adım göstergesi koyuda: seçili ve geçilmiş #3DDC84, gelecek adımlar beyaz %18.
- "Yeniden gönder" ve "Numarayı değiştir" bağlantıları koyuda #3DDC84.
- Konuşma balonu ve alanlar cam yüzey #121614 (koyu.css).
- Kanki hareketi (13.1) aynıdır; zemin durağandır.

### E2 Etkinlik kartı (EventCard)
- Kart: glass, iç boşluk 8 (CARD_PAD), köşe 30.
- Sahne: oran 334:168, köşe 22 (SCENE_RADIUS).
  - Görsel `riso-etkinlik`, cover, ortalı.
  - SceneGround, Gathering ve MarkDisk kaldırılır.
- Etiketler sahnenin üstünde, kenarlardan 12:
  - Solda "Etkinlik": zemin #FFE7C2, yazı #7A4300. Koyuda da aynı, çünkü riso üstünde durur.
  - Sağda saat: zemin beyaz %86, yazı #031B0B. Koyuda da aynı.
- Altta:
  - Başlık h3 (16/22 600).
  - Mekân adı fine 600 (13/18), `--primary`; koyuda #3DDC84.
  - İç boşluk 12 üst, 10 yan, 8 alt; satır arası 2.
- Kartlar arası 12 (SPACING[3]). Bölüm, sekme seçicinin 24 altında başlar. Rise sırası mevcut.

### E3 Aktiviteler: yükleniyor ve hata
- Başlık, şehir satırı ve Etkinlikler/Geçmiş seçicisi iki hâlde de yerinde kalır. Liste yerine hâl gösterilir.
- **Yükleniyor:**
  - Buluşan kapsüller yükleyicisi 40, altında 12 boşlukla "Yükleniyor…" (tr.common.loading), fine.
  - Seçicinin 24 altında, ortalı.
  - 300 ms sonra görünür, en az 600 ms kalır (useLoaderHold).
- **Hata:**
  - cloudOff ikonu, 64'lük daire içinde 28. Daire zemini `--soft-bg` ve çizgisi `--soft-line`; koyuda #121614 ve beyaz %10 çizgi.
  - Altında body metin: errorMessage, ör. "Bir şeyler ters gitti. Tekrar dener misin?" (tr.common.genericError).
  - Altında "Tekrar dene": btn soft sm (36), refresh ikonu 16 ile. Basılıyken düğmede yükleniyor gösterilir (mevcut).
  - Öğeler arası 12, ortalı.
- Geçmiş sekmesinin yükleniyor ve hata hâli de aynı kurala uyar (T).

### E4 320 dp ve en büyük yazı (1,3x)
Ortak kurallar:
- Metin "…" ile kesilmez.
- Düğme yazısı iki satıra bölünmez.
- Uzun ad sarar (overflow-wrap anywhere).

Ölçüler: display 44/53, title 27/34, h3 21/29, body 20/28, fine 17/23, eyebrow 17/22, etiket 30 yükseklik ve 16 yazı, çip 46 yükseklik ve 20 yazı.

Ekranlara göre:
- **Aktiviteler:**
  - Seçici sekmeleri 52 yükseklikte.
  - Kart sahnesi aynı orandadır (320 dp'de 264x133).
  - Kartlar dikey kayar, alt menünün altında 150 dp solma var.
- **Keşfet harita:**
  - Harita tam ekranda kalır.
  - Başlık 3 satıra sarar.
  - "Mekan ara" tek satırda kalır (alan 56).
  - Çip satırı yatay kayar, son çip ekran kenarında kesilir (mevcut kural).
  - Pin etiketi 17.
  - Pinler haritada aynı koordinatlarda durur; üst blok uzadığı için ilk pin görünür alanda daha aşağıda kalır. Kod tarafında harita merkezi değişmez.
- **Masa:**
  - Kişi ızgarası 4 yerine 3 sütun olur. Kapsül 44, ad 14/18, satır arası 12.
  - Masa adı ve "Lobiden çek" tek satıra sığmazsa düğme alta iner (flexWrap, aralık 10).
  - Üst çubuk tek satırda kalır: geri + 3 yuvarlak (44) + Bitir; aralık 6.
  - Oyun kutuları 2 sütunda, 104 yükseklikte.

## Hareket ve titreşim
Yeni hareket yok, yeni titreşim yok (motionEksikHal). Etkinlik kartlarının Rise girişi ve yükleyici süreleri mevcut davranıştır.

## Bilinen farklar (uygulama ↔ tuval)
- **F1:** EventCard sahnesi kodda Gathering (kankiler + MarkDisk); tuvalde riso-etkinlik görseli. Gathering kaldırılır.
- **F2:** Kayıt sahnesi kodda tek görsel (scene-signup.webp); koyu temada koyu görsel seçilmeli.
- **F3:** Otp kutuları ve adım göstergesi koyu temada açık renkte kalıyorsa E1 değerlerine geçer.
- **F4:** Aktiviteler hata hâli kodda EmptyState icon="cloud-offline-outline" (Ionicons) kullanıyor. Kapsül ikon ailesinin cloudOff çizimine geçer (eksik-ekranlar F2 ile aynı kural).

## Kabul maddeleri
- **K1:** Koyu temada Açılış, Telefon, Kod ve kayıt adımlarında sahne koyu riso; zemin #000000, aura yok. Açık temada değişiklik yok.
- **K2:** Koyu otp kutuları, adım göstergesi ve bağlantılar E1 değerlerinde.
- **K3:** Etkinlik kartı E2 ölçülerinde; sahnede riso-etkinlik var, kankili Gathering yok. Etiketler okunur (≥4,5:1).
- **K4:** Etkinlikler yükleniyor: yükleyici 300 ms sonra görünür, en az 600 ms kalır; başlık ve seçici yerinde.
- **K5:** Etkinlikler hata: cloudOff + metin + Tekrar dene; dokununca yeniden ister, düğmede yükleniyor görünür.
- **K6:** Aktiviteler 320 dp ve 1,3x: kesilen metin yok, iki satır düğme yok.
- **K7:** Keşfet harita 320 dp ve 1,3x: "Mekan ara" tek satır, pin etiketleri ve alt menü çakışmaz.
- **K8:** Masa 320 dp ve 1,3x: ad kesilmez (3 sütun), "Lobiden çek" tek satır, üst çubuk taşmaz.
- **K9:** Android ve iOS'ta; açık ve koyu; 390 ve 320 dp.

## Ek karar (Gökay, 3 Kas 02:25)
- E4'teki dar ölçüler yalnız dar hâlde geçerlidir. Dar hâl, Lobi'deki koşulla aynıdır: 320 dp genişlik ya da en büyük yazı (`src/lib/narrow.ts`).
  - Değerler: kapsül 44, kişi ızgarası 3 sütun, alan 56, çip 46, seçici 52, etiket 30.
  - Normal ekranda 2 Kasım ölçeği aynen kalır: ana 48, küçük 36, yuvarlak 44, çip 36, alan 48.
- Görseller: `assets/riso/scene-signup-dark.webp` (800x920), `assets/riso/event.webp` (800x400) ve `event@3x.webp` (1200x600). Kayıt koyunun @3x'i sohbete küçültülmüş geldi (978x1125); büyütülmedi, yalnız @2x kullanılıyor.
