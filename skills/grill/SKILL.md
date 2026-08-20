---
name: jnk-grill
description: Fire mid-any-beat when a consequential decision is unresolved and only the user can make it. Walk the decision tree one question at a time — propose your recommended answer, research facts first, stop for the user to decide. Do not fire for trivial choices or questions the codebase can answer. Hands back to the calling beat when the tree is walked.
---

# Grill

> What have we not decided? Walk the tree — one branch at a time.

## Purpose

Grill is a decision interview. The agent is the interviewer: it walks the decision tree one branch at a time, proposes a recommended answer for each question, researches facts itself, challenges assumptions, and stops for the user to decide. Grill is not a phase — it is a reasoning primitive. Firing it is the agent's call: when a decision tree appears, invoke this skill rather than asking permission or guessing. It hands back to the calling beat when the branch is walked.

## When to grill

The test is not the phase — it is: *is there an unresolved decision here that only the user can make?* Product questions, architecture questions, and deep implementation questions all get grilled the same way.

- During **understand** — the desired behavior itself is ambiguous.
- During **decide** — an option can't be chosen because an underlying question is unanswered.
- During **design** — the shape exposes a hidden choice: who owns retry? what happens on partial failure? where does the boundary live?
- During **implement** — a slice reveals the route rests on an undecided question.

## The triage — don't manufacture decisions

Before asking anything, classify it:

1. **Obvious?** Don't ask.
2. **Answerable from the code or docs?** Investigate, don't ask. (A deep investigation is /skill:jnk-1-explore's job — say so and return there.)
3. **Genuinely consequential or ambiguous?** Ask.
4. **A small detail the agent can safely choose?** Choose it, say so in one line, move on.

Grilling every possible decision is noise. The user answers only the questions that need a human.

## Steps

1. **Name the branch.** State the unresolved decision as a question and the options you can see — **genuine options only**: each one a real approach a reasonable engineer could defend, not a strawman propped up to make your recommendation look obvious. If an option can't win on its merits, it isn't an option. A few lines — grill is lean.

2. **Research first.** Read what informs the question — code, `docs/adr/`, `docs/designs/`, `docs/external/` — before asking. Present the facts and your recommendation with the question: "I'd pick X because `<fact>` — unless you see a reason not to." Your recommendation is a starting point, not the answer.

3. **One question at a time.** One branch per exchange. No question dumps — the user never faces a wall of decisions. When a branch depends on an earlier answer, wait for it.

4. **Challenge, then explore.** Push back on assumptions that look wrong — that is the adversarial part. When a challenge lands, follow the branch it opens: "What does 'separate' mean?", "Does the user ever see the intermediate?", "Who owns the retry?" are normal grill questions, whatever beat you came from.

5. **The user decides.** Stop and wait for each answer. If the user keeps saying "you decide", name what you are about to choose and confirm it before choosing — a consequential decision never passes on reflex.

6. **Keep the running log.** After each answer, restate the decisions so far in one visible line. The tree stays visible; a wrong turn is caught early. Grill writes no artifact — the conversation is the record, and the decisions land in the beat that owns them (the ADR, the design doc).

7. **Check the tree.** After each branch: "Any consequential branch left on this decision?" When none remain, end.

8. **Hand back.** Restate the decisions and where the calling beat stands: "Grill resolved: `<decisions>`. Back to decide — the options are A' and C; B is dead because `<reason>`." Unknowns the codebase must answer go back to /skill:jnk-1-explore. Do not start the next beat's work.

## Output

Resolved decisions, with the user's reasons / Rejected branches, and why / Choices delegated to the agent, named / New IOUs, when the grill surfaces unknowns / The calling beat, resumed with the decisions applied

## Handoff

Grill hands back to the beat it came from — restate that beat's state with the decisions applied, then stop. The next step is the user's call.

## Do not

- Manufacture decisions — run the triage before every question.
- Offer strawman options or filler — every option you present must be a real approach you could defend.
- Dump questions, or ask more than one at a time.
- Decide for the user, or let "you decide" pass without a named confirmation.
- Plan, design, or implement during a grill — resolve decisions only.
- Turn the grill into an understand pass — deep investigation belongs to /skill:jnk-1-explore.
- Write artifacts — durable knowledge lands in the beat that owns it.
