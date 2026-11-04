# Temizlik listesi (3 Kasım 2026)

Kod temizliği denetimi: eski sürümlerden kalan ve artık kullanılmayan her şey. Bu belge yalnızca listeler; hiçbir şey silinmedi ve değiştirilmedi. Taban: main `5b74fe1` (#403).

**Yöntem.** knip 5 geçici olarak çalıştırıldı (`pnpm dlx knip@5`, yapılandırması repoya girmedi; expo eklentisi `app.config.ts`'i yükleyemediği için kapalıydı). Her bulgu ayrıca grep'le denetlendi. tr.ts anahtarları ve tema nesnelerinin alanları TypeScript AST'siyle çıkarılıp uygulama, betik ve E2E metniyle karşılaştırıldı. Dinamik erişimler (`tr.x[...]`, `KIT[scheme]`, `AURA[scheme]`, `SPACING[n]`, `${testID}-cancel`, `` `vampir_${action}` ``, require haritaları) ayrıca arandı. Veritabanında Supabase çalıştırılmadı; liste `_shared/pure/database.ts` ve migration metninden çıkarıldı.

**Güven.** **kesin**: hiçbir yerde referansı yok (yorum ve belge dışında), dinamik yol da yok. **büyük olasılık**: tam yolu hiçbir yerde geçmiyor ama adı başka bir yerde geçiyor ya da başka bir yolla okunabilir. **belirsiz**: bugün kullanılmıyor ama ürün belgesi geri geleceğini söylüyor ya da eski istemci uyumluluğu var.

**Durum (3 Kasım):** A1 #405, A2 #407, A3 #409 ve A4 (bu belgenin düzeltmeleri) uygulandı; #406 ile A1 arasındaki `VenueTags` kırığı #408'de düzeldi. B doğrulandı (sonucu B bölümünün sonunda); C ve D açık.

**Proje sahibinin kararı** ile işaretlenenler değişmez kurala dokunuyor, ürün belgesiyle çelişiyor ya da üretimi etkiliyor.

---

## 1. Mobil kod (apps/mobile/app, src, modules)

### 1.1 Hiçbir yerden import edilmeyen dosyalar (13 dosya, 1.888 satır)

Hepsi knip'te "unused file". Ayrıca dosya adı uygulama, betik, E2E ve testlerde arandı: geçtiği yerler yalnızca yorum ve belge (karşılarında yazılı).

| Dosya                                            | Satır | Kanıt                                                                                                                           | Güven |
| ------------------------------------------------ | ----- | ------------------------------------------------------------------------------------------------------------------------------- | ----- |
| `apps/mobile/src/theme/venueScene.ts`            | 1048  | Hiç import yok; yalnızca `docs/PROGRESS.md` bahsediyor. Mekan sayfasının eski sahnesi (masa, kankiler, Kinshi/Krot posterleri). | kesin |
| `apps/mobile/src/components/ListRow.tsx`         | 141   | Yalnızca ölü `VenueTags.tsx` import ediyor; `ListCard.tsx`'teki geçiş bir yorum.                                                | kesin |
| `apps/mobile/src/components/Chips.tsx`           | 134   | Import yok; `ChatBubble.tsx`'teki "Chips" başka bir ad (`ReactionChips`).                                                       | kesin |
| `apps/mobile/src/components/Toggle.tsx`          | 116   | Import yok; geçişler `onToggle` prop'u.                                                                                         | kesin |
| `apps/mobile/src/features/explore/VenueTags.tsx` | 101   | Import yok; `ExploreMap.tsx` ve `scripts/build-icons.ts`'teki geçişler yorum.                                                   | kesin |
| `apps/mobile/src/components/LiveDot.tsx`         | 85    | Yalnızca ölü `VenueTags.tsx` import ediyor.                                                                                     | kesin |
| `apps/mobile/src/lib/useCollapseOnScroll.ts`     | 72    | Hiç referans yok (yerine `HidingHeadScreen`).                                                                                   | kesin |
| `apps/mobile/src/theme/capsulePacks.ts`          | 68    | Hiç referans yok.                                                                                                               | kesin |
| `apps/mobile/src/components/GradientFill.tsx`    | 42    | Hiç referans yok.                                                                                                               | kesin |
| `apps/mobile/src/components/GlyphDisc.tsx`       | 27    | Yalnızca ölü `VenueTags.tsx` import ediyor.                                                                                     | kesin |
| `apps/mobile/src/aura/MarkDisk.tsx`              | 25    | Import yok; yalnızca `docs/design/aura/aktarim-v75-eksik-hal.md` bahsediyor.                                                    | kesin |
| `apps/mobile/src/theme/rowPress.ts`              | 21    | Yalnızca ölü `ListRow.tsx` import ediyor.                                                                                       | kesin |
| `apps/mobile/src/theme/svgStop.ts`               | 8     | Yalnızca ölü `GradientFill.tsx` import ediyor.                                                                                  | kesin |

### 1.2 Hiç kullanılmayan export'lar (dosyada da okunmuyor)

knip'in "unused export" listesinden, tanımlandığı dosyada da adı bir daha geçmeyenler (gerçekten ölü kod). Testler knip'te giriş noktasıydı: buradakileri test de kullanmıyor.

| Yer                                                                             | Ne                                                                                                                                                                                                                                     | Güven |
| ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| `apps/mobile/src/features/games/GameCard.tsx:25`, `:63`, `:148`, `:163`, `:171` | `GAME_ORDER`, `GameCard`, `gameCardState`, `GameGrid`, `GameCell` (≈150 satır). Dosyadan yalnızca `GAME_GLYPH` (`activities.tsx:26`) okunuyor; oyun kartının yerini `features/rooms/PosterCard.tsx` aldı (aynı adlı `GameCard` orada). | kesin |
| `apps/mobile/src/features/games/GameStage.tsx:29`, `:63`                        | `useStageRoom`, `GameStage` (tam ekran oyun ve sohbet paneli). Dosyadan yalnızca `StageFit` okunuyor (`sahtekar/Sahtekar.tsx:13`).                                                                                                     | kesin |
| `apps/mobile/src/components/Glyph.tsx:12`, `:24`, `:31`, `:46`, `:55`           | `BellIcon`, `MARKER_IMAGES`, `PIN_IMAGES`, `HALO_IMAGE`, `KindIcon`. Yalnızca `TYPE_PIN_IMAGES` ve oyun glifleri okunuyor. Görselleri §4.2'de.                                                                                         | kesin |
| `apps/mobile/src/theme/eventCovers.ts:7`, `:9`                                  | `EVENT_COVER_HEIGHT`, `EVENT_COVERS` (iki büyük satır içi SVG). Dosyadan yalnızca `CoverKind` tipi okunuyor (`EventCard.tsx:12`).                                                                                                      | kesin |
| `apps/mobile/src/theme/vampir.ts:132`, `:146`, `:151`                           | `ROLE_ICON`, `CROSS_SVG`, `PEEK_SVG`                                                                                                                                                                                                   | kesin |
| `apps/mobile/src/theme/tokens.ts:331`, `:339`                                   | `TABLE_CARD`, `VENUE_CHAT_CARD`                                                                                                                                                                                                        | kesin |
| `apps/mobile/src/theme/introScene.ts:189`, `:786`                               | `INTRO_BLINK_OPEN`, `INTRO_COLORS`                                                                                                                                                                                                     | kesin |
| `apps/mobile/src/theme/glass.ts:33`                                             | `PANEL_GLASS`                                                                                                                                                                                                                          | kesin |
| `apps/mobile/src/theme/switch.ts:14`                                            | `THUMB_SHADOW` (yalnızca ölü `Toggle.tsx` okuyordu)                                                                                                                                                                                    | kesin |
| `apps/mobile/src/theme/kankiMotion.ts:255`                                      | `KANKI_STILL`                                                                                                                                                                                                                          | kesin |
| `apps/mobile/src/theme/ThemeProvider.tsx:78`                                    | `themeFor`                                                                                                                                                                                                                             | kesin |
| `apps/mobile/src/aura/kit.tsx:229`, `:1059`                                     | `RowAlign`, `Disk`                                                                                                                                                                                                                     | kesin |
| `apps/mobile/src/aura/Buddy.tsx:134`                                            | `buddyWidth`                                                                                                                                                                                                                           | kesin |
| `apps/mobile/src/aura/Peek.tsx:102`                                             | `Behind` (`LiquidGlass.tsx`'teki `blursBehind` başka ad)                                                                                                                                                                               | kesin |
| `apps/mobile/src/aura/Scene.tsx:60`                                             | `Crew`                                                                                                                                                                                                                                 | kesin |
| `apps/mobile/src/components/ChatScreen.tsx:1092`                                | `useComposerGlass`                                                                                                                                                                                                                     | kesin |
| `apps/mobile/src/components/IconButton.tsx:153`                                 | `SlidersGlyph`                                                                                                                                                                                                                         | kesin |
| `apps/mobile/src/components/Loader.tsx:113`                                     | `MissMark`                                                                                                                                                                                                                             | kesin |
| `apps/mobile/src/features/capsule/look.ts:113`                                  | `nextPart`                                                                                                                                                                                                                             | kesin |
| `apps/mobile/src/features/friends/queries.ts:77`, `:88`                         | `useSentVenueChatRequests`, `useSentFriendRequests`                                                                                                                                                                                    | kesin |
| `apps/mobile/src/features/games/GameBits.tsx:176`                               | `RoleNote`                                                                                                                                                                                                                             | kesin |
| `apps/mobile/src/features/onboarding/SignupFriend.tsx:73`                       | `SignupFriend` bileşeni (dosyadan yalnızca `FriendReaction` tipi okunuyor)                                                                                                                                                             | kesin |
| `apps/mobile/src/features/profile/ProfileCard.tsx:269`                          | `ProfileHero`                                                                                                                                                                                                                          | kesin |
| `apps/mobile/src/lib/afterTransition.ts:56`                                     | `lastRows`                                                                                                                                                                                                                             | kesin |
| `apps/mobile/src/lib/haptics.ts:56`                                             | `useRequesterHaptic`                                                                                                                                                                                                                   | kesin |

Bunlara ek olarak 13 tip export'u ölü (`GameCategory` `PosterCard.tsx:32`, `AuraScheme` `aura.ts:9`, `SvgGradient` `gradient.ts:11`; sunucu tarafındakiler §5.3'te).

### 1.3 Yalnızca `export` sözcüğü fazla olanlar (değer dosyanın içinde kullanılıyor)

Silinmez; yalnızca `export` kalkabilir. Düşük değerli, toplu tek PR'a uygun. Mobilde 39 dosyada 82 değer, ayrıca 147 tip.

<details><summary>Liste (dosya: adlar)</summary>

- `aura/kit.tsx`: FrostOf
- `components/AppIcon.tsx`: capIconName
- `components/CapsuleAvatar.tsx`: capsuleAst
- `components/ChatScreen.tsx`: useChatJump, useChatBar
- `components/ListCard.tsx`: CardPressContext
- `components/Wordmark.tsx`: WORDMARK_MIN_HEIGHT
- `components/game/GameButton.tsx`: GAME_BUTTON_HEIGHT
- `features/account/useProfile.ts`: profileQueryKey
- `features/capsule/look.ts`: nameOf
- `features/capsule/motion.ts`: valueAt
- `features/chat/BlockedList.tsx`: useBlocks
- `features/checkin/spots.ts`: venueSpotsQueryKey
- `features/checkin/useActiveTable.ts`: activeTableQueryKey
- `features/explore/useExploreVenues.ts`: useExploreVenues, useVenueCities
- `features/games/GameBits.tsx`: URGENT_SECONDS
- `features/games/TurnReady.tsx`: TURN_CIRCLE_MIN
- `features/games/ibre/Ibre.tsx`: NEEDLE_MIN, NEEDLE_MAX, DialColumnContext, Dial
- `features/games/say/Say.tsx`: OBJECTIONS_PER_TABLE, OBJECTION_WINDOW_MS, ObjectionsLeft
- `features/games/vampir/RoundTable.tsx`: PEEK_CARD_SVG
- `features/games/vampir/VampirPlay.tsx`: vampirKeys, Note
- `features/profile/ProfileCard.tsx`: BadgeIcon, Badges
- `features/profile/queries.ts`: profileViewQuery
- `features/rooms/IncomingRequest.tsx`: useTableScreenOpen
- `features/rooms/queries.ts`: TABLE_ROOM_COLUMNS
- `lib/afterTransition.ts`: FIRST_ROWS
- `lib/drawLab.ts`: DRAW_STEP_MS, labOff
- `lib/signupFriend.ts`: FRIEND_REST
- `lib/usePhoto.ts`: stablePhotoUrl
- `theme/chatWallpaper.ts`: WALL_TILE
- `theme/gameColors.ts`: CHIP_ALPHA
- `theme/glass.ts`: ANDROID_BLUR_SDK
- `theme/gradient.ts`: svgGradient
- `theme/introScene.ts`: INTRO_JUMP_MS, INTRO_CONFETTI_COUNT, INTRO_SHAPE
- `theme/launchMotion.ts`: LAUNCH_WORD_WIDTH, seg, spring, overlapOf
- `theme/markMotion.ts`: EASE_IN_OUT, spring
- `theme/sceneGradient.ts`: GLOW_END, glowCss
- `theme/vampirArt.ts`: tableSvg, MEDAL_FILL, medalSvg, TABLE_TIMES, SAND_TONES

</details>

### 1.4 Yalnızca tasarım önizlemesinden açılan oyun ekranları (belirsiz, proje sahibinin kararı)

Kişilerin masasında bugün yalnızca Vampir Köylü oynanıyor; mobil (`src/lib/api.ts`) `tabu`, `harf`, `sarki`, `ibre`, `sahtekar` ve `sohbet` fonksiyonlarından hiçbirini çağırmıyor. Şu dosyalar yalnızca `src/features/design/previews.tsx` (Ayarlar → Tasarım (test), `app/(app)/design-preview.tsx`, görsel kapı `app/gorsel.tsx`) ve birbirleri tarafından import ediliyor: `features/games/ibre/Ibre.tsx`, `say/Say.tsx`, `sahtekar/Sahtekar.tsx`, `sahtekar/Seat.tsx`, `FirstGameIntro.tsx`, `RematchButton.tsx`, `TimeUpOverlay.tsx`, `TurnReady.tsx`, `GameBits.tsx`, `GameStage.tsx` (toplam 2.513 satır).

SPEC_V4 §4.F ve kural 3: oyunlar her biri 4.6.x adımıyla kişi bazlı döner (pilot: Kapsül Anlat 4.6.1, Sahtekar 4.6.3). Bu ekranlar o adımın başlangıç noktası olabilir. **Proje sahibinin kararı**: 4.6.x'te yeniden mi yazılacak (o zaman silinir), üstüne mi kurulacak (o zaman kalır).

### 1.5 v46 ve eski bileşen göçünden kalanlar

`docs/decisions/v46-sokme.md`'deki her madde uygulanmış: `src/ui`, `theme/parts.generated.ts`, `tokens.generated.ts`, `v46Type`, `v46Fonts`, `v46Gallery`, `keyframeCurve`, `scripts/v46`, `scripts/build-tokens.ts`, `app/(app)/v46-gallery.tsx`, `features/gallery/` repoda yok; `src/` içinde `v46` geçen tek yer yorumlar. Göçten kalan ölü parçalar §1.1'deki `ListRow`, `Chips`, `Toggle`, `LiveDot`, `GlyphDisc`, `VenueTags`, `GradientFill` (v46'nın satır, çip, anahtar ve canlı nokta bileşenleri) ve §1.2'deki eski `GameCard`.

### 1.6 Hiçbir route'tan açılmayan ekran

Yok. Her `app/**` dosyası ya bir `router.push`/`href` ile, ya `initialRouteName` ile (`(auth)/welcome`, `(onboarding)/consents`), ya sekme olarak (`activities`) ya da derin bağlantıyla (`gorsel`, görsel kapı) açılıyor. `modules/skall-glass`'ın dört görünümü ve `setLightNavigationBar` kullanılıyor.

---

## 2. tr.ts: koddan okunmayan metin anahtarları

1.354 yaprak anahtar tarandı. Bir anahtar okunuyor sayıldı: tam yolu (`tr.a.b`) geçiyorsa, bir atası dinamik okunuyorsa (`tr.explore.buckets[...]` gibi 26 yer), bir atası bütün olarak veriliyorsa ya da `const x = tr.a` takma adıyla okunuyorsa. Tarama `apps/mobile`, `scripts` ve `e2e` metnini kapsadı (testler dahil).

### 2.1 Kesin okunmayan (228 anahtar): ne tam yolu ne de yaprak adı hiçbir yerde geçiyor

Satır numaraları `apps/mobile/src/i18n/tr.ts`'te.

- `signup` (1): chooseGender(267)
- `messages` (1): yesterday(318)
- `activities` (1): sheetLine(348)
- `explore` (1): eventShort(486)
- `friends` (8): requestsAndHistory(524), newRequests(531), incomingTitle(538), noIncoming(539), sentTitle(545), sentAccepted(547), historyTitle(548), historyRow(551)
- `notifications` (12): requestRest(581), friendsNow(582), acceptedRest(583), acceptedMeta(584), matchRest(585), matchMeta(586), inviteRest(587), invitePastRest(588), inviteMeta(589), inviteJoined(591), inviteGone(592), inviteDeclined(593)
- `capsule` (1): worn(626)
- `profile` (9): seenAs(668), seenAsLead(669), nickNote(671), nickNoteWait(672), nickRefresh(673), editShort(684), photoPrivacy(709), badgesTitle(711), badgeCount(713)
- `participation` (13): anonymousHint(732), profileHint(734), profileNeedsName(735), memberAnonymousHint(737), memberProfileHint(738), previewJoinTitle(744), previewTag(745), previewLobby(746), previewJoin(747), previewMember(749), photoNeededLobby(751), photoNeededJoin(752), photoNeededMember(753)
- `home` (1): checkIn(758)
- `checkin` (10): locationTitle(762), venuesTitle(775), noVenues(776), distance(778), venueAtSpot(785), headcountTitle(786), headcountOption(787), headcountHint(788), doneTitle(790), doneBody(791)
- kök: `conceptWithMode` (798), `voiceNote` (802)
- `rooms` (44): playWithTable(808), lobbyEmptyTitle(810), playWithTableHint(811), lobbyEmptyOpen(813), lobbyLoading(814), lobbyError(815), lobbyTitle(816), roomCount(817), requestMember(822), peopleAndPhones(824), phonesAndPeople(826), runningHint(829), versus(831), memberBody(832), tellLeader(834), tellLeaderBody(835), incomingMemberTitle(837), incomingMemberBody(838), mySide(842), otherSide(843), leaderTag(844), peopleNote(846), leaveHandover(848), leaveConfirmLeader(851), leaveConfirmMember(853), newLeader(855), spotHere(859), otherSpot(860), requestPending(861), requestUnavailable(862), createConfirm(874), withGuest(883), withOther(885), waitingForGuest(886), endHint(888), tabsLabel(891), tabGames(892), tabChat(893), unreadChat(894), peopleStrip(895), peopleAll(896), incomingTitle(899), incomingBody(900), viewPeople(920)
- `chat` (2): counter(930), jumpDown(976)
- `venueChat` (10): asProfile(987), asProfileOn(988), asProfileOff(989), modeTitle(992), modeAnonymousHint(993), modeProfileHint(994), writingAnonymous(995), writingProfile(996), messageMenu(998), sentAccepted(1033)
- `safety` (8): blockWho(1051), reportWho(1052), blockOwnMember(1053), blockLeaves(1055), reportNote(1056), blockedTitle(1057), blockedSince(1059), otherOffline(1061)
- `venue` (6): yourTable(1516), rerollName(1532), rerollsLeft(1533), chatCard(1547), chatNew(1551), openTable(1555)
- `table` (6): tabGames(1570), peopleTag(1574), tabChat(1580), categoryAll(1581), minPeople(1590), allGames(1591)
- `settings` (5): accountSection(1878), birthDateHint(1882), notificationsSection(1893), legalSection(1896), deleteConfirmBody(1900)

Eski taraf modelinin ve iki masalı oyunun metinleri (oyun 4.6.x'te kişi bazlı döner; metinler o adımda yeniden yazılır, bunlar tarafların ve önerinin dili). Güven: kesin okunmuyor; silmek için 4.6.x'i beklemek gerekmez, ama oyun adımının yazarı bakmak isteyebilir:

- `games` (51): sohbetFirst(1064), sohbetNext(1065), sohbetWait(1066), localIntro(1068), startTurn(1071), forbiddenLabel(1072), taboo(1075), scores(1076), playAgain(1079), proposeTitle(1081), proposeHint(1082), propose(1083), proposalMine(1084), proposalTheirs(1085), acceptProposal(1086), declineProposal(1087), notAccepted(1088), soloHint(1091), lastGameTabu(1095), lastGameOther(1097), turnEyebrow(1099), passesLeft(1100), passDetail(1101), correctPoints(1106), tabooPoints(1107), turnOverWait(1108), voiceIntro(1109), sohbetIntro(1110), voiceDescribe(1111), tapToReveal(1113), hideFromTeam(1114), cardsLoading(1115), voiceJudge(1116), judgeCorrect(1117), judgeTaboo(1118), teammateNote(1122), cardWithDescriber(1123), cardWithDescriberHint(1124), describing(1126), voiceWinner(1127), voiceDraw(1128), cardOnlyHere(1129), coopIntro(1131), coopDescribe(1132), coopGuess(1134), coopCardHidden(1135), teamScore(1136), lastGameTeam(1137), turnSummaryTitle(1181), signedPoints(1182), turnPointsLine(1183)
- `say` (11): yourTurn(1203), theirTurn(1204), teamTurn(1205), roundWon(1208), objectionPoint(1215), roundEnd.timeout(1216), roundEnd.board(1216), roundNoPoint(1217), readyHint(1218), readyWaitingHint(1219), pickLetter(1220)
- `ibre` (12): readyHint(1242), readyWaitingHint(1243), teamLocks(1247), teamClue(1248), otherClue(1249), sideTitle(1250), sideHint(1251), sideWaiting(1252), describerTurn(1253), sideTurn(1254), roundTitle(1255), revealDetail(1256)
- `sahtekar` (8): ownTable(1314), memberTitle(1316), memberBody(1317), otherTable(1319), ownDone(1320), redealt(1321), votesDone(1324), notEnough(1325)
- `vampir` (5): moreVoters(1331), holdTitle(1360), holdNote(1361), yourRole(1362), cardHint(1363)

### 2.2 Büyük olasılık okunmayan (84 anahtar): tam yolu hiçbir yerde yok, yaprak adı başka bir yerde geçiyor

Yaprak adları genel sözcükler (`title`, `body`, `back`…), başka nesnelerde geçtikleri için kesin denemez. Silmeden önce anahtar başına bir grep yeter.

- `app` (1): name(160)
- `activities` (12): tabu.body(389), tabu.steps(390), sahtekar.body(399), sahtekar.steps(400), harf.body(409), harf.steps(410), sarki.body(419), sarki.steps(420), ibre.body(430), ibre.steps(431), sohbet.body(440), sohbet.steps(441)
- `friends` (6): unread(532), declineNote(544), sent(546), people(553), done(570), back(571)
- `profile` (1): report(722)
- `participation` (5): title(730), anonymous(731), profile(733), photoNeeded(740), previewTitle(743)
- `home` (3): title(756), hint(757), settings(759)
- `checkin` (1): continue(792)
- `rooms` (11): profiled(818), people(819), requestJoin(820), phones(823), runningTitle(828), peopleTitle(841), youTag(845), leave(847), leaveConfirmTitle(850), requestTitle(897), sendRequest(898)
- `chat` (3): title(924), show(925), hide(926)
- `venueChat` (4): title(982), hint(983), you(997), sent(1032)
- `games` (11): themes(1067), team(1069), round(1070), correct(1073), pass(1074), winner(1077), draw(1078), soloTitle(1090), start(1093), secondsLeft(1102), you(1120)
- `say` (3): round(1202), team(1206), roundEnd.objection(1216)
- `ibre` (3): round(1241), clueHint(1244), lock(1245)
- `sahtekar` (1): dealing(1323)
- `vampir` (1): alive(1467)
- `venue` (2): spot(1523), noSpot(1524)
- `table` (10): more(1566), games(1572), category(1582), taglines.tabu(1610), taglines.ibre(1611), taglines.sahtekar(1612), taglines.harf(1613), taglines.sarki(1614), taglines.sohbet(1615), nameLabel(1633)
- `createTable` (3): hint(1648), nameLabel(1650), failed(1659)
- `gameParts` (1): badge(1874)
- `settings` (2): notifyDm(1894), about(1906)

### 2.3 Belirsiz (2)

- `table.gameCategories.teams` ve `.multi` (`tr.ts:1608`): `tr.table.gameCategories` bütün olarak okunuyor; hangi alanın gösterildiği veriye bağlı (`PosterCard.tsx` → `category`). Kalır.

---

## 3. Tema (src/theme)

`KIT`, `AURA` tema adıyla dinamik okunduğu için (`KIT[scheme]`, `AURA[scheme]`) alanlar yaprak adıyla arandı: bir alan okunuyor sayıldı, uygulama kodunda (tanımı dışında) `.ad` ya da `['ad']` olarak geçiyorsa. `SPACING` için `SPACING[n]` arandı. Testteki kullanım sayılmadı.

| Yer                                                                    | Alan                                                                                                                          | Güven                                                 |
| ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `apps/mobile/src/theme/auraKit.ts:321`, `:347`                         | `KIT[s].bubble.mekan`, `KIT[s].chatShadow.mekan`                                                                              | büyük olasılık                                        |
| `apps/mobile/src/theme/auraKit.ts:360`, `:369`, `:397`                 | `partOn`, `meShadow`, `eventGround`                                                                                           | kesin                                                 |
| `apps/mobile/src/theme/auraKit.ts:505`–`508`                           | `endInk`, `endInkDark`, `stage` (`diskRadius`, `diskBottom`)                                                                  | kesin                                                 |
| `apps/mobile/src/theme/auraKit.ts:573`, `:616`–`625`                   | `KIT.size.faceCard`, `partTile`, `partCapsule`, `partTileHeight`, `partCapsuleDrop`, `partRing`, `profilePadY`, `profilePadX` | kesin                                                 |
| `apps/mobile/src/theme/auraKit.ts:690`, `:691`, `:705`, `:743`, `:748` | `KIT.size.msgPadX`, `msgPadY`, `consentMin`, `pillPadX`, `heroWords`                                                          | kesin                                                 |
| `apps/mobile/src/theme/aura.ts:48`                                     | `AURA[s].blobs` (bulutlar `AURA` dışında çiziliyor olabilir; yalnızca yaprak adıyla arandı)                                   | büyük olasılık                                        |
| `apps/mobile/src/theme/aura.ts:95`, `:251`, `:270`, `:273`             | `AURA[s].card.radiusSm`, `say.buddy`, `table.tableTop`, `table.buddy`                                                         | büyük olasılık                                        |
| `apps/mobile/src/theme/tokens.ts:259`                                  | `SPACING[0]`                                                                                                                  | kesin (zararsız, ölçeğin parçası; dokunmamak da olur) |
| `apps/mobile/src/theme/tokens.ts:282`                                  | `OPACITY.onCover`, `OPACITY.coverPlate` (v44 etkinlik kapağının)                                                              | kesin                                                 |
| `apps/mobile/src/theme/tokens.ts:331`–`339`                            | `TABLE_CARD` (5 alan), `VENUE_CHAT_CARD.veil` (§1.2)                                                                          | kesin                                                 |
| `apps/mobile/src/theme/tokens.ts:297`, `:340`                          | `MAP_PIN.shadow`, `MAP_FONTS.regular`                                                                                         | kesin                                                 |

**Dokunulmaz:** `MOTION.springs.morph`, `morphBack` (`aura.ts:318`–`319`) ve `MOTION.idle.blinkClosed` (`:343`) uygulamada okunmuyor ama `MOTION` `hareket.json`'ın aynasıdır ve `aura.test.ts` eşitliği denetler (CLAUDE.md → Kod kuralları). Kaynak `hareket.json` değişmedikçe kalır.

Ölü tema dosyaları §1.1'de (`venueScene.ts`, `capsulePacks.ts`, `rowPress.ts`, `svgStop.ts`), ölü export'lar §1.2'de.

---

## 4. Görseller ve fontlar (apps/mobile/assets, 52 MB, 428 dosya)

Bir dosya kullanılıyor sayıldı: adı (`@2x`/`@3x` eki atılarak) bir `require(...)`'da ya da `app.json`'da geçiyorsa.

### 4.1 Hiçbir yerde require edilmeyenler

| Dosya                                                                                                           | Boyut    | Kanıt                                                                                                                                                | Güven                                                        |
| --------------------------------------------------------------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `apps/mobile/assets/game-card/{kinshi,krot,signum}.webp`                                                        | 114 KB   | require yok; uygulama `assets/riso/game-*.webp`'yi kullanıyor (`PosterCard.tsx:20`–`22`). `scripts/art/posters.ts` bu adları üretir.                 | büyük olasılık (üretici betik yeniden yazabilir, önce betik) |
| `apps/mobile/assets/game-poster/{kinshi,krot,signum}.webp`                                                      | 67 KB    | aynı                                                                                                                                                 | büyük olasılık                                               |
| `apps/mobile/assets/riso/buddies/riso_1e1bef.webp`                                                              | 33 KB    | require yok; diğer kankiler `ProfileCard.tsx:71`'de tek tek require ediliyor                                                                         | kesin                                                        |
| `apps/mobile/assets/launch/{beyaz-doku,mor-doku,pembe-doku,parilti-yarimton,harf-s,harf-k,harf-a}-{1,2,3}.webp` | ≈ 6,5 MB | require yok ama `scripts/build-launch-textures.ts` (`pnpm launch:textures`) bunlardan `kirpik-*`'i keser; README "kaynaktır" diyor. Bundle'a girmez. | **dokunma** (üretici kaynağı)                                |
| `apps/mobile/assets/icon/play-512.png`, `icon/mark.svg`                                                         | 548 KB   | `pnpm icons` üretir; Play listesi ve önizleme için                                                                                                   | dokunma                                                      |
| `apps/mobile/assets/vampir/table/manifest.json`                                                                 | 1 KB     | `vampirArt.test.ts:13` ve `scripts/art/vampirTable.ts` okur                                                                                          | dokunma                                                      |
| `apps/mobile/assets/fonts/Roboto-OFL.txt`                                                                       | 4 KB     | font lisansı                                                                                                                                         | dokunma                                                      |
| `apps/mobile/assets/launch/README.md`, `table-cards/masa-adlari.md`                                             | —        | belge. README "PNG kopyası png/ altında" diyor, `png/` yok: satır eskimiş                                                                            | (belge düzeltmesi)                                           |

### 4.2 Yalnızca ölü koddan require edilenler

| Dosyalar (1x/2x/3x)                                                                                                                   | Boyut  | Okuyan ölü kod                                            | Güven                                                                                                  |
| ------------------------------------------------------------------------------------------------------------------------------------- | ------ | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `apps/mobile/assets/art/{tabu,sohbet,impostor,letters,song,needle}*.png` (18)                                                         | 124 KB | yalnızca `GameCard.tsx:35` → `ART` (§1.2, ölü `GameCard`) | kesin                                                                                                  |
| `apps/mobile/assets/glyph/{bell,marker-cafe,marker-campus,halo,kind-cafe,kind-campus}*.png`, `assets/pin/pin-{cafe,campus}*.png` (24) | 28 KB  | yalnızca `Glyph.tsx`'in ölü export'ları (§1.2)            | kesin; `scripts/build-icons.ts` ve `scripts/build-pins.ts` bunları yeniden üretir, betikten de çıkmalı |

Fontların hepsi (`fonts.ts`) kullanılıyor.

---

## 5. Sunucu (supabase/functions)

### 5.1 Mobilin çağırmadığı action'lar

Her fonksiyonun `case` ve `z.literal` listesi `apps/mobile/src` ve `app`'teki action dizgileriyle karşılaştırıldı (`api.ts` tek çağrı yeri; `vampir`'in `` `vampir_${action}` ``'ı ayrıca okundu).

**Zorunlu güncelleme kapısı:** `_shared/http.ts:91`–`99` → her istekte `MIN_APP_BUILD`'den eski build'e `update_required`. `docs/OPS.md:58`: `MIN_APP_BUILD` ilk production AAB'ye kadar ayarsız (kapı açık). Yani kapı bugün eski kurulumları durdurmuyor; eski istemci uyumluluğu aşağıdaki saplamalarla sağlanıyor.

| Fonksiyon / action                                                                 | Yer                                            | Bugün ne yapıyor                                                                                                         | Silinebilir mi                                                                                                              | Güven                    |
| ---------------------------------------------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| `checkin` → `reroll-alias`                                                         | `checkin/index.ts:179`                         | `update_required` saplaması (eski istemci)                                                                               | `MIN_APP_BUILD` bu action'ı gönderen son build'in üstüne çekildikten sonra. **Proje sahibinin kararı** (üretim).            | kesin (mobil çağırmıyor) |
| `rooms` → `create-solo`, `propose-game`, `answer-game`                             | `rooms/index.ts:264`–`267`, girdisi `:60`      | `update_required` saplaması; öneri alanları yalnızca `bad_request` yerine `update_required` duyulsun diye ayrıştırılıyor | Aynı koşul. Kural 3'ün "eski istemciden gelen çağrısı `update_required` alır" cümlesine dokunur: **proje sahibinin kararı** | kesin                    |
| `rooms` → `shuffle`                                                                | `rooms/index.ts:372`                           | canlı (`rooms_shuffle`)                                                                                                  | Hayır: SPEC_V4 §4.F, satır 551 ("Karıştır", `rooms/shuffle`); istemcisi takım oyunlarıyla gelecek                           | belirsiz, dokunma        |
| `tabu` → `turn-cards`, `begin-turn`, `end-turn` (ve `mark`)                        | `tabu/index.ts:53`, `:75`, `:84`               | canlı RPC, ama `start` `update_required` (`:49`–`51`) olduğundan yeni oyun açılamaz: ulaşılamaz                          | 4.6.x'te oyun kişi bazlı dönünce. **Proje sahibinin kararı** (kural 3)                                                      | büyük olasılık ölü       |
| `ibre` → `target` (ve diğerleri)                                                   | `ibre/index.ts:62`, kapı `:52`–`54`            | aynı                                                                                                                     | aynı                                                                                                                        | büyük olasılık ölü       |
| `sahtekar` → `said`, `guess` (ve diğerleri)                                        | `sahtekar/index.ts:54`, `:76`, kapı `:44`–`46` | aynı                                                                                                                     | aynı (Sahtekar pilot oyunu, 4.6.3)                                                                                          | belirsiz                 |
| `harf`, `sarki` (`_shared/say.ts`) → `begin`, `claim`, `object`, `said`, `advance` | `_shared/say.ts:51`–`53`                       | aynı                                                                                                                     | aynı                                                                                                                        | büyük olasılık ölü       |
| `sohbet` → tümü                                                                    | `sohbet/index.ts:21`                           | her çağrı `update_required`                                                                                              | 4.6.x'te                                                                                                                    | belirsiz                 |
| `sms` → `netgsm`                                                                   | `sms/index.ts`                                 | SMS kancası (Supabase Auth çağırır, mobil değil)                                                                         | Hayır                                                                                                                       | dokunma                  |

`docs/PROGRESS.md` (1 Kasım devir notu): oyunların taraf SQL'i "bırakılan kolonları okuyor; çağrılırsa 500 döner". Yani yukarıdaki canlı görünen oyun action'ları `start` kapısı olmasa da çalışmaz.

### 5.2 `_shared/pure` içinde kullanılmayan modüller

| Dosya                                                     | Kanıt                                                                                                                                   | Güven |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| `supabase/functions/_shared/pure/localTabu.ts` (84 satır) | Yalnızca kendi testi (`localTabu.test.ts`) import ediyor. MVP'nin tek telefonlu Tabu'su.                                                | kesin |
| `supabase/functions/_shared/pure/presence.ts` (17 satır)  | Hiç import yok. İki masalı modelin "Diğer masanın bağlantısı koptu" süresi (`OFFLINE_GRACE_MS`); `tr.safety.otherOffline` da okunmuyor. | kesin |

### 5.3 `_shared/pure` içinde ölü export'lar

| Yer                                                                                  | Ne                                                                                                                                                                                                  | Güven                    |
| ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| `_shared/pure/checkin.ts:4`                                                          | `TABLE_SESSION_HOURS`                                                                                                                                                                               | kesin                    |
| `_shared/pure/rooms.ts:30`                                                           | `GAME_PROPOSAL_TTL_SECONDS` (öneri modeli kalktı)                                                                                                                                                   | kesin                    |
| `_shared/pure/sohbet.ts:6`                                                           | `SOHBET_NEXT_COOLDOWN_MS`                                                                                                                                                                           | kesin                    |
| `_shared/pure/friends.ts:24`                                                         | `DM_PAGE_SIZE`: kullanılmıyor, çünkü mobil kendi kopyasını tutuyor (`features/friends/queries.ts:234`, `const DM_PAGE_SIZE = 50`). Silmek yerine mobil paylaşılanı okumalı (kopya tutulmaz kuralı). | kesin (bulgu: kopya)     |
| `_shared/pure/api/checkin.ts:61`                                                     | tip `RerollAliasResponse`                                                                                                                                                                           | kesin                    |
| `_shared/pure/api/games.ts:57`, `:58`                                                | tipler `HarfRequest`, `SarkiRequest`                                                                                                                                                                | büyük olasılık (4.6.x)   |
| `_shared/pure/api/rooms.ts:153`                                                      | tip `ProposeGameResponse`                                                                                                                                                                           | kesin                    |
| `_shared/pure/gameFrame.ts:7`, `notifications.ts:12`, `profile.ts:11`, `rooms.ts:18` | tipler `TableGameId`, `NotificationKind`, `Participation`, `Visibility`                                                                                                                             | kesin (yalnızca export)  |
| `_shared/pure/database.ts:3831`                                                      | `Constants`                                                                                                                                                                                         | dokunma (üretilen dosya) |

Yalnızca `export`'u fazla olan 21 değer (`age.ts` → `ADULT_AGE`, `MAX_AGE`, `formatIsoDate`; `capsule.ts` → `NICK_PREFIX`, `NICK_FULL_SHARE`; `concepts.ts` → `CONCEPT_MODES`; `emojiOnly.ts` → `EMOJI_ONLY_MAX`; `errors.ts` → `DOMAIN_ERROR_CODES`; `explore.ts` → `ACTIVITY_BUCKETS`, `SINGLE_VENUE_MAX`; `exploreMap.ts` → `STACK_M`, `STACK_PREFIX`; `ibre.ts` ve `sayChallenge.ts` → `otherSide`; `notifications.ts` → `NOTIFICATION_KINDS`; `profile.ts` → `PARTICIPATIONS`, `PHOTO_FOLDER`; `rooms.ts` → `VISIBILITIES`; `sahtekar.ts` → `allViewed`; `tabu.ts` → `TURN_CUE`; `venueChat.ts` → `VENUE_CHAT_ACTIVE_MINUTES`; `webhookSignature.ts` → `WEBHOOK_TOLERANCE_SECONDS`) ve `_shared/http.ts` → `json`, `_shared/testBots.ts` → `testBotsHere`: silinmez, `export` kalkabilir.

---

## 6. Veritabanı

Kaynak: `database.ts` (43 public tablo, 1 view, 116 public fonksiyon) ve 63 migration. Bir fonksiyon kullanılıyor sayıldı: bir Edge Function, mobil ya da betik `rpc('ad')` ile çağırıyorsa ya da migration metninde tanımı, `grant`/`revoke`/`drop` dışında adı geçiyorsa. `private` şemasının fonksiyonları ayrıntılı taranmadı (tiplerde yoklar); ayrı bir iş.

| Ne                                                                                                                                                                                                                                                                                                                                                                                                         | Kanıt                                                                                                                                      | Güven                                                                                                                    |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| `public.tabu_local_deck`, `ibre_local_deck`, `say_local_deck`, `sahtekar_local_deck` (`20261025090000_team_games.sql` ve öncesi)                                                                                                                                                                                                                                                                           | Hiçbir `rpc` çağrısı yok, migration'larda tanım dışında adı geçmiyor, testlerde de yok. Tek telefonlu (tek masalı) eski oyunların destesi. | kesin. **Proje sahibinin kararı** (migration ve üretim; oyunlar 4.6.x'te dönerken kullanılmayacakları doğrulanmalı)      |
| `public.nearby_venues`, `public.venue_distance_m` (`20260926090000_venues_and_table_sessions.sql`)                                                                                                                                                                                                                                                                                                         | Yalnızca `supabase/tests/checkin.test.ts` çağırıyor; uygulama ve fonksiyonlar çağırmıyor (Keşfet elle seçim, kural 6).                     | büyük olasılık; check-in'in mesafe denetimi bunları SQL içinde kullanmıyor mu, silmeden önce `check_in` gövdesi okunmalı |
| Taraf modelinin oyun fonksiyonları: `tabu_turn_cards`, `tabu_mark`, `tabu_begin_turn`, `tabu_end_turn`, `ibre_begin`, `ibre_lock`, `ibre_side`, `ibre_target`, `ibre_advance`, `say_begin`, `say_claim`, `say_object`, `say_advance`, `sahtekar_view`, `sahtekar_said`, `sahtekar_options`, `sahtekar_vote`, `sahtekar_guess`, `sahtekar_advance` (ve `private` tarafında `open_turn`, `start_voice_tabu`) | Edge Function'lar çağırıyor ama `start` kapısı yüzünden ulaşılamıyor; PROGRESS (1 Kasım): bırakılan kolonları okuyor, çağrılırsa 500.      | belirsiz. **Proje sahibinin kararı**: SPEC_V4 §4.F'ye göre her biri kendi 4.6.x adımıyla gider                           |
| `public.tabu_turns`, `public.room_used_cards` tabloları                                                                                                                                                                                                                                                                                                                                                    | Yalnızca yukarıdaki oyun fonksiyonları okuyor/yazıyor (`room_used_cards`'ı `scripts/seed/sections.ts` de siliyor)                          | belirsiz, aynı karar                                                                                                     |

Okunmayan ya da yazılmayan tablo, kolon ve view bulunmadı: 43 tablonun hepsi bir SQL fonksiyonunda ya da Edge Function'da okunuyor; kolon taramasında (adı migration'larda en çok üç kez, TypeScript'te hiç geçmeyen kolon) tek aday `reports.venue_chat_message_id` çıktı, o da mekan sohbeti şikayetinin kaydı (yazılıyor, panelden okunur): dokunma. `my_join_requests` view'ı mobil tarafından okunuyor. Mekan sohbetinin `venue_chat_profiled`'ı 4.8b'de (`20261119090000_v4_cleanup.sql:431`) zaten kalktı.

---

## 7. content/

Her dosya `scripts/seed` tarafından okunup seed ediliyor; `games.json`, `table-icons.json`, `capsule-catalog.json`, `aliases-tr.json` ve `profanity-tr.json` ayrıca `_shared/pure`'dan okunuyor.

| Dosya                                                                                                                                         | Durum                                                                                                                                                        | Güven   |
| --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------- |
| `content/tabu-cards.json` (59 KB), `harf-categories.json`, `sarki-words.json`, `ibre-scales.json`, `sahtekar-words.json`, `sohbet-cards.json` | Seed ediliyor ama okuyan oyunların hiçbiri bugün başlatılamıyor (§5.1). SPEC_V4 §4.A: "İçerik havuzları yeterlidir ve yeni yazılmaz"; 4.6.x'te kullanılacak. | dokunma |
| Kalanı                                                                                                                                        | kullanılıyor                                                                                                                                                 | —       |

Kullanılmayan içerik dosyası yok.

---

## 8. E2E ve testler

- Maestro'nun aradığı 186 testID'nin hepsi uygulamada var: 184'ü düz dizgi, `preview-confirm-ok-cancel` `ConfirmSheet.tsx:43` → `` `${testID}-cancel` `` ile, `appearance-${SCHEME}` şablonla. Eksik testID yok.
- 17 akışın hepsi koşuyor: 13'ü shard'larda ya da `p0.yaml`'da, `login-code.yaml` ve `about-you.yaml` `01-login.yaml`'dan, `table-end-close.yaml` `05`, `06` ve `13`'ten, `spot-kutuphane.yaml` `shard-4.yaml`'dan çağrılıyor. Koşmayan akış yok.
- 174 test dosyasının hepsi `vitest.config.ts` ya da `vitest.integration.config.ts`'in bir `include` desenine giriyor; hiçbirinde `.skip`, `.only`, `.todo` yok, hepsinde en az bir `expect` var.
- Ölü kodu denetleyen test: `supabase/functions/_shared/pure/localTabu.test.ts` (yalnızca ölü `localTabu.ts`'i sınar, §5.2). Kesin; modülle birlikte gider.
- `docs/FIELD_TEST.md` artık olmayan akışlara atıf yapıyor (§10).

---

## 9. Bağımlılıklar

| Paket                                                                     | Kanıt                                                                                                                                                                                                  | Güven                                                                                                                                                                                     |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/mobile/package.json:29` → `expo-keep-awake`                         | Uygulamada hiçbir import, `useKeepAwake` ya da `activateKeepAwake` yok. Ama `docs/SPEC_V3.md:990`, `:1002`: "Oyun sürdüğü sürece (Sohbet kartları dahil) açık". Ya özellik kayboldu ya da paket fazla. | kesin kullanılmıyor. **Proje sahibinin kararı**: ekranı açık tutma geri mi gelsin (Vampir'de), yoksa paket ve SPEC satırı mı kalksın. Native modül build'de durur; kaldırmak build ister. |
| `expo-system-ui`, `expo-splash-screen`, `expo-build-properties`           | knip "unused" dedi ama: `app.json` plugin'leri (`:29`, `:70`) ve `userInterfaceStyle: automatic` Android'de `expo-system-ui` ister                                                                     | dokunma                                                                                                                                                                                   |
| `expo-linking`, `react-native-worklets`, `@types/geojson`, `@types/react` | import yok ama expo-router'ın, Reanimated 4'ün ve tiplerin eş bağımlılığı                                                                                                                              | dokunma                                                                                                                                                                                   |
| kök `deno`, `@fontsource/bangers`, `opentype.js`                          | knip "unused" dedi ama `deno` CLI olarak (`pnpm typecheck`, `lint`), `@fontsource/bangers` dosya yoluyla `scripts/art/posters.ts:22` kullanıyor                                                        | dokunma                                                                                                                                                                                   |
| `supabase/functions/_shared/deps.ts`                                      | `createClient` ve `z` kullanılıyor                                                                                                                                                                     | dokunma                                                                                                                                                                                   |
| `patches/react-native-svg@15.15.4.patch`                                  | `nativeID "svgc:…"` paylaşılan resim önbelleği; `src/lib/svgKey.ts` ve 5 dosya kullanıyor                                                                                                              | gerekli, dokunma                                                                                                                                                                          |

Kullanılmayan başka paket bulunmadı.

---

## 10. Belgeler ve tasarım

Belgelerde backtick içinde geçen dosya yolları repoyla karşılaştırıldı. `docs/decisions/` tarih tutar (eski yolları doğal); yalnızca bugünkü kuralı ya da yordamı anlatan belgeler listelendi.

| Belge                                                                            | Eskimiş içerik                                                                                                                                                                                                                                                                                       | Güven                                                                                                       |
| -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `docs/OPS.md:15`                                                                 | `pnpm icons` maddesi: "`src/ui/VenueGlyph.tsx`" ve "sekme çubuğu v46'nın SVG'leriyle `src/ui/`'da çizilir"; `src/ui` söküldü (`v46-sokme.md`)                                                                                                                                                        | kesin                                                                                                       |
| `docs/OPS.md:89`                                                                 | örnek etiket `tabu/mark`: çalışıyor ama bugün ulaşılamayan bir action; örnek `rooms/create` gibi canlı bir action olmalı                                                                                                                                                                             | büyük olasılık                                                                                              |
| `docs/FIELD_TEST.md:287`, `305`, `318`, `334`, `351`, `368`, `432`, `507`, `587` | "Otomatik" satırları olmayan akışlara atıf yapıyor: `04-room-tabu.yaml`, `13-teams.yaml`, `open-lobby-accept.yaml`, `06b-tabu-coop.yaml`; repoda yoklar (bugünkü akışlar `04-table.yaml`, `13-join-table.yaml`). Saha testi belgesi taraf modelinin oyunlarını (iki masa, takımlar, Tabu) anlatıyor. | kesin (atıflar); belgenin kendisi 4.6.x'e göre yeniden yazılmalı                                            |
| `docs/FIELD_TEST.md:683`                                                         | `scripts/latency/room-load.sql` yok (`scripts/latency/` içinde `measure.ts`, `stats.ts`)                                                                                                                                                                                                             | kesin                                                                                                       |
| `docs/design/sistem/README.md:57`                                                | tablo `scripts/v46/` ve `src/ui`'yi gelecek iş gibi anlatıyor; satır "söküldü, 30 Ekim" diyor, yani yalnızca kapanmış iş                                                                                                                                                                             | büyük olasılık (bilgi amaçlı, zararsız)                                                                     |
| `docs/SPEC_V4.md` §4.C (satır 210–215)                                           | `src/ui/TabBar.tsx`, `src/ui/PullScroll.tsx`, `src/ui/FieldError.tsx`, `src/ui/VenueRow.tsx` yolları; bugün `src/components/` ve `src/aura/`. Satır 13–17'de `docs/design/v43–v45` "kaldırıldı, git geçmişinde" diye doğru anılıyor.                                                                 | kesin (yol atıfları); ürün belgesi olduğu için **proje sahibinin kararı** değil ama aynı PR'da belirtilmeli |
| `docs/SPEC_V3.md`                                                                | 80 eski yol (`LocalTabu.tsx`, `VoiceTabu.tsx`, `09-sahtekar.yaml`…); SPEC_V4'ün değiştirmediği konular için geçerli belge, oyun bölümleri SPEC_V4 §4.F'yle eskidi                                                                                                                                    | belirsiz; dokunma (Grep ile okunan tarihçe niteliğinde)                                                     |
| `apps/mobile/assets/launch/README.md`                                            | "aynı dosyaların PNG kopyası png/ altında": `png/` yok                                                                                                                                                                                                                                               | kesin                                                                                                       |
| `CLAUDE.md`                                                                      | eski yol yok (yakalanan `account/set-gender`, `rooms/request-profile` gibi atıflar fonksiyon/action adı, doğru)                                                                                                                                                                                      | —                                                                                                           |

Tasarım: `docs/design/aura/` (6,1 MB), `docs/design/sistem/` (2,8 MB), `docs/design/kaynak/` (940 KB) ve `docs/design/vampir/yuvarlak-masa.html` kod ve betiklerden okunuyor (`capIcons`, `tableIcons`, `hareket.json`, `vampirTable`). `docs/design/aura/film/` ve `blobs.json` filmin ve tuvalin kaynağı (`docs/decisions/aura-gorunum.md:16`–`18`). Uygulanmış aktarım raporları (`aktarim-31.md`, `aktarim-35-mekan.md`, `aktarim-37-checkin.md`, `aktarim-v65*.md`, `aktarim-v71-fark.md`, `aktarim-v75-eksik-hal.md`, `aktarim-v76-2kasim.md`) yordamın parçası; tamamlananlar `docs/arsiv/`'e taşınabilir. Kodda karşılığı kalmamış pano: `docs/design/aura/aktarim-v75-eksik-hal.md`'deki `MarkDisk` (bileşeni ölü, §1.1). Panoların tek tek koda eşlenmesi bu taramada yapılmadı (tuval canlı artifact'te). Belirsiz.

---

## 11. CI ve araçlar

- `.github/workflows` (`apk`, `ci`, `deploy-dev`, `dev-live`, `e2e`, `pages`) altındaki her betik ve dosya yolu var.
- `.claude/hooks/guard.mjs`, `format.mjs` `.claude/settings.json`'dan çağrılıyor; `guard.d.mts` `scripts/claude-hooks.test.ts`'in tipi. Altı skill ve üç ajan CLAUDE.md'den anılıyor.
- `scripts/` altında `package.json`'da, bir workflow'da ya da başka bir betikte adı geçmeyen üç betik var. Üçü de elle çalıştırılan üretici; başlıklarında nasıl çalıştırıldıkları yazıyor ve ürettikleri dosya uygulamada kullanılıyor:
  - `scripts/build-pins.ts` → `assets/pin/*.png` (`Glyph.tsx:29` anıyor). Dokunma; ama ölü `pin-cafe`/`pin-campus`'ı da üretiyorsa §4.2 ile birlikte düzelir.
  - `scripts/art/groundDark.ts` → `assets/aura/ground-dark.webp`. Dokunma.
  - `scripts/art/vampirCards.ts` → `assets/vampir/<rol>.webp`. Dokunma.
- Kök `package.json`'daki her betik `scripts/package.json`'da bir girdiye denk geliyor; v46'nın `pnpm tokens`'ı ikisinden de kalkmış.

Koşmayan workflow ya da çağrılmayan betik bulunmadı.

---

## Öneri sırası

### A. Güvenle silinebilecekler (paketler; her biri tek PR, native yok, OTA)

**Paket A1: ölü mobil dosyalar ve görselleri** (13 madde)

1. `src/theme/venueScene.ts`
2. `src/components/ListRow.tsx` ve `src/theme/rowPress.ts`
3. `src/components/Chips.tsx`
4. `src/components/Toggle.tsx` ve `theme/switch.ts` → `THUMB_SHADOW`
5. `src/features/explore/VenueTags.tsx`, `components/LiveDot.tsx`, `components/GlyphDisc.tsx`
6. `src/lib/useCollapseOnScroll.ts`
7. `src/theme/capsulePacks.ts`
8. `src/components/GradientFill.tsx` ve `src/theme/svgStop.ts`
9. `src/aura/MarkDisk.tsx`
10. `GameCard.tsx`'in ölü bileşenleri (`GAME_GLYPH` kalır) ve `assets/art/*` (18 dosya)
11. `Glyph.tsx`'in ölü export'ları ve görselleri (24 dosya); `scripts/build-icons.ts` ve `build-pins.ts`'ten de çıkar
12. `GameStage.tsx` → `GameStage`, `useStageRoom` (`StageFit` kalır)
13. `assets/riso/buddies/riso_1e1bef.webp`

**Paket A2: ölü export'lar ve tema alanları** (12 madde)

1. §1.2 tablosunun kalanı (`aura/kit`, `Buddy`, `Peek`, `Scene`, `ChatScreen`, `IconButton`, `Loader`, `look`, `friends/queries`, `GameBits.RoleNote`, `SignupFriend` bileşeni, `ProfileHero`, `afterTransition.lastRows`, `useRequesterHaptic`)
2. `theme/eventCovers.ts` → `EVENT_COVERS`, `EVENT_COVER_HEIGHT`
3. `theme/vampir.ts` → `ROLE_ICON`, `CROSS_SVG`, `PEEK_SVG`
4. `theme/tokens.ts` → `TABLE_CARD`, `VENUE_CHAT_CARD`, `OPACITY.onCover`/`coverPlate`, `MAP_PIN.shadow`, `MAP_FONTS.regular`
5. `theme/introScene.ts` → `INTRO_BLINK_OPEN`, `INTRO_COLORS`; `glass.ts` → `PANEL_GLASS`; `kankiMotion.ts` → `KANKI_STILL`; `ThemeProvider.tsx` → `themeFor`
6. `KIT`'in kesin ölü alanları (§3 tablosu, "kesin" olanlar)
7. `_shared/pure/presence.ts`
8. `_shared/pure/localTabu.ts` ve testi
9. `_shared/pure` → `TABLE_SESSION_HOURS`, `GAME_PROPOSAL_TTL_SECONDS`, `SOHBET_NEXT_COOLDOWN_MS`
10. `pure/api` tipleri `RerollAliasResponse`, `ProposeGameResponse`
11. Mobil `DM_PAGE_SIZE` kopyası → `@shared/friends.ts`'ten okunur
12. §1.3 ve §5.3'teki fazla `export` sözcükleri (davranış değişmez)

**Paket A3: tr.ts** (tek madde, büyük): §2.1'in oyun dışı anahtarları (141), ardından oyun anahtarları (87). Oyun anahtarlarını 4.6.x'in yazarına bırakmak da olur.

**Paket A4: belgeler** (5 madde): `OPS.md:15` ve `:89`, `FIELD_TEST.md`'deki akış ve `room-load.sql` atıfları, `SPEC_V4.md` §4.C'deki `src/ui/` yolları (PR'da belirtilerek), `assets/launch/README.md`'nin `png/` satırı.

### B. Önce doğrulanması gerekenler

1. §2.2'nin 84 tr anahtarı: anahtar başına grep.
2. `AURA[s].blobs`, `card.radiusSm`, `say.buddy`, `table.tableTop`, `table.buddy`, `KIT.bubble.mekan`, `chatShadow.mekan`: bulutları ve sahneleri çizen yerler okunarak.
3. `assets/game-card/*` ve `assets/game-poster/*` (`kinshi`, `krot`, `signum`): `scripts/art/posters.ts`'in çıktı yolu okunmalı; betik yazıyorsa önce betik.
4. `public.nearby_venues`, `public.venue_distance_m`: `check_in` ve Keşfet SQL'i bunları dolaylı çağırıyor mu.
5. `private` şemasının fonksiyonları: bu taramada yok; ayrı bir SQL taraması (yerel Supabase'de `pg_proc` ve `pg_depend`).

**B'nin sonucu (3 Kasım, Paket B).**

1. §2.2'nin 84 anahtarı: hiçbirinin tam yolu (`tr.<yol>`), ön eki bütün nesne ya da dinamik erişim (`tr.<ön ek>[…]`) olarak, ne de `tr` bütün olarak uygulamada, betiklerde ve E2E'de geçmiyor. 84'ü ve boş kalan nesneleri (`app`, `home`, `activities.<oyun>`, `say.roundEnd`) silindi.
2. Tema:
   - `AURA[s].blobs` silindi: bulutlar `AuraBackground.tsx`'te tek resim (`assets/aura/ground-light.webp`, `scripts/aura/ground.ts` `ground.html`'den çizer, `AURA`'yı okumaz). Onunla `AuraBlob`, `cloud`, `CLOUD_BLUR`, `AURA.frame`, `AURA.blur` (okuyan yok) gitti.
   - `card.radiusSm`, `say.buddy` silindi (okuyan yok). `AURA.table`'ın hiçbir alanı okunmuyordu (`tableTop`, `buddy` dahil), bütünü silindi.
   - **Kalır:** `KIT.bubble[s].mekan` ve `KIT.chatShadow.mekan`: `ChatBubble.tsx` → `paint[kind]` ve `KIT.chatShadow[kind]`, `kind` `'dm' | 'mekan' | 'masa'` (`useChatKind`); tip için de gerekli.
3. Görseller: `scripts/art/posters.ts` yalnızca `assets/game-poster/`'e yazar; `game-card/`'a yazmaz, onu okuyan da yok (yalnızca betiğin yorumu). `game-card/` (6 dosya, 260 KB) silindi. `game-poster/` için uygulama yalnızca `sprengja` ve `kaupholl`'u okur (`PosterCard.tsx`; diğerleri `assets/riso/game-*.webp`): `vampir`, `signum`, `kinshi`, `krot` silindi, betiğin `POSTERS`'ı iki postere indi, çizimleri ve ölü `bat` yardımcısı çıktı.
4. `public.nearby_venues`, `public.venue_distance_m`: yerel DB'de hiçbir fonksiyonun gövdesi, politika, view ya da `pg_depend` kaydı bunlara bağlı değil; `check_in` `venue_contains`'i çağırır (`checkin/index.ts:103`). Yalnızca `supabase/tests/checkin.test.ts` çağırıyor; `nearby_venues` `authenticated`'a açık. Proje sahibinin onayıyla (3 Kasım) `20261122090000_drop_unused_venue_rpcs.sql` ile silindi; testleri `checkin.test.ts`'ten çıktı.
5. `private` şemasının 141 fonksiyonundan 12'sini hiçbir şey çağırmıyor (yerel DB: başka fonksiyonun gövdesi, tetikleyici, politika, view, varsayılan, kısıt, `cron.job` ve `pg_depend`; ayrıca Edge Function, betik, test ve `config.toml` metni):
   - **Kalır:** `before_user_created` (`config.toml` → `[auth.hook.before_user_created]`, Auth kancası).
   - Taraf modeli (C.3 kararına bağlı): `start_voice_tabu`, `start_sahtekar`, `start_say`, `start_ibre`, `deal_sohbet`, `tabu_close_card`, `phone_side`.
   - Eski sürümlerden kalan, proje sahibinin onayıyla (4 Kasım) `20261123090000_drop_unused_private_fns.sql` ile silindi: `end_friendship` (son çağıran `20261005090000_friends_dm.sql`'deki eski gövdeler), `end_two_sided_room(uuid)` (`20261101090000_reveal_cleanup.sql`), `owns_session` (`20260930090000_reveal.sql`'deki politika gitti; `authenticated`'a hâlâ `execute` verili), `pair_key` (`20261026090000_team_reveal.sql`).

### C. Proje sahibinin kararı

1. `expo-keep-awake`: SPEC_V3 oyun sırasında ekranı açık tutar diyor, kod tutmuyor. Geri mi gelsin, paket ve satır mı kalksın?
2. `update_required` saplamaları (`checkin/reroll-alias`, `rooms/create-solo`, `propose-game`, `answer-game`): `MIN_APP_BUILD` üretimde ayarlanıp bu çağrıları gönderen build'lerin üstüne çekilmeden silinmez; kural 3'e dokunur.
3. Taraf modelinin oyunları (Edge Function action'ları, `*_local_deck` dahil SQL, `tabu_turns`, `room_used_cards`, mobil önizleme ekranları §1.4): her biri kendi 4.6.x adımıyla mı gitsin, yoksa toplu bir temizlik paketi mi olsun.

### D. Dokunulmaması gerekenler

- `MOTION`'un okunmayan alanları (`hareket.json` aynası, `aura.test.ts`).
- `assets/launch/*` kaynak dokuları (`pnpm launch:textures` girdisi), `icon/play-512.png`, `icon/mark.svg`, `vampir/table/manifest.json`, `fonts/Roboto-OFL.txt`.
- `content/`'in oyun havuzları (SPEC_V4: yeni yazılmaz, 4.6.x'te kullanılır).
- `rooms/shuffle` (SPEC_V4 §4.F'de, istemcisi gelecek), `sms/netgsm` (Auth kancası).
- `patches/react-native-svg@15.15.4.patch`, config plugin paketleri ve eş bağımlılıklar.
- Elle çalışan üreticiler (`scripts/build-pins.ts`, `scripts/art/groundDark.ts`, `scripts/art/vampirCards.ts`).
- Üretilen dosyalar (`database.ts` → `Constants`, `*.generated.ts`).
- `docs/decisions/` ve `docs/arsiv/` (tarih).
