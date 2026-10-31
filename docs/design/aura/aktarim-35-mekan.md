# Aktarım raporu: Grup 1 · Mekan ve lobi

Oct 31, 2026 · Aura tuvali sürüm 35 · Gökay onayladı (31 Ekim 04:48). Okuyan: uygulamayı kuran oturum. Bu rapor CTO'ya henüz gönderilmedi; aktarım Gökay'ın ayrı talimatıyla yapılır.

Tuval: https://claude.ai/artifact/Fcdza7SJs4i7xyYQJnhRVe · Kararlar `docs/decisions/aura-31.md` ile birlikte okunur; oradaki kararların hiçbiri değişmedi. Check-in panosu bu turda değişmedi.

## 1. Panolar

**Değişen:** Mekan ve lobi (`project/Mekan.dc.html`). Mekan sohbeti kartı boş hâline döndü: "Henüz kimse yazmadı" ile rozet ve "şu an aktif" artık birlikte çizilmiyor. İlk görünümde "Süren masalar" başlığı alt sekme çubuğunun hemen üstünde, listesi camın altından devam ediyor.

**Yeni (satır "Mekan ve lobi: hâller"):**

- Mekan ve lobi: kaydırılmış (`MekanKaydir`), açık tema, sayfanın sonu. "Süren masalar" başlığı, açıklaması ve iki satırı eksiksiz, son satır sekme çubuğunun 26 üstünde biter.
- Mekan ve lobi: koyu (`MekanKoyu`), koyu tema, sayfanın sonu. Süren masa yok hâli.
- Mekan ve lobi: yükleniyor (`MekanYukleniyor`), açık tema.
- Mekan ve lobi: hata (`MekanHata`), koyu tema.
- Mekan ve lobi: 320 dp, en büyük yazı (`MekanDar`), 320 genişlik, yazı 1,3 kat (uygulamanın `maxFontSizeMultiplier` sınırı), sayfanın sonu.

**Yeni (satır "Galeri"):** Galeri: Mekan sohbeti kartı (`GaleriMekanSohbeti`), açık ve koyu yan yana.

## 2. Yeni ve değişen bileşenler

### Mekan sohbeti kartı (değişti; `VenueChatCard`)

Başlık satırı: "Mekan sohbeti", koşullu "şu an aktif" ve sağda koşullu rozet. Rozet ile aktiflik iki ayrı göstergedir.

