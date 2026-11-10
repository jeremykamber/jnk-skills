# The review panel — two seats, one diff

Seven seats was a guess. Two questions find most of what a review finds, and
`depth` already answers the third.

Used by `jnk-implement` on a risky slice, `jnk-verify` on a risky change, and
`jnk-oneshot` on a substantial one.

## Running it

- **One seat per fresh context — a subagent where the harness has one, otherwise a second session — its brief quoted verbatim** — a seat that has read the
  other is a generalist again.
- **The same context for both:** the diff, the tests it touches, the `AGENTS.md`
  files themselves (never a restatement), and `depth --changed --base <ref>
  --json`, which decides nine of Ousterhout's fourteen flags and lists a repair
  move for each. Nobody re-argues a flag a tool already decided.
- **Both read-only, in one batch.** One writer repairs, serially, and re-runs the
  gates after each repair.
- **Same answer shape:** `[seat] [high|med|low] location — finding — why it
  matters — the move`. "Nothing found, and here is what I checked" is a valid
  and useful answer; a manufactured finding is a failed seat.

## Seat 1 — the defect hunt

**Your question: where does this code do something other than what it promises?**

Read the diff as if you were going to page someone at 2am about it. Look for:
an error path that returns a value where the contract says throw (or the
reverse); state read before it is set; a loop over a collection the caller may
mutate; a boundary that is off by one in the failure direction; an assumption
about ordering, uniqueness, timezone or the clock; a partial write with no
rollback; a lock held across a call that can block; a swallowed exception; a
test that asserts the mock instead of the behaviour. Trace each one to a line.
Do not stop at the first: assume there are three.

## Seat 2 — the design answer

**Your question: did this change need all of these parts?**

Start from `depth`'s findings, then judge what a tool cannot. Is each new module
deeper than the interface it imposes, or a pass-through with a name? Is the new
concept one the codebase already had under another word? Are two modules now
sharing a fact neither owns? Is the failure model consistent with its neighbours
— same error shape, same retry policy, same logging? Would the next engineer read
this in one pass, or need to open four files to learn what it does? Then the
whole-diff question: if this change should not exist, what should have happened
instead?

## Triage

Every finding gets one of three answers out loud: **fixed** (say the move),
**squawked** (say the reason and where it is recorded), or **rejected as wrong**
(say why). A finding you neither fix nor answer is one you decided to keep — say
so, in one line, in the report.

## What this panel is not

Evidence that the code is correct. It is two more readers. When you need a
number rather than an opinion, run `mutate-changed` — a surviving mutant is a
fact, and a reviewer's agreement is not.
