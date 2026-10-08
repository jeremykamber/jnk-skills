---
name: jnk-correct
description: "Turn a mistake agents keep making in this repo into something the repo will not let happen again. User-invoked only via /skill:jnk-correct. Use when a correction keeps repeating, or after a run where the same agent mistake showed up twice. Finds the mistake classes, fixes each at the highest level that works (architecture, then types, then a lint whose error names the fix, then a test, docs last), proves each new check fails on the real past mistake, and keeps the rule table in AGENTS.md."
disable-model-invocation: true
---

# Correct

> One correction is a mistake. Twice, and it is a missing check.

## Purpose

The operator keeps correcting agents in this repo for the same mistakes. Change the repo so the next agent cannot make them. Assume every contributor is an agent that sees only the files it opened, copies the nearest example, and takes the shortest path that compiles. Design the repo so a change that looks right from one file is right for the whole repo.

Where /skill:jnk-debug repairs one defect and /skill:jnk-4-verify reports one change, this pass crosses the repo: it names the classes of mistake, and makes each one fail somewhere a command can see. Prompt text decays in a long context and a copied rule list drifts silently. A check that exits non-zero does neither.

## Steps

1. **Find the mistake classes.** Read recent commits, reverts, and review comments. Read the project's agent instruction files (`AGENTS.md`) and the notebook (`.ai/contexts/<slug>/notes.md`, its squawks, and past session transcripts in `history://`). Group the mistakes into classes. A class counts once it has happened twice; a single miss is a squawk, not a rule. Cite the evidence for each class: the commit, the file, the session. Read what the repo already does before proposing anything, the way /skill:jnk-1-explore reads the code.

2. **Fix each class at the highest level that works, in order.** Walk the table below from the top: architecture first, types next, a lint or gate whose error names the fix, then a test, docs last. Stop at the highest level that actually retires the class. Fix the most frequent classes now, one commit each, so the history says which mistake each check retires.

3. **Prove each new check fails on the real past mistake.** Run it against the commit or example where the mistake actually happened, and watch it fail before you trust it. Then run the same command locally and in CI: register it in `gates.json` so `gates` runs it, rather than leaving an ad-hoc command nobody repeats. A check that cannot fail is worse than none, and one you did not watch fail is a guess. An exception goes on the offending line with a reason, an expiry date, and a human's approval.

4. **Keep the rule table in `AGENTS.md`.** Pair each rule with what enforces it, which is usually a command, not a paragraph. When the operator corrects you again, fix the mistake and add the rule in the same change. If the rule was already there and nothing enforces it, that is the repeat: fix it at the highest level in the same change, now. Drop a rule once its mistake cannot happen.

   ```markdown
   | Rule | Enforced by |
   |------|-------------|
   | State is written only through `store.write` | `lint:no-direct-write` |
   | Every new module is imported, never re-exported | `gates lint`, `depth` needless-export |
   ```

5. **Reply.** For each class: its evidence, the level you picked, and why a higher level did not work. Log every class you fixed at a lower level, or deferred, as a squawk in the notebook. Anything not fixed is said out loud, never dropped. Then propose /skill:jnk-commit.

## The levels, highest first

| Level | What it looks like | Use when |
|-------|--------------------|----------|
| Architecture | one owner per piece of state, one supported way per task, internals hidden so the wrong import fails, the old way deleted so an agent cannot copy it | the mistake comes from two ways to do the same thing, or a hand-synced list that drifts |
| Types | the bad state cannot be written: a narrower type, a schema, a required field, a total function | the wrong value still compiles and the compiler could have said so |
| Lint or CI check | a command whose error message names the file, type, or function to use instead, wired into `gates.json`; a design rule `depth` already decides belongs in a `depth`-backed gate, not in prose | the shape is legal to the compiler but wrong for the repo, and no type can express it |
| Test | delete or repair a test that would still pass if every function it calls returned nothing; assert the behavior at the interface the mistake violated | the behavior was never asserted, so a wrong implementation passed |
| Docs or agent rules | a line in `AGENTS.md`, `docs/external/`, or the notebook | a genuine judgment call nothing can enforce |

## Do not

- Add a rule to `AGENTS.md` that no check enforces. Prose is the level that failed; it is the last resort, not the first move.
- Write a rule from one correction. Two occurrences make a class; one is a squawk.
- Write docs or agent rules before trying architecture, types, or a check.
- Trust a check you have not watched fail on the real past mistake, or leave it as an ad-hoc command outside `gates`.
- Weaken a gate, add an exclude, disable a lint, or raise a threshold to clear the class. Fix the cause.
- Call a test a check when it would pass if every function it calls returned nothing.
- Leave an exception without a reason, an expiry date, and a human's approval, off the offending line.
- Fix a class below the highest level it admits without saying so in the reply.

## Output

Per class: the evidence (commit, file, session), the level chosen, why a higher level did not work, and the check added / The proof: the command that failed on the real mistake before the fix, and passes after / The rule table as it now stands / Squawks for classes fixed below the highest level or deferred

## Handoff

Propose /skill:jnk-commit, one commit per class, so each check lands with the mistake it retires. Do not start it. Nothing else to hand off: the next agent is the reader.
