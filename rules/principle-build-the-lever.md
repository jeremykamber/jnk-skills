---
description: "Use for non-trivial or repetitive work, and for anything a reviewer must re-check. Build the tool that does or proves the work, so one artifact can be rerun."
---

# Build the lever

**Why.** Two payoffs. Throughput: a script does the work the same way every time and reruns for free. Confidence: the script is one artifact a reviewer reads and reruns. Work done by hand can only be re-checked by redoing it, which turns "trust me" into the only option.

**Pattern.**

1. Do the first unit by hand to learn the recipe.
2. Build the tool: a codemod or script for edits, a generator for repeated files, a query for analysis, a check for verification.
3. Prove it by rerunning on the unit you did by hand and diffing. Make it safe to rerun.
4. A deterministic script beats fanning out subagents. Run it yourself in one pass instead of delegating what a script can do.
5. When you must fan out, write the recipe, the verification contract, and the do-not-touch fences into one file the workers read, kept outside their write scope.
6. Commit the lever when the work outlives the session.

**When it applies.** Any non-trivial work, and every verification that will be repeated. Applying it produces a file: if there is no script in the diff, it was not applied.

**When it does not.** A couple of obvious edits you can see at a glance.

**Cite it.** Name the file the lever lives in.
