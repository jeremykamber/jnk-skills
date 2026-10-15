---
name: jnk-delegate
description: "Direct other agents instead of doing the work yourself: write the brief, fan it out over herdr to agents on another machine, read their diffs, verify every claim against the live tree, and steer until the ledger is complete. User-invoked only via /skill:jnk-delegate. Production is delegated; verification never is."
disable-model-invocation: true
---

# Delegate

> Your hands never touch the work. Your judgement touches every claim.

## Purpose

Run a body of work through agents you direct — usually on another machine, over `herdr` — while
you keep the only two things that cannot be delegated: **the standard the work is held to**, and
**the verification of every claim it makes**.

The deliverable is not activity. It is a reviewed branch, evidence a stranger can check, and a
ledger that says honestly what landed and what did not.

## When to use

- The work is bigger than one context: many items, many files, hours of runtime.
- It belongs somewhere else: a machine with the browser, the backend, the production data, or the
  hardware you do not have locally.
- The user wants your judgement on quality, not your hands on the code.

Not for: work you cannot verify (you would be relaying claims, which is worse than not starting);
work smaller than its brief (`/skill:jnk-oneshot`); the plan itself (slice design is yours); the
user's own decisions (hand them back — see *Hand the taste back*).

## The two rules

1. **Production is delegated. Verification never is.** The agent runs the app, drives the browser,
   writes the code, records the evidence. You read the diff, the tree, the ledger, the CI, and the
   behaviour claims. Never accept a report as the state of the world.
2. **A claim is not evidence, and absence claims rot fastest.** A "present" claim gets checked for
   existence *and* wiring. An "absent" or "unfixed" claim gets re-checked against the live tree
   before you forward it — three independent agents can agree on a stale absence, and did.

## Steps

### 0. Decode the ask into a decision list

Before dispatch, turn the request into: the work, the **exclusions** (with the reason, so the agent
does not invent it back), the **quality bar in the repo's own vocabulary**, and what "done" means.
Then reconnaissance: what exists, where, and what the repo's own rules say the answer looks like.

Ask the user only what only the user can answer. Everything else — which files, which pattern,
which command — is yours to find and to state in the brief.

### 1. Reconnaissance you cannot delegate

Check the ground truth yourself once, cheaply, and write it into the brief: the branch and its base,
the tooling that exists on the target, whether the claim in the request is even true. Two minutes
here prevents a worker inventing a task. (One request asked for debate entry points to be removed;
zero references existed outside the route folder, so the honest answer was "nothing to remove" —
and saying so was part of the brief.)

### 2. Write the work order as a file **on the target machine**

The brief is the product. Write it once, complete, to a file the agent can read (`scp` it), and
send a short prompt pointing at it — long prompts can arrive as an attachment and sit unsubmitted
(see `references/herdr.md`). It must contain:

- **Phase 0**: where the work happens. A worktree off the trunk, never the user's checkout; the
  project's setup script; and **verify against a locally-run instance of the branch** — production
  does not have the fixes, so evidence from it proves nothing.
- **The decision list**: exclusions and the reason; anything already decided.
- **The quality bar**: the repo's rules stated as a bar, not a mood. *Delete before you add. Fix the
  cause, not the symptom — derive state where it is derived, never in the view. Define errors out of
  existence instead of plumbing. No parameter for one caller. A rule that only binds the file it was
  written in is not a rule. If a fix changes a documented token or contract, change the doc in the
  same commit.*
- **The item list, with stable IDs** (`A1`, `B1`, `C1`, …). IDs make every later conversation
  surgical ("item B2"), name the evidence directories, and make the ledger checkable.
- **The loop**: implement → test → **record evidence** → **review your own evidence** → if it is not
  right, research and try something else → repeat until it demonstrably works.
- **The close-out contract**: one commit per coherent group, landed as each group passes its own
  review; the ledger; the report trigger.

Templates for the work order and the ledger: `references/brief.md`.

### 3. Fan out by area, not by item

Several workers on one file is how a branch becomes unreviewable. Partition by **area**, give each
worker exclusive files, and say so: "one worker per group; if two need the same file, one worker
takes it and the other gets a written interface note." Within a worker, items run serially; across
workers, in parallel. Every worker is told: *edit only — do not run gates, tests, lint or
formatters; the owner runs those once across the union of changed files.*

One tree, one owning agent. If you truly need several agents, give each its own worktree and branch
and name one merge owner. Never sit several writers on one tree and coordinate around them.

### 4. Read the work, not the report

The report tells you what it believes; the diff tells you what it did. Read the diff yourself, area
by area, and judge it as a reader who has to change it in six months. What to hunt — every one of
these was a real hit, and none of them appears in an agent's own summary:

- A parameter, flag or option added to serve one caller.
- A doc comment citing a document that says the opposite (a code comment claiming
  "DESIGN.md → Primary" while DESIGN.md still specified white text).
- A rule written into one file and broken in the next one along.
- State kept in two places — a hook and a store holding the same fact on different clocks.
- A state-machine transition with no terminal guard (a late cancel overwriting a finished record).
- Needless API churn on an old target (an ES2024 call in an ES2017 repo); a helper exported with no
  outside consumer; an abstraction extracted ahead of its third use.
- A fix that deletes a duplicate: good, even when it merges two shapes behind one optional flag.
  Judge the direction, not the flag.

