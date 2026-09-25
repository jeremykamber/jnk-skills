#!/usr/bin/env bash
#
# Set up the jnk workflow on this machine.
#
#   ./setup.sh                    tools and skills onto PATH and into the agent
#   ./setup.sh --project <dir>    also stand up a project's gate stack in <dir>
#   ./setup.sh --dry-run          show what would change, change nothing
#
# Safe to re-run. Existing symlinks are replaced; nothing is deleted.
#
# The gate tooling — the `gates` runner, the `crap` metric, and the two
# configs the arch and mutation gates read — comes from the uncle-bob-workflow
# kit. This script finds it and runs its installer. It deliberately does not
# carry its own copy of any of that: two copies of a gate drift silently, the
# same way a copied principle list does, and nothing catches it.

set -euo pipefail

WF="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIRS=("$HOME/.agents/skills" "$HOME/.pi/agent/skills")

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

find_kit() {
  if [ -n "${KIT:-}" ]; then
    # An explicit KIT is an instruction, not a hint: report it rather than
    # silently falling back to a different kit than the one asked for.
    if [ -x "${KIT}/install.sh" ]; then
      printf '%s\n' "$KIT"
      return
    fi
    echo "KIT is set to ${KIT}, which has no install.sh" >&2
    exit 2
  fi
  for candidate in \
    "$(dirname "$WF")/uncle-bob-workflow" \
    "$HOME/Developer/workflows/uncle-bob-workflow"; do
    if [ -x "$candidate/install.sh" ]; then
      printf '%s\n' "$candidate"
      return
    fi
  done
  printf '\n'
}

KIT="$(find_kit)"
if [ -z "$KIT" ]; then
  echo "cannot find the uncle-bob-workflow kit." >&2
  echo "It owns the gate tooling: set KIT=/path/to/uncle-bob-workflow and re-run." >&2
  exit 2
fi

echo "workflow  $WF"
echo "kit       $KIT"
echo "skills    ${SKILL_DIRS[*]}"
echo

echo "tools and kit skills"
if [ "$DRY" -eq 1 ]; then
  echo "  would  $KIT/install.sh"
else
  "$KIT/install.sh"
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
    echo "  would  (cd $PROJECT && gates --init)"
    echo "  would  cp $WF/templates/gates.json $PROJECT/"
  else
    (cd "$PROJECT" && gates --init)
    if [ -f "$PROJECT/gates.json" ] && [ "$(cd "$PROJECT" && grep -c '"acceptance"' gates.json || true)" = "0" ]; then
      cp "$WF/templates/gates.json" "$PROJECT/gates.json"
      echo "  put    the workflow stack in place (acceptance, coverage, build, e2e)"
    fi
  fi
fi

echo
echo "next"
echo "  cd <project>"
echo "  gates --init                            # the stack and its config files"
echo "  cp $WF/templates/gates.json .           # optional: the fuller workflow stack"
echo "  gates --list                            # the stack, and anything missing"
