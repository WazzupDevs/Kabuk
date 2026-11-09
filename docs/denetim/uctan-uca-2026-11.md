# Uçtan uca denetim (Kasım 2026): takip belgesi

Başlangıç: 9 Kasım 2026, main `4655c93`. Bu belge yalnızca denetimin durumunu tutar; kod, migration ve yapılandırma değişmez. Önceki denetimlerin bulguları tekrar edilmez: `docs/PROGRESS.md` → "Canlı öncesi denetim" (A–F), `docs/denetim/performans-2026-11.md` (B1–B37), `docs/denetim/kapali-beta-2026-11-08.md`.

Kanıt sınıfları: **D** doğrulandı (koddan, testten ya da çalışan yerel veritabanından), **Ş** güçlü şüphe, **Ö** ölçüm gerekli, **İ** iyileştirme fırsatı, **K** ürün kararı gerekli.

## Modüller

| #   | Modül                                                           | Durum                                                 |
| --- | --------------------------------------------------------------- | ----------------------------------------------------- |
| M1  | Sohbet çekirdeği (DM, masa, mekan, semt)                        | Tamamlandı (9 Kasım; ölçüm ve yerel entegrasyon açık) |
| M2  | Realtime ve veri eşitleme                                       | Sonuç raporu hazır                                    |
| M3  | Kapsül ve grafik, hediye paketleri                              | Başlamadı (ön bulgular)                               |
| M4  | Kimlik, oturum, kayıt, onboarding, hesap silme                  | Başlamadı                                             |
| M5  | Check-in, konum, mekan, masa ve lobi                            | Başlamadı                                             |
| M6  | Oyun çerçevesi ve repodaki bütün oyunlar                        | Başlamadı                                             |
| M7  | Arkadaşlık, engel, sessize alma, şikayet, anonimlik             | Başlamadı                                             |
| M8  | Keşfet, harita, Semte Git                                       | Başlamadı                                             |
| M9  | Profil, fotoğraf, bildirimler, push, ayarlar                    | Başlamadı                                             |
| M10 | Açılış, navigasyon, ekran iskeleti, tema, erişilebilirlik       | Başlamadı                                             |
| M11 | Veritabanı bütünü                                               | Başlamadı                                             |
| M12 | Güvenlik bütünü                                                 | Başlamadı (ön doğrulama)                              |
| M13 | Build, yayın, OTA, CI, test, gözlemlenebilirlik, native         | Başlamadı                                             |
| M14 | Birleştirme, gelecekteki ödeme ve paket altyapısı, yol haritası | Başlamadı                                             |

Her modülde ayrıca bağımsız UX denetimi yapılır. M6 kapalı oyunları, bağlantı kopmasını, oyuncu ayrılmasını ve yeniden bağlanmayı da kapsar. M14 abonelik, ödeme, reklam ve hediye ekonomisinin bugünkü mimariye nasıl oturacağını kapsar.

Tamamlanma ölçütü (hepsi): dosyalar "tam okundu / yüzeysel" diye ayrılmış; kullanıcı yolculuğu yazılmış; kıyas kaynaklarıyla yapılmış; bulgular sınıf ve öncelikle kaydedilmiş; ölçüm ihtiyaçları yazılmış; açık ürün kararları listelenmiş.

## Çalıştırılanlar (9 Kasım)

| Denetim                                                      | Sonuç                                                                                           |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| `pnpm install --frozen-lockfile`                             | Kuruldu; lockfile ve kaynak değişmedi                                                           |
| `pnpm guard:secrets`                                         | Geçti                                                                                           |
| `pnpm test`                                                  | 178 dosya, 3.368 test geçti                                                                     |
| `pnpm typecheck` (mobil, scripts, `_shared/pure`, Edge, kök) | Geçti                                                                                           |
| `pnpm lint` (ESLint ve `deno lint`), `pnpm format:check`     | Geçti                                                                                           |
| Yerel Supabase (`pnpm supabase start`)                       | Açıldı; imaj depoları için ortamın izinli adreslerine iki adres eklendi (proje sahibi onayladı) |
| `pnpm test:integration`                                      | Çalıştırılmadı (sıradaki adım: `db:reset` ve `functions serve`)                                 |
| Telefon ölçümü                                               | Yapılmadı (bu ortamdan yapılamaz)                                                               |

