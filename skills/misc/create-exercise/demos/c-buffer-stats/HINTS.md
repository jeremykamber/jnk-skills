# Hints

Read one at a time and run the tests again after each. Every hint gives away
more than the one before it.

## Hint 1 — where to look

`count_above` walks the buffer with the guard `i + 1 < n`. Take the visible
buffer `{1, 5, 9}` and write down which indices the loop visits. Then ask where
the value `9` went.

`max_value` starts its running maximum at `0`. Look at the signature again:
what type are the values, and what does that say about `0` as a starting point?

## Hint 2 — the mechanism

The length is the parameter `n`. Nothing inside the function can recover it from
the pointer — `values` is an address, and `sizeof values` measures the address,
not the buffer it points at. Whatever the loop needs, `n` already has it.

For the maximum, the safe starting value is one of the values you were given,
not a constant you chose. Pick the first element, then compare the rest against
it — which also makes the single-element case fall out for free.

## Hint 3 — the last step

Change the guard so the loop body runs for every index below `n`, and start the
running maximum at `values[0]` with the loop starting after it.

Two more things: the empty case has no first element, so it has to be answered
before the loop; and the header says what `max_value` returns and what it must
leave alone when there is nothing to read.

## Still stuck

Write down what you expect each line of `src/exercise.c` to do, then run
`./run.sh` and compare that with what the failing check says. Changing the code
before you can say what the current code does is how the same bug survives the
second attempt.
