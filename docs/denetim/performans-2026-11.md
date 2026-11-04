# Performans ve modernlik denetimi (Kasım 2026)

Tarih: 4 Kasım 2026. Yöntem: altı alan (sekme geçişi ve gezinme, çizim maliyeti, React yeniden çizimleri, listeler ve sohbet, açılış ve paket, ağ ve sunucu) ayrı denetçilerce yalnızca kod okunarak tarandı; her alanın bulguları ayrı bir doğrulayıcı tarafından kodda yeniden arandı, etkisi tartıldı ve değişmez kurallar ile tuval kararlarıyla karşılaştırıldı. Aynı konudaki bulgular birleştirildi (kaynak kimlikleri her bulgunun doğrulama notunda). Ölçüm yapılmadı: her bulgu bir tahmindir, "yavaş olabilir" diye okunmalı ve telefonda doğrulanmalıdır. Teknik referans Telegram Android'dir.

## Özet

- Sekme geçişinde hissedilen ağırlığın en olası kaynağı geliş sırasındaki iç içe bulanıklık: Dissolve, sekme çubuğu camı ve sahnedeki her buzlu düğme 450 ms boyunca her karede yeniden bulanıklaşıyor olabilir (B1).
- Camlar yerleri değişmediği hâlde pencere konumu değişti diye her karede yeniden çiziliyor olabilir; düzeltme küçük ve görünüşü değiştirmez, ama yeni build ister (B1).
- Sekme her açıldığında odak bir React state'i olarak değişiyor; Keşfet'in bütün satırları JS'te yeniden çiziliyor ve onlarca animasyon Dissolve ile aynı karede başlıyor olabilir (B2).
- Her dönüşte üç katmanlı geliş (TabScene, Dissolve, Reveal kademesi) yaklaşık bir saniyeye yakın "hareket hâli" yaratıyor olabilir; kısaltmak tuvalden sapmadır ve proje sahibinin kararıdır (K1).
- Canlı tutulan gizli sekmeler 30 ve 60 sn'lik saatlerle, yoklamayla ve 4 sn'lik masa kontrolüyle çizilmeye devam ediyor (B6).
- `friendKeys.all` geçersiz kılması her arkadaşlık olayında 8–10 sorguyu ve açık DM'in bütün sayfalarını yeniden okutuyor; kodun kendi "yalnızca değişen sayfa" ilkesiyle çelişiyor (B3).
- Varsayılan `staleTime` 0 ve topyekün yenilemeler (çekip yenileme, bağlantı dönüşü, "Ayrıl") canlı beş sekmenin sorgularını birlikte okutuyor (B10, B11).
- Çizim ölçümü buzlu düğmeleri ve Dissolve'u kapatamıyor; geçişin en büyük olası maliyeti bugün telefonda ayrıştırılamıyor, ilk iş bu olmalı (B4).
- Sohbetlerde satır memo'su eksikliği, context aboneliği ve geri dönüşümsüz liste mesaj ve tepki başına gereğinden çok hücre çiziyor olabilir (B16–B19).
- Yeni mimari, Hermes, R8 ve kütüphane sürümleri güncel; eski köprüyle çalışan kütüphane görünmüyor. Sorun mimaride değil, geçiş anında yapılan işte.

## Önce bunlar

Paket: sekme geçişi. Bu paket `docs/PROGRESS.md`'deki sıradaki paketlerin (bildirim simgeleri, eski mesajları yükleme, masa sohbetinde Bildir/Sil) önüne geçer. OTA maddeleri tek PR'da gidebilir; yerel maddeler (B1, B12, B8) tek build'de toplanır.

1. B4 — Çizim ölçümüne "buzlu" ve "gecis" adımları. S, OTA. Diğer bütün maddelerin telefonda ölçülmesi için ön koşul.
2. B2 — Odak state'ini React'tan çıkarmak, blur'daki boş `setFocus`'u kaldırmak, ekran dışı Keşfet satırlarına replay vermemek. M, OTA. Görünüş değişmez.
3. B6 — Gizli sekmelerde `useNow`, `refetchInterval` ve `RoomWatch` yoklamasını odağa bağlamak. S, OTA.
4. B5 — Geliş başlangıç değerlerini blur anında hazırlamak (JS adımı). S, OTA.
5. B3 — `friendKeys.all` yerine olay başına dar anahtarlar, DM'i hariç tutmak. M, OTA.
6. B1 + B12 — Camların göreli konumla karşılaştırılması, Dissolve'da `RenderEffect` önbelleği, `GlassTargetView` nesne ayırmalarının kaldırılması. M + S, yeni build (tek build).
7. B7 — Açılış perdesi ve Keşfet kademesinden sonra boşta sekme ön kurulumu ve veri ön çekimi. S, OTA.
8. K1 — Geliş kademesinin dönüşlerde kısaltılması: proje sahibinin kararı; ölçüm (madde 1) sonrası sorulur.

## Telefonda doğrulama yöntemi

