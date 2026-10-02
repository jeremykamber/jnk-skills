# Activity slides

An activity slide is a brief for something the room does for five
minutes, and the deck only works if the brief is complete. It is the
one slide type with structured fields, because each field answers a
question a student would otherwise have to ask out loud:
**task, time, grouping, deliverable, success criterion, debrief.**

**Reasoning vocabulary**: *brief, anchor question, first vote,
deliverable, social configuration, debrief, artifact.*

## The brief, field by field

```json
{
  "type": "activity",
  "title": "Sort these into 'needs a refactor' and 'leave it alone'",
  "activity": {
    "task": "Classify all eight snippets; write the rule you used in one line",
    "timeMinutes": 6,
    "grouping": "pairs",
    "deliverable": "one rule per pair, on the whiteboard",
    "successCriterion": "your rule separates the two piles without naming a file",
    "debrief": "Collect three rules, test each against the ambiguous snippet, then name the airtight one",
    "artifact": { "mode": "general", "activityJson": "../create-exercise/demos/…activity.json" },
    "anchorQuestion": "Which snippet could go either way, and why?"
  },
  "qr": { "url": "https://you.github.io/slug/", "label": "Open the exercise" },
  "notes": "Do NOT answer questions in the first two minutes. Walk the room and note which pair is stuck on the boundary case — that is your debrief."
}
```

The checker errors on a missing **task**, **time**, **deliverable** or
**debrief**, and warns on a missing **grouping** or **success
criterion**. That strictness is the point: an activity you cannot
brief is an activity you have not designed.

Boundaries, so the fields stay honest:

- **The deliverable is what they hand back**, not what they do. "One
  rule per pair" is a deliverable; "discuss" is not.
- **The debrief is what *you* do with their work.** An activity with no
  debrief is a break — that is the difference between doing and
  learning.
- **Time is the whole activity**, briefing to debrief. Mazur's
  vote/discuss/revote cycle runs 8–15 minutes per question; a
  think-pair-share needs 5–7 to be worth starting, and the *pair* step
  is what produces the participation gain (Mundelsee & Jurkowski 2021)
  — dropping it to save time removes the effect.

## The anchor question

Design the anchor so the first response splits roughly 35–70% correct:
disagreement is what makes the discussion happen, and unanimous
confidence teaches nothing. Give each wrong option a real
misconception's shape. This is the single highest-leverage 20 minutes
in the deck, because everything downstream — the debrief, the exercise,
the follow-up — hangs off it.

Peer instruction is the best-supported format when you have the time
(Smith et al. 2009 found discussion improved understanding *even when
nobody in the group initially knew the answer*). Note the boundary:
23% of students who moved to the correct answer after discussing still
missed an isomorphic question — so reveal, explain, and check again.

## Where the artifact comes from

An activity can carry a **practice artifact**: an interactive exercise
the room opens from a QR code. That artifact is not authored here — the
`create-exercise` skill builds it, and this skill wires it in.

The handoff is one file. `create-exercise`'s `publish.mjs` writes
`<slug>.activity.json` next to the published exercise:

```json
{
  "slug": "quiet-hours-boundaries",
  "mode": "web",
  "title": "Quiet hours: boundaries and edge cases",
  "url": "https://you.github.io/quiet-hours-boundaries/",
  "liveUrl": "https://you.github.io/quiet-hours-boundaries/",
  "repo": "you/quiet-hours-boundaries",
  "repoUrl": "https://github.com/you/quiet-hours-boundaries",
  "qrPng": "/abs/path/quiet-hours-boundaries.qr.png",
  "activityJson": "/abs/path/quiet-hours-boundaries.activity.json",
  "publishedFrom": "/abs/path/quiet-hours-boundaries",
  "dryRun": false
}
```

Point the activity slide at it with
`activity.artifact.activityJson`, and `build-deck.mjs` hydrates the
rest at build time: the URL, the short display form, the mode, and the
QR image bytes (base64, inlined so the `.gs` is self-contained). **One
source of truth** — the exercise's own metadata — so the slide cannot
drift from what the QR actually opens. A missing QR file fails the
build rather than shipping a slide with a dead code on it.

For a deck with several activities, the fan-out is:

1. Interview (Q1–Q11) to settle the objective, the anchor question and
   the format.
2. Per activity, spawn the `create-exercise` work in parallel — one
   subagent per exercise, each returning its `<slug>.activity.json`.
3. Author the deck spec with `activity.artifact.activityJson` pointing
   at each returned file.
4. `check-deck.mjs` → `build-deck.mjs` (hydrates the URLs and QRs).

If the user only wants the deck, the activity stays artifact-free: ask
them for a paper or on-screen version and set `qr` to nothing. Never
paste a URL into a slide by hand when a hydrated artifact could carry
it.

## Running it when you present

- **Say the brief, then stop talking.** Purpose, task, time, group,
  deliverable — one pass, then let them start. Repeating it eats the
  activity's clock.
- **The QR goes up while they are still moving.** Put the slide up
  before you finish the brief so the code is on screen for the whole
  activity.
- **Do not rescue in the first two minutes.** The productive struggle is
  the learning; your job is to notice the stuck pair for the debrief.
- **Debrief with their work, not your answer.** Ask for two or three
  pair responses, test them against the boundary case, then name the
  airtight version (Tannenbaum & Cerasoli 2013 on debriefing; Skulmowski
  2024 on activities that add load without adding learning).
