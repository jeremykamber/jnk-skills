# ticket

A small command-line issue tracker. Python 3, standard library only. Run it as
`python3 -m ticket <command>` from the repository root. Output is tab-separated,
one record per line. State lives in `.tickets.json`, which is git-ignored.

## Commands

- Test: `python3 -m unittest discover -s tests`
- Run: `python3 -m ticket <command>`
- Syntax: `python3 -m compileall -q ticket.py`

## Conventions

- Standard library only. No new dependencies.
- One module per concern; keep the CLI thin and put behavior in importable functions.
- Every behavior gets a test in `tests/`, written to fail first.
- Commit when a change works, one coherent commit per change.
