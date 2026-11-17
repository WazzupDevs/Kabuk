# Tuval varlıkları (blob) → panolar ve depodaki karşılık

Kaynak: https://claude.ai/artifact/7QxRyG1sRhLgkYwGDakRv9. Varlık dosyaları depoda değildir (176 dosya, 46 MB; örnek içerik fotoğrafları alınmaz, `docs/decisions/yeni-tuval.md`): gereken resim Artifact aracıyla tek tek indirilir (`action: read`, `path: <blob>`) ve arayüz çizimiyse `apps/mobile/assets/riso/` altına alınır. "dosya" sütunu indirilen dosyanın adıdır. "depodaki karşılık" 17 Kasım'daki durumdur; sonra alınan resimler (semt, açılış) burada yazmaz. "panolar": o blob'a `/_blob/<id>` ile başvuran pano numaraları (ESLEME.md). "depodaki karşılık": sha256'sı birebir aynı olan depo dosyası; `apps/mobile/assets`, `docs/design`, `content` altındaki bütün dosyalar (1280 dosya) ve deponun izlenen diğer resim/font dosyaları tarandı. "tür": biçim ve piksel boyu; ne olduğu, başvuran `<img>`in `alt` metninden ve CSS sınıfından (resimler açılıp bakılmadı, tırnak içi `alt` panodan alıntıdır).

Toplam 176 varlık; 127 tanesine en az bir pano başvuruyor, 49 tanesine hiçbir dosya başvurmuyor. Panoların başvurduğu ama varlık listesinde olmayan blob: yok.

