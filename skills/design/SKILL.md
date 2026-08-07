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

3. **Design the failure paths.** What happens when the provider is down, the token is bad, the callback is slow? Empty states, errors, limits. Define errors out of existence where you can. If it is not in the diagram, it is not designed.

4. **Place the complexity.** Where does the hard part live? Prefer deep modules — a small interface, rich behavior, complexity hidden inside.

5. **The map is not the territory.** The diagram is a map; the real system will surprise you. Expect it. That is the map's job — to be improved, not to be perfect.

6. **If ASCII is not enough — the simulator.** Build a throwaway prototype in `.ai/contexts/<dir>/designs/` (plain HTML/CSS or a minimal script — a spike). Open it, look, discuss, iterate. Contract: throwaway by definition — never promoted, never merged. The notebook is gitignored, so this holds by default.

7. **Gate.** Present the shape and the failure paths. Ask: "Approve this shape?" Do not plan until the user says so.

8. **Save the shape.** Write the agreed diagram to `designs/<name>.md` and the prototype alongside it. A future session should be able to see what the shape was.

## Output

Agreed shape (diagram or prototype) / Design-level decisions / Failure paths designed

## Handoff

If the shape holds, recommend /skill:jnk-5-plan. Do not start it: planning is plan's beat, and it begins when the user invokes it.

## Do not

- Write production code, or design the whole feature in detail (shape and failure paths only).
- Skip failure paths.
- Treat the diagram as a commitment.
