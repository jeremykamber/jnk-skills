---
name: slides
description: Build a themed Google Slides deck — lecture or lesson slides, workshop or training material, a briefing, readout or overview deck — as a JSON spec that a tested Apps Script turns into slides in the user's own template. Two modes: teach (lecture, lesson, workshop; optimizes durable learning, retrieval and transfer) and inform (briefing, update, readout, explainer; optimizes clarity, memorability and engagement). Use when the user asks for slides, a deck, a presentation, lecture slides, teaching or training material, or to turn notes/a doc/a topic into a slide deck.
---

# Slides

Build a deck the user can actually use: content authored against
learning and cognitive science, rendered into their own Google Slides
theme.

**The theme does the design. You do the text and the notes.** The deck
is built by copying a template presentation and filling its layouts, so
every visual decision — fonts, colors, backgrounds, bullets, image
placement — is already made. What you control is the claim on each
slide and the delivery in its notes.

## Pick the mode first

| Mode | For | Optimizes | Reference |
|---|---|---|---|
| **teach** | a lecture, lesson, workshop, training — anyone expected to *do* something differently afterwards | durable retention, transfer, motivation | [references/teach-mode.md](references/teach-mode.md) |
| **inform** | a briefing, update, readout, proposal, explainer — the audience needs to understand and remember | clarity, memorability, engagement | [references/inform-mode.md](references/inform-mode.md) |

Infer it from the request; ask once if it is genuinely ambiguous
("should this teach them to do it, or brief them on it?"). Both modes
obey [references/slide-craft.md](references/slide-craft.md) — read that
before authoring anything.

## Steps

### 1. Frame it — interview, not guesswork

Run [references/coach-interview.md](references/coach-interview.md): the
eleven questions that decide the deck, **asked one at a time** with your
recommended answer attached. Q1–Q3 (enduring understanding, evidence of
understanding, prior knowledge) settle the **mode** and how much
scaffolding stays; Q4–Q7 (room size, slot length, devices, access) settle
what fits; Q8–Q11 write the activity briefs. You also need the
**template id** (the themed presentation to copy; see
[references/deck-spec.md](references/deck-spec.md) for the house
default).

Infer what you can from the request and skip answering it back, but do
not design a teach deck without knowing what the audience already
carries — prior knowledge dominates, and the support that lifts a novice
is inert or harmful to someone who already has the skill.

Done when you can state the objective in one sentence, name what the
audience already knows, and have the activity formats settled.

### 2. Write the spine

The sequence of sections and the claim each slide makes, in order —
before any slide's text. Use the mode reference's structure and the
headline test: **read the titles in order and you have read the
argument.** A spine that reads like a table of contents is labels where
claims belong.

Done when the titles alone carry the argument, every slide serves the
objective, and you can name the slides you would cut if you lost a
third of the deck.

### 3. Author the deck

Write `<slug>.deck.json` to the user's directory, per
[references/deck-spec.md](references/deck-spec.md). Short cues on the
slide, the delivery in `notes`, answers in `answer`. Every slide's
notes should say what you would actually say, including the example and
the caveat that would otherwise have been a bullet.

When a slide's point is a *shape* — an order, a set of parts, a
proportion — make it a `figure` slide instead of a list, and read
[references/figures.md](references/figures.md) first: it has the nine
kinds, which one fits which claim, and the rules the checker enforces.

Done when every slide has a full-sentence headline, notes that do not
repeat the slide, and no slide carries a second idea.

### 4. Source the claims

Every number, attributed position and anything a listener would doubt
gets `cite` (short name on the slide) and `citeUrl` (link in the notes);
the deck's whole evidence base goes in `meta.sources`. Open each URL —
a citation you have not loaded is one you cannot vouch for, and an
unverifiable claim is either dropped or written as your own judgement
with no citation attached. See
[references/source-integrity.md](references/source-integrity.md).

### 5. Wire the activities

