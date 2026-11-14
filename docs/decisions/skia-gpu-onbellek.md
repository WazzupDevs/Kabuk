# Skia'nın GPU önbelleği: sınır, boşaltma ve iz işaretleri (14 Kasım 2026)

**Sorun (ölçüldü, `docs/perf/akicilik-denetimi.md` → 4.11):** "Bütün kapsül Skia" açıkken GL mtrack 367–378 MB'ta duruyor. Süsle'den çıkmak, arka plana almak ve `RUNNING_CRITICAL` bu belleği indirmiyor (282–315 MB kalıyor). Anahtar kapalıyken 12–37 MB'a iniyor.

**Neden (paketten okundu):** `@shopify/react-native-skia` 2.6.2 Android'de her iş parçacığı için bir `GrDirectContext` açıyor (`OpenGLContext::getInstance`, `thread_local`). Bu bağlamın önbellek sınırını hiç ayarlamıyor ve önbelleği hiç boşaltmıyor; Skia'nın varsayılan sınırı 256 MB. Tuvaller ana iş parçacığında çiziyor (`RNSkView::requestRedraw` → `runOnMainThread` → `renderImmediate`). `FxSkia.tsx`'in CPU'da yaptığı resim, ilk çizildiğinde GPU'ya kopyalanıyor. Resim bırakılınca bu kopya önbellekte kalıyor ve sınıra kadar birikiyor.

**Yapılan (`patches/@shopify__react-native-skia@2.6.2.patch`, kendi kodumuz):**

- `Skia.Surface.PurgeGpu(limitBytes, msNotUsed)`: ana iş parçacığının bağlamında önbellek sınırını koyar (`setResourceCacheLimit`) ve son `msNotUsed` ms'de kullanılmayanı bırakır (`performDeferredCleanup`).
- `image.makeTextureImage()`: resmin GPU'daki kopyasını çağıran iş parçacığının bağlamında yapar. Bugün kullanılmıyor; zarın uzun karesi doku yüklemesinden çıkarsa ön yükleme için OTA ile kullanılabilsin diye bu build'e kondu.
- İz işaretleri: `RNSkia.render` (ana iş parçacığında bir tuvalin çizimi) ve `RNSkia.flush` (GPU'ya gönderme). 4.11'de zarın 125–435 ms'lik UI işi hiçbir iz diliminde değildi; bu işaretlerle o işin Skia'nın çizimi olup olmadığı izde doğrudan görünür.
- Uygulama (`src/components/FxSkia.tsx`): açılışta sınır 96 MB. Süsle kapanınca (son tuval gidince) ve uygulama arka plana geçince kullanılmayan her şey bırakılır. Eski build'de bu çağrılar yoktur; uygulama hiçbir şey yapmaz.

**Doğrulanacak (yeni build'de, tek ölçüm):** çıkışta ve arka planda GL mtrack iniyor mu; 96 MB sınırı zar ve parça değişiminde kare kaybını artırıyor mu; zarın uzun karesi `RNSkia.render` içinde mi. Sınır yanlış çıkarsa yalnız `GPU_CACHE_BYTES` değişir, OTA ile gider.
