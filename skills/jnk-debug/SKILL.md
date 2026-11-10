---
name: jnk-debug
description: Find and fix the root cause of broken behaviour. Use when something that should work does not. Reproduces first, gates the diagnosis, fixes the cause, and re-proves on the original failure.
disable-model-invocation: true
---

# Debug

> Make it fail, then make it fail on purpose.

## Steps

1. **Reproduce.** Make it fail in front of you. No hypothesis, no patch until it
   does. Intermittent: characterise the frequency and conditions, and say what
   you cannot verify. A bug you cannot reproduce is a bug you cannot diagnose.

2. **Read the evidence.** The first line of the stack, the log message, the
   failing assertion. Follow the call path. State what the code does against what
   it should. For tactics — bisection, minimisation, archaeology — see
   `references/playbook.md`.

3. **What changed?** Most bugs are regressions: `git log -p` over the area,
   blame, diff from last-known-good. Name the commit or say the bug is old.

4. **One hypothesis at a time.** Falsifiable, one variable per test, result
   recorded. A failed hypothesis is evidence. Two identical attempts means stop
   and re-read the evidence.

5. **Gate the diagnosis.** State what fails, where, why, since when — then stop
   and ask: "Does this match what you know of the system? Any hunch I should
   check?" If the fix is wide, say so here; that is the escalate signal.

6. **Smallest fix, proven.** Regression test first, seen red. Then the fix. Then
   prove: the original reproduction is gone, the new test passes, nothing
   adjacent broke.

7. **Report.** Cause, fix, evidence, squawks. Commit; propose `jnk-commit` to
   shape the history.

## Context hygiene

Summarise logs and traces; never dump them raw. Long trail goes in a scratch
file, not the conversation.

## Next

`jnk-commit`. If the cause needs architecture, `jnk-design`. Recommend and stop.
