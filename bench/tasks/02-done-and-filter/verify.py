"""Task 2: done and filtering. Regressions from task 1 included."""
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
        out.append({"id": parts[0], "state": parts[1], "title": parts[-1],
                    "priority": parts[2] if len(parts) >= 4 else "normal"})
    return out


def fail(message):
    print("FAIL:", message)
    sys.exit(1)


(REPO / ".tickets.json").unlink(missing_ok=True)
if run("add", "Write report").stdout.strip() != "1":
    fail("add should print 1")
if run("add", "Ship it").stdout.strip() != "2":
    fail("add should print 2")

done = run("done", "1")
if done.returncode != 0:
    fail(f"done 1 should exit 0, got {done.returncode} {done.stderr[-300:]!r}")
if run("done", "99").returncode != 1:
    fail("done 99 should exit 1")

open_rows = rows(run("list", "--open"))
if [row["title"] for row in open_rows] != ["Ship it"]:
    fail(f"list --open should show only Ship it, got {open_rows}")

all_rows = rows(run("list"))
if [(row["title"], row["state"]) for row in all_rows] != [("Write report", "done"), ("Ship it", "open")]:
    fail(f"list should show both states, got {all_rows}")

print("ok")
