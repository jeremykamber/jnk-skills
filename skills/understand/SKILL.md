---
name: jnk-1-understand
description: Build a shared mental model of a codebase area before changing it. User-invoked only via /skill:jnk-1-understand. Locates relevant code, maps ownership, and makes unknowns explicit (the IOU ledger) before any design or implementation.
disable-model-invocation: true
---

# Understand

> Walk the code before you change it.

## Purpose

Build the smallest sufficient understanding needed to make a confident change — about 70% of the flow, not 100% of the code. Chesterton's Fence: do not take down a fence until you know why it was put up. Never change what you do not understand.

## Steps

1. **The request.** Restate what must change, what must not change, and any constraints. If the request is ambiguous, ask before exploring — and if the desired behavior itself is under-specified, that is a decision tree: invoke /skill:jnk-grill. If the codebase can answer the ambiguity, investigate instead.

2. **The reading list.** Propose the files you want to read (entry point, implementation, tests, one similar pattern — plus any `docs/adr/`, `docs/designs/`, or `docs/external/` entries that touch the area). Ask "Sound good?" — this is a **gate**; do not read yet. The user steers; you are the copilot.

3. **Read.** Only what was agreed. Report facts first: what the code does, not what you expect it to do. Label interpretations as interpretations.

4. **Build the model.** Present:
   - **Current behavior** — what happens today
   - **Components** — who participates
   - **Ownership** — which component owns which responsibility (not just which file contains it)
   - **Existing patterns** — how this codebase solves similar problems

5. **The Feynman check.** Explain the flow back in plain language, as if to a first-year engineer, without re-reading. If you cannot, that gap is an unknown. (If you can't explain it simply, you don't understand it.)

6. **The IOU ledger.** Every unknown is an IOU, numbered and visible: `IOU-1: how does logout invalidate sessions?` An IOU is retired only when answered — never silently dropped. If you cannot name the gap precisely, you have not found the gap.

7. **Align.** Present the model and the ledger. Ask the user first: "Where did this surprise you? What did you expect the code to do that it doesn't?" — the model is shared only when the user's expectation and the code's reality are both on the table. Then: "Is this right? What's missing?" If the surprises reveal the desired behavior was never settled, that is a decision tree: invoke /skill:jnk-grill. Do not plan or implement until the user confirms the model.

8. **Log the model when it earns keeping — a gate, not a wrap-up.** Once the model is agreed, write it to `.ai/contexts/<slug>/understanding.md` when it is substantial, likely to be amended, or may outlive this sitting — the durable model a future session reads. Skip the file when the conversation already holds a small, settled model; do not serialize it just because the workflow says so. Create the dir if this work has none yet; reuse it if it does (one dir per work thread, keyed by the feature slug). The notebook is gitignored: it is memory, not documentation. If the model changes materially later, update the file; it stays true. If the session must end before the model is agreed, use /skill:jnk-handoff to carry the thread — a handoff beats a forced understanding.md.

## Output

Summary / Current behavior / Components / Ownership / Patterns / Assumptions / IOU ledger / Proposed next reads (if the user wants to go deeper)

## Handoff

If the model holds, recommend the next beat — /skill:jnk-2-brainstorm when the problem is fuzzy, /skill:jnk-3-decide when it is concrete. Do not start it: the next beat begins when the user invokes it. When the model earned a file, confirm `understanding.md` exists on disk before presenting this handoff — check, don't assume; when it didn't, the conversation holds the model and the next beat starts from it.

## Do not

- Modify code, or plan how to.
- Read the whole repo chasing 100% certainty.
- Present speculation as fact.
- Explore unrelated areas without asking.
- Suggest fixes or refactors during understanding.
- Write a model file for ceremony — write `understanding.md` when it earns keeping; carry the thread with /skill:jnk-handoff when the session splits.
- Produce plans, designs, or solutions — those are the next beats' work.
