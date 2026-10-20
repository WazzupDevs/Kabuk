# skall v46 envanter

kaynak: skall-masa-deneme-v46.html  
kaynak sha256: 1063519b7e116fe2a9039b3746e08b7d8675ed6bd7818c288003f831c477d2d4  
çıktı: skall-masa-deneme-v46-galeri.html  
ölçü: 360x740, getComputedStyle  
tam veri: skall-v46-envanter.json (bu dosya onun tablo hali)

## url_params

| param | değer | etki |
|---|---|---|
| s | durum kimliği (states[].id) | durumu gerçek tıklamalarla açar; seed yoksa seed=1 uygulanır |
| theme | light / dark | temayı zorlar; localStorage yazılmaz |
| fs | 1 / 1.3 | v46 yazı büyütme işlevi (window.__fs) |
| anim | 0 | CSS animasyon ve geçiş süreleri 0, Element.animate süresi 0, saat durur |
| demo | 0 | deneme şeridini gizler |
| seed | tamsayı / off | Math.random tohumlanır, saat 20.10.2026 21:00 başlar |
| wait | ms, varsayılan 900 | adımlardan sonra hazır demeden önce bekleme |
| page | list / galeri | durum listesi ya da bileşen galerisi |
| format | json (page=galeri&theme=..) | galeri ölçülerini <pre id="spec"> içinde JSON verir |

## ready_flags

| bayrak | anlam |
|---|---|
| html[data-ready] | "1" olunca ekran hazır |
| html[data-state] | açılan durum kimliği |
| html[data-state-ok] | "1" beklenen sayfa, alt sayfa ve görünür öğe doğrulandı; "0" sapma var |
| window.__STATES | durum listesi |
| window.__GAL | galeri verisi |

## states (127)

| id | grup | durum | kapsam | beklenen sayfa | beklenen alt sayfa |
|---|---|---|---|---|---|
| mekan | Mekan | Mekan, masasız, lobi dolu | ana | venue | - |
| mekan-lobi-yukleniyor | Mekan | Lobi yükleniyor | ana | venue | - |
| mekan-lobi-bos | Mekan | Lobi boş | ana | venue | - |
| mekan-istek-musait-degil | Mekan | Katılma isteği: müsait değil | ana | venue | - |
| mekan-istek-kabul | Mekan | Katılma isteği: kabul edildi | ana | venue | - |
| mekan-12-kisi | Mekan | Masan 12 kişi, Katıl kapalı | ana | venue | - |
| mekan-fotosuz | Mekan | Profil fotoğrafı kaldırılmış | ana | venue | - |
| mekan-masam-var | Mekan | Masa sahibi, mekana dönmüş | ana | venue | - |
| mekan-katilimci | Mekan | Katılımcı, mekana dönmüş | ana | venue | - |
| mekan-masa-kur | Mekan | Masa kur penceresi | ana | venue | data-kur |
| mekan-masa-kurulamadi | Mekan | Masa kurulamadı | ana | venue | data-kur |
| mekan-anonim-gecis | Mekan | Anonim görün penceresi | ana | venue | data-anx |
| mekan-sohbeti | Mekan sohbeti | Mekan sohbeti | ana | vchat | - |
| mekan-sohbeti-secenekler | Mekan sohbeti | Mekan sohbeti seçenekleri | ana | vchat | data-vch-msheet |
| mekan-sohbeti-kisi | Mekan sohbeti | Mesajdaki kişiye dokununca | ana | vchat | data-vch-tsheet |
| mekan-sohbeti-kimlik | Mekan sohbeti | Kimlikle yaz penceresi | ana | vchat | data-anx |
| masa-sahibi | Masa | Masa sahibi, oyun seç | ana | table | - |
| masa-sahibi-sohbet | Masa | Masa sahibi, masa sohbeti | ana | table | - |
| masa-12-kisi | Masa | Masa sahibi, 12 kişi | ana | table | - |
| masa-katilimci | Masa | Katılımcı, oyun seç | ana | table | - |
| masa-katilimci-sohbet | Masa | Katılımcı, masa sohbeti | ana | table | - |
| masa-istek-gelsin | Masa | Masaya katılma isteği geldi | ana | table | - |
| masa-kisiler | Masa | Masadakiler penceresi | ana | table | data-msheet |
| masa-bitir | Masa | Masayı bitir penceresi | ana | table | data-csheet |
| masa-ayril | Masa | Masadan ayrıl penceresi | ana | table | data-csheet |
| masa-lobiye-ac | Masa | Lobiye aç penceresi | ana | table | data-lsheet |
| masa-davet | Masa | Davet: arkadaş listesi | ana | table | data-sheet |
| masa-davet-yukleniyor | Masa | Davet: yükleniyor | ana | table | data-sheet |
| masa-davet-hata | Masa | Davet: hata | ana | table | data-sheet |
| masa-davet-bos | Masa | Davet: arkadaş yok | ana | table | data-sheet |
| masa-posterler-yakinda | Masa | Oyun posterleri: yakında | ana | table | - |
| masa-bitti | Masa | Masa bitti ekranı | ana | tend | - |
| mesajlar | Mesajlar | Mesajlar dolu | ana | messages | - |
| mesajlar-bos | Mesajlar | Mesajlar boş | ana | messages | - |
| bildirimler | Mesajlar | Bildirimler penceresi | ana | messages | data-nsheet |
| bildirim-istek | Mesajlar | Bildirim: arkadaşlık isteği | ana | messages | - |
| bildirim-kabul | Mesajlar | Bildirim: istek kabul edildi | ana | messages | - |
| bildirim-davet | Mesajlar | Bildirim: masa daveti | ana | messages | - |
| bildirim-bos | Mesajlar | Bildirimler boş | ana | messages | data-nsheet |
| dm | Mesajlar | Birebir sohbet | ana | dm | - |
| dm-yaziyor | Mesajlar | Birebir sohbet, yazıyor | ana | dm | - |
| dm-secenekler | Mesajlar | Sohbet seçenekleri | ana | dm | data-dsheet |
| profil | Profil | Kendi profilin, kadın | ana | profile | - |
| profil-erkek | Profil | Kendi profilin, erkek | ana | profile | - |
| profil-nick-yenile | Profil | Nick yenile | ana | profile | - |
| profil-yeni-kisi | Profil | Yeni kişi: başka başlangıç kapsülü | ana | profile | - |
| profil-ayarlar | Profil | Ayarlar penceresi | ana | profile | data-ssheet |
| profil-baskasi | Profil | Başkasının profili | ana | profile | - |
| profil-baskasi-secenekler | Profil | Başkasının profili, seçenekler | ana | profile | data-psheet |
| arkadaslar | Profil | Arkadaşlar | ana | friends | - |
| profil-duzenle | Profil | Profili düzenle | ana | edit | - |
| profil-duzenle-foto | Profil | Fotoğraf penceresi | ana | edit | data-phsheet |
| profil-duzenle-cikis | Profil | Kaydetmeden çık penceresi | ana | edit | data-exsheet |
| kapsul-galeri | Kapsül | Kapsül galerisi | ana | caps | - |
| kapsul-susle | Kapsül | Kapsülü süsle | ana | capsed | - |
| kapsul-susle-ilk | Kapsül | Kapsülü süsle, ilk açılış | ana | capsed | - |
| kapsul-susle-cikis | Kapsül | Süsleme: kaydetmeden çık | ana | capsed | data-cedx |
| bildirim-ayarlari | Ayarlar | Bildirim ayarları | ana | nset | - |
| bildirim-izin-kapali | Ayarlar | Bildirim izni kapalı | ana | nset | - |
| gizlilik | Ayarlar | Gizlilik | ana | spage | - |
| hesap | Ayarlar | Hesap | ana | spage | - |
| hesap-sil | Ayarlar | Hesabı sil penceresi | ana | spage | data-delsheet |
| engellenenler | Ayarlar | Engellenenler | ana | spage | - |
| engellenenler-bos | Ayarlar | Engellenenler boş | ana | spage | - |
| sessize-alinanlar | Ayarlar | Sessize alınanlar | ana | spage | - |
| kesfet | Keşfet | Keşfet | ana | discover | - |
| kesfet-konum | Keşfet | Semt seçimi | ana | discover | data-vloc-sheet |
| kesfet-mekan | Keşfet | Mekana giriş penceresi | ana | discover | data-cisheet |
| aktiviteler | Aktiviteler | Aktiviteler | ana | activities | - |
| kayit-hosgeldin | Kayıt | Hoş geldin | ana | signup | - |
| kayit-onay | Kayıt | Onaylar | ana | signup | - |
| kayit-telefon | Kayıt | Telefon, boş | ana | signup | - |
| kayit-telefon-gecersiz | Kayıt | Telefon, geçersiz numara | ana | signup | - |
| kayit-telefon-hata | Kayıt | Telefon, kod gönderilemedi | ana | signup | - |
| kayit-kod | Kayıt | Doğrulama kodu | ana | signup | - |
| kayit-kod-hata | Kayıt | Doğrulama kodu yanlış | ana | signup | - |
| kayit-isim | Kayıt | İsim | ana | signup | - |
| kayit-dogum | Kayıt | Doğum tarihi | ana | signup | - |
| kayit-dogum-onay | Kayıt | Doğum tarihi onayı | ana | signup | data-sup-bc |
| kayit-cinsiyet | Kayıt | Cinsiyet | ana | signup | - |
| kayit-foto | Kayıt | Fotoğraf, kadın | ana | signup | - |
| kayit-foto-erkek | Kayıt | Fotoğraf, erkek (uyarılı) | ana | signup | - |
| kayit-18-alti | Kayıt | 18 yaş altı | ana | signup | - |
| kayit-cinsiyet-kapisi | Kayıt | Cinsiyet kapısı (eski hesap) | ana | signup | - |
| oyun-tb-teams | Eski oyunlar | Kapsül Anlat: Takımlar | eski_oyun | - | - |
| oyun-tb-desc | Eski oyunlar | Kapsül Anlat: Anlatan | eski_oyun | - | - |
| oyun-tb-guess | Eski oyunlar | Kapsül Anlat: Tahmin | eski_oyun | - | - |
| oyun-tb-opp | Eski oyunlar | Kapsül Anlat: Rakip | eski_oyun | - | - |
| oyun-tb-obs | Eski oyunlar | Kapsül Anlat: Gözlemci | eski_oyun | - | - |
| oyun-tb-end | Eski oyunlar | Kapsül Anlat: Tur sonu | eski_oyun | - | - |
| oyun-tb-final | Eski oyunlar | Kapsül Anlat: Oyun sonu | eski_oyun | - | - |
| oyun-sg-players | Eski oyunlar | Sahtekar: Oyuncular | eski_oyun | - | - |
| oyun-sg-big | Eski oyunlar | Sahtekar: 7+ kişi | eski_oyun | - | - |
| oyun-sg-role | Eski oyunlar | Sahtekar: Rol | eski_oyun | - | - |
| oyun-sg-imp | Eski oyunlar | Sahtekar: Sahtekar rolü | eski_oyun | - | - |
| oyun-sg-clueme | Eski oyunlar | Sahtekar: Sıra sende | eski_oyun | - | - |
| oyun-sg-clue | Eski oyunlar | Sahtekar: İpucu | eski_oyun | - | - |
| oyun-sg-vote | Eski oyunlar | Sahtekar: Oylama | eski_oyun | - | - |
| oyun-sg-result | Eski oyunlar | Sahtekar: Sonuç | eski_oyun | - | - |
| oyun-sg-last | Eski oyunlar | Sahtekar: Son şans | eski_oyun | - | - |
| oyun-sg-final | Eski oyunlar | Sahtekar: Oyun sonu | eski_oyun | - | - |
| oyun-hk-players | Eski oyunlar | Harf Kapmaca: Oyuncular | eski_oyun | - | - |
| oyun-hk-intro | Eski oyunlar | Harf Kapmaca: Harf çarkı | eski_oyun | - | - |
| oyun-hk-open | Eski oyunlar | Harf Kapmaca: Kapışma | eski_oyun | - | - |
| oyun-hk-me | Eski oyunlar | Harf Kapmaca: Sen kaptın | eski_oyun | - | - |
| oyun-hk-other | Eski oyunlar | Harf Kapmaca: Başkası kaptı | eski_oyun | - | - |
| oyun-hk-obs | Eski oyunlar | Harf Kapmaca: Gözlemci | eski_oyun | - | - |
| oyun-hk-setend | Eski oyunlar | Harf Kapmaca: Harf sonu | eski_oyun | - | - |
| oyun-hk-final | Eski oyunlar | Harf Kapmaca: Oyun sonu | eski_oyun | - | - |
| oyun-sx-players | Eski oyunlar | Şarkıda Geçsin: Oyuncular | eski_oyun | - | - |
| oyun-sx-intro | Eski oyunlar | Şarkıda Geçsin: Başlangıç | eski_oyun | - | - |
| oyun-sx-open | Eski oyunlar | Şarkıda Geçsin: Kapışma | eski_oyun | - | - |
| oyun-sx-me | Eski oyunlar | Şarkıda Geçsin: Sen kaptın | eski_oyun | - | - |
| oyun-sx-other | Eski oyunlar | Şarkıda Geçsin: Başkası söylüyor | eski_oyun | - | - |
| oyun-sx-obs | Eski oyunlar | Şarkıda Geçsin: Gözlemci | eski_oyun | - | - |
| oyun-sx-final | Eski oyunlar | Şarkıda Geçsin: Oyun sonu | eski_oyun | - | - |
| oyun-nx-teams | Eski oyunlar | İbre: Takımlar | eski_oyun | - | - |
| oyun-nx-psy | Eski oyunlar | İbre: İpucu veren | eski_oyun | - | - |
| oyun-nx-team | Eski oyunlar | İbre: Tahminci | eski_oyun | - | - |
| oyun-nx-opp | Eski oyunlar | İbre: Rakip | eski_oyun | - | - |
| oyun-nx-obs | Eski oyunlar | İbre: Gözlemci | eski_oyun | - | - |
| oyun-nx-reveal | Eski oyunlar | İbre: Sonuç | eski_oyun | - | - |
| oyun-nx-final | Eski oyunlar | İbre: Oyun sonu | eski_oyun | - | - |
| oyun-cx-sheet | Eski oyunlar | Sohbet kartları: Başlatınca | eski_oyun | - | data-cx-sheet |
| oyun-cx-card | Eski oyunlar | Sohbet kartları: Sohbette kart | eski_oyun | - | - |
| oyun-cx-yada | Eski oyunlar | Sohbet kartları: Ya da kartı | eski_oyun | - | - |
| oyun-cx-end | Eski oyunlar | Sohbet kartları: Kapandı | eski_oyun | - | - |

