# The brief, the steer, and the ledger

Three artifacts carry a delegated run. The brief is written once and is the product; the steers are
short and frequent; the ledger is the only proof of done.

---

## 1. The work order

Write it to a file on the target machine. Sections in this order — the order matters, because the
exclusions come before the work and the quality bar comes before the items, so no worker invents
scope or invents a standard.

```markdown
# New mission: <one line, the outcome, not the activity>

<Who asked, what they decided, and what supersedes what.>

## Corrections (read before you start)

1. **<thing that is out of scope>. Ignore every finding about it.** <the reason, so it is not
   reinvented.> Do not fix, investigate, or re-test it.
2. **<a thing to check rather than assume>.** Re-run <command> yourself and, if it is already clean,
   report "nothing to do" rather than inventing work.
3. <Any correction to the previous report's claims.>

## Quality bar — this is the important part

These must be **high-quality, maintainable fixes that make the codebase easier to change**, not
patches. For each one:

- Fix the cause, not the symptom. If the state is wrong, fix where the state is derived — never hide
  it in the view layer.
- **Delete before you add.** Prefer removing a redundant path, control or condition over adding a
  guard for it. If a fix needs a new flag or a special case, first ask whether the design that needed
  it should exist.
- **Define errors out of existence** — sensible defaults, empty collections, a no-op — rather than
  adding error plumbing at callers.
- No duplicated logic between <the two or three places that keep drifting>. If the same fact is
  computed in three places, that is the bug.
- Follow <the repo's own docs>: <DESIGN.md is the authority on type, spacing, tokens and component
  roles>; <ARCHITECTURE.md on layering>. If a fix changes a documented token or contract, change the
  doc in the same commit.
- Match existing conventions. Do not introduce a second pattern for something the repo already does
  one way.
- Tests move with the change: update the covering tests, delete tests for behaviour you removed.

## Phase 0 — set up (do this first, before any fix)

1. `git worktree add .worktrees/<name> -b <branch> <base>` then `./scripts/setup-worktree.sh
   .worktrees/<name>`. Do not touch the user's checkout or the other worktrees.
2. Run the app from that worktree on a spare port. All evidence from here on comes from **this
   instance**, not production.
3. Keep every screenshot and clip outside the repo, under `<evidence-root>/<ITEM-ID>/`.

## The work order — every item, one by one

For each: **(1) implement, (2) test it and record evidence, (3) review your own evidence —
screenshot *and* video — and if it is not right, research further and try a different approach, (4)
repeat until it demonstrably works.** Do not mark an item done until its own evidence shows the fix
working and shows you did not break the flow around it.

### A. <area> — `<file or folder>`
- **A1** <the defect, with the measurement from the audit.> Fix <where it is derived>.
- **A2** …

### B. <area> — `<file>`
- **B1** …

## How to parallelize (do not fight over files)

Fan out to subagents **by area, not by item**, so no two writers touch the same file: one worker per
group above. If two groups need one file, give it to one worker and hand the other a written
interface note. Do not run two writers on one file, and do not verify a file another worker is still
editing.

Tell every subagent: edit only, do not run gates, tests, lint or formatters — you run those once
yourself across the union of changed files.

## Close out

- Run the project's own gate once, across everything: `<the command>`. Say in the report which
  command you ran.
- Commit per coherent group with a message that says what changed and why. Push the branch and open
  the PR against `<base>`. The PR body carries the **item ledger**: one row per item with the commit
  and the evidence path, a `Verified` section with the commands and their numbers, and a **"Could not
  fix, or would not claim"** section with a reason and a cost per row. Anything you could not fix
  gets a row saying why — never quietly drop it.

## Reporting

Work through this without checking in; it is yours end to end. Report when the ledger is complete, or
if you hit something genuinely blocking. Keep the ledger honest — if an item is still broken after
three attempts, say so and explain what you learned, rather than calling it done.
```

---

## 2. The steer

Short, evidence-backed, batched. One message, numbered items, verified only. Say which decision you
are overriding.

```markdown
<N> review notes. I verified each against your current tree, not the snapshot I read them from.

**Ignore these — they are stale.** <What a reviewer claimed, and the live evidence that it is
already fixed.> Do not go looking for a problem that is not there.

1. **<What is wrong>** (`<file:line>`). <The mechanism, and the cost in a sentence a reader cares
   about.> Fix it <at the level you name>, so every caller inherits the rule instead of each caller
   remembering it.
2. **<What contradicts what>** (`<file>`). Your <comment/doc> says <X>; <the authority file> still
   says <Y>. <Change the doc in the same commit, or drop the citation.>
3. **Nit:** <test/comment that pins the wrong thing>.

Then <the next milestone>, and keep to it. <What the next artifact must carry.>
```

Rules that earned their place:

- **Give the constraint, not the correction.** "At that lightness the accent cannot carry white text
  *and* stay a link colour — write down which one gives" produced a documented tradeoff and a
  rejected alternative; "the contrast is wrong" would have produced a colour tweak.
- **Ask for the evidence, not the conclusion.** "Show me the grid at 1440 with the dock live; if it
  still clips, reserve the clearance at the bottom of the content column" — a conclusion cannot be
  checked, an artifact can.
- **Offer the choice, name what makes each option right, then let it choose and record the choice.**
- **Never forward an unverified finding.** Every "it is still broken / it is not wired" claim gets
  grepped against the live tree first.

---

## 3. The ledger

The PR body is the ledger. Four sections, or the run is not finished.

| item | what was wrong | commit | evidence |
|---|---|---|---|
| **A1** | <the defect, with the number from the audit> | `675f726` | `A1/A1-header-count-mixed.png`, `A1/A1-mixed-failure.webm` |

```markdown
## Verified

- `<build command>`: clean.
- `<test command>`: **<N> files, <N> tests, all passing.**
- CI on `<sha>` (run <id>): `build` pass, `test` pass.
- <The live pass: which port, against which backend, so UI-triggered runs executed this branch's
  server code end to end.>

## Could not fix, or would not claim

- **<thing>** — <what it is, why it was not fixed, and what the fix would cost.> Left as-is pending a
  decision.
- **<pre-existing red>** — fails identically on `<base commit>`, not this branch. <How you checked.>
- **<claim not verified>** — covered by unit tests rather than a live race; reproducing it needs
  <the conditions>.
- **Dead code left in place:** <modules with no importers>. Out of scope for this pass; worth
  deleting separately.
```

### Evidence conventions that made review possible

- One directory per item, named by ID: `<evidence-root>/<ITEM>/`.
- **Before and after** where a before exists (`before-01-batch-grid.png` → `after-01-batch-grid.png`).
- **Video** for anything about flow or behaviour: a frozen frame cannot show a spinner that outlives
  its run, progress frozen at 0% after a reload, or a toast that blocks a click.
- **A text note** when the finding is a number a screenshot cannot show (request rate, a sanitising
  pass, an error string that reaches a log rather than a screen).
- Evidence lives **outside** the repo.
- Verify a sample before accepting the ledger: every referenced path should exist, every item should
  name a commit, and the counts in `Verified` should match what CI reports.

### The proof of coverage

Anything that claims tests gets a mutation-style sentence: *"with `<condition>` injected, two of the
three tests fail; restored after."* A test that cannot fail proves nothing.
