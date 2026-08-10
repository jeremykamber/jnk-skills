---
name: jnk-worktree
description: Isolate the session in its own git worktree before the beats begin. User-invoked only via /skill:jnk-worktree. One worktree per agent session, branched from main — concurrent agents never collide.
disable-model-invocation: true
---

# Worktree

> Pre-flight setup. Roll the work into its own worktree — main stays clean.

## Purpose

Give the session an isolated workspace before any beat starts. One worktree per session, branched from main. Concurrent agents never collide; main never moves.

## Steps

1. **Where are we?** Already in a worktree (`git rev-parse --git-dir` differs from `git rev-parse --git-common-dir`)? Confirm the branch and skip to the baseline. Never nest.

2. **The notebook rule.** `.ai/contexts/` is gitignored — it does not travel between worktrees.
   - **Continuing work:** never work where the notebook is absent. Resume in the worktree that holds it, or carry it over (`cp -r .ai/contexts`).
   - **Fresh work:** create the worktree from main — `git worktree add .worktrees/<slug> -b <slug>` (verify `.worktrees/` is gitignored first). The notebook is born here.

3. **Baseline.** Install dependencies and run the project's tests in the worktree. A green start is the only honest baseline for the beats ahead.

4. **Gate.** Report: worktree path, branch, baseline result. Ask: "Ready for the first beat?" Wait for clearance.

## Handoff

When cleared, the first beat is /skill:jnk-0-pickup (continuing work) or /skill:jnk-1-understand (fresh). Do not start it: the first beat begins when the user invokes it.

## Do not

- Create a worktree when already in one — nested isolation.
- Continue work where the notebook is missing — the memory is gone.
- Start the beats without a known-good baseline.
