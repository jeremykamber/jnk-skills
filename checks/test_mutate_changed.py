#!/usr/bin/env python3
"""Pin `mutate-changed` to the decisions that make a scoped run correct.

The tool exists because running Stryker on the whole tree, every time, is the
run people stop doing — and because four parts of a scoped run are easy to get
wrong by hand. Each is pinned here with the failure it prevents:

  the glob             `src/**/*.ts` has to match `src/a.ts` as well as
                       `src/a/b.ts`, because Stryker's patterns are the
                       project's own and a mis-read one silently widens or
                       narrows the mutant set
  the config's scope   `--mutate` on the command line REPLACES the config's
                       `mutate` list, so a scoped run that ignores the
                       exclusions mutates DOM glue and renderers the project
                       left out on purpose, and every survivor it reports is
                       one nobody can kill
  the cache key        two scopes must never share an incremental file: the
                       report is keyed on the mutant, not on what ran, so a
                       scoped run's survivors would be reused by a whole-suite
                       run and read as gaps. The config's own contents are part
                       of the key, because switching `testRunner` in it changes
                       a mutant's verdict without changing the scope
  the leaked tree      an aborted `inPlace` run leaves instrumented source, and
                       the next run then fails its dry run with "There were
                       failed tests in the initial test run", which reads as a
                       broken test suite. The tool must refuse and name the fix

No network, no Stryker, no vitest: every case here is decided before a run
starts. The end-to-end behaviour — that a scoped run reaches the same verdict
as a whole-tree one — is what `checks/test_mutation.sh` proves, opt-in because
it installs a toolchain.
"""

from __future__ import annotations

import importlib.machinery
import importlib.util
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TOOL = ROOT / "tools" / "mutate-changed"


def load_tool():
    loader = importlib.machinery.SourceFileLoader("mutate_changed", str(TOOL))
    spec = importlib.util.spec_from_loader("mutate_changed", loader)
    module = importlib.util.module_from_spec(spec)
    loader.exec_module(module)
    return module


mc = load_tool()

# The patterns a real project in this repo's orbit uses: an include, test files
# out, and three kinds of file left out for reasons a tool cannot see.
PROJECT_PATTERNS = [
    "src/**/*.ts",
    "!src/**/*.test.ts",
    "!src/stage/**",
    "!src/ui/pages/**",
    "!src/adapters/render/renderer.ts",
]


class GlobTest(unittest.TestCase):
    """Stryker's globs, not fnmatch's."""

    def test_double_star_matches_zero_directories(self) -> None:
        # The one that matters: a project writes `src/**/*.ts` meaning `src/x.ts`
        # too, and a matcher that requires a directory drops every top-level file.
        self.assertTrue(mc.glob_match("src/**/*.ts", "src/math.ts"))
        self.assertTrue(mc.glob_match("src/**/*.ts", "src/a/b/c.ts"))

    def test_single_star_stops_at_a_directory(self) -> None:
        self.assertTrue(mc.glob_match("src/*.ts", "src/math.ts"))
        self.assertFalse(mc.glob_match("src/*.ts", "src/a/math.ts"))

    def test_extension_is_not_ignored(self) -> None:
        self.assertFalse(mc.glob_match("src/**/*.ts", "src/x.tsx"))
        self.assertFalse(mc.glob_match("src/**/*.ts", "tests/math.test.ts"))

    def test_brace_and_class(self) -> None:
        self.assertTrue(mc.glob_match("src/*.{ts,tsx}", "src/a.tsx"))
        self.assertTrue(mc.glob_match("src/[ab].ts", "src/b.ts"))
        self.assertFalse(mc.glob_match("src/[ab].ts", "src/c.ts"))


