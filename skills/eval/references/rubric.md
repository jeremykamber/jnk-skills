# The rubric — how to judge a session against the workflow

The workflow's contract: beats with gates, artifacts in the engineering notebook,
engineering leading words, vertical slices, and data over opinion. The trace is
the evidence. Score five lenses; cite a line number or a count for every claim —
an impression with no line number is not a finding.

---

## Lens 1 — The arc

Which skills were invoked, in what order (stats.json → skillInvocations)?

- `jnk-pickup` skipped when starting fresh: fine.
- `jnk-2-design` skipped: acceptable, but then a decision record and thread name must
  exist somewhere — design step 1 backfills them (verify that, don't assume).
- `jnk-commit` skipped: the loop's memory is missing unless `notes.md` exists.
- `jnk-oneshot` invoked: a legitimate compression of the arc, not skipped beats — but verify it stayed small and escalated when the change grew.
- `jnk-debug` invoked: a legitimate mode — verify it reproduced before diagnosing, gated the diagnosis before fixing, and re-verified the original failure before declaring fixed.
- `jnk-grill` fired mid-beat: legal — it is a primitive, not a phase, and the one model-invoked skill in the set (the agent fires it itself at a decision tree). Verify it asked one question at a time, proposed answers, and handed back to the calling beat with the decisions applied. A grill that wandered into planning is beat bleeding in disguise.
- A beat's output handed to the next beat without a gate? A skill invoked
  mid-beat?

## Lens 2 — Gate discipline

Every beat and every slice ends with a clearance question, and the agent waits.

- Find the gates (stats.json → gates). For each, did the next work start before
  the user replied? Look at the block *after* the gate line.
- "continue" from the user clears the specific gate the agent asked — it is not a
  license to run the whole plan. If the agent never asked, "continue" changes
  nothing.
- The debrief's teach-back: did the user articulate what changed in their own
  words, or did the agent narrate and the user pass? The session's second
  outcome is verified only by the user's own words. Check the message order:
  if the agent's summary precedes the user's answer ("my version to compare"
  in the asking message), the teach-back is contaminated — the user echoes
  instead of recalls.
- A scope change during implementation is clearance for that slice only. Check
  whether the slice ledger got re-stated (Lens 4, failure catalog #1).

## Lens 3 — Artifact discipline (the #1 failure mode)

The notebook is the loop's memory; resume reads it. Check *writes*, not mentions:

- `understanding.md` (after jnk-1-explore — when the model earns keeping), `docs/adr/` (after jnk-2-design), `docs/designs/` (after jnk-2-design), `plans/` / `route.md` (when
  the route earns keeping), `verification/results.md` (when something remains
  unverified or squawked), `notes.md` (after jnk-commit), `handoff.md` (after jnk-handoff — a mid-beat split).
- stats.json → artifacts + artifactWrites: a toolCall named `write` whose path
  contains `.ai/contexts`, `docs/adr`, `docs/designs`, or `docs/external` is a write; any other
  mention is not.
- Durability: are `docs/adr/` and `notes.md` committed (or otherwise backed
  up)? Zero durability = the loop has no backup.
- Zero writes = memory dead, even if every beat went well. (One caveat under
  the persistence simplification: a small beat may legally skip its file when
  the conversation holds the state — the failure is a full arc that leaves
  nothing readable, or a mid-beat split with no handoff. The next session's
  pickup is the test.) This is the biggest
  failure mode in real sessions.

## Lens 4 — Leading-word adoption

Reasoning traces are the adoption evidence (stats.json → leadingWords, counted
as occurrences and distinct blocks).

- **discipline** (gate, checkpoint, squawk, iou, blast radius): high
  = the agent internalized the behaviors. Healthiest category.
- **doctrine** (vertical slice, tracer bullet, walking skeleton, red-green):
  medium is normal. Zero occurrences with the behavior present = the words don't
  stick but the behavior does — acceptable; note it.
- **artifact** (thread name, ledger, owed, notebook, debrief, the .md paths): high
  is the goal (the thing was named because it was written). Low = the writes are
  being skipped — cross-check Lens 3 before concluding.
- **scenery** (metaphor words — near zero is healthy):
  tells you nothing about behavior. High scenery + missing behavior = the no-op
  tell: the agent mirrored the metaphor and did not do the thing.
- **Echo effect:** right after a skill is invoked, the agent's reasoning restates
  the skill text, so counts spike. Counts are signal, not proof — read the
  moment before claiming adoption.

## Lens 5 — The failure catalog

Check each; cite the moment if it fired.

1. **Lost slice / silent reorder.** A slice in the plan never landed, and the
   ledger never showed it as owed. Detection: compare the plan's slice list
   against the final report's list. The fix lives in implement ("owed" + a
   re-stated ledger whenever the plan reorders).
2. **Notebook never written.** See Lens 3.
3. **No decision record when decide was skipped.** The plan "confirms the
   decision" but no record exists. Detection: plan text + nothing in
   `docs/adr/`.
4. **Gate waved.** "continue" taken as blanket clearance, or a scope change
   absorbed into the current slice without announcing a new slice.
5. **Red-green skipped.** Tests written alongside the fix, never watched fail
   against the unfixed code. Detection: the toolCall order around a slice's
   first edit (edit → edit → run, versus write-test → run → fail → fix).
6. **Verification without a baseline.** Failures reported without comparing
   against pristine (stash → run → pop). Without the baseline, "my changes
   broke nothing" is an opinion, not data.
7. **Squawks silently fixed.** A defect fixed inside a slice with no `[squawk]`
   line, or never offered to the user.
8. **Scope absorbed.** A new user request folded into the current slice instead
   of announced as its own slice with its own checkpoint.
9. **The plan that outgrew its save.** Declared trivial at the start, then
   amended twice and spanned sittings, never saved. The plan file is where the
   amended route lives.
10. **Scenery replacing engineering.** A leading word in a step is pure scenery
    and the behavior it names has a plain engineering word available. Flag it —
    it fails the training-data test.
11. **Beat bleeding.** A skill produces the next beat's artifact — understand's
    output contains a plan, implement runs the full verification sweep. A beat
    ends with a handoff that names the next beat; it never starts it.
    Detection: the skill's output section vs its "Do not" list.
12. **Teach-back skipped or contaminated.** The debrief's arc was narrated by
    the agent, or the agent answered its own teach-back question before the
    user replied ("my one-liner to compare" in the asking message), so the
    user never articulated in their own words; the session's second outcome
    went unverified. Detection: the debrief block — user's own words vs agent
    narration, and the message order between the ask and the answer. The fix
    lives in debrief.
13. **Silent decision.** A consequential unresolved decision was resolved by the
    agent without the user — the grill signal was there and skipped. Detection:
    a choice appears in the agent's narration with no preceding user decision,
    no grill, and no named delegation ("I'll pick X unless you object"). The
    fix lives in grill + the calling beat's grill line.

## Lens 6 — The Pocock sweep

Load `references/pocock.md` and run the four-part checklist over the workflow's skills — at minimum the ones this session exercised and the ones with proposed edits:

- **Trigger** — user-invoked with `disable-model-invocation: true` and a description that says when to fire. (Consistent by design; the one deliberate exception is `jnk-grill`, model-invoked so the agent can fire the decision interview itself. Flag any *other* drift.)
- **Structure** — steps and reference separated; branch-only material behind context pointers that resolve to real files; SKILL.md as small as it can be.
- **Steering** — leading words pass the training-data test and are repeated, not stated once; no scenery word sitting where a plain engineering word exists.
- **Pruning** — deletion test on non-step lines; no duplication across skills; no sediment.

Per-skill verdict: **Matt would approve** — or the specific failing check, named.

---

## The verdict

1. **Per-skill table:** `worked | needs change | not exercised`, each with
   evidence — a count, or a quoted line with a line number. Skills not invoked
   get `not exercised`, not `needs change`.
2. **Adoption table by category** (from stats.json).
3. **Failure list:** which catalog items fired, where, and which skill owns the
   fix.
4. **Pocock sweep:** per-skill "Matt would approve?" verdicts from Lens 6,
   with the failing check named where one fails.
5. **Proposed edits**, each held to four tests:
   - **Evidence test** — a trace moment shows the failure. No moment, no edit.
   - **Deletion test** — if the new/kept line were removed, would behavior
     change? If not, it is a no-op; cut it.
   - **Training-data test** — leading words must be engineering terms the agent
     already associates with the behavior (vertical slice, gate, owed). Scenery
     decorates; it does not steer.
   - **Smallest coherent change** — fix the specific failure in the owning
     skill; do not rewrite the skill, and do not churn skills that worked.

## Calibration — what a healthy trace looks like

From a real session that was judged healthy overall (the persona-empty-fields
fix, 2026-08-06):

- Discipline adoption high: IOU 75, checkpoint 31, blast radius 15, squawk 15 —
  all in reasoning traces.
- Artifact words near zero (thread name 0, notebook 0) and zero notebook writes:
  that is the *unhealthy* pattern — the beats worked, the memory was still lost.
- Scenery near zero (2): the aviation frame shaped the conversation, not the
  behavior — the engineering words did the steering.

That session produced exactly two of the failures above (catalog #1, #2) — the
two fixes that mattered were implement's slice ledger and understand's write
gate.
