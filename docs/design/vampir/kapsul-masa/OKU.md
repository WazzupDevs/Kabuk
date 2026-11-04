# Vampir Köylü kapsül masa: CTO referans paketi (Aura v83)

## İçerik
- `arka-plan-masasiz/` faz başına arka plan, 1080x2280 (360x760 dp @3x): zemin, halı, oda objeleri, pencere ışığı, faz rengi ve vinyet dahil; masa, tabure, mum, kart, kişi, yazı YOK. Dosyalar: gece, safak-sabah, gunduz-oylama, son-sonuc.
- `sahne-masali/` aynı sahne masa, tabureler, mumlar ve süre kadranıyla (kişi, kart ve yazı yok). Aura panolarındaki görselle aynı.
- `kaynak/` referans çizim kodu: `real2.js` (arka plan: zemin `floor`, halı `rug`), `toon2.js` (masa `tableT`, tabure `stool`, mum `candle`/`flame`, fıçı `barrel`, kasa `crate`, saksı `plant`, kitap `books`, kadran `timerDial`, faz paleti `PAL`), `build.py` (koltuk, kart, mum yerleşimi: `ring`, `seats`, `G8`, `G12`, `T`). Tarayıcı canvas 2D kodudur; değerler react-native-svg'ye birebir taşınabilir.

## Renk ve ölçü tablosu (toon2.js'den)
- Kontur: #141016; masa 3,2 dp, obje 1,7–2,6 dp, yaprak 1,7 dp.
- Sert düşen gölge: rgba(10,4,0,.38–.45), ofset masa (6,10), obje (3–4, 5–6), tabure (0, 2,5).
- Gölge bandı (daire objelerde): radyal, sol üst rgba(255,255,255,.10) → sağ alt rgba(30,0,40,.28).
- Masa kenarı #B8743E, gölge bandı #9A5C2E, parlama rgba(255,236,200,.55) 2,4 dp; altın şerit #F2C25A 3 dp (masa kenarından 11 dp içeride).
- Tabla (keçe yok), tahta genişliği tabla/6, tahta arası #141016 %55: gece #6E3A22, şafak #7A4228, gündüz #8A4C2C, son #5E2A1E; ortada sıcak ışık rgba(255,214,150,.16), kenarda rgba(20,0,10,.38).
- Tabure ahşap #C27A42, minder = kişi rengi (build.py `CUSH`), minder yarıçapı tabure × .76.
- Mum: tabak #F2C25A r10, mum #FFF6E4 r6 (× ölçek .62; 12 kişide .5), alev #FF9A2A + iç #FFE88A, ışık rgba(255,180,80) r32.
- Kadran: çerçeve #F2C25A (r+4), yüz #2A1A12; sayı #FFF1D0 800/17 (küçük 13).
- Fıçı #B06E3A + çember #8C8A92; kasa #C88A4E / iç #5A3218, şişeler #3FB46A #E0456A #F2A03A #4A8AE0; saksı #E4794A, yapraklar #2E8A4A #3FB060 #5ACB74; kitaplar #C2405A #3A7AC2 #F2A03A.
- Halı (real2.js): #4A1020 / #B88A48 / #2A0A14 / #5E1626, kenar baklavaları #C89A52 ve #7A2234; masa yarı genişliği + 66 dp.
- Faz: gece multiply #6C76C8, vinyet .66 (mavi); şafak #F2B09C, vinyet .42, +.03 aydınlatma; gündüz filtre yok, +.12 aydınlatma, vinyet .16; son #C8606E, vinyet .58. Pencere ışığı gece rgba(150,180,255,.20), şafak (255,170,120,.24), gündüz (255,244,210,.36), son (255,80,110,.16), 7 dp bulanık.
