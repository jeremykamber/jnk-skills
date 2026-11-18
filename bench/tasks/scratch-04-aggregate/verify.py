"""Checkpoint 4: aggregation. Regressions from checkpoints 1-3."""
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import NoReturn

ARGS = [a for a in sys.argv[1:] if not a.startswith("--")]
ISOLATED = "--isolated" in sys.argv
REPO = Path(ARGS[0])
PEOPLE = "name,age,city\nZoe,36,London\nAda,45,London\nGrace,41,New York\nBob,29,Paris\n"
LEDGER = "k,v\na,-3\na,10\nb,4\n"


def run(*args: str) -> subprocess.CompletedProcess:
    return subprocess.run(["./csvq", *args], cwd=REPO, capture_output=True, text=True, timeout=120)


def fail(message: str) -> NoReturn:
    print("FAIL:", message)
    sys.exit(1)


def show(table: str, *args: str) -> str:
    out = run(table, *args)
    if out.returncode != 0:
        fail(f"{' '.join(args)} should exit 0, got {out.returncode}: {out.stderr[-300:]}")
    return out.stdout.strip()


if not (REPO / "csvq").is_file():
    fail("there is no ./csvq in the repository")

with tempfile.TemporaryDirectory() as tmp:
    table = str(Path(tmp) / "people.csv")
    Path(table).write_text(PEOPLE)
    ledger = str(Path(tmp) / "ledger.csv")
    Path(ledger).write_text(LEDGER)

    # --- this checkpoint ---------------------------------------------------
    if show(table, "city", "--count") != "city,count\nLondon,2\nNew York,1\nParis,1":
        fail(f"--count should merge equal selections: {show(table, 'city', '--count')!r}")

    if show(table, "city", "--sum", "age") != "city,sum_age\nLondon,81\nNew York,41\nParis,29":
        fail(f"--sum should total per group: {show(table, 'city', '--sum', 'age')!r}")

    if show(table, "city", "--count", "--sum", "age") != (
            "city,count,sum_age\nLondon,2,81\nNew York,1,41\nParis,1,29"):
        fail(f"appended columns should follow flag order: {show(table, 'city', '--count', '--sum', 'age')!r}")

    if show(table, "city", "--sum", "age", "--count") != (
            "city,sum_age,count\nLondon,81,2\nNew York,41,1\nParis,29,1"):
        fail(f"reversed flags should reverse the columns: {show(table, 'city', '--sum', 'age', '--count')!r}")

    if show(table, "city", "--where", "city=London", "--count") != "city,count\nLondon,2":
        fail(f"filtering should happen before merging: {show(table, 'city', '--where', 'city=London', '--count')!r}")

    if show(table, "city", "--where", "city=Nowhere", "--count") != "city,count":
        fail(f"no matches should print the header alone: {show(table, 'city', '--where', 'city=Nowhere', '--count')!r}")

    if show(table, "city", "--count", "--sort", "-city") != "city,count\nParis,1\nNew York,1\nLondon,2":
        fail(f"--sort should order the merged rows: {show(table, 'city', '--count', '--sort', '-city')!r}")

    if show(table, "city,name", "--count") != (
            "city,name,count\nLondon,Zoe,1\nLondon,Ada,1\nNew York,Grace,1\nParis,Bob,1"):
        fail(f"distinct selections should not merge: {show(table, 'city,name', '--count')!r}")

    if show(ledger, "k", "--sum", "v") != "k,sum_v\na,7\nb,4":
        fail(f"negative integers should sum: {show(ledger, 'k', '--sum', 'v')!r}")

    bad = run(table, "city", "--sum", "name")
    if bad.returncode != 1:
        fail(f"summing a non-integer column should exit 1, got {bad.returncode}")
    if bad.stdout.strip():
        fail("a failed run should print nothing to stdout")

    unknown = run(table, "city", "--sum", "height")
    if unknown.returncode != 1:
        fail(f"an unknown summed column should exit 1, got {unknown.returncode}")

    # --- regressions -------------------------------------------------------
    if not ISOLATED:
        if show(table, "name,city") != "name,city\nZoe,London\nAda,London\nGrace,New York\nBob,Paris":
            fail(f"checkpoint 1 regressed: {show(table, 'name,city')!r}")
        if show(table, "name", "--where", "city=London") != "name\nZoe\nAda":
            fail(f"checkpoint 2 regressed: {show(table, 'name', '--where', 'city=London')!r}")
        if show(table, "name", "--sort", "city", "--sort", "name") != "name\nAda\nZoe\nGrace\nBob":
            fail(f"checkpoint 3 regressed: {show(table, 'name', '--sort', 'city', '--sort', 'name')!r}")

print("ok")
