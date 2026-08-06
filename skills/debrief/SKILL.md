---
name: jnk-debrief
description: "Close a session like a pilot closes a flight. User-invoked only via /skill:jnk-debrief. Writes the session log: what landed, squawks, IOUs reconciled, and the next leg."
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

4. **Where it lives.** Follow the repo's convention — the PR description, a decision record, or just the conversation. Ask; do not create ceremony. If the user keeps a memory or log system, offer to file the key facts there.

## Do not

- Start new work, or re-litigate decisions.
- Leave loose threads unmentioned — naming them is the point.
- Write an essay.
