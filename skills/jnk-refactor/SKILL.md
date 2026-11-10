---
name: jnk-refactor
description: Change structure without changing behaviour, and prove the design debt went down. Use when the code works and getting it cleaner is the job.
disable-model-invocation: true
---

# Refactor

> Behaviour frozen. Structure measured.

## Steps

1. **Freeze the behaviour.** The existing tests are the contract. Where they do
   not cover what you are about to move, add the test first and see it green
   before you touch the structure.

2. **Read the debt.** `depth report <area>` — shallow modules, deletion
   candidates, single-implementation abstractions, drift. Name the two or three
   moves worth making, and the one you are choosing not to.

3. **Baseline the ledger** so the change can be scored:

   ```sh
   git worktree add /tmp/base <ref>
   (cd /tmp/base && depth --update-baseline --baseline /tmp/base.json)
   ```

4. **Move in small steps.** One structural change per commit, tests green after
   each. `gates` at every checkpoint. No behaviour change smuggled in: if a test
   has to change, the refactor became a feature — say so and stop.

5. **Score it.** `depth --changed --base <ref> --baseline /tmp/base.json --json`.
   `paid` is the debt retired; `new` is debt added. Report both. A refactor that
   adds as much as it removes did not pay.

## Output

The moves made, the ledger (paid and new), the behaviour evidence, and what you
left alone on purpose.

## Next

`jnk-commit`. Recommend and stop.
