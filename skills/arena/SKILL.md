---
name: jnk-arena
description: "Run two or three structurally distinct designs for one brief, judge them on a rubric, and recommend a base with the strongest ideas grafted in. User-invoked only via /skill:jnk-arena. Designs, not features. For the one-way-door direction the design beat would otherwise settle from a list."
disable-model-invocation: true
---

# Arena

> Design it twice. A single shape is a guess you cannot see the edges of.

## Purpose

Settle a direction that is expensive to change by designing it more than once. Two or three candidates, each a whole shape rather than a variation on one, judged against a rubric, then folded into one recommendation: a base, plus the strongest ideas from the others.

The candidates are **designs, never features**. Nothing here is built. Implementation happens once, later, against the shape that wins. The only exception is a throwaway spike to settle one decision a candidate cannot make on paper, and that spike is discarded with its candidate.

Run it when the direction is a **one-way door**: a migration you cannot roll back, an interface someone else is already coding against, a boundary you cannot move afterwards. A reversible decision does not earn this; the design beat settles those from a list, and the ceremony would cost more than the choice.

## Where the candidates live

Candidates are throwaway evidence, so they go in the notebook, not the repo: `.ai/contexts/<slug>/arena/`. Design owns the committed record (`docs/adr/`, `docs/designs/`); this skill owns the comparison, and hands the winner over.

## Steps

1. **Frame the brief.** The problem in the user's words, the constraints that are not negotiable, the non-goals, and the one decision this must settle. Name the one-way door that makes the arena worth its cost. A brief the candidates can read twice and still disagree about is underspecified: fix it here, rather than paying for the ambiguity three times.

2. **Fan out two or three candidates, one subagent each, isolated.** Each candidate gets the same brief and the package shape in `references/candidate.md`, and writes its own file. Three is the ceiling: a fourth rarely changes the choice and always costs a comparison. Require structural distinctness — whole-shape alternatives, not point fixes inside one shape. When you can see a candidate converging on another, say so and replace it.

3. **Judge in a fresh context.** A subagent that produced none of the candidates reads every one start to finish and scores them against a rubric written **after** the candidates exist, so the rubric cannot be gamed. Reuse the design lenses as the rubric — deep module, inversion (the failure you would lose sleep over), smallest coherent change, wrong abstraction, the next engineer — plus blast radius and cost. It is not a vote: one candidate can win while another contributes the better error model.

4. **Recommend a base, and graft.** Pick the base, take the strongest ideas from the others, and name what came from where. Two outcomes carry real signal. If every candidate converged on the same shape, record that convergence as evidence for the shape. If they diverged wildly, the brief was underspecified: rewrite it and run the arena again, rather than picking the least bad.

5. **Hand back, and stop.** The chosen shape, the rejected candidates and the one thing each did better, the rubric verdict, and the single assumption most likely to be wrong. The user decides; this skill recommends. Do not start the next beat.

## What a candidate is

A design package, shaped per `references/candidate.md`: caller usage first, then types and signatures, module boundaries, data flow, failure paths, what it rejected, and the assumption it is most likely wrong about. Zero production code. A throwaway spike (`.ai/contexts/<dir>/designs/`) is allowed to settle one decision a candidate cannot claim on paper, and it is discarded with the candidate.

Never build the feature two or three times. The candidates exist to choose a shape, not to ship competing versions of it.

## Do not

- Run the arena for a reversible, low-stakes decision. The design beat settles those.
- Let a candidate write to the repo, or commit any of them.
- Let a candidate read another's file, or be a variation on another. Whole shapes, or it is not an arena.
- Write the rubric before the candidates exist, or hand it to the candidate authors.
- Let one of the authors judge, or average the scores into a vote.
- Pick a winner from a divergent set. A divergent set is an underspecified brief.
- Decide for the user. Recommend, name the tradeoff, and stop.

## Output

The brief, and the one-way door that earns this / The candidates, one per line, with the shape that makes each distinct / The rubric verdict, per candidate / The recommended base, and what was grafted from the others / The rejected candidates, and the one thing each did better / The assumption most likely to be wrong / Where the candidates are saved (`.ai/contexts/<slug>/arena/`)

## Handoff

Bring the recommended shape to `/skill:jnk-2-design`, which writes the decision record, shapes it (contracts, call stack, test shapes, failure paths, the acceptance spec), and routes it into slices. The arena settles the direction; design owns the record and the route. Do not start it: if the user has not chosen yet, this skill's job ends at the recommendation.
