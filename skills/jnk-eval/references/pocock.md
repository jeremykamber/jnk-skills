# Pocock — the skill checklist

Source: Matt Pocock's "The Missing Manual: How to Write Great Skills" (AI Engineer World's Fair). The framework for telling a good skill from a bad one. Run it over every skill you write and every skill you audit. A massive skill is a symptom — it usually fails one of these four parts.

---

## 1. Trigger — how the skill gets invoked

Two kinds:

- **Model-invoked** — a description sits in the agent's context, pointing at SKILL.md (a *context pointer*). Cost: context load (description tokens on every request, one more thing for the agent to think about) and unpredictability (the model may simply not follow the pointer, even when it's perfect — which forces you to eval your skills to check they fire).
- **User-invoked** (`disable-model-invocation: true`) — the description shows only to the user. Cost: cognitive load on the user (more to carry in your head). Benefit: zero context load on the agent, zero unpredictability.

Both cost something — the choice is which load you pay. Pocock prefers user-invoked for predictability; it removes a whole class of problem (does it fire at the right time?) instead of adding eval burden.

Checks:

- [ ] Which kind is it, and is that the right trade for this skill?
- [ ] If model-invoked: does the description say *when* to fire? (A good context pointer.)

## 2. Structure — steps and reference

Two units: **steps** (the procedure) and **reference** (supporting information — templates, glossaries, checklists). A skill can be all-reference or all-steps; most need both.

Branches: when a skill is used several ways, reference material that only matters for one branch belongs in an *external reference* — a separate file behind a context pointer ("if you need the template, go to this file"), bundled with the skill. That keeps SKILL.md small.

Checks:

- [ ] Steps and reference are separated.
- [ ] Branch-only material is behind a context pointer, not inline.
- [ ] Every context pointer resolves to a real file.

## 3. Steering — leading words and leg work

**Leading words** are the main lever. Pack meaning into a short phrase, repeat it in the skill; the agent repeats it in its thinking tokens and output, which re-triggers the meaning and changes behavior. They work best when the word already lives in the agent's training data associated with good practice: "vertical slice" triggers a whole literature (Cockburn, walking skeletons, tracer bullets) — the word *is* the concept. A scenic or invented word forces a decode step every time and steers nothing. The empirical test: after a skill runs, its leading words should appear in the reasoning traces.

**Leg work** — agents rush early steps toward a known goal (ask-clarifying-questions is the classic; it never does enough work when the plan step is visible). The fix: split phases into separate skills so the agent only sees the current step. Hiding the future goal increases effort on the present one.

Checks:

- [ ] Every leading word passes the training-data test: does the agent already associate it with the behavior? (vertical slice yes; a metaphor word no.)
- [ ] Leading words are repeated through the skill, not stated once.
- [ ] Steps that need deep leg work aren't visible next to their payoff.

## 4. Pruning — duplication, sediment, no-ops

- **Duplication** — every piece of knowledge has a single source of truth. Don't repeat reference material across skills, steps, or files.
- **Sediment** — content accumulates as everyone adds and nobody deletes. Structure it (move branch-only material out) or kill it (irrelevant or stale).
- **No-ops** — text that looks like it does something but doesn't change behavior. The **deletion test**: if you delete the line, does the agent behave differently? If not, it's a no-op.

Checks:

- [ ] Deletion test passes on every non-step line.
- [ ] No duplication — single source of truth.
- [ ] No sediment — nothing irrelevant or stale.

---

## The sweep

1. Trigger: firing at the right times; context load vs. cognitive load chosen deliberately.
2. Structure: steps + reference; branches hidden behind pointers; SKILL.md as small as possible.
3. Steering: leading words condensed, repeated, training-data-tested; leg work right-sized by splitting where needed.
4. Pruning: no duplication, no sediment, no no-ops.

Then the field test: reasoning traces should echo the leading words. Run the workflow's own eval (scripts/extract.py) and read the adoption table — discipline words high, artifact words present when things were written, scenery words low. If the trace doesn't adopt the word, the word isn't steering — change it.
