---
name: jnk-oneshot
description: Make a small, well-understood change end to end in one pass. Break work into thin vertical slices, use subagents to implement or review slices when they materially help, verify every slice, self-review the final diff, record durable facts, and commit the result.
disable-model-invocation: true
---

# One Shot

Make a small, well-understood change completely and correctly in one pass.

This is for work whose behavior and implementation are sufficiently clear that you can execute without a design/discovery phase or user gates. Keep the process lightweight, but do not trade away engineering quality.

## Escalate when the work is no longer well understood

Stop and recommend `/skill:jnk-1-explore` if you encounter:

- a significant design decision that the repository does not already answer;
- genuinely ambiguous or unknown behavior;
- architectural changes or broad refactoring;
- requirements that conflict or need product decisions;
- a slice whose implementation depends on assumptions you cannot confidently validate.

Do not push through uncertainty just because the change started as a one-shot. Escalation is preferable to guessing.

## Procedure - follow step by step

### 1. Understand the change

Restate, briefly:

- what will change;
- what must remain unchanged;
- the main risk.

Read the minimum useful context before editing:

- relevant `.ai/contexts/` entries, ADRs, designs, or `docs/external/` facts;
- the code being changed;
- its tests;
- one relevant caller, consumer, or sibling implementation.

Do not re-derive repository knowledge that already exists.

If this read exposes a meaningful unknown, escalate.

### 2. Decide the implementation shape

Determine whether the change is:

- **single-step:** small enough to implement directly; or
- **multi-slice:** large enough to benefit from several independently verifiable vertical slices.

For multi-slice work, define the thinnest useful end-to-end slices. Each slice should:

- represent a coherent piece of user/system behavior;
- touch only the layers it actually needs;
- leave the repository in a working state;
- have a concrete verification step.

Prefer vertical slices over layer-by-layer implementation.

Build a simple dependency order. Only parallelize genuinely independent slices.

### 3. Choose where subagents help

Use subagents when they materially improve throughput or correctness, especially for:

- a substantial slice that can be implemented independently;
- parallelizable slices with clean ownership boundaries;
- unfamiliar or risky code that benefits from an independent implementation/review;
- focused testing, verification, or hostile review.

Do not spawn subagents for tiny changes merely to follow ceremony.

When delegating implementation, give the subagent:

- the slice and its intended behavior;
- relevant files/code areas;
- constraints and existing conventions;
- the expected verification;
- permission to make the implementation, not merely review it.

Each implementation subagent must work in isolation from other writers. Never have two agents concurrently modify the same working tree.

Get that isolation from worktrees, not from hope: `/skill:jnk-worktree`, or by hand — `git worktree add .worktrees/<slug> -b <slug>`, after confirming `.worktrees/` is gitignored and the baseline tests pass. The same applies when you are the only writer: if the change is multi-file or spans layers, cut a feature branch rather than working on the default one. A single-file one-step change can skip it.

When subagent work returns, inspect it yourself before accepting it. A subagent is an implementation aid, not an authority.

### 4. Implement slice by slice

For each slice:

1. Understand the existing behavior and the smallest change required.
2. Add or update the most useful test when practical. For behavioral changes, prefer seeing the new test fail before making it pass.
3. Implement the smallest correct solution.
4. Run the gates — `gates types lint unit` for the cheap subset mid-slice, `gates --changed` before you finish.
5. Run additional checks for behavior that could have been affected.
6. Review the resulting diff before moving on.

Use normal engineering judgment rather than blindly following a ceremony. A trivial change does not need elaborate test choreography; a risky behavioral change does.

Keep each slice focused. Avoid opportunistic refactors.

If you notice unrelated cleanup, record it as a **squawk** rather than silently expanding scope.

### 5. Verify continuously

After every meaningful slice, establish evidence that it works — and make it evidence a command produced, not a judgment you reached. `gates` is that command: it runs the project's stack, stops at the first failure, and prints the failing output, which is the instruction. Run the cheap subset (`gates types lint unit`) between slices when the full sweep would be slow.

`gates --changed` is usually the right final sweep for a one-shot: every gate runs, each scoped to what you touched where the gate supports it — including the mutation gate, which is far too slow to run whole for a small change. Reach for plain `gates` when the change is broad or touches something shared: a schema, a shared type, a config another module reads.

When something fails, determine whether it is:

- caused by the current change;
- a pre-existing failure;
- an environment/setup issue;
- a gate that is genuinely miscalibrated — which is the user's call, not yours to edit away.

Before you blame your own change, compare against pristine: stash the work, run the check, restore. A failure that was already there is not yours to fix inside a one-shot — record it as a squawk and carry on.

Name the ledger out loud as you go — done, next — so nothing is lost between slices.

Do not claim success without evidence, and do not report a gate as passing that you did not run.

### 6. Review independently

Before finishing, review the complete diff as a hostile maintainer.

Look specifically for:

- incorrect or inverted logic;
- missing edge cases;
- tests that pass without exercising the intended behavior;
- accidental API or behavior changes;
- silent fallbacks;
- unnecessary complexity;
- duplicated logic;
- poor error handling;
- concurrency/state issues;
- security or data-integrity problems where relevant;
- changes outside the intended scope.

Fix genuine defects.

If the change is substantial or risky, use a subagent for an independent final review. Give it the actual diff and ask for concrete defects, not generic feedback. Resolve real findings; record legitimate but out-of-scope findings as squawks.

Review against `AGENTS.md` too — read the file and check the change against the principles it actually states. Do not work from a remembered list. This step once ran against a copied set of nine principles while the file had moved on to six different ones, and nothing could see the drift, because nothing was checking. Hand a reviewer the file itself, never a restatement of it.

### 7. Record durable knowledge

If the work reveals a reusable repository fact — for example an integration contract, environment convention, schema detail, or non-obvious behavior — record it in `docs/external/`.

Do not create documentation merely to satisfy the skill. Only record knowledge that will save future work.

### 8. Commit

Run `/skill:jnk-commit` once the implementation is complete.

Do not commit incrementally during the one-shot. Let the commit skill determine the appropriate commit structure and messages.

## Working principles

- **Correctness over speed.**
- **Smallest correct change over cleverness.**
- **Vertical slices over layer-by-layer construction.**
- **Evidence over confidence** — and a gate that exits non-zero is evidence; a judgment that it looks right is not.
- **Subagents where they help, not for ceremony.**
- **Independent review for risky work.**
- **No silent scope creep.**
- **Escalate uncertainty instead of guessing.**
- **Leave the repository working after every slice.**
- **The final diff should be understandable to the next engineer.**

## Report

Finish with a concise report containing:

- what changed;
- how it was verified;
- what the gates flagged — a CRAP hotspot, a coverage gap, a mutation survivor, an arch violation — and what you did with each: fixed, squawked, or judged acceptable. Then say plainly what the gates cleared. That is what having them is for: they tell the reader where not to spend attention;
- any uncertain decisions and why they were made;
- squawks / intentionally deferred issues;
- subagents used, what they implemented or reviewed, and how their findings were handled;
- durable facts written to `docs/external/`, if any.

If no subagent was warranted, say so briefly rather than inventing ceremony.
