---
name: jnk-decisions
description: "Owns the decision trail for long, risky, or unattended work: one row per decision in a TSV, evidence as a pointer, append-only. Other beats route their trail here instead of inventing one. User-invoked only via /skill:jnk-decisions; invoke it to start, audit, or review a trail."
disable-model-invocation: true
---

# Decisions

> You cannot taste every dish. Keep a log you can audit instead.

## Purpose

Long work leaves a trail, and work you review after stepping away needs one you can read in the morning. This skill owns that trail: one row per decision, evidence as a pointer, append-only. It is the artifact that lets the user sample a run instead of re-reading it, and it is what the beats write to when a change is long, risky, or unattended. Other skills reference this format by name; none of them invent their own.

## The format

One TSV file. One row per decision. Cells stay on one line. Evidence is a pointer, never a paragraph.

| Column | What goes in it |
| --- | --- |
| `ts` | ISO8601 timestamp |
| `phase` | the phase or workstream |
| `decision` | what was chosen or done, one line |
| `why` | the reason in plain words; if a principle drove it, say it plainly |
| `evidence` | a commit SHA, PR number, `file:line`, or an artifact, trace, or screenshot path |
| `result` | the outcome or predicate state: `tests green`, `reverted`, `pixel-diff 0`, `INCONCLUSIVE`, `open` |

Start the file with the header row. `scripts/log.sh <logfile> <phase> <decision> <why> <evidence> <result>` stamps the timestamp, writes the header on first use, strips stray tabs and newlines, and quotes a cell that starts with a spreadsheet-significant character. A bare `printf` append works too, with the same care.

```
ts	phase	decision	why	evidence	result
2026-10-07T09:02:00Z	frame	counted the work first, about 100 files	moving a long run, wanted the size before starting	commit 3a9f1c2	found five things to settle before starting
2026-10-07T09:40:00Z	harness	captured a baseline before changing anything	so old and new can be compared and any change caught	scripts/snapshot.sh, baseline/	saved 120 reference shots
2026-10-07T12:30:00Z	parser	threw out a helper's work because its output was blank	checked the real artifact instead of trusting its summary	worktree reset	reverted, tightened the brief
```

## Rules

- **Log decisions, not actions.** A fork chosen, a unit completed with its check, a pivot or revert and its trigger, a blocker surfaced, a gate fixed. Skip the trivial and the self-evident.
- **Append-only.** A wrong call gets a new row that supersedes it. Never edit or delete history.
- **One row per iteration** of a loop run.
- **Evidence is a pointer.** Prefer evidence produced by a committed script over a hand-made one-off (`rule://principle-build-the-lever`).
- **The first row of a run has phase `start`**, and names the timestamp range of rows this run did not write. A pickup, a replacement agent, or a new chat starts a new run.

## Where it lives

Session state goes in the notebook: `.ai/contexts/<slug>/decisions.tsv`, gitignored, beside the route and the squawks. Commit it only when the work is ambitious enough that a reviewer needs the trail to trust the result; then it is project truth and lives with the code.

## Audit the log against the transcript

Before handing a run back, check the log told the truth. Read this run's transcript and walk its rows against what actually happened: every row maps to a real decision or action, every evidence pointer resolves and shows what the row claims, and a fork or revert that shaped the work but is missing is a gap. **Correct the log, not the story.** Never edit or remove a row; add a row that supersedes it.

## Review the trail

Spawn a subagent to read the trail and the transcript and flag what the user should look at: rows with weak or missing evidence, checks skipped or claimed without proof, choices that look risky in hindsight, gaps a casual skim would miss. End the reply with an **Attention** section that names the reviewer and points at specific rows. `No flags` is a valid value; a model name is not.

## Who writes it

- `jnk-oneshot` and `jnk-3-implement`: a row per slice that lands, and per pivot.
- `jnk-run` (the unattended-run contract): a row per loop iteration, without exception.
- `jnk-4-verify`: the audit against the transcript, when a trail exists.
- `jnk-eval`: reads trails when scoring a session.

## Do not

- Let a row carry a paragraph. Pointer only.
- Edit or delete history. Supersede it.
- Log only the wins. Discarded work and reverts are the rows a reviewer needs most.
- Invent a second format. This file owns it.

## Output

The trail file path, and (on review) the Attention section.
