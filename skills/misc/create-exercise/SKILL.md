---
name: create-exercise
description: Build a practice exercise people actually learn from — an interactive web exercise (choice, order, match, numeric, text, explain) published to GitHub Pages with a QR code, or a code exercise repo (failing tests, a placed misconception, reference solution, rubric). Two modes: general and code. Use when the user asks for practice material, a quiz, an exercise, a worksheet, a coding challenge, a homework set, or a self-check students do before or after a class.
---

# Create exercise

Author practice that changes what someone can do, not a quiz that
scores them. The engine, the shell and the checker are already built and
tested — your job is the content and the sequence.

**Reasoning vocabulary**: *first attempt, elaborated feedback, worked
example, fade, interleave, spacing, second pass, deliverable.*

## Pick the mode first

| Mode | Deliverable | For | Reference |
|---|---|---|---|
| **general** | one self-contained HTML page + QR, on GitHub Pages | any topic; retrieval with immediate, elaborated feedback | [references/general-mode.md](references/general-mode.md) |
| **code** | a repo: failing tests, a deliberate trap, `teacher/` solution + rubric | programming; a diagnosis or design habit | [references/code-mode.md](references/code-mode.md) |

Read [references/design-rules.md](references/design-rules.md) before
authoring either. It is the evidence — retrieval parameters, fading,
interleaving, feedback levels, what not to do — and it overrides taste.

## Steps

### 1. Frame it — four decisions

Ask, one at a time, before writing anything:

1. **What must they be able to do afterwards?** One sentence.
2. **What do they already know?** Prior knowledge dominates: the same
   worked example that lifts a novice is inert or harmful to an expert
   (Kalyuga's expertise reversal).
3. **How long should it take, and where does it sit** — before the
   lesson (pretesting), inside it, or after it (retrieval)?
4. **What evidence tells them they got it?** The completion criterion is
   part of the design, not the epilogue.

### 2. Write the practice, not the questions

Decide the *sequence* first: which step is the read-and-explain, which
is the completion problem (the last step missing), which are theirs.
Fade the scaffolding. Then write steps, distractors-first: the wrong
answer is where the misconception is, so write its feedback before the
question's phrasing.

Done when you can name the misconception each distractor catches and
the skill each step exercises.

### 3. Author the spec

- **general** → `<slug>.spec.json` (`meta.mode` stays `general`; the
  CLI calls this mode `web`), then check → build → publish.
- **code** → the repo tree: student code + visible tests, `teacher/`
  with the solution, hidden tests and the rubric. Start from
  `assets/templates/<lang>/`, or read a worked `demos/` exercise.

### 4. Check it — this is the completion criterion

```bash
SKILL=~/.agents/skills/create-exercise
node "$SKILL/scripts/check-exercise.mjs" web <slug>.spec.json
node "$SKILL/scripts/check-exercise.mjs" code <lang> <exercise-dir>
```

Zero errors, and every warning either fixed or a one-line deliberate
choice. The checker refuses a distractor with no feedback, a set with no
retrieval, a spec whose only interaction is one kind, and four other
things that separate practice from a quiz.

### 5. Build and publish

```bash
node "$SKILL/scripts/new-exercise.mjs" web <slug>.spec.json <slug>/
node "$SKILL/scripts/publish.mjs"      <slug>/ --mode web --dry-run   # then without --dry-run
```

`publish.mjs` writes the self-contained page, creates the public repo,
enables Pages, waits for the live URL, mints `qr.png`, and writes
`<slug>.activity.json` — the handoff the `slides` skill reads to put a
QR on an activity slide. `--mode code` publishes the student tree
instead (`teacher/` and `solution` stripped, hard-failing if either
survives) and mints the repo QR the same way. `--dry-run` shows the
plan without touching the network.

Everything leaves this machine through `publish.mjs`; nothing that
contains answers goes to a public remote.

## Pointers

- [references/design-rules.md](references/design-rules.md) — the evidence every exercise obeys
- [references/general-mode.md](references/general-mode.md) — the spec schema, step kinds, what the page does
- [references/code-mode.md](references/code-mode.md) — repo layout, the three exercise shapes, the trap
- [references/delivery.md](references/delivery.md) — publishing, QR, the activity handoff, what is public
- `assets/engine.mjs` / `assets/shell.html` — the machinery: edit the engine, then re-run the tests
- `scripts/check-exercise.mjs` — the completion criterion; `scripts/test-engine.mjs` — the engine's regression suite; `scripts/test-shell.mjs` — drives the built page in a stub DOM, because the wiring (what enables the submit, what a click does) is where the two shipped bugs lived
- `demos/` — three worked code exercises; `scripts/fixtures/spec.json` — a worked web exercise

## Boundary

A web exercise's answers are in the page. That is fine for practice and
wrong for assessment — use this for what students do *before* the
graded thing, and never grade its output. Say it in the README so the
student knows the difference too.