## Çalışan yerel veritabanında doğrulananlar (M12 ön doğrulama)

Yöntem: `pg_proc`, `pg_class`, `pg_policies`, `pg_publication_tables` üzerinde `has_function_privilege` ve `has_table_privilege`.

- `public` ve `private` şemalarında 401 fonksiyon. `anon` yalnız dört tetikleyici fonksiyonu çalıştırabiliyor görünüyor (`private.message_identity`, `retire_capsule_nick`, `room_member_look`, `room_name_and_icon`); dördü de `trigger` döndürür, doğrudan çağrılamaz ve `anon`'un `private` şemasında kullanım hakkı yoktur. Açık değil; revoke listesinde eksik (S5, P3).
- `authenticated` 22 fonksiyon çalıştırabiliyor: 5 RLS yardımcısı, aynı 4 tetikleyici, 13 salt-okur RPC. Yazan hiçbir fonksiyon istemciye açık değil.
- `security definer` olup `search_path`'i boş olmayan fonksiyon yok.
- 67 tablo ve görünüm; RLS'siz tek nesne `my_join_requests` görünümü (çağıranın `auth.uid()`'ine göre süzer). `authenticated` hiçbir tabloya yazamıyor; `anon` hiçbir tabloyu okuyamıyor.
- Yazma politikası yalnız `realtime.messages` (istemci yayını; `dm_typing`).
- Realtime yayınında üç tablo: `rooms`, `messages`, `game_events`.
- `venue_chat_page` hâlâ istemciye açık; uygulama Edge üzerinden `venue_chat_page_for` kullanıyor (kullanılmayan yüzey, S6, P3).

## M1: Sohbet çekirdeği

### Okunanlar

| Dosya                                                                                                                                                                                                                                                                  | Derinlik                                                                  |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `apps/mobile/src/components/ChatBubble.tsx`, `ChatWallpaper.tsx`, `TypingDots.tsx`, `theme/setBalloons.ts`                                                                                                                                                             | Tam (`performans` ajanı; ana iddialar ana oturumda koda karşı doğrulandı) |
| `apps/mobile/src/components/ChatScreen.tsx`                                                                                                                                                                                                                            | 1–1140 okundu; 1140–1473 (ekran kabuğu) okunmadı                          |
| `features/chat/useMessages.ts`, `useOlderPages.ts`, `ChatPanel.tsx` (gönderme yolu), `features/venueChat/queries.ts`, `features/district/queries.ts` (sohbet kısmı), `features/friends/queries.ts` (DM kısmı), `dmCache.ts`, `useDmTyping.ts`, `rooms/useBroadcast.ts` | Tam ya da ilgili bölüm                                                    |
| `app/(app)/(tabs)/messages/[threadId].tsx`                                                                                                                                                                                                                             | 100–330 ve satır bileşeni                                                 |
| `app/(app)/venue-chat/index.tsx`, `district/room.tsx`, `room-chat/[id].tsx`                                                                                                                                                                                            | Satır ve gönderme kısımları                                               |
| `supabase/functions/dm`, `chat`, `venue-chat`                                                                                                                                                                                                                          | Tam                                                                       |
| `supabase/functions/district-chat`                                                                                                                                                                                                                                     | Okunmadı                                                                  |
| SQL: `dm_send`, `dm_mark_read`, `dm_mark_delivered`, `dm_status`, `dm_inbox`, `chat_send`, `venue_chat_page_for`, `venue_chat_react`, `room_chat_extras`                                                                                                               | Tam                                                                       |
| SQL: `dm_messages_page` gövdesi, `dm_react`, `chat_react`, `chat_delete`, `venue_chat_send_once`, `venue_chat_delete`, semt sohbeti fonksiyonları, silme işleri                                                                                                        | Okunmadı                                                                  |
| `Composer.tsx`, `ChatTopBar.tsx`, `pure/chatRuns.ts`, `dmPages.ts`, `messageExtras.ts`                                                                                                                                                                                 | Okunmadı                                                                  |

### Bulgular

