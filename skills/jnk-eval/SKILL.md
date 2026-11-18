---
name: jnk-eval
description: Judge how well the workflow worked, from session traces, and propose the smallest evidence-based edits. Use after a session goes sideways, or on a schedule to mine repeated corrections.
disable-model-invocation: true
---

# Eval

> The trace is the evidence. Counts first, reading second.

## Steps

1. **Extract.** Start from whatever your harness keeps: its session history, or an
   exported transcript. `python3 scripts/extract.py <transcript> [outdir]` is one
   converter, replaceable: it writes `transcript.txt`, `thinking.txt` and
   `stats.json` for the two export formats it knows. The rest of this skill needs
   only a transcript, plus counts of skill invocations, gate runs and file writes.

2. **Stats first.** Read `stats.json` — skill invocations, gate lines, artifact
   writes, squawks, slices. It says where to read; do not open the transcript
   until it does.

3. **Read the signal moments** the stats point at: each invocation, each gate,
   each scope change, the end of each skill. Read the reasoning where behaviour
   bent.

4. **Score the lenses** in `references/rubric.md`: the arc, gate discipline,
   artifact discipline, and the failure catalog. Every verdict cites a count or a
   quoted line with its number.

5. **Propose edits.** Each one names the moment that justifies it and passes four
   tests: there is evidence, it deletes more than it adds, a frontier model would
   not already do it, and it is the smallest change that fixes the failure.

6. **Gate.** Present the verdict and the edits. Touch no file until the user
   approves.

## Across sessions

Fan out read-only fresh contexts (subagents where the harness has one) over a
window of sessions — default 7 days, this workspace only. Each returns the goal,
the user's corrections, and the skill that owned each failure. A pattern counts
at two occurrences. Turn each into the strongest mechanism that works: a rule, a
type, a gate, a skill edit. Never more prose.

## Nightly

`scripts/eval-nightly.sh` runs this headless. It applies safe edits itself (typos,
dead links, a clearer name) and queues foundational ones — a rule, a skill
contract, a gate, anything under `tools/` — in a report for the human.

## The question that outranks the rest

Quarterly: does the workflow still pay for itself? `bench` is the instrument:
`tools/bench --run ticket-desk --arm baseline --arm workflow`. If the workflow
does not score better than a short `AGENTS.md`, cut skills until it does.
