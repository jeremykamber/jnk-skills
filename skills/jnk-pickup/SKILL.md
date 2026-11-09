---
name: jnk-pickup
description: Resume work from the thread file. Use at the start of a session that continues earlier work, or after a context reset.
---

# Pickup

> The file is the state. The tests are the truth.

## Steps

1. **Find the thread.** `.ai/threads/<slug>.md`. Match on the slug, or grep the
   threads for the keywords. Several match: list them and ask which. None: say so
   and propose `jnk-design`.

2. **Read it** — `## Model` (and any open IOU), `## Route` (the ledger), `##
   Squawks`, `## Decisions`, `## Now` (where the last session stopped).

3. **Present the state** in five lines: what the work is, what landed, what is
   owed, the open squawks and IOUs, and the next action. Run `gates --list` and
   say which gates work and which cannot run yet.

4. **Ask** "Is this the right place to pick up?" — and offer to re-derive the
   state by running the open slices' checkpoints. The file is memory; the tests
   are evidence.

Then name the beat the work needs next. Recommend it and stop.
