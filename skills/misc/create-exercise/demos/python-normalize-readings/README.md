# Normalize a series of sensor readings

Return a new list of readings clamped into range and rounded to one decimal
place, leaving the caller's list untouched.

`src/exercise.py` imports and runs today. The visible tests fail, and they fail
for the reason the exercise is about.

## What to build

`normalize(readings, lo, hi)` takes a list of numbers and the bounds of the
acceptable range. It returns a **new** list of the same length, in the same
order, in which every reading has been clamped into `[lo, hi]` and then rounded
to one decimal place.

The list you were handed must come back unchanged. Callers keep using it after
they hand it over.

A range with `lo > hi` cannot be satisfied, so raise `ValueError` instead of
returning something plausible. An empty list is not an error: it normalizes to
an empty list.

## Why it matters

Clamping is what a monitoring pipeline does before it stores a reading: the
sensor is rated to 40 bar, the reading says 42.4, and you want the out-of-range
value recorded as out-of-range rather than passed downstream as fact.

If the clamp writes through the caller's list, the raw buffer is gone. The
incident review then sees a week of readings that were all in range, cannot
tell a stuck sensor from a healthy one, and looks in the wrong subsystem for a
week. Nothing raised, nothing logged.

## Run the tests

```sh
./run.sh
```

`./run.sh` runs the visible tests in `tests/` and exits non-zero while any of
them fail. Add your own cases to `tests/test_exercise.py` while you work; a case
you invented yourself is the one that catches your own bug.

## What done looks like

- Every test in `tests/` passes and `./run.sh` exits 0.
- Every value in the returned list has at most one decimal place.
- Readings outside the range come back as the bound itself.
- The list passed in compares equal to what it was before the call.
- The returned list is a different object from the one passed in.

## Audience and time

- Written for: CS1 students who have been writing list-and-loop code for a few weeks
- About 25 minutes

## Rules

- Python standard library only. There is nothing to install.
- Keep `normalize` in `src/exercise.py` and keep its signature. The tests
  import it by name.
