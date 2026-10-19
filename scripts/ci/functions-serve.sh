#!/usr/bin/env bash
# `supabase functions serve` for the integration job (.github/workflows/ci.yml), started again when
# it stops on its own: at most twice in the whole job. A third stop gives up and stops the test run,
# so the job fails instead of running on without functions. On 18 and 19 Oct the serve's container
# died ("error running container: exit 135", SIGBUS) seconds after it started and never came back:
# every later call got Kong's 503 "name resolution failed" (supabase/tests/refusal.ts →
# `no-runtime`; the tests wait for `ping` and send the call again).
#
# Two ways to stop: the CLI exits (as on 18 and 19 Oct), or its container dies while the CLI hangs
# on (a container killed from outside, tried locally: exit 137, the CLI never exits). So the
# container is watched too, and the CLI stopped when its container has died.
#
# The restart must not hide the cause. Every stop is written, with its time, to
# $SERVE_STATE/restarts.log (the job summary and a warning read it), and the machine's state at
# that moment (disk, /dev/shm, memory, docker stats, the container's state, the serve's last lines)
# to $SERVE_STATE/crash-<n>.txt (the functions-logs artifact).
#
# A deliberate stop (the CHECKIN_SKIP_LOCATION step) touches $SERVE_STATE/<name>.stop before
# stopping the serve: no restart, nothing written.
#
# Usage: functions-serve.sh <name> <log file> [serve options…]   Env: SERVE_STATE (a directory)
set -uo pipefail
name=$1
log=$2
shift 2
max_restarts=2
mkdir -p "$SERVE_STATE"
rm -f "$SERVE_STATE/$name.stop"
echo $$ > "$SERVE_STATE/$name.pid"
touch "$SERVE_STATE/restarts.log"
: > "$log"

stopping() { [ -e "$SERVE_STATE/$name.stop" ]; }
# The edge runtime container's status and exit code ("running 0", "exited 135"), or nothing.
container() {
  docker ps -a --filter name=supabase_edge_runtime --format '{{.ID}}' | head -n 1 |
    xargs -r docker inspect --format '{{.State.Status}} {{.State.ExitCode}}' 2> /dev/null
}

while true; do
  from=$(wc -l < "$log")
  # Its own process group, so the CLI and its children stop together.
  setsid pnpm supabase functions serve "$@" >> "$log" 2>&1 &
  cli=$!
  seen=false
  died=""
  while kill -0 "$cli" 2> /dev/null; do
    state=$(container)
    if [ "${state%% *}" = running ]; then
      seen=true
    elif $seen && ! stopping; then
      died="container ${state:-gone}"
      kill -TERM -- "-$cli" 2> /dev/null
      break
    fi
    sleep 2
  done
  wait "$cli"
  code=$?
  if stopping; then exit 0; fi

  at=$(date -u +%H:%M:%S)
  exits=$(wc -l < "$SERVE_STATE/restarts.log")
  n=$((exits + 1))
  # What this run of the CLI said last ("error running container: exit 135"), else the container's
  # state, else the CLI's exit code.
  why=$(tail -n +"$((from + 1))" "$log" | grep -o 'error running container: exit [0-9]*' | tail -n 1)
  why=${why:-${died:-"supabase CLI exit $code"}}
  {
    echo "# $name: functions serve stopped at $at UTC ($why), stop $n of the job"
    echo
    echo "## df -h"
    df -h
    echo
    echo "## /dev/shm"
    df -h /dev/shm
    sudo -n du -sh /dev/shm 2>&1
    ls -la /dev/shm 2>&1 | head -n 40
    echo
    echo "## free -m"
    free -m
    echo
    echo "## docker stats --no-stream --all"
    timeout 30 docker stats --no-stream --all 2>&1
    echo
    echo "## docker ps -a"
    docker ps -a --format '{{.Names}}\t{{.Status}}\t{{.Size}}' 2>&1
    echo
    echo "## edge runtime container state"
    for c in $(docker ps -aq --filter name=supabase_edge_runtime); do
      docker inspect --format '{{.Name}} {{json .State}} ShmSize={{.HostConfig.ShmSize}}' "$c" 2>&1
    done
    echo
    echo "## dmesg (last 40 lines)"
    sudo -n dmesg 2>&1 | tail -n 40
    echo
    echo "## the serve's last 60 lines"
    tail -n 60 "$log"
  } > "$SERVE_STATE/crash-$n.txt" 2>&1

  if [ "$exits" -ge "$max_restarts" ]; then
    printf '%s\t%s\t%s\t%s\n' "$at" "$name" "$why" gave-up >> "$SERVE_STATE/restarts.log"
    echo "[functions-serve.sh] $at: stopped again ($why), stop $n: giving up, stopping the tests" >> "$log"
    pkill -f vitest || true
    exit 1
  fi
  printf '%s\t%s\t%s\t%s\n' "$at" "$name" "$why" restarted >> "$SERVE_STATE/restarts.log"
  echo "[functions-serve.sh] $at: stopped ($why), starting it again ($n of $max_restarts)" >> "$log"
done
