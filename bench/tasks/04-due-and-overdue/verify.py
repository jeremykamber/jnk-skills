"""Checkpoint 4: due dates and overdue. Regressions from checkpoints 1-3."""
import os
import subprocess
import sys
from pathlib import Path

ARGS = [a for a in sys.argv[1:] if not a.startswith("--")]
ISOLATED = "--isolated" in sys.argv
REPO = Path(ARGS[0])
TODAY = {"TICKET_TODAY": "2025-01-01"}


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


def seed():
    (REPO / ".tickets.json").unlink(missing_ok=True)
    run("add", "Old one", "--due", "2020-01-01")
    run("add", "Future one", "--due", "2999-01-01")
    run("add", "No date")


# --- this checkpoint -------------------------------------------------------
seed()
overdue = rows(run("list", "--overdue", env=TODAY))
if [row["title"] for row in overdue] != ["Old one"]:
    fail(f"--overdue should show only Old one, got {overdue}")
if len(rows(run("list", env=TODAY))) != 3:
    fail("list should still show all three tickets")
run("done", "1")
if rows(run("list", "--overdue", env=TODAY)) != []:
    fail("a done ticket is not overdue")

# --- regressions -----------------------------------------------------------
if not ISOLATED:
    seed()
    if [row["title"] for row in rows(run("list", "--open", env=TODAY))] != ["Old one", "Future one", "No date"]:
        fail("--open should still work")
    if [row["title"] for row in rows(run("list", "--sort", "priority", env=TODAY))] != [
            "Old one", "Future one", "No date"]:
        fail("--sort priority should still work with all-normal priorities")
    run("done", "2")
    if [row["title"] for row in rows(run("list", "--open", env=TODAY))] != ["Old one", "No date"]:
        fail("done should still mark a ticket done")

print("ok")
