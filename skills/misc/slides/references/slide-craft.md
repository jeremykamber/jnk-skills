# Slide craft

The rules every deck obeys, in either mode. They are short because the
research behind them is narrow: what costs working memory, what makes a
headline carry meaning, and where the detail belongs.

Read this before authoring. The mode reference says *what to put in the
deck*; this says *how a slide is built*.

**Reasoning vocabulary**: *assertion headline, one idea, the cue, the
delivery, budget, coherence, redundancy, signaling, lapse, peak,
payoff.*

## The assertion headline

Every content slide's title is a full-sentence claim or a question —
never a topic label.

| Label | Assertion |
|---|---|
| "Costs" | "Fixed costs stay flat even when volume doubles" |
| "Tailgating" | "One person can let the whole floor in" |
| "Results" | "Faster checks cut failed payments by a third" |

A label makes the audience do the organizing work you should have done;
a claim tells them what to do with the slide. Two-thirds of
engineering and science slides use topic-phrase headlines with bullet
lists, and switching to assertion headlines measurably improved
comprehension and recall of complex material (Garner & Alley 2011).

The headline test: read only the titles, in order. That sequence should
be the argument. If it reads as a table of contents instead, the deck
is labels, not claims.

## One idea, and only what carries it

Each slide makes exactly one point. A second idea does not share the
slide — it becomes the next slide, or it gets cut.

Decorative detail is not neutral: it depresses learning (g = −0.33
across 68 effects; decorative photos hurt more than decorative text,
and text-plus-image pairs hurt most at g = −0.87 — Sundararajan &
Adesope 2020). The mechanism is attention and coherence, not taste.
Anything on a slide that is interesting but not load-bearing is a
seductive detail. Same test for images: if it does not explain the
claim, it is decoration.

## The slide is the cue; the notes carry the delivery

Put the short cue on the slide and the sentences in the notes.

Showing on-screen text identical to what you say *reduces* learning
versus narration over graphics (redundancy principle — Mayer 2021). A
slide that repeats your talk track costs the room attention twice.
Notes are where the explanation, the example, the caveat, the numbers
and the answer live; for a deck read without you, they are the deck.

The check: if the notes could be read aloud as the slide's text, the
slide is a transcript. Cut it back to cues.

## Budget

Working memory holds about four chunks (Cowan 2001), and a slide
competes with your voice for them.

- ≤ 5 bullets (Inform: ≤ 6), and prefer 3–4
- ≤ 14 words per bullet (Inform: ≤ 16); a bullet is a cue, not a sentence
- ≤ ~40 words on the slide, and that is already a lot
- a headline is one line: ≤ ~48 characters, and never past 64 (see
  below)
- one channel per idea: if the slide carries a sequence, do not also
  make them compare two columns

When a slide is over budget, the fix is never a smaller font. It is
another slide, or a cut.

### Why a headline cannot be long

The title box will not shrink to fit it. Writing text into a
placeholder deactivates that shape's autofit — Slides does this on any
request that can affect text fitting — and neither Apps Script's
`Autofit` class nor the Slides REST API accepts `TEXT_AUTOFIT` on a
write; only `NONE` and `AUTOFIT_TYPE_UNSPECIFIED` are writable. So
whatever "shrink text on overflow" the theme sets on its title is gone
the moment the engine writes the text, and the box never shrinks.

A headline longer than the box therefore draws *outside* it, over the
body and off the slide. There is no engine-side fix — the length
ceiling is the fix, and [check-deck.mjs](../scripts/check-deck.mjs)
enforces it. Both thresholds are tuned to a title box holding one line
of display type; retune them, here and in the checker together, against
the theme actually in use.

## Coherence, signaling, contiguity

- **Coherence**: nothing on the slide that is not doing work. No
  decorative frames, no "any questions?" placeholder slide, no clip art.
- **Signaling**: the title states the takeaway; the first bullet is the
  first thing in the logic; emphasis marks the one number that matters.
  Emphasis is `**…**` around a span in any title or bullet, and it is
  the single `highlight` on a figure element. Both are scarce: past two
  or three on a slide nothing reads as *the* point any more, and the
  checker says so.
- **Contiguity**: a heading sits with the content it heads (the engine
  writes a column heading into that column, never into a shared list).
- **Segmenting**: long content becomes more slides, not denser slides.
  A concept defined before it is used is cheaper than one defined
  mid-argument (pre-training — Mayer 2021).

## Attention, and where the payoff goes

Attention in a room is not a tank that empties. It lapses in short
cycles, and the cycles get shorter as a session runs on; a question, a
demonstration or a change of mode cuts the lapse, and the cut holds for
the stretch that follows (Bunce et al. 2010). So no more than about six
content slides without something the room does. The "10-minute attention
span" is a folk figure, not a biological limit (Bradbury 2016) — the
cadence, not the number, is what matters.

