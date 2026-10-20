#!/usr/bin/env bash
# TRIAL ONLY (claude/visual-trial): helpers for the trial scripts. Env: D (adb serial), OUT.
APP=app.kabuk.mobile

a() { adb -s "$D" "$@"; }

# Opens masa:///deneme?<query> in a fresh app process.
open_trial() {
  a shell am force-stop "$APP" || true
  a shell "am start -W -a android.intent.action.VIEW -d 'masa:///deneme?$1' $APP" > /dev/null
}

# Waits until the screen shows the resource id $1 (testID), at most $2 seconds.
wait_id() {
  local until=$((SECONDS + $2))
  while [ "$SECONDS" -lt "$until" ]; do
    if a exec-out uiautomator dump /dev/tty 2>/dev/null | grep -q "resource-id=\"$1\""; then return 0; fi
    sleep 2
  done
  echo "timeout waiting for $1 on $D" >&2
  return 1
}
