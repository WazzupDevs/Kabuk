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
# Android's crash buffer: an app's Java or native crash with its stack (01c-gallery-wide's 320 press
# closed the app on two phones in 0.6.0). In the job's artifact and the screenshot branch.
adb logcat -b crash -d > "$OUT/logcat-crash.txt" 2>&1 || true
exit "$status"