What they keep afterwards is not the average of the slides. For short,
simple experiences memory is dominated by the peak and the end; a deck
is neither simple nor short. In a heterogeneous experience the **peak**
predicts what is remembered and the end does not, and a week later the
**average** predicts it (Strijbosch et al. 2019). Two consequences:

- **Put the payoff at the peak.** One slide carries the thing you want
  remembered, and it is not slide two of fifteen.
- **The middle has to hold on its own.** A clever closing line cannot
  rescue a filler middle, because a week later the middle is most of
  what they have left.

Never spend the last slide on logistics, thanks, or "any questions?" —
it is the one position where nothing can be repaired.

## Language

Concrete over abstract, numbers over adjectives, active over passive.
Name the thing the audience will see ("the red error banner", not "the
failure mode"). Reuse the audience's own vocabulary — jargon you
introduce costs working memory that the idea needs.

Second person, conversational ("you will see…") outperforms formal
register (personalization principle — Mayer 2021).

## No learning styles

Do not classify content as visual, auditory or kinesthetic, and do not
design for "visual learners" — the meshing hypothesis has no credible
support (Pashler et al. 2008). Choose the representation the *content*
calls for: a process becomes a sequence, a comparison becomes two
columns, a claim becomes a statement slide. That choice helps everyone.

## What the engine draws, and what it cannot

Text goes into the placeholders the theme provides, and the theme keeps
its own positions and sizes. The one exception is a `figure` slide: the
engine draws those from the deck's own shapes and theme colors, inside
the box the layout gives it. Figures are still one idea, five labelled
elements at most, and every element named — [figures.md](figures.md).

Everything else a visual would need is stated in the notes (`VISUAL:
the screenshot of the error banner under the red button`); the theme's
picture or object placeholder is already on the slide for it.

Choose the representation the content calls for: a sequence becomes a
`flow`, a comparison becomes two columns or a `quadrant`, a proportion
becomes `bars`, a claim becomes a statement slide. That is the content
choosing, not the learner — there are no visual learners (Pashler et
al. 2008, above).

## Evidence

One-line findings behind the rules above. Read the paper before you
bend a rule.

- **Garner & Alley 2011** — assertion-evidence headlines with visual
  evidence beat topic-phrase headlines with bullet lists for
  comprehension and recall of complex concepts.
- **Sundararajan & Adesope 2020** — seductive details meta-analysis,
  58 papers / 68 effects: g = −0.33 overall; static details g = −0.43;
  decorative photos g = −0.48; text+image g = −0.87.
- **Mayer 2021** (multimedia principles) — coherence (cut extraneous
  material), redundancy (do not duplicate spoken words on screen),
  signaling, spatial/temporal contiguity, segmenting, pre-training,
  personalization each improve learning; the multimedia principle
  (words + graphics) beats words alone.
- **Cowan 2001** — working memory capacity is ~4 chunks, not 7.
- **Pashler et al. 2008** — no evidence for the learning-styles meshing
  hypothesis; the styles literature does not support tailoring.
- **Ausubel 1960** — advance organizers help when they give the
 structure of what follows; a topic-list agenda does not.
- **Bunce et al. 2010** — self-reported attention decline in chemistry
 lectures: lapses are frequent and short, the cycles shorten as the
 lecture runs, and inserting clicker questions or demonstrations
 lowered reported decline *and* during the stretch that followed.
- **Bradbury 2016** — the "10-minute attention span" is misapplied
 folklore; lapses are real, frequent and brief, and are cut by
 engagement, not by segmenting the clock.
- **Strijbosch et al. 2019** — a 14-minute heterogeneous experience
 (VR film): peak valence predicted remembered valence immediately
 (R² = .42), the end did not, and a week later average valence
 predicted it best (R² = .46). Peak beats end once an experience is
 complex; the middle is not erased by a good close.
- **Ghibellini & Meier 2025** — meta-analysis of the interruption
 paradigm: *no* memory advantage for unfinished tasks (the classical
 Zeigarnik effect pools to zero) but a reliable pull to resume them
 (Ovsiankina). An open loop buys the next slide — it does not make
 anything stick, and a loop you never close buys nothing.

Mode rules (cited in [teach-mode.md](teach-mode.md) and
[inform-mode.md](inform-mode.md)):

- **Schroeder & Kucera 2022** — refutation text (state the
 misconception, refute it, give the correct explanation) beats the
 same content stated plainly: g = 0.41 across 44 comparisons
 (n = 3,869); a pre-registered meta-analysis of 294 effects from 76
 studies confirms the advantage (Danielson et al. 2025).
- **Butterfield & Metcalfe 2001** — errors made with high confidence
 are corrected *more* than low-confidence errors once feedback
 arrives; the mechanism is attention to the surprising feedback
 (Fazio & Marsh 2009). Hence: make them commit, then reveal.
