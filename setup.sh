#!/usr/bin/env bash
#
# Set up the jnk workflow on this machine.
#
#   ./setup.sh                    tools, skills, and the global rules onto the machine
#   ./setup.sh --project <dir>    also stand up a project: its gate stack and its AGENTS.md
#   ./setup.sh --dry-run          show what would change, change nothing
#
# Safe to re-run. Existing symlinks are replaced; nothing is deleted.
#
# The gate tooling — the `gates` runner, the `crap` metric, `depth`, and the
# configs the arch and mutation gates read — is vendored in ./tools and
# ./templates, so this checkout stands alone: clone it, run this script, and the
# beats work. The uncle-bob-workflow kit is where those files are developed;
# ./tools/VENDORED.md records the version this copy came from, and
# ./tools/sync-from-kit.sh moves the copy forward when the kit is present.

set -euo pipefail

WF="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIRS=("$HOME/.agents/skills" "$HOME/.pi/agent/skills")
# Where the machine reads its global agent rules from: the universal AGENTS.md
# is linked here so every session, in every repo, loads it.
RULE_DIRS=("$HOME/.agents")

DRY=0
PROJECT=""

while [ $# -gt 0 ]; do
  case "$1" in
    --dry-run) DRY=1 ;;
    --project)
      shift
      PROJECT="${1:-}"
      if [ -z "$PROJECT" ]; then
        echo "--project needs a directory" >&2
        exit 2
      fi
      ;;
    -h | --help)
      sed -n '3,10p' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *)
      echo "unknown option: $1  (try --help)" >&2
      exit 2
      ;;
  esac
  shift
done

run() {
  if [ "$DRY" -eq 1 ]; then
    echo "  would  $*"
  else
    "$@"
  fi
}

echo "workflow  $WF"
echo "skills    ${SKILL_DIRS[*]}"
echo

echo "tools"
if [ "$DRY" -eq 1 ]; then
  echo "  would  $WF/install.sh --dry-run"
else
  "$WF/install.sh"
fi

echo
echo "workflow skills"
shopt -s nullglob
count=0
for skill_path in "$WF"/skills/*/ "$WF"/skills/*/*/; do
  [ -f "${skill_path}SKILL.md" ] || continue
  name="$(basename "${skill_path%/}")"
  for dir in "${SKILL_DIRS[@]}"; do
    # Only install into agent dirs that already exist: creating them would
    # invent a config for an agent the user does not run.
    if [ -d "$dir" ]; then
      run ln -sfn "${skill_path%/}" "$dir/$name"
    fi
  done
  count=$((count + 1))
  echo "  ${name}"
done

if [ "$count" -eq 0 ]; then
  echo "  (no skills found — is this the workflow checkout?)" >&2
  exit 1
fi

echo
echo "global rules"
for dir in "${RULE_DIRS[@]}"; do
  # Only install into an agent dir that already exists, and only where this
  # user can write: a root-owned ~/.agents needs one privileged run, and
  # failing here would abort the rest of setup for no reason.
  [ -d "$dir" ] || continue
  if [ ! -w "$dir" ]; then
    echo "  skip     $dir/AGENTS.md — $dir is not writable; run once with sudo to link it" >&2
    continue
  fi
  run ln -sfn "$WF/AGENTS.md" "$dir/AGENTS.md"
  [ "$DRY" -eq 1 ] || echo "  linked   $dir/AGENTS.md"
done

echo
echo "check"
if [ "$DRY" -eq 1 ]; then
  echo "  would  check that gates and crap resolve"
else
  for tool in gates crap; do
    if command -v "$tool" >/dev/null 2>&1; then
      echo "  ok     $tool -> $(command -v "$tool")"
    else
      echo "  MISSING  $tool — the beats cannot verify without it" >&2
      exit 1
    fi
  done
  case ":$PATH:" in
    *":$HOME/.local/bin:"*) ;;
    *) echo "  note   $HOME/.local/bin is not on your PATH in this shell" ;;
  esac
fi

# A project's stack: the kit's adapter, its config files, then this workflow's
# fuller stack on top.
if [ -n "$PROJECT" ]; then
  if [ ! -d "$PROJECT" ]; then
    echo
    echo "--project $PROJECT is not a directory" >&2
    exit 2
  fi
  echo
  echo "project   $PROJECT"
  if [ "$DRY" -eq 1 ]; then
    echo "  would  (cd $PROJECT && $WF/tools/gates --init)"
    echo "  would  cp $WF/templates/gates.json $PROJECT/"
  else
    (cd "$PROJECT" && "$WF/tools/gates" --init)
    if [ -f "$PROJECT/gates.json" ] && [ "$(cd "$PROJECT" && grep -c '"acceptance"' gates.json || true)" = "0" ]; then
      cp "$WF/templates/gates.json" "$PROJECT/gates.json"
      echo "  put    the workflow stack in place (acceptance, coverage, build, e2e)"
    fi
  fi
  # The project's own AGENTS.md: only the facts the global rules do not carry.
  if [ -f "$PROJECT/AGENTS.md" ]; then
    echo "  keep   $PROJECT/AGENTS.md (already there)"
  else
    run cp "$WF/templates/project-agents.md" "$PROJECT/AGENTS.md"
    [ "$DRY" -eq 1 ] || echo "  wrote  $PROJECT/AGENTS.md — fill in the EDIT ME lines"
  fi
fi

echo
echo "next"
echo "  cd <project>"
echo "  gates --init                            # the stack and its config files"
echo "  cp $WF/templates/gates.json .           # optional: the fuller workflow stack"
echo "  gates --list                            # the stack, and anything missing"
echo "  edit AGENTS.md                          # the project's facts (the EDIT ME lines)"
