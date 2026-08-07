---
name: jnk-oneshot
description: Make a small, well-understood change end to end in one pass — no beat ceremony, no gates. User-invoked only via /skill:jnk-oneshot. Reads just enough, makes the smallest change, verifies with evidence, commits — and escalates to the full workflow if the change outgrows one shot.
disable-model-invocation: true
---

# One Shot

> One pass, then done. Small fix, full quality.

## Purpose

Make a small, well-understood change end to end in one shot: just enough understanding, the smallest change, honest verification, one report, one commit. No gates, no slices, no notebook — the commit is the record. This is the default for the 80% of work that is small and clear; the full beats are for when it isn't.

## When to eject

One shot is for changes you understand at a glance: a bug with a clear cause, a small bulk fix, a rename, a config tweak. If a quick read reveals design choices, uncertain behavior, or a real unknown — the change outgrew the one shot. Stop, say why, and recommend the full workflow, starting at /skill:jnk-1-understand. Do not start it; the user decides. Ejecting is the quality guarantee: the one shot never does shallow work on a big change.

## Steps

1. **One line.** Restate what changes and what must not change. If the request is ambiguous, ask once — the single human step. After the answer, go.

2. **The minimum read.** The file to change, its tests, one caller or sibling. State the model in three lines: current behavior, the fix, the risk. A real unknown here is the eject signal.

3. **The smallest change.** Work on a branch — cut one if you're on main. Where a test can fail for the right reason, write it first and watch it fail, then fix. Touch only what the change needs. Write for the next engineer: intent over cleverness, comments say why. Anything noticed-but-not-fixed is a squawk — log it, never silently fix, never silently forgive.

4. **Evidence, not opinion.** Run the narrowest check that gives confidence: the touched tests, typecheck. On a failure, compare against pristine (stash → run → pop) before blaming anything. Report the numbers.

5. **Commit and done.** Report: what changed, the verification result, squawks. Commit as one conventional commit (`type(scope): summary`, per the jeremy_writing_style skill) — never folding in unrelated WIP. No notebook entry: the commit is the record.

## Do not

- Use this on fuzzy, architectural, or multi-unknown work — eject and escalate.
- Run the ceremony (gates, slices, decision records, notebook) — that is what one shot is for skipping.
- Skip verification, or claim green without the narrowest run.
- Commit work that is not the change.
