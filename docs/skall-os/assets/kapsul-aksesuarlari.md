# Kapsül aksesuarları: görsel kayıt

Capsule Art Studio'nun hafızası: çizilmiş her paket aksesuarı bir satır. Yeni aksesuar tasarlanmadan önce bu tablo okunur; aynı fikir ikinci kez sıfırdan çizilmez. Yeni aksesuar kendi satırıyla gelir (`scripts/skall-os.test.ts` kataloğun her aksesuarının burada olduğunu denetler).

- **Kaynaklar (bu tablo onların dizinidir, kopyası değil):** katalog `content/gift-packs.json`; çizimler `apps/mobile/src/theme/capsuleAccessories.ts` → `ACCESSORY_ART`; hareketler `apps/mobile/src/theme/capsuleFx.ts` → `FX`; panolar `docs/design/aura/project/Aksesuar*.dc.html`, `BalonElf`, `BalonNinja`; ürün kuralı `docs/SPEC_V4.md` §4.U.
- **Sütunlar:** yuva `c` Renk, `e` Göz, `h` Baş, `f` Yüz, `m` Ağız, `n` Boyun. Çapa çizimin kapsüle oturduğu yer (`head`, `face`, `mid`, `body`). Ek katman: `back` gövdenin arkası, `skin` gövdenin üstü ve vizörün altı. Hareket: çizimdeki `data-fx` adları.
- **Not sütunu elle tutulur:** tasarım niyeti, benzediği aksesuar, reddedilen deneme ve nedeni. İlk döküm (11 Kasım 2026) katalogdan ve çizim dosyasından çıkarıldı; notlar o tarihte boştu, geçmiş tasarım gerekçeleri kayda geçmemişti.
- Kapsülün kendi parçaları (173 parça, 23 göz, 16 renk) burada değil: `content/capsule-catalog.json` ve `docs/design/kaynak/kapsul/`.

