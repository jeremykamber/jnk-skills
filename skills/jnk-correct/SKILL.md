---
name: jnk-correct
description: Turn a mistake the agent keeps making into something the repo will not allow. Use after the same correction happens twice, or when a rule exists only as prose.
disable-model-invocation: true
---

# Correct

> Make the repeat impossible. Prose decays; a failing command does not.

## Steps

1. **Name the mistake and its cost**, in one line, with the diff or the moment it
   happened. Two occurrences make a pattern; one is an incident, and an incident
   gets fixed, not encoded.

2. **Pick the highest rung that works**, in this order:

   - **Architecture** — the shape makes the mistake impossible to express.
   - **Types** — the compiler rejects it.
   - **Lint** — the error names the fix, not the rule.
   - **Test** — a fixture that fails on the mistake.
   - **Docs** — last, because nothing enforces it.

3. **Encode it** at that rung. Prove the gate fires: make the mistake on purpose
   in a scratch file and watch the check reject it. A guard nobody has seen fail
   is a guard you do not know works.

4. **Pair it with its enforcement** in the project's `AGENTS.md` rule table:

   | Rule | Enforced by |
   | --- | --- |
   | <one line> | <the check> |

   A rule with nothing enforcing it is prose. Drop a rule once its mistake cannot
   happen.

5. **Report** the rung chosen, why the rungs above it did not work, and the proof
   the check fires.

## Next

`jnk-commit`. Recommend and stop.
