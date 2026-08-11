---
name: jnk-eval
description: Evaluate how well the workflow's skills actually worked in a pi session transcript. User-invoked only via /skill:jnk-eval. Give the path to a pi export (.jsonl or .html); returns an evidence-based per-skill verdict plus proposed edits, held to the workflow's own standards.
disable-model-invocation: true
---

# Eval

> The trace is the evidence. Counts first, reading second.

## Purpose

Judge the workflow by its receipts: a real pi session's reasoning traces and behavior. Produce a per-skill verdict — worked / not exercised / needs change — backed by counts and quoted moments, and propose the smallest evidence-based edits. The workflow improves through use; this is the instrument that reads the trace.

## When to eval

On a failure moment — a session that went sideways, a catalog item that fired, a skill that confused you — not as routine. The workflow exists to ship; if you find yourself eval-ing more than building, stop and ship. Quarterly, ask the bigger question: does the workflow still pay for itself? If the beats feel heavier than the problems they solve, simplify — this skill is also the instrument that tells you which beats to cut.

## Steps

1. **Extract.** Take the transcript path the user gives and run the extraction script (run it raw, without rtk — the stdout summary is needed in full):

   `python3 scripts/extract.py <transcript.jsonl|transcript.html> [outdir]`

   It accepts both pi export formats (jsonl lines, or the base64 session JSON inside the HTML export page), and writes `transcript.txt`, `thinking.txt`, and `stats.json` into `<transcript>.eval/` by default.

2. **The quick scan — stats first, not the transcript.** Read `stats.json`: message counts, skill invocations, leading-word adoption by category, artifact mentions and writes, gates, squawks, slices. This is the signal; it tells you where to read. Do not read the whole transcript until the stats demand it.

3. **Read the signal moments.** In `transcript.txt`, read the moments the stats point to: each skill invocation, each gate line, scope changes, the end of each beat, and every artifact check. Read the reasoning traces where the behavior bent. Line refs in stats are transcript line numbers — jump straight there.

4. **The rubric.** Load `references/rubric.md` and score the five lenses — the arc, gate discipline, artifact discipline, leading-word adoption, the failure catalog — then run Lens 6: the Pocock sweep (`references/pocock.md`) over the skills.

5. **The verdict.** Per-skill table with evidence (a count or a quoted line + line number). Adoption table by category. The failure list with the owning skill for each. The Pocock sweep — per-skill "Matt would approve?" verdicts. Proposed edits — each held to the four tests in the rubric (evidence, deletion, training-data, smallest coherent change).

6. **Gate.** Present the verdict and the proposed edits. Do not touch any skill file until the user approves.

## Do not

- Judge from impressions — every finding cites a line number or a count, or it is not a finding.
- Read the whole transcript before the stats. Stats point; reading confirms.
- Propose an edit without a trace moment showing the failure.
- Churn skills that worked or were not exercised — `not exercised` is a verdict, not a defect.
