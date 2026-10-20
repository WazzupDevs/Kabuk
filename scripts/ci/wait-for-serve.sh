#!/usr/bin/env bash
# Waits for the serve scripts/ci/functions-serve.sh started (ci.yml, e2e.yml): this run of the CLI
# says "Serving functions on" with its container up ($SERVE_STATE/<name>.ready) and `ping` answers
# through Kong. `ping` alone is not enough: until 20 Oct `supabase start` ran an edge runtime of
# its own, which answered it in a second while the serve was still starting
# (docs/decisions/ci-functions-serve.md → Hazırlık). Fails at once when the serve script has
# stopped (it gave up, or another edge runtime runs), with the log's last lines.
#
# Usage: wait-for-serve.sh <name> <log file> <publishable key> [seconds, default 180]
# Env: SERVE_STATE (the directory functions-serve.sh writes to)
set -uo pipefail
name=$1
log=$2
key=$3
limit=${4:-180}
start=$SECONDS
fail() {
  echo "functions serve ($name): $1"
  tail -n 40 "$log"
  exit 1
}
while [ $((SECONDS - start)) -lt "$limit" ]; do
  pid=$(cat "$SERVE_STATE/$name.pid" 2> /dev/null)
  if [ -n "$pid" ] && ! kill -0 "$pid" 2> /dev/null; then fail "the serve script has stopped"; fi
  if [ -e "$SERVE_STATE/$name.ready" ] &&
    curl -sf -X POST http://127.0.0.1:54321/functions/v1/ping -H "apikey: $key" \
      -H 'content-type: application/json' -d '{}' > /dev/null; then
    echo "functions serve ($name) ready after $((SECONDS - start)) s"
    exit 0
  fi
  sleep 1
done
fail "not ready after $limit s"