## tokens.declared

| değişken | açık | koyu |
|---|---|---|
| --brand-purple | #7B5CFF | #7B5CFF |
| --brand-pink | #FF4F8B | #FF4F8B |
| --brand-ink | #14112B | #14112B |
| --overlap | #FFB547 | #FFB547 |
| --wm-text | #14112B | #14112B |
| --accent | #5A3AE6 | #5A3AE6 |
| --ink | #14112B | #F3F0FF |
| --muted | #5E5878 | #B8B3D2 |
| --purple | #7B5CFF | #7B5CFF |
| --pink | #FF4F8B | #FF4F8B |
| --orange | #FFB547 | #FFB547 |
| --green | #1C7843 | #1C7843 |
| --g-bg | linear-gradient(135deg,rgba(255,255,255,.8),rgba(185,166,255,.3)) | linear-gradient(135deg,rgba(28,24,56,0.8),rgba(185,166,255,.3)) |
| --g-bd | rgba(255,255,255,.9) | rgba(28,24,56,0.9) |
| --g-act | linear-gradient(135deg,rgba(255,255,255,.95),rgba(185,166,255,.48)) | linear-gradient(135deg,rgba(28,24,56,0.95),rgba(185,166,255,.48)) |
| --g-act-sh | 0 6px 14px rgba(123,92,255,.2),inset 0 1px 1px #fff | 0 6px 14px rgba(123,92,255,.2),inset 0 1px 1px #1C1838 |
| --pin-bg | #F5F3FC | #0D0B1E |

body_bg: açık rgb(233, 230, 242), koyu rgb(7, 6, 15). font: "Plus Jakarta Sans", system-ui, sans-serif. farklı ham renk: 408

## tokens.raw_colors_top40

| değer | adet |
|---|---|
| #FFFFFF | 254 |
| #1C1838 | 151 |
| #6A47F5 | 54 |
| #262148 | 53 |
| #0D0B1E | 52 |
| #14112B | 51 |
| #F5F3FC | 49 |
| #FFB547 | 48 |
| #FF4F8B | 47 |
| #7B5CFF | 43 |
| #EEEBF8 | 41 |
| #F3F0FF | 21 |
| #3A3563 | 21 |
| #DAD3F2 | 19 |
| #5A3AE6 | 18 |
| #E3DEF2 | 18 |
| #302F48 | 18 |
| rgba(13,11,30,0) | 18 |
| rgba(245,243,252,0) | 17 |
| rgba(0,0,0,0.5) | 16 |
| #C51F62 | 14 |
| #34305A | 14 |
| #0F5C31 | 13 |
| #AFB0FF | 13 |
| rgba(255,255,255,0.07) | 13 |
| #C8331F | 12 |
| #FFE2B3 | 12 |
| #CDEFD9 | 11 |
| #173022 | 11 |
| #1C7843 | 10 |
| #34D27F | 10 |
| #8AD19F | 10 |
| rgba(0,0,0,0.136) | 10 |
| #E6E2F2 | 9 |
| #ADA8C8 | 9 |
| rgba(20,17,43,.08) | 9 |
| #A8301A | 8 |
| #FF977E | 8 |
| #29283A | 8 |
| #8A85A0 | 7 |

## type_styles (59)

| aile | boy | kalınlık | satır | harf aralığı | adet | örnek | gruplar |
|---|---|---|---|---|---|---|---|
| Plus Jakarta Sans | 13px | 600 | 18px | normal | 176 | small, span, p.note | Profil, Ayarlar, Mesajlar, Kapsül, Kayıt, Keşfet, Masa, Mekan, Mekan sohbeti |
| Plus Jakarta Sans | 12px | 700 | 15px | normal | 147 | span.ced-tn | Kapsül |
| Plus Jakarta Sans | 15px | 800 | 20px | normal | 144 | b, span.sr | Ayarlar, Kapsül, Keşfet, Masa, Mekan, Mekan sohbeti, Mesajlar, Profil |
| Plus Jakarta Sans | 14px | 700 | normal | normal | 140 | span, button.close, button.rtab | Aktiviteler, Mesajlar, Ayarlar, Kapsül, Kayıt, Keşfet, Masa, Mekan, Mekan sohbeti, Profil |
| Plus Jakarta Sans | 13px | 700 | normal | normal | 134 | button.cat, span, em | Aktiviteler, Kapsül, Keşfet, Masa, Mekan |
| Plus Jakarta Sans | 11px | 600 | 14px | normal | 132 | small, time | Mesajlar, Masa, Mekan, Mekan sohbeti |
| Plus Jakarta Sans | 11px | 700 | normal | normal | 108 | span | Aktiviteler, Mesajlar, Keşfet, Mekan, Profil |
| Plus Jakarta Sans | 11px | 800 | 14px | 0.3px | 84 | span.pbadge | Masa, Mekan |
| Plus Jakarta Sans | 14px | 800 | 18px | -0.3px | 84 | b | Masa, Mekan |
| Plus Jakarta Sans | 13px | 800 | normal | normal | 84 | button.ced-pk, span.sup-n, span.vid-c | Profil, Kapsül, Kayıt, Masa, Mekan sohbeti |
| Plus Jakarta Sans | 12px | 600 | 16px | normal | 84 | small, time, small.pv-sub | Mesajlar, Kapsül, Profil |
| Plus Jakarta Sans | 14px | 800 | normal | normal | 83 | button.rtab, span, button.ntf-chip | Aktiviteler, Mesajlar, Ayarlar, Kapsül, Kayıt, Keşfet, Masa, Mekan, Profil |
| Plus Jakarta Sans | 14px | 600 | 19px | normal | 55 | div.bub, span.ntf-t, span | Mesajlar, Masa, Mekan, Mekan sohbeti |
| Plus Jakarta Sans | 12px | 700 | normal | normal | 54 | span.chip | Mekan |
| Plus Jakarta Sans | 12px | 800 | 16px | normal | 53 | span.vlive, span, b | Aktiviteler, Mesajlar, Kapsül, Kayıt, Keşfet, Masa, Mekan sohbeti |
| Plus Jakarta Sans | 11px | 800 | normal | normal | 44 | span, span.tag, span.etype | Aktiviteler, Ayarlar, Mesajlar, Keşfet, Masa, Mekan, Profil |
| Plus Jakarta Sans | 28px | 800 | 34px | -0.8px | 40 | h1, h1.ptitle | Aktiviteler, Profil, Mesajlar, Ayarlar, Kayıt, Keşfet |
| Plus Jakarta Sans | 13px | 800 | 18px | normal | 39 | button.vname, b.ns-h, span.vname | Ayarlar, Mesajlar, Kapsül, Mekan, Mekan sohbeti |
| Plus Jakarta Sans | 15px | 800 | 20px | -0.3px | 38 | b | Mekan |
| Plus Jakarta Sans | 15px | 700 | normal | normal | 35 | span, button.danger, button | Mesajlar, Ayarlar, Kayıt, Masa, Mekan, Mekan sohbeti, Profil |
| Plus Jakarta Sans | 13px | 700 | 18px | normal | 34 | p.anote, span.ptxt, span.prev | Aktiviteler, Ayarlar, Mesajlar, Kapsül, Kayıt, Keşfet, Mekan sohbeti |
| Plus Jakarta Sans | 14px | 600 | 20px | normal | 32 | p, p.pbio, p.ci-me | Mesajlar, Ayarlar, Kapsül, Kayıt, Keşfet, Masa, Mekan, Mekan sohbeti, Profil |
| Plus Jakarta Sans | 11px | 700 | 14px | normal | 31 | small | Kapsül |
| Plus Jakarta Sans | 12px | 800 | 16px | -0.3px | 28 | b | Kapsül |
| Plus Jakarta Sans | 12px | 700 | 16px | normal | 26 | small, span, div.smsg | Kapsül, Masa, Mekan, Profil |
| Plus Jakarta Sans | 21px | 800 | normal | -0.5px | 25 | h2 | Mesajlar, Ayarlar, Kapsül, Kayıt, Keşfet, Masa, Mekan, Mekan sohbeti, Profil |
| Plus Jakarta Sans | 15px | 800 | normal | normal | 24 | span | Kapsül, Mekan |
| Plus Jakarta Sans | 16px | 700 | 21px | -0.2px | 22 | b | Profil, Mesajlar |
| Plus Jakarta Sans | 13px | 400 | 18px | normal | 18 | button.vr, span.react | Mesajlar, Mekan sohbeti |
| Plus Jakarta Sans | 15px | 600 | 21px | normal | 17 | p, p.sup-err | Kayıt |
| Plus Jakarta Sans | 16px | 800 | 20px | -0.3px | 16 | b | Masa, Mekan |
| Plus Jakarta Sans | 16px | 700 | normal | normal | 16 | span | Kayıt, Masa |
| Plus Jakarta Sans | 15px | 800 | 20px | -0.2px | 15 | b | Keşfet |
| Plus Jakarta Sans | 17px | 800 | 22px | -0.3px | 13 | b | Mekan |
| Plus Jakarta Sans | 22px | 800 | 25.3px | -0.6px | 11 | h1.venue | Mekan |
| Plus Jakarta Sans | 16px | 800 | 20px | -0.2px | 11 | b | Mesajlar, Kapsül, Mekan sohbeti |
| Plus Jakarta Sans | 11px | 800 | 14px | normal | 10 | span.dday, span.pn-tag | Mesajlar, Mekan sohbeti, Profil |
| Plus Jakarta Sans | 13px | 600 | 17px | normal | 10 | small.ntf-s, span.vid-t, span | Mesajlar, Mekan sohbeti |
| Plus Jakarta Sans | 14px | 800 | 19px | normal | 7 | b | Mesajlar, Mekan |
| Plus Jakarta Sans | 26px | 800 | 32px | -0.6px | 7 | span | Profil |
| Plus Jakarta Sans | 26px | 600 | 32px | -0.6px | 7 | span.page-age | Profil |
| Plus Jakarta Sans | 14px | 700 | 18px | normal | 6 | span.nm | Masa |
| Plus Jakarta Sans | 16px | 800 | 21px | -0.2px | 6 | b | Mesajlar |
| Plus Jakarta Sans | 16px | 700 | 21px | normal | 6 | span | Kayıt |
| Plus Jakarta Sans | 13px | 800 | 17px | normal | 4 | b | Mekan sohbeti |
| Plus Jakarta Sans | 15px | 800 | 19px | -0.3px | 4 | b.etitle | Aktiviteler |
| Plus Jakarta Sans | 16px | 800 | 21px | normal | 3 | b | Mesajlar, Masa |
| Plus Jakarta Sans | 12px | 800 | 16px | -0.2px | 3 | b | Kapsül |
| Plus Jakarta Sans | 18px | 800 | normal | normal | 3 | span.cc | Kayıt |
| Plus Jakarta Sans | 13px | 700 | 16px | normal | 2 | span | Mekan |
| Plus Jakarta Sans | 20px | 800 | 34px | -0.8px | 2 | h1 | Ayarlar |
| Plus Jakarta Sans | 17px | 800 | 22px | normal | 2 | b | Ayarlar |
| Plus Jakarta Sans | 15px | 700 | 20px | normal | 2 | span | Kayıt |
| Plus Jakarta Sans | 15px | 800 | 21px | normal | 2 | b | Kayıt |
| Plus Jakarta Sans | 26px | 800 | 32px | -0.5px | 1 | h1 | Masa |
| Plus Jakarta Sans | 12px | 800 | normal | normal | 1 | button.caps-roll | Kapsül |
| Plus Jakarta Sans | 20px | 800 | 25px | -0.5px | 1 | h2 | Keşfet |
| Plus Jakarta Sans | 34px | 800 | 38px | -1.2px | 1 | span.obf-l1 | Kayıt |
| Plus Jakarta Sans | 14px | 800 | 18px | normal | 1 | button.obf-skip | Kayıt |

## components (59)