| #     | Önc.         | Sınıf                 | Bulgu                                                                                                                                                                                                                                                      | Yer                                                                                                                           | Öneri                                                                 |
| ----- | ------------ | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| M1-01 | P2           | D                     | DM ve masa sohbeti gönderimi tekrar güvenli değil; mekan ve semt sohbetinde `clientId` var. Yanıtı kaybolan gönderimde "Tekrar dene" aynı mesajı ikinci kez yazar.                                                                                         | `dm/index.ts`, `chat/index.ts`, `ChatPanel.tsx` → `deliver`, `[threadId].tsx` → `deliver`, `pure/chatOutbox.ts` → `RETRYABLE` | Mekan sohbetindeki `clientId` kalıbı                                  |
| M1-02 | P2           | D                     | Giden kutusu ve taslak ekranın durumunda tutulur: ekrandan çıkınca ya da uygulama kapanınca gönderilmekte olan, başarısız olan ve yazılmakta olan mesaj kaybolur.                                                                                          | `useReducer(outboxReducer)`, `Composer.tsx:232`                                                                               | Sohbet başına telefonda saklamak                                      |
| M1-03 | P2           | D                     | Masa sohbeti: kendi mesajı sunucu yanıtından ve 100 mesajlık yeniden okumadan sonra listeye girer; gelen her mesaj ve tepki de son 100 mesajı ve ekleri yeniden okutur.                                                                                    | `useMessages.ts`, `ChatPanel.tsx:118`                                                                                         | Gelen satırı önbelleğe eklemek; ekler yalnız alıntıda                 |
| M1-04 | P2           | Ş                     | Masa sohbeti kanal yeniden bağlanınca yeniden okumuyor (`useBroadcast` ve `useRoom` okuyor).                                                                                                                                                               | `useMessages.ts:20`                                                                                                           | `SUBSCRIBED`'da imleçle okuma                                         |
| M1-05 | P1 (ölçekte) | D                     | Mekan sohbetinde her tepki ve silme, dinleyen her telefona tam sayfayı okutur (satır başına alıntı, tepki listesi, HMAC, engel ve sessize alma denetimi; ardından fotoğraf imzası).                                                                        | `venueChat/queries.ts:120–130`, `venue_chat_page_for`                                                                         | Tepkide birleştirilmiş, yalnız değişen sayıları okuyan salt-okur RPC  |
| M1-06 | P2           | D                     | Semt sohbeti her mesajda tam sayfayı okur; satırları memo'suz: her kaydırma başlangıcı ve bitişi, 30 sn'lik saat ve her mesaj bütün görünür satırları yeniden çizer.                                                                                       | `district/queries.ts:62`, `district/room.tsx:322`                                                                             | Mekanın `after` imleci ve memo'lu satır                               |
| M1-07 | P2           | D                     | DM'de tepki, bütün görünür satırların memo'sunu bozar (`view` her bekleyen tepkide yeni kimlik alır).                                                                                                                                                      | `messageExtras.ts:64`, `[threadId].tsx:368`                                                                                   | Mekan ve masadaki gibi satıra yalnız kendi bekleyenini vermek         |
| M1-08 | P2           | D                     | `dm_mark_delivered` hesabın bütün konuşmalarını döngüyle gezer, konuşma başına iki sorgu; her ön plana gelişte ve her DM yayınında çağrılır.                                                                                                               | `20261014090000_dm_status.sql`                                                                                                | Tek küme sorgusu                                                      |
| M1-09 | P2           | D                     | Gelen kutusu sayfasız; her DM'de bütün arkadaşlar yeniden okunur; 30 satıra kadar ayrı "yazıyor" kanalı.                                                                                                                                                   | `dm_inbox`, `messages/index.tsx`                                                                                              | Sayfalama; "yazıyor" yalnız görünen satırlarda                        |
| M1-10 | P1           | D (yapı), Ö (maliyet) | Sohbette hareketli avatar, mesaj grubunun son balonunda bir kez çizilir; kare hareketli (`glint`, `shift`, `scan`) aksesuarda avatar başına yaklaşık 19 `SvgView` kurulur. Balonlardaki altı sınırı (`SKIN_MOVERS`) avatarlarda yok; kaydırırken de sürer. | `FxSvg.tsx:262`, `ChatBubble.tsx:588`, `LookAvatar.tsx`                                                                       | M3'te karar: kırpılmış kare katmanı ve yalnız görünen satırda hareket |
| M1-11 | P2           | D                     | Her duran `FxSvg` de kullanmadığı bir `AppState` dinleyicisi ve odak aboneliği taşır; `stillSvg` her çizimde yeniden hesaplanır.                                                                                                                           | `FxSvg.tsx:124–129`                                                                                                           | Duran ve hareketli yolu ayırmak                                       |
| M1-12 | P2           | D (yapı), Ö (maliyet) | Grubun son balonu iki kez çizilir (kuyruk, sonra ölçülmüş şekil); şeklin adı tam yolu içerdiği için hemen her balon kendi resmini önbelleğe koyar ve yama resmi bırakmaz.                                                                                  | `ChatBubble.tsx:172, 321–382, 944`                                                                                            | Boya bağlı olmayan şekil ya da boy kovaları                           |
| M1-13 | P3           | D                     | "Yazıyor" noktaları ve balondaki döngü, ekran örtülüyken ve arka planda durmaz (`useLoopActive` yok).                                                                                                                                                      | `TypingDots.tsx:28`, `ChatBubble.tsx:1289`                                                                                    | `useLoopActive`                                                       |
| M1-14 | P2           | D                     | Erişilebilirlik: balonun etiketi yalnız metin; gönderen, saat, teslim durumu ve tepkiler okunmaz; sil ve bildir yalnız basılı tutmayla.                                                                                                                    | `ChatBubble.tsx:297, 439, 472, 1029`                                                                                          | Birleşik etiket ve erişilebilirlik eylemleri                          |
| M1-15 | P3           | D                     | Sayfalama imleci yalnız `created_at`; aynı anda yazılmış iki mesaj sayfa sınırında atlanabilir.                                                                                                                                                            | `dm_messages_page`, `readRoomOlder`                                                                                           | `(created_at, id)` imleci                                             |
| M1-16 | P3           | Ö                     | `chat_send` her mesajda check-in'i ve masa satırını kilitler; oyun hamleleriyle aynı kilidi bekler.                                                                                                                                                        | `chat_send` → `private.room_phone`                                                                                            | Yük altında ölçmek                                                    |
| M1-17 | P2           | D                     | Push: yanıt gövdesi okunmuyor (ölü token temizlenmez), her DM ayrı bildirim.                                                                                                                                                                               | `_shared/push.ts`                                                                                                             | Yanıtı okumak; konuşma başına birleştirme                             |
| M1-18 | —            | K                     | DM'de mesaj silme ve hiçbir sohbette düzenleme yok; okundu bilgisi kapatılamıyor.                                                                                                                                                                          | `dm/index.ts` eylemleri                                                                                                       | Ürün kararı                                                           |
| M1-19 | P3           | Ö                     | Duvar kâğıtları 1290×2796; çözülmüş boyu ölçülmedi.                                                                                                                                                                                                        | `ChatWallpaper.tsx`                                                                                                           | Sohbette bellek ölçümü                                                |

