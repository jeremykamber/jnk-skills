---
description: "Use the moment you write the same instruction a second time, or the agent repeats a mistake you already corrected. Encode the rule where it cannot be skipped."
---

# Encode lessons in structure

**Why.** Prompt text needs the reader to notice it, remember it, and comply. A lint, a type, or a script enforces the rule with no cooperation. A rule that lives in a prompt decays; a rule that lives in a gate does not.

**Pattern.** When you catch yourself repeating an instruction:

1. Ask what would make the mistake impossible.
2. Pick the strongest mechanism that works, in this order: a state the type system will not compile, then a lint or CI check whose error names the fix, then a canonical helper, then a runtime check, then written guidance.
3. Encode it there and delete the instruction.
4. Docs and agent rules are the last resort, for judgment calls nothing can enforce.

**Capture every correction.** One-off, it is a note. Recurring, it is a lint, a gate, or a skill. Systemic, it is a principle. Then close the loop: apply it now, or leave a concrete task.

**Anti-patterns.** Acknowledging without recording. Recording without routing. Fixing one instance while the pattern stays.

**When it applies.** Every human correction, every failed gate, every repeated nit from a reviewer.

**Cite it.** Name the mechanism you added and the instruction you deleted.
