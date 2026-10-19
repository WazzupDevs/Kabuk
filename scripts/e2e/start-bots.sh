#!/usr/bin/env bash
# The E2E venues and the two bot tables on the local stack (.github/workflows/e2e.yml), before a
# shard's flows and again before its retry: `setup` deletes the test accounts and sets up the
# venues (its output, setup.json, has the check-in coordinates), then the bots listen for Maestro
# in the background: 8787, and 8788 for 13-teams (another account). Their process ids go to
# $OUT/bots.pid, for the retry to stop them. Env: OUT.
set -euo pipefail
node --experimental-strip-types scripts/e2e/bot-table.ts setup > "$OUT/setup.json"
nohup node --experimental-strip-types scripts/e2e/bot-table.ts serve > "$OUT/bot.log" 2>&1 &
echo $! > "$OUT/bots.pid"
BOT_PORT=8788 BOT_PHONE=+905550000004 BOT_NAME="Bot Üç" \
  nohup node --experimental-strip-types scripts/e2e/bot-table.ts serve > "$OUT/bot2.log" 2>&1 &
echo $! >> "$OUT/bots.pid"
