---
name: jnk-1-explore
description: Build a shared mental model and explore candidate directions before deciding. User-invoked only via /skill:jnk-1-explore. Combines codebase understanding with divergent thinking, logging IOUs immediately.
disable-model-invocation: true
---

# Explore

> Walk the code, then think. The answer forms when you stop forcing the problem.

## Purpose

Build the smallest sufficient understanding needed to make a confident change (about 70% of the flow, not 100% of the code), then explore candidate directions without committing. Chesterton's Fence: do not take down a fence until you know why it was put up. Never change what you do not understand.

## Steps

1. **The request.** Restate what must change, what must not change, and any constraints. If the request is ambiguous, ask before exploring — and if the desired behavior itself is under-specified, that is a decision tree: invoke /skill:jnk-grill. If the codebase can answer the ambiguity, investigate instead.

2. **Think first (mandatory).** Open by thinking out loud from what you already know. No tool calls — no file reads, no searches, no code. If a fact would change the thinking, name it as a question and ask permission to check it. The user may lift the rule; you never lift it yourself. This forces deliberate, slow thinking instead of the automatic first answer.

3. **The reading list.** Propose the files you want to read (entry point, implementation, tests, one similar pattern — plus any `docs/adr/`, `docs/designs/`, or `docs/external/` entries that touch the area). Ask "Sound good?" — this is a **gate**; do not read yet. The user steers; you are the copilot.

4. **Read.** Only what was agreed. Report facts first: what the code does, not what you expect it to do. Label interpretations as interpretations.

5. **Build the model.** Present:
   - **Current behavior** — what happens today
   - **Components** — who participates
   - **Ownership** — which component owns which responsibility (not just which file contains it)
   - **Existing patterns** — how this codebase solves similar problems

6. **The Feynman check.** Explain the flow back in plain language, as if to a first-year engineer, without re-reading. If you cannot, that gap is an unknown. (If you can't explain it simply, you don't understand it.)

7. **The IOU ledger.** Every unknown is an IOU, numbered and visible: `IOU-1: how does logout invalidate sessions?` An IOU is retired only when answered — never silently dropped. If you cannot name the gap precisely, you have not found the gap.

8. **Write IOUs immediately.** Write the IOU ledger to `.ai/contexts/<slug>/understanding.md` **now**, not later. Create the dir if this work has none yet; reuse it if it does (one dir per work thread, keyed by the feature slug). The notebook is gitignored: it is memory, not documentation. If the model changes materially later, update the file; it stays true.

9. **Align.** Present the model and the ledger. Ask the user first: "Where did this surprise you? What did you expect the code to do that it doesn't?" — the model is shared only when the user's expectation and the code's reality are both on the table. Then: "Is this right? What's missing?" If the surprises reveal the desired behavior was never settled, that is a decision tree: invoke /skill:jnk-grill. Do not plan or implement until the user confirms the model.

10. **Diverge.** Generate several framings and candidate directions, including the wild one. Invite "what if we didn't have X at all?" The non-wild candidates must be genuinely good — real directions a reasonable engineer could take, not props to make a favorite look obvious.

11. **First principles.** For each direction: what is the system for? What is the smallest thing that could possibly work?

12. **No commitment.** Present the directions and the sharpest open questions. Do not argue for one. End by asking: "Ready to decide, or keep thinking? — and which direction do you find yourself defending?" The user's lean is evidence, not a verdict — and not the choice: /skill:jnk-2-design re-presents the directions and asks for the decision itself.

## Persistence Gate

Before proceeding to the next beat, confirm:
- [ ] IOUs are in `.ai/contexts/<slug>/understanding.md`
- [ ] Model is written to file when agreed
- [ ] If either is missing, write it first

## Output

Summary / Current behavior / Components / Ownership / Patterns / Assumptions / IOU ledger (written to disk) / Candidate directions (short list) / The questions that matter / What we're not ready to decide yet

## Handoff

If the model holds and directions are explored, recommend /skill:jnk-2-design. Do not start it: the next beat begins when the user invokes it. When the model earned a file, confirm `understanding.md` exists on disk before presenting this handoff — check, don't assume; when it didn't, the conversation holds the model and the next beat starts from it.

## Do not

- Modify code, or plan how to.
- Read the whole repo chasing 100% certainty.
- Present speculation as fact.
- Explore unrelated areas without asking.
- Suggest fixes or refactors during understanding.
- Write a model file for ceremony — write `understanding.md` when it earns keeping; carry the thread with /skill:jnk-handoff when the session splits.
- Produce plans, designs, or solutions — those are the next beats' work.
- Commit to a direction — judgment belongs to /skill:jnk-2-design.
- Converge early — keep divergent thinking open.
- Let "we've always done it this way" stand unchallenged.
