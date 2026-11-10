# M15-22: girişten ve klavyeden sonra yerleşim kayması (10 Kasım 2026)

**Belirti.** Klavye açıldıktan ya da giriş yapıldıktan sonra başlık durum çubuğuna, sekme çubuğu gezinme tuşlarına iniyor, kartlar kenara yaklaşıyordu; uygulama kapatılıp açılınca düzeliyordu.

**Neden.** Güvenli alan kaybolmuyordu. Kayma öncesi ve sonrası görüntüler (`k27`, `k34`) ölçülünce bütün uygulama ekranın ortasına yakın bir noktaya göre tam 1.06 büyütülmüş çıktı (üst kart 82→40 px, sekme çubuğu altı 1440→1478 px, yan boşluk 40→22 px). 1.06, açılış perdesinin (`LaunchCurtain`) uygulamayı başlattığı ölçek. Perdenin her karesi Reanimated'ın senkron yolundan (`ANDROID_SYNCHRONOUSLY_UPDATE_UI_PROPS`; `transform` bu yolda) görünüme doğrudan yazılıyor, React'in kopyasına girmiyor. React'in kopyası ilk çizimdeki 1.06'da kalıyordu; perde bileşeni sonradan yeniden çizilince (yerleşim değişimi, oturan animasyonun React'e geri yazılması) bu kopya görünüme geri gidiyordu.

**Düzeltme.** `launchMotion.ts` → `appTransform`: perde saati başlamadan ve perde bittikten sonra dönüşüm aynı beş adımda değişmezdir (`APP_AT_REST`); React'in tuttuğu kopya hep dinlenme hâlidir (`launchMotion.test.ts`).

**Kural.** Senkron yoldan güncellenen bir animasyonlu stilin ilk çizimdeki değeri, bileşenin dinlenme hâli olmalı; animasyon bitince boş dizi (`transform: []`) değil aynı adımların değişmez hâli döner.
