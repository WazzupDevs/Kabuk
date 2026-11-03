# Arayüz hataları — 3 Kasım 2026

Proje sahibinin telefonda uygulamayı denerken bildirdiği küçük hatalar; not hâli. Kod değişikliği yok.

- Her madde: ekran, ne görüldü, önem, kodda bulunabiliyorsa olası yer (dosya:satır).
- Önem: **yüksek** (kullanılamıyor, çakışan/kesilen içerik), **orta** (göze batan), **düşük** (ince ayar).
- Aynı kökten gelen maddeler birleştirildi.

## Kararlar

Proje sahibinin bu oturumdaki ürün kararları.

| Karar | Madde |
| ----- | ----- |

## Maddeler

### 1. DM sohbeti (koyu)

**1.1 Uzun basınca öne çıkan balonun çevresindeki katman balona uymuyor.** Mesaja uzun basınca (tepki ve Yanıtla/Kopyala açılır) öne alınan balonun dışında yeşilimsi bir halka çıkıyor: rengi balonla ilgisiz (mavi balonda da yeşil), kuyruğu sarmıyor, balonun gölgesinin yerini alıyor. Önem: orta.
Olası yer: `apps/mobile/src/components/ChatBubble.tsx:323` (`lifted` iken `boxShadow: shape.shadow.focus`, yani `theme/theme.ts:152`/`:160` odak halkası, 4px yeşil); kuyruk ayrı çizildiği için (`BubbleTail`, `:327`) halka kuyruğu izlemiyor. Öne alma `components/MessagePop.tsx`.

**1.2 Yeni mesaj gönderince, liste en alttayken aşağı inme oku çıkıyor.** Kendi mesajını gönderdikten sonra sayfa en altta olduğu hâlde sağ altta aşağı ok beliriyor ve son balonun saatinin üstüne biniyor (ekranda "Bugün" günü yeni açılmıştı). Önem: orta.
Olası yer: `apps/mobile/src/components/ChatScreen.tsx:748` (ok `metaHidden`'a bağlı, `:1063`; yeni satır gelince `hiddenAt` yeniden hesaplanıyor ama `scrollY` eski kalıyor ya da yeni satırın/gün ayracının yüksekliği eşiği yanlış kuruyor), eşik `apps/mobile/src/lib/chatMeta.ts:5` → `metaHiddenAt`.
