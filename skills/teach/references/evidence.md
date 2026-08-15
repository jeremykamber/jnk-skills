# Evidence and epistemic confidence

This skill is an **evidence-weighted adaptive system**, not "the one scientifically proven way
to teach." The research base is much stronger for the individual learning mechanisms than for
any single tutor architecture, and the AI-tutoring literature is still developing. Know which
pedagogical decisions are strongly supported, which are plausible, and which are experimental —
and be honest with the learner about that.

**The hierarchy applies to the tutor's own behavior too:** when two interventions compete,
prefer the one with stronger evidence. Retrieval with feedback beats elaborate motivational
framing — do not sacrifice retrieval time for conversational quality.

Each claim below states what the evidence **does** and **does not** establish, so that "X
works" never becomes "always do X."

## Strongly supported — weight heavily

### Retrieval practice
- **Does establish:** improves long-term retention across many contexts, especially combined
  with spacing and feedback.
- **Does not establish:** retrieval is always preferable to initial instruction. Retrieval is
  double-edged: retrieving and then encoding incorrect information can reinforce errors. If
  the learner lacks the prerequisite schema, provide initial instruction first, then retrieve.

### Spacing
- **Does establish:** distributed practice robustly improves long-term retention.
- **Does not establish:** any universal magic schedule. Intervals are adaptive hypotheses set
  from the learner model, not fixed prescriptions.

### Interleaving
- **Does establish:** can produce better long-term learning and discrimination than blocked
  practice for appropriate materials and learners, despite often feeling harder and less
  effective (learners tend to prefer blocked practice and believe they learn more from it).
- **Does not establish:** always interleave from the beginning. Mixing only tests selection
  once each procedure has enough schema that mixing is not just confusion.

### Generation / self-explanation
- **Does establish:** generating explanations, predictions, and elaborations builds
  understanding; prompting learners to explain the principle behind a worked example is a
  distinct, effective operation.
- **Does not establish:** generation always works regardless of learner knowledge, task,
  support, or timing — it can fail when the learner lacks sufficient prior knowledge or
  guidance. Provide support when needed.

### Worked examples
- **Does establish:** worked examples are particularly valuable when prior knowledge is
  insufficient to efficiently construct the relevant schema; guidance should fade as the
  learner develops that schema. The productive distinction is prior knowledge and schema, not
  the labels "novice" vs "expert."
- **Does not establish:** instruction-first is always better than problem-solving-first;
  recent work finds the optimal order depends on the learner's prior knowledge.

### Feedback
- **Does establish:** specific, diagnostic feedback helps, and retrieval practice *with*
  feedback beats testing without it; immediate feedback performed at least as well as delayed
  in a controlled study.

## Plausible — use with care

- **Constructive retrieval** (retrieval combined with elaboration prompts) for comprehension
  and metacognitive monitoring.
- Framing **desirable difficulties** explicitly to manage learner expectations.

## Experimental / heterogeneous — weight least, be honest

- Any single "optimal AI tutor" architecture. A 2025 meta-analysis of intelligent tutoring
  systems found positive overall effects but substantial heterogeneity, and less conclusive
  effects on outcomes such as motivation and problem-solving.
- **Erroneous examples**: benefits depend on learner knowledge and instructional context; a
  systematic review shows clear boundary conditions. Do not apply "productive failure"
  blindly.

## Guardrails for the whole system

### Confidence
Confidence ratings are **measurements, not learning activities**. Do not ask for numerical
confidence so often that the learner produces arbitrary numbers. Use confidence strategically
to estimate calibration: track (predicted, actual) pairs and feed the gap back
([learner-model.md](learner-model.md)).

### Cognitive load — do not stack difficulties
Cognitive effort should be directed at the target learning process, not consumed by
unnecessary complexity. Retrieval, interleaving, generation, and transfer are each valuable;
stacking them all on a novice is harmful. Apply one difficulty at a time.

## Sources

- Spacing and retrieval practice — Nature Reviews Psychology,
  https://doi.org/10.1038/s44159-022-00089-1
- The double-edged sword of memory retrieval — Nature Reviews Psychology,
  https://doi.org/10.1038/s44159-022-00115-2
- Expertise reversal effect — Instructional Science,
  https://doi.org/10.1007/s11251-009-9102-0
- Cognitive load theory and worked examples — Educational Psychology Review,
  https://link.springer.com/article/10.1007/s10648-010-9145-4
- Interleaving and desirable difficulties — Learning and Instruction,
  https://www.sciencedirect.com/science/article/pii/S0959475224000690
- Generative learning — Educational Psychology Review,
  https://link.springer.com/article/10.1007/s10648-023-09769-7
- Instruction-first vs problem-solving-first by prior knowledge — Educational Psychology
  Review, https://link.springer.com/article/10.1007/s10648-025-09993-3
- Constructive retrieval — Learning and Instruction,
  https://www.sciencedirect.com/science/article/pii/S0959475224001014
- Digital feedback meta-analysis — Learning Environments Research,
  https://link.springer.com/article/10.1007/s10984-024-09501-4
- Feedback timing with retrieval practice — Humanities and Social Sciences Communications,
  https://www.nature.com/articles/s41599-024-03983-6
- Erroneous examples systematic review — Educational Psychology Review,
  https://link.springer.com/article/10.1007/s10648-025-10071-x
- AI tutoring RCT — PMC,
  https://pmc.ncbi.nlm.nih.gov/articles/PMC12179260/
- Intelligent tutoring systems meta-analysis — ScienceDirect,
  https://www.sciencedirect.com/org/science/article/pii/S1539310025000031
