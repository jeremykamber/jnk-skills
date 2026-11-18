---
name: jnk-handoff
description: Carry the live thread across a session boundary. Use when the context is heavy in the middle of a skill, at the end of an unfinished day, or before another agent takes over.
disable-model-invocation: true
---

# Handoff

> Carry the conversation. Leave the knowledge in the repo.

A skill boundary and a context boundary are different things. You can split
anywhere; nothing is remembered unless it is written.

## Steps

1. **Capture the thread** — the bullet list a fresh session cannot reconstruct:
   where we are (skill, step), what was decided and why (including what was
   rejected), what is in flight, the exact next action, and the open questions.

2. **Write it** into `.ai/threads/<slug>.md` under `## Now`, replacing the
   previous one. A few lines. Durable project facts belong in `docs/`, not here.

   Bad: a summary of the conversation, with the next step implied.

   Good: "Slice 2 of 4. Filter decided: status only, in `store.ts:41`. Next:
   write the failing test in `store.spec.ts`, then the guard. Open: does
   `list` sort before or after filtering?"

3. **Point at the files** that carry the state — the thread, `docs/designs/`, the
   route ledger — instead of copying them. One copy of the state: when the file
   and the code disagree, the code is right and the file is wrong.

4. **Stop.** "Handoff written. Resume with `jnk-pickup`." No summary essay; the
   file is the record.

Do not hand off after every skill. When a skill ends, its artifacts already
carry the state and the next one can start.
