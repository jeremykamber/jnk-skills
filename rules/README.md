---
enabled: false
---

# Principles

Named engineering principles, one file each. They are **rulebook rules**, not skills.

The harness lists each rule's name and description in the system prompt and reads the body
on demand at `rule://<name>`. So a principle costs nothing until it is triggered, and one word
steers a run. `./setup.sh` links this directory into `~/.agents/rules/`, where the agents
provider discovers it.

How to use one:

1. When the situation in a description matches, read the leaf with `rule://<name>`.
2. Apply it, and name the decision it changed. A principle cited without a decision is a
   name-drop, not an application.

These are the principles the skills do not already carry as whole skills. The universal rules
in `AGENTS.md` (deep modules, no wrong abstractions, exercise the change end to end) are
always loaded and are not repeated here.

Add a principle when a correction repeats and no gate can enforce it. When a gate can enforce
it, encode it there instead (see `jnk-correct`).
