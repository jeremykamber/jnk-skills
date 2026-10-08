---
enabled: false
---

# TTSR templates (opt-in)

Time-Traveling Stream Rules. A rule with a `condition`, `astCondition`, or `question` fires
while the agent works, not after a gate run. Nothing here is installed globally; copy the
files you want into a project's `.agents/rules/` (or `~/.agents/rules/` for every project).

## What each trigger can see

- `astCondition` (ast-grep): the **new content of an edit or write**, one file at a time, with the
  language inferred from the path. It does not see the rest of the file, prose, thinking, or
  path-less tool calls. It is structural, so it matches shapes, not meaning.
- `condition` (regex): streamed prose, thinking, and tool arguments. A value that looks like a
  path glob becomes a scope filter (`tool:edit(<glob>)`, `tool:write(<glob>)`).
- `question`: a yes/no question judged on a completed output. Not deterministic. Needs
  `ttsr.judge` configured (`auto` uses a native judge model).

## Interrupt or warn

Every rule here ships with `interruptMode: never`, so a match is a passive reminder after the
tool result. That is the safe default for a heuristic. Raise it deliberately:

- `tool-only` interrupts a matching tool edit and retries the turn.
- `always` interrupts any match.

A rule that aborts the turn on a false positive costs more than it saves, so tighten a pattern
before you tighten the mode.

## What TTSR cannot replace

These belong to a gate, not a stream rule, because they need the whole tree rather than one
file: a literal or shape duplicated across modules, an export nothing imports, a co-change
without a dependency, a chain of forwards reported at its head. Those are what `depth` does,
with a baseline ratchet. TTSR is a live guard on the diff; `depth` is a whole-tree gate.
