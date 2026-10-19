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
if [ ! -f "$APK" ]; then
  api="$GITHUB_API_URL/repos/$GITHUB_REPOSITORY/actions/runs/$GITHUB_RUN_ID"
  auth=(-H "Authorization: Bearer $GH_TOKEN" -H "Accept: application/vnd.github+json")
  # Reads one value from the JSON on stdin.
  pick() { node -e "let s = ''; process.stdin.on('data', (d) => (s += d)).on('end', () => console.log(($1)(JSON.parse(s)) ?? ''))"; }
  deadline=$((SECONDS + 1500))
  url=""
  until [ -n "$url" ]; do
    url=$(curl -sf "${auth[@]}" "$api/artifacts?name=e2e-apk" |
      pick '(r) => r.artifacts.find((a) => !a.expired)?.archive_download_url' || true)
    [ -n "$url" ] && break
    build=$(curl -sf "${auth[@]}" "$api/jobs?per_page=100" |
      pick '(r) => r.jobs.find((j) => j.name === "build" && j.status === "completed")?.conclusion' ||
      true)
    if [ -n "$build" ] && [ "$build" != success ]; then
      echo "build job: $build; no APK"
      exit 1
    fi
    if [ "$SECONDS" -ge "$deadline" ]; then
      echo "no e2e-apk artifact after 25 minutes"
      exit 1
    fi
    sleep 15
  done
  echo "APK artifact ready ${SECONDS} s into this script"
  mkdir -p "$(dirname "$APK")"
  # The API answers with a redirect to signed storage; curl does not send the token on to it.
  curl -sfL "${auth[@]}" -o "$APK.zip" "$url"
  unzip -o -q "$APK.zip" -d "$(dirname "$APK")"
fi
test -f "$APK"

adb install -r -g "$APK"
if [ "$SCHEME" = dark ]; then adb shell cmd uimode night yes; else adb shell cmd uimode night no; fi
adb shell settings put system font_scale "${FONT_SCALE:-1}"
echo "font_scale $(adb shell settings get system font_scale | tr -d '\r')"
# A slow emulator can raise "Pixel Launcher isn't responding" over the app; hide system ANR dialogs.
adb shell settings put global hide_error_dialogs 1 || true

# The setting does not always keep that dialog away: #111's run (322e92b) showed it over the phone
# screen just after the first flow opened the app, and the flow's first check failed. So before the
# flows the app is opened once, the way the first flow will (it clears the app's state anyway), and
# for a while every such dialog gets "Wait"; then the app is closed. Maestro is not running yet, so
# uiautomator is free to read the screen.
wait_button_center() {
  # The centre of the dialog's "Wait" button in a uiautomator dump on stdin, or nothing.
  grep -oE '(resource-id="android:id/aerr_wait"|text="Wait")[^>]*bounds="\[[0-9]+,[0-9]+\]\[[0-9]+,[0-9]+\]"' |
    head -n 1 | grep -oE '\[[0-9]+,[0-9]+\]\[[0-9]+,[0-9]+\]' |
    { read -r b && read -r x1 y1 x2 y2 <<<"${b//[^0-9]/ }" && echo "$(((x1 + x2) / 2)) $(((y1 + y2) / 2))"; } || true
}
press_wait_on_not_responding() {
  local until=$((SECONDS + $1)) at
  while [ "$SECONDS" -lt "$until" ]; do
    at=$(adb exec-out uiautomator dump /dev/tty 2>/dev/null | wait_button_center || true)
    if [ -n "$at" ]; then
      echo "system dialog \"… isn't responding\": pressing Wait"
      adb shell input tap $at || true
    fi
    sleep 2
  done
}
echo "opening the app once; pressing Wait on any \"isn't responding\" dialog for 20 s"
adb shell monkey -p app.kabuk.mobile -c android.intent.category.LAUNCHER 1 > /dev/null || true
press_wait_on_not_responding 15
adb shell am force-stop app.kabuk.mobile || true
adb shell input keyevent KEYCODE_HOME || true
press_wait_on_not_responding 5

adb logcat -c
adb logcat '*:W' > "$OUT/logcat.txt" 2>&1 &
adb emu screenrecord start --time-limit 1800 "$OUT/video.webm" || true

status=0
# TEST ONLY (#164; reverted before merge): Maestro's driver stopped mid-flow in light-2's first
# attempt, to see the retry in CI.
if [ "$SCHEME" = light ] && [ "${FONT_SCALE:-1}" = 1 ] && [ "${FLOW:-}" = e2e/maestro/shard-2.yaml ] &&
  [ ! -d "$OUT/attempt-1" ]; then
  (
    sleep 90
    for _ in 1 2 3 4 5 6; do
      echo "TEST: adb shell am force-stop dev.mobile.maestro"
      adb shell am force-stop dev.mobile.maestro || true
      sleep 5
    done
  ) &
fi
# What Maestro prints is kept too: a driver it cannot reach shows there (scripts/e2e/retry.ts).
maestro test "${FLOW:-e2e/maestro/p0.yaml}" \
  --test-output-dir "$OUT/screenshots" \
  -e INSIDE_LAT="$INSIDE_LAT" -e INSIDE_LNG="$INSIDE_LNG" \
  -e OUTSIDE_LAT="$OUTSIDE_LAT" -e OUTSIDE_LNG="$OUTSIDE_LNG" \
  -e SCHEME="$SCHEME" \
  --format junit --output "$OUT/report.xml" \
  --debug-output "$OUT/maestro" 2>&1 | tee "$OUT/maestro-console.txt" || status=$?

adb emu screenrecord stop || true
exit "$status"
