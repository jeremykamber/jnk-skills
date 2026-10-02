# Figures

When a slide has to show a *shape* — an order, a set of parts, a
proportion — draw it. A drawn figure carries the relationship in one
glance, which is the whole point of the slide; the alternative is a
bullet list that makes the room hold the structure in their heads while
they listen.

Figures here are built from the slides' own primitives: a rounded
rectangle per element, a line per relation. They are vector, they take
their colors from the deck's theme, and they stay editable — the user
can drag a box in the editor the way they can drag anything else.

A figure is not decoration. Decorative detail depresses learning
(g = −0.33; Sundararajan & Adesope 2020), and a figure that restates
the title in boxes is decoration with extra steps.

## What the drawing is for

| The slide's claim | The figure that carries it |
|---|---|
| "A request takes four steps" | `flow` |
| "The loop has no first step" | `cycle` |
| "One cause explains most of it" | `tree` |
| "You can sort these by cost and payoff" | `quadrant` |
| "Two questions decide it" | `matrix` |
| "The time is spent in four places" | `stack` |
| "It ships in three weeks" | `timeline` |
| "Rent takes half the money" | `bars` |
| "Cost and frequency move in opposite directions" | `scatter` |
| "Three teams, one queue" | `network` |
| A photograph, a scan, a schematic someone else drew | `image` |

Pick the form the content calls for, not the form you like drawing.
A sequence is a `flow`; a sequence that closes on itself is a `cycle`
and drawing it as a flow invents a first step that is not there.
Proportions are `bars` — length on a common baseline is the encoding
people read most accurately (Cleveland & McGill 1984) — and a `matrix`
is for values you read off, not areas you compare.

## The rules a figure obeys

**One idea, five elements at most.** Working memory holds about four
chunks (Cowan 2001) and comprehension falls off past seven (Miller
1956); the figure competes with your speech for that budget. Each kind
has its own ceiling in the table below, and the checker enforces it.

**Every element is named, and the name sits next to it.** No legends,
no key, no "1, 2, 3" that sends the eye back and forth — a label away
from its element splits attention and costs comprehension (Mayer 2021,
spatial contiguity). An unnamed element is decoration: delete it or
name it.

**At most one element shouts.** A highlight takes the theme's accent at
low alpha; two highlights mean neither reads as *the* point (signaling
principle, Mayer 2021).

**An arrow means cause or sequence.** A line between two things with an
arrowhead on it is read as "this leads to that". Use a bare line for
mere association — that is why a `network` draws its edges without
arrowheads unless the spec asks for one.

**A node label is a name, not a sentence.** Four words or fewer inside
an element; the sentence belongs in the notes.

**The title still does the work.** The headline is the claim; the
figure is the evidence for it. Read the figure alone: if it does not
tell you something the title did not, the slide has two claims and no
evidence.

## The kinds

Ceilings are labelled elements, not counting axis or value labels.

| `kind` | Elements | Ceiling | Notes |
|---|---|---|---|
| `flow` | 2–5 | 5 | One row, left to right. Relations are implied between neighbours. |
| `cycle` | 3–5 | 5 | Around a ring, starting at the top. The ring closes. |
| `scatter` | 2–8 | 8 | `value: [x, y]` positions each point on two axes. `axes` labels them. `display` labels the point. |
| `tree` | 2–7 | 7 | Root first; `parent` names the element a node hangs from. |
| `quadrant` | 4 | 4 | Exactly four, in reading order; inside are text, not boxes. |
| `matrix` | 4–9 | 9 | A grid; `columns` sets its width, `header: true` fills the first row. |
| `stack` | 2–5 | 5 | Layers, top to bottom. No arrows: the stack is the relation. |
| `timeline` | 2–5 | 5 | Events on a line, labelled above and below it in turn. |
| `bars` | 2–6 | 6 | `value` is the share of the tallest bar; `display` is the number printed. The value label sits above the bar with a 14pt gap so it does not touch the bar's top edge. |
| `network` | 3–7 | 7 | Nodes at `at: [x, y]`, joined by `edges`. |

