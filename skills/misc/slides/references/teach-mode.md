# Teach mode

A teaching deck is not a summary of a topic. It is the spine of a
lesson: it opens a gap, makes the claim, shows one case, then makes the
room produce the idea back. The deck's job is durable learning, so it
is judged by what the audience can do later — not by coverage.

Optimize for retention, transfer, and motivation. Read
[slide-craft.md](slide-craft.md) first; those rules all apply.

**Reasoning vocabulary**: *gap, segment, worked example, fade,
retrieval check, interleaving, spacing, calibration, handoff.*

## The unit, repeated

The deck is a sequence of **units**, each one idea. A unit is:

1. **Assertion slide** — the claim, one sentence, in the title.
2. **Case** — one concrete example, worked through *with* them
   (a case they can check against the claim).
3. **Retrieval check** — a `prompt` slide: they answer, then you
   reveal.

Three to five units is a session. If the topic needs more, split it
into two decks — a deck that races to cover everything teaches nothing.

## Open the gap before you fill it

The second or third slide is a **prompt**, not an agenda. Ask the
question the deck answers, and let them commit to a guess before you
explain: unsuccessful guesses improve later learning of the answer
(pretesting — Richland & Kornell 2009), and knowing what they already
believe is the fastest way to teach to it.

Curiosity is the gap between what they know and what they want to know
(information-gap theory — Loewenstein 1994). A deck that opens with
"here is the agenda" spends its best attention on housekeeping.

## Retrieval checks are the point

A `prompt` slide beats a recap slide every time. Recap is restudy;
practice testing is one of only two techniques rated high-utility across
ages, materials and outcomes in the Dunlosky et al. (2013) review, and
distributed retrieval is the other. Every unit ends with one, and no
more than ~7 slides pass without one.

Make the prompt require production, not recognition:

| Weak | Strong |
|---|---|
| "Was tailgating a problem?" | "What would you say to someone who follows you in?" |
| "Do you remember the quiet hours?" | "It is 11 PM on a Tuesday. Are you in quiet hours?" |
| "Any questions?" | "Write the two rules you would enforce first." |

Put the answer in `answer`, never on the slide — the room must commit
before they see it. Use the notes for what to do with the answers:
which misconception to expect, who to call on, what to say if they are
split.

Occasionally ask for confidence as well as the answer ("1–5, how sure
are you?"). Confidence and accuracy come apart, and learners who see
their own gap calibrate better (metacognition — Dunlosky et al. 2013).
Do not ask every slide; ask where a misconception is likely.

The reveal is what does the work, and the surprise is what buys the
encoding: errors made with high confidence are corrected *more*
reliably than hesitant ones once the answer arrives (hypercorrection —
Butterfield & Metcalfe 2001; Fazio & Marsh 2009). The room's most
confident wrong answer is your best teaching material — get it said out
loud, then correct it. A prompt you never resolve is worse than no
prompt.

## Cases: worked first, then faded

Novices learn more from a worked example than from solving the same
problem cold (worked-example effect — Sweller), so the first case in a
unit is shown *and explained step by step*. Then fade: the next case
gets the first step only, then a problem they do in pairs.

Fading is not optional decoration — support that helps a novice
actively harms someone who already knows it (expertise reversal —
Kalyuga 2007). If the room already has the skill, skip the worked case
and go straight to the problem.

This rising difficulty *is* the escalation a teaching deck wants:
support high at the start, gone by the end, with the last case one they
do alone. Difficulty that rises with their competence is motivating;
difficulty that rises faster than their competence is just attrition.

## Vary and space it

- **Interleave**: mix the kinds of practice within a section rather
  than blocking all of one type (moderate utility — Dunlosky et al.
  2013). Ask about rule A, then rule B, then A in a new disguise.
- **Space**: bring an earlier claim back inside a later prompt. Two
  encounters in one deck beat one encounter repeated twice.
- **Elaborative interrogation / self-explanation**: prompts that ask
  *why is this true* and *how does this relate to what you already
  know* produce better retention than extra explanation (moderate
  utility — Dunlosky et al. 2013). One such prompt per unit is enough.

## Say the difficulty out loud

Retrieval, spacing and interleaving feel worse than rereading while
they are happening. Tell the room once, on a slide or in the notes:
"This will feel harder than rereading — that is the point." (desirable
difficulties — Bjork).

## Close on production, not summary

The last slide is a retrieval prompt, not "key takeaways" that you
read. Make them produce the summary — the two rules, the one decision,
the next action — and then tell them what to do with it.

A teaching deck also ends with a **handoff**: the practice that
continues without you (the reading, the drills, the spaced review).
Spacing during the session is limited by definition; if the user wants
the retention loop to continue afterwards, that is the `teach` skill's
job — this skill produces the deck.

## Build checklist

- [ ] Objective is one sentence, and the deck serves it
- [ ] Opens with a prompt, not an agenda
- [ ] Every content slide has an assertion headline
- [ ] A retrieval check closes every unit, ≤ 7 slides apart
- [ ] Answers live in `answer` / notes, never on the slide
- [ ] The first case in each unit is worked, then faded
- [ ] Difficulty rises: the last case is one they do alone
- [ ] Every prompt is revealed — the correction is the teaching
- [ ] At least one *why does this hold?* prompt
- [ ] Closes on a prompt + the handoff
- [ ] `check-deck.mjs` reports no errors
