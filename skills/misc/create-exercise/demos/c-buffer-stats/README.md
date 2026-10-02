# Statistics over a buffer you are handed a pointer to

Implement `count_above` and `max_value` so that each one reads exactly the `n`
elements it was given, answers the empty case instead of guessing, and never
reads past the buffer.

`src/exercise.c` compiles today. The visible tests fail, and they fail for the
reason the exercise is about.

## What to build

Both functions receive a pointer to the first element and the number of
elements. The length is a parameter because the pointer does not carry one.

`size_t count_above(const int *values, size_t n, int threshold)` returns how
many of the `n` values are strictly greater than `threshold`. A value equal to
the threshold is not above it. With `n` of 0 there is nothing to read, and the
answer is 0.

`int max_value(const int *values, size_t n, int *out)` writes the largest value
through `out` and returns 0. Values may be negative. With `n` of 0 there is no
largest value: return -1 and leave `*out` untouched.

## Why it matters

Every C library that works on buffers has this shape — `read(fd, buf, count)`,
`memcpy`, `qsort` — because a function that receives an array receives only a
pointer to its first element. Whatever length the function needs, the caller
has to hand over.

A statistics helper that tries to recover the length from the pointer instead
reads two elements of a 512-sample window, returns a plausible-looking peak
taken from the wrong data, and reports it as the window's maximum. Nothing
crashes. The number is just wrong, and it is wrong in a way that looks like a
hardware fault.

## Run the tests

```sh
./run.sh
```

`./run.sh` runs `make -s test`, which compiles `src/` with the visible tests in
`tests/` and runs the result. It exits non-zero while any check fails. Add your
own cases to `tests/test_exercise.c` while you work; a case you invented
yourself is the one that catches your own bug.

## What done looks like

- Every check in `tests/` passes and `./run.sh` exits 0.
- The compiler reports no warnings with `-Wall -Wextra`.
- Both functions examine element `n - 1` and read nothing at index `n` or
  beyond, for any `n` from 0 upwards.
- `max_value` returns -1 and writes nothing when `n` is 0, and reports the
  largest value when every value is negative.

## Audience and time

- Written for: CS2 students who have written a few C functions over arrays
- About 40 minutes

## Rules

- C11 and the standard library only. There is nothing to install.
- Keep the signatures in `src/exercise.h` as they are. The tests include that
  header and call the functions through it.
- Compile with `-Wall -Wextra` and keep the output clean.
