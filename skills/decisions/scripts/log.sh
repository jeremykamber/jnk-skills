#!/usr/bin/env bash
# Append one row to a decision log.
#
#   log.sh <logfile> <phase> <decision> <why> <evidence> <result>
#
# Writes the header on first use, stamps the timestamp, and keeps every cell on
# one line. See skills/decisions/SKILL.md for the column meanings.

set -euo pipefail

if [ $# -ne 6 ]; then
  echo "usage: log.sh <logfile> <phase> <decision> <why> <evidence> <result>" >&2
  exit 2
fi

log="$1"

# One line per cell: collapse newlines and tabs, and stop a leading
# spreadsheet-significant byte from turning into a formula.
clean() {
  printf '%s' "$1" | tr '\n\t' '  ' | sed -E "s/^([=+@-])/'\\1/"
}

ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

if [ ! -s "$log" ]; then
  printf 'ts\tphase\tdecision\twhy\tevidence\tresult\n' > "$log"
fi

printf '%s\t%s\t%s\t%s\t%s\t%s\n' \
  "$ts" "$(clean "$2")" "$(clean "$3")" "$(clean "$4")" "$(clean "$5")" "$(clean "$6")" >> "$log"
