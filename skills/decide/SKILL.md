---
name: jnk-3-decide
description: Choose an implementation direction collaboratively before writing code. User-invoked only via /skill:jnk-3-decide. Weighs options through lenses, writes a decision record, names the session's callsign.
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
- **The next engineer.** Which option will the next person to touch this find obvious? Write for readers, not authors.
- **Inversion.** Ask: what would make this choice fail? Which failure mode can we survive? Pick the option whose failure you can foresee — and write down the failure mode you'd actually fear, not a token one.
- **No futures yet.** Do not optimize for requirements that have not arrived.

## Steps

1. **Define success together.** What behavior changes? What must not change? What does "done" mean? How will we verify? (Tests represent intent — not "the code runs".)

2. **Generate options.** Meaningful alternatives only — the ones worth debating, and each one you could genuinely see implementing. For each: approach, pros, cons, cost. No filler options, no strawmen — if an option can't win on its merits, it isn't an option.

3. **Debate with the lenses.** Challenge your own and the user's assumptions. Seek the strongest reasoning, not agreement. Where lenses point in different directions, say so.

4. **Make the call.** Recommend with reasons, then stop. The user owns the decision. If important uncertainty remains, return to /skill:jnk-2-brainstorm or /skill:jnk-1-understand.

5. **Write the decision record.** Load `references/decision-record.md`: chosen approach, reason, runner-up, failure mode to watch, verification strategy. Where: the repo's existing convention (ADR folder, docs/decisions/) — if none, append to `.ai/contexts/<dir>/decisions.md` (the engineering notebook), one record per decision, keyed by callsign. About ten lines.

6. **Name the callsign.** A short slug from the decision — `oauth-c-github-module`. It threads through the branch, the plan, and the session log. One name, one story.

## Output

Goal / Success criteria / Options considered / Decision / Tradeoffs / Failure mode to watch / Callsign / Open questions

## Handoff

If the decision holds, recommend the next beat — /skill:jnk-4-design when the shape matters, else /skill:jnk-5-plan. Do not start it: the next beat begins when the user invokes it.

## Do not

- Write implementation code, or a detailed plan.
- Pick the option for the user, or pass off "familiar" as "simple."
- Add abstraction without a demonstrated need.
- Expand scope without justification.
