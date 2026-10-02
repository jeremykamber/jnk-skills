# Rubric — Split a job queue into fixed-size batches

Not a score. What to look at, in order, and what a wrong answer usually means.

## Before you read any code

Ask for `./run.sh` output. You are looking for the first failing assertion and
whether the student can say which line produced it. A student who fixes the
bound and stops has done the exercise but missed the point of the check they
were handed.

## Misconceptions to look for

- **"The loop should stop one batch early."** `i + size <= items.length` reads
  as "is there room for a full batch", which is not the question. Ask the
  student to walk a queue of five with a size of two and account for item five.
  Caught by `keeps the final short batch` and by `a batch size larger than the
  queue produces one batch`.
- **"A batch is the whole array seen from an offset."** `items.splice(0, size)`
  is a natural way to write this and it empties the caller's queue. Nothing in
  the visible tests notices. Caught by `leaves the caller's queue intact`.
- **"Any positive number is a size."** The starter rejects a size below one, so
  it looks like validation is done; a fraction is only rejected by
  `Number.isInteger`. Caught by `rejects a size that is not a whole number`.
- **"A bad size should return an empty result."** Returning `[]` for an
  impossible size hides the caller's bug behind an empty result. Caught by the
  three `RangeError` cases in the hidden set.

## What a passing solution must show

The tests decide whether the behaviour is right. Look for the rest:

- A loop that advances by `size` and stops on the length, not on the room left.
- Slicing, or an equivalent that copies out of the queue rather than consuming
  it.
- A size check that rejects zero, negatives, and fractions, before any batching.
- The student can say why the last batch needs no special case.

## Traps in the exercise itself

- `Array.from({ length: Math.ceil(items.length / size) }, ...)` is correct and
  says the same thing less directly. Accept it and ask which one they would
  rather debug.
- A `while` loop that shifts off a copy passes everything. That is fine: the
  copy costs more but nothing observable is wrong.
- Nothing in the visible set checks a fractional size, which is why the hidden
  set does.

## Grading shape

- Bound fixed, no size check: all visible tests pass, one hidden test fails.
  This is the usual near-miss.
- `splice` instead of `slice`: every visible test passes and the caller's queue
  is empty afterwards. The hidden check is the only one that notices, so ask
  what the caller does with its array once the function returns.
- Nothing changed but the error message: no visible test passes.
