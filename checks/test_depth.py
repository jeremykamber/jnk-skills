#!/usr/bin/env python3
"""Pin the depth detector to the book's own examples.

fixture/depth/book.ts and book.py are the flawed examples from John Ousterhout,
*A Philosophy of Software Design*, with the chapter named above each block;
fixture/depth/good.ts is the book's own corrected versions of the same code.
The expected numbers below are taken from the book, not observed and blessed:

  book.ts    12  one shallow method (4.5), three pass-through methods (7.1),
                 seven comments that repeat their line (13.2), one declaration
                 comment narrating the implementation (13.5)
  book.py     6  the same four flaws in Python idioms
  good.ts     0  the corrected versions produce nothing. A detector that fires
                 on the book's good examples has no authority over its bad ones

If a change to the tool or to lizard's line ranges moves any of these, this test
fails. Also pinned here, because the ratchet depends on them: finding ids survive
blank lines inserted above them, the baseline fails a run only on a finding that
is new, a paid finding is reported rather than silently dropped, and the score is
the book's own formula with churn read off git history.

fixture/leaks is the second half: fifteen files in two languages holding the
flags that exist only in the *relationship* between modules. Figure 2.1(c)'s
banner (a shade known centrally, an emphasis shade written out on each page),
Figure 5.1's reader and writer declaring one layout twice, Figure 7.3's chain of
forwards. Every one of them is written with its negative beside it: a value with
one owner, a shape that merely overlaps, a chain one hop too short. This
directory is also where the cross-module flags are shown to see Python and
TypeScript the same way, and to report a fact once rather than once per pair.
fixture/report does the same for `depth report`: one file per reading, each with
its negative beside it, and the drift and trend readings built in a throwaway
repository because they need history.
"""

from __future__ import annotations

import json
import shutil
import subprocess
import sys
import tempfile
import textwrap
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TOOL = ROOT / "tools" / "depth"
FIXTURES = ROOT / "checks" / "fixture" / "depth"
LEAKS = ROOT / "checks" / "fixture" / "leaks"
REPORT = ROOT / "checks" / "fixture" / "report"

TS_EXPECTED = {
    "shallow-method": [31],
    "pass-through": [46, 50, 54],
    "comment-repeats-code": [71, 73, 78, 81, 85, 100, 103],
    "implementation-narrative-comment": [120],
}
PY_EXPECTED = {
    "shallow-method": [15],
    "pass-through": [24, 27],
    "comment-repeats-code": [35, 40],
    "implementation-narrative-comment": [53],
}

FLAWED = textwrap.dedent(
    """
    export class AttributeMap {
      private readonly data = new Map<string, string | null>();

      private addNullValueForAttribute(attribute: string): void {
        this.data.set(attribute, null);
      }
    }
    """
).strip()

CLEAN = textwrap.dedent(
    """
    export class AttributeMap {
      private readonly data = new Map<string, string | null>();

      private attributesOrDefault(name: string): string {
        const stored = this.data.get(name);
        if (stored === null || stored === undefined) {
          return name;
        }
        return stored;
      }
    }
    """
).strip()


def run(*argv: str, cwd: Path = ROOT) -> subprocess.CompletedProcess:
    return subprocess.run([sys.executable, str(TOOL), *argv], capture_output=True, text=True, cwd=cwd)


def run_json(*argv: str, cwd: Path = ROOT) -> tuple[int, dict]:
    proc = run(*argv, "--json", cwd=cwd)
    return proc.returncode, json.loads(proc.stdout) if proc.stdout.strip() else {}


def by_flag(payload: dict) -> dict[str, list[dict]]:
    grouped: dict[str, list[dict]] = {}
    for finding in payload["findings"]:
        grouped.setdefault(finding["flag"], []).append(finding)
    return grouped


def lines_by_flag(payload: dict) -> dict[str, list[int]]:
    return {flag: sorted(finding["line"] for finding in findings) for flag, findings in by_flag(payload).items()}


def basename(finding: dict) -> str:
    return finding["file"].split("/")[-1]


def basenames(finding: dict) -> list[str]:
    return [name.split("/")[-1] for name in finding["files"]]


