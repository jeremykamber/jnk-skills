---
name: jnk-worktree
description: Give a session its own git worktree before the skills begin, so concurrent agents never collide. Use at the start of fresh work in a repo you share.
disable-model-invocation: true
---

# Worktree

> One worktree per session. Main stays clean.

## Steps

1. **Already isolated?** Compare `git rev-parse --git-dir` with
   `git rev-parse --git-common-dir`. Different means you are in a worktree:
   confirm the branch and skip to the baseline.

2. **Create it** — `git worktree add .worktrees/<slug> -b <slug>`, with
   `.worktrees/` gitignored. The thread file lives under `.ai/threads/` in the
   main checkout; copy it across when continuing work there, or start fresh.

3. **Baseline** — install dependencies and run `gates`. A green start is the only
   honest baseline for the skills ahead. If the stack fails before you change
   anything, say so and stop.

4. **Report** — path, branch, baseline result — then ask whether to start.

## Next

`jnk-pickup` for continuing work, `jnk-design` for fresh work. Recommend and stop.
