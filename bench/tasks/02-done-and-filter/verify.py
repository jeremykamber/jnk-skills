"""Checkpoint 2: done and filtering. Regressions from checkpoint 1."""
import os
import subprocess
import sys
from pathlib import Path

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
        out.append({"id": parts[0], "state": parts[1], "title": parts[-1]})
    return out


def fail(message):
    print("FAIL:", message)
    sys.exit(1)


def seed():
    (REPO / ".tickets.json").unlink(missing_ok=True)
    run("add", "Write report")
    run("add", "Ship it")


# --- this checkpoint -------------------------------------------------------
seed()
done = run("done", "1")
if done.returncode != 0:
    fail(f"done 1 should exit 0, got {done.returncode} {done.stderr[-300:]!r}")
if run("done", "99").returncode != 1:
    fail("done 99 should exit 1")
if [row["title"] for row in rows(run("list", "--open"))] != ["Ship it"]:
    fail(f"list --open should show only Ship it, got {rows(run('list', '--open'))}")

# --- regressions -----------------------------------------------------------
if not ISOLATED:
    seed()
    if [row["title"] for row in rows(run("list"))] != ["Write report", "Ship it"]:
        fail("list should show both tickets in id order")
    if any(row["state"] != "open" for row in rows(run("list"))):
        fail("a new ticket should be open")

print("ok")
