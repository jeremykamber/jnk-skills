---
name: jnk-ui-design
description: Visual and frontend design craft for UI work. Use when building or restyling a page, layout, component, or screen; when the UI looks generic, flat, or AI-default; or when auditing hierarchy, spacing, type, or color. Branches to layout, hierarchy, components, type-color-space, critique, and sources references.
---

# UI design

> Decide what matters most on the screen, then make everything else quieter.

Visual design is the layer that makes a UI look intentional. Most generated UI fails in the same ways: no clear focal point, every element at equal weight, spacing chosen per element instead of from a scale, and a default card-and-gradient look. This skill fixes those. It does not replace product decisions; it runs after the content and the job-to-be-done are known.

## Steps

1. **Name the one thing.** State the screen's primary job and the single element the eye must reach first. If you cannot name it, the design has no hierarchy yet; stop and decide it. Reference: `references/hierarchy.md`.
2. **Set the structure.** Pick the grid, column logic, and content width before placing anything. Place content on the grid, not between elements. Reference: `references/layout.md`.
3. **Build components from anatomy.** For each component, define its parts, every state (default, hover, focus, active, disabled, loading, empty, error), and the one primary action. Reference: `references/components.md`.
4. **Set type, color, and space from tokens.** Every size, gap, and color comes from a scale you defined, never a one-off value. Reference: `references/type-color-space.md`.
5. **Audit before yielding.** Run the checklist in `references/critique.md` against the built output, look at the rendered result in every theme you ship, and fix every failing item. Completion means the checklist passes on the real render, not that the code exists.

## Rules

- One primary emphasis per view. Make secondary and tertiary elements quieter instead of making the primary louder.
- Spacing comes from one scale. Grouping is shown by proximity: items that belong together sit closer than items that do not.
- Choose one accent color, one radius, and one shadow language per product, then reuse them.
- Use real content or realistic placeholder content to judge the layout. Lorem ipsum hides hierarchy problems.
- Check the rendered result at desktop and mobile widths. Judge the screenshot, not the markup.
- **Metadata is laid out, never punctuated.** Each fact gets its own slot, icon, or line. A `·`, `•`, or `|` between fragments is a layout you have not decided, and a tell that the UI was generated.
- **Every theme meets its own contrast targets.** Dark mode is not light mode with swapped hex values, and its floors are higher.
- **A cluster carries one figure and one context fact.** If it seems to need a gap smaller than your spacing scale allows, it has too many parts — cut one.

## Pointers

- Hierarchy, emphasis, focal point: `references/hierarchy.md`
- Grids, balance, rhythm, clusters, metadata rows, closure, container and measure: `references/layout.md`
- Buttons, cards, forms, nav, tables, metadata rows, states, touch targets: `references/components.md`
- Type scale, line height, color roles, contrast, tokens: `references/type-color-space.md`
- Auditing a UI that looks generic or off: `references/critique.md`
- Who the principles come from, and where to read them in full: `references/sources.md`