| Kimlik            | Ad                  | Kademe   | Yuva | Set   | Çapa | Ek katman  | Hareket                                             | Not                     |
| ----------------- | ------------------- | -------- | ---- | ----- | ---- | ---------- | --------------------------------------------------- | ----------------------- |
| `filiz`           | Filiz               | Sıradan  | h    | —     | body | —          | —                                                   |                         |
| `percem`          | Perçem              | Sıradan  | h    | —     | body | —          | —                                                   |                         |
| `altigengozluk`   | Altıgen gözlük      | Sıradan  | f    | —     | body | —          | —                                                   |                         |
| `baklagoz`        | Bakla göz           | Sıradan  | e    | —     | body | —          | —                                                   |                         |
| `artigoz`         | Artı göz            | Sıradan  | e    | —     | body | —          | —                                                   |                         |
| `yarabandi`       | Yara bandı          | Sıradan  | m    | —     | body | —          | —                                                   |                         |
| `kurdan`          | Kürdan              | Sıradan  | m    | —     | body | —          | —                                                   |                         |
| `guzellikbeni`    | Güzellik beni       | Sıradan  | m    | —     | body | —          | —                                                   |                         |
| `anahtarkolye`    | Anahtar kolye       | Sıradan  | n    | —     | body | —          | —                                                   |                         |
| `ipkravat`        | İp kravat           | Sıradan  | n    | —     | body | —          | —                                                   |                         |
| `pervanelisapka`  | Pervaneli şapka     | Nadir    | h    | —     | body | —          | —                                                   |                         |
| `balikcisapkasi`  | Balıkçı şapkası     | Nadir    | h    | —     | body | —          | —                                                   |                         |
| `cilekgozluk`     | Çilek gözlük        | Nadir    | f    | —     | body | —          | —                                                   |                         |
| `panjurgozluk`    | Panjur gözlük       | Nadir    | f    | —     | body | —          | —                                                   |                         |
| `sarmalgoz`       | Sarmal göz          | Nadir    | e    | —     | body | —          | —                                                   |                         |
| `kedibiyiklari`   | Kedi bıyıkları      | Nadir    | m    | —     | body | —          | —                                                   |                         |
| `distegul`        | Dişte gül           | Nadir    | m    | —     | body | —          | —                                                   |                         |
| `yildizcikartma`  | Yıldız çıkartma     | Nadir    | m    | —     | body | —          | —                                                   |                         |
| `pusulakolye`     | Pusula kolye        | Nadir    | n    | —     | body | —          | —                                                   |                         |
| `kopekbaligidisi` | Köpekbalığı dişi    | Nadir    | n    | —     | body | —          | —                                                   |                         |
| `kistakimi`       | Kış takımı          | Destansı | h n  | —     | body | —          | glint                                               |                         |
| `buyucutakimi`    | Büyücü takımı       | Destansı | h n  | —     | body | —          | glint                                               |                         |
| `yildiztakimi`    | Yıldız takımı       | Destansı | f m  | —     | body | —          | glint                                               |                         |
| `korsantakimi`    | Korsan takımı       | Destansı | h f  | —     | body | —          | glint                                               |                         |
| `dalgictakimi`    | Dalgıç takımı       | Destansı | f m  | —     | body | —          | glint                                               |                         |
| `seftakimi`       | Şef takımı          | Destansı | h m  | —     | body | —          | glint                                               |                         |
| `doktortakimi`    | Doktor takımı       | Destansı | h n  | —     | body | —          | glint                                               |                         |
| `rocktakimi`      | Rock takımı         | Destansı | f n  | —     | body | —          | glint                                               |                         |
| `astronottakimi`  | Astronot takımı     | Destansı | h f  | —     | body | —          | glint                                               |                         |
| `hawaiitakimi`    | Hawaii takımı       | Destansı | h n  | —     | body | —          | glint                                               |                         |
| `kuzeyisigi`      | Kuzey ışığı         | Efsanevi | h    | —     | body | back       | halo, rise, tw1, tw2, tw3, wave, wave2              |                         |
| `ejderboynuzu`    | Ejder boynuzu       | Efsanevi | h    | —     | body | back       | flick, flick2, halo, rise                           |                         |
| `ejdernefesi`     | Ejder nefesi        | Efsanevi | m    | —     | body | back       | flick, glow, halo, rise, tw1, tw2, tw3              |                         |
| `alevsac`         | Alev saç            | Efsanevi | h    | —     | body | back       | fl1, fl2, fl3, halo, rise, tw1, tw2                 |                         |
| `simsekbulutu`    | Şimşek bulutu       | Efsanevi | h    | —     | body | back       | bob, flash, halo, rain, tw1, tw2                    |                         |
| `kelebekgozluk`   | Kelebek gözlük      | Efsanevi | f    | —     | body | back       | halo, tw1, tw2, tw3, wingL, wingR                   |                         |
| `gokkusagiatki`   | Gökkuşağı atkı      | Efsanevi | n    | —     | body | back       | halo, shift, tw1, tw2, tw3, wave, wave2             |                         |
| `yildiztozu`      | Yıldız tozu         | Efsanevi | m    | —     | body | back       | halo, orb1, orb2, orb3, tw1, tw2, tw3               |                         |
| `neongozluk`      | Neon gözlük         | Efsanevi | f    | —     | body | back       | glow, halo, scan, tw1, tw2                          |                         |
| `kalpbaloncuk`    | Kalp baloncukları   | Efsanevi | m    | —     | body | back       | halo, hr0, hr1, hr2, hr3, tw1, tw2, tw3             |                         |
| `yapraktaci`      | Yaprak tacı         | Efsanevi | h    | Elf   | body | back       | ff0, ff1, ff2, halo, sway0, sway1, sway2, tw1, tw2  |                         |
| `aydiademi`       | Ay diademi          | Efsanevi | h    | Elf   | body | back       | glow, halo, sway0, sway1, sway2, tw1, tw2, tw3      |                         |
| `elfkulaklari`    | Elf kulakları       | Efsanevi | h    | Elf   | body | back       | halo, sway1, sway2, tw1, tw2, twitch0, twitch1      |                         |
| `ormanrunleri`    | Orman rünleri       | Efsanevi | m    | Elf   | body | back       | glow, halo, tw1, tw2, tw3                           |                         |
| `yaprakmaske`     | Yaprak maske        | Efsanevi | f    | Elf   | body | back       | halo, sway0, sway1, sway2, tw1, tw2                 |                         |
| `ayisigigozleri`  | Ay ışığı gözleri    | Efsanevi | e    | Elf   | body | back       | glow, halo, pulse, rise, tw1, tw2                   |                         |
| `sihirliflut`     | Sihirli flüt        | Efsanevi | m    | Elf   | body | back       | glow, halo, hr0, hr1, hr2, hr3, tw1                 |                         |
| `yaprakyakasi`    | Yaprak yakası       | Efsanevi | n    | Elf   | body | back       | ff0, ff1, halo, sway0, sway1, sway2, tw1, tw2       |                         |
| `hayatagaci`      | Hayat ağacı kolyesi | Efsanevi | n    | Elf   | body | back       | ff1, halo, pulse, tw1, tw2                          |                         |
| `ormanteni`       | Orman teni          | Efsanevi | c    | Elf   | body | back, skin | glint, halo, tw1, tw2, tw3                          |                         |
| `golgebasligi`    | Gölge başlığı       | Efsanevi | h    | Ninja | body | back       | glow, halo, rise, tw1, tw2, tw3, wave, wave2        |                         |
| `shurikentokasi`  | Shuriken tokası     | Efsanevi | h    | Ninja | body | back       | halo, spinfast, spinrev, tw1, tw2, tw3, wave, wave2 |                         |
| `tilkimaskesi`    | Tilki maskesi       | Efsanevi | f    | Ninja | body | back       | halo, pulse, tw1, tw2, tw3                          |                         |
| `simsekgozler`    | Şimşek gözler       | Efsanevi | e    | Ninja | body | back       | glow, halo, tw1, tw2, tw3                           |                         |
| `dumanpecesi`     | Duman peçesi        | Efsanevi | m    | Ninja | body | back       | halo, rise, tw1, tw2, wave                          |                         |
| `klanisareti`     | Klan işareti        | Efsanevi | m    | Ninja | body | back       | halo, pulse, rise, tw1, tw2                         |                         |
| `gecepelerini`    | Gece pelerini       | Efsanevi | n    | Ninja | body | back       | halo, tw1, tw2, tw3, wave                           |                         |
| `sirtkatanasi`    | Sırt katanası       | Efsanevi | n    | Ninja | body | back       | glow, halo, sway0, tw1, tw2                         |                         |
| `kunaikolyesi`    | Kunai kolyesi       | Efsanevi | n    | Ninja | body | back       | glint, halo, sway1, tw1, tw2, tw3                   |                         |
| `geceteni`        | Gece teni           | Efsanevi | c    | Ninja | body | back, skin | glint, halo, tw1, tw2, tw3                          |                         |
| `bere`            | Bere                | Sıradan  | h    | —     | head | —          | —                                                   | Emekli: paketten çıkmaz |
| `yuvarlakgozluk`  | Yuvarlak gözlük     | Sıradan  | f    | —     | face | —          | —                                                   | Emekli: paketten çıkmaz |
| `kasket`          | Kasket              | Nadir    | h    | —     | head | —          | —                                                   | Emekli: paketten çıkmaz |
| `kulaklik`        | Kulaklık            | Nadir    | h    | —     | mid  | —          | —                                                   | Emekli: paketten çıkmaz |
| `buyucusapkasi`   | Büyücü şapkası      | Destansı | h    | —     | head | —          | —                                                   | Emekli: paketten çıkmaz |
| `yildizgozluk`    | Yıldız gözlük       | Destansı | f    | —     | face | —          | —                                                   | Emekli: paketten çıkmaz |
| `tac`             | Taç                 | Efsanevi | h    | —     | head | —          | —                                                   | Emekli: paketten çıkmaz |

## Reddedilen ve emekli tasarımlar

Reddedilen bir aksesuar denemesi buraya adı, tarihi ve nedeniyle yazılır. 11 Kasım 2026 itibarıyla kayıt yok.
