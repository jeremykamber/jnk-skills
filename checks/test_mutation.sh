#!/usr/bin/env bash
#
# Prove the mutation gate detects what it claims to detect.
#
# This is the check that would have caught Stryker's broken vitest integration
# the first time. That bug did not crash and did not warn: it reported every
# mutant as SURVIVED, including mutants whose killing assertion is right there
# in the test file, and printed a 0.00% score. Read as a result, that says "your
# tests are terrible" and sends you off to write assertions for mutants that
# were already detected.
#
# The cause, traced under vitest 5: Stryker selects the right test and sends the
# right request, but the runner turns that request into a name filter by joining
# the suite chain with a space (`math adds`), while vitest matches against the
# ">"-joined full name (`math > adds`). Nothing matches, the file is skipped, and
# zero tests execute — and a mutant nothing runs against cannot be killed.
# Reproduce it either way: `npx vitest run <file> -t "math adds"` skips every
# test, `-t "math > adds"` runs one. The runner's `collectTestName` still joins
# with a space in 10.0.0, the latest release.
#
# THREE RUNS OF THE SAME FIXTURE, and all must come back with the same answer.
#
#   1. templates/stryker.conf.cjs, as shipped. This is the file a project gets,
#      so it is the one that has to be proven, not a copy of it.
#   2. The command runner: the project's own test command and an exit code, no
#      per-test analysis, no plugin, no extra dependency. It is the fallback for
#      a project that is not on vitest, and it is immune to the bug above.
#   3. templates/stryker-vitest-runner.mjs with `testRunner: "vitest-fixed"`:
#      the official vitest runner with the name separator corrected, so
#      `coverageAnalysis: "perTest"` works and only the covering tests run.
#
# Runs 2 and 3 are written here rather than copied, so both runners stay pinned
# whatever the shipped default is. The plugin reaches into the runner's context,
# which is exactly the kind of code that has to be pinned by a fixture rather
# than trusted: if Stryker or vitest changes the id format or the separator
# again, this check is what fails, loudly, instead of a 0% score.
#
# The fixture below has one mutant that MUST be killed and one that MUST
# survive. A tool that gets either direction wrong is broken, whatever else it
# reports.
#
# The third direction is the other way the same gate lies. A runner left at
# Stryker's default concurrency times every mutant out, and a timeout is not a
# survivor, so the report comes back at 100% — the number you were hoping for,
# made of nothing. This check fails on a run with more than one timeout, so a
# busy machine cannot be mistaken for a perfect suite.
#
# Opt-in, not part of the default stack: it needs the network to install and it
# runs three real mutation sweeps.
#
#   ./checks/test_mutation.sh
#
# Exit 0 all three detect correctly, 1 any one of them does not.

set -euo pipefail

KIT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

echo "mutation gate self-test in $WORK"

cat >"$WORK/package.json" <<'EOF'
{ "name": "mutation-fixture", "private": true, "type": "module" }
EOF

cat >"$WORK/tsconfig.json" <<'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true
  },
  "include": ["src", "tests"]
}
EOF

mkdir -p "$WORK/src" "$WORK/tests"

# add(2,3) is asserted, so `+` -> `-` must be killed.
# isAdult(18) is asserted from both sides, so the boundary must be killed.
# sign(0) is never exercised, so `>` -> `>=` MUST survive.
cat >"$WORK/src/math.ts" <<'EOF'
export function add(a: number, b: number): number {
  return a + b;
}

export function isAdult(age: number): boolean {
  return age >= 18;
}

export function sign(n: number): number {
  if (n > 0) return 1;
  return 0;
}
EOF

cat >"$WORK/tests/math.test.ts" <<'EOF'
import { describe, expect, it } from "vitest";
import { add, isAdult, sign } from "../src/math";

describe("math", () => {
  it("adds", () => {
    expect(add(2, 3)).toBe(5);
  });

  it("knows adults at the boundary", () => {
    expect(isAdult(18)).toBe(true);
    expect(isAdult(17)).toBe(false);
  });

  it("signs", () => {
    expect(sign(5)).toBe(1);
    expect(sign(-5)).toBe(0);
  });
});
EOF

cp "$KIT/templates/stryker.conf.cjs" "$WORK/stryker.conf.cjs"
cp "$KIT/templates/stryker-vitest-runner.mjs" "$WORK/stryker-vitest-runner.mjs"

# Two configs written here rather than copied, so the check pins both runners
# whatever the template's default happens to be. The template is run as shipped
# as well, which is what proves the file a project actually gets.
cat >"$WORK/stryker.command.conf.cjs" <<'EOF'
// The command runner: no plugin, no extra dependency, works for jest, mocha or
// node:test as well as vitest. This is the fallback documented in the template.
module.exports = {
  packageManager: "npm",
  testRunner: "command",
  coverageAnalysis: "off",
  commandRunner: { command: "npx vitest run" },
  inPlace: true,
  concurrency: 3,
  timeoutMS: 30_000,
  reporters: ["json", "clear-text"],
  mutate: ["src/**/*.ts"],
  thresholds: { high: 100, low: 60, break: 60 },
};
EOF

