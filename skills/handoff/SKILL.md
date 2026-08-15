---
name: jnk-handoff
description: "Carry the live conversation across a session boundary. User-invoked only via /skill:jnk-handoff. Writes a compact thread checkpoint that pickup reads next session — split mid-beat without pretending a beat completed."
disable-model-invocation: true
---

# Handoff

> The thread, not the project. Carry the conversation; leave the knowledge in the codebase.

## Purpose

Move the live conversational thread across a session boundary. A beat boundary and a context boundary are not the same thing: you can split mid-beat, mid-thought, mid-design — anywhere — without pretending you finished a beat. The handoff file is the checkpoint; /skill:jnk-0-pickup is the reader. Nothing is remembered unless it is written.

## When to hand off

Use it when the live thread must survive:

- Context at ~60% mid-beat — the awkward split; this is its escape hatch
- End of day, thread unfinished
- Branching into a prototype or a subproblem, planning to return
- Handing the thread to another session or another agent

Do NOT hand off at every beat. When a beat finishes and its durable artifacts carry the state (the ADR, the design doc, the route file, `notes.md`), just invoke the next beat — no handoff. Handoff carries the conversation, not the beat ceremony.

## What it captures — the thread, not the project

- Where we are: the beat, the step within it
- Decisions made and why — including rejected branches ("dropped the VPS route because `<reason>`")
- What's in flight and what's owed
- The exact next action — what I was about to do
- Open questions and hunches

Durable project knowledge does NOT go here — it belongs in `docs/adr/`, `docs/designs/`, `docs/external/` (committed, stable). If the conversation learned something the project needs, write it to `docs/` before handing off. The handoff is a few lines, not a second source of truth.

## Steps

1. **Capture the thread.** Gather the bullet list above — including the rejections and reasons. That is exactly what a fresh session cannot reconstruct.

2. **Write the handoff.** Compact markdown, a few lines: *where we are / decided (with reasons) / in flight / next action / open questions*. Path: `.ai/contexts/<slug>/handoff.md` — reuse the thread's existing dir, or create it. Gitignored, transient. Overwrite the previous handoff for this thread — the latest is the state.

3. **Reference the durable files.** If this session wrote or updated `docs/` or the route file, the handoff points at them rather than duplicating — pickup reads both.

4. **Gate.** "Handoff written to `<path>`. Resume with /skill:jnk-0-pickup." Then stop — no summary essay; the file is the record.

## Output

A compact handoff file / the resume path named

## Handoff

The next session runs /skill:jnk-0-pickup, reads the handoff, and presents the state. The thread continues from the named next action.

## Do not

- Write project knowledge into a handoff — `docs/` is where durable facts live.
- Use a handoff where a finished beat's artifacts already carry the state — that is ceremony.
- Write an essay — a rough checkpoint beats a lost session, and a short one gets read.
- Keep working after the handoff — the point is to stop cleanly.
