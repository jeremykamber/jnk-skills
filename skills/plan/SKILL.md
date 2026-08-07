---
name: jnk-5-plan
description: Turn a decision and design into a slice-by-slice implementation plan. User-invoked only via /skill:jnk-5-plan. Vertical slices only, each with its own checkpoint. Riskiest slice first.
disable-model-invocation: true
---

# Plan

> Waypoints and checkpoints. Change the route on paper, not in the air.

## Purpose

Turn the decision and design into a route: numbered vertical slices, each with its own checkpoint. This is where debate is cheapest — changing a plan costs nothing; changing code costs.

## The doctrine: vertical slices

Slice the work by what the user can see and touch — never by layer. No "all the backend, then all the UI." Each slice is a thin end-to-end story (UI → logic → persistence where relevant) that leaves the system working.

- **Walking skeleton.** Get the thinnest end-to-end slice working first, then thicken it. The skeleton walks before it has muscles.
- **Tracer bullet.** The first slice fires through the riskiest unknown. Order slices so the parts we understand least come first.
- **Full-stop flights.** A vertical slice lands: complete, working, verified. Horizontal work only climbs.

## Steps

1. **Confirm the decision and design.** If no decision record exists (decide was skipped — check `.ai/contexts/<dir>/decisions.md` or the repo's ADR convention), write the decision first: one line each for chosen approach, why, and the failure mode to watch — and name the callsign. The plan needs a record to confirm, and the callsign threads through the branch, the plan, and the log. If the plan reveals the decision was wrong, stop and return to /skill:jnk-3-decide. Do not paper over it.

2. **List the slices.** Each slice names:
   - What changes (files and areas)
   - Its checkpoint — the narrowest verification that gives confidence (a test, a typecheck, a manual path)
   - What it leaves working

3. **Order them.** Riskiest unknown first (tracer bullet), dependencies second. No slices for speculative features.

4. **Name the blast radius.** State what we expect NOT to touch, so the boundary is visible.

5. **Gate.** Present the route. Ask: "Approve the plan and the order?"

6. **Save (when it earns keeping).** If the plan is substantial, likely to be amended, or may outlive this sitting, save it to `.ai/contexts/<dir>/plans/01-initial.md`; revisions get `02-`, `03-`. Skip for trivial plans — but a plan that grows mid-flight (new slices, reordering) earns the file: that is where the amended route lives.

## Output

Numbered slices with checkpoints / Order and first slice / Blast radius / Overall verification strategy

## Handoff

If the plan is approved, recommend /skill:jnk-6-implement. Do not start it: the route is flown when the user invokes implement.

## Do not

- Plan by layer, or plan slices that leave the system broken between steps.
- Add speculative steps, or steps without checkpoints.
- Follow a plan the user has not approved.
