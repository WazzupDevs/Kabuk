#!/usr/bin/env bash
# This run's APK at $APK, for a job that starts with the build job (.github/workflows/e2e.yml: the
# E2E shards, the visual gate) and boots its emulator while Gradle builds: sourced by
# scripts/e2e/run-on-emulator.sh and scripts/visual/run-on-emulator.sh once the emulator is up.
# Env: APK; without the file also GH_TOKEN (actions: read), GITHUB_API_URL, GITHUB_REPOSITORY and
# GITHUB_RUN_ID: the APK is this run's build job's e2e-apk artifact.
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
