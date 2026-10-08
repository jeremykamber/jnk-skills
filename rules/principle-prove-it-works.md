---
description: "Use before reporting any change done, and whenever a claim rests on 'it compiles' or a green suite. Verify the real artifact, not a proxy."
---

# Prove it works

**Why.** A green suite written beside the code, by the context that wrote the code, proves the implementation matches itself, bugs included. That is the failure mode most likely to fool the agent and its reviewer. "It compiles" is not evidence.

**Match the proof to the change.**

- A command change runs the real command with real arguments.
- A UI change walks the changed flow in the running app.
- A parser or migration replays saved input.
- A storage change reads the written value back.
- A perf change compares before and after profiles.

**Pattern.** Show the command and its output, not a summary of them. When the change is risky, have a fresh context write the failing case from the requirement, never from the diff, and watch it fail before it passes. If a check could not run, the answer is "inconclusive", and a confident reply with no evidence is a red flag.

**When it applies.** Before declaring anything done. This is the execution of `AGENTS.md` principle 7.

**Cite it.** Give the evidence pointer: the command, the run, the artifact.
