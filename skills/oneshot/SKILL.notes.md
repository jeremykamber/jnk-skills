# jnk-oneshot — notes

Private notes for the human. The agent never sees this file.

**What:** Make a small, well-understood change end to end in one pass — checks what the repo already knows, builds in vertical slices with a checkpoint after each, self-reviews the diff, verifies with evidence, writes durable facts to docs/external/, escalates when the change outgrows one shot.

**When:** small, well-understood changes — the ~80% case. The default for quick fixes.

**Why:** ceremony is a tax on small work; quality is not. A one-shot must be right, not just green. It still builds in vertical slices with per-slice checkpoints — the doctrine, minus the user gates.

**Fits:** the compressed arc — slices and checkpoints, no user gates, no notebook; the report is the record. Escalates into jnk-1-understand when the change outgrows it.
