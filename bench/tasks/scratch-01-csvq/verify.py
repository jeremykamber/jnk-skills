"""Checkpoint 1 from an empty repository: a column picker."""
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import NoReturn

ARGS = [a for a in sys.argv[1:] if not a.startswith("--")]
REPO = Path(ARGS[0])
PEOPLE = "name,age,city\nAda,36,London\nGrace,45,New York\n"


def run(*args: str) -> subprocess.CompletedProcess:
    return subprocess.run(["./csvq", *args], cwd=REPO, capture_output=True, text=True, timeout=120)


def fail(message: str) -> NoReturn:
    print("FAIL:", message)
    sys.exit(1)


if not (REPO / "csvq").is_file():
    fail("there is no ./csvq in the repository")

with tempfile.TemporaryDirectory() as tmp:
    table = Path(tmp) / "people.csv"
    table.write_text(PEOPLE)

    out = run(str(table), "name,city")
    if out.returncode != 0:
        fail(f"a valid run should exit 0, got {out.returncode}: {out.stderr[-400:]}")
    if out.stdout.strip() != "name,city\nAda,London\nGrace,New York":
        fail(f"wrong output: {out.stdout!r}")

    reordered = run(str(table), "city,name")
    if reordered.stdout.strip() != "city,name\nLondon,Ada\nNew York,Grace":
        fail(f"columns should follow the order asked for: {reordered.stdout!r}")

    single = run(str(table), "age")
    if single.stdout.strip() != "age\n36\n45":
        fail(f"one column should work: {single.stdout!r}")

    missing = run(str(Path(tmp) / "nope.csv"), "name")
    if missing.returncode != 1:
        fail(f"a missing file should exit 1, got {missing.returncode}")
    if missing.stdout.strip():
        fail("a failed run should print nothing to stdout")

    unknown = run(str(table), "name,height")
    if unknown.returncode != 1:
        fail(f"an unknown column should exit 1, got {unknown.returncode}")

print("ok")
