#!/usr/bin/env python3
"""Exercise the gates runner's contract.

The runner is the loop primitive: an agent runs it, reads the exit code and the
failure tail, fixes, and runs it again. These tests pin the parts of that
contract the loop depends on — stop-on-first-failure, advisory gates that never
fail the run, gate selection, and the two distinct error exits.
"""

from __future__ import annotations

import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TOOL = ROOT / "tools" / "gates"

CONFIG = {
    "gates": [
        {"name": "first", "run": "echo one"},
        {"name": "second", "run": "echo two"},
        {"name": "third", "run": "echo three"},
    ]
}


def run_gates(cwd: Path, *args: str) -> subprocess.CompletedProcess:
    return subprocess.run(
        [sys.executable, str(TOOL), *args],
        capture_output=True,
        text=True,
        cwd=cwd,
    )


class GatesRunnerTest(unittest.TestCase):
    def setUp(self) -> None:
        self._tmp = tempfile.TemporaryDirectory()
        self.root = Path(self._tmp.name)
        (self.root / "gates.json").write_text(json.dumps(CONFIG))

    def tearDown(self) -> None:
        self._tmp.cleanup()

    def write_config(self, gates: list[dict]) -> None:
        (self.root / "gates.json").write_text(json.dumps({"gates": gates}))

    def statuses(self, payload: dict) -> dict:
        return {r["name"]: r["status"] for r in payload["results"]}

    def test_all_passing_exits_zero(self) -> None:
        proc = run_gates(self.root)
        self.assertEqual(proc.returncode, 0)
        self.assertIn("3 passed, 0 failed", proc.stdout)

    def test_failure_stops_the_run_and_skips_the_rest(self) -> None:
        self.write_config(
            [
                {"name": "first", "run": "echo one"},
                {"name": "boom", "run": "echo exploded >&2; exit 3"},
                {"name": "third", "run": "echo three"},
            ]
        )
        proc = run_gates(self.root, "--json")
        self.assertEqual(proc.returncode, 1)

        payload = json.loads(proc.stdout)
        statuses = self.statuses(payload)
        self.assertEqual(statuses["first"], "ok")
        self.assertEqual(statuses["boom"], "FAIL")
        self.assertEqual(statuses["third"], "skip", "later gates must not run after a failure")

        failed = next(r for r in payload["results"] if r["name"] == "boom")
        self.assertEqual(failed["exit_code"], 3)
        self.assertIn("exploded", failed["output"], "the failure tail is what the agent acts on")

    def test_keep_going_runs_everything_and_still_fails(self) -> None:
        self.write_config(
            [
                {"name": "boom", "run": "exit 1"},
                {"name": "after", "run": "echo reached"},
            ]
        )
        proc = run_gates(self.root, "--keep-going", "--json")
        self.assertEqual(proc.returncode, 1)
        self.assertEqual(self.statuses(json.loads(proc.stdout))["after"], "ok")

    def test_advisory_gate_reports_but_does_not_fail_the_run(self) -> None:
        self.write_config(
            [
                {"name": "mutation", "run": "exit 1", "advisory": True},
                {"name": "types", "run": "echo fine"},
            ]
        )
        proc = run_gates(self.root, "--json")
        self.assertEqual(proc.returncode, 0, "an advisory gate must not fail the run")
        statuses = self.statuses(json.loads(proc.stdout))
        self.assertEqual(statuses["mutation"], "advisory")
        self.assertEqual(statuses["types"], "ok", "an advisory failure must not stop the run")

    def test_gate_can_be_selected_by_name(self) -> None:
        proc = run_gates(self.root, "second", "--json")
        self.assertEqual(proc.returncode, 0)
        names = [r["name"] for r in json.loads(proc.stdout)["results"]]
        self.assertEqual(names, ["second"])

    def test_changed_run_is_used_when_changed_is_passed(self) -> None:
        self.write_config(
            [{"name": "crap", "run": "echo full", "changed_run": "echo scoped"}]
        )
        full = run_gates(self.root, "--json")
        scoped = run_gates(self.root, "--changed", "--json")

        self.assertEqual(json.loads(full.stdout)["results"][0]["command"], "echo full")
        self.assertEqual(json.loads(scoped.stdout)["results"][0]["command"], "echo scoped")

    def test_list_does_not_run_anything(self) -> None:
        marker = self.root / "ran"
        self.write_config([{"name": "side-effect", "run": f"touch {marker}"}])

        proc = run_gates(self.root, "--list")
        self.assertEqual(proc.returncode, 0)
        self.assertIn("1 configured", proc.stdout)
        self.assertIn("touch", proc.stdout)
        self.assertFalse(marker.exists(), "--list must not execute the gates")

    def test_dry_run_prints_commands_only(self) -> None:
        proc = run_gates(self.root, "--dry-run")
        self.assertEqual(proc.stdout.split(), ["echo", "one", "echo", "two", "echo", "three"])

    def test_unknown_gate_exits_two(self) -> None:
        proc = run_gates(self.root, "nope")
        self.assertEqual(proc.returncode, 2)
        self.assertIn("unknown gate", proc.stderr)

    def test_missing_config_exits_two(self) -> None:
        (self.root / "gates.json").unlink()
        proc = run_gates(self.root)
        self.assertEqual(proc.returncode, 2)
        self.assertIn("no gate config", proc.stderr)

    def test_duplicate_gate_names_are_rejected(self) -> None:
        self.write_config([{"name": "a", "run": "true"}, {"name": "a", "run": "true"}])
        proc = run_gates(self.root)
        self.assertEqual(proc.returncode, 2)
        self.assertIn("duplicate gate name", proc.stderr)

    def test_comments_are_allowed_in_the_config(self) -> None:
        (self.root / "gates.json").write_text(
            '{\n  // the cheapest gate\n  "gates": [{"name": "a", "run": "echo http://x" }]\n}\n'
        )
        proc = run_gates(self.root, "--json")
        self.assertEqual(proc.returncode, 0, proc.stderr)
        self.assertEqual(json.loads(proc.stdout)["results"][0]["status"], "ok")


    def test_expect_passes_when_the_output_proves_the_work_happened(self) -> None:
        self.write_config(
            [{"name": "arch", "run": "echo 'found (12 modules, 18 dependencies)'",
              "expect": r"\([1-9][0-9]* modules"}]
        )
        proc = run_gates(self.root, "--json")
        self.assertEqual(proc.returncode, 0)
        self.assertEqual(self.statuses(json.loads(proc.stdout))["arch"], "ok")

    def test_expect_fails_when_the_command_exits_zero_without_doing_the_work(self) -> None:
        # The dep-cruiser silent pass: it cannot load the TypeScript compiler,
        # cruises nothing, prints 0 modules, and exits 0.
        self.write_config(
            [{"name": "arch", "run": "echo 'found (0 modules, 0 dependencies)'",
              "expect": r"\([1-9][0-9]* modules"}]
        )
        proc = run_gates(self.root, "--json")
        self.assertEqual(proc.returncode, 1, "an exit code of 0 must not be enough to pass")
        payload = json.loads(proc.stdout)
        self.assertEqual(self.statuses(payload)["arch"], "FAIL")
        self.assertIn("did not match", payload["results"][0]["notes"][0])

    def test_reject_fails_when_the_output_carries_a_broken_tool_signature(self) -> None:
        self.write_config(
            [{"name": "mutation", "run": "echo 'Ran 0.00 tests per mutant on average.'",
              "reject": r"Ran 0\.00 tests per mutant"}]
        )
        proc = run_gates(self.root, "--json")
        self.assertEqual(proc.returncode, 1)
        payload = json.loads(proc.stdout)
        self.assertEqual(self.statuses(payload)["mutation"], "FAIL")
        self.assertIn("broken tool", payload["results"][0]["notes"][0])

    def test_reject_fires_even_when_the_command_already_failed(self) -> None:
        # Stryker exits non-zero below its floor and says "improve mutation
        # score". When the real cause is a broken runner, the note must say so,
        # or the agent rewrites tests that were already correct.
        self.write_config(
            [{"name": "mutation", "run": "echo 'Ran 0.00 tests per mutant' && exit 1",
              "reject": r"Ran 0\.00 tests per mutant"}]
        )
        proc = run_gates(self.root, "--json")
        payload = json.loads(proc.stdout)
        self.assertEqual(payload["results"][0]["status"], "FAIL")
        self.assertIn("broken tool", payload["results"][0]["notes"][0])

    def test_assertions_are_not_applied_to_a_command_that_already_failed(self) -> None:
        # A non-zero exit is the failure; the assertion must not mask or
        # double-report it.
        self.write_config(
            [{"name": "arch", "run": "echo 'found (0 modules)' && exit 3",
              "expect": r"\([1-9][0-9]* modules"}]
        )
        proc = run_gates(self.root, "--json")
        payload = json.loads(proc.stdout)
        self.assertEqual(payload["results"][0]["exit_code"], 3)
        self.assertEqual(payload["results"][0]["notes"], [])

    def test_an_advisory_gate_that_fails_its_assertion_does_not_fail_the_run(self) -> None:
        self.write_config(
            [{"name": "dry", "run": "echo 'nothing'", "advisory": True,
              "expect": r"impossible"}]
        )
        proc = run_gates(self.root, "--json")
        self.assertEqual(proc.returncode, 0)
        self.assertEqual(self.statuses(json.loads(proc.stdout))["dry"], "advisory")

    def test_an_invalid_assertion_regex_is_a_config_error(self) -> None:
        self.write_config([{"name": "arch", "run": "true", "expect": "([unclosed"}])
        proc = run_gates(self.root)
        self.assertEqual(proc.returncode, 2, "a broken regex is a broken config, not a failed gate")
        self.assertIn("invalid expect regex", proc.stderr)

    def test_list_shows_the_assertions(self) -> None:
        self.write_config(
            [{"name": "arch", "run": "true", "expect": "modules", "reject": "0 modules"}]
        )
        proc = run_gates(self.root, "--list")
        self.assertIn("expect /modules/", proc.stdout)
        self.assertIn("reject /0 modules/", proc.stdout)


    def test_init_writes_the_stack_and_its_companion_configs(self) -> None:
        (self.root / "package.json").write_text("{}")
        proc = run_gates(self.root, "--init")
        self.assertEqual(proc.returncode, 0)
        self.assertTrue((self.root / "gates.json").is_file())
        # The dotfile name is the whole point: a plain copy gives depcruise a
        # file it cannot find, and the gate then cruises nothing.
        self.assertTrue((self.root / ".dependency-cruiser.cjs").is_file())
        self.assertTrue((self.root / "stryker.conf.cjs").is_file())

    def test_init_leaves_an_existing_stack_alone(self) -> None:
        (self.root / "package.json").write_text("{}")
        run_gates(self.root, "--init")
        mine = '{"gates": [{"name": "mine", "run": "true"}]}'
        (self.root / "gates.json").write_text(mine)
        proc = run_gates(self.root, "--init")
        self.assertEqual(proc.returncode, 0)
        self.assertEqual((self.root / "gates.json").read_text(), mine)
        self.assertIn("kept", proc.stdout)

    def test_init_force_overwrites(self) -> None:
        (self.root / "package.json").write_text("{}")
        (self.root / "gates.json").write_text('{"gates": [{"name": "mine", "run": "true"}]}')
        proc = run_gates(self.root, "--init", "--force")
        self.assertEqual(proc.returncode, 0)
        self.assertNotIn("mine", (self.root / "gates.json").read_text())

    def test_init_refuses_to_guess_without_a_project_to_read(self) -> None:
        proc = run_gates(self.root, "--init")
        self.assertEqual(proc.returncode, 2)
        self.assertIn("cannot infer", proc.stderr)

    def test_init_rejects_an_unknown_adapter(self) -> None:
        proc = run_gates(self.root, "--init", "--adapter", "cobol")
        self.assertEqual(proc.returncode, 2)
        self.assertIn("adapters available", proc.stderr)

    def test_list_flags_companion_configs_that_are_absent(self) -> None:
        (self.root / "gates.json").write_text(json.dumps({
            "files": [{"from": "dependency-cruiser.cjs", "to": ".dependency-cruiser.cjs"}],
            "gates": [{"name": "arch", "run": "true"}],
        }))
        proc = run_gates(self.root, "--list")
        self.assertEqual(proc.returncode, 0)
        self.assertIn("missing", proc.stdout)
        self.assertIn(".dependency-cruiser.cjs", proc.stdout)


if __name__ == "__main__":
    unittest.main(verbosity=2)
