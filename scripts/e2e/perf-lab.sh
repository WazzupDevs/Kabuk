#!/usr/bin/env bash
# perf/trace branch only: the perf lab (app/perf.tsx) with each part turned off in turn, each for
# 15 s while its buddies float; Android's own frame statistics (dumpsys gfxinfo) per mode.
set -uo pipefail
mkdir -p "$OUT"
# shellcheck source=fetch-apk.sh
source "$(dirname "$0")/fetch-apk.sh"
adb install -r -g "$APK"
adb shell settings put global hide_error_dialogs 1 || true
MODES=("hepsi" "yerel" "golge" "cam" "golge,cam")
for round in 1 2; do
  for m in "${MODES[@]}"; do
    off=$m; [ "$m" = hepsi ] && off=""
    adb shell am force-stop app.kabuk.mobile
    adb shell am start -W -a android.intent.action.VIEW -d "masa:///perf?kapali=$off\&n=$round" app.kabuk.mobile > /dev/null
    sleep 10
    adb shell dumpsys gfxinfo app.kabuk.mobile reset > /dev/null
    sleep 15
    adb shell dumpsys gfxinfo app.kabuk.mobile > "$OUT/gfx-$round-${m//,/+}.txt"
    adb exec-out screencap -p > "$OUT/shot-$round-${m//,/+}.png" || true
  done
done
{
  echo "### Perf lab (emulator, swiftshader, 720x1280 @2x)"
  echo
  echo "| round | off | frames | p50 | p90 | gpu p50 | gpu p90 |"
  echo "|---|---|---|---|---|---|---|"
  for f in "$OUT"/gfx-*.txt; do
    b=$(basename "$f" .txt); r=${b#gfx-}; round=${r%%-*}; m=${r#*-}
    g() { grep -m1 "^$1" "$f" | sed 's/.*: //'; }
    echo "| $round | $m | $(g 'Total frames rendered') | $(g '50th percentile') | $(g '90th percentile') | $(g '50th gpu percentile') | $(g '90th gpu percentile') |"
  done
} > "$OUT/perf-report.md"
cat "$OUT/perf-report.md"
