# Import and report

Two more commands, on top of everything the CLI already does.

`python3 -m ticket import <file.jsonl>` reads one ticket per line:

```json
{"title": "Ship it", "priority": "high", "due": "2025-03-01"}
```

`priority` and `due` are optional. Each imported ticket gets the next id, in file
order. A ticket whose title already exists is skipped, not duplicated. It prints
how many were added and how many were skipped.

`python3 -m ticket report --json` prints one JSON object on one line:

```json
{"open": 2, "done": 1, "by_priority": {"high": 1, "normal": 2, "low": 0}}
```

`by_priority` counts every ticket, whatever its state. Counts are integers, and
every priority key is present even at zero.

Read the README first; the rules there apply.
