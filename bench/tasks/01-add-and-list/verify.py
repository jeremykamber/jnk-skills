"""Checkpoint 1: add and list. There is no earlier checkpoint to regress."""
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


(REPO / ".tickets.json").unlink(missing_ok=True)

if run("add", "Write report").stdout.strip() != "1":
    fail("add should print 1")
if run("add", "Ship it").stdout.strip() != "2":
    fail("add should print 2")

listed = rows(run("list"))
if [(row["id"], row["state"], row["title"]) for row in listed] != [
        ("1", "open", "Write report"), ("2", "open", "Ship it")]:
    fail(f"list should show both tickets in id order, open, got {listed}")

print("ok")
