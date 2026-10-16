#!/usr/bin/env bash
# Runs inside reactivecircus/android-emulator-runner once the emulator has booted.
# Env: SCHEME (light|dark), FLOW (the Maestro file; e2e/maestro/shard-<n>.yaml in CI, p0.yaml when
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
# A slow emulator can raise "Pixel Launcher isn't responding" over the app; hide system ANR dialogs.
adb shell settings put global hide_error_dialogs 1 || true
adb logcat -c
adb logcat '*:W' > "$OUT/logcat.txt" 2>&1 &
adb emu screenrecord start --time-limit 1800 "$OUT/video.webm" || true

status=0
maestro test "${FLOW:-e2e/maestro/p0.yaml}" \
  --test-output-dir "$OUT/screenshots" \
  -e INSIDE_LAT="$INSIDE_LAT" -e INSIDE_LNG="$INSIDE_LNG" \
  -e OUTSIDE_LAT="$OUTSIDE_LAT" -e OUTSIDE_LNG="$OUTSIDE_LNG" \
  -e SCHEME="$SCHEME" \
  --format junit --output "$OUT/report.xml" \
  --debug-output "$OUT/maestro" || status=$?

adb emu screenrecord stop || true
exit "$status"
