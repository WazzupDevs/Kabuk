#!/usr/bin/env bash
# TRIAL ONLY (claude/visual-trial): scroll smoothness of the 20-card list with v46's shadows and
# gradients against the same list drawn flat, on a low-end emulator (2 cores, 3 GB, software GPU),
# then the cards at 320 dp and font 1.3. Runs inside reactivecircus/android-emulator-runner.
# Env: APK, OUT.
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
echo "display: $(a shell wm size | tr -d '\r') $(a shell wm density | tr -d '\r')" | tee "$OUT/display.txt"

# One pass: open the list, reset the frame stats, 10 flings down and 10 up, then the stats.
pass() {
  local variant=$1 n=$2 query="bolum=liste"
  [ "$variant" = duz ] && query="bolum=liste&duz=1"
  open_trial "$query"
  wait_id "deneme-liste$([ "$variant" = duz ] && echo -duz)" 90
  sleep 3
  a shell dumpsys gfxinfo "$APP" reset > /dev/null
  for _ in $(seq 10); do a shell input swipe 360 1100 360 250 220; sleep 0.7; done
  for _ in $(seq 10); do a shell input swipe 360 250 360 1100 220; sleep 0.7; done
  a shell dumpsys gfxinfo "$APP" > "$OUT/gfxinfo-$variant-$n.txt"
}
for n in 1 2 3; do
  pass golge "$n"
  pass duz "$n"
done
a exec-out screencap -p > "$OUT/liste-360.png"

# 360 dp, font 1.0: the reference look.
open_trial "bolum=kartlar"
wait_id deneme-kartlar 90
sleep 3
for p in 1 2 3; do
  a exec-out screencap -p > "$OUT/kartlar-360-$p.png"
  a exec-out uiautomator dump /dev/tty > "$OUT/kartlar-360-$p.xml" 2>/dev/null || true
  a shell input swipe 360 1000 360 400 400
  sleep 1.5
done

# 320 dp, font 1.3 (CLAUDE.md → Ekran davranışı): 640 px wide at 2x, 568 dp tall.
a shell wm size 640x1136
a shell settings put system font_scale 1.3
open_trial "bolum=kartlar"
wait_id deneme-kartlar 90
sleep 3
for p in 1 2 3 4; do
  a exec-out screencap -p > "$OUT/kartlar-320-130-$p.png"
  a exec-out uiautomator dump /dev/tty > "$OUT/kartlar-320-130-$p.xml" 2>/dev/null || true
  a shell input swipe 320 900 320 300 400
  sleep 1.5
done
a shell wm size reset
a shell settings put system font_scale 1.0
