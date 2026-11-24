---
name: jnk-delegate
description: Hand a decided body of work to agents on another machine, and keep the review yourself. Use when the work is bigger than one context, or needs a machine you are not on (the browser, production data, a GPU box).
disable-model-invocation: true
---

# Delegate

> You keep the standard and the verification. They keep the typing.

## What cannot be delegated

Two things, always: the standard the work is held to, and verification of every
claim that comes back. Re-check an absence claim ("there is no caller of this")
against the live tree before you forward it: three agents can agree on a stale
one.

Taste, and a trade-off with a real cost either way, come back to the user. They
are not decided in a commit on another machine.

## The brief

One page, written before anything leaves. Read the `writing` skill first.

```md
# <thread>
## Goal — one sentence, and what "done" looks like
## Standard — the AGENTS.md files, verbatim; the gate command that must pass
## Files you own — exclusive; nobody else touches these
## Evidence per item — the command run and its output, pasted
## Out of scope — named, so it is not quietly added
```

## Steps

1. **Decide the work first.** Delegation carries decided work; it does not decide.
   Send anything unresolved to `jnk-grill` before the brief.

2. **Fan out by area**, one agent per exclusive set of files, all from the same
   brief. Overlapping ownership is how two agents produce one conflict.

3. **Move the work with the tool you actually have** — the agent SDK, ssh, or the
   harness's own remote session. Screen-scraping another agent's terminal is the
   last resort, not the design.

4. **Read every diff yourself.** Not the summary. The diff.

5. **Verify every claim** against the live tree, and run the gate command on the
   target.

   Bad: "The remote agent says all 40 tests pass, so I marked it done."

   Good: "Ran `gates` here: 38 pass, 2 fail on the new field. Marked unverified
   until the diff lands."

6. **Ledger in the PR body** — item, what changed, the evidence, and what remains
   unverified.

## Output

The brief / the fan-out and who owned what / every claim and how it was checked /
the unverified list / the ledger.
