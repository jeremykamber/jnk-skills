---
name: jnk-4-verify
description: "Verify a completed change with evidence, honestly. User-invoked only via /skill:jnk-4-verify. Runs the project's gate stack, checks the measured-by metric when one exists, logs squawks, reconciles the IOU ledger, and audits the diff against AGENTS.md itself via subagent."
disable-model-invocation: true
---

# Verify

> Check the work. Data, not opinion.

## Purpose

Verify the whole change with evidence, and say plainly what remains unverified. Tests show the presence of bugs, never their absence — verification is confidence, not proof.

## Steps

1. **Run the gate stack: `gates`.** The project's `gates.json` *is* the definition of "verified" — one command, exit 0 or not, and the failing gate's output is the finding. Show the run and its result. The acceptance gate is the one that says the spec holds — which scenarios in `features/<feature>.feature` pass, and which do not. A scenario still red is an unlanded slice, and it is reported as one rather than as a pass with a caveat. Then the parts no gate can hold: the LLM-as-judge passes the route called for (same rubric, report the scores), and the manual path you can actually run. When the decision record names a `Measured by` — latency, cost per call, quality score, conversion — check it if you can; if you can't (no prod access, needs traffic, needs time), say so plainly in the unverified list. Gates verify the code; the metric verifies the change.

   The loop is: run, read the failure, fix the cause, run again. Do not report a gate as passing that you did not run. Do not edit `gates.json` to clear a finding — raising a threshold is not fixing a defect. If a gate is genuinely miscalibrated, that is the user's decision, with the reason stated out loud.

2. **State what was NOT verified, and why.** Skipped checks, environments you cannot reach, behavior you cannot see. Name them.

3. **Do not fool yourself.** Report flaky tests, failures, and ugly truths — especially when fixing them silently is tempting.

4. **Fresh eyes.** If the session was long, offer a fresh-eyes pass: re-read the diff as a real adversary — argue for the defect, don't perform agreement. If nothing's wrong, say why the change is genuinely sound; a token objection validates nothing.

5. **The squawk sheet.** Anything noticed but not fixed — duplication, debt, skipped tests — becomes a squawk: `[squawk] severity | location | what | why deferred`. Load `references/squawk-sheet.md` for the taxonomy. Squawks are logged and offered, never silently fixed during verification.

6. **Reconcile the IOUs.** Which unknowns from /skill:jnk-1-explore got answered? Update `understanding.md` as you go — retire the answered ones so pickup reads truth, not archaeology. Remaining ones become squawks or next steps.

7. **AGENTS.md enforcement.** Before final verification, spawn a subagent to audit the diff against the project's `AGENTS.md`. Read `AGENTS.md` and hand the subagent **the file itself** — never a restatement of it. A copied principle list drifts silently: this step once carried a hard-coded nine principles from an earlier `AGENTS.md` while the file had moved on to six different ones, so the step enforced principles that no longer existed and missed every principle that did. Nothing could detect it, because nothing was checking. The file is the single source; quote from it.

   Ask the subagent to report, per violation, which principle, the specific code, why it's a violation, and the minimal fix — or to say plainly that the code follows the principles and why. Describe the job in plain language (*spawn a subagent to check this diff against AGENTS.md*) and let your harness's subagent mechanism pick the concrete form — don't hard-code an agent type or tool syntax. Its findings, and the fact that it ran, go into the report at step 8 — a skipped enforcer shows up there as a blank, not a silent drop. For a very small change you may waive it with a stated reason; you may not skip it silently.

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
| "The diff looks good" | Review against the principles in AGENTS.md | Spawn the audit |
| "This is a minor change, no need to verify" | All changes need verification | Run the gates |
| "The user said it's fine" | User sign-off is required | Get explicit approval |
| "I'll just fix this small thing" | No silent fixes during verification | Log squawk, move on |
| "I ran the gates before my last edit" | The last edit is the one that matters | Re-run them |
| "The gate is too strict, I'll raise the threshold" | A threshold is not a defect | Fix the cause, or ask the user |
| "The gate failed but the tool must be broken" | Sometimes true — Stryker's vitest runner reports false survivors | Prove the tool on a fixture first, then decide |
| "It's only advisory, so it doesn't count" | Advisory means report-only, not ignore | Read it and say what it found |
| "The acceptance scenario is red but the unit tests pass" | The spec defines done; green units do not make a scenario pass | Report the red scenario as an unlanded slice |

## Output

Verification report (what passed, what's unverified) / Squawk list / IOU reconciliation / AGENTS.md compliance report

## Handoff

If the user is satisfied, close the loop: run /skill:jnk-commit to write any fixes verification produced (or to confirm the approved work is already committed, clean). A verification that lands cleanly leaves the story as implemented, a small one-line commit per chapter; a verification that prompted fixes adds them as their own commits. Don't commit as you go — history is written here, at the end. Do not start the next beat; it begins when the user invokes it.

## Do not

- Silently fix problems found during verification.
- Claim proof, hide skipped checks, or pad with checks that add no confidence.
- Declare done without the user's sign-off.
- Skip the AGENTS.md enforcement step.
- Edit `gates.json` to clear a finding, or report a gate as passing that you did not run.
- Restate the principles instead of handing the subagent `AGENTS.md` itself.
