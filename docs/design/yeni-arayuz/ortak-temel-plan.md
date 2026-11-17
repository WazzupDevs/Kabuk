# Ortak temel planı (16 Kasım 2026; mimar çıktısı + proje sahibinin kararları)

Kararlar (proje sahibi, sohbet, 16 Kasım): her onay ortada dialog; Süsle'ye altıncı sekme Ağız, Takımlar yalnız katalogda;
katalogda "Kapsülüne tak" taslağa uygular (kayıt yalnız Süsle'de); Odadakiler'den geri dönünce Seçenekler yeniden açılmaz;
ana düğme ve form alanı 48 (CLAUDE.md "Ekran davranışı" ve iskelet.md 2.1 aynı PR'da güncellenir; eski 52/56);
Ayarlar tam sayfa, sağdan iter (Bildirim ayarları, Gizlilik, Hesap aynı yığında).
Çizilmiş panolarda Atölye adımı yok (yeni-tuval.md'ye bir satır, paket 1'in PR'ında).

Panolar: canlı tuvalden paket başına okunur (`docs/decisions/yeni-tuval.md`); birleşenler `docs/design/yeni-arayuz/project/` altında.

## A. Farklar (palet ve font aynı; font JS'ten yükleniyor, OTA yeter)
Dosyalar: theme/buttonGlass.ts, theme/auraKit.ts, theme/dm.ts, theme/glass.ts.
1. Ana düğme: açık #031B0B, yazı beyaz, gölge 0 8 18 rgba(3,27,11,.22), basılı #14301C; koyu rgba(255,255,255,.94), yazı #0B0E0D, gölge yok, basılı #D6DED9. --primary yeşil kalır (anahtar, rozet, canlı nokta).
2. Danger yumuşak: açık #FBE1DB / #A8301A; koyu dialogda rgba(255,151,126,.12) / #FF977E.
3. Clear (soft): açık dolgu .62 → .74, çizgi #FFF, gölge 0 6 16 rgba(4,73,35,.10), yazı #0B5A2D → #031B0B. Koyu aynı.
4. Yeni ghost türü: dolgusuz, yazı metin rengi ("Vazgeç").
5. Kapalı düğme: %45 soluk yerine dolgu disabled/onDisabled, ikon yok; koyu #1B211F / rgba(238,243,240,.4). iskelet.md 2.1 değişir.
6. Düğme yazısı: KIT_TYPE.btn 800 → 600 16/20; küçük 600 14/18.
7. Dialog token'ları: yüzey surface (koyu #151A18), köşe 28, yanlardan 28 içeride, iç boşluk 24/20/20; gölge açık 0 18 48 rgba(3,27,11,.22), koyu 1 px rgba(255,255,255,.08) halka; başlık 700 21/26 −0.3; metin 500 15/22 muted; ikon diski 56 (danger %10).
8. Örtü: dialog ve sayfa açık rgba(3,27,11,.42), koyu rgba(0,0,0,.70), bulanıklık yok (bugün KIT.scrim .20/.45 + 8 px); uzun basma .30/.62 + sabit kopya 6 px (SCRIM_GLASS 8 → 6); ⋮ menüsü örtüsüz (bugün DM.menu.scrim .10/.20 + MENU_GLASS 28).
9. ⋮ menüsü: düz surface, köşe 28, genişlik 292, iç boşluk 16/8/8, gölge 0 18 48 .22 + 0 0 0 1px .06 (bugün 256–272, köşe 26, cam).
10. Uzun basma menüsü: genişlik 268, köşe 24, iç boşluk 6; satır en az 44, 600 15/20, ikon 20, aralık 14, ince çizgi 46'dan; kırmızı grup 6 px rgba(3,27,11,.05) bantla ayrılır (bugün satır 50, 15.5).
11. Alt sayfa: köşe 40 → 28, düz surface (koyu #151A18); tutamaç 40×5, açık .14 → .18; gölge 0 -8 40 .22 → .18.
12. Yeni üst bildirim (toast): açık #031B0B zemin beyaz yazı, koyu tersi; köşe 20; başlık 600 14/19; alt satır 500 12/16 %70; düğme 36 rgba(255,255,255,.14).
13. Bölmeli seçici seçili parça: açık text zemin beyaz yazı; koyu .94 beyaz.
14. Sayfa üstü (Ayarlar): 44 yuvarlak geri + 700 21/26 başlık; bölüm başlığı küçük harf 700 13/18 muted; satır en az 56, 600 16/20, ikon 24, çizgi 38'den.

## B. Overlay
Bugün: motion/Sheet.tsx (Modal, SheetScrim, closeAllSheets), components/RouteSheet.tsx, motion/Menu.tsx, components/MessagePop.tsx + popHost.tsx,
components/ConfirmSheet.tsx, features/friends/ConfirmWithReport.tsx.
Hedef: app/(app)/_layout.tsx'te tek OverlayHost + zustand useOverlay (dialog, sheet, hold, menu); aynı anda tek açık; tek Modal
(statusBarTranslucent, navigationBarTranslucent); dışarı dokunma/sürükleme/Android geri kapatır; closeAllSheets → closeAll; route sayfaları route kalır, depoya yazar.
Yeniden kullanılan: useSheetMotion/sheetDrag/sheetOpen, MenuPop + menuPlace, MessagePop + popHost (hold), BackdropBlur (yalnız hold).
Yeni: motion/Dialog.tsx (MOTION.dissolve 240/150, ölçek .97, 12 px; basma press), components/OverlayHost.tsx, components/Toast.tsx.
Dialoga geçecek onaylar (≈20 çağrı, 18 dosya): ConfirmSheet → room/[id].tsx (Bitir, Ayrıl); ConfirmWithReport → messages/[threadId],
people/[publicId], venue-chat/index, venue-chat/[messageId], historyActions; SignOutSheet, settings-account; venue.tsx; RoomPeople.tsx;
profile/edit.tsx, profile/capsule.tsx; arkadaşlık isteği onayı: district/room, district/[messageId], venue-chat/[messageId];
(onboarding)/birth.tsx; 7 oyunun bitir/ayrıl sayfaları; features/design/previews.tsx. ReportModal alttan sayfa kalır.

## C. Kit geçişi
İkinci kit yok; değerler yerinde değişir (buttonGlass.ts, KIT, Btn, Seg). Hedef Btn (79 dosya). components/Button.tsx (15 dosya) Btn'in ince sarmalayıcısı
(primary → primary, secondary/neutral → glassy, danger → danger, ghost/dangerText → ghost); mandal testi Button import eden dosyaları listeler, liste yalnız küçülür.
ConfirmSheet önce Dialog'a alias, sonra kaldırılır. Screen/TopBar 'sayfa' türü Ayarlar üstüne göre ayarlanır; yeni tür yok.

## D. Paketler (her biri tek PR, hepsi OTA)
1. Temel token'lar ve Ayarlar: auraKit.ts (dialog/sayfa/menü/toast/örtü token'ları, yazı adımları), Seg, TopBar sayfa üstü, app/(app)/settings.tsx (tam sayfa), iskelet.md 5.9.
   Pano Ayarlar. Test: contrast.test.ts, styleGuard, skeleton.test.ts. Telefonda: Ayarlar açık/koyu, tema seçimi, 320 dp ve 1,3 yazı.
2. Düğme: buttonGlass.ts, kit.tsx → Btn (ghost, kapalı, basılı), boy 48, Button.tsx sarmalayıcı, mandal testi, iskelet.md 2.1, CLAUDE.md boy satırı. Test: contrast, mutationHaptics.
3. Overlay deposu + Dialog, Ayarlar onaylarıyla: OverlayHost, useOverlay, motion/Dialog, SignOutSheet, settings-account, ConfirmSheet alias, iskelet.md 3.5.
   Panolar AyarlarCikis, MesajlarSohbetSil. Test: overlayStore.test.ts, motionGuard, motionKit.test.ts.
4. Kalan onaylar dialoga (B listesi). Pano EngelleOnay. E2E testID ve -cancel adları korunur.
5. Sayfa, ⋮ ve uzun basma depoya: motion/Sheet, motion/Menu, MessagePop, SheetScrim; SCRIM_GLASS 6; MENU_GLASS ⋮'den kalkar. Panolar SikayetEt, MekanSecenek, Masadakiler, MesajlarUzunBas.
   Yapıldı (17 Kasım, `claude/ortak-temel-5`): `useOverlaySlot` ile tek depo, `closeAllSheets` = `closeAll`; uzun basma bulanıklığı Çizim ölçümü anahtarıyla, varsayılan kapalı (`docs/decisions/scrim-glass.md`). Koyu sayfa panodaki gibi #121614 (A.11'deki #151A18 değil).
6. Yükleniyor, hata, 320 dp: EmptyState, RouteError, Toast, ButtonRow. Panolar YukleniyorListe, AktivitelerHata, AktivitelerBaglantiYok, SusleKaydedilemedi, SusleKaydediliyor, DarSusle.
Kapsül pilotuna ait (bu paketlerde değil): Ağız sekmesi, Takımlar, "Kapsülüne tak".

## Skia tarafı (ayrı hat)
P2 (#644) → P2b (iki kalıcı tuval, saveLayer azaltma, parça kırpma; yazılıyor) → P2c (makeTextureImage ile doku ön yüklemesi, runOnUI) →
(native, ileride) çizimi ana iş parçacığından almak. Ölçüm 4.13: P2+P2b sonrası zar (RNSkia.render sayısı/ort./en uzun), bellek platosu,
boşta iz, "hareket" kapalı iz, profil kapak kapalı / bilet kapalı.
Bekleyen hazır commit: pencereli ızgara 3e5507b44 (worktree-agent-adbfd8c92c27b6dfb).
