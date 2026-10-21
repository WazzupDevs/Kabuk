#!/usr/bin/env bash
# Sourced once the emulator has booted (scripts/e2e/run-on-emulator.sh, scripts/visual/
# run-on-emulator.sh): `warm_up_app` opens the app once before Maestro runs and presses "Wait" on
# any system "… isn't responding" dialog meanwhile.
#
# The callers' hide_error_dialogs setting does not always keep that dialog away: #111's run
# (322e92b) showed it over the phone screen just after the first flow opened the app, and the flow's
# first check failed. So before the flows the app is opened once, the way the first flow will, and
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
warm_up_app() {
  echo "opening the app once; pressing Wait on any \"isn't responding\" dialog for 20 s"
  adb shell monkey -p app.kabuk.mobile -c android.intent.category.LAUNCHER 1 > /dev/null || true
  press_wait_on_not_responding 15
  adb shell am force-stop app.kabuk.mobile || true
  adb shell input keyevent KEYCODE_HOME || true
  press_wait_on_not_responding 5
}