| Hâl | Rozet | şu an aktif | Gövde |
| --- | --- | --- | --- |
| Boş | yok | yok | "Henüz kimse yazmadı. İlk mesajı sen yaz." |
| Mesaj var | yok | yok | son iki mesaj |
| Mesaj var · aktif | yok | var | son iki mesaj |
| Yeni mesaj · aktif değil | okunmamış sayısı | yok | son iki mesaj |
| Yeni mesaj · aktif | okunmamış sayısı | var | son iki mesaj |
| Yükleniyor | yok | yok | iki yer tutucu satır (32'lik daire + çubuk) |
| Hata | yok | yok | "Bir şeyler ters gitti. Tekrar dener misin?" + "Tekrar dene" |

- Rozet yalnızca gerçek okunmamış mesaj varken. Aktiflik bugünkü kural: son 10 dakikada mesaj (K-12). Boş sohbet aktif olamaz.
- Yükleniyor hâlinde boş metni, rozet ve nokta çizilmez. Yer tutucu durgundur ve logo kullanmaz. Renk: açıkta ink %8, koyuda beyaz %10.
- Hata hâlinde kart dokununca sohbeti açmaya devam eder; "Tekrar dene" yalnızca kartın verisini yeniler. Metinler mevcut (`common.genericError`, `common.retry`); yeni metin yok.
- Dar ekran: başlık satırı sarılır, "şu an aktif" alt satıra iner. Başlık ve rozet kesilmez.

**Mesaj önizlemesi (karar, 31 Ekim):** her mesaj tek satır, kart yüksekliği uzun mesajla büyümez. Satır kartın genişliğini aşarsa son 44 dp gerçek saydamlıkla kaybolur. Bu renkli bir örtü değildir: Android'in kendi yatay kenar solması (horizontal fading edge) kullanılır, yalnızca taşan satırda çizilir ve JS'te ölçüm yapılmaz. Satırda "…" yoktur. Gönderen adı ve mesajın başı net kalır. **iOS'ta şimdilik "…" kalır.** Sohbet ekranında mesajın tamamı bugünkü gibi okunur.

### Lobi satırı (değişti; `LobbyRow`)

- Normal düzen bugünkü gibi: simge, ad, kapsül sayacı + kişi + etiketler, sağda eylem.
- **Dar düzen** (320 dp ve büyük yazı): eylem düğmesi ("Bu masadayım" / "Katıl") yazıların altına, onlarla aynı hizaya iner. Ad ve düğme yazısı tek satırda kalır, etiketler sarılır. Hangi genişlikte dar düzene geçileceği yerleşimin işidir; tasarım kuralı: ad, düğme ya da etiket kesilmez, düğme yazısı bölünmez.

### "Süren masalar" bölümü (değişti; `Lobby`)

| Hâl | Başlık | Sayı | Açıklama | Satırlar |
| --- | --- | --- | --- | --- |
| Dolu | var | "n masa" | bugünkü (`runningNote` / `runningNoteShort`) | var, eylemleriyle |
| Boş | var | "0 masa" | **yok** | yok |
| Yükleniyor | var | **yok** | yok | yok |
| Hata | var | **yok** | yok | yok |

- Karar (31 Ekim): süren masa yokken "Lobide değiller… Bu masadayım'a bas" gösterilmez. Yeni metin ya da eylem yok.
- Yükleniyor ve hatada "Açık masalar" da sayısız çizilir. Lobi tek okuma olduğu için yükleyici (Tahterevalli) ve hata işareti bir kez, "Açık masalar" altında görünür; "Süren masalar" altında tekrar edilmez.

### Değişmeyenler

Mekan başlığı, sahne ve "Masa kur", ortak boş hâl işareti (aura-31 e), alt menü ve orta sekme ikonu, cam, renk bulutları, gölgeler, kapsül görselleri, gizlilik kuralları.

**Koyu tema:** Tuvalin `.night` dili ve uygulamanın koyu değerleri (`AURA.scene.dark`, `auraKit` dark, `tagsDark`) kullanıldı; yeni renk yok. Önizlemede ad renkleri koyuda pembe `#FFD0E0`, rumuz amber `#FFE2B8`.

## 3. Hareketler, geçişler, dokunuşlar

Hepsi `hareket.json` dilinde; yeni efekt yok. Tuvalde Galeri'nin yanındaki mor notlarda da yazılı.

| # | Tetik | Hareket eden | Süre ve eğri | Giriş/çıkış | Reduced Motion |
| --- | --- | --- | --- | --- | --- |
| 1 | okunmamış 0 → n | rozet | pop yayı (260 / 17) | scale 0.3 → 1, 6 dp aşağıdan yükselir | anında görünür |
| 2 | okunmamış n → n+1 | rozetteki sayı | leave 120 ms, arrive 180 ms | eski rakam solar, yeni gelir; rozet yerinde | sayı anında değişir |
| 3 | sohbet okunup Mekan'a dönülür | rozet | leave, 220 ms | scale 1 → 0.3, opaklık 0 | anında kaybolur |
| 4 | 10 dakika içinde ilk mesaj / son mesajın 10. dakikası | "şu an aktif" | dissolve: giriş 450 ms arrive, çıkış 220 ms leave | nokta bugünkü gibi nabız atar | anında, nabızsız |
| 5 | kart görünürken yeni mesaj | önizleme satırları | çıkış 220 ms, kayma swap 300 ms, giriş 450 ms (70 ms sonra) | üst satır çıkar, alt satır yukarı, yeni satır alttan; kart yüksekliği sabit | anında yer değiştirir |
| 6 | boş → ilk mesaj | boş metni, kart, satır | çıkış 220 ms, yükseklik swap 300 ms, giriş 450 ms | boş metni çıkar, kart uzar, satır gelir | anında |
| 7 | yükleniyor → içerik / hata | yer tutucu, içerik | yer tutucu 300 ms sonra görünür, en az 600 ms kalır; çıkış 220 ms, giriş 450 ms | dissolve | anında |
| 8 | karta dokunuş | kart | basılıyken opaklık 0.8 | bırakınca Mekan sohbeti açılır (bugünkü geçiş); "Tekrar dene" press yayı | aynı |
| 9 | uzun önizleme | yok | durgun | yalnızca taşan satırda kenar solması | aynı |
| 10 | lobi ilk yüklemesi | Süren masalar satırları | listRowMs 60 ms aralık, dissolve | bugünkü dil | anında |

Kaydırma native. Alt sekme çubuğu sabittir, içerik camın altından geçer.

**Titreşim:** bu panoda titreşim anı tanımlanmadı (titreşim kararı açık).

## 4. Sınır dışı istekler

Yok. Yeni efekt türü kullanılmadı: kenar solması Android'in kendi davranışı, yer tutucu ve yükleyici mevcut dil.

## 5. CTO devri: teknik maddeler

Tasarım bunları çözmez; doğru görünüşü tarif eder.

1. **Mekan sohbeti kartı yüklenirken** bugün "Henüz kimse yazmadı" gösteriliyor (`useVenueChatCard` veri gelmeden `recent` boş). Kartın yükleniyor ve hata hâlleri sorgunun durumuna bağlanmalı.
2. **Okunmamış sayısı ve aktiflik tutarsızlığı** (`useVenueChatCard`: broadcast ile gelen mesajın 1 sayılması, `seenAt`). Rozet yalnızca gerçek okunmamışta çıkmalı.
3. **Lobi yüklenirken "0 masa"** gösteriliyor (`Lobby`, `SectionHead` sayıyı her zaman yazıyor). Yükleniyor ve hatada sayı gizlenmeli; Süren masalar başlığı altına açıklama ya da işaret konmamalı.
4. **Süren masa yokken açıklama gizlenmeli** (`runningNote` / `runningNoteShort` yalnızca `running.length > 0` iken).
5. **Önizleme:** bugün `numberOfLines={1}` ile "…" çiziliyor. Android'de "…" yerine yatay kenar solması, yalnızca taşan satırda ve ölçümsüz; iOS'ta "…" kalır. React Native Text'in bu Android davranışını nasıl açacağı (native prop ya da küçük native yama) CTO'nun kararı; renkli gradyan örtüyle taklit edilmez.
6. **Lobi satırının dar düzeni** (`LobbyRow`): 320 dp ve 1,3 kat yazıda eylem alta iner.
7. **Süren masalar'ın alt boşluğu:** son satır sekme çubuğunun ve Android gezinme alanının üstünde eksiksiz görünmeli. Çözüm otomatik ek boşluk varsayılmadan yerleşimde kurulur; gerçek cihazda safe-area kontrolü (plan, CTO maddesi 7).

## 6. Açık sorular

- Titreşim anları (genel karar açık; bu panoda tanım yok).
- iOS'ta önizleme solması: cam modülünün iOS karşılığıyla birlikte ileride ele alınır; şimdilik "…".