Read the **highest-risk hunks** yourself — the state machine, the derivation, the persistence
boundary — and let auditors cover the rest. Do not read the whole diff *and* run a full audit; that
is the same work twice.

### 5. Verify every claim against the live tree

Grep the branch, not the report. For each claim: does it exist, and is it wired?
`ConfirmDeleteDialog` claimed three call sites — grep found three. `failureMessage` claimed to be
rendered — grep found the report and the PDF. A "missing import" blocker — the import was on line 8.
An audit's four "blockers" were all stale absence claims; forwarding them would have cost a cycle
and credibility.

Check the ledger's own honesty too: every evidence path in it should exist on disk (all 32 did),
every item should have a commit, and the "verified" numbers should be reproducible from CI. When the
agent claims something is *pre-existing* red, check the base commit and see for yourself.

### 6. Steer with evidence, early, in batches

Every steer: **what is wrong, where (file:line or commit), what it costs, the simpler alternative,
and which decision it changes.** Say which of its decisions you are overriding and why.

- **Early** on a pattern beats late on an instance. The cheapest steer of the run arrived before the
  pattern spread.
- **Batched**: do not dribble six messages; one message with numbered items, verified items only.
- **Ask for the verification you want, not a conclusion**: "show me the grid at 1440 with the dock
  live; if it still clips, reserve the clearance" — not "is it fixed?".
- **Give the constraint, not the correction.** The best work came after the tradeoff was explained
  (at that accent lightness you cannot have white button text *and* AA link text — write down which
  one gives), because then the agent can hold the line itself.
- When you offer a choice, name both options and what would make each right, then let it choose and
  record the choice. It may come back better than either (it took the predicate over the migration,
  because bumping the storage version would have discarded stored data).

### 7. Hold the loop until the ledger is complete

The loop ends when every item has a commit, an evidence path, and a verdict. Not when a phase ends,
not when the tree looks green. If an item is still broken after three attempts, that is a ledger row
("not fixed, here is what we learned"), never a silently dropped item and never a relabelled
follow-up.

Watch for the two stalls: a long run with **no commits** (a branch is a checkpoint, not a cliff —
ask for commits as groups land, not at the end), and a plan whose ledger shows `0/N` while files
change (it is working; the ledger ticks on its own review, which is correct).

### 8. Judge the close-out

Four sections, or it is not done:

1. **The ledger** — one row per item: what was wrong, the commit, the evidence path.
2. **Verified** — the commands and the numbers, reproducible.
3. **Could not fix, or would not claim** — with the reason and the cost. This section is where a
   delegate earns trust; a delegate with an empty one is not telling you something.
4. **The decisions** — anything you sent back to the user, stated as a choice with its tradeoff.

Ask for a **mutation-style proof of coverage** on anything that claims tests: "removing the branch
fails two of its three tests". A test that cannot fail proves nothing. And insist that pre-existing
red is separated from new red ("new lint errors: none; the repo's lint is red at this head,
pre-existing, not swept") — then verify it.

### 9. Hand the taste back

You are not the product owner. Three kinds of thing go back to the user, never decided silently by
the agent or by you:

- **Taste**: a token or palette change that alters the whole product's look.
- **A tradeoff with a real cost either way**: reserving space to stop a toast overlapping content
  costs dead space on every screen.
- **Work outside the brief that the agent found**: dead modules, a red gate, an unrelated defect.

State each as a decision with its tradeoff and your recommendation. "Accepting `I won't fix this,
here is the cost` is a valid answer" — that is the difference between a ledger and a to-do list.

## Failure modes — from the run this skill was written from

Name these before you start; each cost real time.

| Failure | What it looks like | The fix |
|---|---|---|
| **Auditing a moving tree** | Six auditors on a diff snapshot while work continued; three reported the same already-fixed defect, one reported four stale "blockers" | Audit a frozen commit (or the tree at a checkpoint), and hunt **shape** ("wrong layer", "duplicated render"), not **absence** ("unwired", "missing") |
| **Relaying instead of verifying** | An audit's findings look authoritative; forwarding them is faster than checking | Grep the live tree for every claim first. Verify a sample of each auditor's findings before sending any of them on |
| **Dribbling steers** | Six separate messages, each one item, each interrupting | Batch verified items into one message; steer early on the pattern instead |
| **No commits to audit against** | 64 files, zero commits, one hour in | Require the close-out contract up front: commit each group as it passes its evidence review |
| **Doing the review twice** | Reading every hunk yourself *and* running a full parallel audit | Split the lanes: your own eyes on the highest-risk hunks, auditors on the rest |
| **Silently absorbing a claim** | Accepting "Vercel is failing pre-existing" or "the tree is clean" | Check the base commit; check the remote ref; check the evidence paths exist |

## Output

A reviewed branch and its PR, an item ledger with evidence pointers, a verification you performed
yourself, and the decisions the user still owns — named, with tradeoffs.

## Do not

- Do the work yourself because it is faster. Then the branch is yours and the review is a solo act.
- Forward a finding you have not checked against the live tree.
- Accept "done", "clean", or "passing" as a state you have confirmed.
- Let a phase boundary end the loop while items remain.
- Decide taste, or a two-sided tradeoff, on the user's behalf.
- Turn a red gate green by weakening it. Fix the cause or report it.
