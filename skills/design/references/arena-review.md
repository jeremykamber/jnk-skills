# The arena review

Three designs in three markdown files get skimmed, not judged. The decision is spatial — where
the complexity sits, what the blast radius is, which shape you can live with — so the arena ends
with a **visual review artifact** the user opens in a browser: candidates side by side, each shape
drawn, the rubric in one matrix, and every file named in the design one click from the code.

Build it as `review.html` beside the candidates, in `.ai/contexts/<slug>/arena/`. It is throwaway
session state like the candidates: commit it only if it outlives the sitting.

## The document the agent authors

Three things, and nothing else. `assets/review-sdk.html` renders everything — the topbar, tabs,
annotation layer, notes drawer, and export — so the interaction is identical every time and only
the content changes.

```html
<script type="application/json" id="arena-meta">
{"id":"rate-limiter-placement",
 "title":"Where the rate limiter lives",
 "brief":"one line, the problem in the user's words",
 "door":"a migration you cannot roll back",
 "root":"/abs/path/to/repo",
 "editor":{"name":"Neovim","url":"nvim://file/{abs}:{line}"},
 "candidates":[{"key":"A","name":"At the gateway","summary":"one line"}],
 "recommend":{"base":"B","grafts":["A: the error model","C: the config surface"]}}
</script>

<section data-panel="A"> … candidate A … </section>
<section data-view="compare"> … the rubric matrix … </section>
```

Copy the SDK block **verbatim** — do not restyle it, do not trim it. A review whose controls move
between arenas costs the user more than the markdown it replaced.

## What each panel contains

The candidate package, in its order, so the reader's eye lands in the same place three times: the
one-line summary, the **shape diagram**, caller usage, contracts, flow, failure paths, what this
candidate rejected, the assumption most likely wrong, and cost / blast radius. Mark each review
unit with `data-block` — the contract, the failure path, the cost row — because that is the
granularity a note attaches to.

## The shape diagram

One inline SVG per candidate, and **the same vocabulary in all three** so they can be read against
each other. Put the legend once, in the compare panel.

- solid rounded box — a module you own
- heavy bottom edge — the seam that carries the hard part
- arrow — a dependency, pointing the way the call goes
- cylinder — state you did not write (a queue, a cache, a table)
- dashed box — an external system
- accent fill — where the complexity lives in this shape

The diagram earns its place when the difference between candidates is visible at a glance. When it
is not, the candidates are not structurally distinct — that is a finding, not a drawing problem.

## The compare panel

The rubric as a matrix: one row per lens (deep module, inversion, smallest coherent change, wrong
abstraction, the next engineer, blast radius, cost), one column per candidate, the judge's scores,
and the winning cell marked. Keep each score cell to a mark and a few words — the argument belongs
in the candidate's panel, and a cell that needs a paragraph makes the matrix unreadable. Below it,
the recommendation: the base, what was grafted from each rejected candidate, and the assumption
most likely to be wrong. This is the panel the user reads if they read one thing.

## Code links

Anywhere the design names a file, use the chip instead of plain text:

```html
<code data-code="src/api/limits.py:42"></code>
```

The chip shows the repo-relative path and copies the absolute one on click. Where it *opens* is
the reader's editor, declared once in `meta.editor.url` — a template with `{abs}`, `{rel}` and
`{line}`:

| Editor | `editor.url` |
|---|---|
| Neovim (terminal, with a `nvim://` handler) | `nvim://file/{abs}:{line}` |
| MacVim | `mvim://open?url=file://{abs}&line={line}` |
| VS Code | `vscode://file/{abs}:{line}` |
| JetBrains | `idea://open?file={abs}&line={line}` |

Neovim has no scheme of its own; `nvim://` comes from a third-party handler (on macOS,
`kelvinst/nvim_url`, which needs kitty and an `--listen` socket), and MacVim's `mvim://` is
official. Either way it is one line to declare, and it is the difference between a chip that opens
your file and a chip that opens someone else's editor.

**With no `editor` declared the chip is copy-only** — no dead link to an editor the reader may not
have. Record the editor once in the project's `AGENTS.md` (`Editor: Neovim — nvim://file/{abs}:{line}`)
so every arena in that project carries it, rather than asking again each time.

That is the "pop into the code when needed" half of the review: the shape is visual, the evidence
one click away.

## The feedback loop

Standalone, with no dependency: press `a` (or **Annotate**), click any block, write the note, and
**Copy feedback** puts a structured prompt on the clipboard to paste back into the session. `1`–`9`
switch candidates, `n` opens the notes, `⌘/Ctrl+Enter` saves a note. Notes survive a reload, and
**Clear all** wipes them.

If Lavish is available, it is the richer loop — element pinpointing and a poll the agent can wait
on — and the artifact is unchanged because the SDK injects nothing:

```sh
npx -y lavish-axi .ai/contexts/<slug>/arena/review.html   # open, annotate
npx -y lavish-axi poll .ai/contexts/<slug>/arena/review.html   # agent collects the notes
```

Then apply the notes. Re-run the arena only if a note changed the brief — a note that asks for a
different shape is a new round, not an edit.

## Do not

- Hardcode an editor in the chips. `meta.editor.url` is the reader's, and absent it the chip copies.
- Restyle or trim the SDK. Its buttons are the contract with the user's hands.
- Let it reach the network, or link an external stylesheet, font, or script. One file, `file://`, offline.
- Draw a third diagram in a third visual language. The vocabulary is shared or the comparison is lost.
- Put the review where the committed record belongs. The ADR is the record; this is the working surface.
- Build it for a decision with one option. A single panel is not a comparison.
