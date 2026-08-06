---
name: jnk-1-understand
description: Build a shared mental model of a codebase area before changing it. User-invoked only via /skill:jnk-1-understand. Locates relevant code, maps ownership, and makes unknowns explicit (the IOU ledger) before any design or implementation.
disable-model-invocation: true
---

# Understand

> Pre-flight inspection. You do not fly an aircraft you have not walked around.

## Purpose

Build the smallest sufficient understanding needed to make a confident change — about 70% of the flow, not 100% of the code. Chesterton's Fence: do not take down a fence until you know why it was put up. Never change what you do not understand.

## Steps

1. **The request.** Restate what must change, what must not change, and any constraints. If the request is ambiguous, ask before exploring.

2. **The reading list.** Propose the files you want to read (entry point, implementation, tests, one similar pattern). Ask "Sound good?" — this is a **gate**; do not read yet. The user steers; you are the copilot.

3. **Read.** Only what was agreed. Report facts first: what the code does, not what you expect it to do. Label interpretations as interpretations.

4. **Build the model.** Present:
   - **Current behavior** — what happens today
   - **Components** — who participates
   - **Ownership** — which component owns which responsibility (not just which file contains it)
   - **Existing patterns** — how this codebase solves similar problems

5. **The Feynman check.** Explain the flow back in plain language, as if to a first-year engineer, without re-reading. If you cannot, that gap is an unknown. (If you can't explain it simply, you don't understand it.)

6. **The IOU ledger.** Every unknown is an IOU, numbered and visible: `IOU-1: how does logout invalidate sessions?` An IOU is retired only when answered — never silently dropped. If you cannot name the gap precisely, you have not found the gap.

7. **Align.** Present the model and the ledger. Ask: "Is this right? What's missing?" Do not plan or implement until the user confirms the model.

8. **Log the model.** Write the agreed model and IOU ledger to `.ai/contexts/YYYY-MM-DD-<slug>/understanding.md` — the engineering notebook. Create the dir if this work has none yet; reuse it if it does (the date is when the work started). The notebook is gitignored: it is memory, not documentation.

## Output

Summary / Current behavior / Components / Ownership / Patterns / Assumptions / IOU ledger / Proposed next reads (if the user wants to go deeper)

## Do not

- Modify code, or plan how to.
- Read the whole repo chasing 100% certainty.
- Present speculation as fact.
- Explore unrelated areas without asking.
- Suggest fixes or refactors during understanding.
