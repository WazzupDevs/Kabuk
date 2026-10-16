#!/usr/bin/env bash
# Installs Android SDK packages, with retries. Google's download server sometimes hands sdkmanager a
# broken archive ("Error on ZipFile unknown archive", "Archive is not a ZIP archive"); on 16 Oct it
# broke the emulator and the system image in the e2e jobs and the NDK in build. A second try passes.
#
#   bash scripts/e2e/sdk-install.sh <package>...
set -euo pipefail

sdkmanager="$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager"
yes | "$sdkmanager" --licenses > /dev/null || true
for attempt in 1 2 3 4; do
  if "$sdkmanager" --install "$@" --channel=0 > /dev/null; then
    exit 0
  fi
  echo "sdkmanager failed (attempt $attempt of 4): $*"
  if [ "$attempt" -lt 4 ]; then sleep $((attempt * 15)); fi
done
exit 1