class ScopeTest(unittest.TestCase):
    """The config's list decides, in order, later pattern winning."""

    def test_exclusions_are_dropped_and_the_rest_kept(self) -> None:
        kept, dropped = mc.apply_mutate_scope(
            [
                "src/core/plan/direction.ts",
                "src/ui/pages/home.ts",
                "src/stage/applier.ts",
                "src/adapters/render/renderer.ts",
                "src/math.test.ts",
            ],
            PROJECT_PATTERNS,
        )
        self.assertEqual(kept, ["src/core/plan/direction.ts"])
        self.assertEqual(
            dropped,
            [
                "src/ui/pages/home.ts",
                "src/stage/applier.ts",
                "src/adapters/render/renderer.ts",
                "src/math.test.ts",
            ],
        )

    def test_a_file_outside_the_include_list_is_not_mutated(self) -> None:
        kept, dropped = mc.apply_mutate_scope(["scripts/build.ts"], PROJECT_PATTERNS)
        self.assertEqual(kept, [])
        self.assertEqual(dropped, ["scripts/build.ts"])

    def test_a_later_include_wins_over_an_earlier_exclusion(self) -> None:
        kept, _ = mc.apply_mutate_scope(
            ["src/ui/pages/home.ts"],
            ["src/**/*.ts", "!src/ui/pages/**", "src/ui/pages/home.ts"],
        )
        self.assertEqual(kept, ["src/ui/pages/home.ts"])


class CacheKeyTest(unittest.TestCase):
    """One incremental file per scope, or a scoped survivor is reused as truth."""

    def test_the_same_scope_is_the_same_key(self) -> None:
        first = mc.scope_key(["src/a.ts"], ["src/a.test.ts"], "stryker.conf.cjs")
        second = mc.scope_key(["src/a.ts"], ["src/a.test.ts"], "stryker.conf.cjs")
        self.assertEqual(first, second)

    def test_a_different_test_set_is_a_different_key(self) -> None:
        scoped = mc.scope_key(["src/a.ts"], ["src/a.test.ts"], "stryker.conf.cjs")
        whole = mc.scope_key(["src/a.ts"], None, "stryker.conf.cjs")
        self.assertNotEqual(scoped, whole)

    def test_a_different_mutant_set_is_a_different_key(self) -> None:
        one = mc.scope_key(["src/a.ts"], ["src/a.test.ts"], "stryker.conf.cjs")
        two = mc.scope_key(["src/a.ts", "src/b.ts"], ["src/a.test.ts"], "stryker.conf.cjs")
        self.assertNotEqual(one, two)

    def test_a_changed_config_is_a_different_key(self) -> None:
        command = "npx stryker run stryker.conf.cjs --mutate src/a.ts"
        before = mc.scope_key(["src/a.ts"], ["src/a.test.ts"], command, "aaaaaaaaaaaa")
        after = mc.scope_key(["src/a.ts"], ["src/a.test.ts"], command, "bbbbbbbbbbbb")
        self.assertNotEqual(before, after)


class ConcurrencyTest(unittest.TestCase):
    """Cores are safe only once a mutant runs one test file."""

    def test_whole_suite_leaves_the_config_default_alone(self) -> None:
        self.assertIsNone(mc.concurrency_for(None))

    def test_a_scoped_run_uses_the_cores(self) -> None:
        value = mc.concurrency_for(["src/a.test.ts"])
        self.assertIsNotNone(value)
        self.assertGreaterEqual(value, 1)
        self.assertLessEqual(value, 8)


