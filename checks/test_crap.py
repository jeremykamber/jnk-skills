#!/usr/bin/env python3
"""Pin the CRAP tool to hand-computed values.

fixture/src/sample.ts has three functions whose complexity lizard reports as
1, 4 and 3. The synthetic coverage below hits:

  simple     1 of 1 statements  -> cov 1.00 -> CRAP = 1^2 * 0^3 + 1      = 1.00
  branchy    4 of 5 statements  -> cov 0.80 -> CRAP = 4^2 * 0.2^3 + 4    = 4.13
  uncovered  0 of 5 statements  -> cov 0.00 -> CRAP = 3^2 * 1^3 + 3      = 12.00

If a change to the tool or to lizard's ranges moves any of those numbers, this
test fails.
"""

from __future__ import annotations

import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TOOL = ROOT / "tools" / "crap"
SOURCE = ROOT / "checks" / "fixture" / "src" / "sample.ts"

# (line, hit count) for every statement in the fixture.
STATEMENTS = [
    (2, 1),    # simple:   return x + 1
    (6, 1),    # branchy:  if (a > b && b > 0)
    (7, 1),    # branchy:  return a
    (9, 1),    # branchy:  for (...)
    (10, 1),   # branchy:  b += i
    (12, 0),   # branchy:  return b        <- not covered
    (16, 0),   # uncovered: if (a > 0)
    (17, 0),   # uncovered: return 1
    (18, 0),   # uncovered: else if (a < 0)
    (19, 0),   # uncovered: return -1
    (21, 0),   # uncovered: return 0
]


def write_coverage(directory: Path) -> Path:
    statement_map = {}
    hits = {}
    for index, (line, count) in enumerate(STATEMENTS):
        statement_map[str(index)] = {
            "start": {"line": line, "column": 0},
            "end": {"line": line, "column": 1},
        }
        hits[str(index)] = count

    payload = {
        str(SOURCE): {
            "path": str(SOURCE),
            "statementMap": statement_map,
            "s": hits,
            "fnMap": {},
            "f": {},
            "branchMap": {},
            "b": {},
        }
    }
    path = directory / "coverage-final.json"
    path.write_text(json.dumps(payload))
    return path


def run_crap(coverage: Path, *extra: str) -> tuple[int, dict]:
    proc = subprocess.run(
        [sys.executable, str(TOOL), str(SOURCE), "--coverage", str(coverage), "--json", *extra],
        capture_output=True,
        text=True,
        cwd=ROOT,
    )
    return proc.returncode, json.loads(proc.stdout)