If the deck has `activity` slides, each one is a brief plus — when the
room needs something to *do* — a practice artifact. Build those with the
`create-exercise` skill (one exercise per activity, in parallel if there
are several), then point the slide at the exercise's own metadata:

```json
"activity": { "task": "…", "timeMinutes": 6, "grouping": "pairs",
              "deliverable": "one rule per pair", "debrief": "…",
              "artifact": { "activityJson": "../create-exercise/…activity.json" } }
```

`build-deck.mjs` hydrates the URL, the short display form and the QR
bytes from that file, so the code on the slide cannot drift from the
page it opens — never transcribe a URL by hand. Read
[references/activity-slides.md](references/activity-slides.md) for the
brief fields and how to run the activity in the room.

Done when every activity slide has a complete brief and every artifact
resolves.

### 6. Check it

```bash
SKILL=~/.agents/skills/slides
node "$SKILL/scripts/check-deck.mjs" <slug>.deck.json
```

This is the only way to tell a finished deck from a plausible one
without presenting it: it enforces the budgets, the assertion
headlines, the notes, the citation fields, and the mode's own rules
(Teach: retrieval cadence and answered prompts; Inform: navigable
structure) — plus, for every `activity` slide, that the brief is
complete: task, time box, deliverable and debrief are errors when
missing, because an activity you cannot brief is one you have not
designed.

Done when it reports zero errors, and every warning is either fixed or
a deliberate choice you can justify in one line.

### 7. Build and hand off

```bash
SKILL=~/.agents/skills/slides
node "$SKILL/scripts/build-deck.mjs" <slug>.deck.json <slug>.deck.gs
```

Then tell the user exactly how to turn it into a deck:

1. https://script.google.com/ → New project
2. Paste the whole `.gs` file over the default code, save
3. Select `createDeck`, Run, approve permissions
4. The run log ends with the URL of the new deck (the template itself
   is never modified)

You cannot run this part: it needs the user's Google account, and there
are no Google credentials on this machine. The checker and
[scripts/test-engine.mjs](scripts/test-engine.mjs) are your evidence
that the deck spec and the engine are sound, and for a deck with
figures, so is [scripts/preview-figure.mjs](scripts/preview-figure.mjs)
— it draws them from the engine's own geometry, so you can look at what
the room will see before it exists in Slides. Say plainly which of the
two you ran rather than claiming you verified the rendered slides. If the user pastes back the
Apps Script run log, act on it — it reports layout fallbacks and errors.

## Pointers

- [references/coach-interview.md](references/coach-interview.md) — the eleven questions, in order, and why each one matters
- [references/slide-craft.md](references/slide-craft.md) — the rules every deck obeys, and the evidence behind them
- [references/activity-slides.md](references/activity-slides.md) — briefing an activity, the anchor question, the QR handoff
- [references/source-integrity.md](references/source-integrity.md) — what must be cited, and what to do when you cannot verify it
- [references/teach-mode.md](references/teach-mode.md) — units, retrieval checks, worked examples, fading
- [references/inform-mode.md](references/inform-mode.md) — the argument spine, anchors, concreteness
- [references/deck-spec.md](references/deck-spec.md) — the JSON schema, slide types, what the engine renders
- [references/figures.md](references/figures.md) — when to draw instead of list: the nine figure kinds, their rules, the image exception
- `assets/deck-builder.gs` — the engine; splice through it, never rewrite it
- `scripts/check-deck.mjs` — the design rules; `scripts/build-deck.mjs` — spec + engine → `.gs`
- `scripts/preview-figure.mjs` — draw a deck's figures as SVG/PNG, without Google
- `scripts/test-engine.mjs` — the engine against a mock Slides service, after any engine edit

When the user wants the retention loop *after* the deck — spaced
review, drills, practice they do themselves — that is `create-exercise`
(the artifact an activity slide points at) and the `teach` skill. This
skill ends at the deck.