| id | grup | ad | sınıf | boyut | haller | açık: zemin/yazı/kenar/köşe/yazı | koyu: zemin/yazı/kenar | kaynak durum | kullanılan gruplar |
|---|---|---|---|---|---|---|---|---|---|
| birincil-52 | Düğmeler | Birincil, büyük (52) | button.btn.btn-room | 320x52 | normal/pressed | #6A47F5 #FFFFFF none 999px 16px/700/normal | #6A47F5 #FFFFFF none | kayit-hosgeldin | Mekan, Mekan sohbeti, Masa, Profil, Kapsül, Ayarlar, Keşfet, Kayıt |
| birincil-52-yukleniyor | Düğmeler | Birincil, büyük, yükleniyor | button.btn.btn-room.busy | 328x52 | normal | #E6E2F2 #5E5878 none 999px 16px/700/normal | #29283A #B8B3D2 none | kayit-telefon | Kayıt |
| birincil-52-pasif | Düğmeler | Birincil, büyük, pasif | button.btn.btn-room | 328x52 | normal | #E6E2F2 #5E5878 none 999px 16px/700/normal | #29283A #B8B3D2 none | kayit-telefon | Mekan, Mekan sohbeti, Masa, Profil, Kapsül, Ayarlar, Keşfet, Kayıt |
| birincil-48 | Düğmeler | Birincil (48) | button.btn.btn-room | 320x48 | normal/pressed | #6A47F5 #FFFFFF none 999px 14px/700/normal | #6A47F5 #FFFFFF none | mekan-masa-kur | Mekan, Mekan sohbeti, Masa, Profil, Kapsül, Ayarlar, Keşfet, Kayıt |
| birincil-48-pasif | Düğmeler | Birincil, pasif | button.btn.btn-room | 328x48 | normal | #E6E2F2 #5E5878 none 999px 14px/700/normal | #29283A #B8B3D2 none | profil-duzenle | Mekan, Mekan sohbeti, Masa, Profil, Kapsül, Ayarlar, Keşfet, Kayıt |
| birincil-48-15 | Düğmeler | Birincil, 15 px yazı (Masa kur) | button.btn.btn-room | 298x48 | normal/pressed | #6A47F5 #FFFFFF none 999px 15px/700/normal | #6A47F5 #FFFFFF none | mekan | Mekan, Mekan sohbeti, Masa, Profil, Kapsül, Ayarlar, Keşfet, Kayıt |
| birincil-36 | Düğmeler | Küçük birincil (36) | button.ntf-chip.main | 89x36 | normal/pressed | #6A47F5 #FFFFFF none 999px 14px/800/normal | #6A47F5 #FFFFFF none | masa-davet | Masa, Mesajlar |
| yumusak-beyaz | Düğmeler | Yumuşak, beyaz (btn-soft) | button.btn.btn-soft.vh-go | 298x48 | normal/pressed | #FFFFFF #14112B none 999px 14px/700/normal | #1C1838 #F3F0FF none | kesfet | Keşfet |
| yumusak-lavanta | Düğmeler | Yumuşak, lavanta (Vazgeç) | button.close | 320x48 | normal/pressed | #EEEBF8 #14112B none 999px 14px/700/normal | #262148 #F3F0FF none | masa-bitir | Mekan, Mekan sohbeti, Masa, Mesajlar, Profil, Kapsül, Ayarlar, Keşfet, Kayıt |
| yumusak-36 | Düğmeler | Küçük yumuşak (36) | button.ntf-chip.ghost | 117.1x36 | normal/pressed | #EEEBF8 #14112B none 999px 14px/800/normal | #262148 #F3F0FF none | engellenenler | Mesajlar, Ayarlar |
| tehlike | Düğmeler | Tehlike, dolu | button.btn.btn-danger | 320x48 | normal/pressed | #C8331F #FFFFFF none 999px 14px/700/normal | #C8331F #FFFFFF none | masa-bitir | Masa, Profil, Ayarlar |
| tehlike-yumusak | Düğmeler | Tehlike, yumuşak (Bitir) | button.endbtn | 78.5x44 | normal/pressed | #FBE1DB #A8301A none 999px 14px/800/normal | #272638 #FF977E none | masa-sahibi | Masa |
| basari | Düğmeler | Başarı (Arkadaş ekle) | button.btn.pa-friend | 159x48 | normal/pressed | #CDEFD9 #0F5C31 none 999px 14px/700/normal | #173022 #8AD19F none | profil-baskasi | Profil |
| kenarli-36 | Düğmeler | Kenarlı hap (36) | button.hb | 102.4x36 | normal/pressed | #FFFFFF #14112B 1px #DAD3F2 999px 13px/700/normal | #1C1838 #F3F0FF 1px #3A3563 | masa-sahibi | Masa |
| kenarli-44 | Düğmeler | Kenarlı hap (44) | button.pedit | 159x44 | normal/pressed | #FFFFFF #14112B 1px #DAD3F2 999px 14px/700/normal | #1C1838 #F3F0FF 1px #3A3563 | profil | Profil, Kayıt |
| baglanti | Düğmeler | Metin bağlantısı | button.link | 28x44 | normal | #000000/0 #5A3AE6 none 0px 14px/800/normal | #000000/0 #AFB0FF none | kayit-onay | Kayıt |
| yuvarlak-geri | Düğmeler | Yuvarlak geri (44) | button.round.back | 44x44 | normal/pressed | #FFFFFF #14112B 1px #E3DEF2 50% 16px/400/normal | #1C1838 #F3F0FF 1px #34305A | masa-sahibi | Mekan sohbeti, Masa, Mesajlar, Profil, Kapsül, Ayarlar, Kayıt |
| yuvarlak-simge | Düğmeler | Yuvarlak simge (44) | button.round.nbell | 44x44 | normal/pressed | #FFFFFF #14112B none 50% 16px/400/normal | #1C1838 #F3F0FF none | mesajlar | Mesajlar |
| gonder | Düğmeler | Gönder (52) | button.send | 52x52 | normal/pressed | #FFFFFF #14112B none 50% 16px/400/normal | #1C1838 #F3F0FF none | dm | Mekan sohbeti, Masa, Mesajlar |
| katil | Katıl | Katıl | button.join | 66.9x44 | normal/pressed | #CDEFD9 #0F5C31 none 999px 14px/700/normal | #173022 #8AD19F none | mekan | Mekan |
| katil-12 | Katıl | Katıl, masa dolu (aria-disabled) | button.join | 66.9x44 | normal | #CDEFD9 #0F5C31 none 999px 14px/700/normal | #173022 #8AD19F none | mekan-12-kisi | Mekan |
| katil-burada | Katıl | Bu masadayım (join ghost) | button.join.ghost | 304x44 | normal/pressed | #EEEBF8 #14112B none 999px 14px/700/normal | #262148 #F3F0FF none | mekan | Mekan |
| lobi-satiri | Katıl | Lobi masa kartı | div.card.row | 328x94 | normal | #FFFFFF #14112B 1px #14112B/0.06 22px 16px/400/normal | #1C1838 #F3F0FF 1px #302F48/0.06 | mekan | Mekan |
| lobi-satiri-bekliyor | Katıl | Lobi kartı, istek bekliyor | div.card.row | 328x94 | normal | #FFFFFF #14112B 1px #14112B/0.06 22px 16px/400/normal | #1C1838 #F3F0FF 1px #302F48/0.06 | mekan-istek-musait-degil | Mekan |
| lobi-satiri-kabul | Katıl | Lobi kartı, kabul edildi | div.card.row | 328x117 | normal | #FFFFFF #14112B 1px #14112B/0.06 22px 16px/400/normal | #1C1838 #F3F0FF 1px #302F48/0.06 | mekan-istek-kabul | Mekan |
| takim-karti | Takım kartı (tc-cta) | Takım kartı, Katıl | button.tcard | 159x220 | normal/pressed | #FFFFFF #14112B 2px #000000/0 22px 16px/400/normal | #1C1838 #F3F0FF 2px #000000/0 | oyun-tb-teams | Eski oyunlar |
| takim-karti-pembe | Takım kartı (tc-cta) | Takım kartı, ikinci renk | button.tcard | 159x220 | normal | #FFFFFF #14112B 2px #000000/0 22px 16px/400/normal | #1C1838 #F3F0FF 2px #000000/0 | oyun-tb-teams | Eski oyunlar |
| takim-karti-burada | Takım kartı (tc-cta) | Takım kartı, Buradasın | button.tcard.mine | 159x222 | normal | #FFFFFF #14112B 2px #6A47F5 22px 16px/400/normal | #1C1838 #F3F0FF 2px #6A47F5 | oyun-tb-teams | Eski oyunlar |
| tc-cta | Takım kartı (tc-cta) | tc-cta tek başına | span.tc-cta | 135x40 | normal | #6A47F5 #FFFFFF none 999px 14px/800/normal | #6A47F5 #FFFFFF none | oyun-tb-teams | Eski oyunlar |
| kart-masasiz | Kartlar | Kart: henüz masan yok | div.card.mine.nomasa | 328x151 | normal | #FFFFFF #14112B 1px #14112B/0.06 22px 16px/400/normal | #1C1838 #F3F0FF 1px #302F48/0.06 | mekan | Mekan |
| kart-masam | Kartlar | Kart: masam | div.card.mine | 328x154 | normal | #FFFFFF #14112B 1px #14112B/0.06 22px 16px/400/normal | #1C1838 #F3F0FF 1px #302F48/0.06 | mekan-masam-var | Mekan |
| kart-baglanti | Kartlar | Bağlantı kartı (Mekan sohbeti) | button.card.linkcard.chat | 328x78 | normal/pressed | #FFFFFF #14112B 1px #14112B/0.06 22px 16px/400/normal | #1C1838 #F3F0FF 1px #302F48/0.06 | mekan | Mekan |
| kart-bos | Kartlar | Boş durum kartı (lobi) | div.card.empty-card | 328x94 | normal | #FFFFFF #14112B 1px #14112B/0.06 22px 16px/400/normal | #1C1838 #F3F0FF 1px #302F48/0.06 | mekan-lobi-bos | Mekan |
| kart-poster | Kartlar | Oyun posteri | button.poster | 158x211 | normal/pressed | #FFFFFF #14112B none 22px 16px/400/normal | #1C1838 #F3F0FF none | masa-sahibi | Masa |
| kart-poster-yakinda | Kartlar | Oyun posteri, yakında | button.poster.soon | 158x211 | normal | #FFFFFF #14112B none 22px 16px/400/normal | #1C1838 #F3F0FF none | masa-posterler-yakinda | Masa |
| alt-sekme-mekan | Sekme çubuğu | Alt sekme çubuğu, Mekan seçili | nav.nav | 336x62 | normal | gradient #14112B 1px #FFFFFF/0.78 999px 16px/400/normal | gradient #F3F0FF 1px #1C1838/0.78 | mekan | Mekan, Mesajlar, Profil, Keşfet, Aktiviteler |
| alt-sekme-mesajlar | Sekme çubuğu | Alt sekme çubuğu, Mesajlar seçili | nav.nav | 336x62 | normal | gradient #14112B 1px #FFFFFF/0.78 999px 16px/400/normal | gradient #F3F0FF 1px #1C1838/0.78 | mesajlar | Mekan, Mesajlar, Profil, Keşfet, Aktiviteler |
| alt-sekme-profil | Sekme çubuğu | Alt sekme çubuğu, Profil seçili | nav.nav | 336x62 | normal | gradient #14112B 1px #FFFFFF/0.78 999px 16px/400/normal | gradient #F3F0FF 1px #1C1838/0.78 | profil | Mekan, Mesajlar, Profil, Keşfet, Aktiviteler |
| bolumlu-sekme | Sekme çubuğu | Bölümlü sekme (rtabs) | div.rtabs | 328x50 | normal | #EAE6F6 #14112B none 999px 16px/400/normal | #262148 #F3F0FF none | masa-sahibi | Masa |
| suzgec-cipleri | Sekme çubuğu | Süzgeç çipleri (cats) | div.cats.vcats | 360x44 | normal | #000000/0 #14112B none 0px 16px/400/normal | #000000/0 #F3F0FF none | kesfet | Keşfet |
| sohbet-satiri | Satırlar ve pencereler | Sohbet satırı | button.crow | 326x76 | normal/pressed | #000000/0 #14112B none 0px 16px/400/normal | #000000/0 #F3F0FF none | mesajlar | Mesajlar |
| sohbet-satiri-okunmamis | Satırlar ve pencereler | Sohbet satırı, okunmamış | button.crow.unread | 326x76 | normal | #000000/0 #14112B none 0px 16px/400/normal | #000000/0 #F3F0FF none | mesajlar | Mesajlar |
| pencere-onay | Satırlar ve pencereler | Alt pencere: onay | section.sheet | 360x234 | normal | #FFFFFF #14112B none 28px 28px 0px 0px 16px/400/normal | #1C1838 #F3F0FF none | masa-bitir | Mekan sohbeti, Masa, Mesajlar, Profil, Ayarlar, Keşfet |
| pencere-liste | Satırlar ve pencereler | Alt pencere: seçenek listesi | section.sheet | 360x310 | normal | #FFFFFF #14112B none 28px 28px 0px 0px 16px/400/normal | #1C1838 #F3F0FF none | dm-secenekler | Mekan sohbeti, Masa, Mesajlar, Profil, Ayarlar, Keşfet |
| pencere-davet | Satırlar ve pencereler | Alt pencere: davet listesi | section.sheet.invs | 360x666 | normal | #FFFFFF #14112B none 28px 28px 0px 0px 16px/400/normal | #1C1838 #F3F0FF none | masa-davet | Masa |
| alan-isim | Form | Metin alanı, boş | label.sup-field | 320x78 | normal | #000000/0 #14112B none 0px 16px/400/normal | #000000/0 #F3F0FF none | kayit-isim | Kayıt |
| alan-isim-dolu | Form | Metin alanı, dolu | label.sup-field | 320x78 | normal | #000000/0 #14112B none 0px 16px/400/normal | #000000/0 #F3F0FF none | kayit-isim | Kayıt |
| alan-telefon | Form | Telefon alanı | label.sup-phone | 320x60 | normal | #FFFFFF #14112B 1px #DAD3F2 20px 16px/400/normal | #1C1838 #F3F0FF 1px #3A3563 | kayit-telefon | Kayıt |
| alan-kod | Form | Kod alanı | div.otp | 320x58 | normal | #000000/0 #14112B none 0px 16px/400/normal | #000000/0 #F3F0FF none | kayit-kod | Kayıt |
| alan-hata | Form | Alan hatası metni | p.sup-err | 320x42 | normal | #000000/0 #5E5878 none 0px 15px/600/21px | #000000/0 #B8B3D2 none | kayit-telefon-hata | Kayıt |
| uyari | Form | Uyarı kutusu (fotoğrafsız erkek) | p.sup-warn | 320x74 | normal | #FFF1D6 #5C3A00 none 16px 13px/700/18px | #3A2A10 #FFE2B3 none | kayit-foto-erkek | Kayıt |
| alan-secim | Form | Seçim (doğum tarihi) | select. | 80.5x56 | normal | #FFFFFF #14112B 1px #DAD3F2 16px 16px/700/normal | #1C1838 #F3F0FF 1px #3A3563 | kayit-dogum | Kayıt |
| alan-cok-satir | Form | Çok satırlı alan | textarea. | 298x89 | normal | #FFFFFF #14112B 1px #DAD3F2 16px 15px/600/21px | #1C1838 #F3F0FF 1px #3A3563 | profil-duzenle | Profil |
| anahtar-kapali | Form | Anahtar, kapalı | button.vsw | 52x32 | normal | #CFC8E6 #14112B none 999px 16px/400/normal | #3A3563 #F3F0FF none | mekan-masa-kur | Mekan, Mekan sohbeti, Ayarlar |
| anahtar-acik | Form | Anahtar, açık | button.vsw | 52x32 | normal | #6A47F5 #14112B none 999px 16px/400/normal | #8F78FF #F3F0FF none | mekan-masa-kur | Mekan, Mekan sohbeti, Ayarlar |
| anonim-anahtari | Form | Anonim anahtarı | button.anon-sw | 46x28 | normal | #FFFFFF #14112B 1px #E3DEF2 14px 16px/400/normal | #1C1838 #F3F0FF 1px #34305A | mekan | Mekan |
| yukleniyor | Geri bildirim | Yükleniyor göstergesi (lobi) | div.lobby-load.show | 328x140 | normal | #000000/0 #14112B none 0px 16px/400/normal | #000000/0 #F3F0FF none | mekan-lobi-yukleniyor | Mekan |
| bildirim-noktasi | Geri bildirim | Okunmamış noktası (sekme) | i.tdot | 9x9 | normal | #C51F62 #14112B none 50% 11px/800/normal | #FF5C93 #F3F0FF none | mesajlar | Mesajlar |
| toast | Geri bildirim | Kısa bildirim (toast) | div.toast | 190x42 | normal | #14112B #FFFFFF none 22px 14px/700/18px | #F3F0FF #14112B none | aktiviteler | Mesajlar, Aktiviteler |

