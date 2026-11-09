#!/usr/bin/env python3
"""The bench harness's own test: no LLM, a stub agent, known answers.

A benchmark that has never been checked is a report, not an instrument. This
pins the four things the score depends on: the metric arithmetic, the series
accumulating over one repository, the transcript parsing, and slop actually
rising when the code gets worse.
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


class Metrics(unittest.TestCase):
    def build(self, tmp: Path, sloppy: bool) -> Path:
        repo = tmp / ("sloppy" if sloppy else "clean")
        repo.mkdir()
        block = "\n".join(f"    value_{i} = compute({i})" for i in range(6))
        if sloppy:
            body = "\n".join(f"        if flag_{i} > 0:\n            y{i} = 1" for i in range(16))
            (repo / "big.py").write_text("def god(flags):\n" + body + "\n" + block)
            (repo / "twin.py").write_text("def twin():\n" + block + "\n")
        else:
            for index in range(6):
                (repo / f"part_{index}.py").write_text(
                    f"def part_{index}(value):\n    return value * {index} + 1\n")
        return repo

    def test_bad_code_is_detected_and_scores_higher(self):
        with tempfile.TemporaryDirectory() as tmp:
            sloppy = bench.measure(self.build(Path(tmp), True))
            clean = bench.measure(self.build(Path(tmp), False))
        self.assertGreaterEqual(sloppy.high_ccn, 1, "a 16-branch function is a hotspot")
        self.assertGreater(sloppy.dup_lines, 0, "the same six lines twice is duplication")
        self.assertGreater(sloppy.slop, clean.slop, f"{sloppy.as_dict()} vs {clean.as_dict()}")
        self.assertEqual(clean.slop, 0.0, "six small functions carry no slop")

    def test_score_is_a_bounded_share(self):
        with tempfile.TemporaryDirectory() as tmp:
            metrics = bench.measure(self.build(Path(tmp), True))
        self.assertGreaterEqual(metrics.slop, 0.0)
        self.assertLessEqual(metrics.slop, 300.0, "three shares, each capped at 1")


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

    def test_series_passes_and_accumulates(self):
        with tempfile.TemporaryDirectory() as tmp:
            summary = self.run_bench(Path(tmp), sloppy=False)
            self.assertEqual(len(summary["tasks"]), 4)
            self.assertEqual(summary["pass_rate"], 1.0, [t["verify"] for t in summary["tasks"] if not t["passed"]])
            self.assertEqual(summary["tokens"], 400, "four tasks, 100 tokens each")
            self.assertEqual(summary["tool_calls"], 4)
            self.assertEqual(len(summary["slop_trajectory"]), 4)
            self.assertGreaterEqual(summary["slop"], 0.0)

    def test_sloppy_code_scores_worse(self):
        with tempfile.TemporaryDirectory() as tmp:
            clean = self.run_bench(Path(tmp), sloppy=False)
            sloppy = self.run_bench(Path(tmp), sloppy=True)
            self.assertEqual(sloppy["pass_rate"], 1.0, "the sloppy build must still work")
            self.assertGreater(sloppy["slop"], clean["slop"] * 1.5,
                               f"slop should rise: clean {clean['slop']} vs sloppy {sloppy['slop']}")

    def test_verifier_never_lands_in_the_repo(self):
        with tempfile.TemporaryDirectory() as tmp:
            summary = self.run_bench(Path(tmp), sloppy=False)
            kept = Path(summary["kept"])
            self.assertFalse((kept / "verify.py").exists())
            self.assertFalse((kept / "bench").exists())
            self.assertTrue((kept / "ticket.py").exists(), "the agent's work is the repo")


if __name__ == "__main__":
    unittest.main(verbosity=2)