class BookExamplesTest(unittest.TestCase):
    """The four decidable red flags, on the book's own before-and-after pair."""

    def test_typescript_fixture_finds_exactly_the_books_flaws(self) -> None:
        code, payload = run_json(str(FIXTURES / "book.ts"))
        self.assertEqual(code, 0, "report-only mode never fails")
        self.assertEqual(lines_by_flag(payload), TS_EXPECTED)

    def test_python_fixture_finds_the_same_four_flags(self) -> None:
        code, payload = run_json(str(FIXTURES / "book.py"))
        self.assertEqual(code, 0)
        self.assertEqual(lines_by_flag(payload), PY_EXPECTED)

    def test_corrected_fixture_is_clean(self) -> None:
        code, payload = run_json(str(FIXTURES / "good.ts"))
        self.assertEqual(code, 0)
        self.assertEqual(payload["findings"], [], "the book's own fixes must not be reported")

    def test_pass_through_covers_both_of_the_books_shapes(self) -> None:
        # The book's definition is "no new functionality", which arrives two
        # ways: the same signature, and the same name.
        _, payload = run_json(str(FIXTURES / "book.ts"))
        through = {finding["symbol"]: finding["measure"] for finding in payload["findings"] if finding["flag"] == "pass-through"}
        self.assertEqual(through["getCursorOffset"], "args=0", "forwarding to a method of the same name")
        self.assertEqual(through["insertString"], "args=2", "forwarding an identical signature")
        self.assertEqual(
            set(through),
            {"getLastTypedCharacter", "getCursorOffset", "insertString"},
            "the book's one method that had real functionality must not be reported",
        )

    def test_a_comment_that_names_what_the_code_hides_is_not_reported(self) -> None:
        # "Locked by current ctx" is the book's one useful comment in that
        # sample. A detector that flags it is measuring length, not redundancy.
        source = (FIXTURES / "book.ts").read_text().splitlines()
        guarded = next(index for index, line in enumerate(source, start=1) if "Locked by current ctx" in line)
        _, payload = run_json(str(FIXTURES / "book.ts"))
        self.assertNotIn(guarded, [finding["line"] for finding in payload["findings"]])

    def test_every_finding_carries_its_repair_menu(self) -> None:
        _, payload = run_json(str(FIXTURES / "book.ts"))
        for finding in payload["findings"]:
            with self.subTest(flag=finding["flag"]):
                self.assertTrue(finding["moves"], "a finding without a move is a complaint, not a task")
                for move in finding["moves"]:
                    self.assertTrue(move["move"])
                    self.assertTrue(move["apply_when"])
                    self.assertTrue(move["not_when"])

    def test_explain_prints_the_moves_and_when_to_use_each(self) -> None:
        proc = run("--explain", "pass-through")
        self.assertEqual(proc.returncode, 0)
        for expected in ("expose the lower object", "redistribute the functionality", "merge the two classes", "apply when", "not when"):
            self.assertIn(expected, proc.stdout)
        self.assertEqual(run("--explain", "no-such-flag").returncode, 2)


