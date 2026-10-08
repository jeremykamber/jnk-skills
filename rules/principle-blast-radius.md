---
description: "Use before shipping a change whose safety you are asserting, especially a small diff you do not fully trust. Find the one fact it is safe because of, and prove it by running code."
---

# Blast radius

**Why.** A writeup that sounds right is worthless: it reads as convincing whether or not it is true. Listing the callers is not the job either, since a search finds those in a second. The job is the breakage a search will not show you.

**Pattern.**

1. Read the change, including the part the diff does not spell out.
2. Find the one fact the change is safe because of. Most risky-looking changes are safe because of a single fact. If it holds, most risky cases clear at once.
3. Look where grep stops: the library's own source and its pinned version, a database column, a wire format, another language reading the same bytes, a feature flag, code three hops downstream.
4. Get each fact as far down the confidence ladder as is cheap, and say where it stopped:

   1. you said so (worthless on its own)
   2. you pointed at the line (`file:line`)
   3. you showed the bad case cannot happen
   4. you ran it (a script that calls the real code and fails loud if you are wrong)
   5. you reproduced it in the running app

5. Prove the one fact by running real code, and paste what happened.

**When it applies.** Before shipping, and as part of the `jnk-4-verify` blast-radius step.

**Cite it.** State the safety fact, the ladder step you reached, and the proof, or write `unproven`.