class CrapMetricTest(unittest.TestCase):
    def setUp(self) -> None:
        self._tmp = tempfile.TemporaryDirectory()
        self.coverage = write_coverage(Path(self._tmp.name))

    def tearDown(self) -> None:
        self._tmp.cleanup()

    def by_name(self, payload: dict) -> dict:
        return {fn["name"]: fn for fn in payload["functions"]}

    def test_scores_match_the_formula(self) -> None:
        _, payload = run_crap(self.coverage, "--threshold", "999")
        functions = self.by_name(payload)

        self.assertEqual(functions["simple"]["ccn"], 1)
        self.assertEqual(functions["branchy"]["ccn"], 4)
        self.assertEqual(functions["uncovered"]["ccn"], 3)

        self.assertAlmostEqual(functions["simple"]["coverage"], 1.00, places=2)
        self.assertAlmostEqual(functions["branchy"]["coverage"], 0.80, places=2)
        self.assertAlmostEqual(functions["uncovered"]["coverage"], 0.00, places=2)

        self.assertAlmostEqual(functions["simple"]["crap"], 1.00, places=2)
        self.assertAlmostEqual(functions["branchy"]["crap"], 4.13, places=2)
        self.assertAlmostEqual(functions["uncovered"]["crap"], 12.00, places=2)

    def test_threshold_controls_exit_status(self) -> None:
        code, payload = run_crap(self.coverage, "--threshold", "10")
        self.assertEqual(code, 1, "uncovered() scores 12 and must fail a gate of 10")
        self.assertEqual(payload["over"], 1)

        code, payload = run_crap(self.coverage, "--threshold", "13")
        self.assertEqual(code, 0, "nothing exceeds 13")
        self.assertEqual(payload["over"], 0)

    def test_functions_are_reported_worst_first(self) -> None:
        _, payload = run_crap(self.coverage, "--threshold", "999")
        names = [fn["name"] for fn in payload["functions"]]
        self.assertEqual(names, ["uncovered", "branchy", "simple"])

    def test_coverage_py_format_is_understood(self) -> None:
        payload = {
            "files": {
                str(SOURCE): {
                    "executed_lines": [2, 6, 7, 9, 10],
                    "missing_lines": [12, 16, 17, 18, 19, 21],
                }
            }
        }
        path = Path(self._tmp.name) / "covpy.json"
        path.write_text(json.dumps(payload))

        _, payload_out = run_crap(path, "--threshold", "999")
        functions = self.by_name(payload_out)

        self.assertAlmostEqual(functions["simple"]["crap"], 1.00, places=2)
        self.assertAlmostEqual(functions["branchy"]["crap"], 4.13, places=2)
        self.assertAlmostEqual(functions["uncovered"]["crap"], 12.00, places=2)

    def test_changed_scopes_to_files_that_differ_from_base(self) -> None:
        """--changed is what keeps the gate affordable on a large tree."""
        repo = Path(self._tmp.name) / "repo"
        (repo / "src").mkdir(parents=True)
        (repo / "src" / "sample.ts").write_text(SOURCE.read_text())
        (repo / "src" / "other.ts").write_text(
            "export function other(x: number): number {\n  return x;\n}\n"
        )

        def git(*args: str) -> None:
            subprocess.run(
                ["git", "-c", "user.email=t@t", "-c", "user.name=t", *args],
                cwd=repo, capture_output=True, text=True, check=True,
            )

        git("init", "-q")
        git("add", "-A")
        git("commit", "-qm", "init")

        coverage = {
            str(repo / "src" / "sample.ts"): {
                "path": str(repo / "src" / "sample.ts"),
                "statementMap": {
                    str(i): {"start": {"line": line, "column": 0}, "end": {"line": line, "column": 1}}
                    for i, (line, _) in enumerate(STATEMENTS)
                },
                "s": {str(i): count for i, (_, count) in enumerate(STATEMENTS)},
                "fnMap": {}, "f": {}, "branchMap": {}, "b": {},
            },
            str(repo / "src" / "other.ts"): {
                "path": str(repo / "src" / "other.ts"),
                "statementMap": {"0": {"start": {"line": 2, "column": 0}, "end": {"line": 2, "column": 1}}},
                "s": {"0": 1},
                "fnMap": {}, "f": {}, "branchMap": {}, "b": {},
            },
        }
        coverage_path = Path(self._tmp.name) / "repo-coverage.json"
        coverage_path.write_text(json.dumps(coverage))

        def run_in_repo(*extra: str) -> dict:
            proc = subprocess.run(
                [sys.executable, str(TOOL), "src", "--coverage", str(coverage_path),
                 "--json", "--base", "HEAD", "--threshold", "999", *extra],
                capture_output=True, text=True, cwd=repo,
            )
            self.assertEqual(proc.returncode, 0, proc.stderr)
            return json.loads(proc.stdout)

        clean = run_in_repo()
        self.assertEqual(clean["count"], 4, "nothing changed, so every function is in scope")

        (repo / "src" / "other.ts").write_text(
            "export function other(x: number): number {\n  return x + 1;\n}\n"
        )
        changed = run_in_repo("--changed")
        names = {fn["name"] for fn in changed["functions"]}
        self.assertEqual(names, {"other"}, "only the modified file's functions are in scope")

        (repo / "src" / "untracked.ts").write_text(
            "export function fresh(x: number): number {\n  return x;\n}\n"
        )
        with_untracked = run_in_repo("--changed")
        self.assertIn(
            "fresh", {fn["name"] for fn in with_untracked["functions"]},
            "an untracked file is new work and must be in scope",
        )

    def test_test_files_are_excluded_by_default(self) -> None:
        """Scoring test files buries the functions that matter."""
        tree = Path(self._tmp.name) / "proj"
        (tree / "src").mkdir(parents=True)
        (tree / "src" / "a.test.ts").write_text(
            "export function fromTest(x: number): number {\n  return x;\n}\n"
        )
        (tree / "src" / "b.spec.ts").write_text(
            "export function fromSpec(x: number): number {\n  return x;\n}\n"
        )
        (tree / "src" / "real.ts").write_text(
            "export function fromSource(x: number): number {\n  return x;\n}\n"
        )

        proc = subprocess.run(
            [sys.executable, str(TOOL), "src", "--coverage", str(self.coverage), "--json"],
            capture_output=True, text=True, cwd=tree,
        )
        self.assertEqual(proc.returncode, 0, proc.stderr)
        names = {fn["name"] for fn in json.loads(proc.stdout)["functions"]}
        self.assertEqual(names, {"fromSource"})

        proc = subprocess.run(
            [sys.executable, str(TOOL), "src", "--coverage", str(self.coverage),
             "--json", "--include-tests"],
            capture_output=True, text=True, cwd=tree,
        )
        names = {fn["name"] for fn in json.loads(proc.stdout)["functions"]}
        self.assertEqual(names, {"fromSource", "fromTest", "fromSpec"})

    def test_missing_coverage_file_exits_two(self) -> None:
        proc = subprocess.run(
            [sys.executable, str(TOOL), str(SOURCE), "--coverage", "/nonexistent.json"],
            capture_output=True,
            text=True,
            cwd=ROOT,
        )
        self.assertEqual(proc.returncode, 2)
        self.assertIn("no coverage file", proc.stderr)


if __name__ == "__main__":
    unittest.main(verbosity=2)