## How to write one

```json
{
  "type": "figure",
  "title": "A request for money takes four steps",
  "figure": {
    "kind": "flow",
    "nodes": ["Write the request", "Hall Council votes", "RHA reviews it", "HFS pays out"]
  },
  "notes": "Walk the four steps once, then ask them to say them back."
}
```

`nodes` takes a string, or an object when the element needs more than a
name:

```json
{ "label": "Programs", "detail": "what you vote on", "highlight": true }
```

- `detail` — a second line inside the element. Eight words at most, and
  only when the element is unreadable without it.
- `highlight` — the theme's accent, at low alpha. One per figure.
- `parent` — `tree` only: the element this one hangs from (an earlier
  element). Default: the first element.
- `value` and `display` — `bars` only, both required. `value` is the
  bar's share of the tallest bar, above 0 and at most 1.
- `at` — `network` only: `[x, y]` between 0 and 1, where you are putting
  the element on the page.

`figure.edges` overrides the implied relations, which is how you label
one (`"because"`, `"only if"`) or join a network:

```json
{
  "kind": "network",
  "nodes": [{ "label": "Web", "at": [0, 0] }, { "label": "Worker", "at": [1, 0] }, { "label": "Queue", "at": [0.5, 1] }],
  "edges": [
    { "from": 0, "to": 2, "arrow": true, "label": "enqueue" },
    { "from": 2, "to": 1, "arrow": true, "label": "dequeue" }
  ]
}
```

A relation also takes `category` — `STRAIGHT` (the default), `BENT`
or `CURVED` — when the form's own line style is wrong for it.

Other fields, all optional: `shape` (`rounded` — the default, `rect`,
`ellipse`) and, for `quadrant`, `axes: { "x": "what it costs >",
"y": "< what it buys" }`. A `quadrant` whose axes are unlabelled is four
boxes with text in them; the checker warns about it.

`bars` with one bar highlighted mutes the others to comparison, which
is what a bar chart with a point in it looks like.

## What the engine draws

- **Colors come from the theme** — the slide's own color scheme, so a
  figure re-themes with the deck. Outlines are the theme's text color at
  half alpha, so they recede; a highlight is the first accent at 0.16
  alpha, so the theme's text still reads on top of it. Nothing here
  hardcodes a palette.
- **Type stays the theme's**, except for annotation: axis, edge and
  value labels are set to 10pt so they sit below the element labels
  instead of competing with them. Element labels keep whatever size the
  theme gives text in a shape.
- **Labels are centered in their element.** Where a label sits inside a
  box is part of the drawing, not the theme's typography.
- **Lines stop short of the elements they touch**, so arrowheads do not
  land on an outline.
- **Lines are positioned, not attached.** The service's connection-site
  order is not specified, so a figure that attached its lines to shapes
  would draw correctly on some themes and wrongly on others. Lines sit
  where the geometry puts them.
- **Elements are not grouped.** Every box and label stays individually
  editable — a group makes one stray click move the whole figure.

## The image exception

Some things are not drawable honestly: a photograph, a scanned form, a
schematic someone else drew. For those, `kind: "image"` places a
picture instead of drawing:

```json
{
  "type": "figure",
  "title": "Maintenance wait times fell by half",
  "figure": {
    "kind": "image",
    "svgFile": "latency.svg",
    "alt": "Median days to close a maintenance request, 2019 to 2024, falling from 12 to 5"
  },
  "notes": "Point at the knee in 2021."
}
```

- `svgFile` (or `pngFile`) is resolved next to the deck file at build
  time. An SVG is rasterized at 1600px wide with `resvg` (or
  `rsvg-convert`), and the picture's proportions travel with it, so the
  engine fits it to the box instead of stretching it.
- `alt` is required. It is what a screen reader reads, and what is left
  if the picture does not load.
- An image figure takes no `nodes`, `edges` or `axes`; the checker
  refuses them rather than let the engine drop them silently.

Install a rasterizer if there is none: `brew install resvg`, or
`apt-get install librsvg2-bin`.

