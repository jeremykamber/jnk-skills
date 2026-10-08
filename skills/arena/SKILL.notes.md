# jnk-arena — notes

Private notes for the human. The agent never sees this file.

**What:** Design a one-way-door direction two or three times, judge the candidates on a rubric in a fresh context, and recommend a base with the strongest ideas grafted in. Designs, not features.

**When:** the direction is expensive to change — a migration you cannot roll back, an interface someone else codes against, a boundary you cannot move. Not for a reversible decision; design settles those from a list.

**Why:** a single shape is a guess whose edges you cannot see. Two structurally distinct designs make the choice visible, and a judge that did not write any of them is the cheapest second opinion available without a second model.

**Fits:** before `jnk-2-design` (it settles the direction; design writes the record and the route), or fired from it at a one-way door. Candidates are throwaway, in the notebook; the winner goes into `docs/adr/` and `docs/designs/` through design. Reuses the design lenses as the rubric, so there is no second vocabulary.

**Refs:** pstack's `arena` skill and `architect` Phase B (design it twice, whole-shape alternatives, judge + graft), and `exhaust-the-design-space`. Adapted: pstack's judge is a different model; here the judge is a fresh context because this workflow keeps one model.