class RatchetTest(unittest.TestCase):
    """A heuristic gate has to be able to fail, and it has to fail one thing."""

    def setUp(self) -> None:
        self._tmp = tempfile.TemporaryDirectory()
        self.dir = Path(self._tmp.name)
        self.source = self.dir / "sample.ts"
        self.baseline = self.dir / "baseline.json"

    def tearDown(self) -> None:
        self._tmp.cleanup()

    def accept(self) -> None:
        self.source.write_text(FLAWED)
        proc = run(str(self.source), "--update-baseline", "--baseline", str(self.baseline), cwd=self.dir)
        self.assertEqual(proc.returncode, 0)

    def test_a_missing_baseline_is_an_error_not_a_pass(self) -> None:
        self.source.write_text(FLAWED)
        proc = run(str(self.source), "--baseline", str(self.dir / "absent.json"), cwd=self.dir)
        self.assertEqual(proc.returncode, 2)
        self.assertIn("no baseline", proc.stderr)

    def test_accepted_findings_pass_and_a_new_one_fails(self) -> None:
        self.accept()
        code, payload = run_json(str(self.source), "--baseline", str(self.baseline), cwd=self.dir)
        self.assertEqual(code, 0)
        self.assertEqual(payload["new"], [])

        self.source.write_text(FLAWED + "\n\n" + FLAWED.replace("AttributeMap", "SecondMap").replace("addNullValueForAttribute", "brandNew"))
        code, payload = run_json(str(self.source), "--baseline", str(self.baseline), cwd=self.dir)
        self.assertEqual(code, 1, "an unaccepted finding is what makes the gate fail")
        self.assertEqual(len(payload["new"]), 1)
        self.assertIn("brandNew", payload["new"][0])

    def test_paying_a_finding_off_passes_and_is_reported(self) -> None:
        self.accept()
        self.source.write_text(CLEAN)
        code, payload = run_json(str(self.source), "--baseline", str(self.baseline), cwd=self.dir)
        self.assertEqual(code, 0)
        self.assertEqual(payload["findings"], [])
        self.assertEqual(len(payload["paid"]), 1, "debt repaid is reported, so the trend is visible")

    def test_ids_survive_code_moving_down_the_file(self) -> None:
        self.accept()
        before = json.loads(self.baseline.read_text())["findings"]
        self.source.write_text("// a new header comment\n\n\n" + FLAWED)
        proc = run(str(self.source), "--update-baseline", "--baseline", str(self.baseline), cwd=self.dir)
        self.assertEqual(proc.returncode, 0)
        after = json.loads(self.baseline.read_text())["findings"]
        self.assertEqual(sorted(before), sorted(after), "a ratchet whose ids move is a ratchet nobody keeps")

    def test_weights_are_the_files_churn(self) -> None:
        # The book's C = sum(c_p * t_p): a flaw in a file nobody touches costs
        # less than the same flaw in the file every change goes through.
        if shutil.which("git") is None:
            self.skipTest("git is not available")
        self.source.write_text(FLAWED)
        for command in (
            ["git", "init", "-q"],
            ["git", "add", "-A"],
            ["git", "-c", "user.email=t@example.com", "-c", "user.name=t", "commit", "-qm", "one"],
        ):
            subprocess.run(command, cwd=self.dir, capture_output=True, check=True)
        _, payload = run_json(str(self.source), cwd=self.dir)
        self.assertEqual(payload["count"], 1)
        self.assertEqual(payload["findings"][0]["weight"], 1, "one commit in the window is one unit of churn")


