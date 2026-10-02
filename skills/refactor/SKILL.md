---
name: jnk-refactor
description: Change structure without changing behavior — housekeeping, always with permission. User-invoked only via /skill:jnk-refactor. Always asks, states value and risk, and verifies with unchanged tests.
disable-model-invocation: true
---

# Refactor

> Maintenance on its own pass. Never mid-implementation.

## Purpose

Change structure without changing behavior. Refactoring is its own pass with its own gate — never mid-implementation, never without the user's call. First, do no harm.

## Steps

1. **Name the smell and the value.** What complexity exists? Why does it make the next change harder? State value and risk concretely: "Estimated value: low. Risk: touches working auth."

2. **Ask.** "Would you like to explore it?" — the user owns the call. "Not today" is a complete answer; log it as a squawk and move on. Do not revisit it this session.

3. **Check the fence.** Before removing or renaming anything, know why it exists — including code you wrote. Your own fences need justification too.

4. **Establish safety.** Tests must exist and pass before you start. The verification for a refactor is the existing tests, unchanged. If a test must change, that is not a refactor — it is a redesign. Say so.

5. **Apply the rule of three.** Abstract at the third occurrence, not the first. Duplication is cheaper than the wrong abstraction.

6. **Invert.** What would make this refactor dangerous? If you cannot name a failure mode, you have not thought enough — and the one you name must be one you'd actually fear, not a token risk.

7. **Refactor incrementally.** One structural change at a time, tests green after each step. Then review: is it easier to understand? Did complexity actually decrease — and did you remove more than you added? The simplest code is code that no longer exists.

## The refactor's own evidence

A refactor has one measure: the design debt it retires. A green test suite proves you did not change behavior; it says nothing about whether you changed structure. A rename that moves a function and leaves the same complexity behind passes the same tests it passed before, and reports nothing.

Read the change's own ledger: on the refactored tree, `depth --changed --base <ref> --baseline .depth-baseline.json --json` gives a `new` list and a `paid` list — what the refactor introduced and what it retired. The baseline is the one the project already commits; where there is none yet, take it on the base ref (`depth --update-baseline` there, not on your work), because a baseline taken after the refactor cannot tell you what the refactor did. Findings about relationships carry stable ids, so a pure refactor that moves code does not flip them. No ref to compare against? Compare `depth` counts before and after — coarser, same evidence.

Report both lists. A refactor that leaves the finding count unchanged did not change structure, whatever else it did, and one that raises it needs its reason stated out loud: an extraction creates a new module with its own interface, which can legitimately add one finding.

## Output

The refactor, or the decision to defer (logged as a squawk) / Post-refactor verification

## Handoff

After a refactor, recommend /skill:jnk-4-verify (unchanged tests prove behavior held) or back to /skill:jnk-commit. Do not start them: the next beat begins when the user invokes it.

## Do not

- Refactor during implementation, or without the user's go-ahead.
- Refactor without tests, or change behavior and call it a refactor.
- Push a refactor the user declined.
