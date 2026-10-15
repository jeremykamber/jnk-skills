# Critique

Use this checklist on the rendered UI, not the code. Look at the screenshot at desktop and mobile widths, in every theme you ship. Every failing item needs a fix, not a note.

## Checklist

**Hierarchy**
- [ ] One element is clearly primary, and you can name it.
- [ ] Secondary and tertiary elements are visibly quieter, not just smaller.
- [ ] Headings, labels, and metadata do not share one weight and color.
- [ ] Only one action is primary per region.

**Structure and layout**
- [ ] Content aligns to a visible grid: shared left edges, consistent column logic.
- [ ] Content width is constrained; prose is not full-bleed.
- [ ] Not everything is centered. At most one centered moment per screen.
- [ ] Sections are separated by larger space than the gaps inside them.
- [ ] Grouping is shown by proximity first, not by boxes around everything.
- [ ] Metadata facts are separated by slots, components, or lines — never by `·`, `•`, or `|`.

**Spacing and rhythm**
- [ ] Every gap comes from the product's spacing scale.
- [ ] Spacing differs between groups and sections, so the page has rhythm.
- [ ] No element is jammed against an edge or a neighbor.
- [ ] Every summary cluster carries one figure and one context fact, not four fragments sharing a corner.
- [ ] No gap sits below the smallest step of the scale. If one does, the group has too many parts — cut a part instead.
- [ ] Bars and meters have a full step of space from adjacent text, so they read as graphics rather than underlines.

**Components**
- [ ] Every card earns its surface; no grid of identical cards without emphasis.
- [ ] Empty, loading, and error states exist and look designed.
- [ ] Focus rings are visible. Targets meet the minimum size.

**Color and type**
- [ ] One accent. Color means something, not decoration.
- [ ] Body text meets 4.5:1; muted text meets it too.
- [ ] The dark theme meets its own targets, which are higher than the light theme's — not the light theme's ratios re-used.
- [ ] No text tier is lower-contrast in dark mode than in light mode.
- [ ] Every tinted container separates from the surface behind it, and in dark mode elevation is lighter than its parent, never darker.
- [ ] Type uses the scale; no one-off sizes.
- [ ] No gradient, glow, or colored border on every element.

**Generic-AI tells** (any one present means the design is default, fix it)
- [ ] Three equal feature cards: icon, bold title, two lines of text.
- [ ] Purple-to-blue gradient hero with centered headline and two pill buttons.
- [ ] Identical radius, shadow, and border on every surface.
- [ ] Stat row of equal-size numbers with no explanation of which matters.
- [ ] Placeholder-like copy: "Lorem", "Your awesome product", "Transform your workflow".
- [ ] Facts joined by a centred dot: "Maya Okafor · 3 comments · 2 days ago", or a title built the same way from two fragments.
- [ ] A summary corner holding a figure, a meter, and two more facts, spaced with gaps below the smallest step of the scale.

## Fix moves

| Symptom | Fix |
|---|---|
| Nothing stands out | Pick the primary; quiet the others (lighter color, smaller, less space-stuffing) |
| Looks like a list of boxes | Remove surfaces; group with proximity; keep only the one card that is a real unit |
| Looks centered and generic | Left-align the body; keep one centered moment; add asymmetry on a grid |
| Feels cramped | Add space between groups before adding space inside items |
| A corner is cramped | Cut a part from the cluster; return every gap to the scale; give bars their own step of space |
| Facts strung together with dots | Give each fact a slot (a column, an icon, a labelled pair) or delete it |
| Dark mode looks flatter than light | Raise the dark floors per tier, flip inset surfaces to lighter-than-parent, and re-check every container against its parent |
| Feels empty | Check whether the space is grouping anything; add content to the focal region, not the edges |
| Colors fight | Remove accent from secondary elements; keep it on the one action |
| Looks inconsistent | Replace one-off values with tokens; check radius and shadow language |

## Output

When reporting a critique, list each failing checklist item with the screenshot region it applies to, and the fix applied. Mark each item pass or fail after the fix, based on a new render.
