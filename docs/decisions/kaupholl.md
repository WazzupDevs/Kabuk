<!-- Proje sahibinin onayladığı Kaupholl kuralları ve uygulama planı (5 Kasım 2026, v3.1 son hâl).
     PR 0 (gizli içerik kapısı) #474 ile birleşti. Sıradaki PR A: §7. SPEC'e PR B'de girer. -->

# Kaupholl öneri belgesi v3.1

5 Kasım 2026. v3.1, **son hâl** (proje sahibinin onayıyla kapandı: içerik süreci, SPEC 4.6.10, PR 0 kabul şartı). Daha önce: gizli içerik kapısı (yerel kanca + zorunlu CI kontrolü), zor sorunun yeri, "uygun soru" uyarısı ve içerik yetersizliği metni proje sahibinin kararlarıyla işlendi. Önceki v3.1 değişiklikleri: süre sonunda otomatik kesinleşme (karar), masa içi tekrar yasağıyla çelişen "en eski sorular" düzeyi kaldırıldı, içerik yetersizliği durumu ve yarış testleri eklendi.

v3: v2'nin 14 açık kararı proje sahibinin yönüyle kapandı; ek teknik düzeltmeler işlendi. **Kod, migration ve SPEC değişikliği yok; Prompt 3 başlamadı.** Etiketler:

- **karar:** proje sahibinin;
- **öneri:** onay bekler;
- **ölçüm:** bu belge için yapılan hesap ya da ölçüm; gerçek ekran çizimi değildir.

Simülasyon betikleri ve metin ölçümü tasarım oturumunda çalıştırıldı, repoya girmedi; sonuçları §3 ve §5'te.

İçindekiler: 0. v2'den farklar · 1. SPEC taslağı · 2. Eylemler, sıra ve kilit · 3. Simülasyon · 4. Soru havuzu ve güvenlik · 5. Ekran doğrulaması · 6. Aura'ya çizilecek farklar · 7. Uygulama ve test planı · 8. Kalan sorular

---

## 0. v2'den farklar

| Konu                 | v2                              | v3                                                                                                            |
| -------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| SPEC numarası        | 4.6.10                          | **4.6.10 adayı** (karar; aşağıda)                                                                             |
| Oranlar              | C3, "konum avantajını kaldırır" | C3 pilot için geçici (karar). Konum avantajı **sürüyor**; abartılı ifade düzeltildi (§3)                      |
| Kart alt satırı      | açık                            | "Geçmeden en yakına yatır" (karar)                                                                            |
| Tahmin aşaması       | herkes yazınca kapanır          | herkes **kesinleştirince** kapanır, yoksa 45 sn (karar)                                                       |
| Sıra numarası        | aynı `seq` = tekrar             | aynı `seq` + farklı içerik = **çakışma**, uygulanmaz (karar)                                                  |
| Kişisel tekrar kaydı | `kaupholl_seen` 90 gün          | **yok** (karar); masa içi engel + kişisel olmayan soru istatistiği                                            |
| Doğrulama            | "kör çift giriş"                | iki ayrı özel depo; kör yalnızca depo izniyle garanti edildiği durumda (§4)                                   |
| Soru seçimi          | sabit karışım                   | karışım + kontrollü gevşetme sırası; masada tekrar hiç yok, soru bitince kontrollü "soru kalmadı" durumu (§4) |
| Süre sonunda tahmin  | öneri                           | kayıtlı son tahmin otomatik kesinleşir (karar, v3.1)                                                          |
| 2'nin altına düşüş   | o anki puanla biter             | **yarım kalan oyun**, kazanan ve `game_results` yok (karar)                                                   |
| Ekran sığması        | hesapla "sığar"                 | hesap + gerçek font ölçümü; hiçbiri "sığar" diye kesinleşmedi (§5)                                            |

**SPEC numarası kontrolü** (bugünkü main, `c658aea`):

