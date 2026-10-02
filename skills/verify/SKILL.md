---
name: jnk-4-verify
description: "Verify a completed change with evidence, honestly. User-invoked only via /skill:jnk-4-verify. Runs the project's gate stack — standing one up when the project has none — checks the measured-by metric when one exists, logs squawks, reconciles the IOU ledger, and audits the diff against AGENTS.md itself via subagent."
disable-model-invocation: true
---

# Verify

> Check the work. Data, not opinion.

## Purpose

Verify the whole change with evidence, and say plainly what remains unverified. Tests show the presence of bugs, never their absence — verification is confidence, not proof.

## Steps

1. **Run the gate stack: `gates`.** The project's `gates.json` *is* the definition of "verified" — one command, exit 0 or not, and the failing gate's output is the finding. Show the run and its result. The acceptance gate is the one that says the spec holds — which scenarios in `features/<feature>.feature` pass, and which do not. A scenario still red is an unlanded slice, and it is reported as one rather than as a pass with a caveat. Then the parts no gate can hold: the LLM-as-judge passes the route called for (same rubric, report the scores), and the manual path you can actually run. When the decision record names a `Measured by` — latency, cost per call, quality score, conversion — check it if you can; if you can't (no prod access, needs traffic, needs time), say so plainly in the unverified list. Gates verify the code; the metric verifies the change.

   **No stack is not a finding — it is the first thing to fix.** A repo with no `gates.json` is not a repo where "verified" means whatever you decided to run; it is one that has not been stood up. Stand it up before you report anything:

   ```sh
   gates --init              # infers the adapter from the project; --adapter <name> when it cannot
   depth --update-baseline   # the design ratchet errors without a baseline — a ratchet with nothing to ratchet against checked nothing
   gates --list              # the stack, and any config file it cannot find
   ```

   Then delete the gates the project has no tooling for and bring them back as the tooling lands — README's rule — running `gates` is what shows you which, and the report says what you dropped and why. Treat the baseline as day-one debt accepted, not triage done. Two blanks are said out loud rather than papered over: no adapter for the language (`gates --init --adapter <name>` lists the shipped ones; beyond those, hand-write `gates.json` from an adapter's shape in the workflow checkout), and no `features/*.feature` (there is no acceptance gate to run until design writes the spec). The adapter's stack is the floor; when the project has the workflow's layout (`tests/unit`, `tests/acceptance`), `templates/gates.json` in that checkout is the fuller stack — acceptance, coverage, build, e2e — and you delete what it cannot run from that too. Only a *threshold* stays the user's call: an absent stack is stand-up work, not calibration, and "there is no baseline to ratchet against" stops being true the moment you run the second line.

   The loop is: run, read the failure, fix the cause, run again. Do not report a gate as passing that you did not run. Do not edit `gates.json` to clear a finding — raising a threshold is not fixing a defect. If a gate is genuinely miscalibrated, that is the user's decision, with the reason stated out loud.

   A survivor from a scoped mutation run is not yet a gap: `mutate-changed` ran only the test files that transitively import the changed source, so a mutant only another module's test would kill reads as escaped. Confirm it with `mutate-changed --full` before reporting it as an assertion gap, or you will send someone to write a test for a mutant the suite already kills.

   The design gate ratchets, so its claim is "no *new* finding", not "no finding" — and that makes the change's own ledger the thing to read, not the totals. Baseline the base ref once (`git worktree add /tmp/base <ref>`, then `depth --update-baseline --baseline /tmp/base.json` there), then on the branch run `depth --changed --base <ref> --baseline /tmp/base.json --json`. Its `new` list is what this change introduced; its `paid` list is what it retired. Report both, and for each new finding take one of the repair moves (`depth --explain <flag>` carries the moves and when each applies) or state why the finding is wrong — a finding you neither fix nor answer is one you have decided to keep. When the change moved structure rather than adding a feature, show `depth report` too: the shallow modules, the deletion candidates, the single-implementation abstractions, the pure blocks worth extracting, the drift.

2. **Exercise the change the way it is used.** The gate stack is evidence about the code; it is not evidence about the feature. Run the thing: the CLI with real arguments, the route with a real request, the page in a browser, the migration against a copy of real data — and show what came back. This is the step that catches the failure mode the tests cannot, because a test written after the code by the context that wrote the code encodes the code, bugs included, and passes. If the tests came from that context, say so, and treat them as the weakest evidence in the report. When the change is risky, hand a fresh context the spec and the public interface — never the diff — and have it write the failing case first; a test that was written from the requirement and seen red is worth more than a suite that was written from the implementation and seen green. The e2e gate runs this path when the project has one, but a gate cannot tell you what a user would see, and you can.

3. **State what was NOT verified, and why.** Skipped checks, environments you cannot reach, behavior you cannot see. Name them.

4. **Do not fool yourself.** Report flaky tests, failures, and ugly truths — especially when fixing them silently is tempting.

5. **Fresh eyes.** If the session was long, offer a fresh-eyes pass: re-read the diff as a real adversary — argue for the defect, don't perform agreement. For a change the route called risky, that adversary is the review panel rather than one generalist: run its seats over the whole diff — one subagent per seat, one batch, read-only (`jnk-3-implement`'s `references/review-panel.md`) — and triage every finding the way step 1 triages a design finding. For a small change, re-read the diff yourself. If nothing's wrong, say why the change is genuinely sound; a token objection validates nothing.

