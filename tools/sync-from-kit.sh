#!/usr/bin/env bash
# Keep this checkout's copy of the gate tooling honest.
#
#   ./tools/sync-from-kit.sh              check: report drift, change nothing
#   ./tools/sync-from-kit.sh --sync       copy the kit's current files in, re-record the manifest
#   ./tools/sync-from-kit.sh --record     accept what is here as the copy, re-record the manifest
#   ./tools/sync-from-kit.sh --dry-run    with --sync: show what would be copied
#
# --record is for a fix made in this checkout that has not reached the kit yet.
# It stops the check reporting the same deliberate edit forever; it does not make
# the two copies agree, so the fix still belongs upstream.
#
# The tools in ./tools, their test suite in ./checks, and the gate configs in
# ./templates are vendored from the uncle-bob-workflow kit, so this checkout
# stands alone. A copy that drifts silently is the failure mode the workflow
# warns about everywhere else, so the copy carries the version it came from:
# tools/vendored.sha256 records a hash per file at the moment of the last sync.
#
# The check reports two different things, because they need different answers:
#
#   edited here   the file no longer matches the recorded hash. Either this
#                 checkout is the newer one — a fix made here, which belongs in
#                 the kit too — or something changed the tool without saying so.
#                 This fails the gate: it is the silent drift the manifest exists
#                 to catch, and `--record` is how a deliberate fix is accepted.
#   kit moved on  the kit's copy differs from this one. Reported, never failed:
#                 a sibling checkout being behind is not this repository's
#                 defect, and a gate that goes red because someone else's clone
#                 is stale is a gate people learn to skip.
#
# With no kit on the machine the check still works: it compares the files
# against the manifest, which is what a fresh clone can prove on its own.
#
# Exit 0 in sync, 1 on drift, 2 on a usage or setup error. It is wired into
# gates.json as the `vendored` gate, so the workflow's own stack enforces it.

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WF="$(dirname "$HERE")"
MANIFEST="$HERE/vendored.sha256"

# What is vendored. gates.json and templates/gates.json are deliberately not
# here: both are this workflow's own — its own stack, and the stack it hands to a
# project — and neither is a copy of anything in the kit.
VENDORED=(
  tools
  checks
  templates/dependency-cruiser.cjs
  templates/stryker.conf.cjs
  templates/stryker-vitest-runner.mjs
)

SYNC=0
RECORD=0
DRY=0
for arg in "$@"; do
  case "$arg" in
    --sync) SYNC=1 ;;
    --record) RECORD=1 ;;
    --dry-run) DRY=1 ;;
    -h | --help)
      sed -n '2,25p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *)
      echo "unknown option: $arg" >&2
      exit 2
      ;;
  esac
done

hash_cmd() {
  if command -v shasum >/dev/null 2>&1; then
    shasum -a 256
  elif command -v sha256sum >/dev/null 2>&1; then
    sha256sum
  else
    echo "no shasum or sha256sum on this machine" >&2
    exit 2
  fi
}

# Every vendored file, relative to the checkout root, sorted. __pycache__ and
# .DS_Store are byproducts, not content; the three files below are this
# workflow's own and have no counterpart in the kit.
list_files() {
  (cd "$WF" && find "${VENDORED[@]}" -type f \
    ! -path '*__pycache__*' ! -name '.DS_Store' \
    ! -name 'sync-from-kit.sh' ! -name 'VENDORED.md' ! -name 'vendored.sha256' \
    ! -path 'tools/bench' ! -path './tools/bench' | sort)
  # `tools/bench` is this workflow's own: the kit has no benchmark, and claiming
  # it was copied would make the manifest a lie the next sync acts on.
}

find_kit() {
  if [ -n "${KIT:-}" ]; then
    [ -d "$KIT/tools" ] && {
      printf '%s\n' "$KIT"
      return
    }
    echo "KIT is set to $KIT, which has no tools directory" >&2
    exit 2
  fi
  for candidate in \
    "$(dirname "$WF")/uncle-bob-workflow" \
    "$HOME/Developer/workflows/uncle-bob-workflow"; do
    if [ -d "$candidate/tools" ] && [ -f "$candidate/tools/depth" ]; then
      printf '%s\n' "$candidate"
      return
    fi
  done
  printf '\n'
}

