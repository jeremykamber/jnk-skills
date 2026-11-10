---
name: jnk-oneshot
description: Make a small, well-understood change end to end in one pass, without the design beat. Use when the behaviour and the approach are both clear. Escalates to jnk-design the moment either stops being clear.
disable-model-invocation: true
---

# One shot

Small change, done properly, one pass.

## Escalate instead

Stop and recommend `jnk-design` when you hit: a decision the repo does not
answer, behaviour nobody has specified, an architectural change, or a slice
resting on an assumption you cannot check. Escalating costs one beat; guessing
costs a rewrite.

## Steps

1. **Restate** — what changes, what must not, the main risk. Read
   `.ai/threads/*.md` first when one covers this area: the previous session wrote
   down what it learned, and re-deriving it is the most expensive way to spend a
   context. Then the code under change, its tests, and one caller. If that read
   turns up a real unknown, escalate.

2. **Slice** — one vertical change, or two or three that each work end to end.
   Write the failing test first, watch it fail, make it pass.

3. **Checkpoint, scoped** — the tests for the files you touched and the files that
   import them: one test file, `gates --changed` where the stack supports it,
   `mutate-changed --files <path>` when mutation is on. The whole suite, the whole
   tree and `mutate-changed --full` are the audit's job (`jnk-verify`, or a
   release), not a checkpoint's. Measured: an unscoped `npx vitest run` on a
   108-file repository cost **11 of the 15 minutes** a checkpoint took, for the
   same verdict as the one file that covered the change.

   A project with no stack is run by its own test command, scoped the same way.
   Stand a stack up only with the user's say-so (`gates --init --yes`).

4. **Exercise it** — run the real entry point and show the output.

5. **Review** — for a substantial or risky change, run the two seats in
   `jnk-implement/references/review-panel.md` over the diff, and answer every
   finding: fixed, or why it is wrong.

6. **Record** — durable facts go to `docs/`; anything deferred goes in a
   `[squawk]` line in `.ai/threads/<slug>.md`.

7. **Commit** — a checkpoint now, then `jnk-commit` to shape the history.

## Output

What changed / the checkpoint and its result / the observed run / squawks / the
blast-radius fact and how far you proved it.

## Next

`jnk-verify` when the change is risky, `jnk-commit` when it is ordinary.
Recommend and stop.
