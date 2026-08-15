# jnk-grill — notes

Private notes for the human. The agent never sees this file.

**What:** Walk an unresolved decision tree with the user, one question at a time — the agent proposes answers and researches facts; the user decides. A reasoning primitive, not a phase. The one model-invoked skill in the set: the agent fires it itself when a decision tree appears, instead of asking permission or guessing. (Deliberate exception to the user-invoked convention — a decision interview can't reliably wait to be requested; the cost is the description's context tokens on every request, and unpredictability if the model doesn't fire it.)

**When:** any beat hits a consequential unresolved decision — the desired behavior is ambiguous (understand), an option can't be chosen without an underlying answer (decide), a contract or failure path hides a choice (design), a route rests on an undecided question (implement). Also whenever the user feels the agent is deciding things that should be theirs.

**Why:** decisions are the user's job, and most get made implicitly. Grill makes them explicit one branch at a time and returns to the calling beat. Distinguish the primitives: understand = what is true; grill = what have we not decided; decide = what do we choose. The category is "an unresolved decision only the user can make" — not a phase, which is why it never felt like decide or design.

**Fits:** invocable from any beat; hands back to the beat that called it. Its decisions land in the ADR (decide) or the design doc (design). It loops with understand: grill's questions sometimes need the codebase, understand's findings sometimes need a human decision.

**Refs:** Matt Pocock's grilling mechanism (mechanism only — this is our own skill), Kahneman (the user is the judge), the triage: don't manufacture decisions.
