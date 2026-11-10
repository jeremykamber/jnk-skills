"""Checkpoint 2 from the same repository: filtering, and checkpoint 1 intact."""
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import NoReturn

ARGS = [a for a in sys.argv[1:] if not a.startswith("--")]
ISOLATED = "--isolated" in sys.argv
REPO = Path(ARGS[0])
PEOPLE = "name,age,city\nAda,36,London\nGrace,45,New York\nAlan,41,London\n"


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

    one = run(str(table), "name", "--where", "city=London")
    if one.returncode != 0 or one.stdout.strip() != "name\nAda\nAlan":
        fail(f"one filter should keep both Londoners: {one.returncode} {one.stdout!r} {one.stderr[-300:]!r}")

    two = run(str(table), "name", "--where", "city=London", "--where", "age=41")
    if two.stdout.strip() != "name\nAlan":
        fail(f"two filters should AND: {two.stdout!r}")

    none = run(str(table), "name", "--where", "city=Paris")
    if none.returncode != 0 or none.stdout.strip() != "name":
        fail(f"no matches should still print the header: {none.stdout!r}")

    hidden = run(str(table), "name", "--where", "age=36")
    if hidden.stdout.strip() != "name\nAda":
        fail(f"a filter may name a column that is not selected: {hidden.stdout!r}")

    bad = run(str(table), "name", "--where", "height=180")
    if bad.returncode != 1:
        fail(f"an unknown filter column should exit 1, got {bad.returncode}")

    if not ISOLATED:
        plain = run(str(table), "city,name")
        if plain.stdout.strip() != "city,name\nLondon,Ada\nNew York,Grace\nLondon,Alan":
            fail(f"checkpoint 1 regressed: {plain.stdout!r}")
        missing = run(str(Path(tmp) / "nope.csv"), "name")
        if missing.returncode != 1:
            fail("a missing file should still exit 1")

print("ok")
