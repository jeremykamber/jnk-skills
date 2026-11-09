---
name: jnk-commit
description: Write a session's work as a story of conventional commits, splitting it into coherent chapters. Use when a unit of change is finished and its history should read well.
---

# Commit

> One chapter per commit, in the order the work happened.

Work is committed as checkpoints while you build, so nothing is ever unrecorded.
This beat turns those checkpoints into the history a reviewer wants.

## Steps

1. **Find the base.** The commit or branch point the work started from
   (`git merge-base HEAD main`). Every chapter goes on top of it.

2. **Name the chapters.** Read `git status`, the diff, and what the session did.
   A chapter is one reviewable change: a fix, a feature, a refactor, its test.
   Name them in the order they happened.

3. **Rewrite once.** `git reset --soft <base>`, then commit each chapter:

   ```sh
   git add <only that chapter's paths>
   git commit -m "type(scope): summary"
   ```

   `type` is feat, fix, refactor, test, docs, chore or perf. One line is the
   default; a short body only when the subject would leave a reviewer guessing.
   Load the `jeremy-writing-style` skill for the message voice.

4. **Protect what is not the story.** Work in progress that is not yours, and
   secrets, stay uncommitted and named in the report. Never `git add -A`.

5. **Check.** `git log --oneline` reads like the story; `git status` shows only
   non-story work.

A rewrite is safe because every checkpoint was committed: `git reflog` still has
the old history if this goes wrong.

## Next

`jnk-verify` on the finished history. Recommend and stop.
