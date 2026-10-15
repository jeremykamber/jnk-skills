# jnk-delegate: notes

Private notes for the human. The agent never sees this file.

**What:** Run a body of work by directing agents instead of writing the code: you write the brief,
fan it out over herdr to agents on another machine, read their diffs yourself, verify every claim
against the live tree, and steer until the ledger is complete. Two rules carry the whole thing —
**production is delegated, verification never is**, and **a claim is not evidence** (absence claims
rot fastest). The deliverable is a reviewed branch, evidence a stranger can check, and a ledger that
names what did not land.

**When:** the work is bigger than one context, belongs on another machine (the browser, the backend,
the production data), and the user wants your judgement on quality rather than your hands on the
code. Not for work you cannot verify; not for the plan; not for the user's own decisions.

**Why:** a delegate's failure mode is not laziness, it is *credulity* — forwarding a report as the
state of the world. Everything expensive in this skill exists to stop that: verify before you
forward, read the diff not the summary, check the ledger's own honesty, and separate pre-existing red
from new red. The second failure mode is taste: an agent will happily flip a design token or resolve
a two-sided tradeoff, and both of those belong to the user. `/skill:jnk-grill` and a decision row are
the right homes for those, not a silent commit.

**Fits:** the executor-side counterpart to the beats. `jnk-2-design` decides the shape and the route;
this one takes a decided body of work and runs it somewhere else, under review, with the route
already written. `jnk-4-verify` verifies one change; this verifies a whole ledger. `jnk-oneshot` is
the small case of the same instinct — one agent, one pass — and stays the default until the work
outgrows a single context. `jnk-decisions` is the trail when the run is long enough that the user
should be able to sample it instead of re-reading it; `jnk-commit` stays the only place history is
written, so a delegated run still ends with the human invoking it (or an explicit instruction to
commit).

**Where it came from:** written from one real run — a production UX audit of Kynd turned into ~31
fixed items plus 7 reviewer-found ones, run by a VPS agent over herdr across a shared tmux pane, with
17 commits and one PR (#95). Everything in *Failure modes* is a mistake that was actually made and
cost time: a moving-tree audit whose stale findings nearly went out unverified; six dribbled steers;
64 files with zero commits an hour in; a long brief that landed as an unsubmitted attachment. The
mechanics in `references/herdr.md` are only the commands that were actually run, plus the one
attachment behaviour observed directly (a queued document attachment, agent idle, until a short
pointer prompt to a file on disk unblocked it).

**Refs:** `principle-isolate-parallel-writers` (one tree, one writer — the fan-out-by-area rule is
this principle applied to a single checkout), `principle-prove-it-works`, `principle-explain-the-
number` (the `Verified` section exists so the numbers can be checked, not believed),
`principle-blast-radius`, and `principle-delete-before-you-add` (the quality bar the brief puts in
front of every worker). The evidence-ledger shape echoes `jnk-decisions` (one row per item, evidence
as a pointer, append-only) and `jnk-4-verify`'s habit of reading a change's own ledger.
