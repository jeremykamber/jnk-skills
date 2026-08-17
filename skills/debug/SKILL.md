---
name: jnk-debug
description: Find and fix the root cause of broken behavior. User-invoked only via /skill:jnk-debug. Reproduce first, diagnose with evidence, gate the diagnosis before fixing, verify on the original failure — and escalate to the beats when the fix is large-scale.
disable-model-invocation: true
---

# Debug

> Make it fail, then make it fail on purpose. The cause, not the symptom.

## Purpose

Turn "something's wrong" into a reproduced failure, a named root cause, a smallest fix, and proof. Debugging is disciplined experimentation, not guesswork: hypotheses are cheap, evidence is not, and "the error disappeared" is not "the defect is gone."

## Steps

1. **Reproduce.** Make it fail in front of you before anything else. No hypothesis, no fix, no patch until the failure is reproduced. If you can't reproduce from the report, ask once for steps, environment, exact input — or build a minimal repro. If it's intermittent, characterize it (frequency, conditions) and say plainly what you can't verify. A bug you can't reproduce is a bug you can't diagnose.

2. **Read the evidence, not the guess.** The actual error: the first line of the stack, the log message, the failing assertion. Follow the call path. State what the code does vs. what it should do. When you need tactics — bisection, minimization, archaeology, the fresh-view trick — load `references/playbook.md`.

3. **What changed?** Most bugs are regressions. Git archaeology: recent commits touching the area, blame, the diff from last-known-good. Name the change that introduced the behavior — or say clearly that the bug is old.

4. **Hypotheses, one at a time.** State a falsifiable hypothesis, test it (bisect, instrument, minimize), record the result. Change one variable per test — every uncontrolled change destroys information. A failed hypothesis is evidence, not a dead end. If you've tried the same thing twice, stop and re-read the evidence instead of retrying. Competing hypotheses must each be plausible — a strawman hypothesis tests nothing.

5. **Name the root cause — gate.** State the cause precisely: what fails, where, why, since when. Then STOP. Present it and ask: "Does this feel right and true? Any hunches or instincts I should check first?" The user knows the system; their instinct is evidence. Wait for the answer. If the root cause implies a large-scale or wide-blast-radius fix, say so here — that is the escalate signal.

6. **The smallest fix, verified.** Fix the root cause with the smallest change. Where a regression test can fail for the right reason, write it first and watch it fail. Then prove: the original reproduction is gone, the new test passes, nothing adjacent broke (narrow sweep; stash-baseline compare on any doubt). A fix you can't re-verify on the original failure is not a fix.

7. **Report and handoff.** What was wrong, why, the fix, the evidence, squawks. Do not commit — propose /skill:jnk-commit for the history.

## Context hygiene

Debugging is the dirtiest phase — logs, traces, failed hypotheses. Keep the conversation lean: summarize logs and traces, never dump them raw. When the trail gets long, write it to a scratch file, not the chat. The audit trail matters; the raw dump doesn't.

## Escalate

If at any point the root cause implies a large-scale or wide-blast-radius fix — new architecture, a broad refactor, several subsystems — stop after naming the cause and recommend /skill:jnk-explore. Never half-fix a big bug. The user decides.

## Handoff

If it landed, nothing to hand off — the fix is verified; propose /skill:jnk-commit for the history. If it escalated, the next beat is /skill:jnk-explore (user-invoked). Do not start it.

## Do not

- Fix or hypothesize before reproducing.
- Patch the symptom and call it root cause — name the difference when you do.
- Declare "fixed" without re-running the original failure.
- Change several variables between tests — one at a time.
- Dump logs and traces raw into the conversation.
- Half-fix a large-scale bug — escalate instead.
- Fix adjacent bugs silently — squawk them.
