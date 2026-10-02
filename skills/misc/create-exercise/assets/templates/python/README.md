# __TITLE__

__OBJECTIVE__

`src/exercise.py` imports and runs today. The visible tests fail, and they fail
for the reason the exercise is about.

## What to build

<!-- author: state the task as a claim the student can make true. Name the
function, what it is handed, and what it must return. Say what must not change
(the argument, the exit code, the output) if that is part of the task. -->

## Why it matters

<!-- author: one real situation where this goes wrong outside the classroom.
Something a person would recognise, not "it is good practice". -->

## Run the tests

```sh
./run.sh
```

`./run.sh` runs the visible tests in `tests/` and exits non-zero while any of
them fail. Add your own cases to `tests/test_exercise.py` while you work; a case
you invented yourself is the one that catches your own bug.

## What done looks like

<!-- author: the observable criterion. Name the tests that pass and the
behaviour that proves it, so "done" cannot be mistaken for "it imports". -->

Every test in `tests/` passes and `./run.sh` exits 0.

## Audience and time

- Written for: __AUDIENCE__
- About <!-- author: minutes --> minutes

## Rules

- Python standard library only. There is nothing to install.
- Keep the function signatures in `src/exercise.py` as they are. The tests
  import them by name.
