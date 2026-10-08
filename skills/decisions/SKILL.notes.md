# jnk-decisions — notes

Private notes for the human. The agent never sees this file.

**What:** Owns the decision trail: a TSV with one row per decision (what, why, an evidence pointer, the result), append-only, with a transcript audit and a cross-model review that ends in an Attention section.

**When:** long, risky, or unattended work; any change the user reviews after stepping away.

**Why:** you cannot taste every dish. A trail lets the user sample a run instead of re-reading it, and it is what makes autonomous work auditable.

**Fits:** written by jnk-oneshot, jnk-3-implement, and jnk-run; audited by jnk-4-verify; read by jnk-eval. It is the one owner of the format; other skills reference it.

**Refs:** pstack's `show-me-your-work` skill (the TSV shape, the `start` phase, the transcript audit, the cross-model reviewer).
