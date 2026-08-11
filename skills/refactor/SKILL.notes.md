# jnk-refactor — notes

Private notes for the human. The agent never sees this file.

**What:** Change structure without changing behavior — always asks, states value and risk, verifies with unchanged tests.

**When:** structure changes without behavior change — always with permission, on its own pass.

**Why:** maintenance in the hangar, never mid-implementation. First, do no harm; "not today" is a complete answer.

**Fits:** optional housekeeping; verification is the existing tests, unchanged; deferral becomes a squawk.

**Refs:** Fowler (Rule of Three), Metz (duplication is cheaper than the wrong abstraction).
