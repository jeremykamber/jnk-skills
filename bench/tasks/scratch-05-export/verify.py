"""Checkpoint 5: output paths and JSON. Regressions from checkpoints 1-4."""
import json
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


def payload(out: str) -> list:
    try:
        return json.loads(out)
    except json.JSONDecodeError:
        fail(f"--format json should print one JSON array, got {out[:300]!r}")


if not (REPO / "csvq").is_file():
    fail("there is no ./csvq in the repository")

with tempfile.TemporaryDirectory() as tmp:
    table = str(Path(tmp) / "people.csv")
    Path(table).write_text(PEOPLE)

    # --- this checkpoint ---------------------------------------------------
    csv_file = Path(tmp) / "out.csv"
    out = run(table, "name,city", "--out", str(csv_file))
    if out.returncode != 0:
        fail(f"--out should exit 0, got {out.returncode}: {out.stderr[-300:]}")
    if out.stdout.strip():
        fail("--out should print nothing to stdout")
    if csv_file.read_text() != "name,city\nZoe,London\nAda,London\nGrace,New York\nBob,Paris\n":
        fail(f"the file should hold the CSV: {csv_file.read_text()!r}")

    sorted_file = Path(tmp) / "sorted.csv"
    run(table, "name", "--sort", "name", "--out", str(sorted_file))
    if sorted_file.read_text() != "name\nAda\nBob\nGrace\nZoe\n":
        fail(f"--out should carry sorting: {sorted_file.read_text()!r}")

    plain = payload(show(table, "name,city", "--format", "json"))
    if plain != [{"name": "Zoe", "city": "London"}, {"name": "Ada", "city": "London"},
                 {"name": "Grace", "city": "New York"}, {"name": "Bob", "city": "Paris"}]:
        fail(f"json should describe the rows in order: {plain}")
    if list(plain[0]) != ["name", "city"]:
        fail(f"keys should follow output-column order: {list(plain[0])}")

    counted = payload(show(table, "city", "--count", "--format", "json"))
    if counted != [{"city": "London", "count": 2}, {"city": "New York", "count": 1},
                   {"city": "Paris", "count": 1}]:
        fail(f"count should be a JSON number: {counted}")
    if not isinstance(counted[0]["count"], int):
        fail(f"count should be an integer, got {type(counted[0]['count']).__name__}")

    summed = payload(show(table, "city", "--sum", "age", "--format", "json"))
    if summed != [{"city": "London", "sum_age": 81}, {"city": "New York", "sum_age": 41},
                  {"city": "Paris", "sum_age": 29}]:
        fail(f"sum should be a JSON number: {summed}")

    json_file = Path(tmp) / "out.json"
    out = run(table, "city", "--format", "json", "--out", str(json_file))
    if out.stdout.strip():
        fail("--out should print nothing to stdout, whatever the format")
    try:
        written = json.loads(json_file.read_text())
    except json.JSONDecodeError:
        fail(f"the file should hold JSON: {json_file.read_text()[:300]!r}")
    if written != [{"city": "London"}, {"city": "London"}, {"city": "New York"}, {"city": "Paris"}]:
        fail(f"the file should hold the selected rows: {written}")

    explicit = run(table, "name", "--format", "csv")
    if explicit.stdout.strip() != "name\nZoe\nAda\nGrace\nBob":
        fail(f"--format csv is the default: {explicit.stdout!r}")

    unknown = run(table, "name", "--format", "xml")
    if unknown.returncode != 1:
        fail(f"an unknown format should exit 1, got {unknown.returncode}")
    if unknown.stdout.strip():
        fail("a failed run should print nothing to stdout")

    unwritable = run(table, "name", "--out", str(Path(tmp) / "no" / "such" / "out.csv"))
    if unwritable.returncode != 1:
        fail(f"an unwritable path should exit 1, got {unwritable.returncode}")
    if unwritable.stdout.strip():
        fail("a failed run should print nothing to stdout")

    filtered = Path(tmp) / "filtered.csv"
    run(table, "name", "--where", "city=London", "--out", str(filtered))
    if filtered.read_text() != "name\nZoe\nAda\n":
        fail(f"--out should carry filtering: {filtered.read_text()!r}")

    # --- regressions -------------------------------------------------------
    if not ISOLATED:
        if show(table, "name", "--sort", "city", "--sort", "name") != "name\nAda\nZoe\nGrace\nBob":
            fail(f"checkpoint 3 regressed: {show(table, 'name', '--sort', 'city', '--sort', 'name')!r}")
        if show(table, "city", "--count") != "city,count\nLondon,2\nNew York,1\nParis,1":
            fail(f"checkpoint 4 regressed: {show(table, 'city', '--count')!r}")
        if show(table, "name", "--where", "city=London") != "name\nZoe\nAda":
            fail(f"checkpoint 2 regressed: {show(table, 'name', '--where', 'city=London')!r}")

print("ok")
