# Session structure

## The policy loop

The session is a closed loop, not a sequence. The learner's state decides each move:

DIAGNOSE → IDENTIFY BOTTLENECK → SELECT NEXT COGNITIVE OPERATION → PROVIDE MINIMUM EFFECTIVE
SUPPORT → REQUIRE GENERATION / RETRIEVAL / APPLICATION → OBSERVE EVIDENCE → UPDATE LEARNER
MODEL → ENOUGH EVIDENCE? → yes: SPACE / ADVANCE · no: REMEDIATE

## The learning arc

The same evidence loop shapes the whole relationship with a topic:

- **Beginning** — diagnose what the learner can do, then draft the curriculum map (below).
- **During** — generate evidence about what the learner can do; let it revise the map.
- **End** — test what the learner can do without the tutor.
- **Between sessions** — test what survived.

## The curriculum map

A topic is a destination, not a single move. After the first diagnosis, draft the map and
store it in the topic file ([learner-model.md](learner-model.md)):

- **Target** — the end-of-topic transfer goal: "By the end, in a situation you've never seen,
  you can ___." This is what the final assessment tests.
- **Concepts** — the named concepts the topic decomposes into.
- **Edges** — prerequisite dependencies: A before B before C.
- **Route** — proposed order, as fine-grained as useful: a chain, or a small graph.
- **Status** — a hypothesis, revised whenever evidence contradicts it. A gap discovered in a
  later concept can reorder or expand the route; fast mastery shrinks it. The map never
  overrides the learner's state — the policy loop still decides each move.

The learner sees a compressed version at the start: "We're aiming for X. Roughly A → B → C.
We'll adjust as we go." Full detail stays in the file. Use the map for decisions the loop
alone can't see ahead to: which prerequisite to verify before it bites, what to interleave
once enough schema exists, and what the final assessment should test.

## The instructional repertoire

The fifteen steps below are the available operations, selected by the current bottleneck —
not executed in order. Use as few as the state requires.

1. **Orient** — "Here's what you'll be able to do," compressed from the curriculum map
   (destination + rough route).
2. **Activate** — "What do you already know?"
3. **Diagnose** — tiny probes (below).
4. **Build prerequisite** — only where needed, and only the one needed for the next move.
5. **Explain one thing** — short, layered ([pedagogy.md](pedagogy.md)).
6. **Generate** — "Now reconstruct it."
7. **Worked example** — model the procedure, with the *why* at each step.
8. **Guided practice** — the learner completes part of it.
9. **Independent retrieval** — no scaffolding.
10. **Feedback** — specific and diagnostic ([pedagogy.md](pedagogy.md)).
11. **Variation** — same principle, different surface features.
12. **Transfer** — a novel problem.
13. **Metacognitive check** — "What was the hardest part?" / confidence calibration.
14. **Retrieval later** — schedule it (below).
15. **Mastery decision** — continue, remediate, or advance.

## Diagnosis protocol

Start with the smallest diagnostic interaction that can distinguish the plausible starting
states. Continue diagnosing only when the result would change the next instructional decision
— sometimes one probe suffices, sometimes several. Diagnosis interleaves with teaching:
probe → tiny intervention → probe. Do not probe everything before teaching anything.

Open with: "A couple of quick questions. Don't look anything up. Getting them wrong is useful
— it tells me where to start."

Probe, with strategically selected questions: prior knowledge, prerequisite gaps,
misconceptions, procedural fluency, conceptual understanding, transfer ability, selection.

Sample confidence only when calibration is at stake, and periodically run an explicit
calibration measurement (ask "how confident are you, 0-100?" on a small set, then compare
against actual). Knowing whether you know something is itself a skill: a learner who scores
8/10 and knows they missed 2 is in a very different state from one who scores 8/10 believing
they got 10/10. But confidence questions are measurements, not a ritual — don't ask them
every turn.

## Fading sequence (scaffolding removal)

Early in a topic, when the learner lacks the schema to construct the procedure themselves:

1. **Fully worked example** — problem, step 1, why step 1, step 2, why step 2, …
2. **Learner self-explanation** — do not have them repeat the steps; have them generate the
   principle: "Tell me why this method was appropriate."
3. **Completion problem** — "I've done the first two steps. You do step 3."
4. **Faded example** — "Here's the problem and the first step. You finish the rest."
5. **Independent problem** — "Now you solve one."

This is closer to what you want than either "here's the answer" or "figure it out yourself."
Worked examples are valuable when prior knowledge is insufficient to efficiently construct the
schema; fade guidance as the schema develops (see [evidence.md](evidence.md)).

## Spacing schedule (the memory curriculum)

A lesson is not finished when explained. Review intervals are computed by the scheduler
script — they are **adaptive hypotheses, not fixed prescriptions**:

```bash
# from the skill directory (~/.pi/agent/skills/teach/)
echo '{"rating":"good","cuesNeeded":false,"transferDemonstrated":false,
       "importance":"medium","difficulty":"medium","reviewedOn":"2026-06-01",
       "card":{"repetitions":2,"ease":2.5,"interval":6}}' \
  | node scripts/scheduler.js schedule
```

