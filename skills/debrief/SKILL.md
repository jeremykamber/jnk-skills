---
name: jnk-7-debrief
description: "Close the session. User-invoked only via /skill:jnk-7-debrief. The teach-back, the session log: what landed, squawks, IOUs reconciled, durable facts written home, and the next step."
disable-model-invocation: true
---

# Debrief

> The session log. Every session gets written down.

## Purpose

Close the session: log what happened, make sure the user still owns the understanding, and name the next step so a future session can pick up the thread. Keep it short — five to fifteen lines.

## Steps

1. **The log entry.** Write it, then show it:
   - Thread name and what we set out to do
   - What landed (slices completed)
   - What's airborne (in progress, if any)
   - Verification status
   - Squawks (list)
   - IOUs reconciled
   - The next step — the smallest sensible next action

2. **The teach-back — ask, then stop.** Ask the user, in your own words: "Your turn — in one or two sentences, as if to an engineer who wasn't here: what changed and why?" Then **stop**. Write nothing that answers the question — no summary, no "my version to compare", no hints, no recap the user could echo. The log entry above is the record; the teach-back is the user's own words, not a recitation of it. The user's answer must come from their own understanding, in a later message. Only after they have answered may you confirm or correct, in a few lines — never in the message that asks. If the user genuinely can't say it, the session missed its second outcome — then name the gap and how to close it (a follow-up, a demo, a re-read). Every session should leave better software AND better understanding — both, or it's incomplete.

3. **The process note.** One line: did the process work? Anything to change in the workflow itself? Failures are feedback; the workflow improves through use.

4. **The durable fact.** Did the session learn anything the repo should know — an env var schema, an integration's shape, a convention, a test email? Write it to the repo's `docs/external/` (create the dirs if missing) — the one category the model cannot derive from code, so a file is the only way it finds it deterministically. (Decisions go to `docs/adr/`, written by decide.) No durable fact? Say so and move on.

5. **Where it lives.** Append the log to `.ai/contexts/<dir>/notes.md` — the engineering notebook — and name the context path in the next step, so /skill:jnk-0-pickup can find it. If the repo has a strong convention (PR description), write it too — as a copy, never instead: the notebook is the only memory pickup reads. Closing an abandoned thread? First line of `notes.md` — `Abandoned — superseded by <X>` — so pickup stops offering it. Then carry the context home so the memory outlives the worktree: `cp -r .ai/contexts/<dir> <main>/.ai/contexts/` (`<main>` is the parent checkout, from `git worktree list`; skip when there's no worktree). Then the durability check: `notes.md` is the worklog and should be committed with the code (gitignore exception — see usage.md, the notebook section) or otherwise backed up; decisions and system facts already live in `docs/` — committed by definition. Never end a session with the memory only in the worktree.

## Handoff

Nothing else to start — the loop continues when the next session runs /skill:jnk-0-pickup, which reads the log you just wrote.

## Do not

- Start new work, or re-litigate decisions.
- Answer your own teach-back question, or write any summary in the asking message that the user could echo back — the user's words come first, unanswered, in a later message.
- Leave loose threads unmentioned — naming them is the point.
- Write an essay.
