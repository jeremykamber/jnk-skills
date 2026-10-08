# jnk-2-design — notes

Private notes for the human. The agent never sees this file.

**What:** Design the shape and the route of a change before building it — ASCII, HTML mockups, contracts, call stack, test shapes, failure paths, then vertical slices with checkpoints. Zero production code.

**When:** direction chosen — shape and route before anyone builds. The shape and the route are one beat: they share the cheapest moment to change everything.

**Why:** program design before the agent cooks. Contracts, call stacks, test shapes, and mockups decided in a context-light session, where a change costs a redraw, not code.

**Fits:** consumes jnk-1-explore's record; produces docs/designs/ (the design record) and plans/ (the route) for jnk-3-implement. Squawk: plan was merged into design because splitting them was ceremony — revisit if design grows fat again. Arena lives here as a reference (`references/arena.md`), not a skill, for the same reason: it is the hard case of Phase 0, used only by this beat, not a beat in the arc. It reuses the lenses as its rubric. Adapted from pstack's arena/architect Phase B, with the judge as a fresh context (one model here) and the user, not a coordinator, choosing the base.

**Refs:** Cockburn (walking skeleton), Hunt & Thomas (tracer bullets), Ousterhout (deep modules), Horthy (program design), Mulroy (plans end with the tests and the call stack).
