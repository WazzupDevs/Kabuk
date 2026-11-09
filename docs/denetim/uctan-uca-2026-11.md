# Uçtan uca denetim (Kasım 2026): takip belgesi

Başlangıç: 9 Kasım 2026, main `4655c93`. Bu belge yalnızca denetimin durumunu tutar; kod, migration ve yapılandırma değişmez. Önceki denetimlerin bulguları tekrar edilmez: `docs/PROGRESS.md` → "Canlı öncesi denetim" (A–F), `docs/denetim/performans-2026-11.md` (B1–B37), `docs/denetim/kapali-beta-2026-11-08.md`.

Kanıt sınıfları: **D** doğrulandı (koddan, testten ya da çalışan yerel veritabanından), **Ş** güçlü şüphe, **Ö** ölçüm gerekli, **İ** iyileştirme fırsatı, **K** ürün kararı gerekli.

## Modüller

| #   | Modül                                                           | Durum                    |
| --- | --------------------------------------------------------------- | ------------------------ |
| M1  | Sohbet çekirdeği (DM, masa, mekan, semt)                        | Sürüyor (eksikler altta) |
| M2  | Realtime ve veri eşitleme                                       | Başlamadı                |
| M3  | Kapsül ve grafik, hediye paketleri                              | Başlamadı (ön bulgular)  |
| M4  | Kimlik, oturum, kayıt, onboarding, hesap silme                  | Başlamadı                |
| M5  | Check-in, konum, mekan, masa ve lobi                            | Başlamadı                |
| M6  | Oyun çerçevesi ve repodaki bütün oyunlar                        | Başlamadı                |
| M7  | Arkadaşlık, engel, sessize alma, şikayet, anonimlik             | Başlamadı                |
| M8  | Keşfet, harita, Semte Git                                       | Başlamadı                |
| M9  | Profil, fotoğraf, bildirimler, push, ayarlar                    | Başlamadı                |
| M10 | Açılış, navigasyon, ekran iskeleti, tema, erişilebilirlik       | Başlamadı                |
| M11 | Veritabanı bütünü                                               | Başlamadı                |
| M12 | Güvenlik bütünü                                                 | Başlamadı (ön doğrulama) |
| M13 | Build, yayın, OTA, CI, test, gözlemlenebilirlik, native         | Başlamadı                |
| M14 | Birleştirme, gelecekteki ödeme ve paket altyapısı, yol haritası | Başlamadı                |

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