- **Çizim ölçümü:** Ayarlar → Tasarım (test) → Çizim ölçümü. Bugün `cam`, `golge`, `kart`, `zemin`, `hareket` adımları var; B4 yapılınca `buzlu` ve `gecis` eklenir. Her adımda sekmeler arasında art arda geçilir.
- **GPU işleme çubukları:** Geliştirici seçenekleri → GPU oluşturma profili → Ekranda çubuk olarak. 16 ms çizgisini aşan çubuklar sayılır; aynı geçiş düzeltmeden önce ve sonra karşılaştırılır.
- **Release build:** Ölçümler dev build'de değil release build'de yapılır (dev build JS'i birkaç kat ağır çalıştırır).
- **Alt seviye Android:** Android 12+ (Dissolve ve canlı cam yalnızca orada çalışır), 3–4 GB RAM, Helio/Unisoc sınıfı bir cihaz. Etkiler en çok orada görünür.
- **Perfetto:** `gfx`, `view`, `hwui` ve JS iş parçacığı izleriyle bir geçişin 450 ms'si incelenir: RenderThread `DrawFrame`, katman sayısı, UI iş parçacığında `Record View#draw()`, JS'te commit dilimleri.
- **Yardımcılar:** "Animasyonları kaldır" ve "Animatör süre ölçeği 5x/10x" (geliş katmanlarını ağır çekimde görmek), "GPU fazla çizimini hata ayıkla", React DevTools Profiler (Highlight updates), `adb shell dumpsys gfxinfo app.kabuk.mobile`, `adb shell dumpsys meminfo app.kabuk.mobile`, Supabase panelinde Edge Functions → Invocations.

## Bulgular

### B1 — Geliş sırasında iç içe bulanıklık: camlar ve Dissolve her karede yeniden işleniyor

- **Nerede:** `apps/mobile/modules/skall-glass/android/src/main/java/expo/modules/skallglass/LiquidGlassView.kt:82-91` (pencere konumu karşılaştırması), `:180-194` (drawFrost, here–there); `DissolveView.kt:58-82` (her karede invalidate), `:111-137` (her karede yeniden kayıt ve yeni `RenderEffect`, 123-125); `GlassTargetView.kt:47-52` (onDescendantInvalidated); `apps/mobile/src/components/TabBar.tsx:192-218`; `apps/mobile/src/aura/AuraBackground.tsx:75-89`; `apps/mobile/src/aura/kit.tsx:154-185`.
- **Neden yavaş olabilir:** Sekme açılırken TabScene bütün sahneyi 12 dp kaydırıyor ve Dissolve bütün sahneyi bulanıktan netleştiriyor. Frost'un örneklediği backdrop camla aynı Animated.View içinde kaydığı için camın göstereceği resim değişmiyor; ama cam pencere konumuna baktığı için ekrandaki her buzlu düğme, çip ve IconButton 450 ms boyunca her karede yeniden kaydolup kendi `RenderEffect`'ini baştan işliyor olabilir. Aynı anda Dissolve'un her karedeki geçersizlemesi bütün ekranı kaplayan bir alan olarak sekme çubuğu camına ulaşıyor; bar camı zaten bulanıklaşan sahneyi bir kez daha bulanıklaştırıyor. Dissolve ayrıca her karede yeni bir `RenderEffect` nesnesi oluşturuyor. Alt seviye GPU'da kare süresi 16 ms'yi aşabilir.
- **Modern uygulamalar nasıl yapıyor:** Telegram Android geçişlerde canlı bulanıklığı karede bir yeniden hesaplamaz; görünüm donanım katmanında taşınır, bulanık resim içerik ya da camın içeriğe göre yeri değişince yenilenir. Instagram ve WhatsApp sekme geçişinde canlı blur kullanmaz.
- **Önerilen düzeltme:** (1) `drawnAt` yerine (here − there) farkı saklanır; OnPreDraw'da fark değişmediyse invalidate edilmez; hedef bulunamadıysa ya da değiştiyse eski davranış. (2) Dissolve çalışırken içindeki LiquidGlassView'ler yeniden kaydı atlayıp son resmi gösterir (ata zincirinde koşan Dissolve bayrağı); Dissolve bitince (onAnimationEnd) camlar bir kez yeniden çizilir. (3) DissolveView `RenderEffect`'i yarıçap yuvarlanarak (ör. 0,5 px adım) önbellekte tutar; yeniden kayıt yalnızca içerik geçersizlenince yapılır. Üçü de görünüşü değiştirmez. Bar camının geliş boyunca seyreltilmesi ayrı karardır (K3).
- **İş büyüklüğü:** M
- **Yayın:** yeni build
- **Telefonda doğrulama:** Release build, alt seviye Android 12+. GPU işleme çubukları açıkken Mekan ve Profil gibi buzlu düğmesi çok sekmelere art arda geçilir; düzeltmeden önce ve sonra çubuk yükseklikleri karşılaştırılır. Perfetto'da geçişin 450 ms'sinde RenderThread `DrawFrame` süreleri ve kare başına `skallGlass` katman sayısı. Çizim ölçümünde `cam`, `buzlu`, `gecis` (B4) adımları.
- **Etki:** yüksek (sekme geçişi)
- **Doğrulama notu:** Kaynak A2-1, A1-3, A2-3 (doğrulandı, yüksek) ve A1-4 (abartılı, düşük). Doğrulayıcı: kayıt atlanırsa `RenderEffect`'li düğüm HWUI katmanı olarak önbellekte kalır, kazanç gerçek. A1-4 için: yeniden kayıt çocukların display list'lerini referansla çizer, rasterleştirme değildir; kazanç esasen UI iş parçacığı ve nesne ayırma.

### B2 — Sekme açılışında odak React state'i; Keşfet'in bütün satırları yeniden çiziliyor

- **Nerede:** `apps/mobile/src/components/TabBar.tsx:150` (useState), `:163-168` (sheet ya da üst ekran kapanınca da yeni nesne), `:182-186` (blur'da setFocus); `apps/mobile/src/components/Screen.tsx:89, 140, 148, 159, 229-240`; `apps/mobile/app/(app)/(tabs)/explore/index.tsx:75, 152-171, 238, 409-443`; `apps/mobile/src/aura/Reveal.tsx:30-46`; `apps/mobile/src/theme/aura.ts:276-277`.
- **Neden yavaş olabilir:** `{focused, opened}` her focus ve blur'da yeni nesne oluyor ve TabFocusContext ile iniyor. `focused` alanını okuyan yer yok; blur'daki ve sheet dönüşündeki setState boşa bir çizim yaptırıyor. `opened` artınca Screen'in kademesi ve Keşfet'te `replay={focus.opened * REPLAY_BASE + kindRuns}` bütün satırları JS'te yeniden çiziyor ve ~43 `Animated.timing` başlatıyor; `Math.min(index, MOTION.stagger.max)` yüzünden 8'in ötesindeki ekran dışı satırların hepsi aynı anda oynuyor. Liste sanallaştırılmamış (ScrollView içinde map). Bu iş Dissolve'un başladığı karede yapılıyor.
- **Modern uygulamalar nasıl yapıyor:** Telegram Android'de sekme girişi yalnızca görünüm özellikleriyle UI tarafında oynar; hücreler yeniden bağlanmaz. Instagram ve WhatsApp sekme dönüşünde önceden kurulmuş ağacı yalnızca gösterir.
- **Önerilen düzeltme:** (1) Blur'daki ve sheet dönüşündeki setFocus kaldırılır (gerekirse ref). (2) `opened` kimliği sabit, abone olunabilir bir değere taşınır (Animated.Value ya da küçük store); Reveal tekrar oynatmayı dinleyiciden başlatır, Screen ve VenueList yeniden çizilmez. (3) `index >= ROWS_AT + MOTION.stagger.max` olan satırlara replay verilmez (görünmüyorlar, görünüş aynı). (4) VenueList satırları memo'lu bileşene ayrılır, onPress id ile verilir. Hareket aynı kalır.
- **İş büyüklüğü:** M
- **Yayın:** OTA
- **Telefonda doğrulama:** React DevTools Profiler, Highlight updates açık: Keşfet ↔ Mesajlar geçişinde yanan ağaç ve commit süresi. Release build, alt seviye Android'de GPU çubuklarıyla geçişin ilk 300–500 ms'si; "Hareketi azalt" açıkken aynı geçişle karşılaştırma.
- **Etki:** yüksek (sekme geçişi)
- **Doğrulama notu:** Kaynak A3-1 (doğrulandı, yüksek), A1-10 (doğrulandı, düşük), A4-4 (doğrulandı, orta; görünüşü değiştirmeyen kısmı) ve doğrulayıcının eklediği sheet kapanışı. Doğrulayıcı: React Compiler blur'da kademe ve listeyi önbellekten verir, asıl maliyet açılışta.

### B3 — `friendKeys.all` geniş geçersiz kılma: her arkadaşlık olayında 8–10 sorgu ve açık DM'in bütün sayfaları

- **Nerede:** `apps/mobile/src/features/friends/queries.ts:24-35` (dm anahtarı `['friends','dm',id]`), `:355-371` (useDmMessages, staleTime Infinity), `:474-496` (inbox yayınları); `apps/mobile/src/features/rooms/TableEnd.tsx:226-238`; `RequestList.tsx:60`; `historyActions.tsx:34`; `app/(app)/notifications.tsx:148`; `app/(app)/people/[publicId].tsx:52`; `app/(app)/venue-chat/index.tsx:182`.
- **Neden yavaş olabilir:** `['friends']` list, incoming, incomingChat, sent, history (100 satır), history/friends, history/room, inbox, notifications ve dm/<thread>'in önekidir. "Arkadaş ekle"/"Geri al"a her basış ve her `friendRequest`/`friendshipChanged` yayını hepsini geçersiz kılıyor; en az dört Edge Function fotoğraf imzalıyor. `invalidateQueries` staleTime'ı yok sayar: açık DM'in yüklü bütün sayfaları sırayla yeniden okunur; bu `refreshDm`'in "yalnızca değişen sayfa" ilkesine aykırı. Gelen yanıtlar gizli sekmeleri (Aktiviteler, Mesajlar, Profil) yeniden çizdirir.
- **Modern uygulamalar nasıl yapıyor:** Telegram bir güncellemeyi yalnızca etkilediği nesneye uygular; kişi değişikliği mesaj geçmişine dokunmaz. Instagram ve WhatsApp istek kabulünde yalnızca ilgili satırı günceller.
- **Önerilen düzeltme:** Olay başına dar anahtarlar: ekle/geri al → history ve history/room; istek kabulü → incoming, list, inbox; friendshipChanged → list, inbox, history/friends; friendRequest → incoming, incomingChat, notifications. DM anahtarı `friendKeys.all` dışına alınır ya da `predicate: (q) => q.queryKey[1] !== 'dm'`. Kural 5'in sessizliği değişmez; yalnızca istemcinin neyi yeniden okuduğu değişir.
- **İş büyüklüğü:** M
- **Yayın:** OTA
- **Telefonda doğrulama:** Masa bitti'de "Arkadaş ekle"ye basılır; Supabase Invocations ve API loglarında basış başına istek sayısı (tahmin 8–10, hedef 1–2). DM açıkken ikinci telefondan istek gönderilir, `dm_messages_page` çağrıları sayılır. React DevTools Profiler'da gizli sekmelerin commit'leri.
- **Etki:** yüksek
- **Doğrulama notu:** Kaynak A6-2 (doğrulandı, yüksek) ve A3-6 (doğrulandı, düşük). Doğrulayıcı: kodun kendi ilkesiyle çelişen gerçek bir hata.

### B4 — Çizim ölçümü buzlu düğmeleri ve Dissolve'u kapatamıyor

- **Nerede:** `apps/mobile/src/lib/drawLab.ts:11-27` (DrawPart); `apps/mobile/src/aura/kit.tsx:124-128` (useFrost); `apps/mobile/src/components/LiquidGlass.tsx:80`; `apps/mobile/src/aura/AuraTabBar.tsx:111, 115`; `apps/mobile/src/components/TabBar.tsx:203`.
- **Neden eski:** `cam` adımı yalnızca sekme çubuğunun camını kapatıyor; Frost `FROSTED` sabitine, Dissolve ölçüme bağlı değil. Geçişin en olası maliyetleri (B1, B9) telefonda birbirinden ayrılamıyor.
- **Modern uygulamalar nasıl yapıyor:** Telegram'ın hata ayıklama menüsünde bulanıklık, animasyonlar ve performans sınıfı ayrı ayrı açılıp kapatılabilir.
- **Önerilen düzeltme:** DrawPart'a `buzlu` ve `gecis` eklenir; Frost/useFrost `useLabOff('buzlu')` okur (hook olduğu için React Compiler kuralına uyar), TabScene Dissolve'un `run`'ını `useLabOff('gecis')` ile sıfırlar. Üretimde etkisi yok (`DRAW_LAB` false). Ölçüm akışına sekme geçişi eklenmesi düşünülür.
- **İş büyüklüğü:** S
- **Yayın:** OTA
- **Telefonda doğrulama:** Yeni adımlarla Çizim ölçümü koşulurken GPU çubukları kaydedilir; `buzlu` ve `gecis` adımlarındaki kare süreleri `all` ile karşılaştırılır.
- **Etki:** orta (sekme geçişi; ölçüm ön koşulu)
- **Doğrulama notu:** Kaynak A2-9 (doğrulandı, orta). Doğrulayıcı: "önce bunlar"ın ilk maddesi olmalı.

### B5 — Geliş, ekran bağlandıktan bir iki commit sonra başlıyor

- **Nerede:** `apps/mobile/src/components/TabBar.tsx:155, 163-185, 202-208`; `apps/mobile/src/aura/Reveal.tsx:31-46`; `DissolveView.kt:38-44`.
- **Neden yavaş olabilir:** `p` bir önceki gelişten 1 kalıyor ve ancak focus dinleyicisinde 0'a çekiliyor; Reveal'ler effect'te, Dissolve `post{}` ile bir kare daha geç başlıyor. Arada bir iki kare ekran net görünüp sonra saydamlaşabilir; titreme ya da sıçrama olarak hissedilebilir. JS meşgulse aralık uzar.
- **Modern uygulamalar nasıl yapıyor:** Telegram Android'de geçişin başlangıç değerleri görünüm gösterilmeden hazırlanır, animasyon ilk çizilen karede başlar.
- **Önerilen düzeltme:** Önce JS adımı: blur'da `leftTab` true ise `p.setValue(0)` ve Reveal'ler için ayrı bir "leaving" sinyali; focus'ta yalnızca `start()`. Yerel `onAttachedToWindow` tetiklemesi ancak ölçüm ilk karede sıçrama gösterirse (yeni build). Görünüş değişmez.
- **İş büyüklüğü:** S (JS adımı); yerel adım M
- **Yayın:** OTA (yerel adım yeni build)
- **Telefonda doğrulama:** Animatör süre ölçeği 10x ve 60 fps ekran kaydıyla sekme dönüşünün ilk kareleri: net bir kare ve ardından saydamlaşma var mı. Perfetto'da JS `focus` ile UI'daki ilk `DrawFrame` arası.
- **Etki:** orta (sekme geçişi)
- **Doğrulama notu:** Kaynak A1-2; denetçi yüksek dedi, doğrulayıcı orta'ya indirdi (ölçülmeden yüksek denemez; native driver setValue hızlı gider).

### B6 — Gizli sekmeler saatle, yoklamayla ve masa kontrolüyle çizilmeye devam ediyor

- **Nerede:** `apps/mobile/app/(app)/(tabs)/explore/index.tsx:73`; `apps/mobile/src/features/explore/useExploreVenues.ts:66-71`; `apps/mobile/app/(app)/(tabs)/venue.tsx:52, 159, 213-215`; `apps/mobile/src/features/rooms/queries.ts:135-138`; `apps/mobile/src/features/venueChat/VenueChatCard.tsx:35`; `apps/mobile/src/features/explore/EventTag.tsx:11`; `ExploreMap.tsx:110, 488`; `activities.tsx:50`; `messages/index.tsx:43`; `profile/index.tsx:285`; `apps/mobile/src/lib/useNow.ts:7`; `_layout.tsx:40-45`.
- **Neden yavaş olabilir:** Sekmeler bilinçli olarak canlı (#279). Ama `useNow` `active` verilmeden çağrılıyor: Keşfet ve Mekan 30 sn'de, Aktiviteler, Mesajlar ve Profil 60 sn'de, her EventTag kendi zamanlayıcısıyla yeniden çiziliyor. `explore_venues` gizliyken de dakikada bir yokluyor (TanStack yalnızca uygulama arka plandayken durur). RoomWatch Mekan gizliyken de 4 sn'de bir kontrol ediyor. Bir sekme basışına denk gelirse JS meşgul olur; çakışma tesadüfidir.
- **Modern uygulamalar nasıl yapıyor:** Telegram Android gizli fragment'larda olayı alır, görünümü "kirli" işaretleyip görünür olunca bir kez yeniler. Instagram gizli sekmede yenilemez.
- **Önerilen düzeltme:** Ekran düzeyinde `useNow(ms, focused)`; EventTag'e `now` prop olarak. `refetchInterval: focused ? 60_000 : false` ve odaklanınca bayatsa bir okuma (Aktiviteler'deki şehir listesi aynı sorguyu kullanıyor, iki odak birleştirilir). RoomWatch'ın 4 sn'lik kontrolü yalnızca odakta; gizliyken Realtime kalır, dönüşte hemen bir kontrol. `subscribed: isFocused` yalnızca ağır listelerde ve ölçümden sonra; rozet ve masa sorguları dışında.
- **İş büyüklüğü:** S
- **Yayın:** OTA
- **Telefonda doğrulama:** React DevTools Profiler'da Profil açıkken 2 dk kayıt: ExploreScreen ve VenueScreen commit'leri görünmemeli. Mesajlar'da 3 dk: Supabase API logunda `explore_venues` çağrısı (tahmin 3, hedef 0). Perfetto'da JS'te 30/60 sn aralıklı tepeler.
- **Etki:** orta (sekme geçişi)
- **Doğrulama notu:** Kaynak A1-5 (doğrulandı, orta), A3-2 (abartılı, yüksekten orta'ya), A6-10 (doğrulandı, düşük). Doğrulayıcı: gizli sekmeler native'de çizilmez, maliyet yalnızca JS; `subscribed` dönüşte bir commit'i geçiş anına taşır, dikkat.

### B7 — Sekmeler ve verileri ilk basışta kuruluyor

- **Nerede:** `apps/mobile/app/(app)/(tabs)/_layout.tsx:18, 23-55`; `apps/mobile/src/lib/queryClient.ts:23-26`; `activities.tsx:175-178`; `profile/index.tsx:29-34`; `apps/mobile/src/features/profile/queries.ts:14-26`.
- **Neden yavaş olabilir:** `lazy`/preload yok; Aktiviteler, Mekan, Mesajlar ve Profil'e ilk basışta bütün ağaç kuruluyor ve sorgular (play_history, friends/list, profile/get) geçiş hareketiyle aynı anda istek atıyor. staleTime 0 yüzünden önceden çekilmiş inbox da kurulumda bir kez daha çağrılıyor. Maliyet her sekmenin yalnızca ilk açılışında ödenir.
- **Modern uygulamalar nasıl yapıyor:** Telegram ana sayfaları açılışta kurar; Instagram ve WhatsApp ana sekmeleri boşta önceden kurar ve verisini önceden çeker.
- **Önerilen düzeltme:** Açılış perdesi ve Keşfet kademesi bittikten sonra boşta sırayla `navigation.preload` (ya da `lazy: false`) ve `queryClient.prefetchQuery` (Aktiviteler, Profil). staleTime genel değil, Realtime'la tazelenen sorgulara (inbox, friends) 15–30 sn.
- **İş büyüklüğü:** S
- **Yayın:** OTA
- **Telefonda doğrulama:** Soğuk açılıştan sonra her sekmeye ilk ve ikinci basış React DevTools Profiler'da ve Perfetto'da karşılaştırılır; ekran kaydında basıştan içeriğe kadar kare sayısı.
- **Etki:** orta (sekme geçişi)
- **Doğrulama notu:** Kaynak A1-7 (doğrulandı, orta) ve A6-7 (abartılı, düşük). Düzeltilen: Profil için "art arda iki istek" yanlış; useProfile kökte yüklü, Profil yalnızca profile/get ve friends/list ister.

### B8 — Dönülen sekmede camlar ve hedefler GPU katmanlarını yeniden kuruyor

- **Nerede:** `apps/mobile/app/(app)/(tabs)/_layout.tsx:40-45`; `GlassTargetView.kt:82-91`; `LiquidGlassView.kt:93-105`; `DissolveView.kt:84-90`; `GlassTargets.kt:11-36`.
- **Neden yavaş olabilir:** react-native-screens gizli sekmeyi ayırıyor; cam, hedef ve Dissolve `onDetachedFromWindow`'da görüntü listelerini atıyor. Hedefin kaydı silinip geri gelirken `GlassTargets.changed()` uygulamadaki bütün camları geçersiz kılıyor. Dönüşün ilk karesinde her şey yeniden kaydedilip katmanlar yeniden ayrılıyor, aynı karede geliş de başlıyor. SVG yaması bunu SVG'ler için çözmüş, camlar için çözülmemiş.
- **Modern uygulamalar nasıl yapıyor:** Instagram ve WhatsApp sekme fragment'larını hide/show ile gizler; Telegram sayfaları aynı üst görünümde tutar. Görüntü listesi korunur, ilk kare hazırdır.
- **Önerilen düzeltme:** Önce ölçülür. Cam ve hedef görüntü listesini detach'te değil, yok edilince ya da `onTrimMemory`'de atar; `changed()` yalnızca o kimliğe bakan camları geçersiz kılar. Daha geniş seçenek: sekmeleri ayırmadan görünmez tutmak; bu ancak B6 yapıldıktan sonra ve bellek ölçülerek.
- **İş büyüklüğü:** M (geniş seçenek L)
- **Yayın:** yeni build
- **Telefonda doğrulama:** Perfetto'da dönüşün ilk karesinde `Record View#draw()`, `syncFrameState`, katman ayırma süreleri; aynı sekmeye hızlı ikinci dönüşle karşılaştırma; `dumpsys gfxinfo` Janky frames oranı.
- **Etki:** orta (sekme geçişi)
- **Doğrulama notu:** Kaynak A1-8 ve A2-4 (ikisi de doğrulandı, orta). Doğrulayıcı: Android'in sıradan görünümlerde davranışı sürüme bağlı; ölçülmeden etki tahmin.

### B9 — Buzlu düğmeler durağan bir zemini canlı bulanıklaştırıyor

- **Nerede:** `apps/mobile/src/aura/AuraBackground.tsx:75-89`; `apps/mobile/src/components/LiquidGlass.tsx:71-99`; `LiquidGlassView.kt:151-164, 166-231`.
- **Neden yavaş olabilir:** Backdrop açık temada durağan bir resim, karanlıkta düz renk. Yine de her buzlu kontrol kendi RenderNode + `RenderEffect` katmanını açıyor. Durağan hâlde katman önbellekte kalır; maliyet esas olarak B1'in tetiklediği yeniden çizimlerde ve karo GPU'da katman sayısında.
- **Modern uygulamalar nasıl yapıyor:** Telegram duvar kâğıdının bulanık sürümünü bir kez hesaplayıp önbellekte tutar; çubuklar o resmin kendi altına düşen parçasını çizer.
- **Önerilen düzeltme:** Karanlık tema kısayolu yerelde: bulunan backdrop yalnızca düz renk taşıyorsa cam doygunlukla hesaplanmış düz rengi çizer (JS'te yapılmaz: sohbet duvarı ve `explore/[venueId].tsx:122` gibi başka backdrop'lar var). Açık tema için önceden bulanıklaştırılmış zemin bitmap'i ve `BitmapShader`; önce B1 yapılıp ölçülür. Görünüş aynı kalmalı (kenar kırpması tuvalle karşılaştırılır).
- **İş büyüklüğü:** M
- **Yayın:** yeni build
- **Telefonda doğrulama:** B4'ün `buzlu` adımıyla karanlık ve açık temada Mekan'da ölçüm; Perfetto'da kare başına katman sayısı; iki ekran görüntüsü üst üste konarak görünüşün aynı olduğu denetlenir.
- **Etki:** orta (sekme geçişi)
- **Doğrulama notu:** Kaynak A2-2 (abartılı, yüksekten orta'ya; JS kısayolu yerine yerel çözüm).

### B10 — Varsayılan `staleTime` 0 ve öne gelişte istek seli

- **Nerede:** `apps/mobile/src/lib/queryClient.ts:23-36`; `apps/mobile/src/features/rooms/useBroadcast.ts:20-26`; `apps/mobile/src/features/friends/queries.ts:474-496`; `apps/mobile/src/features/venueChat/queries.ts:69-70`; `apps/mobile/src/features/rooms/queries.ts:114-116`; `useProfile.ts:9-25`; `useActiveTable.ts:11-30`.
- **Neden yavaş olabilir:** defaultOptions yok. Öne gelişte focusManager canlı beş sekmenin bütün etkin sorgularını okutuyor; aynı anda Realtime yeniden bağlanıyor ve `useBroadcast` her SUBSCRIBED'da her tüketiciyi çalıştırıyor. Inbox'ta iki işleyici aynı anahtarı, mekan sohbetinde iki useBroadcast aynı refetch'i çağırıyor; `cancelRefetch: true` ilk isteği iptal edip yeniden gönderiyor, `AbortSignal` kullanılmadığı için iptal edilen istek yine sunucuya gidiyor. `useProfile` (19 dosya) ve `useActiveTable` (13 dosya) her yeni gözlemcide yeniden okunuyor. Tahmin: öne gelişin ilk saniyelerinde aynı Edge Function 3–4 kez.
- **Modern uygulamalar nasıl yapıyor:** Telegram öne gelişte tek bir getDifference ile yalnızca farkı alır; WhatsApp ve Instagram tek senkron isteği yerel veritabanına uygular.
- **Önerilen düzeltme:** SUBSCRIBED okuması bilinçli (kaçan olay, audit CHAT-3); kaldırılmaz, birleştirilir: kanal başına tek "yeniden bağlandı" olayı, anahtar başına tek invalidate (aynı tikteki çağrılar microtask'ta birleşir) ya da `cancelRefetch: false`. `useRoom`'da ilk okuma sürüyorsa reread atlanır. Genel staleTime küçük (10–30 sn) ve yalnızca refetchOnMount'u sakinleştirmek için; `activeTable`, oda, gelen kutusu, açık DM `refetchOnWindowFocus: 'always'` ile korunur. Önce öne geliş başına istek sayısı ölçülür.
- **İş büyüklüğü:** M
- **Yayın:** OTA
- **Telefonda doğrulama:** Uygulama arka plana alınıp 1 dk sonra öne getirilir; Supabase Invocations'ta aynı saniyedeki `dm/inbox`, `friends/list` sayısı (hedef 1). Öne gelir gelmez sekme değiştirilip GPU çubukları ve Çizim ölçümüyle bakılır.
- **Etki:** orta (sekme geçişi)
- **Doğrulama notu:** Kaynak A3-4 (doğrulandı, orta) ve A6-1 (doğrulandı, yüksekten orta'ya). Doğrulayıcı: yapısal paylaşım değişmeyen veride render'ı keser; risk Realtime boşluğu.

### B11 — Topyekün yenilemeler: çekip yenileme, bağlantı dönüşü ve "Ayrıl"

- **Nerede:** `apps/mobile/src/components/Screen.tsx:85-87`; `apps/mobile/src/components/ConnectionBanner.tsx:38`; `apps/mobile/app/(app)/(tabs)/venue.tsx:58-64`; kullananlar `messages/index.tsx:47-50`, `activities.tsx:54`, `profile/friends.tsx:38-39`.
- **Neden yavaş olabilir:** `refreshable` varsayılanı `refetchQueries({ type: 'active' })`; sekmeler canlı olduğu için Mesajlar'da çekip yenilemek Keşfet'i, profili, lobiyi ve açık DM'i de okutuyor. "Ayrıl" argümansız `invalidateQueries()` ile DM sonsuz sorguları dahil bütün önbelleği geçersiz kılıp bekliyor; kullanıcı hemen Keşfet'e yönlendirildiği için bu dalga tam bir sekme geçişine denk geliyor olabilir.
- **Modern uygulamalar nasıl yapıyor:** Telegram, Instagram ve WhatsApp'ta yenileme yalnızca görünen listenin verisini ister.
- **Önerilen düzeltme:** Screen'e `refreshKeys` (ya da zorunlu `onRefresh`); ConnectionBanner'da topyekün okuma kalabilir (nadir, kaçan olayları kapatır) ama DM sonsuz sorguları hariç tutulur; "Ayrıl"da yalnızca check-in'e bağlı anahtarlar (activeTable, currentRoom, venueTables, venueChat) geçersiz kılınır ve beklenmez. Eksik anahtar kalmamasına dikkat.
- **İş büyüklüğü:** S
- **Yayın:** OTA
- **Telefonda doğrulama:** Mesajlar'da bir kez aşağı çekilir, giden istekler sayılır; "Ayrıl"dan sonraki Keşfet geçişi React DevTools Profiler ve Çizim ölçümüyle izlenir; uçak modu aç/kapa ile bağlantı dönüşü.
- **Etki:** orta (sekme geçişi)
- **Doğrulama notu:** Kaynak A3-5 (doğrulandı, orta), A4-9 (doğrulandı, düşük, kopya) ve doğrulayıcıların ayrıca vurguladığı `venue.tsx:63`.

### B12 — Cam hedefi her geçersizlemede ağaç yürüyor, nesne ayırıyor; bar camı yakındaki döngülerde yeniden bulanıklaşıyor

- **Nerede:** `GlassTargetView.kt:47-80` (her çağrıda `new Rect`, `getLocationInWindow`, `getGlobalVisibleRect`, `glasses.keys.toList()`), `:107-108` (dispatchDraw'da bütün camlar), `:113` (CHANGE_MARGIN_DP 48); `LiquidGlassView.kt:84-91, 122-135` (samples, SEEN 2σ); `apps/mobile/src/aura/RisoKanki.tsx:61-80`; `Buddy.tsx:62-77`; `Loader.tsx:70`.
- **Neden yavaş olabilir:** `ANDROID_SYNCHRONOUSLY_UPDATE_UI_PROPS` açık olduğundan her Reanimated/native-driver karesi hedefe bir `onDescendantInvalidated` olarak çıkıyor; gelişte 10–20 animasyonlu görünümle kare başına onlarca ağaç yürüyüşü ve GC baskısı olabilir. 48 dp pay + 48 dp örnek alanı yüzünden barın ~96 dp yakınındaki döngüler (kanki, Buddy, Loader) barı ekran dururken de her karede yeniden bulanıklaştırıyor olabilir. Doğrulayıcı ayrıca hedefin her `dispatchDraw`'da (düzen değişikliği, yeni metin, Keşfet'in 30 sn'lik dizilişi) alan süzgeci olmadan bütün camları geçersiz kıldığını buldu.
- **Modern uygulamalar nasıl yapıyor:** Telegram çizim yolunda nesne ayırmaz, geçersizleşmeyi kare başına bir kez toplar ve bulanık çubuğu yalnızca altındaki içerik değişince yeniler.
- **Önerilen düzeltme:** Rect'ler alan olarak yeniden kullanılır; değişen alanlar bir "dirty" birleşimine eklenip kare başına bir kez camlarla karşılaştırılır; camların pencere kutuları kare başına bir kez hesaplanır. Pay sabit 48 dp yerine görünümün gerçek dış taşmasından. `dispatchDraw`'da hepsi yalnızca çocuk sayısı/sırası değiştiyse geçersiz kılınır. SEEN'i 1,5σ'ya indirmek görünüş denetimiyle; bar camının seyreltilmesi K3.
- **İş büyüklüğü:** S
- **Yayın:** yeni build
- **Telefonda doğrulama:** Mekan kartında (kankiler/Buddy) hiçbir şeye dokunmadan GPU çubukları: ekran dururken akış sürüyorsa bar camı yeniden bulanıklaşıyor olabilir. Android Studio Memory → Record allocations ile geçişte Rect ayırmaları; Perfetto'da UI iş parçacığında draw öncesi süre.
- **Etki:** orta (sekme geçişi ve durağan ekran)
- **Doğrulama notu:** Kaynak A2-6 (doğrulandı, orta), A1-9 (doğrulandı, düşük) ve doğrulayıcı kaynaklı `dispatchDraw` tespiti (tahmin).

### B13 — Gelişte tam ekran saydamlık ek ekran dışı geçiş açıyor olabilir (doğrulayıcı kaynaklı)

- **Nerede:** `apps/mobile/src/components/TabBar.tsx:192-198`; `apps/mobile/src/aura/Reveal.tsx:47-55`.
- **Neden yavaş olabilir:** Geliş boyunca tam ekran Animated.View'e ve her Reveal parçasına opacity < 1 veriliyor. Android'de `hasOverlappingRendering` varsayılan true olduğundan saydamlık her karede bir `saveLayer` açabilir: Dissolve'un ekran dışı geçişinin içinde ikinci bir tam ekran geçiş ve her Reveal için ayrı küçük geçişler (tahmin).
- **Modern uygulamalar nasıl yapıyor:** Telegram geçişte görünümü donanım katmanına (LAYER_TYPE_HARDWARE) alıp yalnızca alpha'yı değiştirir.
- **Önerilen düzeltme:** Geliş sırasında `renderToHardwareTextureAndroid` ya da `needsOffscreenAlphaCompositing` ayarları ölçülerek denenir. Görünüş değişmez.
- **İş büyüklüğü:** S
- **Yayın:** OTA
- **Telefonda doğrulama:** GPU fazla çizim ve Perfetto'da geçiş başına `saveLayer` sayısı; GPU çubukları önce/sonra.
- **Etki:** orta (tahmin; sekme geçişi)
- **Doğrulama notu:** Çapraz denetçinin eklediği bulgu; denetçi tarafından ölçülmedi.

### B14 — Basıştan sonra yeniden okuma bitmeden ekran değişmiyor

- **Nerede:** `apps/mobile/src/features/rooms/CreateTableSheet.tsx:82-93`; `apps/mobile/src/features/checkin/useCheckIn.ts:38-46`; `IdentitySheet.tsx:50-54`; `apps/mobile/app/(app)/spot.tsx:32-41`; `OpenLobbySheet.tsx:54-60`; `profile/edit.tsx:154-161`; `venue.tsx:58-64`.
- **Neden yavaş olabilir:** onSuccess Edge Function yanıtından sonra bir ya da birkaç yeniden okumayı `await` ediyor; gezinme ondan sonra. "Masa kur" → rooms/create → currentRoom ve venueTables → push → oda ekranı yeniden okur: üç ardışık gidiş-dönüş. Her basışa 1 RTT eklenebilir.
- **Modern uygulamalar nasıl yapıyor:** WhatsApp grubu hemen açar; Telegram yanıttaki nesneyi doğrudan önbelleğe yazar.
- **Önerilen düzeltme:** Yanıt yeterli veriyi taşıyorsa `setQueryData` ve geç, yeniden okuma `void` ile arkada: CheckInResponse activeTable'a yazılabilir. rooms/create yalnızca roomId döndürdüğü için currentRoom'a uydurma satır yazılmaz; oda ekranının bayat currentRoom ile yönlendirme korumaları önce okunur. "Ayrıl" için B11.
- **İş büyüklüğü:** S
- **Yayın:** OTA
- **Telefonda doğrulama:** Release build, ağ hız sınırı açık: "Masa kur", "Bu noktadayım", "Kimliği değiştir", "Ayrıl"da basıştan ekran değişene kadar kare sayısı; Network Inspector'da gezinmeden önce biten istekler.
- **Etki:** orta
- **Doğrulama notu:** Kaynak A6-3 (doğrulandı, yüksekten orta'ya). Bazı beklemeler bilinçli (useCheckIn sırası).

### B15 — Soğuk açılışta ilk ekran oturum yenilemesi ve profil sorgusunu bekliyor

- **Nerede:** `apps/mobile/app/_layout.tsx:38-46, 83, 93-99`; `apps/mobile/src/features/auth/session.ts:45-47`; `apps/mobile/src/features/account/useProfile.ts:9-24`; `apps/mobile/src/lib/queryClient.ts:23-26`; `LaunchCurtain.tsx:179-180`.
- **Neden yavaş olabilir:** `loading = !initialized || (signedIn && profile.isPending)`; süresi dolmuş jetonda getSession yenilemeyi bekler, profil sorgusu kalıcı değil. Bugün perdenin ~1,9 sn'si bu beklemeyi çoğu açılışta gizliyor; ağ perdeden yavaşsa ya da perde kısaltılırsa (K4) Loader görünür.
- **Modern uygulamalar nasıl yapıyor:** Telegram ve WhatsApp ilk ekranı yerel son hâlden anında çizer; ilk kareyi ağ yanıtına bağlamaz.
- **Önerilen düzeltme:** Yönlendirmenin ihtiyacı olan profil alanları telefonda küçük bir önbellekte tutulur; yalnızca "uygulamaya gir" yönü önbellekten verilir, onam ve `gender_required` kapıları tazeleme gelene kadar önbelleğe güvenmez (sunucu her çağrıda denetler). Perde kısaltılacaksa bu önce ya da aynı pakette yapılır.
- **İş büyüklüğü:** M
- **Yayın:** OTA
- **Telefonda doğrulama:** Uygulama 1 saatten uzun kapalı tutulup soğuk açılır; perde bekleme döngüsüne giriyor mu, sonunda Loader görünüyor mu. 3G kısıtlamasıyla ve kısıtlamasız, alt seviye cihazda.
- **Etki:** orta
- **Doğrulama notu:** Kaynak A5-1 (abartılı, yüksekten orta'ya). Düzeltilen: oturum okuması fontlarla paralel başlıyor (`startSessionSync` ThemeProvider dışında); yalnızca profil sorgusu bekliyor. Doğrulayıcı A5-1 ile A5-2'nin sırasını vurguladı.

### B16 — Masa sohbetinde her mesaj ve tepki son 100 mesajı ve ekleri yeniden okutuyor; satırlar memo'suz

- **Nerede:** `apps/mobile/src/features/chat/useMessages.ts:10-11, 16-46, 67-75`; `apps/mobile/src/features/chat/ChatPanel.tsx:92-97, 189-310`; `apps/mobile/src/components/ChatScreen.tsx:976-982`.
- **Neden yavaş olabilir:** Her INSERT, `reaction` ve `message_gone` `['messages', roomId]` önekini geçersiz kılıyor: 100 satır + `room_chat_extras` RPC'si. 12 telefonlu masada mesaj başına ~24 okuma; gönderen ayrıca send sonrası `await` ile ve kendi INSERT olayıyla iki kez okuyor. Extras `new Map` döndürdüğü için yapısal paylaşım çalışmıyor; satırlar her çizimde yeni nesne, renderItem satır içi, memo'lu satır yok: görünür her hücre mesaj başına yeniden çiziliyor olabilir.
- **Modern uygulamalar nasıl yapıyor:** Telegram yalnızca gelen güncellemeyi ekler (notifyItemInserted), tepki yalnızca o hücreyi yeniden bağlar. WhatsApp yeni mesajı yerel veritabanına yazar, yalnızca farkı çizer.
- **Önerilen düzeltme:** DM kalıbı: yalnızca son `created_at`'ten yeniler okunup eklenir; ekler yalnızca tepki yayınında ya da alıntılı yeni satırda. Gönderende outbox sunucu kopyası gelince düşer. DmRow gibi memo'lu RoomRow; extras düz nesne ya da `structuralSharing`. Orta vadede `messages:` kanalını veri içermeyen sunucu yayınına taşımak (kural 9 ile uyumlu, sunucu işi).
- **İş büyüklüğü:** M
- **Yayın:** OTA (Broadcast'e geçiş önce sunucu)
- **Telefonda doğrulama:** Bot masasıyla (e2e → karşı masa) 6+ telefonlu masada art arda mesaj; Supabase API loglarında mesaj başına okuma; React DevTools'ta ChatBubble commit sayısı; alt seviye cihazda GPU çubukları.
- **Etki:** orta
- **Doğrulama notu:** Kaynak A3-7 ve A6-5 (ikisi de doğrulandı, orta). Taslak metni ekran state'inde değil, tuş başına tüm hücreler çizilmez.

### B17 — DM'de tepki bütün satırların memo'sunu bozuyor; mekan sohbetinde satır memo'su yok

- **Nerede:** `apps/mobile/src/features/chat/messageExtras.ts:53-58`; `apps/mobile/app/(app)/(tabs)/messages/[threadId].tsx:356-372`; `apps/mobile/app/(app)/venue-chat/index.tsx:289-301`; `ChatScreen.tsx:982`.
- **Neden yavaş olabilir:** `view` `[pending, alias]`'a bağlı; tepkinin başında ve sonunda değişip bütün DmRow'lara gidiyor. Mekan sohbetinde satır doğrudan ChatBubble kuruyor, her satıra yeni kapanışlar veriliyor; ekran state'i (sheet, kişi, outbox, üyeler) değiştikçe görünür bütün hücreler çiziliyor olabilir.
- **Modern uygulamalar nasıl yapıyor:** Telegram tepkiyi `notifyItemChanged(position, payload)` ile yalnızca o hücreye uygular.
- **Önerilen düzeltme:** `view`/`pick` sabit referans (pending ref'te ya da store'da); pending tepki yalnızca ilgili satıra prop. Mekan sohbetine DmRow kalıbında memo'lu satır, geri çağrılar ref üzerinden.
- **İş büyüklüğü:** M
- **Yayın:** OTA
- **Telefonda doğrulama:** Dev build'de React DevTools ile tepki başına çizilen DmRow/ChatBubble sayısı; release build'de 100+ mesajlı mekan sohbetinde GPU çubukları.
- **Etki:** orta
- **Doğrulama notu:** Kaynak A4-2 (doğrulandı, yüksekten orta'ya; tepki seyrek, asıl kısım mekan/masa sohbeti).

### B18 — Sohbet satırlarının context aboneliği memo'yu deliyor

- **Nerede:** `apps/mobile/src/components/ChatScreen.tsx:111` (SETTLE_MS 800), `:158-176`, `:956-959`; `messages/[threadId].tsx:518`.
- **Neden yavaş olabilir:** ChatRow `ChatLiveContext`, `ChatNewestContext`, `ChatHighlightContext`'e abone; newest yalnızca ilk çizimde kullanılıyor ama her yeni mesajda, açılıştan 800 ms sonra ve her alıntı vurgusunda bağlı bütün satır kabukları yeniden koşuyor (windowSize 11 ile onlarca). React Compiler büyük ihtimalle ChatBubble alt ağacını önbellekten verir; maliyet satır kabukları.
- **Modern uygulamalar nasıl yapıyor:** Telegram yalnızca yeni hücreyi bağlar ve canlandırır; diğer hücreler yeniden bağlanmaz.
- **Önerilen düzeltme:** `arriving` ve vurgu yalnızca ilgili satıra prop olarak ya da id başına seçiciyle (`useSyncExternalStore`). Önce React DevTools'ta ChatBubble'ın "Memo ✨" rozetli olduğu ve context değişiminde çizilmediği doğrulanır.
- **İş büyüklüğü:** S
- **Yayın:** OTA
- **Telefonda doğrulama:** 100+ mesajlı DM'de karşı telefondan art arda mesaj; Profiler'da mesaj başına çizilen satır sayısı (beklenen 1–2); alt seviye cihazda açılışın 0,8. saniyesinde takılma.
- **Etki:** orta
- **Doğrulama notu:** Kaynak A4-1 (abartılı, yüksekten orta'ya). Düzeltilen: "her ChatBubble baştan çiziliyor" büyük ihtimalle yanlış.

### B19 — Sohbet akışı geri dönüşümsüz FlatList

- **Nerede:** `apps/mobile/src/components/ChatScreen.tsx:976-1041, 1088-1091`; `apps/mobile/src/components/ChatBubble.tsx:196-203, 249-271, 309, 645-653, 750-823`.
- **Neden yavaş olabilir:** VirtualizedList hücreyi geri dönüştürmez; geçmişte hızlı kaydırırken her balonun Pressable, ShadowView, Svg kuyruk, SwipeToReply görünümleri sürekli kurulup sökülüyor olabilir. `WINDOW 11` gereğinden çok hücre tutuyor ve B17/B18'in kapsamını büyütüyor; `getItemLayout` yok.
- **Modern uygulamalar nasıl yapıyor:** Telegram RecyclerView ve tek View'lı ChatMessageCell (canvas'a çizim) kullanır; WhatsApp da geri dönüştürür. RN karşılığı FlashList v2 ya da Legend List.
- **Önerilen düzeltme:** Önce WINDOW 5–7 denenip ölçülür (boş alan riski). Sonra FlashList v2 (yeni bağımlılık, gerekçe PR'da; `startRenderingFromBottom`, `maintainVisibleContentPosition`, KeyboardChatScrollView, `getItemType`, `recyclingKey`, MetaCell ölçümlerinin yeniden kurgusu).
- **İş büyüklüğü:** L
- **Yayın:** OTA
- **Telefonda doğrulama:** 300+ mesajlı DM'de en eskiye hızlı kaydırma; GPU çubukları ve boş alan; Perfetto'da `createView`/mount sayısı; Çizim ölçümünde `golge` adımı.
- **Etki:** orta
- **Doğrulama notu:** Kaynak A4-3 (doğrulandı, orta). Doğrulayıcı: RN 0.86/Fabric uyumu ve gün çizgisi ölçümü ciddi risk.

### B20 — Her buzlu kontrol ayrı bulanıklık katmanı; sohbet kaydırmasında her karede yeniden bulanıklaşma

- **Nerede:** `apps/mobile/src/aura/kit.tsx:185, 205, 368, 499, 641, 728`; `apps/mobile/src/components/IconButton.tsx:96`; `apps/mobile/src/components/ChatScreen.tsx:1188-1255` (backdrop içinde duvar ve akış), `:1209-1220`; `LiquidGlassView.kt:58-59`.
- **Neden yavaş olabilir:** N buzlu kontrol N ayrı RenderNode + `RenderEffect` demek; karo GPU'da her çizim hedefi bir yükleme/boşaltma geçişi getirir. Sohbette akış cam hedefinin içinde olduğu için kaydırmanın her karesinde üst haplar, mesaj çubuğu ve aşağı ok ayrı ayrı yeniden bulanıklaşıyor olabilir (tasarım gereği).
- **Modern uygulamalar nasıl yapıyor:** Telegram üst ve alt bulanık alanı tek küçük resim olarak hesaplar; o alandaki bütün düğmeler aynı resmi örnekler.
- **Önerilen düzeltme:** GlassTargetView camlarının birleşik bandını (üst, alt) karede bir kez küçük boyda bulanıklaştırır; her LiquidGlassView ortak düğümün kendi parçasını kırpar. Önce B1 ve B9; bu madde canlı hedefler için. Kaydırmada hız kısma ve düşük sınıfta düz dolgu K2/K3'te.
- **İş büyüklüğü:** L
- **Yayın:** yeni build
- **Telefonda doğrulama:** Uzun DM'de hızlı kaydırma; Çizim ölçümünde `cam` aç/kapa ile GPU çubukları; Perfetto'da kare başına `skallGlass` katman sayısı (bugün hap sayısı + 1, hedef 1–2).
- **Etki:** orta
- **Doğrulama notu:** Kaynak A2-7 ve A4-6 (ikisi de doğrulandı, orta). Doğrulayıcı: sekme geçişinden çok sohbet kaydırması.

### B21 — Her Screen klavyeye abone; görünmeyen sekmelerde KeyboardAvoidingView çalışıyor olabilir

- **Nerede:** `apps/mobile/src/components/Screen.tsx:23, 91, 125-130, 150-154, 162-176`.
- **Neden yavaş olabilir:** `useKeyboardState` her Screen'de, değer yalnızca footer'da kullanılıyor; klavye açılıp kapanınca canlı beş sekmenin ve yığının bütün Screen'leri yeniden çiziliyor. Ayrıca keyboard-controller'ın KeyboardAvoidingView'ı her bağlı Screen'de klavye hareketinin her karesinde padding ve yerleşim güncelliyor olabilir (doğrulayıcı tahmini).
- **Modern uygulamalar nasıl yapıyor:** Telegram'da klavyeyi yalnızca etkin ekranın SizeNotifierFrameLayout'u dinler.
- **Önerilen düzeltme:** Abonelik footer alt bileşenine; KeyboardAvoidingView `enabled={focused}` ya da odakta değilken düz View.
- **İş büyüklüğü:** S
- **Yayın:** OTA
- **Telefonda doğrulama:** DM'de klavye aç/kapa; Profiler'da Screen commit'leri; Perfetto'da UI iş parçacığında kaç KAV'ın stil güncellediği; alt seviye cihazda GPU çubukları.
- **Etki:** orta
- **Doğrulama notu:** Kaynak A3-8 (denetçi düşük, doğrulayıcı orta'ya çıkardı) ve doğrulayıcı kaynaklı KAV tespiti.

### B22 — Sohbet duvar kâğıtları 1290×2796 çözülüyor; şeritlerde dokuz Image

- **Nerede:** `apps/mobile/src/components/ChatWallpaper.tsx:1-2, 15-28, 52-59, 78-131`; `ChatScreen.tsx:1210, 1259, 1270`; `apps/mobile/assets/riso/wall-dm-*.webp`, `wall-mekan-*.webp` (2,36–2,57 MB).
- **Neden yavaş olabilir:** RN Image `resizeMethod` verilmeden; Android'de WebP tam boy (~14 MB ARGB) çözülüyor olabilir. DM, mekan ve masa sohbeti açılışında liste ve klavyeyle yarışır; bellek baskısında yeniden çözülür. Üç şerit aynı bitmap'i 27'ye kadar kırpılmış Image ile çiziyor.
- **Modern uygulamalar nasıl yapıyor:** Telegram duvarı ekran boyunda bir kez çözüp önbellekte tutar; WhatsApp ekran çözünürlüğüne indirir.
- **Önerilen düzeltme:** expo-image (mevcut bağımlılık, `transition={0}`) ile görünüm boyunda çözme ya da 1080 genişlikte kopyalar; şeritlerde tek görünüm üzerinde maske düşünülür. Görünüş aynı kalır.
- **İş büyüklüğü:** S
- **Yayın:** OTA
- **Telefonda doğrulama:** 720p, 3–4 GB RAM cihazda sohbetler sırayla açılır; `dumpsys meminfo` Graphics/Native; Perfetto'da `decode` dilimleri; GPU çubuklarında açılış karesi.
- **Etki:** orta
- **Doğrulama notu:** Kaynak A4-8 (doğrulandı, düşükten orta'ya) ve A5-6 (doğrulandı, orta). "Fresco yalnızca JPEG'i küçültür" iddiası RN sürümüne bağlı, doğrulanmadı.

### B23 — Masaya girişte art arda okumalar ve kişi başına profile/get

- **Nerede:** `apps/mobile/app/(app)/room/[id].tsx:67-84`; `apps/mobile/src/features/rooms/queries.ts:76-150, 167-185`; `apps/mobile/src/features/profile/queries.ts:20, 33-40`; `RoomPeople.tsx:168, 191`; `TableScene.tsx:186`.
- **Neden yavaş olabilir:** people ve votes room.data'yı, room_member_profiles people'ı bekliyor; sonra profilli her kişi için ayrı Edge Function. SUBSCRIBED'da reread dört sorguyu iptal edip yeniden gönderiyor; 4 sn'lik roomCheck her telefonda. Tahmin: 3–4 RTT ve N çağrı.
- **Modern uygulamalar nasıl yapıyor:** Telegram sohbetin tam bilgisini tek çağrıyla (getFullChat) alır; WhatsApp üyeleri yerel önbellekten çizer.
- **Önerilen düzeltme:** İstemcide people ve votes'u room.data'yı beklemeden başlatmak (kapalı masada boş/hata hâline dikkat). Sunucuda masanın profillerini tek çağrıda veren okuma eylemi: kural 4 (yalnızca masa sürerken, o anki kişilere, profil kimliği kuralı), kural 1 (yalnızca okur, `set search_path = ''`), `guvenlik` denetimi. `gcTime: 0` kural 4 gereği bilinçli, artırılmaz.
- **İş büyüklüğü:** L
- **Yayın:** önce sunucu (istemci adımı OTA)
- **Telefonda doğrulama:** 4–6 profilli bot kişili masaya girişte Network Inspector şelalesi; ekran kaydıyla bütün fotoğrafların görünme süresi; Invocations'ta giriş başına profile/get.
- **Etki:** orta
- **Doğrulama notu:** Kaynak A6-8 (doğrulandı, orta).

### B24 — Oy ve "Arkadaş ekle" sunucuyu bekliyor; iyimser arayüz yok

- **Nerede:** `apps/mobile/app/(app)/room/[id].tsx:143-147`; `apps/mobile/src/features/rooms/TableEnd.tsx:226-239`; `apps/mobile/src/features/rooms/queries.ts:118-124`.
- **Neden yavaş olabilir:** Oy, rooms/vote ve table_vote_counts okuması bitene kadar kişinin kendi seçimi değişmiyor; "Arkadaş ekle"/"Geri al" da yanıtı bekliyor. Basış başına 150–400 ms "basıldı mı?" boşluğu olabilir.
- **Modern uygulamalar nasıl yapıyor:** Instagram beğeniyi, WhatsApp ve Telegram anket seçimini anında gösterir, red gelirse geri alır.
- **Önerilen düzeltme:** Yalnızca kişinin kendi durumu için `onMutate` ile iyimser güncelleme (kendi oyu ve ±1, kendi "eklendi" işareti), `onError`'da geri alma. Kural 3 korunur (oy öneri, sayıyı sunucu yazar); oyun eylemlerinde iyimserlik yapılmaz. Kural 5 korunur. Düğme bekleme hâlini korur (Ekran davranışı).
- **İş büyüklüğü:** S
- **Yayın:** OTA
- **Telefonda doğrulama:** Ağ hız sınırı açıkken oy ve "Arkadaş ekle"; ekran kaydıyla basıştan seçime kare sayısı (hedef 1–2); uçak modunda basıp geri alındığını görmek.
- **Etki:** orta
- **Doğrulama notu:** Kaynak A6-9 (doğrulandı, orta).

### B25 — Sekme düzeni rozet için bütün gelen kutusuna abone

- **Nerede:** `apps/mobile/app/(app)/(tabs)/_layout.tsx:25-35`; `apps/mobile/src/features/friends/queries.ts:151-176`.
- **Neden yavaş olabilir:** TabsLayout `useInbox`, `useUnreadTotal`, `useRequestCount`, `useUnseenCount` ile bütün listelere abone; her DM'de hook'lar koşuyor. React Compiler `<Tabs>`'ı sayılara göre önbellekler; alt ağacın yeniden çizildiği kanıtlanamadı.
- **Modern uygulamalar nasıl yapıyor:** Telegram'da rozet sayısı yalnızca rozet görünümünü invalidate eder.
- **Önerilen düzeltme:** Önce Highlight updates ile ölçülür. `select` ile sayıya indirmek (`select: totalUnread`, `d.length`, `d.unseen`); gerekiyorsa rozet abonelikleri TabBar'a taşınır.
- **İş büyüklüğü:** S
- **Yayın:** OTA
- **Telefonda doğrulama:** Profil'deyken ikinci telefondan DM; Highlight updates ile yalnızca sekme çubuğunun yanması beklenir.
- **Etki:** düşük (sekme geçişi)
- **Doğrulama notu:** Kaynak A1-6 ve A3-3 (ikisi de abartılı, düşük).

### B26 — Sekme zemini dört kez tam ekran çiziliyor

- **Nerede:** `apps/mobile/src/components/TabBar.tsx:216`; `apps/mobile/src/components/Screen.tsx:111-112`; `apps/mobile/src/aura/AuraBackground.tsx:44-47, 59-89`.
- **Neden yavaş olabilir:** GlassTarget ve SafeAreaView zemin rengi, düz resim ve hedefteki aynı resim: dört tam ekran dolgu. Yalnızca ekran yeniden işlenince ödenir; opak dolgu modern GPU'da ucuz. İkinci resim K2/X2 hatasının (2 Kasım) geçici çözümü.
- **Modern uygulamalar nasıl yapıyor:** Telegram duvar kâğıdını tek çizimle çizer.
- **Önerilen düzeltme:** Önce kök neden (resim yüklenince hedef düğümün güncellenmesi, B8 ile ilişkili olabilir); sonra kopya ve gereksiz zemin rengi kaldırılır. K2/X2 geri gelmemeli.
- **İş büyüklüğü:** M
- **Yayın:** yeni build
- **Telefonda doğrulama:** GPU fazla çizimini hata ayıkla: boş alanlar bugün 2x–3x, hedef 1x; her sekmenin ilk açılışında bulutların ilk karede göründüğü denetlenir.
- **Etki:** düşük (sekme geçişi)
- **Doğrulama notu:** Kaynak A2-5 (doğrulandı, orta'dan düşüğe) ve doğrulayıcının dördüncü dolgu tespiti.

### B27 — Yeni boyutlu gölge resmi UI iş parçacığında yazılımla bulanıklaştırılıyor

- **Nerede:** `apps/mobile/modules/skall-glass/android/src/main/java/expo/modules/skallglass/ShadowView.kt:147-186`.
- **Neden yavaş olabilir:** Önbellekte olmayan boy ilk çizimde `Bitmap.createBitmap` + yazılım `BlurMaskFilter`; anahtar her `dispatchDraw`'da `buildString` ile kuruluyor. Sekmenin ilk açılış karesine eklenebilir; 48 MB LRU sayesinde yalnızca ilk sefer.
- **Modern uygulamalar nasıl yapıyor:** Telegram gölgeleri hazır 9-parça çizimlerle ya da bir kez üretilip paylaşılan bitmap'lerle çizer.
- **Önerilen düzeltme:** Bilinen token setleri açılıştan sonra boşta üretilir; anahtar setShadows/setRadii'de bir kez hesaplanır.
- **İş büyüklüğü:** S
- **Yayın:** yeni build
- **Telefonda doğrulama:** Soğuk açılışta her sekmenin ilk açılışında Perfetto'da `Bitmap.createBitmap` süreleri; Çizim ölçümünün `golge` adımı.
- **Etki:** düşük (sekme geçişi)
- **Doğrulama notu:** Kaynak A2-10 (doğrulandı, düşük).

### B28 — Mesajlar gelen kutusu sanallaştırılmamış; ilk açılışta satır başına kanal ve 20 DM önbelleği

- **Nerede:** `apps/mobile/app/(app)/(tabs)/messages/index.tsx:43, 183-191, 239-265, 354-366`; `apps/mobile/src/features/friends/useDmTyping.ts:23-31`.
- **Neden yavaş olabilir:** İlk açılışta bütün satırlar Rise ile takılıyor, ilk 30 satır ayrı `dm_typing` kanalına katılıyor, aynı karede 20 DM önbelleği AsyncStorage'dan okunuyor; dakikada bir bütün satırlar çiziliyor (InboxRow memo değil). Satır sayısı arkadaş sayısı; pilotta küçük, 30+ arkadaşta anlamlı.
- **Modern uygulamalar nasıl yapıyor:** Telegram DialogsActivity yalnızca görünen hücreleri bağlar; "yazıyor" tek güncelleme akışından gelir.
- **Önerilen düzeltme:** FlatList; yazıyor aboneliği `onViewableItemsChanged` ile yalnızca görünen satırlara (kural 9 içinde); InboxRow memo, `now` yalnızca damgaya; `restoreDm` ilk kareden sonra parça parça; Rise yalnızca ilk görünen satırlarda. Tek kanala taşıma K-bölümünde.
- **İş büyüklüğü:** M
- **Yayın:** OTA
- **Telefonda doğrulama:** 30+ arkadaşlı hesapla Mesajlar'a ilk geçiş; GPU çubukları; Supabase'de eşzamanlı kanal sayısı; Perfetto'da JS uzun görevleri.
- **Etki:** düşük (sekme geçişi, yalnızca ilk açılış)
- **Doğrulama notu:** Kaynak A4-5 (abartılı, orta'dan düşüğe).

### B29 — Açılışta bütün route modülleri değerlendiriliyor; inline requires kapalı olabilir

- **Nerede:** `apps/mobile/metro.config.js:9-20`; `apps/mobile/app.json:27`; `apps/mobile/app/(app)/(tabs)/explore/index.tsx:41, 121`; `apps/mobile/src/features/explore/ExploreMap.tsx:10`; `apps/mobile/app/_layout.tsx:14, 97`.
- **Neden yavaş olabilir:** `inlineRequires` verilmiyor (Expo varsayılanı doğrulanamadı). expo-router (asyncRoutes yok) 48 route modülünü, MapLibre'li Keşfet'i, oyun ekranlarını ve DrawLabPanel'i açılışta birlikte değerlendiriyor. Bu açılış maliyetidir; sekme geçişine etkisi beklenmez.
- **Modern uygulamalar nasıl yapıyor:** Inline requires Meta'nın Facebook/Instagram açılışı için geliştirdiği tekniktir; Telegram ağır bileşenleri açıldıkları ekranda yükler.
- **Önerilen düzeltme:** `inlineRequires` varsayılanı doğrulanıp gerekirse açılır; harita ve oyunlar ekran içinde tembel `require`.
- **İş büyüklüğü:** S
- **Yayın:** OTA
- **Telefonda doğrulama:** Perfetto'da Hermes modül değerlendirme dilimleri, soğuk açılış önce/sonra.
- **Etki:** düşük
- **Doğrulama notu:** Kaynak A5-5 (abartılı, düşük; tabSwitch değil) ve doğrulayıcı kaynaklı expo-router tespiti.

### B30 — NativeWind v4 çalışma anı stil katmanı

- **Nerede:** `apps/mobile/babel.config.js:4`; `apps/mobile/metro.config.js:20`; `apps/mobile/src/theme/ThemeProvider.tsx:163-166, 190-197`; 98 dosyada 356 `className`.
- **Neden yavaş olabilir:** Her öğe NativeWind jsx sarmalayıcısından geçiyor; className taşıyanlar cssInterop ile değişken çözüyor. Sekme ve satır kurulumunda öğe başına küçük JS maliyeti; ölçülmedi.
- **Modern uygulamalar nasıl yapıyor:** Native'de çalışma anı stil çözümü yok; RN'de StyleSheet ya da derleme zamanı çözüm (Unistyles 3, NativeWind v5).
- **Önerilen düzeltme:** Önce ölçülür; sıcak yollarda (satırlar, balon) StyleSheet'e geçiş. Tamamen bırakmak ayrı karar.
- **İş büyüklüğü:** L
- **Yayın:** OTA
- **Telefonda doğrulama:** React DevTools Profiler'da bir sekmenin ilk kurulumunda CssInterop render süresi; bir ekran çevrilip karşılaştırılır.
- **Etki:** düşük (sekme geçişi)
- **Doğrulama notu:** Kaynak A5-9 (doğrulandı, düşük; getirisi belirsiz).

### B31 — Kanki döngüsü karede dört kez `kankiFrame` hesaplıyor

- **Nerede:** `apps/mobile/src/aura/RisoKanki.tsx:111-142, 157`.
- **Neden yavaş olabilir:** Dört `useAnimatedStyle` aynı kareyi hesaplıyor; aritmetik mikro saniyeler. Asıl maliyet dört görünüm güncellemesinin cam hedefine geçersizleme olarak çıkması (B12).
- **Modern uygulamalar nasıl yapıyor:** Instagram ve Telegram karakter hareketlerini önceden hesaplanmış karelerle (Lottie, RLottie) ya da tek dönüşümle çizer.
- **Önerilen düzeltme:** Tek `useDerivedValue`; açık/kapalı göz tek değerle.
- **İş büyüklüğü:** S
- **Yayın:** OTA
- **Telefonda doğrulama:** Kankili sahnede ekran dururken Perfetto'da Reanimated kare süresi; Çizim ölçümü `hareket` adımı.
- **Etki:** düşük
- **Doğrulama notu:** Kaynak A2-11 (abartılı, düşük; etkisi ölçülemeyebilir).

### B32 — İlk okunmamışa açılışta tahmini konum ve ikinci, animasyonlu kaydırma

- **Nerede:** `apps/mobile/src/components/ChatScreen.tsx:815-834, 1023-1040`.
- **Neden yavaş olabilir:** İlk okunmamış ilk 15 satırın ötesindeyse `scrollToIndex` başarısız; ortalama boyla animasyonlu kaydırma ve 120 ms sonra yeniden. Görünür sıçrama olabilir.
- **Modern uygulamalar nasıl yapıyor:** Telegram konumu ilk yerleşimde verir (`scrollToPositionWithOffset`), sıçrama yok.
- **Önerilen düzeltme:** openAt yolunda yedek kaydırma animasyonsuz (açılış ile alıntıya atlama ayrılır); `initialNumToRender` openAt indeksini kapsayacak kadar dinamik.
- **İş büyüklüğü:** M
- **Yayın:** OTA
- **Telefonda doğrulama:** 50+ okunmamışlı DM açılışının ekran kaydı kare kare.
- **Etki:** düşük
- **Doğrulama notu:** Kaynak A4-7 (doğrulandı, düşük).

### B33 — Her sohbet satırına boş onLayout ve gün raporu başına bütün gün hücreleri

- **Nerede:** `apps/mobile/src/components/ChatScreen.tsx:173, 605-689, 803-806, 871-904, 925-934`.
- **Neden yavaş olabilir:** ChatList'te `row: () => () => undefined` her satıra boş onLayout bağlıyor; Fabric'te her yerleşim değişiminde JS'e olay. placeDay her raporda baştan çalışıyor.
- **Modern uygulamalar nasıl yapıyor:** Telegram yüzen tarihi kaydırma başına tek geçişte hesaplar.
- **Önerilen düzeltme:** ChatList'te `row` undefined; gün raporları rAF ile kare başına bir kez.
- **İş büyüklüğü:** S
- **Yayın:** OTA
- **Telefonda doğrulama:** Perfetto'da DM açılışında onLayout olay sayısı; "Daha eski mesajlar" yüklenirken GPU çubukları.
- **Etki:** düşük
- **Doğrulama notu:** Kaynak A4-10 (doğrulandı, düşük).

### B34 — React Compiler'ın atladığı bileşenler görünmüyor

- **Nerede:** `apps/mobile/app.json:81`; `apps/mobile/babel.config.js:1-6`; `eslint.config.mjs:2, 34`.
- **Neden eski:** Compiler kurallara uymayan bileşeni sessizce atlar; repoda bunu gösteren denetim yok, lint kuralının açık olduğu doğrulanamadı. Liste satırları ancak açık `memo` ile korunur.
- **Modern uygulamalar nasıl yapıyor:** Büyük RN uygulamaları compiler'ı derleme raporuyla izler, liste hücrelerini ayrıca memo'lar.
- **Önerilen düzeltme:** `react-compiler-healthcheck` ya da babel `logger` ile atlananlar listelenir; `eslint-plugin-react-hooks` compiler kuralı doğrulanır. Çalışma zamanı değişmez.
- **İş büyüklüğü:** S
- **Yayın:** OTA (çalışma zamanına etkisi yok)
- **Telefonda doğrulama:** React DevTools'ta sekme ekranlarında ve satırlarda "Memo ✨" rozeti.
- **Etki:** düşük
- **Doğrulama notu:** Kaynak A3-9 (doğrulandı, düşük).

### B35 — Açılış perdesinde tam ekran offscreen birleştirme

- **Nerede:** `apps/mobile/src/features/launch/LaunchCurtain.tsx:66-101, 331-357, 366-410`.
- **Neden yavaş olabilir:** Kök ve `marks` katmanı `needsOffscreenAlphaCompositing` taşıyor; opaklık animasyonu boyunca her karede tam ekran ara tampon. 22 kaynak çözülüyor ama parçalar kırpılmış ve küçük (toplam 1,78 MB), expo-image görünüm boyuna küçültüyor.
- **Modern uygulamalar nasıl yapıyor:** Telegram'ın açılışı vektör/drawable; büyük bitmap çözülmez.
- **Önerilen düzeltme:** Önce Perfetto'da decode ölçülür; offscreen birleştirme yalnızca `curtain < 1` iken (son solma). Görünüş değişmez. Zemin çözünürlüğünü düşürmek K-bölümünde.
- **İş büyüklüğü:** S
- **Yayın:** OTA
- **Telefonda doğrulama:** Soğuk açılışta perde boyunca GPU çubukları; Perfetto'da `decodeBitmap` ve RenderThread.
- **Etki:** düşük
- **Doğrulama notu:** Kaynak A5-3 (abartılı, orta'dan düşüğe).

### B36 — Açılış yolunda üç ayrı AsyncStorage okuması

- **Nerede:** `apps/mobile/src/theme/ThemeProvider.tsx:61-66`; `apps/mobile/src/features/launch/launchStore.ts:41-48`; `LaunchCurtain.tsx:55, 194-207`; `apps/mobile/src/lib/supabase.ts:9-15`.
- **Neden yavaş olabilir:** Tema, açılış türü ve oturum ayrı asenkron okumalar; açılış türü 300 ms'de gelmezse sıcak açılış bile soğuk hareketi oynar.
- **Modern uygulamalar nasıl yapıyor:** Telegram SharedPreferences'tan eşzamanlı okur; modern RN MMKV kullanır.
- **Önerilen düzeltme:** Açılışı belirleyen birkaç değer eşzamanlı depoya (MMKV ya da expo-sqlite/kv-store `getItemSync`; yeni bağımlılık, gerekçe yazılır). Telefondaki anahtar adları korunur ve taşınır.
- **İş büyüklüğü:** M
- **Yayın:** yeni build
- **Telefonda doğrulama:** Alt seviye cihazda sıcak açılışların kaçının soğuk hareketi oynattığı (ekran kaydı).
- **Etki:** düşük
- **Doğrulama notu:** Kaynak A5-7 (doğrulandı, düşük; öncelik dışı).

### B37 — Pakete ~45 MB resim gömülü

- **Nerede:** `apps/mobile/src/features/rooms/tableIconImages.ts:7, 66, 125`; `apps/mobile/assets/table-cards/` (29 MB); `apps/mobile/assets/riso/` (15 MB).
- **Neden yavaş olabilir:** Kurulum ve OTA boyutunu büyütüyor; yavaş eMMC'li telefonda kurulum ve ilk açılış uzayabilir. Çalışma anı hızına etkisi küçük.
- **Modern uygulamalar nasıl yapıyor:** Telegram, WhatsApp ve Instagram çıkartma ve duvar gibi görselleri gerektiğinde indirip disk önbelleğinde tutar.
- **Önerilen düzeltme:** Kartları Storage'a taşımak K-bölümünde; daha basit seçenek 2x çözünürlük (tuvalle karşılaştırılır).
- **İş büyüklüğü:** L
- **Yayın:** önce sunucu
- **Telefonda doğrulama:** `bundletool get-size total`; temiz kurulumdan sonraki ilk açılış kaydı.
- **Etki:** düşük
- **Doğrulama notu:** Kaynak A5-8 (doğrulandı, düşük).

## Karar gerekenler

- **K1 — Sekme dönüşünde geliş kademesini kısaltmak** (A1-1, A4-4'ün replay kaldırma kısmı, A1-4'ün "blur yalnızca ilk 200 ms" seçeneği). Her dönüşte TabScene, Dissolve ve Reveal kademesi birlikte oynuyor (`TabBar.tsx:163-180, 192-210`; `Screen.tsx:138-160, 229-240`; `Reveal.tsx:31-46`; `explore/index.tsx:152-159, 412-418, 673-675`); son satır "bir saniyeye yakın" yerine oturuyor olabilir (`stagger.max` sınırıyla daha kısa olabilir). Seçenekler: (a) kademe ve bulanıklık yalnızca sekmenin ilk açılışında, sonraki dönüşlerde 150–200 ms tek fade ya da hiç; (b) blur ve rise kalır, Reveal tekrarı ve Keşfet satır tekrarı kalkar. Etki tahmini yüksek, S, OTA. Çeliştiği: `hareket.json` → `tabSwitch`, `dissolve` ve `docs/decisions/aura-gorunum.md` (film sekme açılışını böyle çiziyor). **Tuvalden sapma, proje sahibinin kararı.** Denemek için: "Animasyonları kaldır" açıkken geçiş Instagram ile karşılaştırılır; "Animatör süre ölçeği 5x" ile katmanlar izlenir.
- **K2 — Cihaz sınıfına göre cam ve Dissolve** (A2-8, A4-6'nın düşük sınıf kısmı). `glass.ts:9-16` yalnızca SDK sürümüne bakıyor; düşük sınıfta (RAM, çekirdek, `MEDIA_PERFORMANCE_CLASS`) FROSTED ve Dissolve kapatılıp düz zemin çizilir, Telegram'ın `getDevicePerformanceClass` yaklaşımı gibi. M, yeni build. Çeliştiği: CLAUDE.md "Görünüşün kaynağı aura tuvalidir, birebir". **Tuvalden sapma, proje sahibinin kararı.**
- **K3 — Bar camını ve sohbet camlarını hareket sırasında seyreltmek** (A1-3 (2), A2-3 (b), A2-6, A4-6). Geliş, döngü ya da kaydırma sürerken camın iki karede bir güncellenmesi ya da son karesini tutması; cam bir kare geride kalır. S–M, yeni build. **Tuvalden sapma, proje sahibinin kararı.** Görünüşü değiştirmeyen kısımlar B1 ve B12'de.
- **K4 — Açılış perdesinin sabit süresi** (A5-2). Soğukta ~1,9 sn, ilk kurulumda ~2,9 sn, sıcakta ~1,1 sn (`LaunchCurtain.tsx:55-57, 166-191`; `launchMotion.ts:228-261`); hazır olsa da R1'den önce bitmez. Seçenekler: sıcak açılışta perde yok ya da 200–300 ms solma; hazırsa R0'a atlama; `SPLASH_HANDOFF_MS` kısaltma. Etki orta, S, OTA. Çeliştiği: hareket.json ve `aura.test.ts` eşitliği. **Tuvalden sapma, proje sahibinin kararı.** Önce B15 yapılmalı, yoksa perde yerine Loader görünür.
- **K5 — Perde zemininin çözünürlüğü** (A5-3'ün görsel kısmı). Zemini yarım ölçek ya da düz mürekkep + küçük lif dokusu. **Tuvalden sapma, proje sahibinin kararı.** Etki düşük.
- **K6 — Fontları native gömmek** (A5-4). Bugün `loadAsync` ile ve ThemeProvider fontlar gelene kadar null; `fonts.ts:1-5` bunun fontlar OTA ile gitsin diye bilinçli olduğunu yazıyor (`docs/SPEC_V4.md` §4.C adım 4.2). Native gömme bu kararla çelişir, yeni build ister; etki düşük (onlarca ms, perdenin altında).
- **K7 — Edge Function'larda yerel JWT doğrulama** (A6-4). `_shared/auth.ts:19-27` her çağrıda `auth.getUser`; asimetrik imza anahtarları ve `getClaims` ile ağ çağrısı kalkar (etki orta, birkaç–onlarca ms, M, önce sunucu). Çeliştiği: silinmiş/yasaklı hesabın jetonu süresi bitene kadar geçerli kalır; kural 11, ban yolları ve `signOutIfRejected` bu davranışa dayanıyor; proje ayarı üretimi de etkiler (üretim yayını proje sahibinin). `guvenlik` denetimi ve proje sahibinin kararı.
- **K8 — Sorgu önbelleğini diske yazmak** (A6-6). Soğuk açılışta Mesajlar, Keşfet, Profil ve Aktiviteler Loader'la başlıyor; persist-client ile seçili anahtarlar saklanabilir (M, OTA, yeni bağımlılık). Çeliştiği: CLAUDE.md telefonda kalan veriyi yalnızca DM önbelleği olarak tanımlıyor; arkadaş adları ve önizlemeler yeni bir gizlilik kararı. Kişisel olmayan veriyle (Keşfet mekanları) başlamak daha az tartışmalı.
- **K9 — Edge Function'ları birleştirmek ya da ısıtmak** (A6-11). 18 fonksiyon (19 değil) ayrı soğuk başlangıç ödüyor olabilir; ölçülmedi. Önce `pnpm latency`'ye soğuk ölçüm eklenir. Birleştirme "Edge Function başına tek endpoint" düzenini ve `IDEMPOTENT_CALLS` adlarını etkiler; ısınma çağrıları fatura (para) kararı. Etki düşük.
- **K10 — Masa kartlarını Storage'a taşımak** (A5-8). Açık okumalı kova yeni politika ister (kural 2, `guvenlik` denetimi); işletim ve para kararı. Etki düşük.
- **K11 — Yazıyor bilgisini tek kanala taşımak** (A4-5). Satır başına `dm_typing` yerine `inbox:` üzerinden sunucu yayını kural 9'u değiştirir. Kural içinde kalan seçenek (yalnızca görünen satırlara abonelik) B28'de.

## İyi yapılmış olanlar

- Expo SDK 57, React Native 0.86, yalnızca yeni mimari (Fabric, TurboModules); bağımlılıklar güncel, eski köprüyle çalışan kütüphane görünmüyor. Hermes varsayılan, release'te R8 ve kaynak temizleme açık.
- Sekmeler dondurulmuyor, canlı kalıyor (#279); Realtime kanalları geçişte kopmuyor, konu başına tek kanal paylaşılıyor.
- Sekme çubuğu ekranların dışında; disk, ikon ve basma hareketleri ile geliş animasyonları native driver'da.
- Buzlu cam en çok sekizde bir boyda, yalnızca örneklediği alana değen değişiklikte yenileniyor; `RenderEffect` yalnızca boy/yarıçap/doygunluk değişince kuruluyor; GlassTargetView içeriği kopyalamıyor.
- Dissolve tam boyda bulanıklaştırmıyor (0,25–0,5 ölçek), bitince düğümünü atıyor; ShadowView boxShadow yerine dokuz parça, 48 MB LRU önbellek.
- react-native-svg yaması aynı ad ve boydaki SVG'lere tek bitmap paylaştırıyor; zemin bulutları tek durağan resim; döngüler `useLoopActive` ile yalnızca odakta ve ön planda.
- DM Telegram kalıbında: `staleTime: Infinity`, yalnızca değişen sayfa (`refreshDm`), DmRow memo, telefonda önbellek ve ısıtma, outbox balonu; gelen kutusu yenilemesi saniyede bir toplanıyor.
- Fotoğraf URL'leri sunucuda ve istemcide sabit; expo-image `memory-disk` önbelleği ve `cacheKey`; sunucuda 512 px'e indirilmiş JPEG.
- Mekan sohbeti kartı yalnızca Mekan odaktayken ve dağıtılmış gecikmeyle okuyor; lobinin saati yalnızca istek beklerken saniyede bir.
- expo-updates açılışı bloklamıyor; launchGuard sistem açılış ekranını en geç 3 sn'de kaldırıyor; Sentry izleme ve PostHog yaşam döngüsü olayları kapalı.
- 5xx sonrası yalnızca idempotent çağrılar yeniden gönderiliyor; ayarlar ve sohbet tepkileri iyimser; bölge Frankfurt.

## Atılanlar

- "Yanlış" işaretli bulgu yok; bütün bulgular rapora alındı. Aşağıdaki alt iddialar doğrulayıcılarca düzeltildi:
- A6-7: "Profil sekmesi art arda iki istek atıyor" yanlış; useProfile kökte yüklü (B7'de düzeltildi).
- A5-4: "Oturum okuması fontları bekliyor" yanlış; `startSessionSync` ThemeProvider dışında (B15, K6).
- A5-5: "MapLibre Keşfet'in ilk açılışında yükleniyor, sekme geçişini uzatıyor" yanlış; expo-router route'ları açılışta değerlendiriyor, maliyet açılışta (B29).
- A4-1: "Her ChatBubble baştan çiziliyor" büyük ihtimalle yanlış; React Compiler alt ağacı önbellekliyor (B18).
- A6-11: Fonksiyon sayısı 19 değil 18 (K9).
