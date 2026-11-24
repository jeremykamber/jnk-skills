---
name: jnk-design
description: Understand a change, choose its direction, and shape the first slice before building. Use when the request touches more than one file, when the approach is not obvious, or when a decision is expensive to reverse. Writes a thread file, a design doc when it earns one, and a route to the first gate.
disable-model-invocation: true
---

# Design

> Read, decide, shape the first slice. Then let the code answer.

Four moves. Stop as soon as the next slice would only answer a question you are
about to guess at. That is the first gate, and it arrives in one command.

**Not every change needs this skill.** One file, an obvious approach, no decision
a reader would want recorded: that is `jnk-oneshot`. Say so and switch.

## 1. Understand — 70% of the flow

Restate the request: what changes, what must not, which constraints bind. If the
desired behaviour is undecided, run `jnk-grill` first.

Read `.ai/threads/*.md` when a thread covers this area; the last session already
paid for those decisions. Then read the three or four files that decide the
answer: the entry point, the code under change, its tests, one sibling that
solves a similar problem. State what the code does before what you expect it to
do, and label an interpretation as an interpretation.

Read the `writing` skill before you write the thread file or a design doc.

Write `.ai/threads/<slug>.md` (create `.ai/threads/` when it is missing):

```md
# <slug>
## Model
- behaviour today: ...
- components: ... ; owner of each responsibility: ...
- patterns this repo already uses: ...
- IOU-1: <the gap you could not close>      # retire it here when answered
```

Every unknown is a numbered IOU, retired in place. Explain the flow back in plain
words: where the explanation stalls is a gap you have not found yet. Check the
model with the user — "where did this surprise you?" — then stop guessing about
the rest.

## 2. Decide

Run `depth report <area>` before choosing. Shallow modules, deletion candidates
and drift are evidence about the direction, not a mandate.

List the options you could each defend, with the approach, the cost and the
failure you would lose sleep over. A structural decision you cannot roll back — a
migration, a public interface, a data boundary — earns two or three whole-shape
candidates, judged in a fresh context on `references/arena.md`. Everything else
takes the option list.

Ask the user which they would defend, then wait. The call is theirs; your job is
to make the trade-off legible.

Bad: "Option A is cleaner. Proceeding with A."

Good: "A: one table, no join, a rename costs a migration. B: two tables, a join
on every read, renames are free. I would take A unless renaming ships this
quarter. Which would you defend?"

## 3. Shape the first slice

No production code. Write what the first slice must be true about:

- the contract at each seam — inputs, outputs, errors, what null means;
- the failure paths, named, not hoped away;
- the data or call flow in a few lines of ASCII;
- one test per behaviour, written from the requirement, that can go red.

User-facing work gets a mockup before code; one HTML file is enough.

Save it as `docs/designs/<slug>.md` when it will be re-read: substantial, likely
amended, or the record of a decision. Otherwise keep it in the thread file.

The spec is a test, not a document. Write it in the project's own test framework
under `tests/acceptance/`, and see it fail against the current code. A scenario
that cannot run proves nothing; a document that restates the code helps nobody.

## 4. Route

Number the slices. Each one:

- is vertical — it works end to end and leaves the system running;
- has a checkpoint, the command that can say no;
- names what it does not touch;
- puts the least-understood part first.

Write the route into the thread file under `## Route`, then ask: "Which slice
scares you?" Approve, and stop. Reset is free at this seam: the file holds the
state, so a fresh session resumes with `jnk-pickup`.

Designing slices three and four is speculation the first checkpoint will correct.

## Output

Thread file written / the decision and its trade-off / the first-slice contract
and failure paths / the acceptance test that fails / the numbered route / what
this does not touch / the next skill to run.

## Next

`jnk-implement`. Recommend it and stop.
