# Hints

Read one at a time and run the tests again after each. Every hint gives away
more than the one before it.

## Hint 1 — where to look

The starter walks the list with `enumerate` and assigns back through
`readings[index]`. Before you change that line, answer this: what is `readings`
a name for, and who else can see whatever that name refers to?

## Hint 2 — the mechanism

`readings` is the caller's list, not a copy of it. Anything you write through
that name is visible to the caller the moment the function returns.

Build a second list and put your answers in that one. The values you read out
of the caller's list never need to change.

## Hint 3 — the last step

Clamping is a `min` and a `max` against the two bounds — pick the pair that
holds the value inside the range rather than pushing it out. Round after the
clamp, not before, and keep the loop from rebinding the caller's list.

Two things are still missing after that: the rounding, and a range check that
has to happen before you build anything.

## Still stuck

Write down what you expect each line of `src/exercise.py` to do, then run
`./run.sh` and compare that with what the assertion says. Changing the code
before you can say what the current code does is how the same bug survives the
second attempt.