→ `{"effectiveRating":"good","card":{"repetitions":3,"ease":2.5,"interval":15,"lastReview":"2026-06-01","nextReview":"2026-06-16"},"note":"good → 15 days, next 2026-06-16"}`

Interface:

- `rating` (required): `again | hard | good | easy` — how the retrieval actually went.
  Confidence steers this choice: confident, uncued, correct → `easy`; hesitant → `hard`.
- `cuesNeeded`: the learner needed scaffolding → counts one step weaker.
- `transferDemonstrated`: applied in a novel setting → counts one step stronger (never
  rescues a failure).
- `importance` / `difficulty`: scale intervals — high importance → longer; hard material →
  shorter.
- `card`: current scheduling state (`repetitions`, `ease`, `interval`, `lastReview`); omit
  for a brand-new concept.
- Write the returned `card` back into the topic file (`lastReview` = the review's date).

At a review session, find what's due:

```bash
echo '{"today":"2026-06-10","cards":[
  {"name":"derivative","nextReview":"2026-06-08"},
  {"name":"bayes","nextReview":"2026-06-15"}]}' \
  | node scripts/scheduler.js due
```

→ `{"due":["derivative"],"notDue":["bayes"]}` — a card with no `nextReview` counts as due.

If the scheduler can't run, fall back to adaptive judgment: first review tomorrow, second
~1 week out, then multiply by ease of recall — shorten after weak or cued retrievals, lengthen
after easy ones. A first schedule usually lands near tomorrow → 3 days → 2 weeks → 6 weeks.
Example retrievals at those points: "Without looking: what does the electron transport chain
ultimately help produce?" → "Why does oxygen matter here?" → "A patient has a defect affecting
oxidative phosphorylation. Predict two consequences." → a novel transfer problem.

Begin every review with retrieval. If retrieval fails, diagnose and remediate minimally, then
retrieve again — a review that reveals a gap should teach that gap, not just repeat the
question. The delayed retrieval itself is a clean measurement of what survived.

## Interleaving

Blocked practice (AAAA) while the learner needs repetition to identify the structure. Switch
to mixing (ABCACBAB) only when the learner has enough schema for each candidate procedure that
mixing tests **selection** rather than producing confusion — not after a fixed number of
examples. The goal shifts from "can you execute this procedure?" to "can you recognize when
this procedure is appropriate?" — which is where expertise begins.

## Transfer design

Vary surface features deliberately; otherwise learners master only the kind of problem they
were just shown.

- Example 1: a car. Example 2: a satellite. Example 3: fluid flow. Same principle.
- Then: "What is common to all three?" — that is abstraction.
- Then: "Here's a situation you've never seen. Which principle from our toolkit applies?" —
  that is transfer.
- Then negative transfer: "Here's a problem that *looks* like it should use the principle.
  Does it?" Selection testing: "Which of these three problems require the chain rule?" — not
  "solve these three chain-rule problems." The latter tests execution; the former tests
  selection.

## Assessment

**Continuous and mostly invisible.** Every explanation, solution, prediction, and comparison
is evidence; update the learner model from it. Do not announce "QUIZ TIME!" constantly.

Occasionally run a **clean measurement**: "I'm going to give you five problems without hints.
This is just to see what you can independently do."

The **final assessment looks different from the lesson**. For "how does inflation work," do
not ask "define inflation." Ask:

> "Country X experiences a sudden 12% increase in the money supply while production remains
> unchanged. A politician claims this will make everyone richer. Evaluate the claim."

Then: "Now explain your reasoning to a person who thinks inflation simply means 'prices going
up.'" Then: "Here's a superficially different scenario. Does the same reasoning apply?"

That tests factual knowledge, causal model, reasoning, explanation, and transfer — not
recognition.

## Performance vs learning

Never conclude mastery from immediate performance. Evidence of robust competence, weakest to
strongest:

1. **Immediate performance** — solves it right now
2. **Independent performance** — solves it without cues
3. **Delayed retrieval** — solves it after a gap
4. **Uncued selection** — chooses the right method without being told
5. **Novel transfer** — applies it in an unfamiliar setting

Do not advance solely because level 1 is strong. Each level is a different ability; know
which evidence you actually have. Immediate performance and durable learning are different
things; that is why desirable difficulties and delayed retrieval matter.

## When not to add instruction

The tutor doesn't equate teaching with talking. Sometimes the right intervention is to stop
adding instruction:

- Learner needs retrieval, not explanation — "You don't need another explanation. You need
  five retrieval attempts."
- Learner needs discrimination, not another example — "You don't need to see another worked
  case. You need to decide which method fits."
- Learner needs fluency, not conceptual instruction — "You understand the concept; the
  problem is speed."
- Learner has enough evidence and should attempt independently — "You're ready. Go solve this
  yourself."
- Fatigue / error accumulation — "You've been working for 45 minutes and your error rate is
  climbing. Stop. Come back tomorrow."

The last item is session regulation, not instruction: it protects learning rather than adding
to it.

## Mastery decision

Continue, remediate, or advance — driven by the learner model, the evidence ladder above,
and the clean measurement, not by session length.
