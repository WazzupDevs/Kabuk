# Pano–kod denetimi, grup 02 (13 pano)

Notlar: Pano değerleri skall.css + ekran.css + koyu.css + pano içi `<style>` ile çözüldü. Kod değerleri `KIT.size.*`, `SETTINGS`, `FLAT`, `MESSAGES`, `ACTIVITIES`, `GIFT_CARD`, `KIT.layer.size.*` ve `tr.ts` ile sayıya kadar çözüldü. Kapsül ikonlarının iç çizgileri (SVG yolları) tek tek karşılaştırılmadı: yalnız ad ve boy. Telefonun alt güvenli alanı panoda 34 sabit; koddaki değer cihaza bağlı olduğundan alt boşluklar için DOĞRULANAMADI yazıldı. Ortak parçalar (sayfa üstü, dialog, sekme çubuğu, küçük düğme) ilk geçtiği panoda tam yazıldı.

## 03o Ayarlar · Hesabı sil onayı — project/AyarHesapSil.dc.html
Kod: app/(app)/settings-account.tsx; src/motion/Dialog.tsx; src/components/OverlayHost.tsx; src/lib/overlayStore.ts; src/features/settings/SettingsParts.tsx; src/aura/kit.tsx (RowList, Li, Btn)
Öğe sayısı: 30 · uyuyor: 11 · fark: 17 · fazla: 1 · doğrulanamadı: 2
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 15 | dialog ikon diski rengi (açık) | renk | `--danger-soft` #FBE1DB | `dialogDisc` rgba(214,64,40,.10) ≈ #FBECE9 (auraKit.ts:1160) |
| 18 | dialog dikey yeri | düzen | `top:280` sabit | ekranda ortalı (Dialog.tsx `root` justifyContent center); içerik ≈350 yüksekse üst ≈247 |
| 20 | DOĞRULANAMADI | — | ikon iç çizgileri (telefon, pasta, kilit) | CapIcon'da `phone`, `cake`, `lock` adları var mı doğrulanmadı (yalnız chat, logout, trash kullanılıyor) |
| 21 | DOĞRULANAMADI | — | dialogun alt boşluğu/yerleşim 390×844'te | cihaz güvenli alanı bağlı |

