---
name: jnk-verify
description: "Verify a completed change with evidence, honestly. User-invoked only via /skill:jnk-verify. Runs the narrowest verification that gives confidence, checks the measured-by metric when one exists, logs squawks, reconciles the IOU ledger, and enforces AGENTS.md principles via subagent."
disable-model-invocation: true
---

# Verify

> Check the work. Data, not opinion.

## Purpose

Verify the whole change with evidence, and say plainly what remains unverified. Tests show the presence of bugs, never their absence — verification is confidence, not proof.

## Steps

1. **Run the narrowest verification that gives confidence:** the slice checkpoints plus the whole path — tests, typecheck, build, the LLM-as-judge passes the route called for (same rubric, report the scores), and the manual path you can actually run. Show each command and its result. When the decision record names a `Measured by` — latency, cost per call, quality score, conversion — check it if you can; if you can't (no prod access, needs traffic, needs time), say so plainly in the unverified list. Tests verify the code; the metric verifies the change.

2. **State what was NOT verified, and why.** Skipped checks, environments you cannot reach, behavior you cannot see. Name them.

3. **Do not fool yourself.** Report flaky tests, failures, and ugly truths — especially when fixing them silently is tempting.

4. **Fresh eyes.** If the session was long, offer a fresh-eyes pass: re-read the diff as a real adversary — argue for the defect, don't perform agreement. If nothing's wrong, say why the change is genuinely sound; a token objection validates nothing.

5. **The squawk sheet.** Anything noticed but not fixed — duplication, debt, skipped tests — becomes a squawk: `[squawk] severity | location | what | why deferred`. Load `references/squawk-sheet.md` for the taxonomy. Squawks are logged and offered, never silently fixed during verification.

6. **Reconcile the IOUs.** Which unknowns from /skill:jnk-explore got answered? Update `understanding.md` as you go — retire the answered ones so pickup reads truth, not archaeology. Remaining ones become squawks or next steps.

7. **AGENTS.md enforcement.** Before final verification, spawn a subagent to audit the diff against AGENTS.md principles. Give it the full diff and the principles below, and ask it to report, per violation, which principle, the specific code, why it's a violation, and the minimal fix — or to say plainly that the code follows the principles and why. Describe the job in plain language (*spawn a subagent to check this diff against AGENTS.md*) and let your harness's subagent mechanism pick the concrete form — don't hard-code an agent type or tool syntax. Its findings, and the fact that it ran, go into the report at step 8 — a skipped enforcer shows up there as a blank, not a silent drop. For a very small change you may waive it with a stated reason; you may not skip it silently.

   The principles to check:
   1. Optimize for the next engineer — is this obvious to readers?
   2. Understand before changing — was the codebase studied first?
   3. Localize complexity — is complexity hidden behind clear boundaries?
   4. Minimize cognitive load — are there unnecessary concepts, coupling, indirection?
   5. Every abstraction earns its cost — is the abstraction justified?
   6. Prefer removing to adding — did we delete more than we added?
   7. Document intent — do comments explain why, not how?
   8. Leave the design simpler — is the next change easier now?
   9. Smallest coherent change — is this the minimum viable change?

8. **Gate.** Present the report. Ask the user: "What would you want to see to trust this that we didn't show?" — their missing check is often the real one. Then the user decides: fix, ship, or refactor. Do not declare done without their sign-off.

9. **Save the report (when it earns keeping).** If anything remains unverified or squawked, save the report — what passed, what didn't, the squawk list — to `.ai/contexts/<dir>/verification/results.md`. A future session needs exactly this. If everything passed cleanly, skip it; the commit records "all green".

## Persistence Gate

Before proceeding to the next beat, confirm:

- [ ] Squawks are in `.ai/contexts/<slug>/squawks.md`
- [ ] IOUs are in `.ai/contexts/<slug>/understanding.md`
- [ ] Verification report is saved (if needed)
- [ ] If any are missing, write them first

## Anti-Rationalization Table

Models will attempt these rationalizations. Intercept them:

| Rationalization | Reality | Action |
|-----------------|---------|--------|
| "The tests pass, so it's correct" | Tests verify code, not behavior | Run manual QA |
| "lsp_diagnostics is clean" | Types don't catch logic bugs | Test the feature |
| "I tested it manually" | Describe what you observed | Show evidence |
| "It should work" | No evidence = not verified | Run it |
| "The diff looks good" | Review against principles | Spawn enforcer |
| "This is a minor change, no need to verify" | All changes need verification | Run verification |
| "The user said it's fine" | User sign-off is required | Get explicit approval |
| "I'll just fix this small thing" | No silent fixes during verification | Log squawk, move on |

## Output

Verification report (what passed, what's unverified) / Squawk list / IOU reconciliation / AGENTS.md compliance report

## Handoff

If the user is satisfied, recommend /skill:jnk-commit — the session log closes the loop. Do not start it: the next beat begins when the user invokes it.

## Do not

- Silently fix problems found during verification.
- Claim proof, hide skipped checks, or pad with checks that add no confidence.
- Declare done without the user's sign-off.
- Skip the AGENTS.md enforcement step.
