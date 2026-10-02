# Deck spec

The deck is one JSON object. It is the only thing you author; the
engine turns it into slides. Write it to `<slug>.deck.json`.

```json
{
  "meta": {
    "title": "Q3 payment review",
    "mode": "inform",
    "templateId": "1X0NwsMtqwpGdcwk0QqlFYHlpKYwdXW-rh5j0vZSN7-U",
    "audience": "finance leads who know the product, not the pipeline",
    "objective": "agree to fund the retry rebuild this quarter",
    "source": "Q3 platform telemetry; Retry rebuild RFC-14",
    "sources": ["Retry rebuild RFC-14 — https://…", "Q3 telemetry dashboard"]
  },
  "slides": [ ... ]
}
```

`meta.mode` is `teach` or `inform` and selects the design rules
[check-deck.mjs](../scripts/check-deck.mjs) enforces. `audience` is
prior knowledge, not job title — it decides how much scaffolding the
deck keeps (expertise reversal: support that helps a novice harms an
expert). `templateId` is the themed presentation to copy; it stays the
same for every deck in a given theme, and the default above is the
house template.

## Slide types

| `type` | Fields | Use it for | Layout role |
|---|---|---|---|
| `title` | `title`, `subtitle`? | opening and closing title cards | title |
| `section` | `title`, `subtitle`? | a divider before each section | section |
| `statement` | `title`, `subtitle`? | one claim standing alone — no support on the slide | title |
| `body` | `title`, `bullets[]` | a claim with 2–5 cues under it | body |
| `twoColumn` | `title`, `left`, `right` | a comparison, or two parallel lists | twoColumn |
| `prompt` | `title`, `bullets[]`?, `answer`, `notes` | a retrieval check (Teach) or a question to the room (Inform) | body |
| `activity` | `title`, `activity{}`, `qr`? | something the room does for 5–15 minutes — see [activity-slides.md](activity-slides.md) | body |
| `figure` | `title`, `figure{}` | the shape of the idea, drawn: a sequence, a set of parts, a proportion — see [figures.md](figures.md) | figure (Title Only) |

`twoColumn.left` and `right` are `{ "heading": "...", "bullets": [...] }`.

`activity` carries the brief — `task`, `timeMinutes`, `grouping`,
`deliverable`, `successCriterion`, `debrief`, `anchorQuestion`? and
`artifact`? — and the checker enforces the required ones. Read
[activity-slides.md](activity-slides.md) before writing one.

`qr` puts a scannable code and a short URL on the slide: `{ "png":
"<base64>", "url": "...", "label": "..." }`. You do not write the base64
by hand — give `pngFile` and let
[build-deck.mjs](../scripts/build-deck.mjs) inline it, or skip `qr`
entirely and let an activity's `artifact.activityJson` hydrate it.

`figure` carries one drawn idea — `{ "kind", "nodes", "edges"? }`,
where `kind` is `flow`, `cycle`, `scatter`, `tree`, `quadrant`, `matrix`, `stack`,
`timeline`, `bars`, `network`, or `image` for a picture you supply
(`svgFile` + `alt`). The engine draws it from the slide's own theme
colors, at most five labelled elements, and
[check-deck.mjs](../scripts/check-deck.mjs) refuses a figure that is
the wrong form, the wrong size, or missing a name. Read
[figures.md](figures.md) before the first one.

Every slide also takes `notes` — required on all types (the checker
enforces it), because the slide is the cue and the notes carry the
delivery ([slide-craft.md](slide-craft.md)) — and optionally `cite` +
`citeUrl` for a claim that needs a source
([source-integrity.md](source-integrity.md)).

```json
{
  "type": "prompt",
  "title": "It is 11 PM on a Tuesday. Are you in quiet hours?",
  "bullets": ["Yes", "No", "Only on weekdays"],
  "answer": "Yes — quiet hours start at 10 PM on weekdays and midnight on weekends.",
  "notes": "Expect 'only on weekdays' from anyone who has not read the weekends line. Ask for a confidence rating before the reveal."
}
```

## How the engine renders it

- **Text only.** The engine writes the title, body, column and note
  text, then leaves the theme alone. Fonts, sizes, colors, backgrounds
  and list glyphs come from the template; it never sets them. The one
  exception is bold: `**text**` in any title, bullet or heading marks a
  span, which is written in the theme's own bold face. The marks are
  authoring syntax and never reach the slide, so measurements count the
  text between them.
- **Bullets come from the theme.** A paragraph that the theme already
  lists keeps its glyph; one that is not in any list gets the standard
  disc list, and headings and blank separator lines are explicitly kept
  out of lists so they do not collect a stray bullet. Write the text
  without `"• "` prefixes — the glyph is the theme's job.
- **Notes are written for every slide** via the slide's notes page.
  `prompt.answer` is folded into the notes ahead of `notes`, so the
  answer is never on the slide.
- **Layouts are resolved by name, then by shape**: `Title`, `Section`,
  `Title + Body`, `Two Column` (plus `Title Slide`, `Section Header`,
  `Title and Body`, `Title and Content`, `Two Content`, `Comparison`,
  ignoring case, spaces and punctuation). A theme that names none of
  them still works; the run log reports what each role resolved to.
- **Figures are drawn, not pasted.** A `figure` slide resolves to the
  theme's `Title Only` layout; a theme without one uses its body layout
  and the figure draws inside the body box (the run log says so). Shapes
  and lines take the slide's theme colors; annotation is 10pt; nothing
  else sets a size. An `image` figure is placed, fitted to the box.
- **Two columns are ordered left to right** by on-screen position, not
  by the layout's element order. If the layout has fewer than two body
  placeholders, both columns go into the one it has.

## What it does not do

No speaker-note formatting, no tables, no charts from data, and no
control over where the theme's own placeholders sit. Text always lands
in the placeholder the theme provides.

Figures are the exception, and a deliberate one: a `figure` slide draws
itself from shapes and lines inside the box the layout gives it (see
[figures.md](figures.md)). A picture that cannot be drawn as shapes —
a photo, a scan, someone else's schematic — goes on a `figure` slide as
`kind: "image"`.

For a visual that is neither, state it in the notes
(`VISUAL: the screenshot of the error banner under the red button`) and
leave the theme's picture or object placeholder on the slide for it.

One deck per run, from one template. The engine copies the template, so
the original is never touched, and each run produces a new file named
`<meta.title> — <timestamp>`.

## Files

| File | Role |
|---|---|
| `<slug>.deck.json` | what you author |
| `<slug>.deck.gs` | built from the spec; the file the user pastes |
| `assets/deck-builder.gs` | the engine — never rewrite it, splice through it |
| `scripts/check-deck.mjs` | design rules → the completion criterion |
| `scripts/build-deck.mjs` | deck.json + engine → `.gs`; hydrates QR bytes and activity artifacts, and fails loudly on a missing file |
| `scripts/test-engine.mjs` | mock-Slides run of the engine, after engine edits |
| `scripts/mock-slides.mjs` | the fake Slides service both above run the engine against |
| `scripts/preview-figure.mjs` | draws a deck's figures as one SVG/PNG, without Google |
| `scripts/rasterize.mjs` | SVG → PNG, for `figure` images (resvg, then rsvg-convert) |
| `references/figures.md` | the figure vocabulary, its rules and their evidence |

`build-deck.mjs` resolves every path in the spec relative to the spec
file, so a deck and its artifacts travel together: `qr.pngFile` becomes
`qr.png`, and `activity.artifact.activityJson` fills in the artifact's
`url`, `displayUrl`, `mode` and QR from the exercise's own metadata.
Never hand-write those four fields; let them come from the exercise.
