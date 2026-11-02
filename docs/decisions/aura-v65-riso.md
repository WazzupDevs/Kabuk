# Aura v65 riso görselleri repoda (2 Kasım 2026)

Proje sahibinin gönderdiği zip'ler (`skall-riso-gorseller-v64.zip`, `masa-karti-webp-1of7…7of7.zip`, `acilis-riso-doku.zip`) uygulamanın kullanacağı boyutlarda repoya alındı; sonraki oturumlar zip istemez (proje sahibinin isteği).

- `apps/mobile/assets/riso/`: rapor §9.1'in hazır görselleri, WebP. Ekrandaki ölçünün 3 katı (simge 168, nokta 144, geçmiş 156) ya da kaynağın kendisi (sahne 800, boş hâller, oyun kapakları 600, duvar kâğıtları 900x1950, kankiler 320x420); büyütme yok. Duvar kâğıdı ve sahne kalite 80, diğerleri 90.
- `assets/pin/pin-<tür>.png`: riso simge beyaz halkada yuvarlak kesik, 40 pt (1x, 2x, 3x); gölge nötr (mor aile kalktı, U1).
- `assets/table-cards/{yatay,uzun}/NN-ad.webp`: 55 masa kartı. Yatay 800x480 (kart 168 yüksekliğin 2 katından fazlası), uzun 720x1560 kalite 70 (55 duvar kâğıdı uygulamaya ~21 MB ekler; kaynak boyu ~60 MB'tı). `masa-adlari.md` yanında. Kartların masa simgelerine eşleşmesi karar 12.6'yı bekler; o zamana kadar kullanılmaz.
- `assets/launch/`: riso açılış doku seti (22 WebP, kayıpsız, 3x) ve README; bölüm 14'te bağlanır.
- Çevrilmeyen: `*-soldurulmamis.png`, ikon SVG'leri (repoda var), `uretici-doku.py`.
