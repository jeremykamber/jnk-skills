#!/usr/bin/env python3
"""The bench harness's own test: no LLM, a stub agent, known answers.

A benchmark that has never been checked is a report, not an instrument. This
pins what the score depends on: the two quality formulas, the correctness ladder,
the priority order between arms, the series accumulating over one repository, and
the verifier never landing where the agent can read it.
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
import tempfile
import unittest
from importlib.machinery import SourceFileLoader
from importlib.util import module_from_spec, spec_from_loader
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BENCH = ROOT / "tools" / "bench"
STUB = ROOT / "checks" / "fixture" / "bench" / "stub_agent.py"


def load_bench():
    spec = spec_from_loader("bench", SourceFileLoader("bench", str(BENCH)))
    if spec is None or spec.loader is None:
        raise RuntimeError(f"cannot load {BENCH}")
    module = module_from_spec(spec)
    sys.modules["bench"] = module  # dataclasses resolve their module by name
    spec.loader.exec_module(module)
    return module


bench = load_bench()


def write(root: Path, files: dict[str, str]) -> Path:
    for name, body in files.items():
        path = root / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(body)
    return root


class Quality(unittest.TestCase):
    def test_erosion_is_zero_when_no_function_is_complex(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            repo = write(Path(tmp), {
                "small.py": "def one(value):\n    return value + 1\n\n\ndef two(value):\n    return value * 2\n",
            })
            quality = bench.measure(repo)
        self.assertEqual(quality.erosion, 0.0)
        self.assertEqual(quality.verbosity, 0.0)

    def test_erosion_is_the_mass_share_of_functions_above_the_cutoff(self) -> None:
        # One function with twelve branches, one with none: the eroded share is
        # the paper's equation 3, and it is a share, not a count, so adding more
        # small functions around the big one dilutes it rather than hiding it.
        branches = "".join(f"    if flag_{i}:\n        total += {i}\n" for i in range(12))
        with tempfile.TemporaryDirectory() as tmp:
            repo = write(Path(tmp), {
                "big.py": "def god(flags):\n    total = 0\n" + branches + "    return total\n\n\ndef tiny():\n    return 1\n",
            })
            quality = bench.measure(repo)
        self.assertGreater(quality.erosion, 0.5, quality.as_dict())
        self.assertEqual(quality.erosion, round(quality.eroded_mass / quality.total_mass, 4))

    def test_verbosity_counts_duplication_and_markers_over_lines(self) -> None:
        block = "".join(f"    value_{i} = compute({i})\n" for i in range(6))
        with tempfile.TemporaryDirectory() as tmp:
            repo = write(Path(tmp), {
                "one.py": "def first():\n" + block,
                "two.py": "def second():\n" + block,
                "three.py": "def third():\n    # TODO: finish this\n    pass\n",
            })
            quality = bench.measure(repo)
        self.assertGreater(quality.dup_lines, 0, "the same six lines in two files is duplication")
        self.assertGreaterEqual(quality.flagged_lines, 2, "a TODO and a stub body are both flagged")
        self.assertGreater(quality.verbosity, 0.0)
        self.assertEqual(quality.verbosity,
                         round(min((quality.dup_lines + quality.flagged_lines) / quality.loc, 1.0), 4))

    def test_a_shebang_script_with_no_extension_is_measured(self) -> None:
        # A from-scratch task that asks for `./csvq` produces a real program with
        # no extension. The first version of this returned loc 0 for it, because
        # the parser was called through an API that did not exist and the error
        # was swallowed — a metric reporting zero because the tool failed.
        with tempfile.TemporaryDirectory() as tmp:
            repo = Path(tmp)
            script = repo / "csvq"
            script.write_text("#!/usr/bin/env python3\nimport sys\n\n\ndef main(argv):\n    return 1\n")
            script.chmod(0o755)
            quality = bench.measure(repo)
        self.assertEqual(quality.files, 1)
        self.assertGreater(quality.loc, 0, quality.as_dict())
        self.assertGreater(quality.functions, 0, quality.as_dict())
        self.assertEqual(quality.unmeasured, [], "a parser failure must be reported, not read as zero")

    def test_tests_are_counted_but_never_scored(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            repo = write(Path(tmp), {
                "lib.py": "def one(value):\n    return value + 1\n",
                "tests/test_lib.py": "import unittest\n\n\nclass T(unittest.TestCase):\n    def test_one(self):\n        self.assertTrue(True)\n",
            })
            quality = bench.measure(repo)
        self.assertEqual((quality.files, quality.test_files), (1, 1))
        self.assertEqual(quality.verbosity, 0.0)


class Priority(unittest.TestCase):
    """The arm comparison is lexicographic and the order is the contract:
    correctness, then erosion, then verbosity, then cost."""

    def arms(self, **overrides):
        base = {"strict_rate": 1.0, "erosion": 0.2, "verbosity": 0.2, "tokens": 100}
        work = dict(base)
        work.update(overrides)
        return bench.compare(base, work)

    def test_correctness_outranks_every_saving(self) -> None:
        axis, direction, _ = self.arms(strict_rate=0.75, erosion=0.0, verbosity=0.0, tokens=1)
        self.assertEqual((axis, direction), ("correctness", "worse"))

    def test_cleaner_code_outranks_cost(self) -> None:
        self.assertEqual(self.arms(erosion=0.1, tokens=900)[:2], ("erosion", "better"))

    def test_cost_is_only_the_last_tiebreak(self) -> None:
        self.assertEqual(self.arms(tokens=50)[:2], ("cost", "better"))
        self.assertEqual(self.arms(tokens=500)[:2], ("cost", "worse"))

    def test_identical_arms_tie(self) -> None:
        self.assertEqual(self.arms()[:2], ("nothing", "tied"))


class Series(unittest.TestCase):
    def run_bench(self, tmp: Path, sloppy: bool) -> dict:
        env = dict(os.environ)
        if sloppy:
            env["STUB_SLOPPY"] = "1"
        out = Path(tempfile.mkdtemp(dir=tmp))
        proc = subprocess.run(
            [sys.executable, str(BENCH), "--run", "ticket-desk", "--arm", "baseline",
             "--agent", f"{sys.executable} {STUB}", "--out", str(out), "--keep"],
            capture_output=True, text=True, env=env)
        self.assertEqual(proc.returncode, 0, proc.stdout + proc.stderr[-2000:])
        files = list(out.glob("*.json"))
        self.assertEqual(len(files), 1, "one summary per arm")
        return json.loads(files[0].read_text())

    def test_a_series_passes_and_accumulates(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            summary = self.run_bench(Path(tmp), sloppy=False)
        self.assertEqual(len(summary["checkpoints"]), 4)
        self.assertEqual(summary["strict_rate"], 1.0,
                         [c["detail"] for c in summary["checkpoints"] if not c["strict"]])
        self.assertEqual(summary["isolated_rate"], 1.0)
        self.assertEqual(summary["tokens"], 400, "four checkpoints, 100 tokens each")
        self.assertEqual(summary["tool_calls"], 4)
        self.assertEqual(len(summary["erosion_trajectory"]), 4)

    def test_sloppier_code_scores_worse_and_still_works(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            clean = self.run_bench(Path(tmp), sloppy=False)
            sloppy = self.run_bench(Path(tmp), sloppy=True)
        self.assertEqual(sloppy["strict_rate"], 1.0, "the sloppy build must still work")
        self.assertGreater(sloppy["erosion"], clean["erosion"],
                           f"clean {clean['erosion']} vs sloppy {sloppy['erosion']}")

    def test_the_verifier_never_lands_in_the_repo(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            summary = self.run_bench(Path(tmp), sloppy=False)
            kept = Path(summary["kept"])
            self.assertFalse((kept / "verify.py").exists())
            self.assertFalse((kept / "bench").exists())
            self.assertTrue((kept / "ticket.py").exists(), "the agent's work is the repo")


if __name__ == "__main__":
    unittest.main(verbosity=2)
