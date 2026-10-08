# jnk-correct: notes

Private notes for the human. The agent never sees this file.

**What:** Find the mistake classes agents keep repeating in a repo, and make each one impossible. Fix at the highest level that works: architecture, then types, then a lint whose error names the fix, then a test, and docs or agent rules last. Prove each new check fails on a real past mistake, and keep the rule table in `AGENTS.md` pairing each rule with what enforces it.

**When:** the operator keeps correcting agents for the same mistake, or after a run where the same agent mistake showed up twice. A single miss is a squawk, not a rule. User-invoked only, `/skill:jnk-correct`.

**Why:** assume every contributor is an agent that sees only the files it opened, copies the nearest example, and takes the shortest path that compiles. Prose in `AGENTS.md` decays in a long context and a copied rule list drifts silently; a command that exits non-zero does neither. Fix the repo, not the prompt.

**Fits:** the repo-level counterpart to a one-time repair. `/skill:jnk-debug` fixes one defect, `/skill:jnk-4-verify` reports one change, and this one removes the class across the repo. Reads the notebook's squawks, notes, and `history://` transcripts as evidence, writes new rules back to `AGENTS.md` and facts to `docs/external/`, and hands off to `/skill:jnk-commit` one commit per class.

**Refs:** pstack's `correct` skill is the source (Lauren Tan's pstack, `skills/correct/SKILL.md`, mirrored in `cursor/plugins`): architecture, then types, then a lint whose error names the fix, then a test, docs last, plus the rule-to-enforcement table. This repo's own philosophy line, "Mechanical enforcement" in `README.md` (tools enforce principles, not aspirational text), and `AGENTS.md` principle 8 (the design debt is measured by `depth`, and a finding is a question to answer, never a threshold to raise).
