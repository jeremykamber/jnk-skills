# Split a job queue into fixed-size batches

Implement `chunk(items, size)` so that every item lands in exactly one batch and
the final short batch survives, without touching the caller's array.

`src/exercise.js` imports and runs today. The visible tests fail, and they fail
for the reason the exercise is about.

## What to build

`chunk(items, size)` returns an array of batches. Each batch is an array of at
most `size` items, taken from `items` in order. Every batch except possibly the
last holds exactly `size` items, and the last holds whatever is left over.

Rules:

- Every item in `items` appears in exactly one batch, in its original order.
- `items` is not modified. The caller still holds the queue after the call.
- An empty queue produces no batches.
- `size` must be a positive integer. Anything else — zero, a negative, a
  fraction — is a `RangeError`, thrown before any batching happens.

## Why it matters

A worker pool pulls jobs off a queue in batches of 50. Get the loop guard wrong
by one and the last 20 jobs of every queue are never handed out: the queue
reports itself empty while work is still outstanding, and the pool sits idle
next to a backlog. The bug only shows up when the queue length is not a
multiple of the batch size, which is almost never true in the test you wrote by
hand.

## Run the tests

```sh
./run.sh
```

`./run.sh` runs the visible tests in `tests/` and exits non-zero while any of
them fail. Add your own cases to `tests/exercise.test.js` while you work; a case
you invented yourself is the one that catches your own bug.

## What done looks like

- Every test in `tests/` passes and `./run.sh` exits 0.
- Concatenating the batches in order reproduces the original array.
- The array passed in compares equal to what it was before the call.
- A size that is not a positive integer throws `RangeError`.

## Audience and time

- Written for: CS1 students who can write a for loop over an array index
- About 30 minutes

## Rules

- Node's standard library only. There is nothing to install: `node_modules/`
  stays empty, and `package.json` exists only to mark the files as modules.
- Keep `chunk` exported from `src/exercise.js` with the same signature. The
  tests import it by name.
