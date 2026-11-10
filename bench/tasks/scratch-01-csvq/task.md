# A column picker

The repository is empty. Build a command-line program called `csvq` in it.

`./csvq <file> <columns>` reads a CSV file and prints the named columns, in the
order asked for, to standard output.

- `<columns>` is a comma-separated list of column names, matched against the
  header row exactly.
- Output is a header line, then one line per input row, comma-separated.
- No quoting rules are needed: this data has no commas or quotes inside fields.
- A missing file, an unreadable file, or an unknown column writes a message to
  standard error and exits 1. Nothing is written to standard output in that case.

`./csvq` must be executable and run with no interpreter named on the command
line — a shebang is fine. Use only the language's standard library.

Example:

```
$ cat people.csv
name,age,city
Ada,36,London
Grace,45,New York

$ ./csvq people.csv name,city
name,city
Ada,London
Grace,New York
```
