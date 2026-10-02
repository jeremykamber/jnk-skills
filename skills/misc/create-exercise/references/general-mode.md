# General mode — an interactive exercise on the web

The deliverable is one self-contained page: an interactive exercise
with immediate, elaborated feedback, published to GitHub Pages so a QR
code works from a projector.

Everything runs through a shared engine, so the behaviour is identical
across exercises and identical in the browser and in the tests:

| File | Role |
|---|---|
| `assets/engine.mjs` | the decisions: validation, grading, feedback, the second pass. Pure — no DOM, no clock |
| `assets/shell.html` | the view: renders a spec, keyboard-operable, offline, one file |
| `scripts/new-exercise.mjs` | inlines engine + spec into `index.html` and writes the README |
| `scripts/check-exercise.mjs` | the completion criterion |
| `scripts/fixtures/spec.json` | a real exercise, used by the tests |

Read [design-rules.md](design-rules.md) first; those rules all apply.
**Reasoning vocabulary**: *step, kind, distractor feedback, reveal,
second pass, seed spec.*

## The spec is the exercise

Write `<slug>.spec.json`. The checker refuses a spec whose distractors
have no feedback, so start from a seeded set and improve it rather than
from a blank file.

```json
{
  "meta": {
    "title": "Complexity: predict before you measure",
    "objective": "predict the growth class of a piece of code before you run it",
    "audience": "students who have seen loops and arrays but not formal analysis",
    "mode": "general",
    "source": "CLRS ch. 3; Sedgewick & Wayne §1.4"
  },
  "steps": [
    {
      "id": "slowest",
      "kind": "choice",
      "prompt": "Which of these grows slowest as n gets large?",
      "why": "The notation is about the shape of the curve, not the constant.",
      "difficulty": 1,
      "hint": "Compare them at n = 1,000,000.",
      "source": "CLRS §3.1",
      "options": [
        { "id": "a", "text": "log n", "correct": true, "feedback": "Yes — doubling n adds one step." },
        { "id": "b", "text": "n", "correct": false, "feedback": "Closer than it looks, but log n is strictly slower-growing." }
      ]
    }
  ]
}
```

## Step kinds, and what each is for

| `kind` | Interaction | Use it for |
|---|---|---|
| `choice` | pick one | the misconception, with one distractor per wrong model |
| `multi` | pick several | "which of these are…", where partial credit must fail |
| `order` | click into sequence | processes, precedence, pipeline stages |
| `match` | pair the columns | terms to definitions, symptoms to causes |
| `classify` | item → bucket | categories, types, edge cases |
| `numeric` | type a number | anything computable; carries a `tolerance` |
| `text` | type a short answer | one-word or one-phrase retrieval, with an `accept` list |
| `explain` | write, then compare | self-explanation; the model answer is hidden until they commit |
| `reveal` | show | a worked example to study, no answer to give |

Rules the checker enforces: every option explains itself; `choice` has
exactly one correct answer; a `text` step names what it accepts; every
step says what it checks (`why`) and how hard it is (`difficulty`); a
set of six or more includes an `explain`; the last step is the hardest.

## The shape of a good set

- **6–12 steps.** Under four is not practice; over twenty is a chore.
- **Open on the misconception**, not on a warm-up. The first step is
  where curiosity is highest (Kang et al. 2009) — spend it on the thing
  they think they already know.
- **Vary the interaction.** Six choice steps in a row is a rhythm to
  game, and a monotonous set loses the interleaving benefit.
- **One `explain`.** More than that and the set becomes a writing task.
- **Ramp the difficulty**, hardest last.
- **Cite the claim a student might doubt**, in `source`; the full list
  goes in `meta.source` and prints in the page footer.

## Build it, check it, publish it

```bash
SKILL=~/.agents/skills/create-exercise
node "$SKILL/scripts/check-exercise.mjs" web <slug>.spec.json
node "$SKILL/scripts/new-exercise.mjs"   web <slug>.spec.json <slug>/
node "$SKILL/scripts/publish.mjs"        <slug>/ --mode web
```

`new-exercise.mjs` refuses to build a spec that breaks the rules, so a
page that exists is a page that passed. `publish.mjs` creates the public
repo, enables Pages, waits until the live URL answers 200, mints
`qr.png` into the repo, and writes `<slug>.activity.json` — the handoff
the slides skill reads. See [delivery.md](delivery.md).

## What the page does that a quiz site does not

- **Commit before reveal.** Nothing is graded until the answer is sent.
- **Elaborated feedback on the distractor you chose**, not a score.
- **A second pass over the missed steps**, at the end of the run.
- **Hints that are counted**, so leaning on them is visible.
- **Progress, not points.**
- **Works with no network and no server**: a QR that loads a static page
  survives classroom wifi, and the same file opens from a laptop.

## Boundary

The answers are in the page — a static site cannot hide them, and a
determined student will read the JSON. That is fine for practice and
wrong for assessment: use this for what they do *before* the graded
thing, and never grade the page's output. Say it in the README so the
student knows the difference too.