## 03p Gizlilik · Engellenenler — project/Engellenenler.dc.html
Kod: app/(app)/settings-blocked.tsx; src/features/chat/BlockedList.tsx; src/features/settings/SettingsParts.tsx (SettingsPage, Lede, Group, PersonRow)
Öğe sayısı: 19 · uyuyor: 11 · fark: 7 · fazla: 0 · doğrulanamadı: 1
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | satır alt satırı | metin/özellik yok | "Profilli", "Profilli", "Anonim adı" (kimlik türü) | `tr.common.ago(...)` zaman ("5 dk", "Dün"…) (BlockedList.tsx:61). `blocks` seçimi yalnız `blocked_alias, created_at` okuyor (BlockedList.tsx:23): profilli/anonim bilgisi istemcide yok → ÖZELLİK YOK (sunucuda alan gerekir) |
| 2 | anonim satırın yüzü | resim | anonim kişi için kapsül kanki resmi 44 (blob 89846870…, 192×192) | `Av` ile baş harf dairesi (BlockedList.tsx:58). Kapsül görünüşü blocks'ta yok |
| 4 | "Engeli kaldır" yüksekliği | ölçü | `.ur .btn` 34 | `Btn sm` 36 (KIT.size.btnSm, auraKit.ts:856) |
| 7 | yüz renkleri (baş harf) | renk | satır başına sabit renk (#2C63D6, #E2456F) | `Av` adın harfinden renk seçiyor; eşleşme DOĞRULANAMADI |
| — | uyuyor | — | zemin düz, geri 44, başlık 21/700, lede 14/20 muted + 2 üst boşluk, liste 12 üstte, satır min 64, gap 12, çizgi 56'dan rgba(3,27,11,.10), yüz 44, ad 600 16/20 | SettingsPage plain+inline, Lede, PERSON_HAIR 56 |

## 03q Gizlilik · Engellenenler boş — project/EngellenenlerBos.dc.html
Kod: settings-blocked.tsx; BlockedList.tsx; src/components/EmptyState.tsx (Empty, RISO_FULL)
Öğe sayısı: 8 · uyuyor: 4 · fark: 4 · fazla: 0 · doğrulanamadı: 0
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | resim boyu | ölçü | 120×98 (blob c86d6437…, png 360×294: bahçe kapısı) | `riso="blocked"` RISO_FULL 150×103 (EmptyState.tsx:68-73, 130-140; yalnız `messages/search/dm` RISO_BOARD'da). Depo dosyası assets/riso/empty-blocked.webp 640×440: panodaki 360×294 ile en-boy oranı farklı (1.45 – 1.22) |
| 4 | başlık/metin | metin | "Engellediğin kimse yok" / "Birini engellediğinde burada görünür, engeli de buradan kaldırırsın." | aynı ✓ (tr.ts:2841-2842) — uyuyor |

## 03r Gizlilik · Sessize alınanlar — project/SessizAlinanlar.dc.html
Kod: app/(app)/settings-muted.tsx; SettingsParts.tsx
Öğe sayısı: 14 · uyuyor: 8 · fark: 5 · fazla: 0 · doğrulanamadı: 1
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 4 | profilli yüz | resim | baş harf dairesi (#0B783D "K") | `look` yoksa `Av` baş harf — uyuyor; anonimde `LookAvatar` kapsül ✓ uyuyor |
| 5 | lede metni | metin | uyuyor | tr.ts:2834-2835 ✓ |
| 6 | DOĞRULANAMADI | — | baş harf renkleri | bkz. 03p #7 |

## 03s Gizlilik · Sessize alınanlar boş — project/SessizAlinanlarBos.dc.html
Kod: settings-muted.tsx; EmptyState.tsx
Öğe sayısı: 8 · uyuyor: 4 · fark: 4 · fazla: 0 · doğrulanamadı: 0
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | resim | resim/ölçü | 120×98 (blob 4661361e…, png 360×294: megafon) | 150×103, webp 640×440 (empty-muted) (bkz. 03q #1) |
| 4 | metinler | metin | uyuyor | tr.ts:2843-2844 ✓ |

## 03t Yasal metin (4 belge aynı şablon) — project/YasalMetin.dc.html
Kod: app/privacy.tsx, kvkk.tsx, terms.tsx, rules.tsx, app/(app)/legal/[doc].tsx; src/components/LegalText.tsx; docs/legal/*.md
Öğe sayısı: 14 · uyuyor: 3 · fark: 11 · fazla: 2 · doğrulanamadı: 1
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 10 | gövde metni | metin | "…6698 sayılı KVKK kapsamındaki bilgilendirme…", "2. İşlenen veriler", "Bize ulaşmak için: support@skall.world" tek paragraf | docs/legal/gizlilik-politikasi.md: "…(KVKK)…", "2. Kısaca", ayrı paragraf. Pano örnek metin; gerçek md ile birebir değil (içerik kaynağı md) |
| 12 | tablo/liste blokları | fazla | panoda yok | tablo yığın satırları, liste (LegalText.tsx:98-150) panoda çizilmemiş → FAZLA (belgede var) |
| 13 | DOĞRULANAMADI | — | koyu sayfa zemini #000 | Screen koyu zemini AURA.dark.ground; plain olmadığı için bulut |

## 04 Bildirimler — project/Bildirimler.dc.html
Kod: app/(app)/notifications.tsx; src/components/RouteSheet.tsx; SheetCard.tsx; aura/Peek.tsx; theme/flatLists.ts; theme/messages.ts (peek)
Öğe sayısı: 45 (alttaki Mesajlar sayfası 22 dahil) · uyuyor: 24 · fark: 14 · fazla: 2 · doğrulanamadı: 2
Alttaki Mesajlar ekranı (başlık, 2 yuvarlak, arama, seg, Sabitlenenler, 5 satır, Arşivlenenler, sekme çubuğu) başka grupta; burada yalnız örtü ve sayfa.
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | sayfa yüzeyi | renk | `.glass`: gradyan rgba(255,255,255,.80→.54), 1px glass-line, gölge 0 18 44 rgba(4,73,35,.10) (koyuda #121614 düz) | düz #FFFFFF `KIT.layer.light.sheet`, gölge 0 −8 40 .18 (auraKit.ts:1186; SheetCard.tsx:73,128) |
| 2 | tutamak | ölçü | 40×4, sayfa üstünden 12 | 40×5 (grabH 5), sayfa üstünden 10 (sheetPadTop) (auraKit.ts:1042,1052-1054) |
| 3 | başlık satırı | düzen | `.nh` üstten 12 (tutamaktan): "Bildirimler" `.title` 21/27 600 solda, "Tümünü okundu say" (600 14/18, accent, padding 8 0) aynı satırda sağda; kapatma düğmesi yok | başlık altında tutamaktan 10; sağda 38'lik kapatma yuvarlağı (RouteSheet `closeButton` varsayılan true, notifications.tsx'te kapatılmamış); "Tümünü okundu say" ayrı satırda, "YENİ" etiketiyle aynı hizada (notifications.tsx:131-145) |
| 4 | "YENİ" etiketi üst boşluğu | boşluk | `.sl` her zaman 18 üst, 4 alt | ilkinde 0 üst (notifications.tsx:255-257, `first`) |
| 5 | satır gövde yazısı | yazı | `.nt p` 500 15/20 | `T v="body"` 15/22 (notifications.tsx:~228) |
| 6 | "Bak" düğmesi | boşluk | `.nr .btn.sm` padX 18 | padX 16 (btnPadXSm) |
| 7 | "Mesaj yaz" yuvarlağı | ölçü | `.sm2` 40×40, ikon md 20, accent iki renk | `Round` 44 (KIT.size.round), ikon boyu varsayılan (notifications.tsx:~288) |
| 8 | yeni nokta | uyuyor | 6×6 buzz, sol −12 | FLAT.dot ✓ |
| 9 | kanki 1 (sol) | ölçü | 64×80, left 44, sayfa üstünün 70 üstünde | 56×70, left 40, up 62 (messages.ts:32; Peek.tsx:78-85) |
| 10 | kanki 2 (sağ) | ölçü | 64×80, right 52, ayna (scaleX −1) | 56×70, right 44; ayrı resim peek-2.webp (ayna olduğu DOĞRULANAMADI) |
| 11 | sayfa yüksekliği/konumu | düzen | `top:392` sabit (sayfa 444 yüksek) | içeriğe göre, SHEET_MAX'e kadar |
| 12 | sayfa iç boşluğu | boşluk | 12 20 28 | 10 / 20 / max(4+inset, 28) |
| 13 | arka örtü | uyuyor | rgba(3,27,11,.20) `scrim` + blur 8 | KIT.layer scrim .42 açık, düz (örtü blur'suz; panoda `.scrim` ekran.css `--scrim-bg` .20 + blur 8) → FARK renk/blur: kod .42 (auraKit.ts:1164) |
| 14 | metinler | uyuyor | YENİ/ÖNCEKİ, "sana arkadaşlık isteği gönderdi", "isteğini kabul etti", "5 dk", "21 sa", "9 Kasım" | tr.ts:667-699 ✓ |
| 15 | FAZLA | fazla | yok | sayfada kapatma yuvarlağı (bkz. #3); davet satırları (Reddet, Katıl, süre) panoda bu panoda yok (MasaDavetGeldi panosu başka grupta) |
| 16 | DOĞRULANAMADI | — | tek satır varsayılanı: Bak düğmesi ile uzun ad aynı satır | 320 dp'de davranış ölçülmedi |

## 05 İstekler boş — project/IsteklerBos.dc.html
Kod: app/(app)/(tabs)/messages/index.tsx; src/features/friends/RequestList.tsx; EmptyState.tsx; aura/GlassSearch.tsx; motion/TabBar.tsx
Öğe sayısı: 22 · uyuyor: 12 · fark: 8 · fazla: 0 · doğrulanamadı: 2
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | arama alanı iç boşluğu | ölçü | `.field` padX 20 (48 yüksek) | `capsulePadX` 18 (auraKit.ts:explore.capsulePadX; GlassSearch.tsx:44) |
| 2 | boş hâl resmi | resim | blob 62c6f7b7… png 640×520, çizim 120×98 | `riso="requests"` RISO_FULL değil: `compact` → 120×83 (empty-requests.webp 640×440; RISO_SMALL, EmptyState.tsx:75-80) |
| 3 | boş hâl dikey yeri | düzen | `.emp` flex:1 ortalı, alt boşluk 190 | `flex-1 justify-center`, alt boşluk yok (RequestList.tsx:~122-132) → ortası ≈95 aşağıda |
| 4 | açıklama genişliği | ölçü | 240 | 260 |
| 5 | başlık/metin | uyuyor | "Bekleyen istek yok"/"Biri seni arkadaş olarak eklemek isterse burada görürsün." | tr.ts:344-345 ✓ |
| 6 | seg | renk | `.sg` glass gradyan + 1px glass-line + gölge 0 18 44; seçili beyaz | `tabsGlass` rgba(255,255,255,.60), kenar .90, gölge 0 10 30 .08 (activities.ts:36-40) |
| 7 | başlık, yuvarlaklar, nokta | uyuyor | 32/500, 44, nokta 9/9/10/2 | MESSAGES ✓ |
| 8 | sekme çubuğu | uyuyor | 60 yük, iç 5, tab 50, ikon 20, aralık 3, kenar 20 | AURA.tabBar ✓; alt boşluk (panoda bottom 30) kodda 12+güvenli alan → DOĞRULANAMADI |
| 9 | DOĞRULANAMADI | — | alt örtü `.fade` 150 | edgeHeight 150 ✓ (renk geçişi bakılmadı) |

## 05a Mesajlar · İstekler dolu — project/IsteklerDolu.dc.html
Kod: RequestList.tsx; RequestRowView.tsx; MasaRequests.tsx; aura/kit.tsx (Seg, Badge, Btn, Round); theme/flatLists.ts
Öğe sayısı: 52 (başlık+arama+seg+sekme 10; 3 bölüm başlığı; 6 satır × ~6 öğe; ÖNERİ rozeti) · uyuyor: 23 · fark: 24 · fazla: 1 · doğrulanamadı: 3
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | sekme sayacı rengi | renk/yazı | `.rqc` #FF4F8B zemin, yazı #fff, 700 11/1, soldan 6 | `Badge`: `colors.onBuzz` (#031B0B) yazı, 700 11/14 (kit.tsx:698-745; auraKit.ts:296) |
| 2 | satır aralığı çizgisi | eksik | `.rq+.rq:before` solda 64, sağ 0, rgba(3,27,11,.08) (koyu .08 beyaz), aynı bölümde ardışık satırlar arası | yok ("no hairline" yorumu, flatLists.ts:6; RequestRowView.tsx) |
| 3 | yüz boyu | uyuyor | `.rqa` 52 daire | LetterFace 52 ✓; ama `Avatar size="xl"` (SPACING[12]=48) kullanan profil/masa yüzleri 48 (RequestList.tsx:~190; Avatar.tsx:25) → FARK 52 vs 48 |
| 4 | ad yazısı | yazı | `.rqt p` 600 16/20 | `h3` 600 16/22 (RequestRowView.tsx:~97) |
| 5 | alt satır | yazı | `span` 500 13/17 | `fine` 13/18 |
| 6 | tarih/süre satırı | yazı | `.rqm` 500 12 (13/17 üstüne font-size 12), opaklık .8, muted | `stamp` 600 11/14 (auraKit.ts:271) |
| 7 | tarih metni | metin | "2 sa önce", "Dün", "3 gün önce", "4 gün önce" | `tr.messages.stamp`: saat ("21:08"), "Dün", kısa gün ("Per"), "14 Kas" (tr.ts:325-331; dmInbox.ts:17-24) |
| 8 | masa süresi | renk/ikon | `.tm`: #C8381F (koyu #FF977E), 700, solda 7×7 nokta, 12 yazı | `KIT.danger` renk, noktasız, 11/600 stamp (MasaRequests.tsx; RequestRowView.tsx) |
| 9 | "Reddet" yuvarlağı | ölçü | 40×40, ikon 16; koyuda #1B211F/kenar .08 | `Round` 44, ikon varsayılan (RequestRowView.tsx:~56-64) |
| 10 | "Kabul et" / "Katıl" | ölçü | `.btn.primary.rqk` 40 yüksek, padX 14, 14/18 600, gap 6, ikon 16 | `Btn sm` 36, padX 16, gap 8 (btnGap) (RequestRowView.tsx:67-75) |
| 11 | düğmeler arası | boşluk | `.rqb` gap 6 | `KIT.size.chipsGap` 8 |
| 12 | "Geri çek" | ölçü/yazı/koyu | `.rqs` 36 yüksek, padX 14, 13/16 600; koyu #1B211F/.08 | `Btn sm glassy` 36, padX 16, 14/18; koyu rgba(18,22,20,.62)/.10 |
| 13 | Masa satırı yüzü | düzen/resim | `.mqi`: 52×52 kare resim (r14, 1.5 koyu çerçeve) + sağ altta −6 ofsetli 26 daire baş harf rozeti (2px canvas kenar) | tekil katılımcı `Av size="row"` 48 daire; grup `Avatar kind="table"` 48 (MasaRequests.tsx:~175-186) |
| 14 | "Katılmak istiyor" satırı adı | metin | "Zeynep, 22" | `previewName(displayName, age)` ✓ (kontrol: tr.participation.previewName) — uyuyor |
| 15 | Masa davet satırı | metin | "Seni masasına çağırıyor", süre "1:24" | tr.ts:351 ✓, `tr.invite.clock` ✓ |
| 16 | Arkadaşlık satırı alt satırı | metin | "Uçan Halı'dan" / "Demli Sohbet'ten" / "Ortak arkadaş: Ece" (kaynak mekan veya ortak arkadaş) | her satırda sabit "Arkadaşlık isteği" (`tr.messages.requestKind`, tr.ts:343; RequestList.tsx:~187). KURAL 4: ortak arkadaş yalnızca arkadaşın profilinde (`friends/mutual`), arkadaş olmayana gösterilemez; mekan adı da gösterilmiyor (kural 4 koordinat/mekan). Karar proje sahibinin |
| 17 | Gönderdiğin başlığı yanındaki "ÖNERİ" | özellik/öneri | `.ob` rozeti: 700 10/14 ls .4, accent, bg surface2, padX 7, soldan 6 ("Gönderdiğin · 1 ÖNERİ") | bölüm kodda tam var ("Gönderdiğin · N", Geri çek, "Kabul etmesi bekleniyor"); rozet kodda yok (tasarım işareti). Pano bunu öneri sayıyor, kod uygulamış |
| 18 | "Gönderdiğin" satırı yüzü/alt satırı | uyuyor | "Selin, 23" harf yüzü, "Kabul etmesi bekleniyor" | LetterFace, tr.friends.sentKind ✓; yaş "23" kodda yok (`s.name` yalnız ad): FARK metin |
| 19 | bölüm başlığı | uyuyor | `.rqh` 700 13/18 14/4 | sectionHead ✓, R.headTop 14 / 4 ✓ |
| 20 | liste üst boşluk | uyuyor | 4 | listTop 4 ✓ |
| 21 | arama alanı ve seg | bkz. 05 #1, #6 | | |
| 22 | DOĞRULANAMADI | — | Kabul et ikonu (check, 16) boyu | Btn `icon="check"` boyu btn sm'e bağlı |
| 23 | DOĞRULANAMADI | — | yüz renkleri (#E2456F, #2C63D6, #0B783D, #C77700, #7B5CFF) | FLAT.requestFace.inks ile aynı beş renk ✓ ama seçim kuralı (addan) panoda yok |
| 24 | DOĞRULANAMADI | — | 320 dp / büyük yazı | RequestRowView `narrow` ile düğmeleri alta alıyor; panoda tanım yok |

## 06 Arkadaşlar — project/Arkadaslar.dc.html
Kod: app/(app)/(tabs)/profile/friends.tsx; GlassSearch.tsx; ProfileFace; motion BarBack/StickyField; theme/flatLists.ts
Öğe sayısı: 36 (geri, başlık, alt başlık, arama+ikon+metin, kanki resmi, 5 satır × 5, sekme çubuğu) · uyuyor: 18 · fark: 10 · fazla: 0 · doğrulanamadı: 2
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | başlık | yazı | `.title` 600 21/27 −0.3 | `pageBarTitle` 700 21/26 (friends.tsx:58; auraKit.ts:197) |
| 2 | arama üstünde kanki | eksik | blob b0c6d647… (png 900×510) 204×116, sağ 0, arama alanının 90 üstünde | yok. `FRIENDS_PEEK` (kankiMotion.ts:66-68, 54×68) tanımlı ama hiçbir yerde kullanılmıyor (grep) |
| 3 | arama alanı yeri | boşluk | başlıktan sonra margin-top 68 (kankiye yer) | bar altında 8 (fieldTop) + 12 gap, kanki yok |
| 4 | arama alanı dolgusu | renk | düz #FFFFFF (koyuda #121614) | `GlassSearch` Glass frost gradyan (GlassSearch.tsx:38) |
| 5 | arama alanı padX | ölçü | 20 | 18 |
| 6 | ad–alt satır aralığı | boşluk | `.mid` gap 2 | yok (friends.tsx:~167-170) |
| 7 | "Mesaj gönder" yüksekliği | ölçü | `.mbt` 32 yük, min-width 112 | `Btn sm` 36, min genişlik yok (friends.tsx:~173-181) |
| 8 | "Mesaj gönder" iç/yazı | ölçü | padX 14, 13/16 600 | padX 16, 14/18 |
| 9 | "Mesaj gönder" koyu | koyu | #1B211F, kenar .08 | rgba(18,22,20,.62), kenar .10 |
| 10 | tab çubuğu aktif sekme | uyuyor | Profil | ✓ (alt boşluk DOĞRULANAMADI) |
| 11 | satır | uyuyor | 48 yüz, padY 10, gap 12, min 72, "14 Kasım'dan beri" | FLAT.row ✓, tr.friends.since ✓ |
| 12 | DOĞRULANAMADI | — | yüz renkleri c1..c5 | ProfileFace renk seçimi |
| 13 | DOĞRULANAMADI | — | kanki resmi eklenirse "yok" uyarısı | assets/riso'da arkadaş-kanki resmi yok (peek-1/peek-2 var; b0c6d647 depoda aranmadı) |

## 06b Arkadaşlar · kaydırılmış — project/ArkadaslarKaydir.dc.html
Kod: friends.tsx; motion/StickyField.tsx; Screen.tsx (üst bant)
Öğe sayısı: 38 · uyuyor: 17 · fark: 12 · fazla: 0 · doğrulanamadı: 2
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1–9 | liste ve arama alanı | bkz. 06 #1–#9 | | |
| 10 | kaydırınca üst çubuk başlığı | davranış/yazı | `.sbt b` 700 17/22 −0.2, `.sbt span` 500 12/16 ("14 arkadaş"), geri 44 aynı satırda; satır min 48 | başlık bloğu `top` içinde sabit, küçülmüyor: 21/700 + 13/18 (friends.tsx:52-65) |
| 11 | büyük başlık bloğu (`.tb2`) kayması | davranış | içerikle birlikte yukarı kayar (translateY −292) ve çubukta küçük başlık belirir | başlık bloğu içerikle kaymıyor; çubuk başlığı sabit (friends.tsx:52) |
| 12 | çubuk zemini | renk | `.sbar2` rgba(255,255,255,.32), blur 24 saturate 1.1, alt 22 maske (koyu rgba(0,0,0,.86)); iç boşluk 52 20 22, gap 10 | `StickyField band` → FieldBand (StickyField.tsx:100+; Screen bandı); değerler ölçülmedi → DOĞRULANAMADI |
| 13 | yapışık arama alanı | renk | `.afl` #FFFFFF (koyu #121614) | glass frost (bkz. 06 #4) |
| 14 | çubuk altı arama-başlık aralığı | boşluk | gap 10 | StickyField `stickyTop` 6, `stickyBandPad` 8 |
| 15 | liste uzunluğu | uyuyor | 14 satır | — |
| 16 | DOĞRULANAMADI | — | bant yüksekliği (≈52+48+10+48+22) | topBar.bandHeight 118 ✓ yakın |

## 07 Aktiviteler · etkinlik yok — project/AktivitelerBos.dc.html
Kod: app/(app)/(tabs)/activities.tsx; src/features/gifts/GiftCard.tsx; theme/gifts.ts (GIFT_CARD); theme/activities.ts; EmptyState.tsx
Öğe sayısı: 24 · uyuyor: 9 · fark: 13 · fazla: 1 · doğrulanamadı: 1
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | şehir satırı | fazla | başlığın üstünde yok | `tr.activities.fromVenues(city)` "…daki mekanlardan" küçük başlık (activities.tsx:59-62; tr.ts:460) → FAZLA |
| 2 | hediye kartı yüksekliği | ölçü | 76 | 170 (GIFT_CARD.height) (gifts.ts:85) |
| 3 | hediye kartı köşe | ölçü | 22 (`.gift` radius) | 30 (GIFT_CARD.radius) |
| 4 | hediye kartı yüzeyi | renk | `.glass` cam gradyan (koyuda #121614) | koyu yeşil gradyan `GIFT_CARD.ground` iki temada (gifts.ts:96-97) |
| 5 | hediye kartı iç boşluk | boşluk | 0 14 0 10, gap 8, margin-top 8 | pad 20; üst "overhang" 44 (gifts.ts:86-90) |
| 6 | paket resimleri | ölçü | 42 (orta 50), yerleşke 88×76 sol blok; k1 −12°, k3 +12°, k2 üstte | 84 genişlik, sağda, yüzer hareketli, kartın üstüne taşar (gifts.ts:101-114) |
| 7 | paket konumu | düzen | solda | sağda (right 112/6) |
| 8 | "HEDİYE PAKETİ" | yazı | 600 12/16 ls .24 accent | `giftEyebrow` 800 11/14 ls .12em, renk #3DDC84 (auraKit.ts:119; gifts.ts:99) |
| 9 | "Bütün aksesuarlar sende" | yazı/metin | 600 16/22 tek satır, --text | `giftTitle` 800 21/26, metin "Bütün aksesuarlar\nsende" iki satır (auraKit.ts:120; tr.ts:397) |
| 10 | "Paketlere bak" düğmesi | fazla | yok; yalnız sağ chevron 18 | cam düğme "Paketlere bak" + chevron 15 (GiftCard.tsx:154-165) → FAZLA |
| 11 | kart–seg arası | boşluk | gap 12 | tabsTop 12 ✓ (alt `paddingBottom`) |
| 12 | seg cam yüzeyi | renk | `--glass-bg` gradyan + gölge 0 18 44 | rgba(255,255,255,.60), gölge 0 10 30 (bkz. 05 #6) |
| 13 | boş hâl resmi | resim | blob 4ba27f14… png 900×600, 150×100 (dürbünlü kanki, ilan panosu) | `riso="events"` `compact` → 120×83 (empty-events.webp 640×440) (activities.tsx:~158-166; EmptyState.tsx) |
| 14 | boş hâl yeri | düzen | seg altında kalan alanda ortalı, alt boşluk 150 | seg altında 12 sonra üstten hizalı, paddingTop 18 (compact→small) |
| 15 | boş hâl açıklama | uyuyor | 260 max, metinler ✓ | tr.ts:463-467 ✓ |
| 16 | başlık | uyuyor | 32/500 | ✓ |
| 17 | DOĞRULANAMADI | — | hediye kartının diğer durumları (paket açılabilir, ilerleme) | panoda yalnız "bütün aksesuarlar sende" durumu var |

## 07a Aktiviteler · etkinlik var — project/AktivitelerDolu.dc.html
Kod: activities.tsx; src/features/activities/EventCard.tsx; @shared/explore.ts (todayEvents); useExploreVenues.ts (ExploreEvent)
Öğe sayısı: 52 (başlık, kart, seg, bölüm başlığı, 3 etkinlik kartı × ~11 öğe) · uyuyor: 6 · fark: 22 · fazla: 6 · doğrulanamadı: 1
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1–9 | başlık, hediye kartı, seg | bkz. 07 #1–#12 | | |
| 10 | "Bugün · 3" bölüm başlığı | eksik | `.evh` 600 12/16 ls .24 muted, padding 4 4 0 | yok (activities.tsx:Events) |
| 11 | etkinlik kartı yapısı | düzen | tek parça afiş: 148 yüksek, r22, tam taşan fotoğraf (sağa hizalı), solda 166'lık yazı sütunu, gölge `--shadow-card` | cam kart (pad 8) içinde sahne resmi (334/168 oran, r22) üstünde etiketler, altında başlık+mekan (EventCard.tsx:41-90) |
| 12 | kart resmi | resim | etkinliğe özgü fotoğraf (blob 6f525425…, 1cfde72f…, aae63342…: jpg 700×280) | tek ortak sahne `assets/riso/event.webp` (EventCard.tsx:91) |
| 13 | tür etiketi | özellik yok | "Kulüp", "Kampanya", "Turnuva" (sarı #FFE21E / #16141C, 22 yük, 11) | etiket sabit "Etkinlik" (tr.ts:461); `ExploreEvent` = {title, startsAt, endsAt} (useExploreVenues.ts:16) → etkinlik türü alanı yok |
| 14 | başlık | yazı | 700 16/21 | `h3` 600 16/22 |
| 15 | zaman · yer satırı | özellik yok | "20:00 · Kampüs bahçesi", "Gün boyu · 120 m", "21:30 · Gölge Kafe" (12/16 600, op .85) | `eventTime(...)` etiketi resmin üstünde sağ üst köşede; mekan içi yer alanı yok. KURAL 6: "120 m" uzaklık konumdan hesaplanır; harita/Keşfet konum göstermez, konum yalnız check-in'de alınır → proje sahibi kararı |
| 16 | "Şu an geçerli" durumu | özellik yok | `.evs` 700 12/16 #0E7A3F, 7×7 nokta | yok; Keşfet kampanyasız ("no campaigns", K-15 yorumu activities.tsx:44-46) |
| 17 | düzenleyen (organizatör) | özellik yok | 18 daire baş harf (10/700) + "Gelişim Kamp Kulübü" (11/600) | yok (mekan adı accent 13 yazı, EventCard.tsx:84-86) |
| 18 | mekan adı | metin | kartta "Hush Coffee" yalnız düzenleyen satırında | `venue.name` ayrı satır, accent |
| 19 | koyu/açık yazı | koyu | `.evc.dk` beyaz yazı, açıkta #1A1420 | kart camında `ink` |
| 20 | kartlar arası | uyuyor | gap 12 | SPACING[3] ✓ |
| 21 | kart yüksekliği | ölçü | 148 | aspectRatio 334/168 + alt satırlar ≈ 8+168+… ≈ 230 |
| 22 | KURAL 6 | kural | "120 m" | bkz. #15 |
| 23 | KURAL | kural | "Kampanya" kartı reklam benzeri | K-15/K-38 "kampanya yok" kararı (activities.tsx:44) panoyla çelişiyor; ürün kararı |
| 24 | FAZLA | fazla | yok | şehir satırı, "Paketlere bak" (bkz. 07) |
| 25 | DOĞRULANAMADI | — | dokunma davranışı | pano yalnız görüntü; kodda kart mekan sayfasına gidiyor (K-43) |

## Kapsam
| pano no | öğe sayısı | fark sayısı | okundu |
| --- | --- | --- | --- |
| 03o | 30 | 17 | evet |
| 03p | 19 | 7 | evet |
| 03q | 8 | 3 | evet |
| 03r | 14 | 5 | evet |
| 03s | 8 | 3 | evet |
| 03t | 14 | 11 | evet |
| 04 | 45 | 14 | evet |
| 05 | 22 | 8 | evet |
| 05a | 52 | 24 | evet |
| 06 | 36 | 10 | evet |
| 06b | 38 | 12 | evet |
| 07 | 24 | 13 | evet |
| 07a | 52 | 22 | evet |
