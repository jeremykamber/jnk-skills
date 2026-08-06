---
name: decide
description: Choose an implementation direction collaboratively before writing code. User-invoked only via /skill:decide. Weighs options through lenses, writes a decision record, names the session's callsign.
disable-model-invocation: true
---

# Decide

> File the flight plan. Nothing moves until the route is committed.

## Purpose

Converge. Pick a direction deliberately, with the user owning the call. Do not jump from understanding into coding.

## Lenses

Apply these to every option; name the lens you are using:

- **Simple vs easy** (Hickey). Simple means unbraided — one notion. Easy means familiar. Call it out when "simpler" actually means "more familiar."
- **Wrong abstraction** (Metz). Duplication is far cheaper than the wrong abstraction. Abstract at the third occurrence (Rule of Three), not the first.
- **Smallest coherent change.** The least complex option that fully solves the problem. Start simple and let complexity be earned.
- **Inversion.** Ask: what would make this choice fail? Which failure mode can we survive? Pick the option whose failure you can foresee — and write that failure mode down.
- **No futures yet.** Do not optimize for requirements that have not arrived.

## Steps

1. **Define success together.** What behavior changes? What must not change? What does "done" mean? How will we verify? (Tests represent intent — not "the code runs".)

2. **Generate options.** Meaningful alternatives only — the ones worth debating. For each: approach, pros, cons, cost. No filler options.

3. **Debate with the lenses.** Challenge your own and the user's assumptions. Seek the strongest reasoning, not agreement. Where lenses point in different directions, say so.

4. **Make the call.** Recommend with reasons, then stop. The user owns the decision. If important uncertainty remains, return to /skill:brainstorm or /skill:understand.

5. **Write the decision record.** Load `references/decision-record.md`: chosen approach, reason, runner-up, failure mode to watch, verification strategy. Where: the repo's existing convention (ADR folder, docs/decisions/) — if none, ask. About ten lines.

6. **Name the callsign.** A short slug from the decision — `oauth-c-github-module`. It threads through the branch, the plan, and the session log. One name, one story.

## Output

Goal / Success criteria / Options considered / Decision / Tradeoffs / Failure mode to watch / Callsign / Open questions

## Do not

- Write implementation code, or a detailed plan.
- Pick the option for the user, or pass off "familiar" as "simple."
- Add abstraction without a demonstrated need.
- Expand scope without justification.
