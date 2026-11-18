# Exporting

Where the output goes, and a second format.

- `--out <file>` writes to `<file>` what would have gone to stdout, and prints
  nothing to stdout. The file is created, or replaced if it already exists.
- `--format csv` is the default and changes nothing. `--format json` prints one
  JSON array: an object per output row, keys in output-column order, values as
  strings.
- `count` and `sum_<col>` values are JSON numbers, not strings.
- `--format json --out <file>` writes the JSON to the file.
- An unknown `--format` value, or a path that cannot be written, writes a message
  to stderr and exits 1, with nothing written to stdout.
- Everything else behaves as it does now.

Example:

```
$ ./csvq people.csv name --where city=London --format json
[{"name":"Zoe"},{"name":"Ada"}]
```
