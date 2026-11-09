"""Task 3: priorities. Regressions from tasks 1-2 included."""
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
if run("add", "Low one", "--priority", "low").stdout.strip() != "1":
    fail("add --priority low should print 1")
if run("add", "Urgent one", "--priority", "high").stdout.strip() != "2":
    fail("add --priority high should print 2")
if run("add", "Plain one").stdout.strip() != "3":
    fail("plain add should print 3")

if [row["priority"] for row in rows(run("list"))] != ["low", "high", "normal"]:
    fail(f"priority column should read low,high,normal, got {rows(run('list'))}")

sorted_rows = rows(run("list", "--sort", "priority"))
if [row["title"] for row in sorted_rows] != ["Urgent one", "Plain one", "Low one"]:
    fail(f"--sort priority should be high,normal,low, got {sorted_rows}")

run("done", "2")
if [row["title"] for row in rows(run("list", "--open", "--sort", "priority"))] != ["Plain one", "Low one"]:
    fail(f"--open and --sort should combine, got {rows(run('list', '--open', '--sort', 'priority'))}")

print("ok")