- `docs/SPEC_V4.md`'de 4.6.1–4.6.6 yazılı.
- 4.6.7 Signum'a ayrılmış (`pure/signum.ts` başlığı).
- Son durum (karar): Signum 4.6.7; Sprengja 4.6.8 ([WazzupDevs/Kabuk#466](https://github.com/WazzupDevs/Kabuk/pull/466) birleşti); Kibrit 4.6.9 ([WazzupDevs/Kabuk#465](https://github.com/WazzupDevs/Kabuk/pull/465) açık).
- Kaupholl için **4.6.10 adayı** kullanılır. PR B sırasında güncel main ve diğer oyunların SPEC numaraları yeniden denetlenir; numara orada kesinleşir.

---

## 1. SPEC taslağı: Adım 4.6.10 Kaupholl (aday numara)

K-77'nin altı oyunundan biri; kart satırı "Kaupholl, **Geçmeden en yakına yatır**, 3+" (karar; `tr.ts` ve K-77 satırı PR B'de değişir). Kaynak Aura v89 "Kaupholl (en yakına yatır)" satırı ve §6'daki ek panolar.

Her soruda herkes sayısal bir tahmin yazar. Tahminler tahtaya dizilir; herkes jetonlarını kazanacağını düşündüğü tahmine yatırır. **Cevabı geçmeyen en büyük tahmin kazanır.**

- **Oyuncular** (karar): 3 ile 6; gözlemciler. `content/games.json`: `kaupholl`, takımsız, oyun öncesi sayfası var, Çok oyunculu, `minPlayers: 3`, `maxPlayers: 6`. 7–8 kişi sonraki sürümde.
- **Oyun** (karar): 5 soru; her soruda her oyuncuya 2 jeton; kazanan tahmini yazana +3.
- **Kural metni oyun içinde** (karar 2; metin öneri):
  - Oyuncular ekranı: "Cevabı geçmeyen en büyük tahmin kazanır. Bütün tahminler cevaptan büyükse 'Hepsinden küçük' kazanır."
  - Tahta şeridinin alt satırı: "Cevabı geçmeyen en büyük tahmin kazanır".
- **Aşamalar** (süre sunucu saatindendir, `endsAt`; her aşama `step` ile numaralanır):
  1. **Soru kartı kapalı** (10 sn, karar): herhangi bir oyuncu "Kartı aç"a basar (`reveal`); ilk basan geçer. Kimse basmazsa 10 sn sonra `advance` açar.
  2. **Soru açıldı:** soru ve birim etiketi. Tahmin süresi kart açılınca başlar.
  3. **Tahmin (45 sn, karar):**
     - Oyuncu sayısını yazar ve "Tahmini gönder"e basar (kaydedilir, kilitli değil).
     - "Tahmini değiştir" ile değiştirebilir; **"Kesinleştir"** ile kilitler. Kilitli tahmin değişmez.
     - Çiplerde üç hâl herkese açıktır: yazmadı, yazdı, kesinleştirdi. Sayı gizlidir.
     - Oyuncuların hepsi kesinleştirince erken geçilir; yoksa 45 sn dolunca geçilir.
     - **Otomatik kesinleşme** (karar): süre dolduğunda sunucuda kayıtlı son geçerli tahmin, "Kesinleştir"e basılmamış olsa da kesinleşir. Tahtaya girer ve kazanırsa +3 alır. Elle kesinleştirilmiş tahminden hiçbir farkı yoktur.
     - Elle kesinleştirme yalnızca tahmini kilitler ve herkes kilitlediğinde erken geçişi sağlar (karar).
     - Sunucuda kayıtlı tahmini olmayan oyuncunun dilimi oluşmaz (karar). Süre dolduktan sonra ulaşan tahmin kaydedilmez (§2).
     - **Hiç tahmin yoksa** (karar): Tahta atlanır; Cevap ekranı "Kimse tahmin yazmadı" satırıyla cevabı gösterir; puan yok.
  4. **Tahta: jeton yatır (20 sn, karar):**
     - Tahminler küçükten büyüğe dizilir; **aynı sayılar tek dilimde birleşir** (karar). En üstte "Hepsinden küçük".
     - Oranlar C3 tablosundan gelir (karar, pilot için geçici; §3).
     - Her oyuncu 2 jetonunu bir ya da iki dilime koyar; ikisi aynı dilime de olabilir. Tahmin yazmayan da yatırır (karar).
     - Jetonlar herkese canlı görünür (karar). **"Yatırdım" yerleşimi kilitler** (karar); 0 ya da 1 jetonla da kilitlenebilir.
     - Kullanılmayan jeton puan getirmez ve hiçbir yere kendiliğinden konmaz (karar).
     - Herkes kilitleyince erken, yoksa 20 sn dolunca cevap açılır. Süre dolunca sunucudaki son yerleşim, tahmindeki gibi kendiliğinden kilitlenir.
  5. **Cevap açıldı:** cevap, birim, açıklama; cevap çizgisi.
     - Kazanan dilimin etiketi **"Kazandı"**; cevaba eşit tahmin de kazanır. Bütün tahminler cevaptan büyükse "Hepsinden küçük" kazanır.
     - Cevabı geçen dilimler söner.
  6. **Puan:** kazanan dilimdeki her jeton sahibine oran kadar puan; kazanan tahmini yazan herkese +3 ("Hepsinden küçük"te +3 yok). Kaybeden jeton puan götürmez.
  7. **Soru sonu:** "Soru 3/5 bitti", "Kazanan tahmin: <Ad>" ya da "Hepsinden küçük kazandı", puan tablosu.
  8. **Ara ekranlar** (Cevap açıldı, Soru sonu; karar): herkes "Hazırım" deyince ya da en çok 10 sn sonra ilerler.
  9. **Oyun sonu:** en çok puanı alan kazanır; **eşit puandakiler ortak kazanır** (karar). "Masaya dön" herkeste, "Yeniden oyna" sahipte.
- **Yarım kalan oyun** (karar):
  - Oyunda 2'den az oyuncu kalırsa oyun biter ve çerçevenin terk edilmiş oyun yolunu izler (`game_abandoned`, §4.F "Oyundan çıkma ve oyunu bitirme"). Kazanan, Oyun sonu ekranı ve `game_results` yoktur.
  - Kalan kişi masaya döner; öneri: "Oyun yarıda kaldı" bildirimiyle.
  - Sahibin "Oyunu bitir"i ve masanın kapanması da aynı yoldur.
- **Gözlemci:** tahminleri tahta kurulunca, cevabı Cevap aşamasında görür; tahmin yazmaz, yatırmaz, puan almaz, hazır ve kilit sayılarına girmez.
- **Çıkış:**
  - Tahmin aşamasında çıkanın tahmini düşer.
  - Tahta kurulduktan sonra çıkanın dilimi kalır, jetonları kalkar, puanı yazılmaz. Aynı dilimi yazan başka oyuncu varsa +3 ona gider.
  - Aşama çıkanla tamamlanıyorsa süre o an dolar.
- **Gizli bilgi** (kural 3):
  - Oyunun 5 sorusu `start`'ta seçilip `game_secrets`'a yazılır.
  - Soru metni ve birimi kart açılınca, cevap ve açıklama Cevap aşamasında `game_state`'e geçer.
  - Tahminler tahta kurulana kadar yalnızca `game_secrets`'tadır; `game_state` yalnızca çiplerin hâlini (yazmadı / yazdı / kesin) taşır.
  - Jetonlar gizli değildir.
- **Sonuç:** `game_results` (`kaupholl`) yalnızca tamamlanan oyunda; ortak kazananlar "Kazandın".
- **Sunucu:** `kaupholl` fonksiyonu, eylemleri §2'de. Kilitler: check-in → `rooms` → `game_players` → `game_secrets` → `kaupholl_question_stats`.

---

## 2. Eylemler, sıra ve kilit

| Eylem     | Girdi                                                | Not                                                                                                                                                           |
| --------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `start`   | `roomId`                                             | Sahip; 5 soruyu seçer ve sıralar (§4). Geçerli bir beşli kurulamazsa `questions_exhausted` döner ve oyun başlamaz                                             |
| `pool`    | `roomId`                                             | Yalnızca sahip, oyun öncesi sayfada; `{ unused }`: bu masada kullanılmamış etkin soru sayısı. Yalnızca uyarı içindir, başlatılabilirliği söylemez; idempotent |
| `view`    | `step`                                               | Kendi tahmini, kendi yerleşimi, son `seq`'ler, kilitler; idempotent                                                                                           |
| `reveal`  | `step`                                               | Herhangi bir oyuncu; ilk gelen geçer, ikincisi değişiklik yapmaz                                                                                              |
| `guess`   | `step, seq, value, lock`                             | `value` en çok 6 tam hane ve 1 ondalık; `lock: true` kesinleştirir                                                                                            |
| `bet`     | `step, seq, coins: [pos \| null, pos \| null], lock` | Yerleşimin tamamı; `lock: true` = "Yatırdım"                                                                                                                  |
| `ready`   | `step`                                               | Ara ekranlar                                                                                                                                                  |
| `advance` | `step`                                               | Süre dolunca herhangi bir telefon; tek aşama ilerletir                                                                                                        |

**Sıra numarası** (`guess` ve `bet`; kapsamı oyun, adım, oyuncu ve eylem türü):

Sunucu her kapsam için son uygulanan `seq`'i, onun içeriğini (tahminde sayı, yatırımda iki konum ve kilit) ve kilidi saklar: tahminde `game_secrets`'ta, yatırımda `game_state`'te. Gelen isteğin durumuna göre:

| Gelen istek                                     | Sonuç                                                                                                                                                                |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Aşama kapalı (`now ≥ endsAt` ya da aşama geçti) | Uygulanmaz: `phase_over`, hata titreşimi yok                                                                                                                         |
| Kapsam kilitli                                  | Uygulanmaz: `locked`, mevcut hâl döner. Kilidi getiren isteğin birebir tekrarı ise aynı başarılı yanıt döner                                                         |
| `seq` > son                                     | Uygulanır; boşluklu artış serbest (kaybolan istekler)                                                                                                                |
| `seq` = son, içerik aynı                        | Tekrar: değişiklik yok, aynı yanıt                                                                                                                                   |
| `seq` = son, **içerik farklı**                  | **Çakışma:** uygulanmaz, 409 `seq_conflict`. Telefon `view` ile sunucunun hâlini alır ve onu gösterir; kendiliğinden yeniden göndermez, kişi isterse yeniden dokunur |
| `seq` < son                                     | Eski istek: uygulanmaz, `{ applied: false }` ve mevcut hâl                                                                                                           |
| `seq` 1–10.000 dışında                          | `bad_request`                                                                                                                                                        |

- Saat damgası kullanılmaz. Ek süre yoktur (karar): `endsAt`'tan sonra ulaşan istek uygulanmaz.
- Kilitli tahmin ve yatırım hiçbir istekle değişmez. Kilidin kaldırılması eylemi yoktur.
- Telefon her kapsamda en çok bir isteği yolda tutar. Yoldayken yapılan değişiklikler birleşir ve yanıt gelince en sonuncusu yeni `seq` ile gider.
- **Yeniden bağlanma ve yeniden açılma:** telefon bekleyen kuyruğunu atar. `rooms.game_state` ve `view`'dan sunucunun kesin hâlini alır (kendi sayısı, yerleşimi, son `seq`, kilit) ve oradan devam eder (karar). Yanıtı kaybolmuş istek aynı `seq` ve aynı içerikle yeniden gönderilirse tekrar sayılır.
- `guess` ve `bet` aynı `seq` ve aynı içerikle tekrarlanınca aynı sonucu verdiği için `IDEMPOTENT_CALLS`'a girer.

**Süre, kapanma, dönüş:**

- **Aşama geçişi tek işlemdir:** oda satırı kilitliyken aşama ve `step` denetlenir. Tahmin aşamasından çıkışta kayıtlı her tahmin kesinleşir ve tahta aynı işlemde kurulur; Tahta aşamasından çıkışta her yerleşim kilitlenir. Geçişten sonra gelen her `guess` / `bet` `phase_over` alır. Bu yüzden son kilitle süre sonu aynı anda gelirse sonuç aynıdır: ya kilit uygulanır ve geçiş olur, ya geçiş olur ve aynı değer otomatik kesinleşir.
- Erken geçiş (herkes kilitledi, herkes hazır) bunu tetikleyen eylemin kendi işleminde olur. Aynı anda gelen `advance` adım eskidiği için etkisizdir. İki geçiş asla olmaz.
- `advance` tek aşama ilerletir; yeni aşamanın süresi o andan başlar (`now + süre`). Bütün telefonlar kapalıysa oyun bekler; dönen ilk telefon sıradaki aşamayı tam süresiyle açar ve aşamalar atlanmaz.
- Kapanan telefonun sahibi masadaysa oyuncudur. Kartın kendiliğinden açılması ve ara ekranların 10 sn sınırı oyunun takılmasını önler.

---

## 3. Simülasyon (C3, geçici)

### Kesin değer: bağımsız, tarafsız, hepsi farklı tahmin

Konum j'nin (j = cevabın altında kalan tahmin sayısı) olasılığı C(n, j) / 2ⁿ'dir. Jeton başına beklenen puan:

| Oyuncu | Oranlar (Hepsinden küçük → en büyük) | Beklenen puan                                  | En yüksek / en düşük |
| ------ | ------------------------------------ | ---------------------------------------------- | -------------------- |
| 3      | ×6 ×2 ×2 ×6                          | 0,75 / 0,75 / 0,75 / 0,75                      | 0,75 / 0,75          |
| 4      | ×6 ×3 ×2 ×3 ×6                       | 0,38 / 0,75 / 0,75 / 0,75 / 0,38               | 0,75 / 0,38          |
| 5      | ×6 ×4 ×2 ×2 ×4 ×6                    | 0,19 / 0,62 / 0,62 / 0,62 / 0,62 / 0,19        | 0,62 / 0,19          |
| 6      | ×6 ×5 ×3 ×2 ×3 ×5 ×6                 | 0,09 / 0,47 / 0,70 / 0,63 / 0,70 / 0,47 / 0,09 | 0,70 / 0,09          |

**Düzeltme:** C3 konum avantajını kaldırmıyor. Yalnızca 3 kişide konumlar eşit. 4–6 kişide uçlar belirgin biçimde düşük; 6 kişide merkezin iki yanı (0,70) merkezden (0,63) yüksek. v2'deki "kaldırır" ifadesi yanlıştı.

### Senaryolar

Her senaryoda tek bir test oyuncusu bütün stratejilerle aynı dağıtımda puanlandı; ödemeler başkalarının jetonuna bağlı değil. Rakipler karışık: kendi inancına göre, kendi tahminine ya da rastgele yatırıyor. Oyuncu sayısı ve senaryo başına 3.000 oyun, 5 soru, +3 dahil.

| Senaryo | Tanım                                                                        |
| ------- | ---------------------------------------------------------------------------- |
| A       | Bağımsız, tarafsız, hepsi farklı (log σ 0,6)                                 |
| B       | A + yuvarlak sayılar (iki anlamlı hane, birleşmeler olur)                    |
| C       | Yanlı: masa fazla tahmin eder (+0,35 log)                                    |
| D       | Yanlı: masa eksik tahmin eder (−0,35 log)                                    |
| E       | Aynı tahminler: oyuncuların ~%40'ı ortak bir yuvarlak sayıya çapalanır       |
| F       | İlişkili: masa birlikte yanılır, yönü bilinmez (ortak σ 0,5 + kişisel σ 0,3) |
| Karma   | Her soruda B–F'den biri                                                      |

### Bilgi kullanmayan konum stratejileri: kazanma payı (1,00 = adil pay)

| Strateji          | A (3/4/5/6 kişi)              | B                             | C                             | D                             | E                         | F                             | Karma                     |
| ----------------- | ----------------------------- | ----------------------------- | ----------------------------- | ----------------------------- | ------------------------- | ----------------------------- | ------------------------- |
| Merkez            | 0,93 / 1,19 / 1,06 / 1,32     | 0,97 / 1,27 / 1,17 / 1,31     | 0,74 / 0,67 / 0,52 / 0,42     | 0,55 / 0,52 / 0,43 / 0,29     | 0,90 / 1,02 / 1,09 / 1,09 | 0,28 / 0,22 / 0,12 / 0,13     | 0,63 / 0,61 / 0,58 / 0,56 |
| Merkezin bir altı | 0,98 / 1,16 / 1,19 / **1,46** | 0,92 / 1,19 / 1,21 / **1,43** | **2,23 / 1,94 / 2,57 / 2,01** | 0,25 / 0,25 / 0,12 / 0,14     | 0,88 / 0,95 / 1,05 / 1,10 | 1,46 / 0,69 / 0,57 / 0,34     | 1,13 / 0,90 / 1,04 / 0,87 |
| Merkezin bir üstü | 0,79 / 1,19 / 1,10 / **1,48** | 0,81 / 1,18 / 1,14 / **1,43** | 0,25 / 0,26 / 0,15 / 0,20     | **1,84 / 1,58 / 2,13 / 1,60** | 0,74 / 0,81 / 0,94 / 1,12 | 1,40 / 0,61 / 0,54 / 0,36     | 0,96 / 0,83 / 0,94 / 0,89 |
| Merkezin iki yanı | 0,78 / 1,07 / 0,93 / 1,26     | 0,76 / 1,09 / 1,00 / 1,21     | 1,28 / 0,95 / 1,12 / 0,83     | 0,89 / 0,75 / 0,81 / 0,57     | 0,69 / 0,70 / 0,76 / 0,81 | 1,45 / 0,53 / 0,40 / 0,23     | 0,96 / 0,74 / 0,82 / 0,68 |
| Hepsinden küçük   | 0,98 / 0,61 / 0,39 / 0,23     | 0,92 / 0,65 / 0,40 / 0,22     | **2,23 / 2,08 / 1,79 / 1,43** | 0,25 / 0,14 / 0,08 / 0,04     | 0,88 / 0,66 / 0,56 / 0,37 | **1,46 / 1,49 / 1,55 / 1,52** | 1,13 / 0,97 / 0,92 / 0,70 |
| En büyük tahmin   | 0,79 / 0,54 / 0,32 / 0,22     | 0,81 / 0,55 / 0,31 / 0,19     | 0,25 / 0,12 / 0,08 / 0,07     | **1,84 / 1,78 / 1,41 / 1,02** | 0,74 / 0,54 / 0,43 / 0,31 | **1,40 / 1,42 / 1,48 / 1,39** | 0,96 / 0,80 / 0,75 / 0,60 |
| İki uç            | 0,78 / 0,45 / 0,24 / 0,15     | 0,76 / 0,47 / 0,25 / 0,15     | 1,28 / 0,86 / 0,61 / 0,38     | 0,89 / 0,62 / 0,37 / 0,23     | 0,69 / 0,41 / 0,31 / 0,16 | 1,45 / 1,31 / 1,25 / 1,01     | 0,96 / 0,73 / 0,59 / 0,39 |
| Rastgele          | 0,87 / 0,85 / 0,77 / 0,79     | 0,90 / 0,87 / 0,78 / 0,73     | 1,02 / 0,84 / 0,75 / 0,73     | 0,70 / 0,66 / 0,57 / 0,52     | 0,78 / 0,73 / 0,73 / 0,63 | 0,80 / 0,70 / 0,52 / 0,48     | 0,84 / 0,73 / 0,66 / 0,62 |

Bilgi kullanan stratejiler, karşılaştırma için:

| Strateji                            | A                         | B                         | C                         | D                         | E                         | F                         | Karma                     |
| ----------------------------------- | ------------------------- | ------------------------- | ------------------------- | ------------------------- | ------------------------- | ------------------------- | ------------------------- |
| Kendi tahminine                     | 0,96 / 1,14 / 1,16 / 1,27 | 1,00 / 1,21 / 1,18 / 1,30 | 0,69 / 0,84 / 0,97 / 1,06 | 1,06 / 1,13 / 1,05 / 1,03 | 0,93 / 1,03 / 1,17 / 1,12 | 0,79 / 0,80 / 0,76 / 0,68 | 0,86 / 0,96 / 1,05 / 1,13 |
| Kendi inancıyla (tahtayı yok sayar) | 1,01 / 0,83 / 0,75 / 0,75 | 1,01 / 0,93 / 0,76 / 0,64 | 1,44 / 1,31 / 1,37 / 1,36 | 1,10 / 1,17 / 1,11 / 1,05 | 1,16 / 1,08 / 1,02 / 0,95 | 1,52 / 1,62 / 1,74 / 1,79 | 1,20 / 1,21 / 1,27 / 1,24 |

Örnekleme hatası yaklaşık ±0,05. Ayrıntılı tablo (jeton başına beklenen puan dahil) `sim3.md`'de.

### Okuma

1. **Tarafsız ve bağımsız masada (A, B) kolay bir otomatik strateji var.** 5–6 kişide "merkezin bir yanına iki jeton" adil payın 1,1–1,5 katını getiriyor. Bu, tahtanın kalabalığın bilgisini zaten taşımasından gelir (ortanca cevaba yakındır). Bilgi gerektirmez ve öğrenmesi kolaydır.
2. **Masa bir yöne yanıldığında (C, D)** o yöndeki komşu ve uç 1,0–2,6 kat getirir, karşı yön çöker (0,04–0,26). Yön soruya göre değiştiği sürece bu otomatik bir strateji değildir. Havuz bütünüyle bir yöne kayarsa otomatik stratejiye dönüşür; bu yüzden §4'teki yön dengesi.
3. **Masa birlikte yanıldığında (F)** uçlar güçlenir (1,4–1,6), merkez çöker (0,12–0,28).
4. **Çapalanmış masada (E)** her şey düzleşir; hiçbir bilgisiz strateji 1,12'yi geçmez.
5. **Karma'da** hiçbir bilgisiz strateji 1,13'ü geçmiyor; en iyileri 3 kişide "Hepsinden küçük" ve "merkezin bir altı" (1,13). Kendi inancıyla yatıran 1,20–1,27.
6. **Sonuç:** baskın bir otomatik stratejinin olup olmadığı, gerçek masaların hangi senaryoya benzediğine bağlıdır. Masalar A/B'ye benzerse 5–6 kişide "merkezin yanı" baskın olur; F'ye benzerse uçlar. **Bu simülasyon hangisinin gerçek olduğunu söyleyemez.**
7. **Modelin sınırları:**
   - "Kendi inancıyla" stratejisi tahtayı yok sayar. Gerçek bir oyuncu kendi bilgisini tahtadaki kalabalıkla birleştirir ve büyük olasılıkla burada ölçülenden güçlü olur. Bu yüzden belge "bilgi kullanan baskındır" demiyor.
   - Model sesli konuşan masayı, birim karışıklığını ve oyuncuların birbirini kopyalamasını içermiyor.
8. Küçük bir yan etki: "Hepsinden küçük" kazandığında kimse +3 almaz. Bu, 3 kişide o stratejiye kazanma payında küçük ek avantaj verir (A'da beklenen puan eşitken pay 0,98 / 0,79).

### Pilotta ne bakılır (karar 14)

- İlk 50 oyundan sonra oyun deneyimi, teknik sorunlar ve belirgin dengesizlik değerlendirilir. Oranlar otomatik değişmez.
- Ölçülen, kişisel olmayan soru istatistiğidir (§4): kazanan konumun dağılımı (alt uç, merkez altı, merkez, merkez üstü, üst uç, "Hepsinden küçük"), "Hepsinden küçük" sıklığı, tahminlerin cevaba log uzaklığı.
- 50 oyun istatistiksel karar için yetmez; yalnızca "masalar A/B'ye mi F'ye mi benziyor" sorusuna ilk işaret verir.
- Gerekirse elde hazır alternatif (öneri değil, bilgi): 6 kişide ×6 ×6 ×4 ×3 ×4 ×6 ×6 tablosu model A'da merkez ve iki yanını eşitler (0,94), ama uçlar yine düşük (0,09 / 0,56) ve toplam puan artar.

---

## 4. Soru havuzu ve cevap güvenliği

### Nerede (karar 3)

- Gerçek sorular, cevaplar ve açıklamalar public Kabuk reposuna girmez.
- Kabuk'ta yalnızca şunlar bulunur:
  - şema (zod), doğrulayıcı ve içe aktarma betiği;
  - açıkça sahte örnek deste `content/kaupholl-questions.sample.json`;
  - `.gitignore`'da `content/private/`.

### Gizli içerik kapısı (karar)

Tek bir denetim, üç yerde çalışır: `scripts/secret-guard.mjs` (`pnpm guard:secrets`). Yerel kancalar kolaylıktır; **asıl kapı CI'dır**, çünkü kancalar atlanabilir (`--no-verify`, kancasız klon, GitHub web arayüzü).

| Katman                                     | Ne yapar                                                                                                                                          | Atlanabilir mi                                                    |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Claude kancası (`.claude/hooks/guard.mjs`) | Oturumların `git add` / `git commit` komutunu, kapıya takılan dosya varsa çalışmadan durdurur                                                     | Yalnız Claude oturumlarında çalışır                               |
| Git kancası (`.githooks/pre-commit`)       | Hazırlanan (staged) dosyaları denetler. Geliştirici bir kez `git config core.hooksPath .githooks` çalıştırır (`docs/OPS.md`); yeni bağımlılık yok | `--no-verify` ile atlanır                                         |
| **CI** (`ci.yml` → `checks`, ilk adım)     | Depodaki **bütün izlenen dosyaları** (`git ls-files`) denetler, yalnız farkı değil                                                                | Ancak `ci` ruleset'le zorunluysa atlanamaz (aşağıda, kabul şartı) |

**Kabul şartı** (karar): `ci`'ın GitHub'da gerçekten zorunlu olduğu doğrulanmadan kapı "atlanamaz" sayılmaz.

5 Kasım 2026 denetimi (`gh api`; komutlar `docs/OPS.md` → Gizli içerik kapısı):

- Klasik branch protection yok (404).
- Ruleset `main` (id 25404394) `enforcement: active`, hedef varsayılan dal. `bypass_actors` boş; bu hesap için `current_user_can_bypass: never`.
- Kurallar: `deletion`, `non_fast_forward`, `pull_request` (yalnızca squash) ve `required_status_checks` → `ci` (GitHub Actions, integration 15368; dalın güncel olması istenmiyor).

Sonuç: main'e ancak `ci`'ı yeşil bir PR'la girilir; kapıya takılan PR birleşemez.

Kalan riskler:

- Repo yöneticisi ruleset'i değiştirebilir.
- Kapıyı `ci.yml`'den ya da betikten kaldıran bir PR `ci`'dan geçebilir; bu dosyalara dokunan PR'da kapının hâlâ koştuğuna birleşmeden bakılır.
- Ruleset değişirse denetim yinelenir.

Ek olarak (proje sahibinin ayarı, kod değil): GitHub'ın public depolarda ücretsiz olan secret scanning ve push protection özelliği açılsın. Bilinen token biçimlerini push anında durdurur; CI kapısının yerine geçmez.

**Durdurulanlar:**

1. **Yasak yollar:** `content/private/**`; adında `kaupholl-questions` geçen ve `.sample.json` olmayan her dosya; `kaupholl-sorular/**`, `kaupholl-kontrol/**`, `dogrulama/**`; `*.pem`, `*.key`, `*.p12`, `.env` ve `.env.*` (yalnızca `.env.example` serbest).
2. **Deste biçimi:** `content/kaupholl-questions.sample.json` dışında, hem cevap (`answer` ya da `answer_scaled`) hem kaynak (`source`) alanı taşıyan nesne dizisi içeren her JSON, YAML ya da CSV. Örnek dosyanın kendisi de denetlenir: `"sample": true` işareti taşımalı, her sorusu "Örnek soru" ile başlamalı ve en çok 20 satır olmalı.
3. **Erişim anahtarları:**
   - Supabase secret key (`sb_secret_…`) ve `role: service_role` taşıyan JWT;
   - `SUPABASE_SERVICE_ROLE_KEY=` ya da `SUPABASE_SECRET_KEY=` ardından değer;
   - `-----BEGIN … PRIVATE KEY-----`;
   - GitHub (`ghp_`, `gho_`, `ghs_`, `github_pat_`), Sentry auth (`sntrys_`), PostHog kişisel anahtar (`phx_`), Expo erişim token'ı (`EXPO_TOKEN=` + değer).
   - Mobilde zaten bulunan publishable/anon anahtar ve PostHog proje anahtarı serbesttir (istemci için tasarlanmışlardır).
4. **İstisna listesi:** `scripts/secret-guard.allow`. Satır başına yol ve gerekçe; yalnızca sahte değer taşıyan dosyalar. Listenin kendisi de testle denetlenir: listedeki her yol gerçekten var ve gerekçesi boş değil.

Kapının çıktısı yalnızca yol ve kural adını yazar; eşleşen değeri asla basmaz (anahtar CI günlüğüne düşmesin).

### Bağımsız doğrulama: iki özel depo (karar 4)

| Depo                          | İçerik                                                                                     | Erişim                        |
| ----------------------------- | ------------------------------------------------------------------------------------------ | ----------------------------- |
| `WazzupDevs/kaupholl-sorular` | Soru, birim, `decimals`, cevap, açıklama, kaynak, zorluk, yön, kategori                    | Proje sahibi + yazarlar       |
| `WazzupDevs/kaupholl-kontrol` | Yalnızca `id`, soru, birim, `decimals`, kaynak bağlantısı; doğrulayıcının yazdığı cevaplar | Proje sahibi + doğrulayıcılar |

1. Proje sahibi `export-check` betiğiyle `sorular`'dan cevapsız ve açıklamasız alanları `kontrol`'e aktarır. Betik soru metninde ve bağlantıda cevabın rakamlarının geçmediğini de denetler.
2. Doğrulayıcı kaynağı açar ve cevabı `kontrol`'e yazar.
3. Proje sahibi iki depoyu `compare` betiğiyle karşılaştırır. Çıktı yalnızca tutan ve tutmayan `id`'lerdir. Tutmayan soru içe aktarılmaz; yazarla doğrulayıcı kaynağa birlikte bakar.

**Ne garanti edilir, ne edilmez:**

- Doğrulayıcı `kaupholl-sorular`'a collaborator değilse, organizasyon sahibi değilse ve o soruyu kendisi yazmadıysa yazarın cevabını GitHub izinleriyle göremez. Yalnızca bu durumda kontrol **kör** sayılır. Her turdan önce `sorular` deposunun erişim listesine bakılır.
- Kaynak sayfasında cevap yazar; doğrulayıcı onu kaynaktan okur. Körlük yazarın cevabına karşıdır, cevabın kendisine değil.
- Doğrulayıcı aynı zamanda yazarsa, ya da proje sahibi başkasının yazdığı soruyu doğrularsa (iki depoya da erişir), o kontrol **bağımsız kontrol (kör değil)** olarak kaydedilir. `compare` her soru için hangi tür kontrolden geçtiğini yazar.

### Taslak ve doğrulama süreci (karar)

- **Taslaklar:** ilk 200 sorunun taslaklarını Claude Code hazırlar, yalnızca özel `kaupholl-sorular` deposunda; public repoya hiçbir taslak girmez.
  - Her soruda sayısal cevap, uygun birim, açıklama, doğrulanabilir kaynak ve kaynak tarihi bulunur.
  - Her satır `author: claude`, `status: taslak` olarak başlar.
- **Claude'un cevabı doğrulanmış sayılmaz.** İnsan doğrulaması olmadan hiçbir soru içe aktarılmaz; içe aktarma betiği `status: doğrulandı` olmayan satırı reddeder.
- **İkinci kişi varsa:** yalnızca `kaupholl-kontrol`'e erişir ve yazarın cevabını görmeden kaynağı kendisi bulur ya da açar. Bu kontrol, GitHub erişimleri yukarıdaki koşulları sağlıyorsa **kör** olarak kaydedilir.
  - Claude Code'un hem taslak hem kontrol tarafında çalışması kör sayılmaz.
  - Kontrol tarafına yalnızca `export-check` çıktısı geçer.
- **İkinci kişi yoksa:** taslak üretimi sürer. Proje sahibi kaynak doğrulaması yapabilir, ama iki depoya da eriştiği için bu kontrol `bağımsız kontrol (kör değil)` olarak etiketlenir, asla `kör` değil.
- **Eleme:** kaynağı bulunamayan, kaynakta doğrulanamayan, kaynaklar arasında tartışmalı ya da cevabı yuvarlamaya duyarlı sorular elenir (`status: elendi`). Elenen satır içe aktarılmaz, depoda gerekçesiyle kalır.
- **Üretime aktarma** yalnızca proje sahibinin onayıyla, onun çalıştırdığı `admin:kaupholl-import` ile olur. Dev projesine aktarma yalnızca doğrulanmış satırlarladır.

### İçe aktarma ve üretim (karar 3)

- `pnpm admin:kaupholl-import --file <yol>`. Secret key yalnızca kabukta durur. Dev'e oturum aktarabilir; üretime yalnızca proje sahibi aktarır.
- Betik şunları yapar:
  - zod doğrulaması, ve her soruda kör ya da bağımsız kontrol kaydının bulunması;
  - `id`'ye göre ekleme ve güncelleme; dosyadan çıkan soru silinmez, `active = false` olur;
  - çıktısında yalnızca sayılar.
- `kaupholl_questions` ve `kaupholl_question_stats`:
  - RLS açık; `anon` ve `authenticated` için politika yok ve tablolarda `revoke all`;
  - yalnızca service role ile çalışan sunucu işlemleri (Edge Function, admin betiği) okur.
  - PR B'nin entegrasyon testi iki rolle okumanın reddedildiğini denetler.

### Satır kuralları (doğrulayıcı denetler)

- Birim zorunludur; büyük cevaplar birimle ölçeklenir (karar 9; örneğin "milyon kişi", "bin km"). Cevap 0 ile 999.999,9 arasında olur: en çok 6 tam hane ve 1 ondalık.
- Kaynak ve kaynak tarihi zorunlu; değişen bilgi soruda yılıyla yazılır.
- Soru metni cevabın rakamlarını içermez.
- Metin ve açıklama küfür filtresinden geçer.
- Negatif cevap ve tartışmalı tanım yok.
- Her soruda `difficulty` (kolay / orta / zor), `bias` (eksik / tarafsız / fazla) ve `category` var.

### Seçim ve gevşetme sırası (karar 6, öneri)

Kesin kurallar hiç gevşemez: etkin soru; **bu masada daha önce kullanılmamış** (sessiz tekrar yok, karar); 5 farklı soru. Hedef: 2 kolay, 2 orta, 1 zor; aynı kategoriden en çok 2; "fazla" yönünden en çok 1 ve "eksik" yönünden en çok 1.

Hedef sağlanamazsa sırayla gevşenir; ilk başaran düzey kullanılır:

| Düzey | Gevşeyen                                                                                                         |
| ----- | ---------------------------------------------------------------------------------------------------------------- |
| 0     | Hiçbiri                                                                                                          |
| 1     | Zorluk: eksik kalan zorluğun yerine komşusu (kolay yoksa orta; zor yoksa orta; orta yoksa önce kolay, sonra zor) |
| 2     | Kategori sınırı 3                                                                                                |
| 3     | Aynı yön en çok 2 (3 asla)                                                                                       |
| 4     | Kategori sınırı yok                                                                                              |
| —     | Düzey 4'te de geçerli beşli kurulamazsa **içerik yetersizliği** (aşağıda); oyun başlamaz                         |

**Geçerli beşli:** kesin kurallar + o düzeyin sınırları + en az bir zor olmayan soru (5. sıra için; aşağıda). Kullanılmamış soru sayısı 5 ya da daha fazla olsa da geçerli beşli kurulamayabilir: örneğin kalan sorular hep zorsa ya da hep aynı yöne eğilimliyse.

**Sıra** (karar):

- 5. soru hiçbir zaman zor değildir; kolay ya da orta olabilir.
- 5. sıraya beşlideki zor olmayan sorulardan biri rastgele seçilir; kalan dört soru 1–4. sıralara rastgele dizilir. Böylece zor soru (ya da gevşetmeyle gelen zorlar) ilk dört konumdan birine eşit olasılıkla düşer.
- Gevşetme en çok 3 zor getirebilir (1 hedef + ortaların yerine 2); hepsi ilk dörde sığar.

**İçerik yetersizliği** (karar):

- Geçerli beşli kurulamazsa `start` `questions_exhausted` döner (409). Ölçüt ham soru sayısı değil, beşlinin kurulup kurulamamasıdır. Oyun başlamaz; hiçbir soru masada kullanılmış sayılmaz; oyun öncesi sayfa açık kalır.
- Sahip ekranında: **"Bu masada yeni bir Kaupholl oyunu için yeterli uygun soru kalmadı."** (karar) Katılımcılar oyunun başlamadığını oyun öncesi sayfanın sürmesinden görür. Hata titreşimi taşır: sahibin bastığı eylemdir.
- Kaupholl posteri o masada soluk görünmez; başlatılabilirlik yalnızca `start`'ta anlaşılır.
- **Az soru uyarısı** (karar): oyun öncesi sayfada sahip `pool` ile bu masada kullanılmamış etkin soru sayısını alır. Sayı 10'un altındaysa sahibe uyarı gösterilir (metin öneri): "Bu masada az sayıda uygun soru kaldı." Uyarı başlatmayı engellemez, "başlatılabilir" anlamına da gelmez: sayı 10'un altındayken oyun başlayabilir, üstündeyken `questions_exhausted` olabilir. Sayının kendisi ekranda yazılmaz (öneri), sayı ile başlatılabilirlik karışmasın diye. Katılımcılar uyarıyı görmez.
- Etkin destenin tamamı 5'ten küçükse (kurulum hatası) aynı `questions_exhausted` döner.
- Sunucu günlüğüne kişisel olmayan bir sayaç yazılır (kaç kez yetersizlik oldu); proje sahibi `admin:kaupholl-stats`'ta görür ve desteyi büyütür.
- Masa içinde tekrar hiçbir koşulda yapılmaz. Engel masaya (`room_id`) bağlıdır: yeni kurulan masa yeni kayıtla başlar ve bütün desteyi görür.

- Seçim `pure/kaupholl.ts`'te saf fonksiyondur, tohumlu rastgeleyle test edilir. Hangi düzeyde seçildiği yalnızca sunucu günlüğüne yazılır.
- Sıra yukarıdaki kurala göredir (karar); tohumlu rastgeleyle test edilir.

### Kişisel olmayan soru istatistiği (karar 5)

- `kaupholl_question_stats (question_id, games, guesses, no_guess, smaller_wins, win_bucket[6], sum_abs_log_err)`.
- Yalnızca sayaçlar ve toplamlar; kişi, masa, mekan, oyun kimliği ya da zaman damgası yok (zaman bir masaya bağlanabilirdi). Cevap aşamasında aynı işlemde artar.
- Okuyan: yalnızca `pnpm admin:kaupholl-stats`. Kullanımı: zorluk ve yön etiketlerinin düzeltilmesi, §3'teki pilot bakışı.
- `kaupholl_seen` ve kişi–soru eşleşmesi yok (karar 5). Hesaplar arası tekrar önlemi sonraki sürümde KVKK ve veri en aza indirme ilkesiyle değerlendirilir.

### Tekrar ve havuz büyüklüğü

- Masa içinde tekrar yok (`room_used_cards`). Aynı kişiler başka masada aynı soruyu görebilir; bu pilotta bilinen sınırdır.
- 200 soru, 5'erli seçimle bir masada 40 tekrarsız oyun eder; 41. oyunda içerik yetersizliği olur. Öneri: istatistikte kullanım sayısı en düşük olan sorulara öncelik verilsin (kişisel değil, yalnızca `games` sayacı). Düzenli gruplar böylece havuzun tamamını görmeden tekrar yaşamaz.
- Cevaplar her oyunda açıldığı için kararlı biri çok oynayarak liste çıkarabilir. Havuzun büyümesi bunu azaltır, engellemez.

---

## 5. Ekran doğrulaması

**Bu bölümdeki hiçbir şey "sığar" diye kesinleşmiş değildir.** Yükseklikler tasarım ölçülerinden hesaplandı; metin genişlikleri uygulamanın fontuyla (Plus Jakarta Sans) Chromium'da ölçüldü. Kesin kabul ancak Aura çizimi (§6) ve Prompt 3'teki cihaz görüntüleriyle olur.

### Metin ölçümü (ölçüm)

| Metin                         | %100 | %130 |
| ----------------------------- | ---- | ---- |
| Dilim tahmini 800/21 "8.760"  | 59   | 77   |
| "999.999"                     | 84   | 109  |
| "99.999,9" (en uzun izinli)   | 92   | 120  |
| Tahmin alanı 800/32 "999.999" | 128  | 167  |
| Gönderildi 800/52 "99.999,9"  | 229  | 297  |
| Ad 600/12 "Sebahattin"        | 64   | 83   |

### Dilimde tahmine kalan genişlik (hesap)

Tahta genişliği, iç boşluk, oran dairesi 44, jeton alanı 132 ve aralar düşüldükten sonra:

| Ekran | Kalan | %100'de "99.999,9" (92)    | %130'da (120)                     |
| ----- | ----- | -------------------------- | --------------------------------- |
| 390   | 126   | sığar (hesap)              | 6 px payla sığar (hesap; sınırda) |
| 360   | 96    | 4 px payla sığar (sınırda) | **sığmaz**                        |
| 320   | 56    | **sığmaz**                 | **sığmaz**                        |

Sonuç: 360 ve altında ya da büyük yazıda tasarımdaki 132'lik jeton alanı korunursa uzun sayı kesilir. Karar 9 ("hiçbir cihazda kesilmez") sıkı düzende jeton alanının küçülmesini zorunlu kılar.

- Tahmin alanı (32 px) her boyutta sığıyor (hesap: 320'de 208 alan, 167 gerekli).
- Gönderildi'deki 52 px sayı 320'de %130'da sığmıyor (297 > ~248); orada küçülmesi gerekir. Bu, kitin `Button` yazısı gibi "sığmazsa küçülür" kuralıdır, `...` değildir.

### Yükseklik: 7 dilimli en kalabalık tahta (hesap)

| Düzen                            | 390×844                                                | 360×800   | 360×740  | 320×640   |
| -------------------------------- | ------------------------------------------------------ | --------- | -------- | --------- |
| Tasarım (dilim 56)               | 18 px artar                                            | 26 eksik  | 86 eksik | 186 eksik |
| Sıkı (şerit tek satır, dilim 48) | 146 artar                                              | 102 artar | 42 artar | 58 eksik  |
| Sıkı, %130                       | dilimin tek satırda kalması şart; çizimle doğrulanacak | aynı      | aynı     | eksik     |
| Sıkı + cüzdan düğme satırında    | —                                                      | —         | —        | 6 eksik   |

- **320×640'ta kaydırmasız sığdığı iddia edilmez** (karar 8). Orada tahta kendi içinde kayar; süre şeridi, cüzdan ve "Yatırdım" sabit kalır. Bu durum %130'da da test edilir.
- **12 jeton aynı dilimde** (6 oyuncu × 2): kişi kişi gösterimde 6 jeton × 34 = 204 px; 132'ye iki satır sarar ve dilim ~76 px olur. Bu, yükseklik hesabını 20 px bozar. Sıkı düzende jeton yığını şart: tek jeton, toplam "×12" ve üst üste binen sahip kapsülleri.
- **Birleşmiş tahmin** (örneğin 4 kişi aynı sayıyı yazdı): 4 ad yan yana sığmaz. Öneri: 1 kişide ad, 2'de iki ad, 3 ve üzerinde yalnız bindirilmiş kapsüller ve "4 kişi". Ekran okuyucu bütün adları okur.

### Test matrisi (Prompt 3'ün kabulü; öneri)

Boyutlar 320×640, 360×740, 360×800, 390×844; yazı %100 ve %130 (8 bileşim). Her bileşimde:

1. 6 farklı tahmin (7 dilim);
2. birleşmiş tahmin (3 kişi aynı sayı, 2 farklı);
3. 12 jeton aynı dilimde;
4. en uzun sayı "99.999,9" dilimde, tahmin alanında, Gönderildi'de, Cevap kutusunda ve cevap çizgisinde;
5. "Hepsinden küçük" kazanan;
6. Tahmin yaz ekranı klavye açıkken.

Ölçüt: hiçbir metin `...` ile kesilmez; hiçbir düğme yazısı iki satıra bölünmez; süre, istem ve ana eylem kaydırmadan görünür (320×640'ta tahta içi kaydırma dışında). Görüntüler ilgili Aura panosuyla karşılaştırılır. Uygun olanlar görsel kapıya baz olarak eklenir; `gorsel-baz` etiketi.

---

## 6. Aura'ya çizilecek farklar (Prompt 3'ten önce)

Mevcut 11 pano değişmez; aşağıdakiler yeni pano ya da yeni hâl olarak eklenir.

| #   | Pano / hâl                                | Fark                                                                                                                                 |
| --- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | KaupholOyuncular                          | Çipler "5 soru", "Tahmin 45 sn", "Yatırma 20 sn"; yeni kural metni (§1); alt satır "Geçmeden en yakına yatır"                        |
| 2   | Oyun kartı (K-77 kart satırı)             | Alt satır "Geçmeden en yakına yatır" (metin kodda; kart düzeninde sığması)                                                           |
| 3   | Faz hapı                                  | "Soru 3/5"                                                                                                                           |
| 4   | KaupholGonderildi                         | "Kesinleştir" (primary) + "Tahmini değiştir" (soft); çiplerde üç hâl: yazmadı / yazdı / kesin                                        |
| 5   | Kesinleşmiş tahmin (yeni hâl)             | "Değiştir" yok, "Herkes bekleniyor" satırı                                                                                           |
| 6   | KaupholTahta                              | C3 oranları (5 dilimde ×6 ×4 ×2 ×2 ×4 ×6); şerit alt satırında kural cümlesi                                                         |
| 7   | **Tahta sıkı** (yeni pano)                | Süre şeridi tek satır, dilim 48, ad yerine kapsül, jeton yığını (tek jeton, "×n", bindirilmiş kapsüller), birleşmiş tahmin gösterimi |
| 8   | **Tahta 320×640 kayan** (yeni pano)       | Tahta içi kaydırma; süre, cüzdan ve "Yatırdım" sabit; kaydırmanın görünür işareti                                                    |
| 9   | Kilitli yatırım (yeni hâl)                | "Yatırdım" basıldıktan sonra cüzdan ve dilimler kilitli görünüm                                                                      |
| 10  | KaupholCevap                              | "En yakın" → "Kazandı"; uzun sayı                                                                                                    |
| 11  | Cevap: kimse tahmin yazmadı (yeni hâl)    | Tahta yok, cevap kutusu ve "Kimse tahmin yazmadı"                                                                                    |
| 12  | Cevap: Hepsinden küçük kazandı (yeni hâl) | Kazanan "Hepsinden küçük" dilimi; +3 yok                                                                                             |
| 13  | KaupholSoruSonu                           | "Kazanan tahmin: <Ad>" / "Hepsinden küçük kazandı"; "Soru 3/5 bitti"                                                                 |
| 14  | KaupholOyunSonu                           | "Oyun bitti · 5 soru"; ortak kazanan (2–3 kapsül 72)                                                                                 |
| 15  | Oyun yarıda kaldı (yeni hâl)              | Masaya dönüş bildirimi; Oyun sonu yok                                                                                                |
| 16  | Süre doldu (yeni hâl)                     | Tahmin ve Tahta'da "Süre doldu, kayıtlı tahminin / yatırımın geçerli"                                                                |
| 17  | Tahmin alanı uyarısı                      | "En çok 6 hane"                                                                                                                      |
| 18  | %130 yazı                                 | Tahmin yaz, Tahta sıkı, Cevap; uzun sayı ile                                                                                         |
| 19  | Yükleniyor ve bağlantı hatası             | Kart ve tahta için (raporda çizilmemişti)                                                                                            |
| 20  | Otomatik kesinleşti (yeni hâl)            | Süre dolunca kesinleşmemiş tahminin "Kesinleşti" görünümü (Gönderildi ve Tahta başında)                                              |
| 21  | Soru kalmadı (yeni hâl)                   | Sahip "Oyunu başlat"a basınca: "Bu masada yeni bir Kaupholl oyunu için yeterli uygun soru kalmadı."; oyun öncesi sayfa açık kalır    |
| 22  | Az soru uyarısı (yeni hâl)                | Oyun öncesi sayfada yalnız sahipte uyarı satırı "Bu masada az sayıda uygun soru kaldı."; "Oyunu başlat" etkin kalır                  |

Hareket önerisi değişmedi. Onay gelene kadar basit solma.

---

## 7. Uygulama ve test planı

Her biri main'den ayrı dal ve tek PR.

### PR 0: gizli içerik kapısı (önce; PR A'dan bağımsız)

- `scripts/secret-guard.mjs` ve `pnpm guard:secrets`; `pnpm check`'e eklenir.
- **Kabul şartı:** `ci`'ın `main` ruleset'iyle zorunlu olduğu PR'da `gh api` çıktısıyla gösterilir (§4).
- `ci.yml` → `checks` işine adım. Sır kullanmaz ve hiçbir ortama yayın yapmaz; `ci` yeşilse birleşir.
- `.githooks/pre-commit`, `.claude/hooks/guard.mjs`'e git add / commit denetimi, `.gitignore` satırları, `docs/OPS.md`'de kanca kurulumu, `scripts/secret-guard.allow`.
- **Testler (`scripts/secret-guard.test.ts`, vitest):**
  - Her yasak yol durur; `.sample.json` ve `.env.example` geçer.
  - Deste biçimli JSON / YAML / CSV örnek dışındaki her yerde durur. Örnek dosya `sample: true`, "Örnek soru" ve 20 satır kuralını çiğnerse durur.
  - Her anahtar türü durur. Test sabitleri dosyada düz yazılmaz, çalışırken parçalardan kurulur; testin kendisi kapıya takılmaz.
  - Publishable / anon ve PostHog proje anahtarı biçimi geçer.
  - Çıktı eşleşen değeri içermez.
  - İstisna listesinde olmayan yol yine durur; listedeki yok olan yol ya da boş gerekçe testi düşürür.
  - CLI, geçici bir git deposunda izlenen dosyayı yakalar ve sıfırdan farklı çıkış kodu döner; izlenmeyen (`.gitignore`'daki) dosyayı denetlemez.
  - Bugünkü main kapıdan geçer (ilk koşuda bulunan her şey ya düzeltilir ya gerekçeyle listeye girer).
- `scripts/claude-hooks.test.ts`: `git add content/private/x.json` ve kapıya takılan dosyalı `git commit` oturumda durur.

### PR A: saf mantık (`pure/kaupholl.ts` + vitest)

- **Tahta:** birleştirme, sıralama, C3 (k = 1–6); kazanan (eşit cevap, "Hepsinden küçük", hiç tahmin); puan ve +3 (birleşik dilim, çıkan).
- **Sonuç:** ortak kazanan; yarım kalan oyun (sonuç yok).
- **Aşama makinesi:**
  - kart 10 sn;
  - tahmin: hepsi kesinleşince erken, değilse 45 sn; süre sonunda kayıtlı her tahmin otomatik kesinleşir, kazanırsa +3; kayıtsız oyuncunun dilimi yok;
  - tahta: hepsi kilitleyince erken, değilse 20 sn; hiç tahmin yoksa tahta atlanır;
  - ara ekranlar: hepsi hazır ya da 10 sn;
  - `advance` tek aşama ve yeni `endsAt`.
- **`decideAction`:** rol, gözlemci, adım, aşama kapalı; `seq` tablosunun her satırı (büyük, eşit-aynı, eşit-farklı, küçük, sınır dışı); kilit sonrası her istek.
- **`publicState` / `viewFor`:** sır alanları tipten ve testten dışarıda.
- **Soru seçimi:**
  - Düzey 0–4 ve her gevşetmenin tetiklendiği havuzlar; düzey 1'in komşu sırası.
  - Masada kullanılmış soru hiçbir düzeyde seçilmez.
  - `questions_exhausted`: 4 kullanılmamış soru; 5 ya da daha fazla kullanılmamış soru ama geçerli beşli yok (hepsi zor; hepsi aynı yöne eğilimli, 3'ten fazla); yalnızca zor sorular kalan masa.
  - Kullanım sayısı önceliği.
- **Sıra:**
  - 5. soru hiçbir tohumda zor değildir.
  - 10.000 tohumda zor soru 1–4. konumlara eşit olasılıkla düşer (her biri %25 ± 2).
  - 5. konumda hem kolay hem orta görülür.
  - 2 ve 3 zorlu beşlide de 5. konum zor değildir.
  - Aynı tohum aynı sırayı verir.
- **Türkçe sayı:** `parseTrNumber`, `formatTrNumber` (binlik nokta, ondalık virgül, 6+1 sınırı, "8.760" ile "8,76" ayrımı, baştaki sıfır, boşluk).

### PR B: sunucu (`guvenlik` denetimiyle)

- **Migration:** `kaupholl_questions`, `kaupholl_question_stats` (RLS, politika yok, `revoke`); `game_results` modu.
- **`functions/kaupholl`:** §2'deki eylemler. `IDEMPOTENT_CALLS`: `view`, `pool`, `advance`, `reveal`, `guess`, `bet`, `ready`, her biri iki kez gönderen testle.
- `games.json` satırı (`available: false`), örnek deste, `pnpm seed`.
- **Betikler:** `admin:kaupholl-import`, `export-check`, `compare`, `admin:kaupholl-stats`, vitest testleriyle. Gerçek veri kullanmazlar, testler örnek desteyle.
- **Metin ve belge:** `tr.ts` alt satırı; SPEC_V4 §4.F adım 4.6.10 adayı (numara o gün güncel main'de ve diğer oyunlarınkiyle yeniden denetlenir); K-77 satırı; `docs/decisions/<numara>-kaupholl.md`.
- **`supabase/tests/kaupholl.test.ts`:**
  - **Akış:** 3 ve 6 oyuncu, 5 soru, gözlemci, ortak kazanan, hiç tahmin yok, "Hepsinden küçük".
  - **Sızma:**
    - kart açılmadan soru metni ve birimi;
    - tahta kurulmadan başkasının tahmini;
    - Cevap'tan önce cevap ve açıklama.
    - Bakılan yerler: `rooms.game_state`, `game_events`, her eylemin başarılı ve hatalı yanıtları, başka oyuncunun ve gözlemcinin `view`'u, Realtime ile giden `rooms` satırı, `phase_over` / `locked` / `seq_conflict` yanıtları.
  - **Tablo erişimi:** `anon` ve `authenticated` iki tabloyu da okuyamaz; istatistik tablosunda kişi, masa ya da zaman kolonu yok (şema testi).
  - **Analitik:** olaylar tahmin, cevap, soru metni ya da soru kimliği taşımaz.
  - **Sıra:**
    - `seq` 2 sonra 1: 1 uygulanmaz;
    - aynı `seq` aynı içerik: aynı yanıt;
    - aynı `seq` farklı içerik: `seq_conflict`, hâl değişmez;
    - kilit sonrası `guess` / `bet` uygulanmaz;
    - kilit son yerleşimi taşır;
    - `endsAt`'tan 1 ms sonra uygulanmaz.
  - **Süre:**
    - erken `advance` etkisiz;
    - kart 10 sn sonra açılır;
    - hepsi kesinleşince erken geçiş;
    - 45 / 20 / 10 sn;
    - uzun aradan sonra `advance` tek aşama ilerler.
  - **Otomatik kesinleşme:**
    - kesinleşmemiş kayıtlı tahmin süre sonunda tahtaya girer ve `view`'da kilitli görünür;
    - kazanırsa +3 alır; elle kesinleştirilmiş eşdeğer tahminle aynı puan;
    - kaydı olmayan oyuncunun dilimi yok;
    - geçişten sonra gelen `guess` otomatik kesinleşmiş değeri değiştirmez (`phase_over`).
  - **Zaman aşımı:**
    - `endsAt`'tan önce `advance` etkisiz; `endsAt`'ta ve sonrasında tek geçiş;
    - iki telefon aynı anda `advance`: tek geçiş, tahta bir kez kurulur, ikinci çağrı aynı hâli döner;
    - eski `step`'li `advance` etkisiz.
  - **Son saniye:** testler `endsAt`'ı service role ile ayarlar.
    - `endsAt − 50 ms`'de gelen `guess` / `bet` uygulanır;
    - `endsAt`'ta ve sonrasında gelen uygulanmaz, yolda kalan kayıtlı son değer geçerli kalır;
    - geçişle aynı anda gelen `guess`: sonuç ya "uygulandı, sonra kesinleşti" ya "uygulanmadı, önceki değer kesinleşti"; ikisinde de `view` ile tahta aynı değeri gösterir.
  - **Erken geçiş yarışları:**
    - son oyuncunun kilidiyle bir başkasının `advance`'i aynı anda: tek geçiş;
    - iki oyuncunun son kilidi aynı anda: tek geçiş;
    - son kilitle aynı anda gelen başka bir `bet`: ya geçişten önce uygulanır ya `phase_over`; tahta ve puanlar iki durumda da sunucunun kaydıyla tutarlı;
    - son "Hazırım" ile 10 sn'lik `advance` aynı anda: tek geçiş;
    - iki oyuncu aynı anda `reveal`: kart bir kez açılır, süre bir kez başlar.
  - **İçerik yetersizliği:**
    - 4 kullanılmamış soruyla `start` → `questions_exhausted`;
    - 6 kullanılmamış ama hepsi zor soruyla da `questions_exhausted`;
    - her iki durumda `room_used_cards`, `game_state` ve `game_players` değişmez, oyun öncesi sayfa sürer;
    - bütün desteyi oynamış masada hiçbir soru ikinci kez seçilmez;
    - hata yanıtı soru, cevap ya da sayı taşımaz.
  - **`pool`:** yalnızca sahip çağırabilir (katılımcı ve gözlemci `not_owner`); sayı kullanılmamış etkin soru sayısına eşittir; soru metni, kimlik ya da cevap taşımaz; iki kez gönderilince aynı sonucu verir (`IDEMPOTENT_CALLS`).
  - **Sıra:** başlayan oyunda `game_secrets`'taki 5. soru zor değildir.
  - **Yeniden bağlanma:** `view` son `seq`'i, sayıyı, yerleşimi ve kilidi döner.
  - **Çıkış:** tahmin aşamasında; tahta sonrası; 2'nin altına düşüş (yarım oyun, `game_results` yok); sahibin "Oyunu bitir"i.
  - **`locks`:** kural 10 kalıbı.

### PR C: içerik

Kod dışı; PR 0 birleşmeden özel depolarla çalışmaya başlanmaz. Claude Code özel depoda 200 sorunun taslağını hazırlar. İnsan doğrulaması kör ya da bağımsız olarak etiketlenir (§4, "Taslak ve doğrulama süreci"). Doğrulanamayanlar elenir. Dev projesine yalnızca doğrulanmış satırlar aktarılır; üretime aktarma proje sahibinin onayıyla. PR A ve B ile paralel yürür.

### Aura

§6'daki farklar tuvale çizilir (proje sahibinin tasarım oturumu).

### Prompt 3

PR B birleştikten ve §6 çizildikten sonra başlar. Kabul: §5'teki test matrisi ve rapordaki kabul maddeleri (v3 metinleriyle). Ekranlar bitince `available: true`.

---

## 8. Kalan sorular (öneriyle)

1. ~~Süre dolunca kesinleşmemiş tahmin~~ → kapandı (karar, v3.1: otomatik kesinleşir).
2. ~~İki kişilik ekip~~ → kapandı (karar: taslakları Claude Code hazırlar; ikinci kişi varsa kör kontrol, yoksa proje sahibinin kontrolü "bağımsız kontrol (kör değil)", §4).
3. ~~Commit kancası~~ → kapandı (karar: yerel kanca + zorunlu CI kapısı, §4).
4. ~~Zor soru sırası~~ → kapandı (karar: zor ilk dört konumdan birine rastgele, 5. kolay ya da orta, §4).
5. ~~Az soru uyarısı~~ → kapandı (karar: 10'un altında sahibe uyarı; başlatılabilirliği `start` belirler, §4).

Açık karar kalmadı. Bu belgeden sonra oyun kuralları değişmez; yeni simülasyon ya da karar turu açılmaz (karar).
