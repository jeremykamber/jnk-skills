# Source integrity

A deck is read as fact. Every claim that is not the author's own
judgement carries a source on the slide, and every source on a slide is
one you have verified. This reference is the rule set for that, and it
is short on purpose.

**Reasoning vocabulary**: *claim, citation, traceability, load-bearing,
primary source, evidence grade.*

## The rule

**A claim on a slide is either yours or it is cited — never ambiguous.**
The engine gives you two fields:

```json
{ "type": "body", "title": "...", "bullets": ["..."],
  "cite": "HFS Handbook 2026",
  "citeUrl": "https://hfs.example.edu/handbook" }
```

`cite` prints on the slide in small type; `citeUrl` goes into the notes
so the link is there for whoever checks. Deck-wide sources go in
`meta.sources` (and, with `meta.source`, print in the first-run log),
so a reader can see the whole evidence base without clicking through
every slide.

## What must be cited

- **Numbers.** Any figure, date, threshold or rate.
- **Attributed positions.** "The department's position is…", "the
  contract says…".
- **Anything a listener might doubt.** That is the real test: if you
  would be asked "where does that come from?" in the room, it needs a
  source on the slide.
- **Anything you looked up rather than knew** — including your own
  earlier decks if the claim came from there.

**Not required:** your own judgement, obvious domain commonplaces
("quiet hours exist to protect sleep"), or the thing the whole deck is
about. Over-citing hides the load-bearing citations in noise.

## Verify before you ship

1. **Open the URL.** A citation you have not loaded is a citation you
   cannot vouch for. If it 404s, fix it or drop the claim.
2. **Match the claim to what the source actually says**, including its
   scope. A study on undergraduates is not evidence about staff; a
   2021 handbook is not the 2026 rule.
3. **Prefer the primary source** — the handbook, the contract, the
   paper — over a summary of it. If you only have the summary, cite the
   summary and say so.
4. **Do not invent anything.** No plausible-looking page numbers, no
   reconstructed titles, no author you half-remember. If you cannot
   verify it, either drop the claim or write it as your own judgement
   with no citation attached.
5. **Say what kind of evidence it is** when it matters: measured
   (with effect size), practitioner consensus, or your call. "g = 0.42
   across 59 studies" and "this is the accepted practice" are different
   claims, and the deck should not let them look alike.

## The failure modes to check for

- **The orphan citation** — a source in `meta.sources` that no slide
  uses, or a slide citing something not in the list.
- **The decoration citation** — a real source attached to a claim it
  does not support. Worse than no citation, because it borrows
  authority.
- **The folklore number** — a memorable statistic whose original study
  does not say that. When a number is this convenient, read the paper.
- **The stale fact** — policies, prices, dates and names change; the
  deck inherits the freshness of the citation. Note the date on any
  time-sensitive claim ("as of the 2026 handbook").
- **The uncited internal claim** — "as we agreed", "the platform does
  X". Internal claims rot fastest and are the least likely to be
  checked.

## In the notes, not on the slide

The slide carries the claim and the source's short name. Everything
else — the link, the caveat, the boundary condition, the number's
provenance — goes in `notes`, where the presenter reads it and the
audience does not have to. This keeps the slide readable (one claim, one
citation) and the delivery honest (the presenter knows the limits of
what they just said).
