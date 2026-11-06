# Kibrit düzeltmeleri 1 (6 Kasım 2026)

`docs/decisions/senaryo-kibrit.md`'nin onaylı maddeleri; migration `20261203090000_kibrit_clock.sql`.

- **H-1:** `kibrit/advance` aşamayı yalnız süre dolunca geçirir. Eski 1 sn'lik pay, saati ileri bir telefonun yazmayı ve oylamayı erken kapatmasına, süre içindeki revizyonun düşmesine yol açıyordu (kural 3'ün istisnası). Telefonlar 2,5 sn'de bir yeniden sorduğu için pay bir şey kazandırmıyordu.
- **D-1:** az önce oyundan çıkmış birine verilen oy hata değildir: hiçbir şey değişmez, kişinin kendi hâli döner, ekran ızgarayı yeniden açar (hata titreşimi yok). Oyunda hiç oturmamış bir hedef yine `bad_request`.
- **T-1:** davranış aynı; SPEC'in "Mutlak gizlilik yoktur" listesine bildirilen sorunun özetten çıkmasının bildireni daraltabileceği eklendi.
