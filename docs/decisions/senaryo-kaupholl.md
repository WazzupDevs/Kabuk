# Senaryo analizi: Kaupholl

6 Kasım 2026. Kaynak kod: `supabase/functions/_shared/pure/kaupholl.ts` (saf mantık), `supabase/functions/kaupholl/index.ts` (fonksiyon), `supabase/migrations/20261202090000_kaupholl.sql` (okuma, yazma, başlatma, çıkış tetikleyicisi). Ürün kuralı `docs/SPEC_V4.md` Adım 4.6.10, `docs/decisions/kaupholl.md` (v3.1). Ekranlar henüz yok (`apps/mobile/src/features/games/kaupholl/` yalnız `kauphollArt.ts`), bu yüzden ekran sütunu bulgu değil, ekran işine nottur (§4). `kaupholl.available: false`.

Doğrulama: aşağıdaki iki davranış (`T-1`, `T-2`) saf mantıkta küçük bir betikle çalıştırılarak doğrulandı; geri kalanı kod okumasıdır, satır numaralarıyla.

## 1. Durum makinesi (koddan)

`step` her geçişte bir artar (`kaupholl.ts` → `cardState` 452, `openCard` 478, `closeGuesses` 516, `openAnswer` 543, `nextPhase` 571/585). Süreler `KAUPHOLL` (16–36).

| Aşama     | Süre (`endsAt`) | Açık eylemler (kim)                                                                    | Erken geçiş                                     | Süre dolunca (`advance`, herhangi bir masa üyesi)                                                  |
| --------- | --------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `card`    | 10 sn           | `reveal` (oyuncu; ilk gelen, süre dolmuş olsa da açar, 706–713)                        | `reveal` hemen `guess`'e geçirir                | `guess` (`openCard`)                                                                               |
| `guess`   | 45 sn           | `guess {seq, value, lock}` (oyuncu; `endsAt`'tan önce, 752; commit'te `clock: before`) | Bütün etkin oyuncular kilitli (`phaseDone` 602) | Kayıtlı tahminler kilitlenir, tahta kurulur → `board`; hiç tahmin yoksa doğrudan `answer` (511)    |
| `board`   | 20 sn           | `bet {seq, coins, lock}` (oyuncu, tahmin yazmamış olan da; 805)                        | Bütün etkin oyuncuların yerleşimi kilitli (604) | Yerleşimler kilitlenir, puan hesaplanır → `answer` (`openAnswer`)                                  |
| `answer`  | 10 sn           | `ready` (oyuncu; süre dolmuş olsa da sayılır, 714–721)                                 | Herkes hazır (607)                              | `summary`                                                                                          |
| `summary` | 10 sn           | `ready`                                                                                | Herkes hazır                                    | Sonraki soru `card`; 5. sorudan sonra `over` (`winnersOf`), commit `kaupholl_finish` (SQL 427–429) |
| `over`    | —               | yok                                                                                    | —                                               | `advance` etkisiz (697)                                                                            |

Çıkış (`leaveGame` 835 ve SQL tetikleyicisi 662–738): etkin oyuncu 2'nin altına düşerse oyun terk edilir (`end_game(…, true)`); yoksa `card`/`guess`'te çıkanın tahmini düşer, `board`'da dilimi kalır, jetonları kalkar; aşama yalnız onu bekliyorsa `endsAt = now`.

