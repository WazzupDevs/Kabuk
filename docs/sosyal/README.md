# skall sosyal medya (Instagram ve TikTok)

Organik büyüme için içerik sistemi. Yalnız pazarlama işidir: uygulama koduna, sunucuya ve yayına dokunmaz.

| Dosya                         | Ne                                                                                                                     |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `strateji.md`                 | Hedef kitle, 5 içerik ayağı, ses tonu, sıklık, 30 gün hedefleri, söylenebilecekler ve söylenemeyecekler, KVKK ve telif |
| `takvim.md`                   | 30 günlük takvim (tarih, saat, ayak, içerik, görsel, durum)                                                            |
| `fikir-havuzu.md`             | Numaralı fikir listesi, ayağıyla                                                                                       |
| `hafta-1.md`                  | İlk haftanın 7 hazır içeriği: senaryo, çekim listesi, açıklama, hashtag, saat                                          |
| `sablonlar/senaryo.md`        | Video senaryo şablonu (kanca 0–2 sn, akış, kapanış ve çağrı), kanca kalıpları                                          |
| `sablonlar/aciklama.md`       | Açıklama yapısı, hashtag havuzu, çağrı bankası                                                                         |
| `sablonlar/haftalik-rapor.md` | Haftalık rapor şablonu                                                                                                 |
| `cekim-izni.md`               | Kişi ve mekan çekim izni metni                                                                                         |
| `gorsel/`                     | 9:16 kapak, gönderi ve animasyon üretimi (HTML + Playwright + ffmpeg)                                                  |
| `raporlar/`                   | Haftalık raporlar (`YYYY-AA-GG.md`, haftanın pazartesisi)                                                              |

## Haftalık döngü

1. **Pazartesi:** önceki haftanın raporu (`sablonlar/haftalik-rapor.md`), takvimin sonraki haftası rapora göre güncellenir.
2. **Salı:** haftanın senaryoları `sablonlar/senaryo.md` ile yazılır (`hafta-N.md`), görseller `gorsel/icerik.json`'a eklenip üretilir.
3. **Çarşamba–perşembe:** mekan çekimi (izinler önceden), ekran kayıtları test hesabıyla.
4. **Her gün:** takvimdeki saatte yayın, ilk saat yorumlara cevap, story'ler.

## Görsel üretim

`gorsel/sablon.html` tek şablondur; `gorsel/icerik.json`'daki her satır bir çıktıdır:

- `layout: "kapak"` başlık, alt yazı, masadaki kankiler, konuşma balonu
- `layout: "kart"` numaralı adımlar (kaydırmalı gönderinin karesi)
- `layout: "soru"` masa sorusu ve iki seçenek
- `anim: "masa" | "krot" | "gece"` animasyonlu MP4 (30 fps) ve son karesi kapak PNG

Başlıkta `*vurgu*` turuncu, `_vurgu_` pembe, `~vurgu~` lavanta, `|` satır sonu. Kanki görünüşü `{ "c": renk, "e": göz, "h": baş, "f": yüz, "m": ağız, "n": boyun }`; parça adları `docs/design/kaynak/kapsul/kapsul-katalogu.json`'da. Kapsül çizimi `docs/design/kaynak/kapsul/` ve wordmark `apps/mobile/src/theme/wordmark.ts`'ten okunur, kopyalanmaz.

```bash
node docs/sosyal/gorsel/render.mjs ~/skall-sosyal
```

```bash
node docs/sosyal/gorsel/render.mjs ~/skall-sosyal g2-krot g7-semt
```

Gerekenler: Node 22, `playwright` (Chromium'la) ve `ffmpeg`. Çıktılar 1080×1920; müzik eklenmez (platformun ticari ses kütüphanesinden yüklerken eklenir). Önemli yazı güvenli alanda durur: üstten 250, alttan 420, sağdan 140 px. Font Plus Jakarta Sans (OFL, `gorsel/fonts/OFL.txt`).
