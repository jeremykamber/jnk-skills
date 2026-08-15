# jnk-handoff — notes

Private notes for the human. The agent never sees this file.

**What:** Carry the live conversational thread across a session boundary — mid-beat or between beats. Writes a compact checkpoint (`handoff.md`) that pickup reads next session.

**When:** context at ~60% mid-beat, end of day with a thread unfinished, branching to a subproblem or prototype, handing the thread to another session or agent. Not at every beat — a finished beat whose durable artifacts carry the state needs no handoff.

**Why:** beat boundaries and context boundaries are different things. The old workflow coupled them — you could only split at beat ends, and every beat had to write an artifact to make a split possible. Handoff decouples them: split anywhere, a few lines carry the thread, and durable knowledge still lives in docs/.

**Fits:** pickup reads `handoff.md` alongside `understanding.md` and `notes.md`. Complements the persistence simplification — don't serialize the conversation out of fear; serialize knowledge the project needs; handoff carries the thread.

**Refs:** the v2 workflow conversation (grill + handoff + persistence), the principle "serialize knowledge because the project needs it, not because you're afraid of losing it."
