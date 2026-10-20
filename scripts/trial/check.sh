#!/usr/bin/env bash
# TRIAL ONLY (claude/visual-trial): correctness on the CI emulator, nothing about speed (it draws in
# software; speed and memory there say nothing about a phone). v46's cards with RN 0.86's own
# gradients and shadows, each photographed drawn and flat (the drawing check, report.ts → cizim),
# then the cards at 320 dp and font 1.3 (report.ts → narrow). Runs inside
# reactivecircus/android-emulator-runner. Env: APK, OUT.
set -euo pipefail
D=emulator-5554
# shellcheck source=common.sh
source "$(dirname "$0")/common.sh"
mkdir -p "$OUT"

# The phone's log over the whole job, for when something falls over.
a logcat -c || true
a logcat '*:W' > "$OUT/logcat.txt" 2>&1 &
a install -r -g "$APK"
# 360 dp at 2x, v46's prototype width (the skin is 720x1280).
a shell wm density 320
a shell settings put system font_scale 1.0
a shell settings put global hide_error_dialogs 1 || true
echo "display: $(a shell wm size | tr -d '\r') $(a shell wm density | tr -d '\r')" | tee "$OUT/display.txt"

# Each card alone at the top of the screen, drawn and flat: the screen and its layout (bounds).
for kart in tabu sahtekar masa; do
  for variant in golge duz; do
    query="bolum=tek&kart=$kart"
    id="deneme-tek-$kart"
    if [ "$variant" = duz ]; then query="$query&duz=1"; id="$id-duz"; fi
    open_trial "$query"
    wait_id "$id" 90
    sleep 3
    dismiss_anr
    a exec-out screencap -p > "$OUT/cizim-$kart-$variant.png"
    a exec-out uiautomator dump /dev/tty > "$OUT/cizim-$kart-$variant.xml" 2>/dev/null || true
  done
done

# 320 dp, font 1.3 (CLAUDE.md → Ekran davranışı): 640 px wide at 2x, 568 dp tall.
a shell wm size 640x1136
a shell settings put system font_scale 1.3
open_trial "bolum=kartlar"
wait_id deneme-kartlar 90
sleep 3
for p in 1 2 3 4; do
  dismiss_anr
  a exec-out screencap -p > "$OUT/kartlar-320-130-$p.png"
  a exec-out uiautomator dump /dev/tty > "$OUT/kartlar-320-130-$p.xml" 2>/dev/null || true
  a shell input swipe 320 900 320 300 400
  sleep 1.5
done
a shell wm size reset
a shell settings put system font_scale 1.0
