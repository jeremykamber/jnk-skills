# The candidate package

One file per candidate: the whole shape of one approach, at the altitude of a design rather
than its implementation. Write it for the judge, who reads all of the candidates cold and
never saw you think.

## Shape

Each candidate answers these, in this order. Drop a section only when it genuinely does not
apply, and say why.

1. **Caller usage first.** The calling code as it would read at the seam. Types, signatures, and
   module boundaries follow *from* the usage, not the other way round. A design that is elegant
   inside its own file and awkward at every call site is the failure this ordering prevents.
2. **The shape.** The data and state, the module map, what each module owns, and where the
   complexity lives. Name the seam that carries the hard part.
3. **Contracts.** Per component: what goes in, what comes out, and the step-by-step in between,
   in the compact block the design beat uses.
4. **Flow.** How a request or a datum moves through it, top to bottom.
5. **Failure paths.** What happens when the provider is down, the input is bad, the call is slow,
   the second call arrives. Not a token list — the failures you would actually worry about.
6. **What this candidate rejected.** The whole-shape alternatives considered *within* this shape
   and dropped, and why. A candidate that rejected nothing is a first draft, not a design.
7. **The assumption most likely wrong.** One line. The judge will read it against the other
   candidates, and it is usually the thing that decides between them.
8. **Cost and blast radius.** Rough: how many files, how much new public surface, how reversible,
   what it touches that it should not.

## Rules

- **Zero production code.** `not implemented` bodies and pseudocode are expected; a compiled file
  is not.
- **Structurally distinct.** Two candidates that share a shape are one candidate. If you notice
  you are converging on another, that is worth saying out loud, not hiding.
- **Do not read another candidate.** Each is written independently from the brief, or the
  comparison measures nothing.
- **As short as it can be.** The judge is comparing shapes, not reading prose.
- **Owner is the subagent that wrote it.** It may not edit a sibling, and it may not write to the
  repo. Its file lives in `.ai/contexts/<slug>/arena/`.