| blob | dosya | panolar | depodaki karşılık | tür |
| --- | --- | --- | --- | --- |
| 001eba8ec1d165e5cc5846be23e4007d | assets/001eba8ec1d165e5cc5846be23e4007d.png | yok | yok | png 320x420 |
| 00874320d970fbadce73a87d3b072f02 | assets/00874320d970fbadce73a87d3b072f02.png | 112 | yok | png 640x520; alt: "Haritaya bakan kapsül kanki" |
| 00896f74d4ecb0f452070fa3a38849e6 | assets/00896f74d4ecb0f452070fa3a38849e6.webp | yok | yok | webp 1170x1080 |
| 01c0e7abc65c773d9d4526d2100a1f34 | assets/01c0e7abc65c773d9d4526d2100a1f34.webp | 32c | yok | webp 480x288 |
| 02674155f583092091ce475d46ebf66b | assets/02674155f583092091ce475d46ebf66b.png | 31, 32 | yok | png 1290x2796 |
| 031ec660b43d40a3c4438283fa704b8a | assets/031ec660b43d40a3c4438283fa704b8a.webp | yok | yok | webp 420x280 |
| 048f89c4a86441ad5918665e456e0cdf | assets/048f89c4a86441ad5918665e456e0cdf.png | 47 | yok | png 282x546 |
| 08e2d5ddcd6de2411964306add0c83f4 | assets/08e2d5ddcd6de2411964306add0c83f4.png | 52, 53, 136 | yok | png 360x294; alt: "Doğum günü pastası ve kapsül kanki" (sınıf vg) |
| 08f61262b11a1ace19f99614a8119b42 | assets/08f61262b11a1ace19f99614a8119b42.png | yok | yok | png 320x420 |
| 0a91ef91ecec673d8487fc754d92ac15 | assets/0a91ef91ecec673d8487fc754d92ac15.png | 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 133, 134, 135, 136 | yok | png 800x920 |
| 0c0dc85399c8e9a227261d57c8b118ad | assets/0c0dc85399c8e9a227261d57c8b118ad.png | 18, 102 | yok | png 1080x480 (sınıf peek) |
| 0d0b46ede6a3e4e5329e2f980def8550 | assets/0d0b46ede6a3e4e5329e2f980def8550.png | 14, 15, 16, 92, 94, 95, 96, 97 | yok | png 419x320 |
| 118e4ea2114382f96e5162635dab5f99 | assets/118e4ea2114382f96e5162635dab5f99.png | 09, 35, 38, 39, 40, 41, 42, 43, 44, 45, 46, 93, 95, 98, 99 | yok | png 192x192 (sınıf ma) (sınıf kav) |
| 14ee0cf668ad0e878d689ec0f0b09f26 | assets/14ee0cf668ad0e878d689ec0f0b09f26.webp | yok | apps/mobile/assets/riso/wall-dm-dark.webp | webp 1290x2796 |
| 165425dea3c99b967fba9f9d25f7f89d | assets/165425dea3c99b967fba9f9d25f7f89d.png | 47 | yok | png 420x570 (sınıf lmp) |
| 1b0b55da52868f6c0865d39685a48916 | assets/1b0b55da52868f6c0865d39685a48916.png | 03b, 03c, 90 | yok | png 216x216; alt: "Shuriken tokalı kapsül başı" |
| 1cfde72f2b13de8b57ace4edcd7a15d0 | assets/1cfde72f2b13de8b57ace4edcd7a15d0.jpg | 07a | yok | jpg 700x280 |
| 1fd2a0d4f6b91926ca1051693a832aa6 | assets/1fd2a0d4f6b91926ca1051693a832aa6.webp | 23, 27, 28, 30, 125, 126, 127, 128, 129 | yok | webp 240x240; alt: "Zar Kedisi masa simgesi" (sınıf oth) |
| 1fdde90c5caf08d468e50a1abf8f3394 | assets/1fdde90c5caf08d468e50a1abf8f3394.png | 11 | yok | png 336x286 (sınıf bl) |
| 29229bd9ca500e7fdf7664f3d7c32b2d | assets/29229bd9ca500e7fdf7664f3d7c32b2d.webp | 05a, 20, 21, 22, 24, 25, 25b, 26, 32a, 32b, 32c, 33, 34, 35, 38, 64, 64a, 132 | yok | webp 1000x600; alt: "Uçan Halı masası" / "Uçan Halı masa görseli: riso baskı uçan halı" (sınıf tim) (sınıf hero) |
| 2b834a51d6ca38acfb816f4ee08286fd | assets/2b834a51d6ca38acfb816f4ee08286fd.webp | 32b, 33, 34, 35, 38, 137, 138, 141, 142 | yok | webp 462x334 (sınıf gl) |
| 2e08babb4a93f474f041481b099765d6 | assets/2e08babb4a93f474f041481b099765d6.png | 03b, 03c, 90 | yok | png 216x216; alt: "Şimşek gözlü kapsül yüzü" |
| 2e7172a7e25c973e65e7508a3ff0450a | assets/2e7172a7e25c973e65e7508a3ff0450a.png | yok | yok | png 240x304 |
| 32631775b8c78548abdf49b8108b63d3 | assets/32631775b8c78548abdf49b8108b63d3.png | 14, 15, 16, 92, 94, 95, 96, 97, 98, 99 | yok | png 1290x2796 |
| 3a0a335a2d73c2e7f1eb7f51036fb2d4 | assets/3a0a335a2d73c2e7f1eb7f51036fb2d4.png | 11c, 101 | yok | png 1080x480 (sınıf peek) |
| 3a2b9847a02d2fa598afc2f3d61bf0a2 | assets/3a2b9847a02d2fa598afc2f3d61bf0a2.png | 09 | yok | png 332x508 |
| 3c25d375df5461cba99a2fa81db950d0 | assets/3c25d375df5461cba99a2fa81db950d0.png | yok | yok | png 96x96 |
| 3c8aff46ce3f60eeaba465aaeb08b72b | assets/3c8aff46ce3f60eeaba465aaeb08b72b.png | yok | yok | png 705x482 |
| 3ca53fe032b6bb319d38820d08daa137 | assets/3ca53fe032b6bb319d38820d08daa137.webp | 13 | yok | webp 1170x1080 |
| 3fce11821c9ae15b00823e2c53385468 | assets/3fce11821c9ae15b00823e2c53385468.png | yok | yok | png 600x600 |
| 40ddebf8d65cbaca999a45021a201cb6 | assets/40ddebf8d65cbaca999a45021a201cb6.png | 03b, 03c, 03f, 72, 73, 74, 75, 76, 77, 78, 79, 80, 90, 91 | yok | png 335x463; alt: "Ninja setli kapsülün önizlemesi" / "Ninja setli anonim kapsülün" (sınıf nj n) (sınıf nj f) |
| 45d9d4b21255adce00118cd7ad695fab | assets/45d9d4b21255adce00118cd7ad695fab.webp | 62e | yok | webp 600x840; alt: "Büyücü şapkası kartı" (sınıf kart) |
| 4661361ef261f146bb9333f0e5251032 | assets/4661361ef261f146bb9333f0e5251032.png | 03s | yok | png 360x294; alt: "Megafonla seslenen kapsül kanki" |
| 47c6500ff57c41e9c861a69102b864f7 | assets/47c6500ff57c41e9c861a69102b864f7.png | 110 | yok | png 640x520; alt: "Zilin yanında uyuyan kapsül kanki" |
| 4a000793033b86277853f55cbbad7c5b | assets/4a000793033b86277853f55cbbad7c5b.png | yok | yok | png 320x420 |
| 4ba27f14918de0bdd6d3e5fd47fd263a | assets/4ba27f14918de0bdd6d3e5fd47fd263a.png | 07, 84, 97, 115, 117 | yok | png 900x600; alt: "Dürbünle bakan kapsül kanki" / "Boş ilan panosunun yanında dürbünlü kapsül kanki" |
| 4cac59292422262c8fbe1ed9ed45e884 | assets/4cac59292422262c8fbe1ed9ed45e884.webp | 137, 138, 153, 154 | yok | webp 462x334 (sınıf gl) |
| 4dd29a0712db481dfb22579231699519 | assets/4dd29a0712db481dfb22579231699519.png | 47 | yok | png 72x72 (sınıf st) |
| 4fe4f643af38a4fda8ee97262e7ab855 | assets/4fe4f643af38a4fda8ee97262e7ab855.jpg | yok | yok | jpg 700x280 |
| 517d1d81c898b15af3995831beb4f09a | assets/517d1d81c898b15af3995831beb4f09a.png | 35, 38, 39, 40, 41, 42, 43, 44, 45, 46, 93, 95, 98, 99 | yok | png 192x192 (sınıf ma) (sınıf ga) |
| 520a563c94f05fca47fc9218c9ad6a2c | assets/520a563c94f05fca47fc9218c9ad6a2c.webp | 37 | yok | webp 900x1950 |
| 538783aa84562d29b819bece7bac5c7b | assets/538783aa84562d29b819bece7bac5c7b.webp | 62, 62a, 62b, 62c | yok | webp 720x1134 (sınıf pp r) (sınıf pp c) |
| 564f379c722a959a6f9b0909ac8e9f3a | assets/564f379c722a959a6f9b0909ac8e9f3a.png | 02, 02b, 02c, 02d, 02e, 88, 107, 108, 113, 118, 119, 120, 121, 122 | yok | png 1290x2796 |
| 566e827261bf91abf2ea4199221c94db | assets/566e827261bf91abf2ea4199221c94db.webp | 137, 138, 155, 156 | yok | webp 462x334 (sınıf gl) |
| 56fb9bb9cc29e51738fbf14a6fa39351 | assets/56fb9bb9cc29e51738fbf14a6fa39351.webp | yok | yok | webp 480x288 |
| 57b45401a25990eb7fb617cd52c2d342 | assets/57b45401a25990eb7fb617cd52c2d342.webp | yok | yok | webp 420x280 |
| 583a05bac204146a3c834d900821511d | assets/583a05bac204146a3c834d900821511d.png | 50, 133, 134, 135 | yok | png 360x294; alt: "Kod balonunun yanında kapsül kanki" (sınıf vg) |
| 58bc030c5a9d5588328cd2159130c0c9 | assets/58bc030c5a9d5588328cd2159130c0c9.webp | yok | yok | webp 1050x600 |
| 58cdca915860f5a54c5bdf664be45051 | assets/58cdca915860f5a54c5bdf664be45051.png | 11 | yok | png 192x192 |
| 598c0d3c58775186f181e353ce9a9ec8 | assets/598c0d3c58775186f181e353ce9a9ec8.webp | 23, 125, 126, 127, 129 | yok | webp 240x240 (sınıf oth) |
| 5b08ad2794fd1d89773aad25ff20b4e6 | assets/5b08ad2794fd1d89773aad25ff20b4e6.png | 03r, 09, 14, 15, 16, 19, 20, 21, 22, 23, 24, 25, 25b, 26, 27, 28, 31, 32, 32a, 32b, 32c, 35, 38, 39, 40, 41, 42, 43, 44, 45, 46, 64, 64a, 92, 93, 94, 95, 96, 97, 98, 99, 124, 125, 126, 127, 128, 129, 132, 139, 140, 142, 144, 145, 146, 147, 148, 150, 151, 154, 156 | yok | png 192x192; alt: "Anonim kapsülün" (sınıf ma) (sınıf kav) |
| 5dcff4adb34e3568ed7708a79c5721ce | assets/5dcff4adb34e3568ed7708a79c5721ce.webp | 23, 125, 126, 127, 129 | yok | webp 240x240 (sınıf oth) |
| 5ed5531cea522a44ba1eb787ed4e4ef0 | assets/5ed5531cea522a44ba1eb787ed4e4ef0.png | 65 | yok | png 360x294; alt: "Telefonu güncelleyen kapsül kanki" |
| 60984d49d705d31a144270668f043daf | assets/60984d49d705d31a144270668f043daf.png | yok | yok | png 192x192 |
| 62c6f7b78e7f35ca290206271b0a9e36 | assets/62c6f7b78e7f35ca290206271b0a9e36.png | 05 | yok | png 640x520; alt: "Boş zarfın arkasından bakan kapsül kanki" |
| 62e1a5ddf3beea85d27fa1fb5e2ae545 | assets/62e1a5ddf3beea85d27fa1fb5e2ae545.webp | 37 | apps/mobile/assets/riso/chat-masa-bos.webp | webp 600x400 |
| 63df1e09ac003a8277c594e9a75a3859 | assets/63df1e09ac003a8277c594e9a75a3859.webp | 23, 125, 126, 127, 128, 129 | yok | webp 240x240 (sınıf oth) |
| 642e10a413d9af5d02afea547f98224a | assets/642e10a413d9af5d02afea547f98224a.png | yok | yok | png 144x144 |
| 6481585875029cc7cb0d169bbe147046 | assets/6481585875029cc7cb0d169bbe147046.png | yok | yok | png 400x463 |
| 65f34de4e3472377aa312146d597c6dd | assets/65f34de4e3472377aa312146d597c6dd.png | yok | yok | png 144x144 |
| 6775078023967b475c1fee28b87f2e52 | assets/6775078023967b475c1fee28b87f2e52.png | 54 | yok | png 360x294; alt: "Yan yana üç kapsül kanki" (sınıf vg) |
| 67e83e767d70b00270caaa70f17a0a34 | assets/67e83e767d70b00270caaa70f17a0a34.png | 56 | yok | png 360x294; alt: "Yeni metin tomarıyla kapsül kanki" (sınıf vg) |
| 69d6f1befcdbe69a2cb8968a99d00949 | assets/69d6f1befcdbe69a2cb8968a99d00949.png | 66 | yok | png 360x294; alt: "Fişi çıkmış kapsül kanki" |
| 6daee66f01f6c6ebb72b961dcb10583e | assets/6daee66f01f6c6ebb72b961dcb10583e.webp | 12 | yok | webp 1170x1080 |
| 6db0caee1c4f22b6d53177f77be1ffb7 | assets/6db0caee1c4f22b6d53177f77be1ffb7.webp | 32b, 33, 34, 35, 38, 137, 138, 145, 146 | yok | webp 462x334 (sınıf gl) |
| 6dfe938d9db747cc0d50e6d13022d61f | assets/6dfe938d9db747cc0d50e6d13022d61f.png | 08, 08b, 09 | yok | png 168x168 (sınıf th) (sınıf th2) |
| 6e765e2ea9fc97df3425bcc95edcb5ce | assets/6e765e2ea9fc97df3425bcc95edcb5ce.png | yok | yok | png 144x144 |
| 6f52542520b4da406752821481fe5eb8 | assets/6f52542520b4da406752821481fe5eb8.jpg | 07a | yok | jpg 700x280 |
| 6f5a9f719655e423be177fcde91de9fb | assets/6f5a9f719655e423be177fcde91de9fb.png | 01h | yok | png 360x294; alt: "Arşiv kutusundan bakan kapsül kanki" |
| 6f9ae0679e2b93e6954ba99e920bf744 | assets/6f9ae0679e2b93e6954ba99e920bf744.png | 11 | yok | png 192x192 |
| 708cd15096355864476cdab8259c0cba | assets/708cd15096355864476cdab8259c0cba.webp | 32c | yok | webp 480x288 |
| 7215225c236c5e92cb335dfb9edbc7ec | assets/7215225c236c5e92cb335dfb9edbc7ec.webp | 23, 125, 126, 127, 128, 129 | yok | webp 240x240 (sınıf mth) (sınıf oth) |
| 735887057c1f3fa2cab97f40f207e340 | assets/735887057c1f3fa2cab97f40f207e340.webp | yok | yok | webp 420x280 |
| 74e39cc9ea8cb54108f7a206abaea617 | assets/74e39cc9ea8cb54108f7a206abaea617.png | yok | yok | png 144x144 |
| 75ffff9164833aa6b3dc28a207a6699d | assets/75ffff9164833aa6b3dc28a207a6699d.png | 49 | yok | png 360x294; alt: "Telefon tutan kapsül kanki" (sınıf vg) |
| 7666823f3088ce0c372fbbfce4611447 | assets/7666823f3088ce0c372fbbfce4611447.png | 16, 19, 20, 21, 22, 23, 24, 25, 25b, 26, 31, 32, 32a, 32b, 32c, 33, 34, 35, 38, 39, 40, 41, 42, 43, 44, 45, 46, 92, 93, 94, 95, 96, 125, 126, 127, 128, 129, 139, 140, 142, 144, 145, 146, 148, 150, 151, 154, 156 | yok | png 192x192 (sınıf pav) (sınıf ma) |
| 76a79922f3e3cb787e23d19cafd87f1b | assets/76a79922f3e3cb787e23d19cafd87f1b.webp | yok | yok | webp 480x288 |
| 7e634b5ca645763eec457682fc679053 | assets/7e634b5ca645763eec457682fc679053.webp | 32c | yok | webp 480x288 |
| 7fa3e730d044ba1d47a42c6073a56358 | assets/7fa3e730d044ba1d47a42c6073a56358.png | 47 | yok | png 282x546 |
| 8036feebcc84bb17a4f0782759f2681a | assets/8036feebcc84bb17a4f0782759f2681a.jpg | yok | yok | jpg 700x280 |
| 814e9d8aecfccdc764d3da000bc46544 | assets/814e9d8aecfccdc764d3da000bc46544.png | 07, 07a, 08, 08b, 66, 66a | yok | png 180x275 (sınıf k2) |
| 85e04ceffcedf9c29b9dc6789ebdd360 | assets/85e04ceffcedf9c29b9dc6789ebdd360.png | 10, 10b, 10c | yok | png 128x128 (sınıf th) |
| 86e86e99bfeba3be385bb33a80474758 | assets/86e86e99bfeba3be385bb33a80474758.webp | 32b, 33, 34, 35, 38, 137, 138 | yok | webp 462x334 |
| 87e8a57a70ca60275de8f212ea547483 | assets/87e8a57a70ca60275de8f212ea547483.png | 16, 22, 23, 24, 25, 25b, 26, 33, 34, 35, 38, 92, 94, 95, 96, 125, 126, 127, 128, 129 | yok | png 192x192 (sınıf pav) |
| 892023f03268591e4318e7635eceae43 | assets/892023f03268591e4318e7635eceae43.jpg | yok | yok | jpg 700x400 |
| 8965f6ff3ff1c3e9a38dcb58726a10ba | assets/8965f6ff3ff1c3e9a38dcb58726a10ba.png | 04, 110, 130, 131 | yok | png 160x200 (sınıf pk pk1) |
| 89846870c1f1bafececaa7a6884acd62 | assets/89846870c1f1bafececaa7a6884acd62.png | 03p, 09, 16, 22, 23, 24, 25, 25b, 26, 33, 34, 35, 38, 39, 40, 41, 42, 43, 44, 45, 46, 92, 93, 94, 95, 96, 125, 126, 127, 128, 129, 139, 140, 142, 145, 146, 147, 148, 150, 151, 158 | yok | png 192x192 (sınıf uav) (sınıf pav) |
| 8bc2eb74b20b11ffef979d6017aed99b | assets/8bc2eb74b20b11ffef979d6017aed99b.webp | 10b | yok | webp 1050x600 |
| 8cbefbc39f444d673007bc0ed3a13c1f | assets/8cbefbc39f444d673007bc0ed3a13c1f.webp | 32a, 32b, 32c | yok | webp 480x288 |
| 8cfcf418dfaeffac149146cde4743d15 | assets/8cfcf418dfaeffac149146cde4743d15.webp | yok | yok | webp 420x280 |
| 8e86f32f290f9e85f5738fbe7a0ee61a | assets/8e86f32f290f9e85f5738fbe7a0ee61a.png | 45, 46, 143, 144 | yok | png 230x148; alt: "Kinshi" (sınıf lc) (sınıf gl) |
| 90f3e38119d94c66f35694beb83c29ab | assets/90f3e38119d94c66f35694beb83c29ab.webp | 19, 32a, 32b, 32c | apps/mobile/assets/riso/venue-no-table.webp | webp 1050x480 (sınıf si) |
| 9172a6786c60e6a3893a77d96bd3949d | assets/9172a6786c60e6a3893a77d96bd3949d.webp | 32c | yok | webp 480x288 |
| 92d80c5b11595d3c6eb69b2b5642113a | assets/92d80c5b11595d3c6eb69b2b5642113a.png | yok | yok | png 302x209 |
| 92f8b1f62541222757e93d07b7d77aaf | assets/92f8b1f62541222757e93d07b7d77aaf.webp | 32a, 32b, 32c | yok | webp 480x288 |
| 93260fe0f4b5591f07b97a839cf3679e | assets/93260fe0f4b5591f07b97a839cf3679e.webp | 33, 137, 138, 151, 152 | yok | webp 462x334 (sınıf gl) |
| 9341e876cee52b1de8fd04f0295b0815 | assets/9341e876cee52b1de8fd04f0295b0815.png | yok | yok | png 705x481 |
| 93e07a39ff76011ac4e2509a283f2c16 | assets/93e07a39ff76011ac4e2509a283f2c16.webp | 23, 125, 126, 127, 128, 129 | yok | webp 240x240 (sınıf oth) |
| 98dbf824561afc4da2d096d579a314e1 | assets/98dbf824561afc4da2d096d579a314e1.jpg | yok | yok | jpg 700x280 |
| 99b4e402d83f1deee3017321adf3bfc2 | assets/99b4e402d83f1deee3017321adf3bfc2.png | 55 | yok | png 360x294; alt: "Fotoğraf makinesiyle kapsül kanki" (sınıf vg) |
| 9aa79acd3b186524201c9dfe8873e5bf | assets/9aa79acd3b186524201c9dfe8873e5bf.png | yok | yok | png 192x192 |
| 9b04e7f8b7a0d9db57dc7461993cb811 | assets/9b04e7f8b7a0d9db57dc7461993cb811.webp | yok | apps/mobile/assets/riso/wall-dm-light.webp | webp 1290x2796 |
| 9b66556ea2d741f75eb87463bbe87fa1 | assets/9b66556ea2d741f75eb87463bbe87fa1.png | 47 | yok | png 1020x450 (sınıf msa) |
| 9c804555eb307d670ed8ea258c9189c1 | assets/9c804555eb307d670ed8ea258c9189c1.png | 47 | yok | png 282x546 |
| 9d118f2f1452959c3f0150e92a0adcb3 | assets/9d118f2f1452959c3f0150e92a0adcb3.webp | 32c | yok | webp 480x288 |
| 9ecdb31f69c42da3e0401fbfdcfa9303 | assets/9ecdb31f69c42da3e0401fbfdcfa9303.png | 47 | yok | png 72x72 (sınıf st) |
| 9f0048ecc2e6f1c68fc45466627ef9cf | assets/9f0048ecc2e6f1c68fc45466627ef9cf.png | 03b, 03c, 90 | yok | png 216x216; alt: "Gece pelerinli kapsül gövdesi" |
| a0de9d6a0a9c54082d40048b64a145d3 | assets/a0de9d6a0a9c54082d40048b64a145d3.png | 51 | yok | png 360x294; alt: "Ad etiketi takan kapsül kanki" (sınıf vg) |
| a28d6803dd052ca7cc6ff236d5b62b4f | assets/a28d6803dd052ca7cc6ff236d5b62b4f.png | 39, 40, 41, 42, 43, 44, 93, 139, 140 | yok | png 230x148; alt: "Vampir Köylü" (sınıf lc) (sınıf gl) |
| a318ef0a05db87a9002812be24f1c9dc | assets/a318ef0a05db87a9002812be24f1c9dc.png | yok | yok | png 192x192 |
| a4356553f77bd1b9d477af45b6cc38b2 | assets/a4356553f77bd1b9d477af45b6cc38b2.png | 111 | yok | png 640x520; alt: "Yanındaki boş yere el sallayan kapsül kanki" |
| a60104f6960cc480b61c506654fd7f4a | assets/a60104f6960cc480b61c506654fd7f4a.jpg | 120, 121 | yok | jpg 700x400; alt: "Gönderdiğin fotoğraf" / "Gönderilecek fotoğraf" (sınıf pimg) |
| a76adfc62423c2b6bbc776feca990570 | assets/a76adfc62423c2b6bbc776feca990570.png | 04, 110, 130, 131 | yok | png 160x200 (sınıf pk pk2) |
| a84d04f0b90528f2c615940429dab13b | assets/a84d04f0b90528f2c615940429dab13b.png | 03, 57, 58, 59, 60, 61, 87 | yok | png 400x400 |
| a900b9cf0fa62349ab9f1047a6352586 | assets/a900b9cf0fa62349ab9f1047a6352586.png | yok | yok | png 717x493 |
| aa3dcb93be21e1f44187088d78d410ea | assets/aa3dcb93be21e1f44187088d78d410ea.png | 10c, 116 | yok | png 128x128 (sınıf th) |
| aae633427c19cdc54ece49f457a2a7c8 | assets/aae633427c19cdc54ece49f457a2a7c8.jpg | 07a | yok | jpg 700x280 |
| ab870592565f0bb899bdf36524b0c9fe | assets/ab870592565f0bb899bdf36524b0c9fe.webp | yok | yok | webp 1050x600 |
| ac387a361c9f04507a8c75dcf945b4c8 | assets/ac387a361c9f04507a8c75dcf945b4c8.png | yok | yok | png 320x420 |
| ada27d2c14c1605567a678d65e253df2 | assets/ada27d2c14c1605567a678d65e253df2.png | 66a | yok | png 360x294; alt: "Kırık fincana bakan kapsül kanki" |
| b0a29601b7a7340812d75f164c35d6d1 | assets/b0a29601b7a7340812d75f164c35d6d1.png | 11b | yok | png 1080x480 (sınıf peek) |
| b0c6d6474348db624a6eda282cb5c8d0 | assets/b0c6d6474348db624a6eda282cb5c8d0.png | 06, 06b, 111 | yok | png 900x510 (sınıf pk) |
| b2c88a4edc9263d8bd986a4ceb1dc00f | assets/b2c88a4edc9263d8bd986a4ceb1dc00f.png | 03f, 03g, 03h, 77, 78, 79, 80, 81, 91 | yok | png 240x240 |
| b2dada855877c63802f8861460009385 | assets/b2dada855877c63802f8861460009385.png | 08, 08b, 09 | yok | png 168x168 (sınıf th) |
| b4bb8c93e702350673f875a78ef08dd0 | assets/b4bb8c93e702350673f875a78ef08dd0.png | yok | yok | png 320x420 |
| b51d25fed41b704b20ebe1671f19cdea | assets/b51d25fed41b704b20ebe1671f19cdea.png | yok | yok | png 320x420 |
| b7b87921e039c1abdc01ac67c41a7da9 | assets/b7b87921e039c1abdc01ac67c41a7da9.webp | 11b, 11c, 17, 18, 123, 124 | yok | webp 1080x858 (sınıf hero) |
| b84c7ef7ecc676389c86973724b4a7b4 | assets/b84c7ef7ecc676389c86973724b4a7b4.png | yok | yok | png 717x493 |
| beb8bad0d921dad513d5e8ea75d7c319 | assets/beb8bad0d921dad513d5e8ea75d7c319.png | 09, 22, 23, 24, 25, 25b, 26, 33, 34, 35, 38, 39, 40, 41, 42, 43, 44, 45, 46, 93, 125, 126, 127, 128, 129, 139, 140, 142, 145, 147, 148, 150, 151, 158 | yok | png 192x192 (sınıf ma) (sınıf kav) |
| befa1e52cac52c04a65bfff50e5023ec | assets/befa1e52cac52c04a65bfff50e5023ec.png | yok | yok | png 192x192 |
| bf557877ebe6a42a07761a284acdb808 | assets/bf557877ebe6a42a07761a284acdb808.png | yok | yok | png 144x144 |
| c029f94af0ba81e0ebcd74dc1ae8986c | assets/c029f94af0ba81e0ebcd74dc1ae8986c.png | yok | yok | png 717x494 |
| c15547ab2de88d352e84e5c3a196df5a | assets/c15547ab2de88d352e84e5c3a196df5a.png | yok | yok | png 717x494 |
| c270f1cdc8b46407974f158d428c39a9 | assets/c270f1cdc8b46407974f158d428c39a9.webp | 62b | yok | webp 720x1134 (sınıf pp r) |
| c30062bbf5561f165da829d225d0fb5a | assets/c30062bbf5561f165da829d225d0fb5a.png | 09, 22, 23, 24, 25, 25b, 26, 33, 34, 35, 38, 39, 40, 41, 42, 43, 44, 45, 46, 93, 125, 126, 127, 128, 129, 139, 151 | yok | png 192x192 (sınıf ma) (sınıf kav) |
| c3ef66dd1737d8c228795c40fe3845bb | assets/c3ef66dd1737d8c228795c40fe3845bb.png | yok | yok | png 216x216 |
| c4c89f90a484c333d8dd1f90f66b472a | assets/c4c89f90a484c333d8dd1f90f66b472a.webp | yok | yok | webp 420x280 |
| c5c0fffb67158b2abda222374d1309ea | assets/c5c0fffb67158b2abda222374d1309ea.png | yok | yok | png 192x192 |
| c766867b52a4f61fff356bbe91200cda | assets/c766867b52a4f61fff356bbe91200cda.webp | 137, 138, 157, 158 | yok | webp 462x334 (sınıf gl) |
| c7b0a908882db3a12a515a9726634cc5 | assets/c7b0a908882db3a12a515a9726634cc5.jpg | yok | yok | jpg 700x400 |
| c869137a83179312824b6299d898f3f6 | assets/c869137a83179312824b6299d898f3f6.webp | 23, 125, 126, 127, 128, 129 | yok | webp 240x240 (sınıf oth) |
| c86d64379de24c41f4660d44fabf107e | assets/c86d64379de24c41f4660d44fabf107e.png | 03q | yok | png 360x294; alt: "Açık bahçe kapısından geçen kapsül kanki" |
| cbda3ee975fe0e90e6feb972f79b7601 | assets/cbda3ee975fe0e90e6feb972f79b7601.png | 10, 10b, 10c, 112 | yok | png 600x340 (sınıf kk) |
| cc89211e04394fe5debe41481577d6c7 | assets/cc89211e04394fe5debe41481577d6c7.webp | 32b, 33, 34, 35, 38, 137, 138 | yok | webp 462x334 |
| d265dd1ce487a8382e0c43b65623945d | assets/d265dd1ce487a8382e0c43b65623945d.webp | 10, 10c, 100, 112 | yok | webp 1050x600 |
| d4921959efe520be6e7fe29ad31f7b81 | assets/d4921959efe520be6e7fe29ad31f7b81.png | 113 | yok | png 640x520; alt: "Birbirine kâğıt uçak gönderen iki kapsül kanki" |
| d8891436b9d74b9683df07951381287c | assets/d8891436b9d74b9683df07951381287c.png | 10, 10b, 10c | yok | png 128x128 (sınıf th) |
| d959326b523f0457b16c1d5da612e64d | assets/d959326b523f0457b16c1d5da612e64d.png | 03f, 03g, 03h, 77, 78, 79, 80, 81, 91 | yok | png 240x240 |
| da480976956aa06f07299f7a86866eff | assets/da480976956aa06f07299f7a86866eff.png | 19, 20, 21, 22, 24, 25, 25b, 26, 27, 32a, 32b, 32c | yok | png 1080x510 (sınıf pk2) |
| de2389dbc0af8de8a7071a32fd904dab | assets/de2389dbc0af8de8a7071a32fd904dab.jpg | 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 133, 134, 135, 136 | yok | jpg 800x920 |
| e01aea18658219f230f6370c32d4a391 | assets/e01aea18658219f230f6370c32d4a391.png | 47 | yok | png 72x72 (sınıf st) |
| e07afded341d8b8e323a5e5ac87a919d | assets/e07afded341d8b8e323a5e5ac87a919d.png | 14, 15, 16, 92, 94, 95, 96, 97, 98, 99 | yok | png 1290x2796 |
| e20e7d13c8f31c065a08167347958dfc | assets/e20e7d13c8f31c065a08167347958dfc.webp | 32a, 32b, 32c | yok | webp 480x288 |
| e22a2e3efe0d75df294840cfdf8765c8 | assets/e22a2e3efe0d75df294840cfdf8765c8.webp | yok | yok | webp 1050x708 |
| e4265d2b5d8d4bf27612f26877042f08 | assets/e4265d2b5d8d4bf27612f26877042f08.png | 47 | yok | png 1170x600 (sınıf bgl) |
| e72abde7cf7fb1ce721363d328a98c1e | assets/e72abde7cf7fb1ce721363d328a98c1e.png | 31, 32 | yok | png 1290x2796 |
| e7697807e1a0e6d0519b0c71c7620066 | assets/e7697807e1a0e6d0519b0c71c7620066.webp | 32c | yok | webp 480x288 |
| e7ec12ccfd48402845ca6ffd6f895d8b | assets/e7ec12ccfd48402845ca6ffd6f895d8b.png | 02, 02b, 02c, 02d, 02e, 88, 107, 108, 113, 118, 119, 120, 121, 122 | yok | png 1290x2796 |
| e87181555069be936f64591a1b7131a5 | assets/e87181555069be936f64591a1b7131a5.png | 22, 23, 24, 25, 25b, 26, 33, 34, 35, 38, 125, 126, 127, 128, 129, 139, 140, 151 | yok | png 192x192 |
| e8b14344a2666520c6236e54874d4d84 | assets/e8b14344a2666520c6236e54874d4d84.webp | 62, 62a, 62b, 62c, 62d | yok | webp 720x1134; alt: "Bronz paket" (sınıf pp c) (sınıf pp l) |
| eb02ec7538a5281e60e58d9e083286ad | assets/eb02ec7538a5281e60e58d9e083286ad.png | 07, 07a, 08, 08b, 66, 66a | yok | png 180x276 (sınıf k3) |
| eb0b3b48f4874dd6129b495a80351064 | assets/eb0b3b48f4874dd6129b495a80351064.webp | 32c | yok | webp 480x288 |
| edc11ca5adcd4b5e9a480c92b598fb36 | assets/edc11ca5adcd4b5e9a480c92b598fb36.png | 03b, 03c, 03d, 03e, 90 | yok | png 1170x720 |
| edd857d096cd162ff7c29fcd1e0d0001 | assets/edd857d096cd162ff7c29fcd1e0d0001.png | 109 | yok | png 640x520; alt: "Boş konuşma balonu tutan kapsül kanki" |
| ee5f097aa7995317db76bd5cf46965a3 | assets/ee5f097aa7995317db76bd5cf46965a3.webp | 05a, 32c | yok | webp 480x288 |
| f41ab6e246140d68adea6c1841e086e4 | assets/f41ab6e246140d68adea6c1841e086e4.webp | yok | yok | webp 420x280 |
| f67fc3d1a51e5a037f1fdd3d2419c464 | assets/f67fc3d1a51e5a037f1fdd3d2419c464.png | 07, 07a, 08, 08b, 66, 66a | yok | png 180x276 (sınıf k1) |
| f7dee805f0f4469cc3dc9eb547925e60 | assets/f7dee805f0f4469cc3dc9eb547925e60.webp | 32b, 33, 34, 35, 38, 137, 138, 149, 150 | yok | webp 462x334 (sınıf gl) |
| f827791ea9b8b9757bfca5c1fae72b21 | assets/f827791ea9b8b9757bfca5c1fae72b21.png | 48 | yok | png 360x294; alt: "Onaylı listenin yanında kapsül kanki" (sınıf vg) |
| f9058e1fe302dac1d320970d8a8ec2c5 | assets/f9058e1fe302dac1d320970d8a8ec2c5.webp | 32b, 33, 34, 35, 38, 137, 138, 147, 148 | yok | webp 462x334 (sınıf gl) |
| f95f129f1fae61526739ffa9d2172d76 | assets/f95f129f1fae61526739ffa9d2172d76.png | yok | yok | png 144x144 |
| f9a8e905ac0a01184cb44d3cfb94a04d | assets/f9a8e905ac0a01184cb44d3cfb94a04d.png | 03f, 03g, 03h, 77, 78, 79, 80, 81, 91 | yok | png 240x240 |
| fa083f08d4346416628e9ac3a6b739a0 | assets/fa083f08d4346416628e9ac3a6b739a0.png | yok | yok | png 320x420 |
| fd18218a2fe2bada846e96641110a653 | assets/fd18218a2fe2bada846e96641110a653.png | 47 | yok | png 282x546 |
| febcf449564c8ba507b6da154bbb409a | assets/febcf449564c8ba507b6da154bbb409a.webp | 62, 62a, 62c | yok | webp 720x1134 (sınıf pp l) |
| ff99fe2386fc570cea82a0e0d31a5e56 | assets/ff99fe2386fc570cea82a0e0d31a5e56.png | 11b, 11c, 17, 18, 123, 124 | yok | png 900x540 |

## Notlar

- 1290x2796 boyundaki 8 varlık ekran görüntüsü değil, sohbet duvar kâğıdıdır (564f379c… açılıp bakıldı: açık mavi zemin, çizgi kapsül/uzay deseni; ikisi depodaki `apps/mobile/assets/riso/wall-dm-light.webp` ve `wall-dm-dark.webp` ile birebir aynı, ama panolar bunlara değil png sürümlerine başvuruyor).
- `alt` metni olmayan satırlarda tür yalnız biçim ve boydur; içerik doğrulanmadı.
