"""Checkpoint 2 on a real repository: a compact badge.

The interesting part is not the badge, it is whether the agent noticed that the
first-line and blob rules already exist and reused them instead of writing a
second copy. Both regressions run: the module's tests, and checkpoint 1's spec.
"""
import subprocess
import sys
from pathlib import Path
from typing import NoReturn

ARGS = [a for a in sys.argv[1:] if not a.startswith("--")]
ISOLATED = "--isolated" in sys.argv
REPO = Path(ARGS[0])
SPEC = REPO / "src" / "lib" / "__tests__" / "zz-bench-badge.test.ts"
EXISTING = ["src/lib/__tests__/errorSummary.test.ts", "src/lib/__tests__/zz-bench-batch.test.ts"]

BATCH = """
import { describe, it, expect } from 'vitest'
import { summarizeErrors } from '../errorSummary'

describe('summarizeErrors still holds', () => {
  it('joins, collapses, caps and counts', () => {
    expect(summarizeErrors(['Model timed out', 'Rate limited'])).toBe('Model timed out; Rate limited')
    expect(summarizeErrors(['A', 'B', 'A'])).toBe('A; B')
    expect(summarizeErrors(['a', 'b', 'c', 'd', 'e'])).toBe('a; b; c (+2 more)')
    expect(summarizeErrors([])).toBe('Unknown error')
  })
})
"""

BODY = """
import { describe, it, expect } from 'vitest'
import { errorBadge, GENERIC_ERROR_SUMMARY } from '../errorSummary'

describe('errorBadge', () => {
  it('keeps a short first line unchanged', () => {
    expect(errorBadge('Model timed out')).toBe('Model timed out')
    expect(errorBadge('Line one\\nLine two')).toBe('Line one')
  })

  it('cuts a long first line to forty characters with an ellipsis', () => {
    const long = 'x'.repeat(200)
    expect(errorBadge(long)).toBe('x'.repeat(40) + '…')
  })

  it('keeps exactly forty characters without an ellipsis', () => {
    const exact = 'y'.repeat(40)
    expect(errorBadge(exact)).toBe(exact)
  })

  it('applies the existing blob and blank rules', () => {
    expect(errorBadge('{"error":"boom"}')).toBe(GENERIC_ERROR_SUMMARY)
    expect(errorBadge('')).toBe('Unknown error')
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
BATCH_SPEC = SPEC.parent / "zz-bench-batch.test.ts"
BATCH_SPEC.write_text(BATCH)
try:
    isolated = run([str(SPEC.relative_to(REPO))])
    if isolated.returncode != 0:
        fail("the new behaviour does not hold:\n" + (isolated.stdout + isolated.stderr)[-1500:])
    if not ISOLATED:
        regression = run(EXISTING)
        if regression.returncode != 0:
            fail("earlier behaviour broke:\n" + (regression.stdout + regression.stderr)[-1200:])
finally:
    SPEC.unlink(missing_ok=True)
    BATCH_SPEC.unlink(missing_ok=True)

print("ok")
