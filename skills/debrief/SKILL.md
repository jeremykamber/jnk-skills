---
name: jnk-8-debrief
description: "Close a session like a pilot closes a flight. User-invoked only via /skill:jnk-8-debrief. Writes the session log: what landed, squawks, IOUs reconciled, and the next leg."
disable-model-invocation: true
---

# Debrief

> The captain's log. Every flight gets written down.

## Purpose

Close the session: log what happened, make sure the user still owns the understanding, and name the next leg so a future session can pick up the thread. Keep it short — five to fifteen lines.

## Steps

1. **The log entry.** Write it, then show it:
   - Callsign and what we set out to do
   - What landed (slices completed)
   - What's airborne (in progress, if any)
   - Verification status
   - Squawks (list)
   - IOUs reconciled
   - The next leg — the smallest sensible next action

2. **The through-line.** Read back the session's arc in a few lines: what the user understood at the start, what they understand now. Every session should leave better software AND better understanding — both, or it's incomplete.

3. **The process note.** One line: did the process work? Anything to change in the workflow itself? Failures are feedback; the workflow improves through use.

4. **Where it lives.** Append the log to `.ai/contexts/<dir>/notes.md` — the engineering notebook — and name the context path in the next leg, so /skill:jnk-0-pickup can find it. If the repo has a strong convention (PR description), follow that instead. The notebook is the default; no other ceremony.

## Handoff

Nothing else to start — the loop continues when the next session runs /skill:jnk-0-pickup, which reads the log you just wrote.

## Do not

- Start new work, or re-litigate decisions.
- Leave loose threads unmentioned — naming them is the point.
- Write an essay.
