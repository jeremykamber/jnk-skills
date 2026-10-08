---
description: "Use before trusting, reporting, or acting on any number you measured: a speedup, a regression, a latency, a throughput, a cost, a quality score."
---

# Explain the number

**Why.** A before-and-after number is the easiest evidence to get wrong by accident. A warm cache, a debug build on one side, or work that never ran inside the timed region each produce a convincing result that means nothing.

**Answer these from a real run, one per question.**

1. What limits the number, and why is it not double?
2. Did every side run tuned the way production runs?
3. Does it break a physical limit, like disk bandwidth or core count?
4. Did anything error or return wrong output?
5. Does it reproduce over alternating runs, with a median and a range?
6. Does it matter end to end, on the path a user waits on?
7. Did the work actually happen inside the timed region?

**The verdict is one of:** faster, slower, no measurable difference, or inconclusive. `Inconclusive` is a real verdict. Say it when you cannot name the limiter, or when a side ran untuned.

**When it applies.** Any number you measured yourself, and any number someone hands you that looks too good.

**Cite it.** The run count, the range, and the limiter.
