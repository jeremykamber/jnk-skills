---
name: jnk-2-design
description: "Choose a direction and design the shape and route of a change before building it. User-invoked only via /skill:jnk-2-design. Decides with lenses, writes ADR, then shapes — ASCII, HTML mockups (user-facing), contracts, call stack, test shapes, failure paths — then the route: vertical slices, each with its own checkpoint and review intensity. Zero production code."
disable-model-invocation: true
---

# Design

> Choose the direction, then shape it where change is cheap; slice it before anyone builds.

## Purpose

Choose a direction deliberately (decide's work), then shape the change and route it (design's work) — still zero production code. Decide = what and why. Design = how it feels, how it hangs together, and in what order it gets built. This is the cheapest place to change everything: a diagram and a route cost nothing to redraw; code costs. When the shape is already obvious, start at Phase 2 — the route still earns its gate.

## How far to plan

**Plan to the first gate.** Design as far as the next thing that can prove you wrong — no further. That used to mean "everything", because only a human could falsify a plan, so the plan had to be right before anyone built. Gates move that point: the first slice's checkpoint is now the first real falsification, and it is one command away.

So the default is: settle the decision, design the shape of **slice 1** and the seams it exposes, sketch the rest, then build slice 1. The code and the gates tell you whether the rest of the plan was right, and you re-design holding real information instead of a guess. A route that is right for slice 1 and wrong for slice 4 has done its job — you found out at slice 1, for the price of one slice.

This is AGENTS.md principle 5 applied to the plan itself: a thin vertical slice through the full stack answers real questions faster than a detailed spec. It is why this beat is short on ceremony and long on the first slice, and why "we designed the whole thing up front" is a cost to justify, not a virtue to claim.

Go further up front only when falsifying is expensive: a migration you cannot roll back, an interface someone else is already coding against, a boundary you cannot move afterwards. Then design it fully — and say which of those it is, out loud.

## Lenses

Apply these to every option; name the lens you are using. **Every lens must speak to every option** — no silent carry. If a lens finds an option unremarkable, say so in one line; silence reads as agreement.

- **Simple vs easy** (Hickey). Simple means unbraided — one notion. Easy means familiar. Call it out when "simpler" actually means "more familiar."
- **Wrong abstraction** (Metz). Duplication is far cheaper than the wrong abstraction. Abstract at the third occurrence (Rule of Three), not the first.
- **Smallest coherent change.** The least complex option that fully solves the problem. Start simple and let complexity be earned.
- **The next engineer.** Which option will the next person to touch this find obvious? Write for readers, not authors.
- **Inversion** (fear the failure). For every option, write the concrete failure you'd actually lose sleep over — not a token risk but the scenario that would make you revert at 2am. Which option fails in a way you can survive, and which fails in a way you can't? Strong preference for the option whose failure mode is boring. A failure you can reason about is cheaper than a failure you can't predict.
- **Deep module** (Ousterhout). Which option offers the richest behavior behind the simplest interface? Flag options that push complexity into callers or leak implementation details across seams. A deep module hides complexity; a shallow one distributes it.
- **No futures yet.** Do not optimize for requirements that have not arrived.

## Phase 0 — The decision

1. **The product line.** Who is this for? What user problem does it solve? How would we pitch it to a user in one sentence? (The blog-post test: if we can't say why it matters to someone, the change isn't ready to decide on.) Then **define success together:** What behavior changes? What must not change? What does "done" mean? How will we verify? (Tests represent intent — not "the code runs".) When a measurable outcome exists — latency, cost per call, quality score, conversion — name it: `Measured by: <metric + target>`. Tests verify the code; the metric verifies the change. No metric? Say "no measurable outcome yet" and move on — don't invent one.

2. **Generate options.** Meaningful alternatives only — the ones worth debating, and each one you could genuinely see implementing. For each: approach, pros, cons, cost. No filler options, no strawmen — if an option can't win on its merits, it isn't an option. **If explore already surfaced directions, those are the option list** — carry them forward and sharpen them into approach/pros/cons/cost. Do not re-present what explore already put in front of the user: that is the same conversation twice, and it is the ceremony this beat exists to avoid. Generate options here only when explore did not.

