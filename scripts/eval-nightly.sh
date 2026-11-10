#!/usr/bin/env bash
#
# Run the jnk-eval nightly pass over recent sessions, unattended.
#
#   scripts/eval-nightly.sh            run the pass
#   scripts/eval-nightly.sh --dry-run  print the command, run nothing
#
# Meant to be run by cron or launchd a few times a week. It invokes the coding
# agent headless and asks it to run the jnk-eval beat in nightly mode: apply the
# safe edits itself, and write a report of the foundational changes for a
# human to approve (see skills/eval/SKILL.md, "The nightly pass").
#
# Environment:
#   JNK_AGENT       the headless agent command (default: omp). Any agent that
#                   takes a prompt and exits works: omp, pi, opencode, claude, codex.
#   JNK_AGENT_ARGS  extra flags for it (default: -p --cwd <this checkout> --max-time 1h)
#   JNK_EVAL_MODEL  optional model override
#   JNK_EVAL_DAYS   window of sessions to mine (default: 3)
#   JNK_STATE_DIR   where logs and reports go (default: ~/.local/state/jnk-skills)

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
AGENT_BIN="${JNK_AGENT:-omp}"
DAYS="${JNK_EVAL_DAYS:-3}"
STATE="${JNK_STATE_DIR:-$HOME/.local/state/jnk-skills}"
DRY=0
[ "${1:-}" = "--dry-run" ] && DRY=1

if ! command -v "$AGENT_BIN" >/dev/null 2>&1; then
  echo "eval-nightly: '$AGENT_BIN' not found on PATH (set JNK_AGENT)" >&2
  exit 127
fi

mkdir -p "$STATE"
stamp="$(date -u +%Y%m%d-%H%M%S)"
log="$STATE/eval-nightly-$stamp.log"
report="$STATE/eval-nightly-$stamp.md"

prompt="Run the jnk-eval beat, nightly pass. Mine the last $DAYS days of my sessions, across every \
recent project, for corrections I keep making (use your own session history; do not read other \
people's data). Apply the safe edits yourself: a typo, a wording fix, a missing example, a broken \
link, a clearer name, each held to the rubric's four tests. Do NOT apply anything foundational: a \
new or changed principle rule, a change to a skill's steps or contract, a gate or threshold change, \
or anything under tools/. Queue those in a report at $report, each with its evidence and why it \
crossed the line. Finish by printing the report path and a one-line summary."

read -r -a args <<< "${JNK_AGENT_ARGS:--p --cwd $HERE --max-time 1h}"
[ -n "${JNK_EVAL_MODEL:-}" ] && args+=(--model "$JNK_EVAL_MODEL")
args+=("$prompt")

if [ "$DRY" -eq 1 ]; then
  printf '%s' "$AGENT_BIN"
  printf ' %q' "${args[@]}"
  printf '\n'
  exit 0
fi

echo "eval-nightly: report  $report"
echo "eval-nightly: log     $log"
if "$AGENT_BIN" "${args[@]}" >"$log" 2>&1; then
  echo "eval-nightly: done"
else
  status=$?
  echo "eval-nightly: agent exited $status (see $log)" >&2
  exit "$status"
fi
