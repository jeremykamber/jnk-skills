---
name: jnk-design
description: Understand a change, choose its direction, and shape the first slice before building. Use before touching code when the request needs more than one file, when the approach is not obvious, or when a decision is expensive to reverse. Produces a thread file, a committed design doc when it earns one, and a route to the first gate.
---

# Design

> Read, decide, shape the first slice. Then let the code answer.

One beat, four moves. Stop when the next slice would answer a question you are
about to guess at — that is the first gate, and it arrives in one command.

**Not every change earns this.** One file, an obvious approach, no decision a
reader would want recorded: that is `jnk-oneshot`. Say so and switch, rather than
producing a route for a change that needs none.

## 1. Understand — about 70% of the flow

Restate the request: what changes, what must not, the constraints. If the
desired behaviour is genuinely undecided, run `jnk-grill` first.

Read `.ai/threads/*.md` first when a thread covers this area — the last session's
model, IOUs and decisions are already paid for. Then the three or four files that
decide the answer: entry point, the code under change, its tests, one sibling
that solves a similar problem. State what
the code does before what you expect it to do, and label interpretations as
interpretations.

Then write `.ai/threads/<slug>.md` (create `.ai/threads/` if it is missing):

```md
# <slug>
## Model
- behaviour today: ...
- components: ... ; owner of each responsibility: ...
- patterns this repo already uses: ...
- IOU-1: <the gap you could not close>      # retire it here when answered
```

Every unknown is an IOU in that list, numbered, retired in place. Explain the
flow back in plain words; where the explanation stalls is a gap you have not
found yet. Check the model with the user — "where did this surprise you?" — and
stop guessing about the rest.

## 2. Decide

Run `depth report <area>` before choosing. The shallow modules, deletion
candidates and drift are evidence about the direction, not a mandate.

List the real options — the ones you could each defend — with approach, cost and
the failure you would lose sleep over. A structural decision you cannot roll back
(a migration, a public interface, a data boundary) is worth designing twice: two
or three whole-shape candidates, judged in a fresh context on
`references/arena.md`. Everything else takes the option list.

Ask the user which they would defend, and wait. The call is theirs; your job is
to make the trade-off legible.

## 3. Shape the first slice

No production code. Write what the first slice must be true about:

- the contract at each seam — inputs, outputs, errors, what null means;
- the failure paths, named, not hoped away;
- the data or call flow in a few lines of ASCII;
- one test per behaviour, written from the requirement, that can go red.

User-facing work gets a mockup (an HTML file is enough) before code.

Save it as `docs/designs/<slug>.md` when it will be re-read: substantial, likely
amended, or the record of a decision. Otherwise keep it in the thread file.

The spec is a test, not a document. Write it as a failing test in the project's
own test framework under `tests/acceptance/`, seen red against the current code.
A scenario that cannot run proves nothing; a document that restates the code
helps nobody.

## 4. Route

Number the slices. Each one:

- is vertical: it works end to end and leaves the system running;
- has a checkpoint — the command that can say no;
- names what it does not touch;
- is ordered so the least-understood part lands first.

Write the route into the thread file under `## Route`, and ask: "Which slice
scares you?" Then approve. Reset is free at this seam: the file holds the state,
so a fresh session can resume with `jnk-pickup`.

Stop here when the first slice is shaped. Designing slices three and four is
speculation the first checkpoint will correct.

## Output

Thread file written / decision and its trade-off / first-slice contract and
failure paths / acceptance test that fails / numbered route / what this does not
touch / the next beat to run.

## Next

`jnk-implement`. Recommend it and stop.
