---
name: jnk-3-decide
description: Choose an implementation direction collaboratively before writing code. User-invoked only via /skill:jnk-3-decide. Defines the product line (who, what problem, the pitch) and success — with a measurable outcome when one exists — weighs options through lenses, writes a decision record, names the work thread.
disable-model-invocation: true
---

# Decide

> Choose the direction. Nothing moves until the decision is made.

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

1. **The product line.** Who is this for? What user problem does it solve? How would we pitch it to a user in one sentence? (The blog-post test: if we can't say why it matters to someone, the change isn't ready to decide on.) Then **define success together:** What behavior changes? What must not change? What does "done" mean? How will we verify? (Tests represent intent — not "the code runs".) When a measurable outcome exists — latency, cost per call, quality score, conversion — name it: `Measured by: <metric + target>`. Tests verify the code; the metric verifies the change. No metric? Say "no measurable outcome yet" and move on — don't invent one.

2. **Generate options.** Meaningful alternatives only — the ones worth debating, and each one you could genuinely see implementing. For each: approach, pros, cons, cost. No filler options, no strawmen — if an option can't win on its merits, it isn't an option. If brainstorm already surfaced directions, carry them forward and sharpen them into options — but re-present the full list here regardless. The option list is decide's centerpiece; the user sees it in front of them before any judgment.

3. **Debate with the lenses.** Challenge your own and the user's assumptions. Seek the strongest reasoning, not agreement. Where lenses point in different directions, say so.

4. **Make the call — the user's, not yours.** Present every option with the trade-offs the lenses surfaced, then stop. Ask: "Which option would you defend, and what's your strongest reason?" — and wait for the answer before stating any recommendation. A lean from an earlier beat (brainstorm's "which direction do you find yourself defending?") is evidence, not a decision: present the list and ask again. Only after the user answers do you recommend: name your pick, your strongest reason, and where you differ from theirs. The user owns the decision. If a meaningful option cannot be chosen because an underlying decision remains unresolved, that is a decision tree worth walking — invoke /skill:jnk-grill rather than guessing. If important uncertainty remains, return to /skill:jnk-2-brainstorm or /skill:jnk-1-understand.

5. **Write the decision record.** Load `references/decision-record.md`: chosen approach, reason, runner-up, failure mode to watch, measured-by, verification strategy. Where: `docs/adr/<thread-name>.md` — one file per decision, committed with the code. Create the dir when missing: every project, even a small one, gets an ADR home — decisions are project truth, not session state, and the model finds them at a stable path in every feature. About ten lines.

6. **Name the thread.** A short name from the decision — `oauth-c-github-module`. It threads through the branch, the route, and the session log. One name, one story.

## Output

Product line (who / problem / pitch) / Goal / Success criteria / Measured by (when one exists) / Options considered / Decision / Tradeoffs / Failure mode to watch / Thread name / Open questions

## Handoff

If the decision holds, recommend /skill:jnk-4-design — the shape and the route are one beat. Do not start it: the next beat begins when the user invokes it.

## Do not

- Write implementation code, or a detailed plan.
- Decide without showing every option and getting the user's explicit choice — the call is theirs.
- Pass off a prior lean (e.g. from brainstorm) as a decision, or pass off "familiar" as "simple."
- Add abstraction without a demonstrated need.
- Expand scope without justification.
