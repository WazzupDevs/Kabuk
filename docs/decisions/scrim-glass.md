# Uzun basma örtüsünün bulanıklığı (17 Kasım 2026)

- `SCRIM_GLASS` 8'den 6'ya iner (MesajlarUzunBas `.ubs`: blur 6); yalnız uzun basma örtüsünde, ekranın bir kez alınan sabit kopyasında kullanılır. Sayfa ve dialog örtüleri düzdür.
- Proje sahibinin kararı: bulanıklık varsayılan kapalıdır; yalnız Çizim ölçümü'nün "Uzun basma bulanıklığı" anahtarı açar (`lib/drawLab.ts` → `scrimGlass`, panel kapanınca korunur). Üretimde hep kapalıdır; kapalıyken yalnız örtü rengi (.30 / .62) çizilir.
- Gerekçe: bulanıklığın telefondaki çizim maliyeti ölçülmeden açılmaz; ⋮ menüsünün camı (`MENU_GLASS` 28) ve sayfa kartının canlı camı aynı pakette kalktı (`ortak-temel-plan.md` A.8–A.11).
