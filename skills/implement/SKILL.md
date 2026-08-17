---
name: jnk-implement
description: "Implement the route one vertical slice at a time, staying conversational. User-invoked only via /skill:jnk-implement. Red-green-refactor inside each slice, a gate before each next slice, the uncertain choices named, and the slice ledger stays visible and is written back to the route file. Subagent validation ensures slices are truly vertical. Parallel execution with dependency graph maximizes throughput."
disable-model-invocation: true
---

# Implement

> Follow the route. One slice at a time. No refactors mid-implementation.

## Purpose

Follow the approved route one vertical slice at a time. The user stays in control; you never disappear for the whole build. The route can change — the ledger is what keeps it visible.

## The slice ledger

At every gate, state the plan's current shape as a simple list, grouped by state:

- **Done:** slice 1 — strategy prompt fix — enumerated the required fields in the prompt so psychographics come back filled (checkpoint passed)
- **In flight:** slice 3 — neutral names
- **Owed:** slice 2 — ICP wiring (re-ordered behind slice 3)
- **Deferred:** slice 5 — cluster prompt (squawked, user's call)

**Owed** is the word that prevents lost work: any slice that exists but has not landed is owed. When the plan grows or reorders, the ledger says so out loud. A slice never falls out of the story silently.

When nothing changed since the last gate, a one-line summary suffices — `Ledger: 1 done, 2 in flight, 3 owed, 4 deferred` — but every slice stays named in every form. The full list returns whenever something changes, and always in the final report.

## Steps

For each slice:

1. **Announce from the ledger.** "Slice 3 (names): PersonaAdapter + its tests. Checkpoint: unit tests green, live run shows curated names." Name the files and the checkpoint. Wait for the user's go before starting.

2. **Build it, red-green-refactor:**
   - Where a test can fail for the right reason, write it first and watch it fail — against the unfixed code, before the fix.
   - Make it pass with the smallest change.
   - Refactor — work, right, fast, in that order.

3. **Checkpoint.** Run the slice's verification, plus anything it could have broken. Report in plain language: files touched, behavior changed, the result, any squawks.

4. **Adversarial review (when the route calls for it).** If the route marked this slice for review, spawn a skeptical senior-developer subagent over the slice's diff, briefed by `references/reviewer-brief.md`. Triage its findings: fix the real ones, squawk or reject the strawmen — the review either finds real defects or says plainly there are none, and says why. Its findings feed the walkthrough.

5. **Teach it in layers.** Before the gate, teach the slice at the right altitude — never a line-by-line dump. This is the anti-black-box: the user understands what you wrote without reading every line.
   - **Where it sits** — the components and why they live there (ties back to design's file placement).
   - **Flow** — how a request or datum moves through it, in a few lines.
   - **Critical bits** — the two or three decisions that matter: why each abstraction exists, what it assumes, and where your confidence is thinnest. This is the uncertain-choices list — where the user's review attention goes.
   - **The plumbing** — say plainly what is mundane, so the user knows what to skip.
   - **Failure modes** — name the ways this slice could be wrong (the ones you'd actually worry about), then invite the user's probes.
   - **Depth scales with the slice.** Mechanical slices get the two-line version — the seam, the one decision, "the rest is plumbing." Slices the route marked for review get the full teach, and surface the review's headline findings and how each resolved (fixed / squawked / strawman) — one line each — so the user sees what the skeptic found, not just the triage. Waving the teach ("skip it, I trust this one") is a valid answer, same as waving gates.
   - **Tutor, not authority.** When the user asks you to back a claim ("show me exactly where that guarantee comes from"), point at the specific lines. If you can't, that's a finding — say so, don't shrug. The user verifies your claims against the code.
   - When the teach surfaces a genuinely unresolved decision (the route rests on a question nobody settled), invoke /skill:jnk-grill — don't let it ride.

6. **Update the ledger.** Move the slice to Done. State what is now owed or deferred. When a route file exists (`route.md`), write the amended ledger back into it — the route is a **living document** and the file is the durable state of the work; the conversation is the transaction log. Keep the file current so a paused session or /skill:jnk-pickup reads truth.

7. **Gate.** Invite the probe: "Where do you want to dig — flow, the assumptions, or a failure mode? Or shall I back a claim against the code?" Then show the ledger and ask: "Ready for the next slice?" Wait for the user. Do not proceed without clearance. If the user is waving gates ("continue", "just go"), offer batching: "I'll gate after slices 2 and 4, not each one — approve?" A wave is a request for fewer gates, not none. **Reset is free between slices:** heavy session? Finish the slice so the ledger is written to the route file, then end and resume fresh with /skill:jnk-pickup — mid-implementation is the awkward split; never push on past degraded attention. Mid-slice and can't finish? /skill:jnk-handoff carries the thread.

## Persistence Gate

Before proceeding to the next slice, confirm:

- [ ] Squawks are in `.ai/contexts/<slug>/squawks.md`
- [ ] IOUs are in `.ai/contexts/<slug>/understanding.md`
- [ ] Route file is updated with ledger
- [ ] If any are missing, write them first

## Subagents

Implementation uses subagents at set points — validation up front, parallel execution where slices are independent, review on the slices the route called for. Say what you want done in plain language — *spawn a subagent to validate X, to review Y, to implement Z* — and let your harness's subagent mechanism pick the concrete form. Don't hard-code agent types or tool syntax; the harness decides.

Scale the ceremony to the slice. Mechanical slices may want none; slices the route marked for review, and any parallel fanout, are where subagents earn their keep.

### Before you build: validate the slices

After proposing slices (before implementation), spawn a subagent to validate them. Give it the slice list from design and ask: is each slice truly end-to-end (not "all backend, then all UI")? Does each leave the system working? Are the checkpoints actually verifiable? Are there hidden dependencies between slices, and which slices can run in parallel? Reject with reasons if invalid; approve and note concerns if valid. You need its verdict before you build — wait for it.

### In parallel: implement independent slices

When slices have no hidden dependencies, spawn one subagent per slice, each given its own slice's files, its checkpoint, and the red-green-refactor instruction (write the test first, watch it fail, then fix). Only parallelize slices that genuinely don't touch the same code, and never let two writers work the same tree at once — isolate them, or run one at a time. Triage what comes back.

### On reviewed slices: review the diff

For slices the route marked for review (step 4), spawn a subagent to read the slice's diff as a hostile reviewer, briefed by `references/reviewer-brief.md`. Ask it to follow that brief: real defects listed specifically, or a plain "it's clean" with reasons when it is. Triage — fix the real ones, squawk or reject the strawmen.

Every subagent's outcome is surfaced at the gate and in the final ledger (the Output section): which ran, what it found, how you resolved it — so a skipped subagent is visible, never silent.

## Anti-Rationalization Table

Models will attempt these rationalizations. Intercept them:

| Rationalization | Reality | Action |
|-----------------|---------|--------|
| "This horizontal layer is a vertical slice" | A vertical slice is end-to-end, not layer-by-layer | Reject and re-slice |
| "I'll refactor this small thing while I'm here" | No mid-implementation refactors | Log squawk, move on |
| "This test is trivial, I'll skip it" | All checkpoints must be verified | Write the test |
| "I understand this well enough, no need to read" | Understand before changing | Read the code |
| "This abstraction will be useful later" | Every abstraction must earn its cost | Don't add it |
| "I'll just add this one helper function" | Smallest coherent change | Don't add it |
| "The comments are obvious, no need to write them" | Document intent | Write why, not how |
| "I'll fix this bug while I'm in the area" | Fix minimally, don't refactor | Log squawk, move on |
| "I can do both slices at once" | One slice at a time unless parallelized | Follow the route |
| "This slice is too simple for tests" | All checkpoints must be verified | Write the test |

## Scope changes during implementation

The user adds or reprioritizes work during implementation — the route changed. Then:

- Treat the new work as a slice: announce it, name its checkpoint, and **re-state the full ledger** — done / in flight / owed / deferred — in the new order, and write the amended ledger back into the route file. Say out loud what got pushed back.
- The user's request is clearance for the new slice, not for the rest of the plan. Other slices stay owed until they land.
- Never reorder silently. Silent reordering is how a slice gets lost.

## Rules

- **No mid-implementation refactors.** Do not refactor or fix unrelated code during implementation. If you find something that needs fixing, log a squawk — `[squawk] severity | location | what | why deferred` — and move on. If it blocks the slice, stop and ask.
- **The route is a guide, not a contract.** If reality contradicts it — a test reveals a wrong assumption — stop, tell the user, and adjust the slice, return to /skill:jnk-design, or — when the contradiction is an unresolved decision — invoke /skill:jnk-grill. Never improvise around a broken assumption silently.
- Touch only the files the slice needs. Follow existing conventions. No speculative improvements.
- **Write for the next engineer.** Intent over cleverness; comments say why, not how. The simplest code is code that no longer exists — prefer removing to adding.

## Output

Per-slice reports (plain-language what changed, checkpoint result, squawks, the layered teach) / The final ledger — every slice listed as landed (with its what-changed), owed, or deferred / "Implementation complete — ready to verify" when the last slice lands.

## Handoff

When the last slice lands, recommend /skill:jnk-verify — and after verification, /skill:jnk-commit (user-invoked) writes the history. Do not run the full verification sweep here: per-slice checkpoints only. The next beat begins when the user invokes it.

## Do not

- Implement more than one slice without a gate.
- Touch files outside the slice, or fix squawks mid-flight without asking.
- Reorder the plan silently — new slices re-order the ledger out loud, or not at all.
- Commit anything — history is written at the end, via /skill:jnk-commit (user-invoked).
- Dump the whole diff at the checkpoint — teach in layers, and say plainly what's plumbing.
- Stay silent for the whole implementation.