Gizli bilgi: `game_state` her aşamada `publicState` ile aynıdır (soru `card`'da `null`, tahta `guess`'ten sonra, cevap `answer`'dan itibaren); `kaupholl_check_write` (SQL 220–274) son kapı. Tahminler `game_secrets`'ta, telefona yalnız `viewFor` ile kendi tahmini gider (909–922).

Belgeyle fark: yalnız §3'teki B maddeleri.

## 2. Senaryo matrisi

Sorunlu ve kritik hücreler; satır sonu bulgu kimliğidir. Burada yazılmayan her hücre kodla doğrulandı.

| Boyut         | Senaryo                                                                                   | Kod ne yapıyor                                                                                                                                              | Bulgu   |
| ------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| Uç içerik     | Tam sayılı soru (`decimals: 0`), oyuncu "12,5" yazar                                      | `guess` yalnız `isGuessValue`'ya bakar (736), kartın `decimals`'ını okumaz: uygulanır                                                                       | T-1     |
| Uç içerik     | Beş soruda kimse kazanan dilime jeton koymadı, herkes 0                                   | `winnersOf` en yüksek 0'ı alır, herkes kazanan (160–164); `game_results.won = true` herkeste (SQL 333)                                                      | T-2     |
| Çıkışlar      | 4 kişi, 1. soru `card` aşamasında iki kişi çıkar → oyun terk                              | Beş sorunun beşi de `kaupholl_used_questions`'a başlangıçta yazıldı (SQL 611); açılmamış 4 soru bu masaya bir daha gelmez                                   | T-3     |
| Oyuncu sayısı | 5 kişi; biri tahmin yazmak istemiyor, dördü 5. saniyede kesinleştirdi                     | Erken geçiş herkesin kilidini ister (603); yazmayan kilitleyemez (`guess` değer ister), 40 sn beklenir                                                      | D-1     |
| Zamanlama     | Telefonun saati sunucudan 3 sn geri; oyuncu ekranda "2 sn" görürken gönderir              | Sayaç cihaz saatiyle (`useSecondsLeft.ts` 5); istek `endsAt`'tan sonra varır → `phase_over`, sessizce düşer. Yanıtlar sunucu saatini taşımaz                | D-2     |
| Zamanlama     | Yatırımın yanıtı kayboldu; telefon onu sonraki sorunun `card` aşamasında yeniden gönderir | `cardState` `bets`'i sıfırlar (458); tekrar `replayed` yerine `phase_over` alır. Tahminde aynı tekrar `replayed` alır (746). İkisi de durumu bozmaz         | D-3     |
| Roller        | Gözlemci "Kartı aç"a basar                                                                | `not_player` hatası (703), 4xx                                                                                                                              | Not E-3 |
| Oyuncu sayısı | Oyun öncesi 7 kişi, kimse "Gözlemci ol" seçmedi; sahip başlatır                           | `too_many_players` (index.ts 269)                                                                                                                           | Not E-4 |
| Çıkışlar      | `guess`'te kilitlemeyen tek kişi çıkar                                                    | Tetikleyici `endsAt = now()` yapar (SQL 726); geçiş bir sonraki `advance`'te olur. Telefon `endsAt`'ın değiştiğini görüp `advance` göndermezse aşama bekler | Not E-5 |
| Zamanlama     | Son kilit ile `advance` aynı anda; iki `advance`; son iki "Hazırım"                       | Commit okunan durumu ve `rev`'i karşılaştırır (SQL 382, 390), ikinci yazma yeniden karar verir; tek geçiş. Entegrasyon testleri var                         | —       |
| Zamanlama     | `endsAt`'ta ya da sonra gelen tahmin                                                      | Kararda `expired` (752), commit'te `clock_timestamp() >= ends` (SQL 397); uygulanmaz, kayıtlı olan kilitlenir                                               | —       |
| `seq`         | Büyük, eşit-aynı, eşit-farklı, küçük, 1–10.000 dışı, kilit sonrası                        | 741–757 ve 795–812; SPEC'teki tabloyla birebir                                                                                                              | —       |
| 5xx sonrası   | `reveal`, `guess`, `bet`, `ready`, `advance`, `view`, `pool` ikinci kez                   | `IDEMPOTENT_CALLS`'ta (apiRetry.ts 94–114); tekrar `replayed` ya da `unchanged`                                                                             | —       |
| Bağlantı      | Bütün telefonlar arka planda                                                              | Zamanlanmış iş yok; oyun bekler, dönen ilk telefonun `advance`'i tek aşama ilerletir (belgedeki karar)                                                      | —       |
| Çıkışlar      | Tahta kurulduktan sonra kazanan dilimin tek yazarı çıkar                                  | Dilim kalır, +3 kimseye gitmez, o dilimdeki jetonlar öder (`scoreRound` 140–157)                                                                            | —       |
| Çıkışlar      | Sahibin "Oyunu bitir"i, masanın kapanması, check-in'in bitmesi                            | Çerçevenin `end_game(…, true)` yolu; tetikleyici `masa.ending_game` ile atlanır (SQL 678)                                                                   | —       |
| Gizlilik      | `card`'da soru, `guess`'te tahmin, `board`'da cevap                                       | Hiçbiri `game_state`'e girmez; `kaupholl_check_write` reddeder; `leaks` testi                                                                               | —       |
| Gizlilik      | Oyun terk edildi                                                                          | Açılmamış soruların cevapları `game_secrets`'ta kalır, istemciye kapalı; hiçbir şey açılmaz                                                                 | —       |
| Uç içerik     | Soru seçiminde havuz yetersiz                                                             | `questions_exhausted`, masa değişmez, sayaç artar                                                                                                           | —       |
| Uç içerik     | Bir soru oyun sırasında pasifleşir ya da metni güncellenir (`admin:kaupholl-import`)      | Oyun sırrındaki kopyayla sürer; içe aktarma satır silmez (yalnız `active: false`)                                                                           | —       |
| Kilit sırası  | Bitiren yazma                                                                             | `game_secrets` → istatistik → `kaupholl_finish` (`game_results`, `end_game` ile `game_players`); masa kilidi altında                                        | B-2     |

## 3. Bulgular

| Kimlik | Sınıf | Senaryo                                                                                                                                                                                   | Kanıt                                                                                 | Öneri                                                                                                        |
| ------ | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| T-1    | T     | Tam sayılı soruda "12,5" kabul edilir. Ekran tahtayı kartın `decimals`'ıyla biçimlerse `formatTrNumber(12.5, 0)` "13" verir: cevap 13'ken "13" yazan 13,4'lük dilim kaybeder              | `kaupholl.ts` 736 (`isGuessValue`), 85–92 (`formatTrNumber`); betikle doğrulandı      | Sunucu `card.decimals = 0` iken kesirli tahmini `bad_request` ile reddetsin; tuş takımı virgül göstermesin   |
| T-2    | T     | Kimse puan almazsa herkes "Kazandın" alır                                                                                                                                                 | `winnersOf` 160–164; SQL 333; betikle doğrulandı                                      | En yüksek puan 0 ise kazanan olmasın (`won = false`), sonuç ekranı "Kazanan yok" desin                       |
| T-3    | T     | Yarıda kalan oyunun açılmamış soruları da masaya bir daha gelmez                                                                                                                          | SQL 611 (beşi başlangıçta yazılır)                                                    | Değiştirmeyin: 200 soruda masa başına 40 oyun eder, kartı görülmemiş soruyu geri vermek ek yazma ister       |
| D-1    | D     | Tahmin yazmayan, erken geçişi süre sonuna kadar tutar                                                                                                                                     | 603; `guess` değersiz kilit almaz (736)                                               | Şimdilik bırakın; saha testinde 45 sn beklemek şikâyet olursa "Pas" (değersiz kilit) eklensin                |
| D-2    | D     | Cihaz saati kaymışsa son saniyelerdeki tahmin ve yatırım sessizce düşer (bütün süreli oyunlarda ortak)                                                                                    | `useSecondsLeft.ts` 5 cihaz saatini kullanır; `KauphollAnswer` sunucu saatini taşımaz | Oyun yanıtları ve `view` sunucunun `now`'ını taşısın, sayaç farkı düzeltsin; ortak bir paket (bütün oyunlar) |
| D-3    | D     | Yatırımın kaybolan yanıtı sonraki soruda tekrar edilirse `phase_over` alır, tahminde `replayed`                                                                                           | 458, 795–807                                                                          | Değiştirmeyin; durum doğru, telefon sunucunun hâlini gösterir                                                |
| B-1    | B     | Kurallar belgesi §2'de `view`'ın girdisi `step`; kodda yalnız `roomId`                                                                                                                    | `decisions/kaupholl.md` §2 tablo; `index.ts` 47                                       | Belgeyi koda göre düzeltin                                                                                   |
| B-2    | B     | CLAUDE.md kural 10'un Kaupholl cümlesi bitiren yazmanın `game_secrets` ve istatistikten sonra `game_results` ve `end_game` ile `game_players` yazdığını söylemiyor (Signum'unki söylüyor) | SQL 427–429, 319–343                                                                  | Kural 10'a Signum'daki gibi bir cümle (değişmez kurala dokunur, "onaylandı" ister)                           |
| B-3    | B     | Kurallar belgesi §4 "Masa içinde tekrar yok (`room_used_cards`)"; kod `kaupholl_used_questions`; §1'in kilit listesinde `kaupholl_used_questions` yok                                     | `decisions/kaupholl.md` §1 son satır, §4 "Tekrar"; SQL 119                            | Belgeyi koda göre düzeltin                                                                                   |

