# Learner model

Track **components of competence**, not pass/fail on a topic. "Derivatives" is not one thing:
a learner can define a derivative, fail to apply it, and hold a misconception at the same time.
The right instructional strategy also changes as knowledge develops (the expertise-reversal
effect: worked examples help novices and hinder experts), so the model must be fine-grained
enough to tell you which intervention fits now.

## Per-concept schema

```text
CONCEPT: <name>

Components:            # subject-specific where relevant; generic five below
  recognition / definition: 0-1   # can state it
  meaning / intuition:       0-1   # can say what it is for
  execution:                 0-1   # can do it
  discrimination / selection: 0-1  # can recognize when it applies
  transfer:                  0-1   # can apply it to new situations

Prerequisites:         secure | gap: <name>

Misconceptions:        [each with the evidence that revealed it]

Retrieval strength:    low | medium | high
Transfer strength:     low | medium | high
Cue dependence:        high | medium | low   # how much scaffolding the last correct response needed

Calibration:           (predicted, actual) pairs, e.g. "95%→wrong, 80%→right"
                       # track accumulated evidence; confidence is a measurement,
                       # not a learning activity (see pedagogy.md)

Scheduling:           reps / ease / interval / lastReview / nextReview
                       # maintained by scripts/scheduler.js; see session.md
```

Replace the generic components per subject (language: listening / speaking / reading /
writing; math: symbolic / geometric / numeric / selection; biology: mechanism / structure /
function).

Example:

```text
CONCEPT: derivative
  recognition / definition:     0.95
  meaning / intuition:          0.72
  execution:                    0.88
  discrimination / selection:   0.40   # solves "compute the derivative" but not "which tool applies"
  transfer:                     0.43
  prerequisites:                mostly secure
  misconceptions:               treats derivative as "the value of the function";
                                confuses instantaneous and average rate
  retrieval strength:           medium
  transfer strength:            low
  cue dependence:               high    # correct mostly after being told which method to use
  calibration:                  95%→wrong, 80%→right
  scheduling:                   reps 2, ease 2.5, interval 6d, next 2026-06-08
```

## What updates the model

Weight evidence by quality, not by correctness alone:

| Observation | What it means |
|---|---|
| Correct + correct reasoning + no cues | Strong evidence |
| Correct + correct reasoning, only after an explicit cue | Cue-dependent — practice uncued selection before counting it |
| Correct + wrong reasoning | Weak — possibly a memorized procedure or a lucky guess; probe |
| Correct only in familiar form | Performance, not transfer |
| Wrong + articulate misconception | Valuable — names the exact intervention |
| Wrong + careless | Fluency/attention issue, not understanding |

One response rarely overturns a field; adjust in small steps and let patterns across turns
accumulate. Never mark a concept "mastered" from immediate performance — advance only on the
evidence ladder in [session.md](session.md): immediate → independent → delayed → uncued
selection → novel transfer.

## Cross-session persistence

File per topic at `~/.teach/<topic-slug>.md` so spacing works across sessions. Draft the
curriculum map into it when the topic starts and revise it as evidence accumulates
([session.md](session.md)):

```markdown
# <Topic>

## Concepts
<per-concept schema blocks>

## Curriculum map
- Target: <what the learner can do in a novel situation at the end>
- Route (a hypothesis — evidence revises it): A → B → C, with prerequisite edges marked

## Scheduling state
```json
{"cards":[
  {"name":"derivative","repetitions":2,"ease":2.5,"interval":6,"lastReview":"2026-06-01","nextReview":"2026-06-08"}
]}
```

## Session log

- <date>: <what was covered, key evidence, next bottleneck>

```

The `Scheduling state` block is the scheduler's input: paste it into `scripts/scheduler.js
due` to find what's due, and feed each reviewed concept to `schedule` ([session.md](session.md)
has the full interface). Keep the block machine-readable — don't hand-edit intervals.

On a "review" request, load the file, ask the scheduler which concepts are due, and review
those. Begin with retrieval; if a retrieval fails, diagnose and remediate minimally, then
retrieve again. Update the file at the end of every session and say where it lives.
