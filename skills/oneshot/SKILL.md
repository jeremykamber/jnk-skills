---
name: jnk-oneshot
description: Make a small, well-understood change end to end in one pass — no beat ceremony, no user gates. User-invoked only via /skill:jnk-oneshot. Checks what the repo already knows, cuts its own worktree feature branch when the change warrants it, builds in vertical slices with a checkpoint after each (no user gate between them), uses subagents for slice validation, parallel execution with dependency graph, and implementation review, self-reviews the diff, verifies with evidence, writes durable facts to docs/external/, commits the work via /skill:jnk-commit, reports — and escalates to the full workflow if the change outgrows one shot.
disable-model-invocation: true
---

# One Shot

> One pass, then done. Small fix, full quality.

## Purpose

Make a small, well-understood change end to end in one shot: just enough understanding, the smallest change, honest verification, one report. No gates, no slices, no notebook — the report is the record; history is written once, at the end, via /skill:jnk-commit. This is the default for the 80% of work that is small and clear; the full beats are for when it isn't.

## When to escalate

One shot is for changes you understand at a glance: a bug with a clear cause, a small bulk fix, a rename, a config tweak. If a quick read reveals design choices, uncertain behavior, or a real unknown — the change outgrew the one shot. Stop, say why, and recommend the full workflow, starting at /skill:jnk-explore. Do not start it; the user decides. The same applies mid-flight: if a slice reveals design choices, uncertain behavior, or a real unknown, stop — that is the escalate signal, not a reason to push on. Escalating is the quality guarantee: the one shot never does shallow work on a big change.

## Steps

1. **One line.** Restate what changes and what must not change. If the request is ambiguous, ask once — the single human step. After the answer, go.

2. **The minimum read.** First, check what the repo already knows: a `.ai/contexts/` notebook entry, a `docs/adr/` decision, a `docs/designs/` blueprint, or a `docs/external/` fact that this change touches — read the relevant entry before the code; the repo may already know what you're about to re-derive. Then read the file to change, its tests, one caller or sibling. State the model in three lines: current behavior, the fix, the risk. A real unknown here is the escalate signal.

3. **Own your branch; then the smallest change, in vertical slices.** When the change is big enough to want isolation — multi-file, cross-layer, or several slices — or when the user uses the `worktree` keyword after the skill invocation, cut your own feature branch first, in a fresh worktree, and build there (follow the /skill:jnk-worktree pattern: `git worktree add .worktrees/<slug> -b <slug>`, after confirming `.worktrees/` is gitignored; verify the baseline tests pass before you start). A change you can make in one file in one step may skip the branch. When the change spans layers (backend → frontend → persistence), build it the same way the beats do — the thinnest end-to-end slice first, then thicken — minus the user gates: each slice is a thin end-to-end story that leaves the system working. Per slice, where a test can fail for the right reason, write it first and watch it fail, then fix. Touch only what the slice needs. Write for the next engineer: intent over cleverness, comments say why. Anything noticed-but-not-fixed is a squawk — log it, never silently fix, never silently forgive.

4. **Checkpoint after every slice; gate only at the end.** Run the slice's narrowest check that gives confidence (the touched tests, typecheck), plus anything it could have broken — then the next slice, with no user gate. On a failure, compare against pristine (stash → run → pop) before blaming anything. Name the ledger out loud as you go — done / next — so nothing is lost. If a slice reveals design choices, uncertain behavior, or a real unknown, that is the escalate signal, not a reason to push on.

5. **The skeptic's pass.** Re-read your diff as a hostile reviewer before reporting: plausible-but-wrong logic, silent fallbacks, tests that pass for the wrong reason, over-engineering, hidden behavior changes. Fix the real ones — a one-shot must be right, not just green. Squawk the rest.

6. **Report.** Report: what changed, the verification result, any **uncertain choices** (the decisions you're least confident about, and why), squawks, and — if you used subagents — which ones ran and what each found and how you resolved it. A skipped subagent shows up here as a blank, not a silent drop. A durable fact learned (env schema, integration shape, convention) is written to `docs/external/` — create the dirs if missing; it is free context for the next one-shot. No notebook entry: the report is the record.

7. **Commit the history.** Run /skill:jnk-commit on the branch — it turns the session's work into good, small, one-line conventional commits that tell the story (one coherent chapter per commit, `type(scope): summary`), in the order the work happened. Don't squash the whole change into one giant commit, and don't sprinkle commits as you go — all history is written once, here, at the end.

## Subagents

Oneshot uses subagents for quality without ceremony — no user gates; validation and review happen automatically. Say what you want done in plain language — *spawn a subagent to validate X, to review Y, to implement Z* — and let your harness's subagent mechanism pick the concrete form. Don't hard-code agent types or tool syntax; the harness decides.

Scale the ceremony to the change. A one-line fix may warrant no subagent at all. Multi-slice, parallelizable, or riskier work warrants the three uses below.

### Before you build: validate the slices

After proposing slices, spawn a subagent to validate them before you write anything. Give it the slice list and ask: is each slice truly end-to-end (not "all backend, then all UI")? Does each leave the system working? Are the checkpoints actually verifiable? Are there hidden dependencies between slices, and which slices can run in parallel? Reject with reasons if invalid; approve and note concerns if valid. You need its verdict before you build — wait for it.

### In parallel: implement independent slices

When slices have no hidden dependencies, spawn one subagent per slice, each given its own slice's files, its checkpoint, and the red-green-refactor instruction (write the test first, watch it fail, then fix). Only parallelize slices that genuinely don't touch the same code, and never let two writers work the same tree at once — isolate them, or run one at a time. Triage what comes back before you merge or continue.

### After each slice: review the diff

After each slice, spawn a subagent to read the slice's diff as a hostile reviewer: did it follow the plan, skip any verification, refactor when it shouldn't have, write tests first, and stay true to the project's principles? Ask for real defects listed specifically, and a plain "it's clean" with reasons when it is. Triage — fix the real ones, squawk or reject the strawmen.

Every subagent's outcome goes in the report (step 6): which ran, what it found, how you resolved it — so a skipped subagent is visible, never silent.

## Do not

- Use this on fuzzy, architectural, or multi-unknown work — escalate instead.
- Run the ceremony (gates, slices, decision records, notebook) — that is what one shot is for skipping.
- Skip verification, or claim green without the narrowest run.
- Commit as you go — all history is written once, at the end, via /skill:jnk-commit.
- Leave a durable fact in the chat — it belongs in `docs/external/`.
