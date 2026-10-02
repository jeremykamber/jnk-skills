# __TITLE__

__OBJECTIVE__

`src/exercise.c` compiles today. The visible tests fail, and they fail for the
reason the exercise is about.

## What to build

<!-- author: state the task as a claim the student can make true. Name each
function, what it is handed (a pointer and a length, or an out-parameter), and
what it must return. Say what the empty case must do. -->

## Why it matters

<!-- author: one real situation where this goes wrong outside the classroom.
Something a person would recognise, not "it is good practice". -->

## Run the tests

```sh
./run.sh
```

`./run.sh` runs `make -s test`, which compiles `src/` with the visible tests in
`tests/` and runs the result. It exits non-zero while any check fails. Add your
own cases to `tests/test_exercise.c` while you work; a case you invented
yourself is the one that catches your own bug.

## What done looks like

<!-- author: the observable criterion. Name the checks that pass and the
behaviour that proves it, so "done" cannot be mistaken for "it compiles". -->

Every check in `tests/` passes and `./run.sh` exits 0.

## Audience and time

- Written for: __AUDIENCE__
- About <!-- author: minutes --> minutes

## Rules

- C11 and the standard library only. There is nothing to install.
- Keep the signatures in `src/exercise.h` as they are. The tests include that
  header and call the functions through it.
- Compile with `-Wall -Wextra` and keep the output clean.
