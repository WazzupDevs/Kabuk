# Grup 4: Masa kur (aura v47)

Onay: proje sahibi, 31 Ekim. Kaynak: aura tuvali v47, panolar MasaKur, MasaKurLobi, MasaKurSimge, MasaKurDar, GaleriMasaKur, not motionMasaKur.

- M1 (#314): `Sheet` isteğe bağlı `footer` alır (`SheetCard`'ın Check-in için olan alt alanı). "Masayı kur" ve uyarı satırları alt alanda; içerik yalnızca sığmazsa kayar. Alt alanın üst kenarında 24 dp solma yalnızca içerik taşarken (`SheetCard` → `footerFade`); Check-in (`RouteSheet`) bunu vermez, düz kesimi korunur.
- M2 (#315): Masa kur'da uyarı açık #A8301A / koyu #FF977E, bağlantı açık #6A47F5 / koyu #9C86FF (`KIT.light/dark` → `warn`, `link`). Genel `KIT.primary` ve `KIT.danger` değişmedi.
- M3: `IconPicker` aura kitinde: seçim çerçevesi `KIT.primary` 3 dp, aradaki 1 dp boşluk kalktı, karolar arası 8. Masadaki "Simgeyi değiştir" (`TableIconSheet`) aynı bileşeni kullanır ve aynı görünüşe geçti (proje sahibi onayladı); seçim, soluk simge ve anında kaydetme aynı.
- Bütün simgeler başka masadaysa `icon` boş kalır, ad etiketi boş görünür; tasarım çizmedi, davranış değişmedi.
