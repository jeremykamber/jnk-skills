---
description: "Use before two agents, attempts, or slices write to the same tree, branch, file, or output path. Remove the sharing instead of coordinating around it."
---

# Isolate parallel writers

**Why.** Two writers on one tree race on the same files, and a lock only narrows the window. Removing the sharing removes the whole class of bug.

**Pattern.**

1. Give each writer its own worktree, branch, or output path. Do not add locks around one shared directory.
2. Split the target before serializing access to it.
3. Give a fresh subagent a consolidated brief: the original task, every later directive, and the prior agent's report. Resume or message an existing subagent only when the new work strictly needs state that lives in it that is costly to move (its checkout, its uncommitted changes, a process it still runs).
4. Prefer a fresh agent over chained interrupts: an interrupt-chained resume silently drops directions.

**When it applies.** Parallel slices, an arena or swarm, several attempts on one task, and any fan-out.

**When it does not.** A genuine invariant that two writers must share. Then serialize on purpose, and say why.

**Cite it.** Name the isolation each writer got, or the invariant that forced serialization.
