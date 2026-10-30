---
name: telegram-referans
description: Çizim, hız, cam ve bulanıklık, liste, sohbet, klavye ya da hareketle ilgili bir işin nasıl yapılacağına karar vermeden önce Telegram Android'in aynı işi nasıl yaptığına bakmak için kullan.
---

# Telegram Android referansı

Proje sahibinin kararı (29 Ekim): bir işin nasıl yapılacağına karar vermeden önce Telegram Android'in aynı işi nasıl yaptığına bakılır ve uygun olan yol alınır. Görünüşün kaynağı aura tuvali olarak kalır; Telegram tekniği ve tuvalin çizmediği davranışı ve hareketi verir.

## Nasıl bakılır

1. Kaynak `github.com/DrKLO/Telegram` (açık kaynak). Repo çok büyük, tamamı klonlanmaz: yalnızca gereken klasör alınır, ör.
   `git clone --depth 1 --filter=blob:none --sparse https://github.com/DrKLO/Telegram /tmp/telegram && git -C /tmp/telegram sparse-checkout set TMessagesProj/src/main/java/org/telegram/ui/Components`
2. İşin karşılığı sınıf adıyla aranır (sohbet ekranı `ChatActivity`, mesaj hücresi `Cells/ChatMessageCell`, klavyeyle yeniden boyutlanma `Components/SizeNotifierFrameLayout`); dosyanın tamamı değil, ilgili yöntem okunur.
3. Öğrenilen: hangi çizim yolu, ne zaman yeniden çizilir, hangi boyutta ve hangi önbellekle, ana iş parçacığında ne kalır.
4. Telegram GPL-2.0 lisanslıdır: yalnızca teknik öğrenilir. Kod, sınıf yapısı ve metin kopyalanmaz.
5. Alınan teknik aşağıdaki listeye ve PR açıklamasına bir satırla yazılır.

## Alınanlar

- Buzlu cam: bulanıklık en çok sekizde bir boyda çizilir, Telegram'ın buzlu çubukları gibi (`skall-glass` → `LiquidGlassView`, 0.9.0).
- Sohbet akışı: en yeniden yukarı çizilen liste, sona tutunur, yalnızca kullanıcının kendi kaydırması bırakır (`ChatList`, `src/components/ChatScreen.tsx`).
- DM: `docs/decisions/dm-telegram.md`.