Ajan ile ana oturum arasında çelişki: ana oturumun ikinci turdaki "avatar her satırda çiziliyor olabilir" varsayımı yanlıştı; avatar grupta bir kez çizilir (`ChatBubble.tsx:588`). N2'nin etkisi buna göre küçülür.

### İyi yapılmış, korunacak

- DM: telefonda kopya, en yeni sayfanın tek uçuşla yenilenmesi, gönderilen mesajın yanıtla önbelleğe girmesi, okundu bilgisinin tek zaman damgasıyla tutulması.
- Sohbet listesi: en yeniden yukarı çizilen tek `FlatList`, sona tutunma, ilk okunmamışa açılış, `onScrollToIndexFailed` ele alınmış.
- Mekan sohbeti: `after` imleci, tek uçuş, kartta rastgele gecikme; mekan, masa ve DM satırları memo'lu.
- Yayınlar veri taşımaz; yeniden bağlanınca her dinleyici bir kez okur.

### Kıyas (kaynaklı)

| Konu                                  | Kaynak ne diyor                                                                                                                                                                                                                                                                                                       | skall                                                                                                        |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Tekrar güvenli gönderim               | Telegram `messages.sendMessage` istemcinin ürettiği `random_id` ister; aynı değer `RANDOM_ID_DUPLICATE` döner, sunucu kimliği `updateMessageID` ile eşlenir ([core.telegram.org](https://core.telegram.org/method/messages.sendMessage), [updateMessageID](https://core.telegram.org/constructor/updateMessageID.md)) | Mekan ve semtte var, DM ve masada yok (M1-01)                                                                |
| Kopan bağlantıda kaçan olaylar        | Discord istemcisi oturum kimliği ve son sıra numarasıyla Resume gönderir, kaçan olaylar yeniden oynatılır; olmazsa yeni oturum ([docs.discord.com](https://docs.discord.com/developers/events/gateway-events))                                                                                                        | Supabase Realtime yeniden oynatmaz; skall yeniden bağlanınca okur (doğru telafi), masa sohbeti hariç (M1-04) |
| Postgres Changes ölçeği               | Supabase, ölçekte RLS'siz ayrı tablo ya da sunucudan Broadcast önerir ([supabase.com/docs/guides/realtime/benchmarks](https://supabase.com/docs/guides/realtime/benchmarks)); rakamlar bu oturumda resmi sayfadan doğrulanmadı                                                                                        | `rooms`, `messages`, `game_events` Postgres Changes ile gider (M2'de ele alınacak)                           |
| Giden kutusunun kalıcılığı, taslaklar | Telegram Android açık kaynak; bu oturumda kaynağı okunmadı, iddia yok                                                                                                                                                                                                                                                 | M1-02                                                                                                        |
| WhatsApp, Instagram, Snapchat         | Kapalı kaynak; bu modülde teknik iddia yok                                                                                                                                                                                                                                                                            | —                                                                                                            |

### Henüz ölçülemeyenler

- Sohbet açılış süresi, kaydırmada kare düşmesi, hareketli avatarlı satırların bellek ve çizim maliyeti (release build, Nothing Phone 1 ve düşük donanımlı bir Android; Perfetto ve `dumpsys meminfo`).
- Mekan sohbetinde N dinleyici ve yoğun tepki altında Edge çağrı sayısı (yerel stack'te bot ile sayılabilir; `pnpm latency` kalıbı).

### M1'i kapatmak için kalanlar

1. Okunmadı diye işaretlenen dosyalar ve SQL fonksiyonları.
2. Dört sohbetin kullanıcı yolculuğu (giriş, ilk içerik, gönderme, hata, kopma, arka plan, engel ve sessize alma) ve UX denetimi.
3. Telegram Android'in giden kutusu, taslak ve tepki güncelleme yönteminin kaynaktan okunması; Mattermost'un sohbet listesi.
4. Sohbetle ilgili entegrasyon testlerinin yerelde koşulması (`chat.test.ts`, `venueChat.test.ts`, `friends.test.ts`, `realtime.test.ts`).

## Önceki turların bulguları (bu oturum)

N1–N15 ve S1–S4 sohbet yanıtlarında verildi; ilgili modül işlenirken buraya taşınır. Düzeltme: N1'deki 156 MB üst sınır tahminidir, ölçüm değildir.

## Açık ürün kararları

- M1-18: DM'de silme, düzenleme, okundu bilgisini kapatma.
- Sohbet avatarlarında hareketin kapsamı (M3).
- Konum doğrulamasında cihaz doğrulaması (S1, M5).

## M1: ikinci tur (9 Kasım)

### Bu turda okunanlar

- `ChatScreen.tsx` 1140–1473 (ekran kabuğu): bulgu yok.
- `Composer.tsx` (taslak ve gönder), `ConnectionBanner.tsx`, `roomChatSeen.ts`, `venue-chat/index.tsx` giriş ve gönderme, `supabase/functions/district-chat` (tam).
- SQL: `dm_messages_page`, `dm_react`, `chat_delete`, `venue_chat_send_once`, `venue_chat_delete`, tepki tabloları.
- Referans kaynak (yalnız yöntem, kopya yok): Telegram Android `SendMessagesHelper`, `MessagesStorage`, `MediaDataController`, `MessagesController`; Mattermost Mobile `app/actions/remote/post.ts`, `app/components/post_list/post_list.tsx`, `app/database/models/server/draft.ts`.

Hâlâ yüzeysel: `ChatTopBar.tsx`, `pure/chatRuns.ts`, `dmPages.ts`, `messageExtras.ts` (birim testleri geçiyor), semt sohbetinin SQL fonksiyonları (`district_chat_*`), `messages/index.tsx` ve `district/room.tsx`'in gönderme ve satır dışındaki kısımları.

### Testler

| Denetim                         | Sonuç                                                                                                                                                                                                                                                                         |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm db:reset` (yerel)         | Geçti                                                                                                                                                                                                                                                                         |
| `pnpm test:integration` (yerel) | Çalıştırılamadı: `functions serve` konteyneri npm'den bağımlılık çekerken oturumun vekilinin sertifikasına güvenmiyor (`UnknownIssuer`); `--env-file` ile `DENO_CERT` ve `SSL_CERT_FILE` verildi, çalışma anı önyüklemesi bunları okumuyor. Geçici sertifika kopyası silindi. |
| CI `ci` (birim ve entegrasyon)  | Denetlenen commit `4655c93` için yeşil (koşu 1499); main'in ucu `193decc` de yeşil (1501)                                                                                                                                                                                     |

### Yeni bulgular

| #     | Önc.         | Sınıf | Bulgu                                                                                                                                                                                       | Yer                                                            |
| ----- | ------------ | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| M1-20 | P2           | D     | Bağlantı dönünce başarısız mesaj kendiliğinden gönderilmez; kullanıcı her birine "Tekrar dene" basar. Çevrimdışılık yalnız bir istek başarısız olunca anlaşılır (takılan bağlantıda 20 sn). | `ConnectionBanner.tsx`, `pure/chatOutbox.ts`                   |
| M1-21 | P1 (ölçekte) | D     | Mekan sohbetinde tepki ve silme yayını, en yeni sayfaya ek olarak okuyanın yüklediği her eski sayfayı da yeniden okutur (her biri ayrı Edge çağrısı). M1-05'i büyütür.                      | `venue-chat/index.tsx:136–145` → `older.reread`                |
| M1-22 | P3           | D     | Masa ve mekan sohbetinde "okundu" işareti yalnız uygulama çalışırken bellekte tutulur; uygulama yeniden açılınca okunmamış sayısı sıfırdan başlar.                                          | `roomChatSeen.ts`, `venueChat/queries.ts` → `useVenueChatSeen` |
| M1-23 | —            | K     | Mekan, semt ve masa sohbetinde yanıt ya da yeni mesaj için bildirim yok (push yalnız DM, arkadaşlık ve davet).                                                                              | `pure/push.ts` → `PUSH_PREFERENCE`                             |

### Kıyas: kaynaktan okunanlar

| Konu        | Telegram Android                                                                                                                                                                                         | Mattermost Mobile                                                                                                | skall için                                                                       |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Giden mesaj | Yerel mesaj tablosunda `send_state` (gönderiliyor, hata, gönderildi); `randoms_v2` istemci kimliğini mesaja bağlar; uygulama açılışında `checkUnsentMessages` gönderilmemişleri okur ve yeniden gönderir | Gönderi yerel veritabanına `pending_post_id` ile yazılır; aynı kimlik sunucuya gider, başarısız olan işaretlenir | M1-01 ve M1-02 birlikte: kimlikli gönderim ve telefonda saklanan giden kutusu    |
| Taslak      | Hesap başına `drafts` tercih dosyası, sohbet başına kayıt (`saveDraft`)                                                                                                                                  | Veritabanında `draft` modeli                                                                                     | Sohbet başına telefonda taslak                                                   |
| Tepki       | Sunucu `updateMessageReactions` ile mesaj kimliğini ve yeni tepkileri gönderir; istemci yalnız o mesajı günceller                                                                                        | — (okunmadı)                                                                                                     | Yalnız değişen mesajların sayılarını okumak; yük taşıyan yayın kural 9'a dokunur |
| Liste       | —                                                                                                                                                                                                        | Ters çevrilmiş `FlatList`, `maintainVisibleContentPosition`, `windowSize` 10                                     | skall'ın listesi aynı yapıda; kütüphane değişikliği gerekmez                     |

### Önerilen mimari (özet; ayrıntı sohbet raporunda)

1. Kimlikli gönderim dört sohbette aynı: istemci mesajı yazarken UUID üretir; `dm_messages` ve `messages`'a `client_id` ve `(gönderen, client_id)` tekil indeksi; aynı kimlik aynı içerikle yanıtı yineler, farklı içerikle `client_id_reused` (mekan sohbetindeki `venue_chat_send_once` kalıbı).
2. Kalıcı giden kutusu ve taslak: hesap ve sohbet başına AsyncStorage kaydı (`dmCache.ts` kalıbı); bağlantı dönünce sırayla, aynı kimlikle kendiliğinden yeniden gönderim; çıkışta ve hesap değişince silinir.
3. Ortak "mesaj deposu": dört sohbet aynı üç işlemi kullanır: imleçten sonrasını ekle (mesaj), kimliğe göre satırı yamala (tepki), kimliğe göre çıkar (silme). Tepki için sunucuda mesaj satırında "tepkisi en son ne zaman değişti" bilgisi ve yalnız sayıları dönen salt-okur RPC.
4. Satırlar veriyi kimlikle alır; ekran düzeyindeki bekleyen tepki durumu satıra yalnız kendi değeriyle iner (M1-06, M1-07).

## M2: Realtime ve veri eşitleme (9 Kasım)

### Okunanlar

Tam: `lib/realtime.ts`, `pure/realtimeChannels.ts`, `rooms/useBroadcast.ts`, `lib/queryClient.ts`, `lib/connection.ts`, `components/ConnectionBanner.tsx`, `features/auth/session.ts`, `features/rooms/queries.ts`, `lib/friendRefresh.ts`, `lib/useNow.ts`, `features/explore/useExploreVenues.ts` (yoklama), `Loader.tsx` → `useLoopActive`, `_shared/broadcast.ts`, `venueChatBroadcast.ts`, `lobby.ts`, `inbox.ts`, `background.ts`, `private.realtime_topic_allowed`. Yüzeysel: `lib/tabActivity.ts`, oyunların kendi yoklamaları (M6'da), `app/(app)/_layout.tsx` (yalnız kancalar).

### Canlı deneyler (yerel yığın, üç test hesabı)

| Deney                                                                         | Sonuç                                                                         |
| ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Konuşmanın üyesi olmayan hesap `dm:{thread}` kanalına katılır                 | Reddedildi (`Unauthorized`)                                                   |
| Üye abone olduktan sonra arkadaşlık ve konuşma silinir, sunucu yayın gönderir | Açık abonelik 1,5 sn, 20 sn ve 66 sn sonra gönderilen yayınların hepsini aldı |
| Üye, sunucuya ayrılmış `dm:` kanalına kendi yayın gönderir                    | Karşı taraf almadı                                                            |
| Üye `dm_typing:` kanalına yayın gönderir                                      | Karşı taraf aldı (beklenen)                                                   |

Yerel Realtime sürümünün davranışıdır; barındırılan projede ayrıca denenmedi.

### Kullanıcı başına açık kanal (koddan sayım)

`inbox`, `session`, `venue`, `venue_chat`, masadayken `room` ve `messages`, Signum'da `game_team`, açık DM'de `dm` ve `dm_typing`, Semte Git'te `district_chat`; Mesajlar sekmesi bir kez açıldıysa ek olarak 30 satıra kadar `dm_typing`. Sekmeler bağlı kaldığı için bu 30 kanal oturum boyunca açık kalır.

### Bulgular

| #     | Önc.         | Sınıf                    | Bulgu                                                                                                                                                                                                                                                                                                           | Yer                                                    | Öneri                                                                                 |
| ----- | ------------ | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| M2-01 | P3           | D (canlı deney)          | Yayın yetkisi kanala katılırken denetlenir; erişimi kalkan açık abonelik yayın almayı sürdürür. Yayınlar veri taşımadığı için içerik sızmaz, yalnız "bir şey oldu" zamanlaması sızar. CLAUDE.md kural 9'daki "erişimi hemen kapanır" yayınlar için doğru değil (Postgres Changes için doğru: satır başına RLS). | `realtime_topic_allowed`                               | Belgeyi düzeltmek; hassas yerde Signum'daki kimlik yenileme                           |
| M2-02 | P1 (ölçekte) | D (sayım), kota kaynaklı | Kullanıcı başına yaklaşık 8 kanal ve 30'a kadar "yazıyor" kanalı. Toplu yeniden bağlanmada (mekanın ağı kesilip gelince) her telefon hepsine yeniden katılır; her katılma veritabanında bir yetki sorgusudur. Supabase kotası saniyede 100 (Free) ya da 500 (Pro) katılma.                                      | `messages/index.tsx` → `TYPING_ROWS`, `useDmTyping.ts` | "Yazıyor"u yalnız açık DM'de ve gelen kutusunun görünen ilk birkaç satırında dinlemek |
| M2-03 | P2           | D (yapı), Ö (sayı)       | Her yeniden abone oluşta kanalın bütün dinleyicileri bir kez çalışır; gelen kutusu kanalında dört dinleyici yaklaşık on sorgu başlatır; aynı anda ön plana dönüş de bayat sorguları okur.                                                                                                                       | `useBroadcast.ts`, `friends/queries.ts:505`            | Konu başına tek "yeniden bağlandı" işleyicisi; ön plana dönüşle birleştirmek          |
| M2-04 | P2 (ölçekte) | D                        | Lobi yayını geldiği anda mekandaki her telefon `venue_tables`'ı okur; mekan sohbeti kartındaki rastgele gecikme burada yok; ekran gizliyken de okunur.                                                                                                                                                          | `rooms/queries.ts:253`                                 | Kısa rastgele gecikme; odakta değilken ertelemek                                      |
| M2-05 | P3           | D                        | `game_events` Realtime yayınında ve `game:`, `presence:` konu türleri politikada duruyor; istemci hiçbirini kullanmıyor.                                                                                                                                                                                        | Yayın listesi, politika                                | Kaldırmak (M11'de)                                                                    |
| M2-06 | P3           | D                        | Sunucu yayınları yanıttan sonra tek kez denenir; başarısız olan yutulur. Masa dışında yoklama olmadığı için ekran bir sonraki olaya ya da ön plana dönüşe kadar bayat kalır.                                                                                                                                    | `_shared/background.ts`, `broadcast.ts`                | Bir kez yeniden deneme; uzun vadede veritabanından yayın                              |
| M2-07 | P2 (ölçekte) | İ                        | `rooms` ve `messages` Postgres Changes ile gider; Supabase ölçekte sunucudan Broadcast önerir. Masa 12 kişiyle sınırlı olduğu için bugün sorun değil.                                                                                                                                                           | `rooms/queries.ts:119`, `useMessages.ts`               | Yük görülünce yayına geçmek                                                           |
| M2-08 | P3           | D                        | Bağlantı bandı yalnız başarısız bir istekten sonra çıkar; Realtime soketi koparsa ve kullanıcı bir şeye basmazsa kopukluğu görmez.                                                                                                                                                                              | `connection.ts`                                        | Kanal durumunu banda bağlamak                                                         |

### İyi yapılmış, korunacak

- Konu başına tek kanal ve sayaçlı paylaşım; kapanmakta olan kanal bitmeden yenisi açılmaz.
- Yeniden abone olunca okuma: Realtime kaçan olayı yeniden oynatmadığı için doğru telafi.
- Varsayılan 20 sn tazelik; masa yoklaması kanal bağlıyken seyrek, ekran gizliyken kapalı.
- Yetki: yabancı katılamıyor, istemci sunucu yayınını taklit edemiyor (deneyle doğrulandı).

### Kıyas

| Konu          | Kaynak                                                                                                                                                                                                                           | skall                                                              |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Kaçan olaylar | Discord: oturum kimliği ve sıra numarasıyla Resume, olaylar yeniden oynatılır ([docs.discord.com](https://docs.discord.com/developers/events/gateway-events))                                                                    | Yeniden oynatma yok; yeniden okuma. Bu ölçekte doğru ve daha basit |
| Kotalar       | Supabase Realtime: Free 200 eşzamanlı bağlantı, saniyede 100 katılma, bağlantı başına 100 kanal; Pro 500 ve 500 ([supabase.com/docs/guides/realtime/quotas](https://supabase.com/docs/guides/realtime/quotas))                   | M2-02                                                              |
| Yetki zamanı  | Supabase: politikalar istemci konuya bağlanırken kullanılır ([supabase.com/docs/guides/realtime/authorization](https://supabase.com/docs/guides/realtime/authorization)); sonradan iptal belgede yazmıyor, yerel deneyle görüldü | M2-01                                                              |

### Ölçülemeyenler

- Ön plana dönüşte ve yeniden bağlanmada atılan istek sayısı (telefonda ağ kaydı ya da yerel yığında sayaç).
- Barındırılan projede katılma ve mesaj kotasına yakınlık (panel: Realtime raporları).

### Ürün kararı

- M2-01: kural 9'un metni düzeltilsin mi, yoksa masadan çıkarılan kişinin kanalı kimlik yenilemeyle gerçekten kapatılsın mı (Signum'daki yöntem; her çıkışta masadakiler yeniden abone olur).