## motion_by_group (ayrıntı: json motion_by_state)

| grup | durum sayısı | keyframes | geçiş özellikleri | basma kuralı |
|---|---|---|---|---|
| Mekan | 12 | bob, fadeIn, liveHalo, livePulse, pageIn, pulseG, rowIn, up | background-color, border-color, box-shadow, fill, opacity, transform | 5 |
| Mekan sohbeti | 4 | fadeIn, liveHalo, livePulse, pageFade, pageIn, typing, up | background-color, border-color, box-shadow, fill, opacity, transform | 4 |
| Masa | 16 | arm, bub, cardf, eq, eyes, fadeIn, fanl, fanr, flip, grab, hop, imp, lamp, liveHalo, livePulse, needle, note, pageIn, press, qbob, ray, reqIn, sandb, sandt, spark, spin, stamp, sway, timer, twk, typing, up | all, background-color, border-color, box-shadow, color, fill, opacity, transform | 6 |
| Mesajlar | 10 | fadeIn, nbClap, nbRing, pageFade, pageIn, typing, up, vbump | background-color, border-color, box-shadow, color, fill, opacity, transform | 7 |
| Profil | 11 | blink, fadeIn, pageIn, pavIn, pdSpin, pdTw, pdWig, rowIn, up | background-color, border-color, box-shadow, color, fill, opacity, transform | 5 |
| Kapsül | 4 | blink, cedBeat, cpJump, cpLand, fadeIn, pageFade, pageIn, rowIn, up | background-color, box-shadow, opacity, transform | 1 |
| Ayarlar | 8 | fadeIn, pageIn, up | background-color, box-shadow, opacity, transform | 3 |
| Keşfet | 3 | fadeIn, liveHalo, livePulse, pageIn, rowIn, steam, up | background-color, border-color, box-shadow, color, fill, opacity, transform | 2 |
| Aktiviteler | 1 | bean, clinkl, clinkr, eq, fire, micb, note, pageIn, qbob, rowIn, spark, spark2, steam, sway, twk | background-color, box-shadow, color, fill, opacity, transform | 2 |
| Kayıt | 15 | fadeIn, none, nope, obBlink, obfBob, obfIn, obfSway, pageIn, pavIn, up | background-color, border-color, border-width, box-shadow, opacity, scale, transform, translate | 1 |
| Eski oyunlar | 43 | arm, bub, cardf, ccIn, cdIn, confFall, eq, eyes, fadeIn, fanl, fanr, flip, grab, hop, imp, lamp, liveHalo, livePulse, mgIn, needle, note, nxOpen, pageIn, press, qbob, ray, ringOut, sandb, sandt, spark, spin, stamp, sway, sxEq, sxSpin, tgIn, timer, tkUp, tmIn, twk, typing, up, vbump | background-color, border-color, box-shadow, color, fill, opacity, stroke, stroke-dashoffset, transform, width | 0 |

## motion.keyframes (122)