3. **Debate with the lenses.** Challenge your own and the user's assumptions. Seek the strongest reasoning, not agreement. Where lenses point in different directions, say so. **Do not let every lens converge on one option** — if they do, you are probably pattern-matching instead of reasoning. Each lens should find something real to say about each option; when a lens has nothing to say, that is a sign the lens is being lazy, not that the option is perfect. The value of the debate is the friction, not the consensus.

4. **Make the call — the user's, not yours.** Present every option with the trade-offs the lenses surfaced, then stop. Ask: "Which option would you defend, and what's your strongest reason?" — and wait for the answer before stating any recommendation. A lean from an earlier beat (explore's "which direction do you find yourself defending?") is evidence, not a decision — but if the user already made the call there, confirm it in one line and move on rather than asking again. Re-asking a question they have answered is the ceremony this beat is trying to avoid. Only after the user answers do you recommend: name your pick, your strongest reason, and where you differ from theirs. The user owns the decision. If a meaningful option cannot be chosen because an underlying decision remains unresolved, that is a decision tree worth walking — invoke /skill:jnk-grill rather than guessing. If important uncertainty remains, return …

5. **Write the decision record.** Load `references/decision-record.md`: chosen approach, reason, runner-up, failure mode to watch, measured-by, verification strategy. Where: `docs/adr/<thread-name>.md` — one file per decision, committed with the code. Create the dir when missing: every project, even a small one, gets an ADR home — decisions are project truth, not session state, and the model finds them at a stable path in every feature. About ten lines. **Write it now**, not at debrief.

6. **Name the thread.** A short name from the decision — `oauth-c-github-module`. It threads through the branch, the route, and the session log. One name, one story.

## Phase 1 — The shape

1. **Experience first.** How does the change feel to the person using it? How does it sit in the existing flow or screen? Design is how it works, not just how it looks.

2. **ASCII before code.** Draw the flow (backend) or the layout (frontend) in ASCII. Least ink, most ideas — the fewest lines that say the most. Iterate in conversation: "move GitHub lower" is a normal edit here.

3. **The HTML mockup (user-facing changes).** When a user will see it, iterate on a plain HTML mockup in `docs/designs/<feature>/` — layout, copy, and the states (empty, error, loading). It is the product spec, made concrete: the cheapest spec you can write (a few hundred tokens), and it turns the product line into pixels. Open it, look, discuss, edit — "make the button primary", "move the cancel link" are normal edits. Iterate a few rounds, then stop; the final mockup is committed with the design — it is the spec, not a throwaway. Backend-only changes skip this step.

4. **Design the failure paths.** What happens when the provider is down, the token is bad, the callback is slow? Empty states, errors, limits. Define errors out of existence where you can. Name the failures you'd actually worry about — not invented ones chosen because they're survivable. If it is not in the diagram, it is not designed.

5. **Place the complexity.** Where does the hard part live? Prefer deep modules — a small interface, rich behavior, complexity hidden inside.

6. **Design the contracts — the program design.** For each component in the shape, define its seam in a compact markdown block — what goes in, what comes out, and the step-by-step of what happens in between:

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

   Then the shape of the build, in the same compact style — iterate on it directly with the user; the interface shape is the deliverable, not a byproduct, and the route is built from it:
   - **File placement** — where each piece lives, and why there. "Why did you put that over there?" is a design question; answer it before anyone builds.
   - **The call stack** — who calls whom, in what order, top to bottom.
   - **Test shapes** — what the tests will assert, named by scenario (not written yet — just the list of assertions).

   "Drop `count`, derive it from the prompt" is a normal edit here, same as the ASCII. A contract is the small interface of a deep module: the complexity hides behind it. If a contract can't be stated simply, the module boundary is wrong — redraw it. Where a contract, a failure path, or a placement hides an unresolved decision — who owns retry, what happens on partial failure, where the boundary lives — invoke /skill:jnk-grill; never silently choose on the user's behalf.

7. **If a contract or the architecture hides an unknown — spike it.** Build a throwaway prototype in `.ai/contexts/<dir>/designs/` (a minimal script or one risky page). Open it, look, discuss, iterate. Promise: throwaway by definition — never promoted, never merged. The notebook is gitignored, so this holds by default.

8. **Context-light.** The design beat works from the model, the interfaces, and the route's inputs — not the implementation. Need a file? Name it and ask before reading. Program design is only cheap because it is context-light; the decisions deserve the model at its sharpest.

