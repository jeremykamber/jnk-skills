---
name: jnk-refactor
description: Change structure without changing behavior — housekeeping, always with permission. User-invoked only via /skill:jnk-refactor. Always asks, states value and risk, and verifies with unchanged tests.
disable-model-invocation: true
---

# Refactor

> Maintenance in the hangar. Never at altitude.

## Purpose

Change structure without changing behavior. Refactoring is its own pass with its own gate — never mid-implementation, never without the user's call. First, do no harm.

## Steps

1. **Name the smell and the value.** What complexity exists? Why does it make the next change harder? State value and risk concretely: "Estimated value: low. Risk: touches working auth."

2. **Ask.** "Would you like to explore it?" — the user owns the call. "Not today" is a complete answer; log it as a squawk and move on. Do not revisit it this session.

3. **Check the fence.** Before removing or renaming anything, know why it exists — including code you wrote. Your own fences need justification too.

4. **Establish safety.** Tests must exist and pass before you start. The verification for a refactor is the existing tests, unchanged. If a test must change, that is not a refactor — it is a redesign. Say so.

5. **Apply the rule of three.** Abstract at the third occurrence, not the first. Duplication is cheaper than the wrong abstraction.

6. **Invert.** What would make this refactor dangerous? If you cannot name a failure mode, you have not thought enough.

7. **Refactor incrementally.** One structural change at a time, tests green after each step. Then review: is it easier to understand? Did complexity actually decrease — and did you remove more than you added? The simplest code is code that no longer exists.

## Output

The refactor, or the decision to defer (logged as a squawk) / Post-refactor verification

## Handoff

After a refactor, recommend /skill:jnk-7-verify (unchanged tests prove behavior held) or back to /skill:jnk-8-debrief. Do not start them: the next beat begins when the user invokes it.

## Do not

- Refactor during implementation, or without the user's go-ahead.
- Refactor without tests, or change behavior and call it a refactor.
- Push a refactor the user declined.