| ad | katman | özellikler | seçici | süre | gecikme | eğri | tekrar | dolgu | gruplar | örnek öğe |
|---|---|---|---|---|---|---|---|---|---|---|
| pageIn | base | opacity, transform | .page | .28s | - | cubic-bezier(.2,.8,.2,1) | 1 | both | Mekan, Mekan sohbeti, Masa, Mesajlar, Profil, Kapsül, Ayarlar, Keşfet, Aktiviteler, Kayıt, Eski oyunlar | section.page[data-page] |
| bob | base | transform | .va .emblem | 3.4s | - | ease-in-out | infinite | - | Mekan | span.tic.ti-parti-disko |
| pulseG | base | box-shadow | .va .dot.open | 2s | - | ease-out | infinite | - | Mekan | i.dot.open[data-dot] |
| rowIn | base | opacity, transform | .reveal>* | .34s | - | cubic-bezier(.2,.8,.2,1) | 1 | both | Mekan | div.card.row |
| rowIn | base | opacity, transform | .cap | .34s | - | cubic-bezier(.2,.8,.2,1) | 1 | backwards | Kapsül | button.cap |
| rowIn | base | opacity, transform | .frow | .34s | - | cubic-bezier(.2,.8,.2,1) | 1 | backwards | Profil | div.frow |
| rowIn | base | opacity, transform | .evc | .36s | - | cubic-bezier(.2,.8,.2,1) | 1 | backwards | Aktiviteler | article.evc[data-kind] |
| rowIn | base | opacity, transform | .hrow | .34s | - | cubic-bezier(.2,.8,.2,1) | 1 | backwards | - |  |
| rowIn | base | opacity, transform | .vrow | .34s | - | cubic-bezier(.2,.8,.2,1) | 1 | backwards | Keşfet | button.vrow[data-venue] |
| livePulse | base | transform | .live | 1.6s | - | ease-in-out | infinite | - | Mekan, Mekan sohbeti, Masa, Keşfet, Eski oyunlar | i.live |
| liveHalo | base | opacity, transform | .live::after | 1.6s | - | ease-in-out | infinite | - | Mekan, Mekan sohbeti, Masa, Keşfet, Eski oyunlar | i.live |
| liveFade | base | opacity | .live | 1.6s | - | ease-in-out | infinite | - | Mekan, Mekan sohbeti, Masa, Keşfet, Eski oyunlar | i.live |
| vbump | base | transform | .poster .vote.bump | .45s | - | cubic-bezier(.34,1.56,.64,1) | 1 | - | - |  |
| vbump | base | transform | .tg-score span.bump | .45s | - | cubic-bezier(.34,1.56,.64,1) | 1 | - | Eski oyunlar | span.bump[data-tg-sa] |
| vbump | base | transform | .tg-st .c.bump b | .45s | - | cubic-bezier(.34,1.56,.64,1) | 1 | - | - |  |
| vbump | base | transform | .mg-pts b.bump | .45s | - | cubic-bezier(.34,1.56,.64,1) | 1 | - | - |  |
| vbump | base | transform | .nb-bdg.bump | .45s | - | cubic-bezier(.34,1.56,.64,1) | 1 | - | Mesajlar | span.nb-bdg.bump[data-nbdg] |
| vbump | base | transform | .react | .4s | - | cubic-bezier(.34,1.56,.64,1) | 1 | - | Mesajlar | span.react |
| vbump | base | transform | .swipe-ic.hit | .4s | - | cubic-bezier(.34,1.56,.64,1) | 1 | - | - |  |
| vbump | base | transform | .vr.pop | .4s | - | cubic-bezier(.34,1.56,.64,1) | 1 | - | - |  |
| vbump | base | transform | .eint.pop | .4s | - | cubic-bezier(.34,1.56,.64,1) | 1 | - | - |  |
| tpop | base | opacity, transform | .poster.pop | .38s | - | cubic-bezier(.34,1.56,.64,1) | 1 | backwards | - |  |
| pwave | base | transform | .pw | 1.1s | - | ease-in-out | infinite | - | - |  |
| twk | base | opacity | .tw | 2.4s | - | ease-in-out | infinite | - | Masa, Eski oyunlar | circle |
| twk | base | opacity | .sh-glow | 3.4s | - | ease-in-out | infinite | - | Masa, Eski oyunlar | ellipse |
| twk | base | opacity | .ib-target | 1.9s | - | ease-in-out | infinite | - | Masa, Eski oyunlar | path |
| twk | base | opacity | .ev-tw | 2.4s | - | ease-in-out | infinite | - | Aktiviteler | circle |
| twk | base | opacity | .ev-glow | 2.2s | - | ease-in-out | infinite | - | Aktiviteler | ellipse |
| sway | base | transform | .st-spot | 5s | - | ease-in-out | infinite | - | Masa, Eski oyunlar | g |
| sway | base | transform | .ev-spot | 5s | - | ease-in-out | infinite | - | Aktiviteler | g |
| micb | base | transform | .st-mic | 2.8s | - | ease-in-out | infinite | - | - |  |
| micb | base | transform | .ev-mic | 2.8s | - | ease-in-out | infinite | - | Aktiviteler | g |
| cardf | base | transform | .st-card | 3.2s | - | ease-in-out | infinite | - | - |  |
| cardf | base | transform | .tb-card | 3.4s | - | ease-in-out | infinite | - | Masa, Eski oyunlar | g |
| stamp | base | transform | .st-stamp | 2.6s | - | ease-in-out | infinite | - | Masa, Eski oyunlar | g |
| lamp | base | opacity, transform | .sh-lamp | 4.6s | - | ease-in-out | infinite | - | Masa, Eski oyunlar | g |
| eyes | base | transform | .sh-eyes | 3.4s | - | ease-in-out | infinite | - | Masa, Eski oyunlar | g |
| imp | base | transform | .sh-imp | 3.4s | - | ease-in-out | infinite | - | Masa, Eski oyunlar | g |
| qbob | base | transform | .sh-q | 2.8s | - | ease-in-out | infinite | - | Masa, Eski oyunlar | g |
| qbob | base | transform | .sk-m | 3.6s | - | ease-in-out | infinite | - | Masa, Eski oyunlar | g |
| qbob | base | transform | .ev-cup | 3s | - | ease-in-out | infinite | - | Aktiviteler | g |
| qbob | base | transform | .ev-tag | 2.6s | - | ease-in-out | infinite | - | Aktiviteler | g |
| spin | base | transform | .hk-rays | 30s | - | linear | infinite | - | Masa, Eski oyunlar | g |
| spin | base | transform | .sg-vinyl | 6s | - | linear | infinite | - | Masa, Eski oyunlar | g |
| timer | base | stroke-dashoffset | .hk-time | 5s | - | linear | infinite | - | Masa, Eski oyunlar | circle |
| hop | base | transform | .hk-t | 2.8s | - | ease-in-out | infinite | - | Masa, Eski oyunlar | g |
| grab | base | transform | .hk-grab | 2.8s | - | cubic-bezier(.34,1.56,.64,1) | infinite | - | Masa, Eski oyunlar | g |
| spark | base | opacity, transform | .hk-spark | 2.8s | - | ease-in-out | infinite | - | Masa, Eski oyunlar | g |
| spark | base | opacity, transform | .ev-spark2 | 2.6s | - | ease-in-out | infinite | - | Aktiviteler | g |
| arm | base | transform | .sg-arm | 4s | - | ease-in-out | infinite | - | Masa, Eski oyunlar | g |
| eq | base | transform | .sg-bar | 1.2s | - | ease-in-out | infinite | - | Masa, Eski oyunlar | rect |
| eq | base | transform | .ev-eq | 1.2s | - | ease-in-out | infinite | - | Aktiviteler | rect |
| note | base | opacity, transform | .sg-note | 3.2s | - | ease-in-out | infinite | - | Masa, Eski oyunlar | g |
| note | base | opacity, transform | .ev-note | 3.2s | - | ease-in-out | infinite | - | Aktiviteler | g |
| needle | base | transform | .ib-needle | 3.8s | - | cubic-bezier(.34,1.56,.64,1) | infinite | - | Masa, Eski oyunlar | g |
| fanl | base | transform | .sk-l | 3.6s | - | ease-in-out | infinite | - | Masa, Eski oyunlar | g |
| fanr | base | transform | .sk-r | 3.6s | - | ease-in-out | infinite | - | Masa, Eski oyunlar | g |
| typing | base | opacity, transform | .sk-dot | 1.2s | - | ease-in-out | infinite | - | Masa, Eski oyunlar | circle |
| typing | base | opacity, transform | .prev.typing i | 1.2s | - | ease-in-out | infinite | - | Mesajlar | i |
| typing | base | opacity, transform | .dwho small i | 1.2s | - | ease-in-out | infinite | - | Mesajlar | i |
| typing | base | opacity, transform | .bub.typing i | 1.2s | - | ease-in-out | infinite | - | Mekan sohbeti, Mesajlar | i |
| bub | base | opacity, transform | .sk-bub | 4.2s | - | ease-in | infinite | - | Masa, Eski oyunlar | circle |
| press | base | transform | .tb-dome | 2.6s | - | ease-in-out | infinite | - | Masa, Eski oyunlar | g |
| ray | base | opacity, transform | .tb-ray | 2.6s | - | ease-out | infinite | - | Masa, Eski oyunlar | rect |
| flip | base | transform | .tb-glass | 5s | - | cubic-bezier(.65,0,.35,1) | infinite | - | Masa, Eski oyunlar | g |
| sandt | base | transform | .tb-sandt | 5s | - | linear | infinite | - | Masa, Eski oyunlar | rect |
| sandb | base | transform | .tb-sandb | 5s | - | linear | infinite | - | Masa, Eski oyunlar | rect |
| reqIn | base | opacity, transform | .req | .36s | - | cubic-bezier(.34,1.56,.64,1) | 1 | both | Masa | div.req.owner-only[data-req] |
| shoot | base | opacity, transform | .send.shoot .sg | .55s | - | cubic-bezier(.2,.8,.2,1) | 1 | - | - |  |
| ptIn | base | opacity, transform | .ptoast.show | .5s | - | cubic-bezier(.34,1.56,.64,1) | 1 | both | - |  |
| ptOut | base | opacity, transform | .ptoast.leave | .26s | - | ease | 1 | both | - |  |
| pageFade | base | opacity | .page.dm,.page.vc |  | - | ease | 1 | - | Mekan sohbeti, Mesajlar | section.page.vc[data-page] |
| pageFade | base | opacity | .page.ced |  | - | ease | 1 | - | Kapsül | section.page.ced[data-page] |
| tmIn | base | opacity, transform | .tm.new | .4s | - | cubic-bezier(.34,1.56,.64,1) | 1 | both | Eski oyunlar | span.tm.new |
| tmIn | base | opacity, transform | .tgu-feed span | .4s | - | cubic-bezier(.34,1.56,.64,1) | 1 | both | - |  |
| tmIn | base | opacity, transform | .bx-say.bx-yes .bx-spk::after,.bx-say.bx-no .bx-spk::after | .4s | - | cubic-bezier(.34,1.56,.64,1) | 1 | both | - |  |
| tmIn | base | opacity, transform | .bx-objrow span | .3s | - | cubic-bezier(.34,1.56,.64,1) | 1 | both | Eski oyunlar | span |
| tmIn | base | opacity, transform | .cmsg | .35s | - | cubic-bezier(.34,1.56,.64,1) | 1 | both | Eski oyunlar | div.cmsg |
| nope | base | transform | .ttbar .btn.nope | .36s | - | ease | 1 | - | - |  |
| nope | base | transform | .spbar .btn.nope | .36s | - | ease | 1 | - | - |  |
| nope | base | transform | .mpbar .btn.nope | .36s | - | ease | 1 | - | - |  |
| nope | base | transform | .va .btn.nope,.ntf-chip.nope,.anon-sw.nope | .36s | - | ease | 1 | - | Kayıt | button.btn.btn-room[data-sup-next] |
| nope | base | transform | .vid.nope | .36s | - | ease | 1 | - | - |  |
| nope | base | transform | .poster.nope | .36s | - | ease | 1 | - | - |  |
| tgIn | base | opacity, transform | .tg-body | .3s | - | ease | 1 | both | Eski oyunlar | div.tg-body[data-tg-body] |
| tgIn | base | opacity, transform | .sgr-reveal | .4s | - | ease | 1 | both | Eski oyunlar | div.sgr-reveal |
| tPulse | base | transform | .tg.low .tg-timer b | 1s | - | ease-in-out | infinite | - | - |  |
| tkUp | base | transform | .tk.in | .46s | - | cubic-bezier(.34,1.56,.64,1) | 1 | backwards | Eski oyunlar | div.tk.in[data-card] |
| ringOut | base | opacity, transform | .tgu-av .ring | 1.6s | - | ease-out | infinite | - | Eski oyunlar | i.ring |
| cdIn | base | opacity, transform | .tg-cd b | .7s | - | cubic-bezier(.34,1.56,.64,1) | 1 | both | Eski oyunlar | b |
| flIn | base | opacity, transform | .tg-flash | .4s | - | cubic-bezier(.34,1.56,.64,1) | 1 | both | - |  |
| flIn | base | opacity, transform | .sg-peekcard | .25s | - | cubic-bezier(.34,1.56,.64,1) | 1 | both | - |  |
| confFall | base | transform | .conf i | 2.6s | - | cubic-bezier(.3,.6,.5,1) | 1 | forwards | Eski oyunlar | i |
| mgIn | base | opacity, transform | .hx-card.in,.sx-card.in | .36s | - | cubic-bezier(.34,1.56,.64,1) | 1 | both | Eski oyunlar | div.hx-card.in |
| mgIn | base | opacity, transform | .nx-res | .45s | 1s | cubic-bezier(.34,1.56,.64,1) | 1 | both | Eski oyunlar | div.nx-res |
| mgIn | base | opacity, transform | .cx-card.in | .36s | - | cubic-bezier(.34,1.56,.64,1) | 1 | both | - |  |
| hxLand | base | transform | .hx-big.land | .5s | - | cubic-bezier(.34,1.56,.64,1) | 1 | - | - |  |
| sxSpin | base | transform | .sx-rec | 2.4s | - | linear | infinite | - | Eski oyunlar | span.sx-rec |
| sxEq | base | transform | .sx-eq i | .9s | - | ease-in-out | infinite | - | Eski oyunlar | i |
| nxOpen | base | opacity, transform | .nx-shut.nx-open | 1s | .25s | cubic-bezier(.6,0,.3,1) | 1 | forwards | Eski oyunlar | g |
| ccIn | base | opacity, transform | .ccard | .35s | - | cubic-bezier(.34,1.56,.64,1) | 1 | both | Eski oyunlar | div.ccard[data-ccard] |
| ccQ | base | opacity, transform | .ccard.swap .cc-q,.ccard.swap .cc-ab | .32s | - | cubic-bezier(.2,.8,.2,1) | 1 | both | - |  |
| nbRing | base | transform | .nbell.ring .nb-ic | .9s | - | cubic-bezier(.34,1.56,.64,1) | 1 | - | Mesajlar | svg |
| nbClap | base | transform | .nbell.ring .nb-clap | .9s | - | cubic-bezier(.34,1.56,.64,1) | 1 | - | Mesajlar | rect |
| pickIn | base | opacity, transform | .rpick | .26s | - | cubic-bezier(.34,1.56,.64,1) | 1 | both | - |  |
| pickIn | base | opacity, transform | .vmenu | .26s | - | cubic-bezier(.34,1.56,.64,1) | 1 | both | - |  |
| pickUp | base | opacity, transform | .rpick[data-dir="up"] |  | - | ease | 1 | - | - |  |
| pickUp | base | opacity, transform | .vmenu[data-dir="up"] |  | - | ease | 1 | - | - |  |
| flash | base | box-shadow | .msg.flash .bub | 1.1s | - | ease | 1 | - | - |  |
| rqIn | base | opacity, transform | .dreply | .28s | - | cubic-bezier(.34,1.56,.64,1) | 1 | both | - |  |
| capHop | base | transform | .cap.hop .cap-av | .5s | - | cubic-bezier(.34,1.56,.64,1) | 1 | - | - |  |
| blinkOnce | base | transform | .cap.hop .eye | .36s | .12s | ease | 1 | - | - |  |
| jIn | base | opacity, transform | .vjump | .34s | - | cubic-bezier(.34,1.56,.64,1) | 1 | both | - |  |
| blink | base | transform | .pav .eye | 4.6s | - | ease-in-out | infinite | - | - |  |
| blink | base | transform | .ced-orb .eye | 4.6s | - | ease-in-out | infinite | - | Kapsül | circle |
| blink | base | transform | .pd-av .eye | 4.6s | - | ease-in-out | infinite | - | Profil | circle |
| pavIn | base | opacity, transform | .pav | .5s | - | cubic-bezier(.34,1.56,.64,1) | 1 | both | Profil, Kayıt | span.pav[data-pav] |
| pavIn | base | opacity, transform | .pd-av | .5s | - | cubic-bezier(.34,1.56,.64,1) | 1 | both | Profil | span.pd-av[data-pd-photo-av] |
| pavSwap | base | opacity, transform | .pav.swap | .5s | - | cubic-bezier(.34,1.56,.64,1) | 1 | - | - |  |
| pavSwap | base | opacity, transform | .me.swap | .5s | - | cubic-bezier(.34,1.56,.64,1) | 1 | - | - |  |
| paNo | base | transform | .pa-no | .36s | - | cubic-bezier(.36,.07,.19,.97) | 1 | - | - |  |
| paSwap | base | transform | .pa-swap | .42s | - | cubic-bezier(.34,1.56,.64,1) | 1 | - | - |  |
| fire | base | transform | .ev-fire | .9s | - | ease-in-out | infinite | - | Aktiviteler | g |
| spark2 | base | opacity, transform | .ev-spark | 1.8s | - | ease-out | infinite | - | Aktiviteler | rect |
| steam | base | opacity, transform | .ev-steam | 2.4s | - | ease-in-out | infinite | - | Aktiviteler | rect |
| steam | base | opacity, transform | .th-steam | 2.4s | - | ease-in-out | infinite | - | Keşfet | rect |
| clinkl | base | transform | .ev-clinkl | 2.6s | - | cubic-bezier(.34,1.56,.64,1) | infinite | - | Aktiviteler | g |
| clinkr | base | transform | .ev-clinkr | 2.6s | - | cubic-bezier(.34,1.56,.64,1) | infinite | - | Aktiviteler | g |
| bean | base | transform | .ev-bean | 4s | - | ease-in-out | infinite | - | Aktiviteler | rect |
| pinHalo | base | opacity, transform | .vpin.here::before | 1.8s | - | ease-in-out | infinite | - | - |  |
| pinIn | base | opacity, transform | .vpin | .45s | - | cubic-bezier(.34,1.56,.64,1) | 1 | backwards | - |  |
| selIn | base | opacity, transform | .vsel | .34s | - | cubic-bezier(.34,1.56,.64,1) | 1 | both | - |  |
| fadeIn | base | opacity | .scrim | .2s | - | ease | 1 | both | Mekan, Mekan sohbeti, Masa, Mesajlar, Profil, Kapsül, Ayarlar, Keşfet, Kayıt, Eski oyunlar | div.scrim[data-close] |
| fadeIn | base | opacity | .toast | .2s | - | ease | 1 | both | Mesajlar | div.toast |
| up | base | transform | .sheet | .32s | - | cubic-bezier(.2,.8,.2,1) | 1 | both | Mekan, Mekan sohbeti, Masa, Mesajlar, Profil, Kapsül, Ayarlar, Keşfet, Kayıt, Eski oyunlar | section.sheet.kurs |
| emPop | v44 | transform | .kur-em.pop | .42s | - | cubic-bezier(.34,1.56,.64,1) | 1 | - | - |  |
| obBlink | v45 | transform | .obf-b .eye | 2.4s | - | ease | 1 | - | Kayıt | circle |
| obBlink | v45 | transform | .ob-pal .eye | 3.2s | .4s | ease | 1 | - | Kayıt | circle |
| obfBob | v45 | transform | .obf-b | 2.6s | - | ease-in-out | 1 | - | Kayıt | span.obf-b |
| obfJump | v45 | transform | .obf .obf-b.jump | .5s | - | cubic-bezier(.3,.7,.4,1) | 1 | - | - |  |
| obfJump | v45 | transform | .obf.calm .obf-b.jump | .5s | - | cubic-bezier(.3,.7,.4,1) | 1 | - | - |  |
| obfSway | v45 | transform | .obf-sw | 3.6s | - | ease-in-out | 1 | - | Kayıt | span.obf-sw |
| obfRing | v45 | box-shadow, opacity | .obf-ring.on | 1.6s | - | ease-in-out | 1 | - | - |  |
| obfIn | v45 | opacity | .obf-foot | .5s | .55s | ease | 1 | backwards | Kayıt | div.obf-foot |
| palJump | v45 | transform | .ob-pal.ok .ob-pal-b | .6s | - | cubic-bezier(.3,.7,.4,1) | 1 | - | - |  |
| palNo | v45 | transform | .ob-pal.err .ob-pal-b | .5s | - | ease | 1 | - | - |  |
| palNod | v45 | transform | .ob-pal.nod .ob-pal-b | .42s | - | ease | 1 | - | - |  |
| bubIn | v45 | opacity, transform | .ob-bub | .3s | - | cubic-bezier(.2,.9,.3,1.3) | 1 | - | - |  |
| obFlash | v45 | opacity | .sup-ph .pav.flash::after | .5s | - | ease-out | 1 | - | - |  |
| mkPop | v46 | transform | .mk-ic.pop .tic | .42s | - | cubic-bezier(.34,1.56,.64,1) | 1 | - | - |  |
| cpJump | v46 | transform | .ced-fig.jump .cp-b | .5s | - | cubic-bezier(.3,.7,.4,1) | 1 | - | Kapsül | g |
| cpLand | v46 | transform | .ced-orb.land .cp-b | .55s | - | cubic-bezier(.3,.7,.4,1) | 1 | - | Kapsül | g |
| cedBeat | v46 | transform | .ced-orb.land .ced-ring,.ced-ring.beat | .45s | - | ease-out | 1 | - | Kapsül | i.ced-ring[data-ced-ring] |
| emHop | v46 | transform | .cp.em-mutlu .cp-b | .8s | - | cubic-bezier(.3,.7,.4,1) | 1 | - | - |  |
| emJolt | v46 | transform | .cp.em-saskin .cp-b | .5s | - | cubic-bezier(.2,.8,.3,1.2) | 1 | - | - |  |
| emSway | v46 | transform | .cp.em-asik .cp-b | 1.6s | - | ease-in-out | 1 | - | - |  |
| emLaugh | v46 | transform | .cp.em-kahkaha .cp-b | .9s | - | linear | 1 | - | - |  |
| emShy | v46 | transform | .cp.em-utangac .cp-b | 1.6s | - | ease-in-out | 1 | - | - |  |
| emSag | v46 | transform | .cp.em-uzgun .cp-b | 1.7s | - | ease-in-out | 1 | - | - |  |
| emShake | v46 | transform | .cp.em-kizgin .cp-b | .6s | - | linear | 1 | - | - |  |
| emNod | v46 | transform | .cp.em-uykulu .cp-b | 1.7s | - | ease-in-out | 1 | - | - |  |
| fxTw | v46 | opacity, transform | .cp-tw | .9s | - | ease-in-out | 1 | both | - |  |
| fxPop | v46 | opacity, transform | .cp-pop | 1.5s | - | ease-out | 1 | both | - |  |
| fxUp | v46 | opacity, transform | .cp-up | 1.5s | - | ease-out | 1 | both | - |  |
| fxZ | v46 | opacity, transform | .cp-z | 1.6s | - | ease-out | 1 | both | - |  |
| fxCloud | v46 | opacity, transform | .cp-cloud | 1.75s | - | ease-out | 1 | both | - |  |
| fxRain | v46 | opacity, transform | .cp-rain | .5s | - | linear | infinite | - | - |  |
| fxTear | v46 | opacity, transform | .cp-tear | 1.5s | .25s | ease-in | 1 | both | - |  |
| fxTear2 | v46 | transform | .cp-tear2 | .45s | - | ease-in-out | infinite | - | - |  |
| cedRise | v46 | opacity, transform | .ced.ced-enter .ced-top | .4s | .1s | cubic-bezier(.2,.8,.2,1) | 1 | both | - |  |
| cedRise | v46 | opacity, transform | .ced.ced-enter .ced-on | .4s | .4s | cubic-bezier(.2,.8,.2,1) | 1 | both | - |  |
| cedRise | v46 | opacity, transform | .ced.ced-enter .ced-tabs | .45s | .48s | cubic-bezier(.2,.8,.2,1) | 1 | both | - |  |
| cedRise | v46 | opacity, transform | .ced.ced-enter .ced-body | .5s | .58s | cubic-bezier(.2,.8,.2,1) | 1 | both | - |  |
| cedUp | v46 | transform | .ced.ced-enter .ced-bar | .45s | .5s | cubic-bezier(.2,.8,.2,1) | 1 | both | - |  |
| cedJump | v46 | transform | .pd-av.hop svg | .5s | - | cubic-bezier(.3,.7,.4,1) | 1 | - | - |  |
| pdSpin | v46 | transform | .pd-fix.play .pd-ring | 1.1s | .5s | ease-in-out | 2 | - | Profil | i.pd-ring |
| pdSpin | v46 | transform | .pd-fix.go .pd-ring | .6s | - | linear | 1 | - | - |  |
| pdTw | v46 | opacity, transform | .pd-fix.play .pd-s1 | 1.1s | .5s | ease-in-out | 2 | - | Profil | path |
| pdTw | v46 | opacity, transform | .pd-fix.play .pd-s2 | 1.1s | .7s | ease-in-out | 2 | - | Profil | path |
| pdTw | v46 | opacity, transform | .pd-fix.play .pd-s3 | 1.1s | .9s | ease-in-out | 2 | - | Profil | path |
| pdWig | v46 | transform | .pd-fix.play | 1.1s | .5s | ease-in-out | 2 | - | Profil | button.pd-fix.play[data-pd-fix] |
| pdGo | v46 | transform | .pd-fix.go .pd-in | .42s | - | cubic-bezier(.3,.7,.4,1.3) | 1 | - | - |  |

