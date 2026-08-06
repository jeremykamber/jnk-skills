# Engineering Workflow — The Flight Manual

This workflow turns a coding session into a conversation between a pilot and a copilot. The skills in `skills/` enforce the conversation; this document explains the system. Read it once, and let the skills do the work.

---

## Purpose

This workflow defines how the human and the AI collaborate to safely modify software.

The goal is not maximum AI autonomy. The goal is engineering leverage while preserving human understanding, judgment, and ownership.

The AI is a pair programmer: it explores, reasons, challenges assumptions, proposes options, and implements changes. The human remains responsible for understanding the system, making tradeoffs, and approving decisions.

A successful session produces two outcomes:

1. Better software.
2. Better understanding of the software.

## Core principles

- **Shared understanding.** The AI never silently builds a mental model and acts on it. Understanding is made visible, discussed, and corrected.
- **The AI accelerates judgment; it does not replace it.** The AI never becomes a black box that writes code the human does not understand.
- **Tests define success.** Before implementation, the human and AI agree on what success means and how it will be verified.
- **Smallest coherent change.** Every change should be the smallest one that fully solves the problem, and should leave the system easier to understand, modify, and extend.

---

## The operating idea: a pre-flight culture

Software complexity outgrew the individual memory — the same problem cockpits faced in the 1930s. Aviation's answer was not genius; it was checklists plus conversation among experts. This workflow is that culture applied to code:

- **Aviate, navigate, communicate.** In that order: keep the system flying, then move, then talk. Protecting what works comes before adding what's new.
- **Gates.** Every beat ends with a clearance question: "Sound good?", "Approve this shape?", "Ready for slice N?" The human is the pilot; the AI is the copilot. The gates are the workflow — they are not politeness.
- **The hammock.** Thinking before deciding, with the tools off.
- **The simulator.** Throwaway prototypes in `.temp/design/`. In the simulator, crashing is free.
- **No mid-air engine changes.** Refactoring is maintenance — done in the hangar, on its own beat, with permission.
- **The squawk sheet.** Defects and debt are logged, never silently fixed, never silently forgiven.
- **The captain's log.** Every session ends with an entry: what landed, what's left, what's next.

---

## The beats

Nine skills, in order. The arc is a double diamond: widen, narrow, widen, narrow.

1. `/skill:jnk-1-understand` — pre-flight inspection. Build ~70% understanding of the relevant code, map ownership, log unknowns as IOUs.
2. `/skill:jnk-2-brainstorm` — the hammock. Think together with the tools off. No plans, no code, no verdicts. (Use this first when the problem is fuzzy; use understand first when the task is concrete.)
3. `/skill:jnk-3-decide` — file the flight plan. Options weighed through lenses, a decision record, a callsign.
4. `/skill:jnk-4-design` — the simulator. ASCII first, failure paths designed, prototypes when needed.
5. `/skill:jnk-5-plan` — waypoints and checkpoints. Vertical slices, each with its own verification.
6. `/skill:jnk-6-implement` — fly the route. One slice at a time, red-green-refactor, hold short between slices.
7. `/skill:jnk-7-verify` — post-flight inspection. Data, not opinion. Squawk sheet, IOU reconciliation.
8. `/skill:jnk-8-refactor` — maintenance in the hangar. Optional, always with permission.
9. `/skill:jnk-9-debrief` — the captain's log. What landed, squawks, the next leg.

It is a loop, not a pipeline: new information returns you to an earlier beat.

Earlier stages of this workflow map onto the beats: **Define Success** is step 1 of `/skill:jnk-3-decide`; **Teach Back** is the through-line in `/skill:jnk-9-debrief`; **Refine** is the debrief's process note.

---

## Vertical slices

Slice the work by what the user can see and touch — never by layer. A vertical slice is a thin end-to-end story (UI, logic, persistence) that is wired, working, and verified. It lands: complete, checked, done.

- First get a **walking skeleton** — the thinnest end-to-end slice — then thicken it.
- The first slice should be a **tracer bullet**: fire through the riskiest unknown early.
- Horizontal layering is the old waterfall habit: all the plumbing, then all the logic, then all the UI. It maximizes integration risk and delays feedback. Vertical slicing inverts it: feedback after every slice.

---

## Using the skills

- **Invocation.** `/skill:name` — e.g. `/skill:jnk-1-understand`.
- **User-invoked only.** Every skill sets `disable-model-invocation`, so the AI never picks one up on its own; you decide when a beat starts. This keeps the AI's context small and removes the unpredictability of model-invoked skills. The cost is that you carry the map — that is what this manual is for.
- **Expedited mode.** For small changes: understand → decide → plan → implement → verify. Add brainstorm when the problem is fuzzy, design when the shape matters, refactor when asked. Debrief is always cheap — take it.
- **Housekeeping.** `/skill:jnk-commit` — commit a session's work as a story of conventional commits.
- **Skill-writing standard.** These skills follow a checklist: user-invoked trigger; a small main file made of steps plus reference material hidden behind context pointers; leading words repeated so the AI adopts them ("vertical slice", "gate", "squawk"); and nothing that does not change behavior. Apply the same standard if you edit them.

---

## The ideas behind this

One line each — the sources that earned a place because they changed the design:

- **Gawande** — checklists plus conversation among experts beat individual memory.
- **Hickey** — hammock-driven development (think before deciding); simple is not easy.
- **Kahneman** — deliberate thinking beats the automatic first answer.
- **Metz** — duplication is cheaper than the wrong abstraction.
- **Fowler** — the Rule of Three; the technical debt quadrant.
- **Cockburn** — the walking skeleton.
- **Hunt & Thomas** — tracer bullets.
- **Beck** — red-green-refactor; work, right, fast.
- **Dijkstra** — tests show the presence of bugs, never their absence.
- **Chesterton** — don't remove a fence until you know why it was put up.
- **Ousterhout** — deep modules; define errors out of existence.
- **Saint-Exupéry** — perfection is reached when there is nothing left to take away. (He was a pilot. The patron saint of simplicity flew.)