class RepoTest(unittest.TestCase):
    """The decisions that need a working tree: what changed, what leaked."""

    def setUp(self) -> None:
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        self.git("init", "-q")
        self.git("config", "user.email", "check@example.com")
        self.git("config", "user.name", "check")
        (self.root / "src").mkdir()
        (self.root / "src" / "math.ts").write_text("export const a = 1;\n")
        (self.root / "src" / "math.test.ts").write_text("// a test\n")
        (self.root / "src" / "ignored.ts").write_text("export const b = 2;\n")
        (self.root / "stryker.conf.cjs").write_text(
            "module.exports = { mutate: ['src/**/*.ts', '!src/ignored.ts'] };\n"
        )
        self.git("add", "-A")
        self.git("commit", "-qm", "base")

    def tearDown(self) -> None:
        self.tmp.cleanup()

    def git(self, *args: str) -> None:
        subprocess.run(["git", *args], cwd=self.root, check=True, capture_output=True)

    def test_changed_files_excludes_tests_and_double_counts_nothing(self) -> None:
        (self.root / "src" / "math.ts").write_text("export const a = 2;\n")
        (self.root / "src" / "math.test.ts").write_text("// changed\n")
        (self.root / "src" / "new.ts").write_text("export const c = 3;\n")
        changed = mc.changed_files(self.root, "HEAD", ["src"])
        self.assertEqual(changed, ["src/math.ts", "src/new.ts"])

    def test_the_configs_scope_is_read_from_the_config(self) -> None:
        patterns = mc.config_mutate(self.root, self.root / "stryker.conf.cjs")
        self.assertEqual(patterns, ["src/**/*.ts", "!src/ignored.ts"])

    def test_the_fingerprint_ignores_comments_and_whitespace(self) -> None:
        config = self.root / "stryker.conf.cjs"
        config.write_text("module.exports = { testRunner: 'command' };\n")
        before = mc.config_fingerprint(config)
        config.write_text(
            "/**\n * A comment that says nothing about the run.\n */\n"
            "module.exports = {\n  // a note that says less\n"
            "  testRunner: 'command'\n};\n"
        )
        self.assertEqual(mc.config_fingerprint(config), before)

    def test_the_fingerprint_follows_a_setting(self) -> None:
        config = self.root / "stryker.conf.cjs"
        config.write_text("module.exports = { testRunner: 'command' };\n")
        before = mc.config_fingerprint(config)
        config.write_text("module.exports = { testRunner: 'vitest-fixed' };\n")
        self.assertNotEqual(mc.config_fingerprint(config), before)

    def test_a_missing_config_still_gives_a_stable_key(self) -> None:
        missing = self.root / "nope.conf.cjs"
        self.assertEqual(mc.config_fingerprint(missing), mc.config_fingerprint(missing))

    def test_instrumented_source_is_detected(self) -> None:
        leaked = self.root / "src" / "math.ts"
        leaked.write_text("// @ts-nocheck\nfunction stryNS_1() {}\nexport const a = 1;\n")
        self.assertEqual(mc.instrumented_files(self.root, ["src/math.ts"]), ["src/math.ts"])

    def test_clean_source_is_not_flagged(self) -> None:
        self.assertEqual(mc.instrumented_files(self.root, ["src/math.ts"]), [])

    def cli(self, *args: str) -> subprocess.CompletedProcess:
        return subprocess.run(
            [sys.executable, str(TOOL), *args],
            cwd=self.root, capture_output=True, text=True,
        )

    def test_an_instrumented_tree_is_refused_with_the_fix(self) -> None:
        (self.root / "src" / "math.ts").write_text("function stryNS_1() {}\n")
        proc = self.cli("--dry-run")
        self.assertEqual(proc.returncode, 2)
        self.assertIn("git checkout --", proc.stderr)

    def test_nothing_changed_is_not_a_failure(self) -> None:
        proc = self.cli("--dry-run")
        self.assertEqual(proc.returncode, 0)
        self.assertIn("nothing changed", proc.stdout + proc.stderr)

    def test_the_plan_scopes_to_the_change_and_names_what_it_excludes(self) -> None:
        (self.root / "src" / "math.ts").write_text("export const a = 2;\n")
        (self.root / "src" / "ignored.ts").write_text("export const b = 3;\n")
        proc = self.cli("--dry-run", "--json")
        self.assertEqual(proc.returncode, 0, proc.stderr)
        plan = json.loads(proc.stdout)
        self.assertEqual(plan["files"], ["src/math.ts"])
        self.assertEqual(plan["excluded"], ["src/ignored.ts"])
        self.assertIn("--mutate src/math.ts", plan["command"])
        # The plan is the plan: --dry-run runs nothing.
        self.assertFalse((self.root / "reports").exists())

    def test_every_changed_file_excluded_is_not_a_failure(self) -> None:
        (self.root / "src" / "ignored.ts").write_text("export const b = 3;\n")
        proc = self.cli("--dry-run")
        self.assertEqual(proc.returncode, 0)
        self.assertIn("excluded by the Stryker config", proc.stdout + proc.stderr)

    def test_a_missing_config_is_a_setup_error(self) -> None:
        (self.root / "stryker.conf.cjs").unlink()
        (self.root / "src" / "math.ts").write_text("export const a = 2;\n")
        proc = self.cli("--dry-run")
        self.assertEqual(proc.returncode, 2)
        self.assertIn("no stryker.conf.cjs", proc.stderr)


if __name__ == "__main__":
    unittest.main(verbosity=2)