## motion.transitions (117)

| seçici | katman | medya | özellik:süre:gecikme:eğri | gruplar | örnek öğe |
|---|---|---|---|---|---|
| .vt-all | base | - | transform:.38s:0:cubic-bezier(.2,.8,.2,1) | Mekan, Mesajlar, Profil, Keşfet, Aktiviteler | g |
| .vt-a,.vt-b | base | - | fill:.25s:0:ease; transform:.38s:0:cubic-bezier(.2,.8,.2,1) | Mekan, Mesajlar, Profil, Keşfet, Aktiviteler | rect |
| .vt-x | base | - | opacity:.2s:0:ease | Mekan, Mesajlar, Profil, Keşfet, Aktiviteler | rect |
| .vt-all,.vt-a,.vt-b,.vt-x | base | @media (prefers-reduced-motion:reduce) | none:None:0:None | Mekan, Mesajlar, Profil, Keşfet, Aktiviteler | g |
| .bi-a | base | - | fill:.2s:0:ease | Mekan, Masa, Profil, Eski oyunlar | rect |
| .btn>*,.join>* | base | - | opacity:.12s:0:cubic-bezier(.2,.8,.2,1); transform:.12s:0:cubic-bezier(.2,.8,.2,1) | Mekan, Mekan sohbeti, Masa, Profil, Kapsül, Ayarlar, Keşfet, Kayıt, Eski oyunlar | svg |
| .ld.mini | base | - | opacity:.16s:.06s:cubic-bezier(.2,.8,.2,1) | Kayıt | svg[data-sz] |
| .lobby-load .ld | base | - | opacity:.2s:0:ease | Mekan | svg[data-sz] |
| .poster | base | - | transform:.2s:0:cubic-bezier(.2,.8,.2,1); box-shadow:.2s:0:ease | Masa, Eski oyunlar | button.poster[data-poster] |
| .poster .vote | base | - | opacity:.2s:0:ease; transform:.3s:0:cubic-bezier(.34,1.56,.64,1); background-color:.2s:0:ease; color:.2s:0:ease | Masa, Eski oyunlar | span.vote.on |
| .rtab | base | - | background-color:.2s:0:ease; color:.2s:0:ease; box-shadow:.2s:0:ease | Masa, Mesajlar, Aktiviteler, Eski oyunlar | button.rtab.on[data-rtab] |
| .hb>* | base | - | opacity:.12s:0:cubic-bezier(.2,.8,.2,1); transform:.12s:0:cubic-bezier(.2,.8,.2,1) | Masa, Eski oyunlar | svg |
| .cin | base | - | border-color:.2s:0:ease; box-shadow:.2s:0:ease | Mekan sohbeti, Masa, Mesajlar, Eski oyunlar | input.cin[data-vch-input] |
| .send | base | - | background-color:.25s:0:ease; transform:.15s:0:ease | Mekan sohbeti, Masa, Mesajlar, Eski oyunlar | button.send[data-vch-send] |
| .send-ic rect | base | - | fill:.2s:0:ease; transform:.42s:0:cubic-bezier(.34,1.56,.64,1) | Mekan sohbeti, Masa, Mesajlar, Eski oyunlar | rect |
| .send-ic rect | base | @media (prefers-reduced-motion:reduce) | fill:.2s:0:ease | Mekan sohbeti, Masa, Mesajlar, Eski oyunlar | rect |
| .crow | base | - | background-color:.15s:0:ease | Mesajlar | button.crow.unread[data-crow] |
| .qrow | base | - | opacity:.25s:0:ease; transform:.3s:0:cubic-bezier(.2,.8,.2,1) | - |  |
| .qbtn | base | - | transform:.15s:0:ease | - |  |
| .tcard | base | - | border-color:.2s:0:ease; transform:.15s:0:ease | Eski oyunlar | button.tcard[data-tjoin] |
| .tc-cta | base | - | background-color:.2s:0:ease; color:.2s:0:ease | Eski oyunlar | span.tc-cta |
| .tg | base | - | background-color:.45s:0:ease | Eski oyunlar | section.page.tg[data-page] |
| .tg-bar i | base | - | transform:1s:0:linear; background-color:.3s:0:ease | Eski oyunlar | i[data-tbar] |
| .tk | base | - | transform:.6s:0:cubic-bezier(.34,1.56,.64,1); box-shadow:.35s:0:ease; opacity:.24s:0:ease | Eski oyunlar | div.tk.in[data-card] |
| .tk.held | base | - | transform:.09s:0:ease-out; box-shadow:.09s:0:ease-out | - |  |
| .tk.hov | base | - | transform:.18s:0:ease-out; box-shadow:.18s:0:ease-out | - |  |
| .tk.out-ok | base | - | transform:.26s:0:cubic-bezier(.4,0,.6,1); opacity:.26s:0:ease | - |  |
| .tk.out-pass | base | - | transform:.26s:0:cubic-bezier(.4,0,.6,1); opacity:.26s:0:ease | - |  |
| .tk.out-tabu | base | - | transform:.26s:0:cubic-bezier(.4,0,.6,1); opacity:.26s:0:ease | - |  |
| .tk-glare | base | - | opacity:.3s:0:ease | Eski oyunlar | i.tk-glare |
| .tbtn | base | - | transform:.12s:0:ease; opacity:.2s:0:ease | Eski oyunlar | button.tbtn.pass[data-act] |
| .tk,.tk.in,.tg-body,.tm.new,.tgu-av .ring,.tg-cd b,.tg-flash,.tgu-feed span,.con | base | @media (prefers-reduced-motion:reduce) | none!important::0:ease | Eski oyunlar | span.tm.new |
| .sgc-in | base | - | transform:.55s:0:cubic-bezier(.34,1.3,.64,1) | Eski oyunlar | div.sgc-in |
| .sg-ready .row span | base | - | opacity:.3s:0:ease | Eski oyunlar | span.on[data-rd] |
| .sg-order .so | base | - | transform:.3s:0:cubic-bezier(.34,1.56,.64,1); opacity:.3s:0:ease | Eski oyunlar | span.so.done |
| .sg-ring .fg | base | - | stroke-dashoffset:1s:0:linear; stroke:.3s:0:ease | Eski oyunlar | circle[data-ring] |
| .sv | base | - | background-color:.2s:0:ease; border-color:.2s:0:ease; transform:.15s:0:ease | Eski oyunlar | button.sv[data-sv] |
| .sgr-bar i | base | - | width:.8s:0:cubic-bezier(.2,.8,.2,1) | Eski oyunlar | i[data-w] |
| .sgc-in,.sg-ring .fg,.sgr-bar i | base | @media (prefers-reduced-motion:reduce) | none!important::0:ease | Eski oyunlar | div.sgc-in |
| .mg-dots i | base | - | width:.3s:0:ease; background-color:.3s:0:ease | Eski oyunlar | i.done |
| .bx-pl | base | - | opacity:.2s:0:ease | Eski oyunlar | span.bx-pl |
| .bx-ring .fg | base | - | stroke-dashoffset:1s:0:linear; stroke:.3s:0:ease | Eski oyunlar | circle[data-ring] |
| .nx-needle.nx-live | base | - | transform:.17s:0:linear | Eski oyunlar | g[data-needle] |
| .nx-rdrow span | base | - | opacity:.2s:0:ease; box-shadow:.2s:0:ease | Eski oyunlar | span[data-nrd] |
| .cx-th | base | - | border-color:.2s:0:ease; transform:.15s:0:ease | Eski oyunlar | button.cx-th.on[data-cxs-th] |
| .cx-th-chk | base | - | background-color:.2s:0:ease; border-color:.2s:0:ease | Eski oyunlar | span.cx-th-chk |
| .cx-opt | base | - | border-color:.2s:0:ease; background-color:.2s:0:ease; transform:.12s:0:ease | - |  |
| .bx-ring .fg,.nx-needle.nx-live | base | @media (prefers-reduced-motion:reduce) | none!important::0:ease | Eski oyunlar | circle[data-ring] |
| .cc-next | base | - | transform:.12s:0:ease | Eski oyunlar | button.cc-next[data-cc-next] |
| .cc-opt | base | - | border-color:.2s:0:ease; background-color:.2s:0:ease; transform:.12s:0:ease | Eski oyunlar | button.cc-opt[data-cco] |
| .ntf-row | base | - | opacity:.25s:0:ease; transform:.3s:0:cubic-bezier(.2,.8,.2,1); background-color:.3s:0:ease | Mesajlar | div.ntf-row.ntf-new[data-nid] |
| .ntf-chip | base | - | transform:.12s:0:ease | Masa, Mesajlar, Ayarlar | button.ntf-chip.main[data-inv-send] |
| .ntf-row | base | @media (prefers-reduced-motion:reduce) | none:None:0:None | Mesajlar | div.ntf-row.ntf-new[data-nid] |
| .dav | base | - | transform:.15s:0:ease | Mesajlar | span.dav[data-dav] |
| .dm .bub | base | - | transform:.15s:0:ease | Mesajlar | div.bub |
| .rpick button | base | - | transform:.15s:0:ease; background-color:.15s:0:ease | - |  |
| .swipe-ic rect | base | - | fill:.15s:0:ease | Mekan sohbeti, Mesajlar | rect |
| .vc .bub | base | - | transform:.15s:0:ease | Mekan sohbeti | div.bub |
| .vsw | base | - | background-color:.2s:0:ease | Mekan, Mekan sohbeti, Ayarlar | button.vsw[data-kur-lobby] |
| .vsw i | base | - | transform:.25s:0:cubic-bezier(.34,1.56,.64,1) | Mekan, Mekan sohbeti, Ayarlar | i |
| .vsw i | base | @media (prefers-reduced-motion:reduce) | none:None:0:None | Mekan, Mekan sohbeti, Ayarlar | i |
| .sl-ic rect | base | - | transform:.45s:0:cubic-bezier(.34,1.56,.64,1) | Profil | rect |
| .pv-seg button | base | - | background-color:.2s:0:ease; color:.2s:0:ease; box-shadow:.2s:0:ease | Profil | button.on[data-vis] |
| .pact .btn | base | - | background-color:.25s:0:ease; color:.25s:0:ease; box-shadow:.25s:0:ease | Profil | button.btn.pa-friend[data-padd] |
| button.mrow | base | - | background-color:.15s:0:ease | Masa | button.mrow[data-mp] |
| .sl-ic rect | base | @media (prefers-reduced-motion:reduce) | none:None:0:None | Profil | rect |
| .fmsg | base | - | transform:.15s:0:ease | Profil | button.fmsg[data-fm] |
| .ebio textarea | base | - | border-color:.2s:0:ease; box-shadow:.2s:0:ease | Profil | textarea[data-ebio] |
| .ebar .btn | base | - | background-color:.25s:0:ease; color:.25s:0:ease | Profil | button.btn.btn-room[data-esave] |
| .anon-sw | base | - | background-color:.25s:0:ease; border-color:.25s:0:ease | Mekan | button.anon-sw[data-anon-sw] |
| .anon-sw .knob | base | - | transform:.38s:0:cubic-bezier(.34,1.56,.64,1); background-color:.25s:0:ease | Mekan | span.knob |
| .anon-sw svg | base | - | opacity:.2s:0:ease; transform:.3s:0:cubic-bezier(.34,1.56,.64,1) | Mekan | svg |
| .anon-sw .knob,.anon-sw svg | base | @media (prefers-reduced-motion:reduce) | none:None:0:None | Mekan | span.knob |
| .eint | base | - | background-color:.2s:0:ease; transform:.15s:0:ease | Aktiviteler | button.eint[data-eint] |
| .eint svg | base | - | opacity:.2s:0:ease; transform:.35s:0:cubic-bezier(.34,1.56,.64,1) | Aktiviteler | svg |
| .dsearch | base | - | border-color:.2s:0:ease; box-shadow:.2s:0:ease | Keşfet | label.dsearch |
| .dbody.settle | base | - | transform:.45s:0:cubic-bezier(.2,.8,.2,1) | - |  |
| .vrow | base | - | background-color:.15s:0:ease | Keşfet | button.vrow[data-venue] |
| .ci-chips button | base | - | background-color:.2s:0:ease; color:.2s:0:ease; border-color:.2s:0:ease | Masa, Keşfet | button.on[data-lt] |
| .dbody.settle | base | @media (prefers-reduced-motion:reduce) | none:None:0:None | - |  |
| .vmode button | base | - | background-color:.2s:0:ease; opacity:.2s:0:ease; box-shadow:.2s:0:ease | Keşfet | button.on[data-vm] |
| .vmap-layer.settle | base | - | transform:.5s:0:cubic-bezier(.2,.8,.2,1) | - |  |
| .vpin | base | - | transform:.3s:0:cubic-bezier(.34,1.56,.64,1) | - |  |
| .vmap-hint | base | - | opacity:.4s:0:ease | - |  |
| .vmap-layer.settle | base | @media (prefers-reduced-motion:reduce) | none:None:0:None | - |  |
| .va .top .me | base | - | transform:.15s:0:ease | Mekan | button.me[data-me] |
| .va .pip | base | - | all:.25s:0:ease | Masa | span.pip |
| .va .btn | base | - | background-color:.2s:0:ease; box-shadow:.2s:0:ease | Mekan, Mekan sohbeti, Masa, Profil, Kapsül, Ayarlar, Keşfet, Kayıt, Eski oyunlar | button.btn.btn-room[data-kur-open] |
| .va .game | base | - | transform:.12s:0:ease | - |  |
| .va .game img | base | - | transform:.3s:0:cubic-bezier(.2,.8,.2,1) | - |  |
| .va .tab .ic | base | - | background-color:.2s:0:ease; box-shadow:.2s:0:ease | Mekan, Mesajlar, Profil, Keşfet, Aktiviteler | span.ic |
| .sup-prog i | v44 | - | background-color:.3s:0:ease | Kayıt | i.on |
| .gopts i | v44 | - | border-width:.2s:0:ease; border-color:.2s:0:ease | Kayıt | i |
| .va .kpip | v44 | - | background-color:.25s:0:ease | Mekan | span.kpip |
| .cons-box i | v44 | - | background-color:.2s:0:ease; border-color:.2s:0:ease | Kayıt | i |
| .inv-load | v44 | - | opacity:.2s:0:ease | Masa | div.inv-load.show |
| .obf-top | v45 | - | opacity:.5s:0:ease; transform:.6s:0:cubic-bezier(.2,.9,.3,1) | Kayıt | div.obf-top[data-obf-logo] |
| .obf-t | v45 | - | transform:.55s:0:cubic-bezier(.2,.9,.3,1.15); opacity:.3s:0:ease | - |  |
| .obf-sh | v45 | - | opacity:.6s:.3s:ease | Kayıt | i.obf-sh |
| .obf-ph | v45 | - | opacity:.3s:0:ease; transform:.45s:0:cubic-bezier(.2,.9,.3,1.3) | Kayıt | i.obf-ph[data-obf-ps] |
| .obf-ph::after | v45 | - | background-color:.2s:0:ease; box-shadow:.3s:0:ease | Kayıt | i.obf-ph[data-obf-ps] |
| .obf-lamp | v45 | - | transform:.8s:0:cubic-bezier(.25,1.2,.4,1); opacity:.3s:0:ease | Kayıt | span.obf-lamp |
| .obf-lamp .bulb | v45 | - | background-color:.3s:0:ease; box-shadow:.3s:0:ease | Kayıt | i.bulb |
| .obf-lamp .glow | v45 | - | opacity:.5s:0:ease | Kayıt | i.glow |
| .obf-l1,.obf-l2 | v45 | - | opacity:.45s:0:ease; transform:.6s:0:cubic-bezier(.2,.9,.3,1.25) | Kayıt | span.obf-l1 |
| .obf-copy p | v45 | - | opacity:.5s:0:ease; transform:.5s:0:ease | Kayıt | p |
| .obf.now,.obf.now * | v45 | - | none!important::0:ease | - |  |
| .ob-pal-b | v45 | - | transform:.42s:0:cubic-bezier(.2,.9,.3,1.25) | Kayıt | span.ob-pal-b[data-ob-palb] |
| .ob-pal .eye | v45 | - | translate:.25s:0:ease; scale:.2s:0:ease | Kayıt | circle |
| .obf-lamp,.obf-lamp .glow,.obf-lamp .bulb,.obf-t,.obf-sh,.obf-l1,.obf-l2,.obf-co | v45 | @media (prefers-reduced-motion:reduce) | none:None:0:None | Kayıt | span.obf-lamp |
| .ob-pal-b,.ob-pal .eye | v45 | @media (prefers-reduced-motion:reduce) | none:None:0:None | Kayıt | span.ob-pal-b[data-ob-palb] |
| .ced-mini | v46 | - | width:.25s:0:ease; margin:.25s:0:ease; opacity:.2s:0:ease; transform:.3s:0:cubic-bezier(.34,1.56,.64,1) | - |  |
| .ced-ring | v46 | - | background-color:.3s:0:ease | Kapsül | i.ced-ring[data-ced-ring] |
| .ced-bub | v46 | - | opacity:.18s:0:ease; transform:.18s:0:ease | Kapsül | span.ced-bub.on[data-ced-bub] |
| .ced-bub.on | v46 | - | opacity:.2s:0:ease; transform:.34s:0:cubic-bezier(.34,1.56,.64,1) | Kapsül | span.ced-bub.on[data-ced-bub] |
| .pd-in | v46 | - | transform:.2s:0:ease | Profil | span.pd-in |
| .ced-mini,.ced-bub,.ced-ring | v46 | @media (prefers-reduced-motion:reduce) | none:None:0:None | Kapsül | span.ced-bub.on[data-ced-bub] |

