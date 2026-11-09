"""Task 5: import and report. Regressions from tasks 1-4 included."""
import json
import os
import subprocess
import sys
from pathlib import Path
from typing import NoReturn

REPO = Path(sys.argv[1])


def run(*args, env=None):
    environ = dict(os.environ)
    environ.update(env or {})
    return subprocess.run([sys.executable, "-m", "ticket", *args],
                          cwd=REPO, capture_output=True, text=True, env=environ)


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


(REPO / ".tickets.json").unlink(missing_ok=True)
if run("add", "Existing").stdout.strip() != "1":
    fail("add should print 1")

feed = REPO / "feed.jsonl"
feed.write_text("\n".join([
    json.dumps({"title": "Existing"}),
    json.dumps({"title": "Ship it", "priority": "high"}),
    json.dumps({"title": "Write report", "due": "2025-03-01"}),
]) + "\n")

imported = run("import", "feed.jsonl")
if imported.returncode != 0:
    fail(f"import should exit 0, got {imported.returncode} {imported.stderr[-300:]!r}")

listed = rows(run("list"))
titles = [row["title"] for row in listed]
if titles != ["Existing", "Ship it", "Write report"]:
    fail(f"import should add two and skip the duplicate, got {titles}")
if [row["id"] for row in listed] != ["1", "2", "3"]:
    fail(f"ids should follow on from the existing ticket, got {[row['id'] for row in listed]}")

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

print("ok")
