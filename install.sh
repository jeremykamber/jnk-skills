#!/usr/bin/env bash
# Install the jnk workflow's gate tooling on this machine.
#
#   ./install.sh              check what the tools need, then link them onto PATH
#   ./install.sh --no-deps    skip the dependency check
#   ./install.sh --dry-run    show what would change, change nothing
#   ./install.sh --help
#
# Safe to re-run. Existing symlinks are replaced; nothing is deleted.
#
# The tools live in ./tools and are vendored from the uncle-bob-workflow kit, so
# this checkout stands alone: clone it and the beats work. tools/VENDORED.md
# records where each file came from and tools/sync-from-kit.sh re-copies them
# when the kit is present and you want its newer versions.
#
# Between them the tools need one Python package: lizard, which reads the
# function metrics `depth` and `crap` score. Everything else is the standard
# library. The check below imports it rather than looking for a `lizard`
# command, because the tools run it as `python3 -m lizard` — a lizard installed
# in another interpreter, or by pipx, is not visible to them.
#
# What is deliberately not installed here: the project's own toolchain (tsc,
# vitest, oxlint, stryker, dependency-cruiser). Those belong to the project
# being worked on; `gates --init` writes their configs from ./templates.

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TOOLS="$HERE/tools"
BIN_DIR="${JNK_BIN_DIR:-$HOME/.local/bin}"
TOOL_NAMES=(gates crap depth mutate-changed)

DEPS=1
DRY=0
for arg in "$@"; do
  case "$arg" in
    --no-deps) DEPS=0 ;;
    --dry-run) DRY=1 ;;
    -h | --help)
      sed -n '2,12p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *)
      echo "unknown option: $arg" >&2
      exit 2
      ;;
  esac
done

run() {
  if [ "$DRY" -eq 1 ]; then
    echo "  would  $*"
  else
    "$@"
  fi
}

echo "workflow  $HERE"
echo "bin       $BIN_DIR"
echo

echo "tools"
for tool in "${TOOL_NAMES[@]}"; do
  [ -f "$TOOLS/$tool" ] || {
    echo "  missing  $TOOLS/$tool" >&2
    exit 2
  }
  run chmod +x "$TOOLS/$tool"
done
for tool in "${TOOL_NAMES[@]}"; do
  run mkdir -p "$BIN_DIR"
  run ln -sfn "$TOOLS/$tool" "$BIN_DIR/$tool"
  [ "$DRY" -eq 1 ] || echo "  linked   $tool -> $TOOLS/$tool"
done

case ":$PATH:" in
  *":$BIN_DIR:"*) ;;
  *) echo "  warning  $BIN_DIR is not on PATH; add it or set JNK_BIN_DIR" >&2 ;;
esac

if [ "$DEPS" -eq 1 ]; then
  echo
  echo "dependencies"
  if ! command -v python3 >/dev/null 2>&1; then
    echo "  MISSING  python3 — the tools are Python 3 scripts" >&2
    exit 1
  fi
  echo "  ok       python3 -> $(command -v python3)"
  if [ "$DRY" -eq 1 ]; then
    echo "  would  check that lizard imports"
  elif python3 -c 'import lizard' >/dev/null 2>&1; then
    echo "  ok       lizard imports"
  else
    echo "  lizard is missing; the metrics gates cannot run without it."
    echo "  installing it for $(command -v python3):"
    if python3 -m pip install --user lizard; then
      python3 -c 'import lizard' >/dev/null 2>&1 && echo "  ok       lizard imports"
    else
      echo
      echo "  could not install lizard automatically. Install it into the same" >&2
      echo "  interpreter that runs the tools, then re-run this script:" >&2
      echo "    $(command -v python3) -m pip install --user lizard" >&2
      echo "  A virtualenv that the project already uses works too:" >&2
      echo "    $(command -v python3) -m venv .venv && .venv/bin/pip install lizard" >&2
      exit 1
    fi
  fi
fi

echo
echo "check"
if [ "$DRY" -eq 1 ]; then
  echo "  would  check that the tools resolve on PATH"
else
  for tool in "${TOOL_NAMES[@]}"; do
    if command -v "$tool" >/dev/null 2>&1; then
      echo "  ok       $tool -> $(command -v "$tool")"
    else
      echo "  MISSING  $tool — the beats cannot verify without it" >&2
      exit 1
    fi
  done
fi

echo
echo "next"
echo "  ./setup.sh                    link the skills into your agent too"
echo "  ./tools/gates                 the workflow's own stack: it verifies these tools"
echo "  cd <project> && gates --init  a project's stack, plus the configs it declares"