## motion.reduced_motion (43)

| seçici | etki |
|---|---|
| .emblem,.bobbing,.dot.open | {'name': '?', 'dur': '', 'delay': '', 'ease': '', 'iter': '', 'fill': '', 'dir': ''} |
| .page,.sheet,.scrim,.toast | {'name': '?', 'dur': '', 'delay': '', 'ease': '', 'iter': '', 'fill': '', 'dir': ''} |
| .reveal>* | {'name': 'none'} |
| .live,.live::after | {'name': 'none'} |
| .live | {'name': 'liveFade', 'dur': '1.6s', 'delay': '', 'ease': 'ease-in-out', 'iter': 'infinite', 'fill': '', 'dir': ''} |
| .poster svg * | {'name': '?', 'dur': '', 'delay': '', 'ease': '', 'iter': '', 'fill': '', 'dir': ''} |
| .send.shoot .sg | {'name': 'none'} |
| .prev.typing i | {'name': 'none'} |
| .tk,.tk.in,.tg-body,.tm.new,.tgu-av .ring,.tg-cd b,.tg-flash,.tgu-feed span,.conf i,.tg.lo | {'name': '?', 'dur': '', 'delay': '', 'ease': '', 'iter': '', 'fill': '', 'dir': ''} |
| .sgr-reveal,.sg-peekcard | {'name': '?', 'dur': '', 'delay': '', 'ease': '', 'iter': '', 'fill': '', 'dir': ''} |
| .hx-card.in,.sx-card.in,.cx-card.in,.hx-big.land,.nx-res,.bx-objrow span,.bx-say .bx-spk:: | {'name': '?', 'dur': '', 'delay': '', 'ease': '', 'iter': '', 'fill': '', 'dir': ''} |
| .sx-rec,.sx-eq i | {'name': '?', 'dur': '', 'delay': '', 'ease': '', 'iter': '', 'fill': '', 'dir': ''} |
| .nx-shut.nx-open | {'name': '?', 'dur': '', 'delay': '', 'ease': '', 'iter': '', 'fill': '', 'dir': ''} |
| .ccard,.ccard.swap .cc-q,.ccard.swap .cc-ab,.cmsg | {'name': '?', 'dur': '', 'delay': '', 'ease': '', 'iter': '', 'fill': '', 'dir': ''} |
| .nbell.ring .nb-ic,.nbell.ring .nb-clap,.nb-bdg.bump | {'name': '?', 'dur': '', 'delay': '', 'ease': '', 'iter': '', 'fill': '', 'dir': ''} |
| .dwho small i,.bub.typing i,.swipe-ic.hit,.msg.flash .bub,.dreply | {'name': 'none'} |
| .cap,.cap.hop .cap-av,.cap.hop .eye | {'name': 'none'} |
| .vmenu,.vjump,.vr.pop | {'name': 'none'} |
| .pav,.pav .eye,.pa-swap,.pa-no,.pav.swap | {'name': 'none'} |
| .frow | {'name': 'none'} |
| .me.swap | {'name': 'none'} |
| .evc svg *,.hthumb svg *,.evc,.hrow,.eint.pop | {'name': '?', 'dur': '', 'delay': '', 'ease': '', 'iter': '', 'fill': '', 'dir': ''} |
| .vrow,.th-steam | {'name': 'none'} |
| .vpin,.vsel,.vpin.here::before | {'name': 'none'} |
| .obf-b,.obf-b .eye,.obf .obf-b.jump,.obf-ring.on,.obf-sw,.obf-foot | {'name': 'none'} |
| .ob-pal .eye,.ob-pal.ok .ob-pal-b,.ob-pal.err .ob-pal-b,.ob-pal.nod .ob-pal-b,.ob-bub,.sup | {'name': 'none'} |
| .mk-ic.pop .tic | {'name': 'none'} |
| .pd-fix,.pd-ring,.pd-s1,.pd-s2,.pd-s3,.pd-av,.pd-av .eye,.pd-fix.go .pd-in,.pd-fix.go .pd- | {'name': 'none'} |
| .ced-fig.jump .cp-b,.ced-orb.land .cp-b,.ced-orb.land .ced-ring,.ced-ring.beat,.cp .cp-b,. | {'name': '?', 'dur': '', 'delay': '', 'ease': '', 'iter': '', 'fill': '', 'dir': ''} |
| .vt-all,.vt-a,.vt-b,.vt-x | {'prop': 'none'} |
| .send-ic rect | {'prop': 'fill', 'dur': '.2s', 'delay': '', 'ease': 'ease'} |
| .tk,.tk.in,.tg-body,.tm.new,.tgu-av .ring,.tg-cd b,.tg-flash,.tgu-feed span,.conf i,.tg.lo | {'prop': 'none!important', 'dur': '', 'delay': '', 'ease': 'ease'} |
| .sgc-in,.sg-ring .fg,.sgr-bar i | {'prop': 'none!important', 'dur': '', 'delay': '', 'ease': 'ease'} |
| .bx-ring .fg,.nx-needle.nx-live | {'prop': 'none!important', 'dur': '', 'delay': '', 'ease': 'ease'} |
| .ntf-row | {'prop': 'none'} |
| .vsw i | {'prop': 'none'} |
| .sl-ic rect | {'prop': 'none'} |
| .anon-sw .knob,.anon-sw svg | {'prop': 'none'} |
| .dbody.settle | {'prop': 'none'} |
| .vmap-layer.settle | {'prop': 'none'} |
| .obf-lamp,.obf-lamp .glow,.obf-lamp .bulb,.obf-t,.obf-sh,.obf-l1,.obf-l2,.obf-copy p,.obf- | {'prop': 'none'} |
| .ob-pal-b,.ob-pal .eye | {'prop': 'none'} |
| .ced-mini,.ced-bub,.ced-ring | {'prop': 'none'} |

## motion.js (17)

| ekran | bileşen | teknik | süre | eğri | satır |
|---|---|---|---|---|---|
| Genel (yükleme göstergeleri) | MV.seesaw: tam ekran ve lobi yükleme | requestAnimationFrame | 1400ms döngü | yarım dalga (halves) | 51 |
| Mekan, lobi | MV.swap: katılma isteği bekleme (row .wait) | requestAnimationFrame | 1600ms döngü | yarım dalga | 53 |
| Düğmeler (busy) | MV.meet: düğme içi yükleniyor (.ld.mini); yazı 120ms çekilir | requestAnimationFrame | 1500ms döngü (480 yaklaşma, 210 bekleme, yay dönüş) | cubic-bezier(.65,0,.35,1) + yay k320 c14 | 55 |
| Mekan, boş lobi | MV.empty: eksik masa, mor kapsül nefes alır | requestAnimationFrame | 2600ms salınım, 2000ms çizgi nabzı, 460ms zıplama | sinüs | 57 |
| Mekan, lobi | MV.miss: istek reddi/zaman aşımı, bir kez çarpar geri çekilir | requestAnimationFrame | 1400ms tek sefer (120-470 yaklaşma, 470-690 sarsıntı) | cubic-bezier(.55,0,.85,.2) + geri tepme | 62 |
| Düğme simgeleri | IC: artı ve eksi çubuk simgeleri, durum geçişi | requestAnimationFrame | yay | yay k220 c20 (biçim), k320 c14 (vuruş) | 126 |
| Masa | Öneri sayısı sayaç (N+) artışı | requestAnimationFrame | 550ms | easeOutCubic | 607 |
| Masa sohbeti | Gönderilen mesajın yazma alanından balona uçması | Element.animate | 320ms | cubic-bezier(.2,.9,.25,1) | 688 |
| Birebir sohbet | Gönderilen mesajın uçması | Element.animate | 320ms | cubic-bezier(.2,.9,.25,1) | 1210 |
| Mekan sohbeti | Gönderilen mesajın uçması | Element.animate | 320ms | cubic-bezier(.2,.9,.25,1) | 1455 |
| Birebir ve mekan sohbeti | Kaydırıp yanıtla bırakınca balonun geri yaylanması | inline transition | 320ms (balon), 200ms (yanıt simgesi) | cubic-bezier(.34,1.56,.64,1) / ease | 1278 |
| Kapsül süsleme (açılış) | Profildeki kapsülden daire açılır (clip-path), kapsül büyür ve uçar, örtü söner | Element.animate | 440ms daire, 440ms büyüme, 620ms uçuş, 340ms (140ms gecikmeli) sönme | cubic-bezier(.55,0,.35,1) / (.3,.7,.4,1.5) / (.3,.75,.3,1) / ease-out | 3399 |
| Kapsül süsleme (çıkış) | Kapsül büyük daireden profildeki yerine geri uçar | Element.animate | 480ms | cubic-bezier(.3,.75,.3,1) | 3422 |
| Profil | Süsle düğmesi: döner, 10 kıvılcım saçar, sonra ekran açılır | Element.animate | 520ms | cubic-bezier(.2,.7,.4,1) | 3462 |
| Kayıt, hoş geldin | İlk ekran sahnesi: kapsüller belirir, masalar kurulur, herkes masaya zıplar, konfeti (18 parça) | Element.animate + zamanlayıcılar | adım adım (masalar 1250ms+, zıplama üç evre) | cubic-bezier(.4,0,.6,1) / (.2,.6,.4,1) / (.6,0,.8,.4) / (.3,1.35,.5,1) | 3617 |
| Kayıt adımları | Kapsül dostu: alana dokununca bakar, hatada başını sallar, adım tamamlanınca 7 renkli puf | Element.animate + sınıf | 700ms (puf) | cubic-bezier(.2,.7,.4,1) | 3857 |
| Keşfet | Çek ve yenile göstergesi dönüşü | requestAnimationFrame | 1800ms döngü (700 dön, 200 bekle, 700 dön), yenileme 1500ms | ease (iç fonksiyon) | 4332 |

