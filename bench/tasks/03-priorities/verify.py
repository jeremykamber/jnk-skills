"""Checkpoint 3: priorities. Regressions from checkpoints 1-2."""
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
        out.append({"id": parts[0], "state": parts[1], "title": parts[-1],
                    "priority": parts[2] if len(parts) >= 4 else "normal"})
    return out


def fail(message):
    print("FAIL:", message)
    sys.exit(1)


def seed():
    (REPO / ".tickets.json").unlink(missing_ok=True)
    run("add", "Low one", "--priority", "low")
    run("add", "Urgent one", "--priority", "high")
    run("add", "Plain one")


# --- this checkpoint -------------------------------------------------------
seed()
if [row["priority"] for row in rows(run("list"))] != ["low", "high", "normal"]:
    fail(f"the priority column should read low,high,normal, got {rows(run('list'))}")
if [row["title"] for row in rows(run("list", "--sort", "priority"))] != ["Urgent one", "Plain one", "Low one"]:
    fail("--sort priority should be high, normal, low")
run("done", "2")
if [row["title"] for row in rows(run("list", "--open", "--sort", "priority"))] != ["Plain one", "Low one"]:
    fail("--open and --sort should combine")

# --- regressions -----------------------------------------------------------
if not ISOLATED:
    seed()
    if run("done", "1").returncode != 0:
        fail("done should still exit 0")
    if [row["title"] for row in rows(run("list", "--open"))] != ["Urgent one", "Plain one"]:
        fail("--open should still filter to open tickets")
    if run("done", "99").returncode != 1:
        fail("done 99 should still exit 1")

print("ok")
