---
name: jnk-implement
description: Build the route one vertical slice at a time, with a checkpoint before the next slice. Use once design has decided the direction and shaped slice one. Keeps a ledger, commits a checkpoint per slice, and teaches each slice in layers.
disable-model-invocation: true
---

# Implement

> One slice, one checkpoint, one ledger. No refactor mid-flight.

## The ledger

Keep it in the thread file (`.ai/threads/<slug>.md`, `## Route`) and restate it
at every checkpoint:

```text
Done:      1 — add and list — checkpoint passed
In flight: 3 — priorities
Owed:      2 — done/filter (reordered behind 3)
Deferred:  4 — due dates (user's call)
```

A slice that exists but has not landed is **owed**. Nothing leaves the list
silently, and nothing moves without saying so.

## Each slice

1. **Announce** — the files, the checkpoint, what it will not touch. Wait for go.

2. **Red first** — write the failing test against the unfixed code and watch it
   fail for the right reason. Then the smallest change that passes. Then tidy.
   Tidy means one function, one job: reading the input, deciding what it means
   and rendering the answer are three functions, not one helper with three
   phases. A branch chain that picks a command, a state or a format is a table
   and a one-line lookup, not a longer `if`.

3. **Checkpoint, scoped** — the slice's tests: the files it touched and the files
   that import them, `gates --changed` where the stack supports it. The full
   stack is `jnk-verify`'s job; `mutate-changed --full` is an audit, never a
   checkpoint. Show the output.

4. **Exercise it** — run the real entry point and show what came back. Unit tests
   are the weakest evidence; a path you could not reach is named unverified.

5. **Review the risky slices** — when the route marked one, run the two seats in
   `references/review-panel.md` over the slice's diff. Fix findings one at a
   time.

6. **Teach** — where the code sits, the flow, the two decisions that matter, what
   is plumbing, the failure modes. Lead with what the gates flagged; that is
   where attention belongs.

   Bad: "Changes: `todo.ts` +48/−3, `store.ts` +12/−0. Tests pass."

   Good: "The filter lives in `store.ts:41`. It reads the same state the list
   reads, so the two cannot disagree. The gate flagged complexity in
   `match()`; it now delegates to `matchesDone()` and `matchesText()`."

7. **Update the ledger**, commit a checkpoint (`git add -A && git commit -m
   "wip: <slice>"` on the branch — the history is rewritten at the end), then
   start the next slice.

A checkpoint that could not have said no is not a checkpoint. Say which one you
ran.

## When reality disagrees

A slice that cannot pass because the route is wrong is information, not an
obstacle. Stop, say what you learned, then either reshape the slice with the user
or return to `jnk-design`. An unresolved product question goes to `jnk-grill`.

Anything you meet that needs fixing but is not this slice:

```text
[squawk] high | src/parser.ts:88 | swallows the error | blocks nothing, wrong anyway
```

Write it into the thread file and move on. Squawks are reconciled at verify.

## Output

Per slice: what changed, the checkpoint result, the observed run, squawks, the
layered teach. Final: every slice landed, owed or deferred, and the acceptance
test's status.

## Next

`jnk-commit` to write the history, then `jnk-verify`. Recommend and stop.
