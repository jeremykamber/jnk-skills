---
name: jnk-commit
description: Commit a session's work as a story of conventional commits. Use for commit writing and when finished with one unit of change. Assesses what was built and the steps taken, splits the work into coherent chapters, and commits each with a one-line conventional message.
---

# Commit

> Every session gets written down — one entry per change.

## Purpose

Turn the session's work into a history that reads like the story of what happened: each chapter a coherent commit, each message one line, simple language. (Conventional Commits: `type(scope): summary` — feat, fix, refactor, docs, chore, test, perf.) The agent never commits during work — this skill is the only place history gets written.

## Steps

1. **Assess the story.** Review the working tree (`git status`, diffs, untracked files) and the session's actual steps: what was built, in what order, and why. Name the chapters — natural groupings that each form one reviewable change.

2. **Protect the stage.** If there are changes that are not part of the story (user work-in-progress, unrelated edits, secrets), leave them uncommitted and say so. Never fold them into your commits.

3. **Commit each chapter, in story order.** For each:
   - `git add` only the paths that belong to that chapter — never `git add -A` or `git add .`
   - Write the message: a one-line subject, `type(scope): summary`, in plain language. Add a body only when the subject alone would leave a reviewer guessing — keep it to a few lines.

4. **Follow the writing style.** Load the jeremy_writing_style skill before writing messages. Simple and concrete; no hype, no corporate language. Commits answer: what changed, and why.

5. **Verify.** `git log --oneline` reads like the story; `git status` shows nothing staged and only non-story work remaining.

## Do not

- Squash the whole session into one commit, or split one change across commits.
- Commit files outside the story (user WIP, secrets, build output).
- Write multi-paragraph messages — one line is the default, a short body the exception.
- Reorder the story to make it prettier — chapters follow the order the work happened.
