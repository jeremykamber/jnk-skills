---
name: jnk-handoff
description: Carry the live thread across a session boundary. Use when the context is heavy mid-beat, at the end of an unfinished day, or before another agent takes over.
disable-model-invocation: true
---

# Handoff

> Carry the conversation. Leave the knowledge in the repo.

A beat boundary and a context boundary are different things. You can split
anywhere; nothing is remembered unless it is written.

## Steps

1. **Capture the thread** — the bullet list a fresh session cannot reconstruct:
   where we are (beat, step), what was decided and why (including what was
   rejected), what is in flight, the exact next action, open questions.

2. **Write it** into `.ai/threads/<slug>.md` under `## Now`, replacing the
   previous one. A few lines. Durable project facts belong in `docs/`, not here.

3. **Point at the files** that carry the state — the thread, `docs/designs/`,
   the route ledger — instead of copying them.

4. **Stop.** "Handoff written. Resume with `jnk-pickup`." No summary essay; the
   file is the record.

Do not hand off at every beat: when a beat ends, its artifacts already carry the
state and the next beat can start.
