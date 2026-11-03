#!/usr/bin/env bash
# Runs inside reactivecircus/android-emulator-runner once the emulator has booted.
# Env: SCHEME (light|dark), FONT_SCALE (Android's text size; 1 when unset, 1.3 in the nightly large
# pass), FLOW (the Maestro file; e2e/maestro/shard-<n>.yaml in CI, p0.yaml when
# unset), OUT (output directory), APK (path), INSIDE_LAT/INSIDE_LNG, OUTSIDE_LAT/OUTSIDE_LNG.
# Without the APK at $APK also GH_TOKEN (actions: read), GITHUB_API_URL, GITHUB_REPOSITORY and
# GITHUB_RUN_ID: the APK is this run's build job's e2e-apk artifact.
set -euo pipefail
mkdir -p "$OUT/screenshots" "$OUT/maestro"

# The shard jobs start together with the build job (.github/workflows/e2e.yml) and boot their
# emulator while it builds; the APK is fetched here, as soon as the build job has uploaded it.
# shellcheck source=fetch-apk.sh
source "$(dirname "$0")/fetch-apk.sh"

adb install -r -g "$APK"
if [ "$SCHEME" = dark ]; then adb shell cmd uimode night yes; else adb shell cmd uimode night no; fi
adb shell settings put system font_scale "${FONT_SCALE:-1}"
echo "font_scale $(adb shell settings get system font_scale | tr -d '\r')"
# A slow emulator can raise "Pixel Launcher isn't responding" over the app; hide system ANR dialogs.
adb shell settings put global hide_error_dialogs 1 || true

# shellcheck source=system-dialog.sh
source "$(dirname "$0")/system-dialog.sh"
warm_up_app

adb logcat -c
adb logcat '*:W' > "$OUT/logcat.txt" 2>&1 &
adb emu screenrecord start --time-limit 1800 "$OUT/video.webm" || true

status=0
# What Maestro prints is kept too: a driver it cannot reach shows there (scripts/e2e/retry.ts).
maestro test "${FLOW:-e2e/maestro/p0.yaml}" \
  --test-output-dir "$OUT/screenshots" \
  -e INSIDE_LAT="$INSIDE_LAT" -e INSIDE_LNG="$INSIDE_LNG" \
  -e OUTSIDE_LAT="$OUTSIDE_LAT" -e OUTSIDE_LNG="$OUTSIDE_LNG" \
  -e SCHEME="$SCHEME" \
  --format junit --output "$OUT/report.xml" \
  --debug-output "$OUT/maestro" 2>&1 | tee "$OUT/maestro-console.txt" || status=$?

adb emu screenrecord stop || true
# Android's crash buffer: an app's Java or native crash with its stack. In the job's artifact and
# the screenshot branch.
adb logcat -b crash -d > "$OUT/logcat-crash.txt" 2>&1 || true
# Why the app's processes ended (Android 11+): a crash, a native crash, an ANR, or the system's low
# memory killer, which no crash report sees.
adb shell dumpsys activity exit-info app.kabuk.mobile > "$OUT/exit-info.txt" 2>&1 || true
# A failed run writes its failing step into the job's log too: Maestro's console names the flow but
# not always the step, and the artifact is not always at hand.
if [ "$status" -ne 0 ]; then
  echo "::group::Failed step (Maestro debug output)"
  for f in "$OUT"/maestro/commands-*.json; do
    [ -f "$f" ] || continue
    jq -r --arg f "$(basename "$f")" '
      [.[] | {c: (.command | to_entries[0] | "\(.key) \(.value | tostring | .[0:160])"),
              s: .metadata.status, e: (.metadata.error.message // "")}] as $all
      | ($all | map(.s) | index("FAILED")) as $i
      | if $i == null then empty
        else "\($f)", ($all[([$i - 4, 0] | max):($i + 1)][] | "  \(.s) \(.c) \(.e)") end
    ' "$f" 2>/dev/null || true
  done
  echo "--- crash buffer"
  tail -n 40 "$OUT/logcat-crash.txt" 2>/dev/null || true
  echo "::endgroup::"
fi
exit "$status"