## Seeing it before it is in Slides

```bash
SKILL=~/.agents/skills/slides
node "$SKILL/scripts/preview-figure.mjs"                       # one of every kind
node "$SKILL/scripts/preview-figure.mjs" deck.json --png deck.png
node "$SKILL/scripts/preview-figure.mjs" deck.json --slide 4
```

The geometry is the engine's: the preview runs the real `.gs` against
the mock Slides service and paints what the engine asked for. What it
cannot know is the theme, so pages are drawn with one modern theme's
colors and a 14pt body — enough to judge whether a figure reads. It
also rasterizes `--png` for you when a rasterizer is installed.

Use it before you hand a deck over. Layout mistakes — a label that
overlaps its neighbour, a tree whose lines cross, an element pushed off
the page — are obvious in the preview and invisible in the JSON.

## What the checker refuses

| Rule | Severity | What it catches |
|---|---|---|
| `figure-kind` | error | a kind that does not exist |
| `figure-size` | error | too few or too many labelled elements for the kind |
| `figure-node` | error | an element with no label |
| `figure-edge` | error | a relation that points outside the figure, or joins an element to itself |
| `figure-parent` | error | a tree parent that comes after its child |
| `figure-value`, `figure-display` | error | a bar with no value, or no number printed on it |
| `figure-at` | error | a network element with nowhere to sit |
| `figure-on-slide` | error | a figure on a slide type that never draws it |
| `figure-qr` | error | a figure and a QR code competing for the same space |
| `figure-alt`, `figure-source` | error | an image figure with no alt text, no source, or fields the engine would drop |
| `figure-crowded` | warn | six or more elements, where the ceiling allows it |
| `figure-label`, `figure-detail` | warn | a label that is a sentence, or a second line that should be in the notes |
| `figure-highlight` | warn | more than one highlighted element |
| `figure-axes` | warn | a quadrant with unlabelled axes |
| `figure-relations` | warn | relations drawn between the cells of a form that draws its own |

What a figure puts on screen also spends the slide's word budget: its
element labels, axis labels and numbers count, exactly like bullets.

## Simple conceptual graphics

Some of the clearest slides use nothing more than a shape, an arrow,
and a word. Think of the graphics that appear in keynotes and on social
media — a before/after contrast, a direction of change, a grouping.

The existing figure kinds already cover most of these:

- **Before/after**: a `flow` with two nodes, or a `statement` slide
  with a shape on each side.
- **Direction**: a `flow` with an arrow implies "this leads to that".
  Use `cycle` when the direction is a loop.
- **Grouping**: a `network` with edges drawn between related items,
  no arrowheads (the line means adjacency, not cause).
- **Contrast**: a `twoColumn` slide or a `quadrant` (for two axes).
- **Proportion**: `bars`.

When the idea is truly minimal — one arrow between two words, a
circle around a group — use a `network` with two or three nodes at
chosen `at` coordinates and `edges` with `arrow: true` as needed.
The engine draws the shapes and lines from the theme, so they stay
editable and re-theme with the deck.

Do not add a new figure kind for a one-off layout. Use the primitives
that exist: nodes, edges, coordinates. A simple idea drawn with simple
tools is the whole point.

## Evidence

- **Cowan 2001** — working memory capacity is about four chunks, not
  seven; the ceiling for labelled elements.
- **Miller 1956** — the classical 7 ± 2 bound; comprehension falls off
  past it. The upper ceilings in the table above.
- **Mayer 2021** (multimedia principles) — signaling (highlight what
  matters, sparingly), spatial contiguity (a label belongs beside its
  element, not in a legend), coherence (cut what carries nothing).
- **Sundararajan & Adesope 2020** — seductive details meta-analysis:
  g = −0.33; decorative images are the worst offenders.
- **Cleveland & McGill 1984** — graphical perception: position and
  length on a common scale are read most accurately, angle and area
  least; hence bars for proportions and a matrix for values.
- **Garner & Alley 2011** — assertion headlines with visual evidence
  beat topic-phrase headlines with bullet lists; the title claims, the
  figure shows.
