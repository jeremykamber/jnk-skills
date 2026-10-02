# Rubric — Normalize a series of sensor readings

Not a score. What to look at, in order, and what a wrong answer usually means.

## Before you read any code

Ask for `./run.sh` output. You are looking for the first failing assertion and
whether the student can say which line produced it. A student who reaches for
the rounding test first has not noticed that the starter writes into its
argument, which is the interesting half of the exercise.

## Misconceptions to look for

- **"Assignment copies the list."** The starter's `return readings` looks like
  a fresh result and is the argument itself. Ask: *after `normalize(a, 0, 40)`
  returns, what does `a` hold?* If the answer is "whatever I passed in", the
  block is not movable yet. Caught by `test_does_not_modify_the_list_it_was_handed`
  and `test_returns_a_different_list`.
- **"Clamping and rounding are the same kind of cleanup."** A student can clamp
  and stop, or round and forget the bound. Ask which of the four visible tests
  fails when only one of the two is applied. Caught by every visible test that
  carries a value with more than one decimal.
- **"A single pass over the caller's list is fine as long as I return early."**
  Writing through the alias is invisible until the caller uses its list again.
  Caught by `test_does_not_modify_the_list_it_was_handed` and
  `test_returns_a_different_list`.
- **"An impossible range should just return the bounds."** Returning
  `[hi, hi]`-shaped output for `lo > hi` is a guess dressed as a fallback.
  Caught by `test_rejects_a_range_whose_bounds_are_inverted`.

## What a passing solution must show

The tests decide whether the behaviour is right. Look for the rest:

- A second list built explicitly, or a comprehension, rather than a write-back
  into the argument.
- The clamp and the rounding in the order the README states.
- The range check before any work, and a `ValueError` that says what was wrong.
- The student can say why `min(max(value, lo), hi)` holds the value inside the
  range instead of pushing it out.

## Traps in the exercise itself

- Returning `[round(v, 1) for v in readings]` passes the rounding test and
  fails the three clamp tests.
- A `readings[:]` at the top is a real fix for the aliasing and still needs the
  rounding and the range check.
- Nothing in the visible set looks at the caller's list after the call, which is
  why the hidden set does. A solution that gets every value right and the
  ownership wrong passes every visible test.

## Grading shape

- Rounding only, no clamp: one visible test passes, three fail.
- Clamp and rounding, still writing into the argument: all visible tests pass,
  the hidden `TestTheCallersList` class fails.
- Everything but the inverted-range check: one hidden test fails. This is the
  usual near-miss and it is worth a conversation, not a deduction.
