# Rubric — Statistics over a buffer you are handed a pointer to

Not a score. What to look at, in order, and what a wrong answer usually means.

## Before you read any code

Ask for `./run.sh` output. You are looking for the first failing check and
whether the student can say which line produced it. The visible failure is in
`count_above` only, so a student who fixes that and stops has still left
`max_value` wrong. Ask what they did about the second function.

## Misconceptions to look for

- **"`sizeof` on the parameter still measures the buffer."** In the function,
  `values` is a pointer: `sizeof values / sizeof values[0]` is 8 / 4 = 2 on a
  64-bit machine, whatever the caller passed. Ask what changed between the
  call site, where `sizeof` gives the real length, and the parameter list.
  Caught by `reads a heap buffer to its last element` and `reads a sub-buffer
  to its last element`.
- **"The loop should stop one short."** `i + 1 < n` looks like a careful bound
  and visits `n - 1` elements. Ask which index holds the last element of an
  `n`-element buffer. Caught by every visible check that puts the interesting
  value last.
- **"Zero is a safe starting maximum."** True only if no value is negative.
  Ask what the function returns for `{-8, -3, -11}`. Caught by `reports the
  largest of an all-negative buffer`.
- **"An empty buffer is just a buffer."** Reading `values[0]` with `n` of 0 is
  a read of memory the caller never offered. Caught by the last block, which
  also insists the out-parameter is untouched — a return value alone does not
  tell the caller that nothing was written.

## What a passing solution must show

The tests decide whether the behaviour is right. Look for the rest:

- Loops bounded by `n`, not by anything derived from `values`.
- `max_value` seeded from `values[0]`, with the empty case answered before it.
- A `-Wall -Wextra` build with no warnings.
- The student can say, out loud, why the length cannot come from the pointer.

## Traps in the exercise itself

- `int best = INT_MIN` is also correct and worth accepting; ask why
  `<limits.h>` is needed for it and `values[0]` is not.
- Returning `0` with `*out` untouched for the empty buffer passes the first
  hidden check and fails the second. The convention is in the header, so this
  is a reading failure, not a reasoning one.
- A `sizeof`-based length is already caught by the first visible check: the
  buffer holds three values and `sizeof values / sizeof values[0]` is 2. The
  heap and sub-buffer checks are there so the same mistake is also caught by a
  check that does not depend on where the buffer was declared.
- Nothing in the visible set makes `max_value` deal with a zero length or a
  negative maximum, which is exactly why the hidden set does.

## Grading shape

- `count_above` fixed, `max_value` untouched: all visible checks pass, two
  hidden checks fail. This is the usual near-miss.
- Both loops correct but `sizeof` used instead of `n`: the heap and sub-buffer
  checks report too few, everything else passes.
- Bounds correct with `int best = 0`: only the all-negative check fails.