9. **Gate — the shape.** Present the shape, the contracts, the call stack, the test shapes, and the failure paths. Ask the user: "Which failure path do you expect to actually bite?" — then "Approve this shape?" Do not route until the shape holds.

## Phase 2 — The route (vertical slices)

The shape is agreed; now the build order. Slice the work by what the user can see and touch — never by layer. No "all the backend, then all the UI." Each slice is a thin end-to-end story (UI → logic → persistence where relevant) that leaves the system working.

1. **Confirm the decision.** If no decision record exists (check `docs/adr/`), write the decision first: one line each for chosen approach, why, the failure mode to watch, and measured-by — and name the thread. The route needs a record to confirm, and the thread name carries through the branch, the route, and the log. If routing reveals the decision was wrong, stop and return to the decision phase. Do not paper over it.

2. **List the slices.** Each slice names:
   - What changes (files and areas)
   - Its checkpoint — the gate that will prove it: a named gate from `gates.json`, plus anything a gate cannot hold (an LLM-as-judge pass, rubric-scored, or a manual path). A checkpoint that cannot fail is not a checkpoint.
   - What it leaves working
   - Whether it earns an **adversarial review** before its gate, and why. Slices with subtle logic, state, concurrency, LLM-dependent output, parsing, or integration seams get one; mechanical slices don't. Spend the review budget where the risk is.
   - **Dependencies** — which slices must complete before this one can start
   - **Parallelizable** — can this run in parallel with other slices?

3. **Order them.** Walking skeleton first — the thinnest end-to-end slice working before it has muscles. Tracer bullet: fire through the riskiest unknown early; order slices so the parts we understand least come first. Dependencies second. No slices for speculative features.

4. **Name the blast radius.** State what we expect NOT to touch, so the boundary is visible.

5. **Gate — the route.** Present the route. Ask the user: "Which slice scares you?" — then "Approve the route and the order?" **Reset is free at this seam:** the route file is on disk — the alignment, serialized. Long session? End here and resume fresh with /skill:jnk-pickup; don't push on.

6. **Save.** The mockup and the shape (contracts, call stack, test shapes, failure paths) → `docs/designs/<feature>/` when they earn keeping — substantial, likely amended, or may outlive this sitting — committed: they are the design record, the deterministic context for the implementation sessions and for any future feature touching the area. A design doc is project truth, not session state. Spikes stay throwaway in the notebook's `designs/`. The route → `.ai/contexts/<feature>/route.md` when it earns keeping — substantial, likely amended, or may outlive this sitting. **Single file**, not numbered (01-initial, 02-etc.). The route file is a **living document**: implement writes the ledger back into it at every gate, so the file is the durable state of the work and the conversation is the transaction log. A future session reads the file to know exactly where things stand.

## Persistence Gate

Before proceeding to the next beat, confirm:
- [ ] ADR is in `docs/adr/<thread-name>.md`
- [ ] Route is in `.ai/contexts/<feature>/route.md`
- [ ] IOUs are in `.ai/contexts/<slug>/understanding.md`
- [ ] If any are missing, write them first

## Output

Product line (who / problem / pitch) / Goal / Success criteria / Measured by (when one exists) / Options considered / Decision / Tradeoffs / Failure mode to watch / Thread name / Open questions / Agreed shape (diagram, HTML mockup when user-facing, contracts, call stack, test shapes, or spike) / Design-level decisions / Contracts per component / Failure paths designed / Numbered slices with checkpoints / Order and first slice / Blast radius / Verification strategy / The route file (when it earns keeping)

## Handoff

If the shape and the route hold, recommend /skill:jnk-3-implement. Do not start it: the route is flown when the user invokes it.

## Do not

- Write production code, or design the whole feature in detail (shape and failure paths only).
- Skip failure paths, or skip the contracts — the seams are the design.
- Skip the HTML mockup for user-facing changes — the experience is the spec.
- Plan by layer, or plan slices that leave the system broken between steps.
- Add speculative steps, or steps without checkpoints.
- Follow a route the user has not approved.
- Treat the diagram as a commitment — the map is not the territory.
- Decide without showing every option and getting the user's explicit choice — the call is theirs.
- Pass off a prior lean (e.g. from explore) as a decision, or pass off "familiar" as "simple."
- Add abstraction without a demonstrated need.
- Expand scope without justification.