Sayılar: K 0, H 0, T 3, D 3, B 3.

## 4. Ekran işine notlar (Kaupholl ekranları, §6 panoları beklenirken)

- E-1 Sayıları kartın `decimals`'ıyla biçimlemeden önce T-1 kararı uygulanmalı; uygulanmazsa tahminler `formatTrNumber(v)` (ondalık yalnız sıfır değilse) ile yazılsın.
- E-2 `parseTrNumber` noktayı binlik ayırıcı sayar: "1.5" `null`, "1.500" 1500. Türkçe tuş takımı nokta gösterirse kullanıcı ondalık için nokta yazabilir; giriş alanı noktayı ya kabul etmesin ya da ekranda "binlik" diye göstersin.
- E-3 Gözlemcide "Kartı aç", tahmin, jeton ve "Hazırım" yok (sunucu `not_player` döner).
- E-4 Oyun öncesi sayfada 7+ oyuncuda başlatma `too_many_players`; sayfa "Gözlemci ol" gerektiğini söylesin.
- E-5 `endsAt` geriye çekilince (son bekleneni çıktı) telefon `advance` göndersin; `unchanged` alan erken `advance` kısa süre sonra yeniden denensin.
- E-6 `over`'dan sonra `view` `no_game` döner; sonuç `rooms.game_state.lastGame.kaupholl`'dan okunur. Terk edilen oyunda "Oyun yarıda kaldı".
- E-7 `guess` ve `bet` kendiliğinden gönderilen çağrılardır (yolda tek istek, birleşen değişiklik); `FEEL_ERROR` yalnız kullanıcının bastığı "Kesinleştir" ve "Yatırdım"da, `phase_over`/`locked`/`outdated` hata değildir.

## 5. Proje sahibinin kararları (6 Kasım)

- T-1: tam sayılı soruda kesirli tahmin reddedilir (`bad_request`); tuş takımında virgül yok.
- T-2: en yüksek puan 0 ise kazanan yok (`won = false`), sonuç ekranı "Kazanan yok".
- T-3: olduğu gibi kalır.
- Düzeltme paketi (Kaupholl, ayrı PR): T-1, T-2, B-1, B-3; B-2 kural 10'a dokunduğu için "onaylandı" bekler.
- Uygulandı (6 Kasım): T-1 (`guess` → `bad_request`), T-2 (`winnersOf` boş, `won = false`), B-1, B-3. B-2 proje sahibince onaylandı (6 Kasım), kural 10'a eklendi.
