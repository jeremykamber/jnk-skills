---
name: jnk-4-design
description: Design the shape and experience of a change before planning it. User-invoked only via /skill:jnk-4-design. ASCII diagrams first, throwaway prototypes when needed, failure paths designed up front.
disable-model-invocation: true
---

# Design

> The simulator. In the simulator, crashing is free.

## Purpose

Shape the change before planning it. Decide = what. Design = how it feels and how it hangs together. Still zero production code.

## Steps

1. **Experience first.** How does the change feel to the person using it? How does it sit in the existing flow or screen? Design is how it works, not just how it looks.

2. **ASCII before code.** Draw the flow (backend) or the layout (frontend) in ASCII. Least ink, most ideas — the fewest lines that say the most. Iterate in conversation: "move GitHub lower" is a normal edit here.

3. **Design the failure paths.** What happens when the provider is down, the token is bad, the callback is slow? Empty states, errors, limits. Define errors out of existence where you can. Name the failures you'd actually worry about — not invented ones chosen because they're survivable. If it is not in the diagram, it is not designed.

4. **Place the complexity.** Where does the hard part live? Prefer deep modules — a small interface, rich behavior, complexity hidden inside.

5. **Design the contracts.** For each component in the shape, define its seam in a compact markdown block — what goes in, what comes out, and the step-by-step of what happens in between:

   ```markdown
   ### generateStrategyPersonas(config)

   **In:** `personaDescription: string` · `count: number` · `mode: 'strategy'`
   **Out:** `Persona[]` — psychographics filled (values/fears/interests ≥ 2 items)
   **Steps:**
   1. Dispatch by mode to the adapter
   2. Batched profile call (no backstory)
   3. Per-persona parallel backstory calls (retry ×2, fail loudly)
   4. PB&J rationalization, then validate and return
   ```

   Iterate in conversation — "drop `count`, derive it from the prompt" is a normal edit here, same as the ASCII. A contract is the small interface of a deep module: the complexity hides behind it. If a contract can't be stated simply, the module boundary is wrong — redraw it.

6. **The map is not the territory.** The diagram is a map; the real system will surprise you. Expect it. That is the map's job — to be improved, not to be perfect.

7. **If ASCII is not enough — the simulator.** Build a throwaway prototype in `.ai/contexts/<dir>/designs/` (plain HTML/CSS or a minimal script — a spike). Open it, look, discuss, iterate. Promise: throwaway by definition — never promoted, never merged. The notebook is gitignored, so this holds by default.

8. **Gate.** Present the shape, the contracts, and the failure paths. Ask: "Approve this shape?" Do not plan until the user says so.

9. **Save the shape.** Write the agreed diagram and contracts to `designs/<name>.md`, and the prototype alongside it. A future session should be able to see what the shape and the seams were.

## Output

Agreed shape (diagram, contracts, or prototype) / Design-level decisions / Contracts per component / Failure paths designed

## Handoff

If the shape holds, recommend /skill:jnk-5-plan. Do not start it: planning is plan's beat, and it begins when the user invokes it.

## Do not

- Write production code, or design the whole feature in detail (shape and failure paths only).
- Skip failure paths.
- Skip the contracts — the seams are the design.
- Treat the diagram as a commitment.
