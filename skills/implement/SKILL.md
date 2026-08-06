---
name: implement
description: Implement a plan one vertical slice at a time, staying conversational. User-invoked only via /skill:implement. Red-green-refactor inside each slice; a gate before each next slice.
disable-model-invocation: true
---

# Implement

> Fly the route. One slice at a time. No engine changes mid-air.

## Purpose

Fly the approved plan one vertical slice at a time. The user stays in control; you never disappear for the whole build.

## Steps

For each slice:

1. **Announce.** "Working on slice 2: the callback route. Files: routes/auth/* plus the callback test. Checkpoint: integration test passes." Name the files and the checkpoint. Hold short until cleared.

2. **Build it, red-green-refactor:**
   - Write the failing test first; watch it fail for the right reason.
   - Make it pass with the smallest change.
   - Refactor — work, right, fast, in that order.

3. **Checkpoint.** Run the slice's verification, plus anything it could have broken. Report: what changed, the result, any squawks.

4. **Gate.** "Ready for slice N+1?" Wait for the user. Do not proceed without clearance.

## Rules

- **No mid-air engine changes.** Do not refactor or fix unrelated code during implementation. If you find something that needs fixing, log a squawk — `[squawk] severity | location | what | why deferred` — and move on. If it blocks the slice, stop and ask.
- **The plan is a route, not a contract.** If reality contradicts the plan — a test reveals a wrong assumption — stop, tell the user, and adjust the slice or return to /skill:decide. Never improvise around a broken assumption silently.
- Touch only the files the slice needs. Follow existing conventions. No speculative improvements.

## Output

Per-slice reports (what changed, checkpoint result, squawks) / "Implementation complete — ready to verify" when the last slice lands.

## Do not

- Implement more than one slice without a gate.
- Touch files outside the slice, or fix squawks mid-flight without asking.
- Stay silent for the whole implementation.
