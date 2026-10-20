#!/usr/bin/env bash
# The visual gate's phone part (CLAUDE.md → Görsel kapı), inside reactivecircus/android-emulator-
# runner once the emulator (skin 720x1280) has booted: 360 dp at 2x, v46's width, the app's text
# size 1.0, animations off; then one Maestro flow per shot of e2e/visual/states.json
# (scripts/visual/make-flows.ts) and the candidates collected into $OUT/aday (and $OUT/aday2 with
# TEKRAR=1). Env: OUT, APK (scripts/e2e/fetch-apk.sh), TEKRAR.
set -euo pipefail
mkdir -p "$OUT"
# shellcheck source=../e2e/fetch-apk.sh
source "$(dirname "$0")/../e2e/fetch-apk.sh"

adb install -r -g "$APK"
adb shell wm density 320
adb shell settings put system font_scale 1.0
adb shell settings put global hide_error_dialogs 1 || true
echo "display: $(adb shell wm size | tr -d '\r'), $(adb shell wm density | tr -d '\r')" | tee "$OUT/display.txt"
# shellcheck source=../e2e/system-dialog.sh
source "$(dirname "$0")/../e2e/system-dialog.sh"
warm_up_app

node --experimental-strip-types scripts/visual/make-flows.ts . "$OUT/akis" ${TEKRAR:+--tekrar}

adb logcat -c
adb logcat '*:W' > "$OUT/logcat.txt" 2>&1 &
status=0
maestro test "$OUT/akis" \
  --format junit --output "$OUT/report.xml" \
  --test-output-dir "$OUT/maestro" 2>&1 | tee "$OUT/maestro-console.txt" || status=$?

# Maestro writes takeScreenshot files under its output folder; the candidates by shot name.
mkdir -p "$OUT/aday" "$OUT/aday2"
while IFS= read -r -d '' f; do
  name=$(basename "$f")
  case "$name" in
    aday2__*) cp "$f" "$OUT/aday2/${name#aday2__}" ;;
    aday__*) cp "$f" "$OUT/aday/${name#aday__}" ;;
  esac
done < <(find "$OUT/maestro" -type f -name 'aday*__*.png' -print0)
echo "candidates: $(find "$OUT/aday" -name '*.png' | wc -l), again: $(find "$OUT/aday2" -name '*.png' | wc -l)"
# A failed assertScreenshot writes its diff (the differing areas boxed) beside the baseline,
# <name>_diff.png (Maestro 2.10.0, ScreenshotMatch); moved out of the checkout into maestro-fark/.
mkdir -p "$OUT/maestro-fark"
while IFS= read -r -d '' f; do
  name=$(basename "$f" _diff.png)
  mv "$f" "$OUT/maestro-fark/$name.png"
done < <(find e2e/visual/baz -maxdepth 1 -type f -name '*_diff.png' -print0 2>/dev/null)
exit "$status"
