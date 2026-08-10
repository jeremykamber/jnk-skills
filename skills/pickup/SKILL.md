---
name: jnk-0-pickup
description: Pick up where a previous session left off. User-invoked only via /skill:jnk-0-pickup. Finds the work in the engineering notebook (.ai/contexts/), reads what was learned and what's unfinished, and presents the state before any beat starts.
disable-model-invocation: true
---

# Pickup

> Pick up the thread. The notebook holds where you left off.

## Purpose

Pick up where a previous session left off. Find the work in the engineering notebook (`.ai/contexts/`), read what was learned and what's unfinished, and present the state. Nothing else — no planning, no code.

## Steps

1. **Find the context.** Ask what work is being continued (or use the feature name). Search `.ai/contexts/*/` — match the slug, or grep `understanding.md` and `notes.md` for the keywords. If nothing matches, say so and propose /skill:jnk-1-understand.

2. **Read.** `understanding.md` (the mental model and IOUs) and `notes.md` (what landed, squawks, the next leg). Read `decisions.md` and `verification/results.md` if the work needs the detail.

3. **Present the state.** In a few lines:
   - What the work is, and what's been decided (callsign)
   - What landed and what's airborne
   - Squawks and IOUs still open
   - The next leg — as the previous session named it

4. **Gate.** Ask: "Is this the right place to pick up?" Then propose the next beat — usually /skill:jnk-1-understand or /skill:jnk-5-plan. Do not start it until the user confirms.

## Do not

- Plan, design, or implement during pickup.
- Re-read git history or the whole codebase — the notebook is the source of truth for state.
- Create a new context dir for existing work — reuse the one that exists.
- Pretend a memory exists when nothing matches — say so.
