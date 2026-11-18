# Aggregating

Two flags that collapse repeated rows.

`./csvq <file> <columns> --count`

`./csvq <file> <columns> --sum <col>`

- `--count` appends a `count` column. Rows whose selected values are identical
  become one output row, placed where the first of them was in the input.
- `--sum <col>` appends a `sum_<col>` column: the total of that column over the
  merged rows. It may name a column that is not in `<columns>`.
- Both flags may be given together. Appended columns appear in the order the
  flags appeared on the command line: `--sum age --count` gives `sum_age,count`,
  and `--count --sum age` gives `count,sum_age`.
- A summed field must be an integer, optionally negative. A field that is not
  writes a message to stderr and exits 1, with nothing written to stdout.
- `--where` filters before merging. `--sort` orders the merged output, and may
  name any column of `<columns>`.
- With no matching rows, the header line alone is printed.
- Without `--count` or `--sum`, behaviour is exactly as it is now.

Example:

```
$ cat people.csv
name,age,city
Zoe,36,London
Ada,45,London
Grace,41,New York

$ ./csvq people.csv city --count --sum age
city,count,sum_age
London,2,81
New York,1,41
```
