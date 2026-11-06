---
name: telegram-referans
description: Çizim, hız, cam ve bulanıklık, liste, sohbet, klavye ya da hareketle ilgili bir işin nasıl yapılacağına karar vermeden önce Telegram Android'in, React Native tarafında da Bluesky social-app'in ve Mattermost Mobile'ın aynı işi nasıl yaptığına bakmak için kullan.
---

# Teknik referanslar: Telegram Android, Bluesky social-app, Mattermost Mobile

Proje sahibinin kararı (29 Ekim): bir işin nasıl yapılacağına karar vermeden önce Telegram Android'in aynı işi nasıl yaptığına bakılır ve uygun olan yol alınır. Görünüşün kaynağı aura tuvali olarak kalır; Telegram tekniği ve tuvalin çizmediği davranışı ve hareketi verir.

## Nasıl bakılır

1. Kaynak `github.com/DrKLO/Telegram` (açık kaynak). Repo çok büyük, tamamı klonlanmaz: yalnızca gereken klasör alınır, ör.
   `git clone --depth 1 --filter=blob:none --sparse https://github.com/DrKLO/Telegram /tmp/telegram && git -C /tmp/telegram sparse-checkout set TMessagesProj/src/main/java/org/telegram/ui/Components`
2. İşin karşılığı sınıf adıyla aranır (sohbet ekranı `ChatActivity`, mesaj hücresi `Cells/ChatMessageCell`, klavyeyle yeniden boyutlanma `Components/SizeNotifierFrameLayout`); dosyanın tamamı değil, ilgili yöntem okunur.
3. Öğrenilen: hangi çizim yolu, ne zaman yeniden çizilir, hangi boyutta ve hangi önbellekle, ana iş parçacığında ne kalır.
4. Telegram GPL-2.0 lisanslıdır: yalnızca teknik öğrenilir. Kod, sınıf yapısı ve metin kopyalanmaz.
5. Alınan teknik aşağıdaki listeye ve PR açıklamasına bir satırla yazılır.

## React Native referansları (proje sahibinin kararı, 6 Kasım)

Telegram native Android'dir; aynı işin React Native ve Expo'da nasıl kurulduğuna ayrıca bu ikisine bakılır. Sıra: önce Telegram (davranış ve teknik), sonra yığına uyarlamak için bunlar.

| Repo                                      | Lisans     | Ne için                                                                                                                                                                            |
| ----------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `github.com/bluesky-social/social-app`    | MIT        | Yığını bizimkine en yakın: Expo, Reanimated, expo-image, react-native-keyboard-controller. Ekran iskeleti, profil, bildirim listesi, alt sayfalar, klavye, OTA ve Sentry kullanımı |
| `github.com/mattermost/mattermost-mobile` | Apache-2.0 | React Native sohbet: kanal ve DM listesi, okunmamış çizgisi, uzun listede performans, tepki ve mesaj menüsü                                                                        |

1. Telegram'daki gibi tamamı klonlanmaz: `git clone --depth 1 --filter=blob:none --sparse <repo> /tmp/<ad>` ve yalnızca gereken klasör (`sparse-checkout set src/...`).
2. Önce teknik öğrenilir. Kısa bir parça uyarlanırsa lisans gereği dosyanın başına kaynak ve telif satırı yazılır; parça aşağıdaki listeye ve PR açıklamasına bir satırla girer.
3. Onların bağımlılığı kullanılmak isteniyorsa yeni bağımlılık kuralı geçerlidir: gerekçe önce yazılır.
4. Görünüşün kaynağı yine aura tuvalidir; bu repolardan görünüş, metin ve ikon alınmaz.

## Alınanlar

- Buzlu cam: bulanıklık en çok sekizde bir boyda çizilir, Telegram'ın buzlu çubukları gibi (`skall-glass` → `LiquidGlassView`, 0.9.0).
- Sohbet akışı: en yeniden yukarı çizilen liste, sona tutunur, yalnızca kullanıcının kendi kaydırması bırakır (`ChatList`, `src/components/ChatScreen.tsx`).
- Alt sayfa arkası bulanıklık (U8): pencere sayfa açılırken bir kez küçük kopyalanır, bulanık çizilir, sayfa açıkken değişmez; Telegram'ın diyalog arkası gibi (`skall-glass` → `BackdropBlurView`, 0.9.4).
- DM: `docs/decisions/dm-telegram.md`.
- Sohbet akışının sona tutunması (`wasManualScroll`): yalnızca kullanıcının kendi sürüklemesi ya da savurması sondan ayırır; klavye, büyüyen yazma alanı ve yeni satır ayırmaz, liste o sırada sona geri konur (`ChatList` → `pinned`, `stayAtEnd`).
- Balon ve kuyruğu tek yol olarak çizilir, çizgisi kuyruğu da dolaşır (`ChatBubble` → `BubbleShape`, `src/lib/bubblePath.ts`).
