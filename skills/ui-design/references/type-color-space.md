# Type, color, and space

These three are tokens. Define each as a small named scale, then use only the scale. A value that appears once in the code is a smell.

## Type

- **Pick one family for UI, one for display if needed, and stop.** Two families is usually enough. Choose for the personality the product needs, then check it at small sizes.
- **Scale.** Define 5–7 steps, e.g. 12, 14, 16, 20, 24, 32, 40, 56. Each step ratio is about 1.2–1.333 (modular). A Fibonacci-like sequence (13, 21, 34, 55) also works. Pick one approach.
- **Body size** is 16px on the web unless there is a reason otherwise. Smaller body text hurts readability.
- **Line height.** Body 1.5–1.6. Headings 1.1–1.25. Tighter line height for bigger type.
- **Measure.** 45–75 characters per line (see `layout.md`).
- **Weight contrast** builds hierarchy cheaply. Pair a heavy heading with a regular body. Avoid many weights.
- **Tracking.** Slightly tighten large headings. Slightly open all-caps labels.
- **Numbers.** Use tabular numerals in tables and any column of figures.

## Color

Build color in roles, not in hues.

- **Neutrals.** Build a gray scale of 9–11 steps. Most of the UI uses neutrals: backgrounds, surfaces, borders, text tiers.
- **One accent.** Pick one brand hue for the primary action and the active state. Use its tints for hover and subtle backgrounds.
- **Semantic colors.** Success, warning, error, info. Use them only for their meaning. Do not decorate with them.
- **Roles, not hex codes.** Name tokens by role: `text-primary`, `text-muted`, `surface`, `surface-raised`, `border`, `accent`, `accent-hover`, `danger`. Components reference roles only.
- **Proportion.** A common rough guide is 60% neutral, 30% secondary surface, 10% accent. Treat it as a check on how much color is competing for attention, not a rule.
- **Gradients and glows.** Use only when they carry meaning or mark a hero. A gradient on every card is a default-AI tell.

## Contrast

- Body text: at least 4.5:1 against its background (WCAG AA). Large text (≥24px, or ≥18.66px bold): 3:1.
- UI components and focus indicators: 3:1 against adjacent colors (WCAG 1.4.11).
- Check every token pair, including muted text on surfaces. Muted text is the most common failure.
- **Target higher in dark mode.** Light text on a dark ground halates: strokes bloom and the eye reads the gap between glyph and background as smaller than it measures. A dark theme that reproduces its light twin's ratios still reads weaker, and the tiers that lose most are the quiet ones — secondary text, metadata, counts. Set the floor per theme, not once:

  | Tier | Light | Dark |
  |---|---|---|
  | Primary and body text | 4.5:1 | 7:1 |
  | Secondary text, labels, table headers | 4.5:1 | 6:1 |
  | Muted text: timestamps, counts, ids | 4.5:1 | 5.5:1 |
  | Control boundary, focus ring, icons | 3:1 | 3:1 |

  These are floors, not ambitions. A tier that passes in light and fails in dark is a bug in the theme, not a preference of it.
- **De-emphasise with size, weight, and position, not with a lower ratio.** Quiet tiers are exactly the ones that get shaved during conversion, which is how a dark theme ends up flatter than its light original.
- Never rely on color alone to convey state. Pair it with an icon, text, or shape.

## Dark mode

- Do not invert. Re-pick the neutral scale, lower contrast of large areas, and desaturate the accent slightly.
- Shadows lose effect on dark surfaces; use lighter surfaces for elevation instead.
- **Elevation goes up, not down.** In light mode a container that sits *inside* something — a comment bubble, a code block, a table header, a well — is usually a step darker than its parent. Re-picking the neutral scale as a straight mirror keeps that direction, and on a dark ground a darker panel reads as a hole: the text inside it loses apparent contrast and the group stops reading as a group. Map every "a step darker than the page" surface to "a step lighter than its container".
- **Check each container against its parent, not only its text against its container.** A bubble a few percent off the surface behind it disappears as a unit even when its text passes. A container that holds content needs enough separation to read as one region; lightness is the primary tool in dark mode and a border is the fallback.
- **Re-run the whole contrast table after converting.** Mirroring tokens is where dark mode is usually lost: the ramp was tuned against white, then flipped and never measured again.

## Space

- One scale for the product. A 4px base with steps such as 4, 8, 12, 16, 24, 32, 48, 64 works for most UI. A Fibonacci-like set (3, 5, 8, 13, 21, 34) also works if the team chooses it.
- Map spacing to roles: `space-inline-xs` for icon gaps, `space-stack-md` between related blocks, `space-section` between sections. Roles stop random values.
- Padding and gap inside a component come from the component's scale step, not the page's.
- Radius: one or two values. Match the radius to the scale: inner radius = outer radius minus padding.
- Shadow and border: pick one elevation language (e.g. border-only, or one soft shadow for raised surfaces) and use it everywhere.
