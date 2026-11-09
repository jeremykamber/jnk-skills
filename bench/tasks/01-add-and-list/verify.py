"""Task 1: add and list. Written from the task, not from any implementation."""
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
    print("--- stdout:", run("list").stdout)
    sys.exit(1)


(REPO / ".tickets.json").unlink(missing_ok=True)

first = run("add", "Write report")
if first.returncode != 0 or first.stdout.strip() != "1":
    fail(f"add should print 1, got {first.returncode} {first.stdout!r} {first.stderr[-300:]!r}")

second = run("add", "Ship it")
if second.returncode != 0 or second.stdout.strip() != "2":
    fail(f"second add should print 2, got {second.stdout!r}")

listed = rows(run("list"))
if [row["title"] for row in listed] != ["Write report", "Ship it"]:
    fail(f"list should show both tickets in id order, got {listed}")
if any(row["state"] != "open" for row in listed):
    fail(f"new tickets should be open, got {listed}")
if [row["id"] for row in listed] != ["1", "2"]:
    fail(f"ids should be 1 and 2, got {listed}")

print("ok")
