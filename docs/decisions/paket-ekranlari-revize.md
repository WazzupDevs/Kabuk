# Paket ekranları ve Süsle revizesi (7 Kasım 2026)

Proje sahibinin istekleri (R-1…R-7, H-1…H-5) ve onaylı önizleme:

- Kartın hologramı kartın dışına taşıyordu: boş kart resminin iki yanında saydam pay var; ışık artık o payın içinde kalır (`art.ts` → `CARD_SIDE`).
- Efsanevi kartın altındaki iki kapsül kalktı, yerine hareketli yıldız kümeleri (`StarBurst.tsx`).
- Paket rozeti kırpılıyordu: Android'de `filter` görünümün sınırında keser; filtre yalnız resme uygulanır.
- Paketler'de "Aç" ve "Oranlar" eşit boy, "Aç" paket renginde (`theme/gifts.ts` → `PACK_BUTTON`).
- Açılış takılıyordu: paket ve şerit resimleri adlı (`svgKey`) çizilir ve Paketler'de önceden gizli çizilir (`RipWarm`); kart, sunucu cevabından sonra iki kare gizli çizilip öyle yola çıkar; sonuç kartı yırtma sırasında altta hazır bekler.
- Aksesuarlarım kalktı; paketten çıkan parçalar Süsle'de yuvalarında. Profil çökmesi (Sentry MASA-8): halkadaki kapsülün gözleri grup içindeydi, göz katmanları yarım SVG üretiyordu (`eyeLayers`).
- Aksesuar hareketi yalnız seçili ekranlarda (`FxMoves`); varsayılan durağan.