## motion.sheet

| alan | değer |
|---|---|
| open | openSheet(L): diğer açık alt sayfaları kapatır, L.classList.add("open") |
| enter | .sheet: animation up .32s cubic-bezier(.2,.8,.2,1) both (translate(-50%,104%) dan); .scrim: fadeIn .2s ease both, rgba(20,17,43,.5) |
| close | perde ve Vazgeç [data-close], Escape; çıkış animasyonu yok, anında kapanır |
| drag | yok (tutamak .handle yalnızca görsel) |
| reduced_motion | .page,.sheet,.scrim,.toast{animation:none} |
| layout | position:absolute; left:50%; bottom:0; width:min(400px,100%); radius 28 28 0 0; padding 12 20 calc(24px + safe-area) |
| src_line | 414 |

## motion.toast

| alan | değer |
|---|---|
| duration_ms | 1800 |
| enter | fadeIn .2s ease both |
| exit | yok, anında kaldırılır |
| single | yeni toast eskisini siler |
| src_line | 221 |

## interaction.gestures (26)

| ekran | bileşen | jest | eşik/süre | sonuç | titreşim | satır | kapsam |
|---|---|---|---|---|---|---|---|
| Birebir sohbet | .bub (mesaj balonu) | uzun basma | 420ms; 10px dikey kayma iptal eder | tepki seçici açılır | yok | 1252 | ana |
| Birebir sohbet | .bub | çift dokunma | dblclick | tepki seçici | yok | 1297 | ana |
| Birebir sohbet | .bub | sağa kaydır | başlama 8px; eşik 56px; 64px sonrası 0.25 dirençle; bırakınca 320ms yay | mesaja yanıt | eşikte 8ms | 1259 | ana |
| Birebir sohbet | tepki seçici | kaydırma ya da dışarı dokunma | scroll, pointerdown dışarıda | seçici kapanır | yok | 1296 | ana |
| Birebir sohbet | alıntı | dokunma | - | asıl mesaja kaydırır | yok | 1288 | ana |
| Mekan sohbeti | .bub | uzun basma | 420ms; 10px dikey kayma iptal | tepki ve eylem menüsü | 10ms | 1510 | ana |
| Mekan sohbeti | .bub | çift dokunma | dblclick | menü | yok | 1546 | ana |
| Mekan sohbeti | .bub | sağa kaydır | birebir sohbetle aynı (8px, 56px, 0.25 direnç, 320ms yay) | yanıt | eşikte 8ms | 1517 | ana |
| Mekan sohbeti | span[data-vtn] (kişi adı) | dokunma, Enter, boşluk | - | kişi kartı alt sayfası | yok | 1556 | ana |
| Mekan sohbeti | menü | kaydırma, dışarı dokunma, Escape | - | menü kapanır | yok | 1501 | ana |
| Sohbetler (masa, birebir, mekan) | yazma alanı | Enter | - | gönderir; mesaj 320ms uçar | yok | 698 | ana |
| Keşfet | liste (data-dbody) | aşağı çek | eşik 72px; bırakınca 1500ms yenileme; çekmeden sonraki tıklama yutulur | listeye mekan eklenir | yok | 4297 | ana |
| Keşfet, harita | .vmap | sürükle | 6px eşik; sınırlarda durur | harita kayar; boşa dokununca seçim kalkar | yok | 4277 | ana |
| Keşfet, harita | .vpin | dokunma | - | mekan seçilir | yok | 4277 | ana |
| Kapsül süsleme | [data-ced-fig] (kapsülün başı) | dokunma | bir an sonra eski haline döner | sıradaki duygu: yüz, küçük hareket, çevre süsü | yok | 3360 | ana |
| Kapsül süsleme | sayfa | kaydırma | daire üst çubuğun altına girince | üst çubukta küçük kapsül belirir (mini) | yok | 3349 | ana |
| Kapsül galerisi | .cap | dokunma | - | hop animasyonu | yok | 4385 | ana |
| Kayıt, hoş geldin | .obf-c (sahnedeki kapsül) | dokunma | - | zıplar (jump) | yok | 3768 | ana |
| Kayıt, kod | [data-otp] input | yazma, yapıştırma, Backspace | çok haneli yapıştırma dağıtılır; boşken Backspace önceki haneye | otomatik ilerler | yok | 3912 | ana |
| Kayıt (tüm adımlar) | [data-sup-next] pasifken | dokunma | - | nope sarsıntısı 360ms; telefon adımında hata metni | yok | 3941 | ana |
| Mekan, lobi | [data-join] Katıl | dokunma | istek 60 sn geçerli, metinde geri sayım | swap göstergesi; kabulde meet, retçe miss | yok | 405 | ana |
| Tüm alt sayfalar | .sheet-layer | perdeye ya da Vazgeç düğmesine dokunma ([data-close]), Escape | aynı anda tek alt sayfa (openSheet); sürükleyip kapatma yok, tutamak yalnızca görsel | kapanır (çıkış animasyonu yok) | yok | 327 | ana |
| Eski oyun: Kapsül Anlat | .tk (kart) | basılı tutup gezdirme | rotateY 16, rotateX 12 derece; bırakınca yay | kart eğilir, parlama parmağı izler | 6ms | 1784 | eski |
| Eski oyun: Sahtekar | [data-sg-peek] | basılı tut | bırakınca kapanır | rol görünür | var | 1976 | eski |
| Eski oyun: Sahtekar | rol kartı | basılı tut | - | kart açılır | ilk açılışta 8ms | 1992 | eski |
| Eski oyun: İbre | ibre svg | sürükle, ok tuşları | oklarla 2 birim | ibre döner | yok | 2539 | eski |

## interaction.press_feedback (38)

| seçici | etki | gruplar | örnek öğe |
|---|---|---|---|
| .poster:active | transform:scale(.97) | Mekan, Masa | button.poster.dim[data-poster] |
| .va .hb:active | transform:scale(.97) | Masa | button.hb[data-lobby] |
| .send:active | transform:scale(.94) | Mekan, Mekan sohbeti, Masa, Mesajlar | button.send[data-send] |
| .crow:active | background:#F5F3FC | Mesajlar | button.crow.unread[data-crow] |
| .qbtn:active | transform:scale(.92) | - |  |
| .va .tbtn:active | transform:scale(.96) | - |  |
| .cx-th:not([aria-disabled="true"]):active | transform:scale(.97) | - |  |
| .cx-opt:active | transform:scale(.97) | - |  |
| .cc-next:active | transform:scale(.96) | - |  |
| .cc-opt:active | transform:scale(.97) | - |  |
| .nbell:active .nb-ic | transform:scale(.92) | Mesajlar | svg |
| button.ntf-row:active | background:#F5F3FC | Mesajlar | button.ntf-row.ntf-new[data-nid] |
| .ntf-chip:active | transform:scale(.96) | Masa, Mesajlar, Ayarlar | button.ntf-chip.main[data-inv-send] |
| .dhead:active .dav | transform:scale(.94) | Mesajlar | span.dav[data-dav] |
| .rpick button:active | transform:scale(1.25) | - |  |
| .va .vname:active | transform:none; opacity:.7 | Mekan sohbeti | button.vname[data-vtn] |
| .vacts button:active | background:#F5F3FC | - |  |
| .va .vsw:active | transform:none | Mekan, Mekan sohbeti, Ayarlar | button.vsw[data-kur-lobby] |
| .plist button:active,.prow:active | background:#F5F3FC | - |  |
| .pa-off:active | transform:none | - |  |
| button.mrow:active | background:#F5F3FC | Masa | button.mrow[data-mp] |
| .frow-main:active | opacity:.7 | Profil | button.frow-main[data-fp] |
| .fmsg:active | transform:scale(.95) | Profil | button.fmsg[data-fm] |
| .ebar .btn[aria-disabled="true"]:active | transform:none | Profil | button.btn.btn-room[data-esave] |
| .eint:active | transform:scale(.92) | Aktiviteler | button.eint[data-eint] |
| .vrow:active | background:#F5F3FC | Keşfet | button.vrow[data-venue] |
| .vmap:active | cursor:grabbing | - |  |
| .va .top .me:active | transform:scale(.94) | Mekan | button.me[data-me] |
| .va button:active | transform:scale(.97) | Mekan, Mekan sohbeti, Masa, Mesajlar, Profil, Kapsül, Ayarlar, Keşfet, Aktiviteler, Kayıt | button.round.leave[data-leave] |
| .va .game:active | transform:translateY(3px); box-shadow:0 3px 0 rgba(20,17,43,.9) | - |  |
| html[data-theme="dark"] .crow:active | background:#0D0B1E | - |  |
| html[data-theme="dark"] button.ntf-row:active | background:#0D0B1E | - |  |
| html[data-theme="dark"] .vacts button:active | background:#0D0B1E | - |  |
| html[data-theme="dark"] .plist button:active,html[data-theme="dark"] .prow:activ | background:#0D0B1E | - |  |
| html[data-theme="dark"] button.mrow:active | background:#0D0B1E | - |  |
| html[data-theme="dark"] .vrow:active | background:#0D0B1E | - |  |
| html[data-theme="dark"] .va .game:active | box-shadow:0 3px 0 #000000 | - |  |
| .pd-fix:active .pd-in | transform:scale(.9) | Profil | span.pd-in |

## interaction.haptics

| ekran | an | desen | satır | kapsam |
|---|---|---|---|---|
| Birebir ve mekan sohbeti | kaydırıp yanıtla eşiği (56px) | 8ms | 1270 | ana |
| Mekan sohbeti | uzun basma menüsü | 10ms | 1510 | ana |
| Eski oyun: Kapsül Anlat | geri sayım 3-2-1-Başla; son 5 saniye her saniye; Tabu yakalandı; kart eğme | çeşitli (12ms, desen, 6ms) | 1692 | eski |
| Eski oyun: Sahtekar | son 3 saniye; rol görme; rol kartı ilk açılış | 10ms, 8ms | 1963 | eski |

## findings

| id | konu | ayrıntı |
|---|---|---|
| F1 | tasarım değişkeni yok | CSS içinde 21 değişken var, yalnız --ink (165 kullanım) ve --muted (257) gerçekten kullanılıyor. 1574 sabit renk kodu, 408 farklı renk değeri (hex ve rgba). |
| F2 | koyu tema seçici seçici yazılmış | dark-auto bloğu 701 kural (67 KB), ardından dark-hand, v45-dark, v46-dark-auto, v46-dark. Bir öğenin koyu değeri ancak bütün katmanlar hesaplanınca bilinir; galeri ve bu envanterdeki koyu değerler hesaplanmış son değerlerdir. |
| F3 | katmanlı üzerine yazma | Stil 9 blokta: base, dark-auto, v44, v45, dark-hand, v45-dark, v46, v46-dark-auto, v46-dark. Aynı seçici birden çok blokta değişiyor (.btn 80 kuralda). |
| F4 | btn-primary sınıfı işaretlemede yok | Birincil düğme v46 işaretlemesinde .btn.btn-room. .btn-primary yalnızca eski .vb görünümünün CSS kalıntısı. |
| F5 | birincil düğme üç boy | 52px 16/700 (kayıt, masa bitti), 48px 14/700 (pencereler), 48px 15/700 (Masa kur). Küçük birincil ayrı sınıf: .ntf-chip.main 36px 14/800. |
| F6 | yumuşak düğme iki görünüm | .btn-soft beyaz zemin ve kenar çizgisi; .close, .ntf-chip.ghost, .join.ghost lavanta #EEEBF8 zemin. Aynı rol, iki görünüm. |
| F7 | pasif hal tutarsız | .va .btn[aria-disabled] gri dolgu #E6E2F2 yazı #5E5878; .ebar içinde yazı #A9A3BF; .ttbar/.spbar/.mpbar/.cxs içinde opacity .45; .ntf-chip opacity .45. Katıl (.join) için pasif görünüm hiç yok: masa doluyken aria-disabled ama görünüş aynı. |
| F8 | yazı ölçüsü dağınık | 59 farklı yazı biçimi (aile, boy, kalınlık, satır yüksekliği) görünür ekranlarda. Ortak bir yazı ölçeği tanımı yok. |
| F9 | titreşim tutarsız | Mekan sohbetinde uzun basma 10ms titreşir, birebir sohbette aynı jest titreşmez. |
| F10 | alt sayfa kapanışı animasyonsuz | Açılışta 320ms kayma ve 200ms perde, kapanışta animasyon yok; sürükleyip kapatma yok. |
| F11 | btn-room.is-open | CSS tanımlı (beyaz zemin, iç kenar), 84 ana durumun hiçbirinde görünmedi. |
| F13 | yükleniyor hali pasif görünür | MV.busy düğmeye aria-disabled=true ekler; .va .btn[aria-disabled] kuralı devreye girer ve birincil düğme yükleniyorken gri zemin #E6E2F2 (koyu #29283A) olur, mor kalmaz. Gösterge: MV.meet. |