class CrossModuleTest(unittest.TestCase):
    """The flags that exist only in the relationship between two modules.

    Every one of them is filed once per fact, not once per file that holds it:
    a value in two modules is one finding naming both, a shape four modules
    declare is one finding, and a chain of forwards is one finding at its head.
    A ratchet that multiplies one design decision into six findings teaches the
    team to ignore it.
    """

    def setUp(self) -> None:
        code, self.payload = run_json(str(LEAKS))
        self.assertEqual(code, 0, "report-only mode never fails")
        self.grouped = by_flag(self.payload)

    def test_a_value_written_in_two_modules_is_one_finding_naming_both(self) -> None:
        literals = {finding["symbol"]: finding for finding in self.grouped["leaked-literal"]}
        self.assertEqual(set(literals), {"string:#223355", "number:2500", "string:#3344ff"})
        shade = literals["string:#223355"]
        self.assertEqual(basenames(shade), ["page-a.ts", "page-b.ts"], "page-b writes the value twice inside itself; one value, one finding")
        self.assertEqual((basename(shade), shade["line"]), ("page-a.ts", 6), "filed where the value is first written")
        self.assertEqual(shade["measure"], "2 modules")
        self.assertEqual(literals["string:#3344ff"]["measure"], "2 modules")

    def test_a_value_with_one_owner_is_not_a_leak(self) -> None:
        # #4477aa and #5566aa are the book's central places: written once, used
        # everywhere. A detector that reports them reports every constant there
        # is, because a constant is a value with one owner.
        reported = {finding["symbol"] for finding in self.grouped["leaked-literal"]}
        self.assertNotIn("string:#4477aa", reported)
        self.assertNotIn("string:#5566aa", reported)

    def test_a_directive_and_a_layout_fraction_are_not_values(self) -> None:
        # page-a and page-b both open with `"use client"` and both scale by 1.5.
        # The first is the framework talking to the bundler and the second is the
        # padding of every UI on earth; a flag that reports either one reports a
        # real tree's whole surface. Found on a 338-file TypeScript tree, where
        # `"use client"` appeared in forty-nine modules and 1.5 in thirty-one.
        reported = {finding["symbol"] for finding in self.grouped["leaked-literal"]}
        self.assertNotIn("string:use client", reported)
        self.assertNotIn("number:1.5", reported)

    def test_an_import_specifier_is_not_a_leaked_literal(self) -> None:
        # page-a and page-b both say "./banner": two modules agreeing about where
        # something lives, which is not the same as knowing the same fact.
        for finding in self.grouped["leaked-literal"]:
            self.assertNotIn("banner", finding["symbol"])

    def test_a_shape_two_modules_declare_is_one_finding_not_one_per_pair(self) -> None:
        shapes = self.grouped["leaked-shape"]
        self.assertEqual(len(shapes), 2, "a near-miss shape must not be merged into either cluster")
        ts = next(finding for finding in shapes if basename(finding) == "format-reader.ts")
        py = next(finding for finding in shapes if basename(finding) == "py_reader.py")
        self.assertEqual(basenames(ts), ["format-reader.ts", "format-writer.ts"])
        self.assertEqual(ts["measure"], "4 fields, 2 modules")
        self.assertEqual(basenames(py), ["py_reader.py", "py_writer.py"])
        self.assertEqual(py["measure"], "6 fields, 2 modules")

    def test_a_shape_that_merely_overlaps_is_a_different_shape(self) -> None:
        # WriteStats shares three of FileHeader's four fields and adds two of
        # its own; the Python records are wider still. Both fall under the
        # overlap ratio, so neither joins the other's cluster.
        for finding in self.grouped["leaked-shape"]:
            self.assertNotIn("writtenAt", finding["symbol"])
            self.assertEqual(
                len({name.rsplit(".", 1)[-1] for name in basenames(finding)}), 1,
                "a four-field shape and a six-field one are two shapes, not one cluster across languages",
            )

    def test_a_chain_of_forwards_is_one_finding_at_its_head(self) -> None:
        self.assertEqual(len(self.grouped["forwarded-parameter"]), 1)
        chain = self.grouped["forwarded-parameter"][0]
        self.assertEqual((basename(chain), chain["line"]), ("chain-a.ts", 3))
        self.assertEqual(chain["measure"], "3 hops")
        self.assertEqual(
            basenames(chain), ["chain-a.ts", "chain-b.ts", "chain-c.ts"],
            "the path is the finding, because collapsing it is the fix",
        )

    def test_two_hops_are_not_a_chain(self) -> None:
        self.assertNotIn("chain-short.ts", [finding["file"] for finding in self.grouped["forwarded-parameter"]])
        self.assertEqual(
            len(self.grouped["pass-through"]), 5,
            "each hop is also a pass-through: the chain is the new flag, its hops are the old one",
        )

    def test_an_export_nobody_takes_is_reported_and_a_taken_one_is_not(self) -> None:
        exports = {finding["symbol"]: finding for finding in self.grouped["needless-export"]}
        self.assertEqual(set(exports), {"unusedBannerHelper", "unused_shade_helper"})
        self.assertEqual(exports["unusedBannerHelper"]["measure"], "0 importers")
        self.assertNotIn("bannerStyle", exports, "page-a takes it")
        self.assertNotIn("shade_for", exports, "py_page_a takes it")

    def test_a_module_nobody_imports_has_no_interface_to_judge(self) -> None:
        self.assertEqual(len(self.grouped["needless-export"]), 2, "only modules someone imports are judged")
        self.assertNotIn("page-a.ts", [basename(finding) for finding in self.grouped["needless-export"]])

    def test_a_cross_module_finding_is_accepted_by_the_ratchet_like_any_other(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            baseline = Path(tmp) / "baseline.json"
            self.assertEqual(run(str(LEAKS), "--update-baseline", "--baseline", str(baseline)).returncode, 0)
            code, payload = run_json(str(LEAKS), "--baseline", str(baseline))
            self.assertEqual(code, 0)
            self.assertEqual(payload["new"], [])
            self.assertNotEqual(payload["findings"], [])


class CoChangeTest(unittest.TestCase):
    """A dependency the code does not declare, read off git history.

    Built in a throwaway repository: the same five commits twice, once with two
    files changing together and nothing between them, once with an import that
    says why they change together.
    """

    def setUp(self) -> None:
        if shutil.which("git") is None:
            self.skipTest("git is not available")
        self._tmp = tempfile.TemporaryDirectory()
        self.dir = Path(self._tmp.name)
        for command in (
            ["git", "init", "-q"],
            ["git", "config", "user.email", "t@example.com"],
            ["git", "config", "user.name", "t"],
        ):
            subprocess.run(command, cwd=self.dir, capture_output=True, check=True)

    def tearDown(self) -> None:
        self._tmp.cleanup()

    def commit(self, message: str) -> None:
        subprocess.run(["git", "add", "-A"], cwd=self.dir, capture_output=True, check=True)
        subprocess.run(["git", "-c", "commit.gpgsign=false", "commit", "-qm", message], cwd=self.dir, capture_output=True, check=True)

    def coupling(self) -> list[dict]:
        _, payload = run_json(".", cwd=self.dir)
        return [finding for finding in payload["findings"] if finding["flag"] == "co-change-without-import"]

    def test_two_files_that_change_together_without_an_import_are_reported(self) -> None:
        reader, writer = self.dir / "reader.ts", self.dir / "writer.ts"
        for step in range(5):
            reader.write_text(f"export const READER_STEP_{step} = {1000 + step};\n")
            writer.write_text(f"export const WRITER_STEP_{step} = {2000 + step};\n")
            self.commit(f"step {step}")
        found = self.coupling()
        self.assertEqual(len(found), 1)
        self.assertEqual(found[0]["measure"], "5 commits")
        self.assertEqual(sorted(basenames(found[0])), ["reader.ts", "writer.ts"])

    def test_a_declared_import_is_not_a_hidden_dependency(self) -> None:
        reader, writer = self.dir / "reader.ts", self.dir / "writer.ts"
        for step in range(5):
            reader.write_text(f"export const READER_VERSION = {1000 + step};\n")
            writer.write_text(f'import {{ READER_VERSION }} from "./reader";\n\nexport const WRITER_VERSION = {2000 + step};\n')
            self.commit(f"step {step}")
        self.assertEqual(self.coupling(), [], "a dependency the code declares is not the flag")


class ReportTest(unittest.TestCase):
    """The readings, which are ranked and never gated.

    fixture/report holds one file per reading, each with its negative beside it:
    a deep module and a shallow one, an interface with one implementation and an
    interface with two, a method that mixes instance state with a pure run, and
    an entry point next to a method nothing calls. The drift and trend readings
    need history, so they are built in a throwaway repository.
    """

    def setUp(self) -> None:
        code, self.payload = run_json("report", str(REPORT), cwd=ROOT)
        self.assertEqual(code, 0, "the report never fails a build")
        self.sections = self.payload["sections"]

    def test_the_shallow_reading_orders_deep_modules_last(self) -> None:
        rows = self.sections["shallow modules"]
        by_file = {row["location"].split("/")[-1]: row for row in rows}
        self.assertEqual(set(by_file), {"shallow.ts", "ports.ts", "page.tsx", "mixed.ts", "deep.ts"})
        self.assertEqual(rows[0]["location"].split("/")[-1], "shallow.ts", "the shallowest module is read first")
        self.assertEqual(rows[-1]["location"].split("/")[-1], "deep.ts", "the deepest is last")
        self.assertEqual(by_file["deep.ts"]["measure"], "interface 2, impl 13")
        self.assertEqual(by_file["shallow.ts"]["measure"], "interface 4, impl 2")

    def test_a_class_method_counts_towards_the_interface_of_its_module(self) -> None:
        # Neither `computeTotal` nor `isEmpty` says `export`: the class does.
        # Reading only the method lines would find no interface here at all,
        # which is how the first version of this table came back empty.
        rows = {row["location"].split("/")[-1]: row for row in self.sections["shallow modules"]}
        self.assertIn("deep.ts", rows)
        self.assertEqual(rows["deep.ts"]["subject"], "1 public", "the private format/suffix methods are not interface")

    def test_an_interface_with_one_implementation_is_read_and_two_are_not(self) -> None:
        rows = self.sections["single-implementation abstractions"]
        self.assertEqual([row["subject"] for row in rows], ["Store"])
        self.assertEqual(rows[0]["measure"], "1 implementation")

    def test_a_pure_run_inside_a_method_that_uses_instance_state_is_a_candidate(self) -> None:
        rows = self.sections["pure blocks worth extracting"]
        self.assertEqual({row["location"] for row in rows}, {f"{REPORT}/mixed.ts:5", f"{REPORT}/mixed.ts:12"})
        self.assertEqual({row["measure"] for row in rows}, {"3 statements"})
        self.assertNotIn("deep.ts", " ".join(row["location"] for row in rows), "a method that never touches instance state is already pure")

    def test_a_default_export_is_not_a_deletion_candidate_and_an_orphan_is(self) -> None:
        subjects = {row["subject"] for row in self.sections["deletion candidates"]}
        self.assertIn("orphanedHelper", subjects)
        self.assertNotIn("Page", subjects, "the framework calls a default export; no name in the tree ever will")

    def test_the_trend_file_is_appended_and_read_back(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            trend = Path(tmp) / "trend.jsonl"
            first = run_json("report", str(REPORT), "--record", str(trend), cwd=ROOT)
            self.assertEqual(first[0], 0)
            second = run_json("report", str(REPORT), "--record", str(trend), cwd=ROOT)
            snapshots = second[1]["trend"]
            self.assertEqual(len(snapshots), 2, "append-only: two runs, two snapshots")
            self.assertEqual(snapshots[0]["findings"], snapshots[1]["findings"])
            self.assertIn("shallow-method", json.dumps(snapshots[0]["flags"]))
            # A corrupt line is skipped rather than losing the history around it.
            with trend.open("a") as handle:
                handle.write("not json\n")
            third = run_json("report", str(REPORT), "--record", str(trend), cwd=ROOT)
            self.assertEqual(len(third[1]["trend"]), 3)

    def test_the_report_without_a_trend_file_says_so(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            proc = run("report", str(REPORT), cwd=Path(tmp))
            self.assertEqual(proc.returncode, 0)
            self.assertIn("no trend yet", proc.stdout)
            self.assertIn("interface = public methods", proc.stdout)

    def test_an_existing_trend_is_shown_without_asking_to_record(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            where = Path(tmp)
            self.assertEqual(run("report", str(REPORT), "--record", cwd=where).returncode, 0)
            proc = run("report", str(REPORT), cwd=where)
            self.assertEqual(proc.returncode, 0)
            self.assertIn("trend  1 snapshots", proc.stdout, "reading the trend needs no --record")


class DriftTest(unittest.TestCase):
    """Complexity is incremental: invisible at one commit, obvious across eight."""

    def setUp(self) -> None:
        if shutil.which("git") is None:
            self.skipTest("git is not available")
        self._tmp = tempfile.TemporaryDirectory()
        self.dir = Path(self._tmp.name)
        for command in (
            ["git", "init", "-q"],
            ["git", "config", "user.email", "t@example.com"],
            ["git", "config", "user.name", "t"],
        ):
            subprocess.run(command, cwd=self.dir, capture_output=True, check=True)

    def tearDown(self) -> None:
        self._tmp.cleanup()

    def commit(self, message: str) -> None:
        subprocess.run(["git", "add", "-A"], cwd=self.dir, capture_output=True, check=True)
        subprocess.run(["git", "-c", "commit.gpgsign=false", "commit", "-qm", message], cwd=self.dir, capture_output=True, check=True)

    def test_a_file_that_grew_is_reported_with_its_delta(self) -> None:
        growing = self.dir / "growing.ts"
        stable = self.dir / "stable.ts"
        stable.write_text("export function stable(value: number): number {\n  return value + 1;\n}\n")
        for step in range(4):
            body = "".join(f"  const step{index} = {index};\n" for index in range(step + 1))
            growing.write_text(f"export function grow(value: number): number {{\n{body}  return value;\n}}\n")
            self.commit(f"step {step}")
        code, payload = run_json("report", ".", cwd=self.dir)
        self.assertEqual(code, 0)
        rows = {row["location"]: row for row in payload["sections"]["complexity drift"]}
        self.assertIn("growing.ts", rows)
        self.assertIn("→", rows["growing.ts"]["measure"])
        self.assertNotEqual(rows["growing.ts"]["measure"].split("(")[1], "0)", "four commits of growth is not zero growth")
        self.assertIn("(+0)", rows["stable.ts"]["measure"], "a file nobody edited did not drift")


if __name__ == "__main__":
    unittest.main(verbosity=2)
