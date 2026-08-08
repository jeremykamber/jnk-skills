---
name: jnk-6-implement
description: Implement a plan one vertical slice at a time, staying conversational. User-invoked only via /skill:jnk-6-implement. Red-green-refactor inside each slice, a gate before each next slice, and the slice ledger stays visible.
disable-model-invocation: true
---

# Implement

> Fly the route. One slice at a time. No engine changes mid-air.

## Purpose

Fly the approved plan one vertical slice at a time. The user stays in control; you never disappear for the whole build. The route can change mid-flight — the ledger is what keeps it visible.

## The slice ledger

At every gate, state the plan's current shape as a simple list, grouped by state:

- **Done:** slice 1 — strategy prompt fix — enumerated the required fields in the prompt so psychographics come back filled (checkpoint passed)
- **In flight:** slice 3 — neutral names
- **Owed:** slice 2 — ICP wiring (re-ordered behind slice 3)
- **Deferred:** slice 5 — cluster prompt (squawked, user's call)

**Owed** is the word that prevents lost work: any slice that exists but has not landed is owed. When the plan grows or reorders, the ledger says so out loud. A slice never falls out of the story silently.

When nothing changed since the last gate, a one-line summary suffices — `Ledger: 1 done, 2 in flight, 3 owed, 4 deferred` — but every slice stays named in every form. The full list returns whenever something changes, and always in the final report.

## Steps

For each slice:

1. **Announce from the ledger.** "Slice 3 (names): PersonaAdapter + its tests. Checkpoint: unit tests green, live run shows curated names." Name the files and the checkpoint. Hold short until cleared.

2. **Build it, red-green-refactor:**
   - Where a test can fail for the right reason, write it first and watch it fail — against the unfixed code, before the fix.
   - Make it pass with the smallest change.
   - Refactor — work, right, fast, in that order.

3. **Checkpoint.** Run the slice's verification, plus anything it could have broken. Report in plain language what you actually did — files touched, behavior changed — then the result and any squawks.

4. **Update the ledger.** Move the slice to Done. State what is now owed or deferred.

5. **Gate.** Show the ledger and ask: "Ready for the next slice?" Wait for the user. Do not proceed without clearance.

## Scope changes mid-flight

The user adds or reprioritizes work during implementation — the route changed. Then:

- Treat the new work as a slice: announce it, name its checkpoint, and **re-state the full ledger** — done / in flight / owed / deferred — in the new order. Say out loud what got pushed back.
- The user's request is clearance for the new slice, not for the rest of the plan. Other slices stay owed until they land.
- Never reorder silently. Silent reordering is how a slice gets lost.

## Rules

- **No mid-air engine changes.** Do not refactor or fix unrelated code during implementation. If you find something that needs fixing, log a squawk — `[squawk] severity | location | what | why deferred` — and move on. If it blocks the slice, stop and ask.
- **The plan is a route, not a contract.** If reality contradicts the plan — a test reveals a wrong assumption — stop, tell the user, and adjust the slice or return to /skill:jnk-3-decide. Never improvise around a broken assumption silently.
- Touch only the files the slice needs. Follow existing conventions. No speculative improvements.
- **Write for the next engineer.** Intent over cleverness; comments say why, not how. The simplest code is code that no longer exists — prefer removing to adding.

## Output

Per-slice reports (plain-language what changed, checkpoint result, squawks) / The final ledger — every slice listed as landed (with its what-changed), owed, or deferred / "Implementation complete — ready to verify" when the last slice lands.

## Handoff

When the last slice lands, recommend /skill:jnk-7-verify — and after verification, /skill:jnk-commit (user-invoked) writes the history; /skill:jnk-8-debrief closes the loop. Do not run the full verification sweep here: per-slice checkpoints only. The next beat begins when the user invokes it.

## Do not

- Implement more than one slice without a gate.
- Touch files outside the slice, or fix squawks mid-flight without asking.
- Reorder the plan silently — new slices re-order the ledger out loud, or not at all.
- Commit anything — history is written at the end, via /skill:jnk-commit (user-invoked).
- Stay silent for the whole implementation.
