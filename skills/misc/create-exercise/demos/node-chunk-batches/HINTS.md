# Hints

Read one at a time and run the tests again after each. Every hint gives away
more than the one before it.

## Hint 1 — where to look

The starter's loop guard is `i + size <= items.length`. Pick a queue of five
items and a batch size of two, and walk the guard by hand, writing down `i` and
what is left over each time round. Then ask what happened to item five.

## Hint 2 — the mechanism

The guard is asking "is there room for a full batch here, and a spare item after
it?" — which is not the question you want. A batch is worth taking as long as
there is anything left to take, and `slice` already handles the case where the
last batch comes up short.

The loop has to keep going while the start index is still inside the queue.

## Hint 3 — the last step

Change the guard to compare the start index against the length directly, and
remember that the step is the batch size, so the loop still advances at the
right rate.

The size check is the other missing piece: the starter rejects a size below one
but lets a fraction through, so decide what "a whole number of items" means
before the loop runs.

## Still stuck

Write down what you expect each line of `src/exercise.js` to do, then run
`./run.sh` and compare that with what the assertion says. Changing the code
before you can say what the current code does is how the same bug survives the
second attempt.
