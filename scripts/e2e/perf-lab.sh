#!/usr/bin/env bash
# perf/mount branch only: the mount lab (app/perf.tsx) puts a DM's 50 bubbles on the screen again
# and again, each part of a bubble left out in turn; its log lines give the time per variant.
set -uo pipefail
mkdir -p "$OUT"
# shellcheck source=fetch-apk.sh
source "$(dirname "$0")/fetch-apk.sh"
adb install -r -g "$APK"
adb shell settings put global hide_error_dialogs 1 || true
# shellcheck source=system-dialog.sh
source "$(dirname "$0")/system-dialog.sh"
warm_up_app
for round in 1 2; do
  adb logcat -c
  adb shell am force-stop app.kabuk.mobile
  adb shell am start -W -a android.intent.action.VIEW -d "masa:///perf" app.kabuk.mobile > /dev/null
  press_wait_on_not_responding 10
  adb shell dumpsys gfxinfo app.kabuk.mobile reset > /dev/null
  for _ in $(seq 1 60); do
    adb logcat -d -s ReactNativeJS | grep -q 'PERFMOUNT done' && break
    sleep 5
  done
  adb logcat -d -s ReactNativeJS > "$OUT/mount-$round.txt"
  adb shell dumpsys gfxinfo app.kabuk.mobile > "$OUT/gfx-$round.txt"
  adb exec-out screencap -p > "$OUT/shot-$round.png" || true
done
python3 - "$OUT" > "$OUT/perf-report.md" <<'EOF'
import json, re, sys, glob, statistics
rows = {}
for f in sorted(glob.glob(sys.argv[1] + '/mount-*.txt')):
    for line in open(f, errors='replace'):
        m = re.search(r'PERFMOUNT (\{.*\})', line)
        if not m:
            continue
        r = json.loads(m.group(1))
        if r['rep'] == 0:
            continue
        rows.setdefault(r['v'], []).append(r)
print('### Mount lab (emulator, 50 DM bubbles; reps after the first)')
print()
print('| variant | n | ms median | ms min | longest frame gap median |')
print('|---|---|---|---|---|')
for v, rs in rows.items():
    ms = [r['ms'] for r in rs]
    gap = [r['gap'] for r in rs]
    print(f"| {v} | {len(rs)} | {statistics.median(ms):.0f} | {min(ms)} | {statistics.median(gap):.0f} |")
EOF
cat "$OUT/perf-report.md"
