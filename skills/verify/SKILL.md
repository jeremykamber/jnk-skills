---
name: jnk-7-verify
description: Verify a completed change with evidence, honestly. User-invoked only via /skill:jnk-7-verify. Runs the narrowest verification that gives confidence, logs squawks, and reconciles the IOU ledger.
disable-model-invocation: true
---

# Verify

> Post-flight inspection. Data, not opinion.

## Purpose

Verify the whole change with evidence, and say plainly what remains unverified. Tests show the presence of bugs, never their absence — verification is confidence, not proof.

## Steps

1. **Run the narrowest verification that gives confidence:** the slice checkpoints plus the whole path — tests, typecheck, build, and the manual path you can actually run. Show each command and its result.

2. **State what was NOT verified, and why.** Skipped checks, environments you cannot reach, behavior you cannot see. Name them.

3. **Do not fool yourself.** Report flaky tests, failures, and ugly truths — especially when fixing them silently is tempting.

4. **Fresh eyes.** If the session was long, offer a fresh-eyes pass: re-read the diff as a real adversary — argue for the defect, don't perform agreement. If nothing's wrong, say why the change is genuinely sound; a token objection validates nothing.

5. **The squawk sheet.** Anything noticed but not fixed — duplication, debt, skipped tests — becomes a squawk: `[squawk] severity | location | what | why deferred`. Load `references/squawk-sheet.md` for the taxonomy. Squawks are logged and offered, never silently fixed during verification.

6. **Reconcile the IOUs.** Which unknowns from /skill:jnk-1-understand got answered? Remaining ones become squawks or next steps.

7. **Gate.** Present the report. The user decides: fix, ship, debrief, or refactor. Do not declare done without their sign-off.

8. **Save the report (when it earns keeping).** If anything remains unverified or squawked, save the report — what passed, what didn't, the squawk list — to `.ai/contexts/<dir>/verification/results.md`. A future session needs exactly this. If everything passed cleanly, skip it; the debrief records "all green".

## Output

Verification report (what passed, what's unverified) / Squawk list / IOU reconciliation

## Handoff

If the user is satisfied, recommend /skill:jnk-8-debrief — the captain's log closes the loop. Do not start it: the next beat begins when the user invokes it.

## Do not

- Silently fix problems found during verification.
- Claim proof, hide skipped checks, or pad with checks that add no confidence.
- Declare done without the user's sign-off.