record_manifest() {
  (cd "$WF" && list_files | while read -r path; do hash_cmd <"$path" | awk -v p="$path" '{print $1"  "p}'; done) \
    >"$MANIFEST"
}

KIT="$(find_kit)"

if [ "$RECORD" -eq 1 ]; then
  record_manifest
  echo "recorded  tools/vendored.sha256  ($(grep -c . "$MANIFEST") files)"
  echo "note      a fix recorded this way still belongs in the kit"
  exit 0
fi

if [ "$SYNC" -eq 1 ]; then
  if [ -z "$KIT" ]; then
    echo "no kit found; set KIT=/path/to/uncle-bob-workflow to sync from it" >&2
    exit 2
  fi
  echo "kit       $KIT"
  echo "workflow  $WF"
  echo
  echo "copying"
  for path in "${VENDORED[@]}"; do
    if [ "$DRY" -eq 1 ]; then
      echo "  would  $path"
      continue
    fi
    if [ -d "$WF/$path" ]; then
      rsync -a --delete --exclude '__pycache__' --exclude '.DS_Store' \
        --exclude 'sync-from-kit.sh' --exclude 'VENDORED.md' --exclude 'vendored.sha256' \
        "$KIT/$path/" "$WF/$path/"
    else
      rsync -a "$KIT/$path" "$WF/$path"
    fi
    echo "  copied $path"
  done
  if [ "$DRY" -eq 1 ]; then
    echo
    echo "  would  record the new hashes in tools/vendored.sha256"
    exit 0
  fi
  record_manifest
  chmod +x "$HERE/gates" "$HERE/crap" "$HERE/depth" "$HERE/sync-from-kit.sh"
  echo
  echo "recorded  tools/vendored.sha256"
  exit 0
fi

# --- check -------------------------------------------------------------------
if [ ! -f "$MANIFEST" ]; then
  echo "no tools/vendored.sha256 — run --sync once to record what is here" >&2
  exit 2
fi

edited=0
behind=0
missing=0
count=0

while IFS= read -r path; do
  [ -n "$path" ] || continue
  count=$((count + 1))
  recorded="$(awk -v p="$path" '$2 == p {print $1}' "$MANIFEST")"
  current="$(hash_cmd <"$WF/$path" | awk '{print $1}')"
  if [ -z "$recorded" ]; then
    echo "  new here    $path (not in the manifest)"
    edited=$((edited + 1))
  elif [ "$recorded" != "$current" ]; then
    echo "  edited here $path"
    edited=$((edited + 1))
  fi
  if [ -n "$KIT" ] && [ -f "$KIT/$path" ]; then
    kit_hash="$(hash_cmd <"$KIT/$path" | awk '{print $1}')"
    [ "$kit_hash" = "$current" ] || {
      echo "  kit moved   $path"
      behind=$((behind + 1))
    }
  fi
done < <(list_files)

while IFS= read -r path; do
  [ -n "$path" ] || continue
  [ -f "$WF/$path" ] && continue
  echo "  missing     $path (recorded, not here)"
  missing=$((missing + 1))
done < <(awk '{print $2}' "$MANIFEST")

echo
if [ "$edited" -eq 0 ] && [ "$missing" -eq 0 ]; then
  if [ -n "$KIT" ] && [ "$behind" -eq 0 ]; then
    echo "in sync   $count files, and the kit has nothing newer"
  elif [ -n "$KIT" ]; then
    echo "in sync   $count files against the manifest ($behind differ from the kit)"
  else
    echo "in sync   $count files against the manifest (no kit on this machine)"
  fi
  exit 0
fi

[ "$missing" -gt 0 ] && echo "$missing recorded file(s) are not here — --sync restores them"
[ "$edited" -gt 0 ] && echo "$edited file(s) differ from the recorded version"
[ "$behind" -gt 0 ] && echo "$behind file(s) differ from the kit — --sync moves this copy forward, --record accepts this one"
if [ "$behind" -gt 0 ] && [ "$edited" -eq 0 ] && [ "$missing" -eq 0 ]; then
  echo
  echo "this copy is complete and matches its manifest; only the kit differs."
  exit 0
fi
if [ "$edited" -gt 0 ] && [ "$behind" -eq 0 ]; then
  echo
  echo "A change made here belongs in the kit as well: it is where these files are"
  echo "developed, and the next --sync will overwrite it."
fi
exit 1
