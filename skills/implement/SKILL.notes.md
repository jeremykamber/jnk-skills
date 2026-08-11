# jnk-5-implement — notes

Private notes for the human. The agent never sees this file.

**What:** Implement the route one vertical slice at a time — red-green-refactor, adversarial review where the route calls for it, the slice ledger stays visible and is written back to the route file, a gate between slices.

**When:** the route is approved.

**Why:** fly it one vertical slice at a time, a gate between slices. Early steering is cheap; re-steering a 2000-line diff is not. The ledger is the visibility.

**Fits:** flies design's route; writes the ledger back into plans/ at every gate; feeds jnk-6-verify.

**Refs:** Beck (red-green-refactor), Tali (name your least-confident choices), Horthy (models build horizontally without a human in the loop).
