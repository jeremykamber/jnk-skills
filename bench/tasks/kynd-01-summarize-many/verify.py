"""Checkpoint 1 on a real repository: summarise a batch of errors.

A vitest spec written from the requirement is copied in, run, and removed. The
agent never sees it: verification happens after the agent exits.
"""
import subprocess
import sys
from pathlib import Path
from typing import NoReturn

ARGS = [a for a in sys.argv[1:] if not a.startswith("--")]
ISOLATED = "--isolated" in sys.argv
REPO = Path(ARGS[0])
SPEC = REPO / "src" / "lib" / "__tests__" / "zz-bench-batch.test.ts"
EXISTING = "src/lib/__tests__/errorSummary.test.ts"

BODY = """
import { describe, it, expect } from 'vitest'
import { summarizeErrors, summarizeError, GENERIC_ERROR_SUMMARY } from '../errorSummary'

describe('summarizeErrors', () => {
  it('joins distinct summaries in order', () => {
    expect(summarizeErrors(['Model timed out', 'Rate limited'])).toBe('Model timed out; Rate limited')
  })

  it('collapses identical summaries, keeping first-seen order', () => {
    expect(summarizeErrors(['A', 'B', 'A'])).toBe('A; B')
  })

  it('shows three and counts the remaining distinct ones', () => {
    expect(summarizeErrors(['a', 'b', 'c', 'd', 'e'])).toBe('a; b; c (+2 more)')
  })

  it('does not count duplicates in the remainder', () => {
    expect(summarizeErrors(['a', 'b', 'c', 'd', 'd', 'd'])).toBe('a; b; c (+1 more)')
  })

  it('applies the single-error rules first', () => {
    expect(summarizeErrors(['{"x":1}', 'Real'])).toBe(`${GENERIC_ERROR_SUMMARY}; Real`)
    expect(summarizeErrors(['   '])).toBe('Unknown error')
    expect(summarizeError('x'.repeat(200)).length).toBe(161)
  })

  it('returns Unknown error for an empty list', () => {
    expect(summarizeErrors([])).toBe('Unknown error')
  })
})
"""


def run(files: list[str]) -> subprocess.CompletedProcess:
    return subprocess.run(["npx", "vitest", "run", *files], cwd=REPO,
                          capture_output=True, text=True, timeout=600)


def fail(message: str) -> NoReturn:
    print("FAIL:", message)
    sys.exit(1)


SPEC.write_text(BODY)
try:
    isolated = run([str(SPEC.relative_to(REPO))])
    if isolated.returncode != 0:
        fail("the new behaviour does not hold:\n" + (isolated.stdout + isolated.stderr)[-1500:])
    if not ISOLATED:
        regression = run([EXISTING])
        if regression.returncode != 0:
            fail("the module's existing tests no longer pass:\n" + (regression.stdout + regression.stderr)[-1200:])
finally:
    SPEC.unlink(missing_ok=True)

print("ok")