6. **The squawk sheet.** Anything noticed but not fixed — duplication, debt, skipped tests — becomes a squawk: `[squawk] severity | location | what | why deferred`. Load `references/squawk-sheet.md` for the taxonomy. Squawks are logged and offered, never silently fixed during verification.

7. **Reconcile the IOUs.** Which unknowns from /skill:jnk-1-explore got answered? Update `understanding.md` as you go — retire the answered ones so pickup reads truth, not archaeology. Remaining ones become squawks or next steps.

8. **AGENTS.md enforcement.** Before final verification, spawn a subagent to audit the diff against the project's `AGENTS.md`. Read `AGENTS.md` and hand the subagent **the file itself** — never a restatement of it. A copied principle list drifts silently: this step once carried a hard-coded nine principles from an earlier `AGENTS.md` while the file had moved on to six different ones, so the step enforced principles that no longer existed and missed every principle that did. Nothing could detect it, because nothing was checking. The file is the single source; quote from it. When the project has no `AGENTS.md` at all, that is not a blank to report either: write one — the workflow checkout `gates` resolves from ships `templates/constitution.md` as the starting shape, and its header says what to cut — then audit the diff against the file you just wrote.

   Give it the design findings for the diff too (`depth --changed --base <ref>`), so its reading covers the principles the tool cannot decide — information leakage, conjoining, special/general mixture — with the decidable ones already listed rather than re-argued.

   Ask the subagent to report, per violation, which principle, the specific code, why it's a violation, and the minimal fix — or to say plainly that the code follows the principles and why. Describe the job in plain language (*spawn a subagent to check this diff against AGENTS.md*) and let your harness's subagent mechanism pick the concrete form — don't hard-code an agent type or tool syntax. Its findings, and the fact that it ran, go into the report at step 9 — a skipped enforcer shows up there as a blank, not a silent drop. For a very small change you may waive it with a stated reason; you may not skip it silently.

9. **Gate.** Present the report. Ask the user: "What would you want to see to trust this that we didn't show?" — their missing check is often the real one. Then the user decides: fix, ship, or refactor. Do not declare done without their sign-off.

10. **Save the report (when it earns keeping).** If anything remains unverified or squawked, save the report — what passed, what didn't, the squawk list — to `.ai/contexts/<dir>/verification/results.md`. A future session needs exactly this. If everything passed cleanly, skip it; the commit records "all green".

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
| "The gate failed but the tool must be broken" | Sometimes true — Stryker's vitest runner reports false survivors, and the kit's `templates/stryker-vitest-runner.mjs` is the fix for that one | Prove the tool on a fixture first — `checks/test_mutation.sh` does it for both runners — then decide |
| "It's only advisory, so it doesn't count" | Advisory means report-only, not ignore | Read it and say what it found |
| "The acceptance scenario is red but the unit tests pass" | The spec defines done; green units do not make a scenario pass | Report the red scenario as an unlanded slice |
| "The unit tests assert the new behavior" | Tests written beside the code encode the code, bugs included; green proves the implementation matches itself | Exercise the real path and show what came back |
| "There is no way to exercise it here" | Sometimes true — which makes it an unverified item, not a pass | Name what you could not reach, and why |
| "That design finding is in the baseline" | The baseline is what you accepted before this change | Read the change's `new` list, not the total |
| "This repo has no gate stack, so there's nothing to run" | An absent stack is the first finding to fix, not a fact to report | Stand it up (`gates --init`, `depth --update-baseline`), drop the gates the tooling cannot run, name what you dropped |
| "There's no `AGENTS.md` here, so the audit can't run" | No standard is missing work, not a missing check | Write one from the workflow's `templates/constitution.md`, then audit against it |

## Output

Verification report (what passed, what's unverified) / The stack, when this beat had to stand one up (what was written, what could not run) / The exercised path (what was run, and what came back) / The design ledger (new and paid findings, and what each new one got) / Squawk list / IOU reconciliation / AGENTS.md compliance report

## Handoff

If the user is satisfied, close the loop: run /skill:jnk-commit to write any fixes verification produced (or to confirm the approved work is already committed, clean). A verification that lands cleanly leaves the story as implemented, a small one-line commit per chapter; a verification that prompted fixes adds them as their own commits. Don't commit as you go — history is written here, at the end. Do not start the next beat; it begins when the user invokes it.

## Do not

- Silently fix problems found during verification.
- Claim proof, hide skipped checks, or pad with checks that add no confidence.
- Declare done without the user's sign-off.
- Skip the AGENTS.md enforcement step.
- Edit `gates.json` to clear a finding, or report a gate as passing that you did not run.
- Restate the principles instead of handing the subagent `AGENTS.md` itself.
- Report a change as verified on the strength of tests written by the same context that wrote the code, without exercising the path a user takes.
- Leave a new design finding neither fixed nor answered.
- Report an absent gate stack, or a missing `AGENTS.md`, as a fact about the repo instead of standing one up first.
