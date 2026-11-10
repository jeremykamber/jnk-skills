"""Checkpoint 5: import and report. Regressions from checkpoints 1-4."""
import json
import os
import subprocess
import sys
from pathlib import Path
from typing import NoReturn

ARGS = [a for a in sys.argv[1:] if not a.startswith("--")]
ISOLATED = "--isolated" in sys.argv
REPO = Path(ARGS[0])


def run(*args):
    return subprocess.run([sys.executable, "-m", "ticket", *args],
                          cwd=REPO, capture_output=True, text=True, env=dict(os.environ))


def rows(proc):
    out = []
    for line in proc.stdout.strip().splitlines():
        parts = line.split("\t")
        if len(parts) < 3:
            continue
        out.append({"id": parts[0], "state": parts[1], "title": parts[-1],
                    "priority": parts[2] if len(parts) >= 4 else "normal"})
    return out


def fail(message: str) -> NoReturn:
    print("FAIL:", message)
    sys.exit(1)


def seed() -> None:
    (REPO / ".tickets.json").unlink(missing_ok=True)
    (REPO / "feed.jsonl").unlink(missing_ok=True)
    run("add", "Existing")
    (REPO / "feed.jsonl").write_text("\n".join([
        json.dumps({"title": "Existing"}),
        json.dumps({"title": "Ship it", "priority": "high"}),
        json.dumps({"title": "Write report", "due": "2025-03-01"}),
    ]) + "\n")


# --- this checkpoint -------------------------------------------------------
seed()
imported = run("import", "feed.jsonl")
if imported.returncode != 0:
    fail(f"import should exit 0, got {imported.returncode} {imported.stderr[-300:]!r}")

listed = rows(run("list"))
if [row["title"] for row in listed] != ["Existing", "Ship it", "Write report"]:
    fail(f"import should add two and skip the duplicate, got {[r['title'] for r in listed]}")
if [row["id"] for row in listed] != ["1", "2", "3"]:
    fail(f"ids should continue from the existing ticket, got {[r['id'] for r in listed]}")

run("done", "1")
report = run("report", "--json")
if report.returncode != 0:
    fail(f"report --json should exit 0, got {report.returncode} {report.stderr[-300:]!r}")
try:
    payload = json.loads(report.stdout.strip())
except json.JSONDecodeError:
    fail(f"report --json should print one JSON object, got {report.stdout[:200]!r}")

if payload.get("open") != 2 or payload.get("done") != 1:
    fail(f"state counts should be open 2 / done 1, got {payload}")
if payload.get("by_priority") != {"high": 1, "normal": 2, "low": 0}:
    fail(f"by_priority should count every ticket, got {payload.get('by_priority')}")

# --- regressions -----------------------------------------------------------
if not ISOLATED:
    seed()
    if [row["priority"] for row in rows(run("list"))] != ["normal", "high", "normal"]:
        fail("the priority column should still hold")
    if [row["title"] for row in rows(run("list", "--sort", "priority"))] != [
            "Ship it", "Existing", "Write report"]:
        fail("--sort priority should still order high first")
    run("done", "2")
    if [row["title"] for row in rows(run("list", "--open"))] != ["Existing", "Write report"]:
        fail("--open should still filter")

print("ok")
