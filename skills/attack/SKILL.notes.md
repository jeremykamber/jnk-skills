# jnk-attack — notes

Private notes for the human. The agent never sees this file.

**What:** Generate adversarial tests that try to break a feature — boundary values, invalid equivalence classes, error guessing, property invariants, state/time/concurrency attacks. Green means ironclad against the attack catalog, with residual risk named; the suite itself is red-teamed (mutation probe, vacuous-test check).

**When:** after implement/verify before ship; on high-boundary surfaces (parsers, money, time, ids, collections, public APIs); after a late-found bug.

**Why:** a green suite is only as strong as its hardest test. Friendly tests bless; attack tests prove. The catalog is the canon synthesized — Myers, Beizer, Kaner, Whittaker, QuickCheck, mutation testing (Offutt) — held to Dijkstra's limit.

**Fits:** standalone, like commit/debug — not a numbered beat. Sits after jnk-6-verify; small found bugs are fixed inline, large ones escalate to jnk-debug / the beats; history via jnk-commit.

**Refs:** Myers The Art of Software Testing; Beizer Software Testing Techniques; Kaner Testing Computer Software; Kaner/Bach/Pettichord Lessons Learned in Software Testing; Whittaker How to Break Software; Hendrickson Explore It!; QuickCheck/Hypothesis; Offutt & Ammann mutation testing; Meszaros xUnit Test Patterns; Feathers Working Effectively with Legacy Code; Freeman & Pryce GOOS; Meyer Design by Contract; Dijkstra.
