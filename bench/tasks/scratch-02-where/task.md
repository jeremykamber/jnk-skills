# Filtering

`csvq` picks columns. Add filtering.

`./csvq <file> <columns> --where <col>=<value>`

- Every `--where` that is given must match for a row to be printed, and the flag
  may be given more than once.
- Filtering happens before column selection, so `--where` may name a column that
  is not in `<columns>`.
- `<value>` is compared to the field exactly, as text.
- A `--where` naming an unknown column writes a message to stderr and exits 1.
- Without `--where`, behaviour is exactly as it is now.

Example:

```
$ ./csvq people.csv name --where city=London
name
Ada
```
