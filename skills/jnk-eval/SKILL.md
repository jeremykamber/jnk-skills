---
name: jnk-eval
description: Judge how well the workflow worked, from session traces, and propose the smallest evidence-based edits. Use after a session goes sideways, or on a schedule to mine repeated corrections.
---

# Eval

> The trace is the evidence. Counts first, reading second.

## Steps

1. **Extract.** `python3 scripts/extract.py <transcript> [outdir]` writes
   `transcript.txt`, `thinking.txt` and `stats.json`. No export: read the
   harness's own session history.

2. **Stats first.** Read `stats.json` — skill invocations, gate lines, artifact
   writes, squawks, slices. It says where to read; do not open the transcript
   until it does.

3. **Read the signal moments** the stats point at: each invocation, each gate,
   each scope change, the end of each beat. Read the reasoning where behaviour
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

Fan out read-only subagents over a window of sessions (default 7 days, this
workspace only). Each returns the goal, the user's corrections, and the skill that
owned each failure. A pattern counts at two occurrences. Turn each into the
strongest mechanism that works — a rule, a type, a gate, a skill edit — never
more prose.

## Nightly

`scripts/eval-nightly.sh` runs this headless. It applies safe edits itself (typos,
dead links, a clearer name) and queues foundational ones — a rule, a skill
contract, a gate, anything under `tools/` — in a report for the human.

## The question that outranks the rest

Quarterly: does the workflow still pay for itself? `bench` is the instrument —
`tools/bench --run ticket-desk --arm baseline --arm workflow`. If the workflow
does not score better than a short `AGENTS.md`, cut beats until it does.