cat >"$WORK/stryker.vitest.conf.cjs" <<'EOF'
// The fixed vitest runner: the official one with the test-name separator
// corrected, which is what makes coverageAnalysis "perTest" work.
module.exports = {
  packageManager: "npm",
  plugins: ["./stryker-vitest-runner.mjs"],
  testRunner: "vitest-fixed",
  coverageAnalysis: "perTest",
  inPlace: true,
  concurrency: 3,
  timeoutMS: 30_000,
  reporters: ["json", "clear-text"],
  mutate: ["src/**/*.ts"],
  thresholds: { high: 100, low: 60, break: 60 },
};
EOF

# FIXTURE_STRYKER lets you prove this check can fail. Point it at a broken
# config and the check must report FAIL — a self-test that cannot fail is the
# same anti-pattern it exists to catch. Only that config runs, so the failure
# is unambiguous.
CONFIGS=("stryker.conf.cjs" "stryker.command.conf.cjs" "stryker.vitest.conf.cjs")
if [ -n "${FIXTURE_STRYKER:-}" ]; then
  cp "$FIXTURE_STRYKER" "$WORK/stryker.conf.cjs"
  CONFIGS=("stryker.conf.cjs")
  echo "using config override: $FIXTURE_STRYKER"
fi

# @stryker-mutator/vitest-runner is installed because the second config runs it
# (and because FIXTURE_STRYKER can then reproduce the real bug — a lying report
# — rather than a missing-plugin error).
echo "installing (network required)..."
(cd "$WORK" && npm i -D vitest typescript @stryker-mutator/core @stryker-mutator/vitest-runner --silent >/dev/null 2>&1)

# Derive the expected line rather than hard-coding it, so editing the fixture
# above cannot silently invalidate this check.
EXPECTED_LINE="$(grep -n 'if (n > 0)' "$WORK/src/math.ts" | cut -d: -f1)"

# Judge one report against the fixture's three directions. Returns 1 on any
# disagreement, and says which config disagreed.
judge() {
  local report="$1" label="$2" status=0
  local killed survived timeouts survivor_line

  # The fixture has 12 mutants: 11 detectable, 1 a real assertion gap.
  killed="$(jq '[.files[].mutants[] | select(.status=="Killed")] | length' "$report")"
  survived="$(jq '[.files[].mutants[] | select(.status=="Survived")] | length' "$report")"
  timeouts="$(jq '[.files[].mutants[] | select(.status=="Timeout")] | length' "$report")"
  survivor_line="$(jq -r '[.files[].mutants[] | select(.status=="Survived") | .location.start.line] | unique | join(",")' "$report")"

  echo "$label: killed=$killed survived=$survived timed-out=$timeouts survivor-lines=$survivor_line"

  # Direction one: it must kill what is detectable. A tool that reports 0 killed
  # is not measuring anything.
  if [ "$killed" -lt 11 ]; then
    echo "FAIL ($label): only $killed of 11 detectable mutants were killed."
    echo "      A mutation tool that kills nothing is not running the tests against"
    echo "      mutated source. A vitest runner that reports 0 killed is the"
    echo "      separator bug described at the top of this file."
    status=1
  fi

  # Direction two: it must NOT kill what is undetectable. A tool that kills
  # everything is not measuring anything either.
  if [ "$survived" -ne 1 ]; then
    echo "FAIL ($label): expected exactly 1 survivor (the untested boundary), got $survived."
    status=1
  elif [ "$survivor_line" != "$EXPECTED_LINE" ]; then
    echo "FAIL ($label): the survivor is on line $survivor_line; the only undetectable"
    echo "      mutant is the one on line $EXPECTED_LINE (sign's boundary). The tool"
    echo "      is reporting the wrong mutants."
    status=1
  fi

  # Direction three: a mutant that timed out was never measured, and a run whose
  # mutants time out reports the one number that reads as success — a 100% score,
  # because a timeout is not a survivor. It is the machine that is oversubscribed,
  # not the suite that is perfect: the command runner starts one process per core
  # and each of those starts the whole suite. See `concurrency` and `timeoutMS` in
  # templates/stryker.conf.cjs, and do not read a score of 100 before checking
  # this count.
  if [ "$timeouts" -gt 1 ]; then
    echo "FAIL ($label): $timeouts mutants timed out — they were never measured."
    echo "      A score made of timeouts is a score made of nothing. Lower"
    echo "      concurrency and raise timeoutMS in the config."
    status=1
  fi

  return "$status"
}

STATUS=0
for config in "${CONFIGS[@]}"; do
  echo "running $config..."
  (cd "$WORK" && npx stryker run "$config" >/dev/null 2>&1 || true)

  REPORT="$WORK/reports/mutation/mutation.json"
  if [ ! -f "$REPORT" ]; then
    echo "FAIL ($config): no mutation report at $REPORT — the run produced nothing to judge"
    STATUS=1
    continue
  fi

  # Copy it aside: the next config overwrites this path.
  cp "$REPORT" "$WORK/report.$config.json"
  judge "$WORK/report.$config.json" "$config" || STATUS=1
done

if [ "$STATUS" -eq 0 ]; then
  echo "ok: all three kill 11, and report the one true gap on line $EXPECTED_LINE"
fi

exit "$STATUS"
