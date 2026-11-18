"""Checkpoint 3: sorting. Regressions from checkpoints 1-2."""
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import NoReturn

ARGS = [a for a in sys.argv[1:] if not a.startswith("--")]
ISOLATED = "--isolated" in sys.argv
REPO = Path(ARGS[0])
PEOPLE = "name,age,city\nZoe,36,London\nAda,45,London\nGrace,41,New York\nBob,29,Paris\n"


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

    # --- this checkpoint ---------------------------------------------------
    if show(table, "name") != "name\nZoe\nAda\nGrace\nBob":
        fail(f"without --sort the input order should hold: {show(table, 'name')!r}")

    if show(table, "name", "--sort", "name") != "name\nAda\nBob\nGrace\nZoe":
        fail(f"--sort name should order ascending: {show(table, 'name', '--sort', 'name')!r}")

    if show(table, "name", "--sort", "-name") != "name\nZoe\nGrace\nBob\nAda":
        fail(f"--sort -name should order descending: {show(table, 'name', '--sort', '-name')!r}")

    if show(table, "name", "--sort", "city", "--sort", "name") != "name\nAda\nZoe\nGrace\nBob":
        fail(f"a second key should break ties: {show(table, 'name', '--sort', 'city', '--sort', 'name')!r}")

    if show(table, "name", "--sort", "-city") != "name\nBob\nGrace\nZoe\nAda":
        fail(f"descending should reverse the key, not the tie order: {show(table, 'name', '--sort', '-city')!r}")

    if show(table, "name", "--sort", "age") != "name\nBob\nZoe\nGrace\nAda":
        fail(f"keys compare as text, never as numbers: {show(table, 'name', '--sort', 'age')!r}")

    if show(table, "name", "--where", "city=London", "--sort", "-name") != "name\nZoe\nAda":
        fail(f"sorting should follow filtering: {show(table, 'name', '--where', 'city=London', '--sort', '-name')!r}")

    unknown = run(table, "name", "--sort", "height")
    if unknown.returncode != 1:
        fail(f"an unknown sort column should exit 1, got {unknown.returncode}")
    if unknown.stdout.strip():
        fail("a failed run should print nothing to stdout")

    # --- regressions -------------------------------------------------------
    if not ISOLATED:
        if show(table, "city,name") != "city,name\nLondon,Zoe\nLondon,Ada\nNew York,Grace\nParis,Bob":
            fail(f"checkpoint 1 regressed: {show(table, 'city,name')!r}")
        if show(table, "name", "--where", "city=London") != "name\nZoe\nAda":
            fail(f"checkpoint 2 regressed: {show(table, 'name', '--where', 'city=London')!r}")
        missing = run(str(Path(tmp) / "nope.csv"), "name")
        if missing.returncode != 1:
            fail("a missing file should still exit 1")

print("ok")
