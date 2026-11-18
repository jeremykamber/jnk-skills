# Ordering

`csvq` picks and filters. Add ordering.

`./csvq <file> <columns> --sort <col>`

- `--sort` may be given more than once; rows are ordered by the named columns,
  in the order given.
- A key is a column name, optionally prefixed with `-` for descending.
- Comparison is exact text comparison of the field, never numeric: `10` comes
  before `9`.
- Ordering is stable: rows equal on every key keep their input order, and a
  descending key reverses that key's order only, never the tie order.
- Sorting happens after `--where` and before column selection, so `--sort` may
  name a column that is not in `<columns>`.
- A `--sort` naming an unknown column writes a message to stderr and exits 1.
- Without `--sort`, behaviour is exactly as it is now.

Example:

```
$ cat people.csv
name,age,city
Zoe,36,London
Ada,45,London
Grace,41,New York

$ ./csvq people.csv name --sort city --sort name
name
Ada
Zoe
Grace
```
