---
name: jnk-eval
description: "Evaluate how well the workflow's skills actually worked in a session, or across many sessions. User-invoked only via /skill:jnk-eval. Give the path to a session export, or run it over recent history to mine repeated corrections; returns an evidence-based per-skill verdict plus proposed edits, held to the workflow's own standards. In nightly mode it applies the safe edits itself and queues the foundational ones for the human."
disable-model-invocation: true
---

# Eval

> The trace is the evidence. Counts first, reading second.

## Purpose

Judge the workflow by its receipts: a real pi session's reasoning traces and behavior. Produce a per-skill verdict — worked / not exercised / needs change — backed by counts and quoted moments, and propose the smallest evidence-based edits. The workflow improves through use; this is the instrument that reads the trace.

## When to eval

On a failure moment — a session that went sideways, a catalog item that fired, a skill that confused you — not as routine. Across sessions, on a schedule, to mine repeated corrections: that is `scripts/eval-nightly.sh`, and it improves the small things on its own. The workflow exists to ship; if you find yourself eval-ing more than building, stop and ship. Quarterly, ask the bigger question: does the workflow still pay for itself? If the beats feel heavier than the problems they solve, simplify — this skill is also the instrument that tells you which beats to cut.

## Steps

1. **Extract.** Take the transcript path the user gives and run the extraction script (run it raw, without rtk — the stdout summary is needed in full):

   `python3 scripts/extract.py <transcript.jsonl|transcript.html> [outdir]`

   It accepts both pi export formats (jsonl lines, or the base64 session JSON inside the HTML export page), and writes `transcript.txt`, `thinking.txt`, and `stats.json` into `<transcript>.eval/` by default. When there is no export, read the harness's own history instead: in OMP that is `archive` (recent projects and past sessions, with recaps) or `history://`, and the session files under the agent's home. The extractor is a convenience for a pi export, not the only door.

2. **The quick scan — stats first, not the transcript.** Read `stats.json`: message counts, skill invocations, leading-word adoption by category, artifact mentions and writes, gates, squawks, slices. This is the signal; it tells you where to read. Do not read the whole transcript until the stats demand it.

3. **Read the signal moments.** In `transcript.txt`, read the moments the stats point to: each skill invocation, each gate line, scope changes, the end of each beat, and every artifact check. Read the reasoning traces where the behavior bent. Line refs in stats are transcript line numbers — jump straight there.

4. **The rubric.** Load `references/rubric.md` and score the five lenses — the arc, gate discipline, artifact discipline, leading-word adoption, the failure catalog — then run Lens 6: the Pocock sweep (`references/pocock.md`) over the skills.

5. **The verdict.** Per-skill table with evidence (a count or a quoted line + line number). Adoption table by category. The failure list with the owning skill for each. The Pocock sweep — per-skill "Matt would approve?" verdicts. Proposed edits — each held to the four tests in the rubric (evidence, deletion, training-data, smallest coherent change).

6. **Gate.** Present the verdict and the proposed edits. Do not touch any skill file until the user approves.

7. **Across sessions (mining).** A single trace answers "did this session work". Many traces answer "what does the workflow keep getting wrong", which is the more valuable question and the one that compounds. When asked for it, or when running the nightly pass:

   - Lock the window (default the last 7 days) and the workspace. Never read another project's sessions without being asked.
   - Fan out read-only subagents, one slice of the corpus each, on a fast model. Each returns, per session: the goal, the corrections the user made, the moments the agent went sideways, and which skill owned the failure. Raw transcripts stay in the subagents; only findings come back.
   - Group what returns into repeated corrections. A pattern counts once it has happened twice across sessions, and it names the skill that owns the fix.
   - Turn each pattern into the strongest mechanism that works (`rule://principle-encode-lessons-in-structure`): a principle rule, a lint or a type, a gate, or a skill edit. Not more prose.
   - Hold every proposed edit to the same four tests as step 5 (evidence, deletion, training-data, smallest change), and cite the session and the moment for each.

## The nightly pass

Run `scripts/eval-nightly.sh` on a schedule (cron or launchd; a few times a week is enough). It invokes the agent headless, runs this skill across recent sessions, and splits the outcome by risk:

- **Safe edits it applies itself:** a typo, a wording fix, a missing example, a broken link, a clearer name. Small, reversible, and held to the four tests.
- **Foundational edits it only proposes:** a new or changed principle rule, a change to a skill's steps or contract, a gate or threshold change, anything under `tools/` (vendored). These go into the report and wait for the human.

The split is the point: the workflow improves on its own for the small things, and the things that would move a boundary wait for a person. The report names each proposal, its evidence, and why it crossed the line. Review it, then run the accepted ones by hand.

**Reply:** for a session, the verdict from step 5. For the mining and nightly pass, the repeated corrections, each with its evidence and the skill that owns it, plus the report path.

## Do not

- Judge from impressions — every finding cites a line number or a count, or it is not a finding.
- Read the whole transcript before the stats. Stats point; reading confirms.
- Propose an edit without a trace moment showing the failure.
- Churn skills that worked or were not exercised — `not exercised` is a verdict, not a defect.
- Propose an edit without a session and a moment that show the failure.
- In the nightly pass, apply a foundational edit (a rule, a skill contract, a gate, anything under `tools/`) without the human. Propose it.
