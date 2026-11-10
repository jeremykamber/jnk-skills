---
name: jnk-implement
description: Build the route one vertical slice at a time, with a checkpoint before the next slice. Use once design has decided the direction and shaped slice one. Keeps a ledger, commits a checkpoint per slice, and teaches each slice in layers.
disable-model-invocation: true
---

# Implement

> One slice, one checkpoint, one ledger. No refactors mid-flight.

## The ledger

Keep it in the thread file (`.ai/threads/<slug>.md`, `## Route`) and restate it
at every checkpoint:

```text
Done:    1 — add and list — checkpoint passed
In flight: 3 — priorities
Owed:    2 — done/filter (reordered behind 3)
Deferred: 4 — due dates (user's call)
```

A slice that exists but has not landed is **owed**. Nothing leaves the list
silently, and nothing is reordered without saying so.

## Each slice

1. **Announce** — the files, the checkpoint, what it will not touch. Wait for go.
2. **Red first** — write the failing test against the unfixed code and watch it
   fail for the right reason. Then the smallest change that passes. Then tidy.
3. **Checkpoint** — run the slice's gates: `gates types lint unit` at minimum,
   the whole stack when the slice touched something shared. Show the output.
4. **Exercise it** — run the real entry point and show what came back. Unit tests
   are the weakest evidence; a path you could not reach is named unverified.
5. **Review the risky slices** — when the route marked one, run the two seats in
   `references/review-panel.md` over the slice's diff. Fix findings serially.
6. **Teach** — where it sits, the flow, the two decisions that matter, what is
   plumbing, the failure modes. Lead with what the gates flagged; they say where
   your attention belongs.
7. **Update the ledger**, commit a checkpoint (`git add -A && git commit -m
   "wip: <slice>"` on the branch — the history is rewritten at the end), then
   next slice.

A checkpoint that could not have said no is not a checkpoint. Say which you ran.

## When reality disagrees

A slice that cannot pass because the route is wrong is information, not an
obstacle: stop, say what you learned, and either reshape the slice with the user
or return to `jnk-design`. An unresolved product question goes to `jnk-grill`.

Anything you meet that needs fixing but is not this slice:

```
[squawk] high | src/parser.ts:88 | swallows the error | blocks nothing, wrong anyway
```

into the thread file, and move on. Squawks are reconciled at verify.

## Output

Per-slice: what changed, the checkpoint result, the observed run, squawks, the
layered teach. Final: every slice landed, owed or deferred, and the acceptance
test's status.

## Next

`jnk-commit` to write the history, then `jnk-verify`. Recommend and stop.
