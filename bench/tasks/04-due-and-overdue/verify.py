"""Task 4: due dates and overdue. Regressions from tasks 1-3 included."""
import os
import subprocess
import sys
from pathlib import Path

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
        out.append({"id": parts[0], "state": parts[1], "title": parts[-1]})
    return out


def fail(message):
    print("FAIL:", message)
    sys.exit(1)


SEED = {"TICKET_TODAY": "2025-01-01"}
(REPO / ".tickets.json").unlink(missing_ok=True)
run("add", "Old one", "--due", "2020-01-01")
run("add", "Future one", "--due", "2999-01-01")
run("add", "No date")

overdue = rows(run("list", "--overdue", env=SEED))
if [row["title"] for row in overdue] != ["Old one"]:
    fail(f"--overdue should show only Old one, got {overdue}")

if len(rows(run("list", env=SEED))) != 3:
    fail("list should still show all three tickets")

run("done", "1")
if rows(run("list", "--overdue", env=SEED)) != []:
    fail("a done ticket is not overdue")

if [row["title"] for row in rows(run("list", "--open", env=SEED))] != ["Future one", "No date"]:
    fail("--open should still work after adding --overdue")

print("ok")
