# The arena

Design a direction that is expensive to change *more than once*: two or three structurally
distinct designs for one brief, a fresh context judging them on the lenses, and a recommended
base with the others' best ideas grafted in. This is the hard case of the decision — run it in
Phase 0 when the direction is a **one-way door**: a migration you cannot roll back, an interface
someone else is already coding against, a boundary you cannot move afterwards. A reversible
decision does not earn it; the option list and the debate settle those, and the ceremony would
cost more than the choice.

**The candidates are designs, never features.** Nothing here is built. Implementation happens
once, later, against the shape that wins. A throwaway spike (`.ai/contexts/<dir>/designs/`) is
allowed to settle one decision a candidate cannot claim on paper, and it is discarded with the
candidate.

Candidates are throwaway evidence, so they go in the notebook, not the repo:
`.ai/contexts/<slug>/arena/`. This beat owns the committed record (`docs/adr/`, `docs/designs/`);
the arena owns the comparison, and the winner is folded into the record like any other chosen
direction.

## Steps

1. **Frame the brief.** The problem in the user's words, the constraints that are not negotiable,
   the non-goals, and the one decision this must settle. Name the one-way door that makes the
   arena worth its cost. A brief the candidates can read twice and still disagree about is
   underspecified: fix it here, rather than paying for the ambiguity three times.

2. **Fan out two or three candidates, one subagent each, isolated.** Each candidate gets the same
   brief and the package shape below, and writes its own file. Three is the ceiling: a fourth
   rarely changes the choice and always costs a comparison. Require structural distinctness —
   whole-shape alternatives, not point fixes inside one shape. When you can see a candidate
   converging on another, say so and replace it.

3. **Judge in a fresh context.** A subagent that produced none of the candidates reads every one
   start to finish and scores them against a rubric written **after** the candidates exist, so the
   rubric cannot be gamed. The rubric is the lenses above — deep module, inversion (the failure you
   would lose sleep over), smallest coherent change, wrong abstraction, the next engineer — plus
   blast radius and cost. It is not a vote: one candidate can win while another contributes the
   better error model.

4. **Recommend a base, and graft.** Pick the base, take the strongest ideas from the others, and
   name what came from where. Two outcomes carry real signal. If every candidate converged on the
   same shape, record that convergence as evidence for the shape. If they diverged wildly, the
   brief was underspecified: rewrite it and run the arena again, rather than picking the least bad.

5. **Present, and stop.** The chosen shape, the rejected candidates and the one thing each did
   better, the rubric verdict, and the single assumption most likely to be wrong. The user decides;
   the arena recommends. This is the decision gate's input, not a substitute for it.

## The candidate package

One file per candidate: the whole shape of one approach, at the altitude of a design rather than
its implementation. Write it for the judge, who reads all of the candidates cold.

Each candidate answers these, in order — drop a section only when it genuinely does not apply, and
say why:

1. **Caller usage first.** The calling code as it would read at the seam. Types, signatures, and
   module boundaries follow *from* the usage, not the other way round. A design that is elegant
   inside its own file and awkward at every call site is the failure this ordering prevents.
2. **The shape.** The data and state, the module map, what each module owns, and where the
   complexity lives. Name the seam that carries the hard part.
3. **Contracts.** Per component: what goes in, what comes out, and the step-by-step in between, in
   the compact block this beat uses.
4. **Flow.** How a request or a datum moves through it, top to bottom.
5. **Failure paths.** What happens when the provider is down, the input is bad, the call is slow,
   the second call arrives. Not a token list — the failures you would actually worry about.
6. **What this candidate rejected.** The whole-shape alternatives considered *within* this shape and
   dropped, and why. A candidate that rejected nothing is a first draft, not a design.
7. **The assumption most likely wrong.** One line. The judge reads it against the other candidates,
   and it is usually the thing that decides between them.
8. **Cost and blast radius.** Rough: how many files, how much new public surface, how reversible,
   what it touches that it should not.

Rules: zero production code (`not implemented` bodies and pseudocode are expected); structurally
distinct from every sibling, and never read a sibling; as short as it can be. Each candidate's
subagent owns its file and may not write to the repo.

## Do not

- Run the arena for a reversible, low-stakes decision. The option list and the debate settle those.
- Let a candidate write to the repo, or commit any of them.
- Let a candidate read another's file, or be a variation on another. Whole shapes, or it is not an arena.
- Write the rubric before the candidates exist, or hand it to the candidate authors.
- Let one of the authors judge, or average the scores into a vote.
- Pick a winner from a divergent set. A divergent set is an underspecified brief.
- Decide for the user. Recommend, name the tradeoff, and stop.
