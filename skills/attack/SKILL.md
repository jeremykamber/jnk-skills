---
name: jnk-attack
description: Generate adversarial tests that try to break a feature — boundary values, invalid classes, error guessing, property invariants, state and concurrency attacks — so a green suite is as close to ironclad as tests get. User-invoked only via /skill:jnk-attack. Point it at a feature or change; it writes and runs the attack suite, proves each test can fail, and reports the residual risk.
disable-model-invocation: true
---

# Attack

> Assume it's broken. Then prove it isn't — or find the crack.

## Purpose

Write tests whose job is to break the feature, not bless it. The stance is the whole point: the first five tests anyone writes are the same five — the attack suite goes where nobody looks. A green attack suite is the strongest thing tests can say about a feature. It is not "no bugs": it is ironclad against everything the attack catalog could think of, with what lies outside its reach named out loud.

## When to attack

- After implement or verify, before shipping something risky — it works; now make it survive.
- When a bug was found late — attack the whole area, not just the fix.
- On surfaces with hard boundaries: parsers, formats, money, time, ids, collections, public APIs.

## Steps

1. **Read the contract as an adversary.** State what the feature is documented to do, and its invariants — the things that must hold no matter what the world throws at it. Then list what the code trusts without checking: callers never pass null, ids are unique, this runs once, the file exists, the clock is right. Every assumption is a crack — a test target, not a justification.

2. **Map the boundaries.** For every input, output, and state: the type boundaries (min, max, zero, NaN, Infinity), the collection boundaries (0, 1, 2, n−1, n, n+1), the string boundaries (empty, max length, max+1, unicode), the time boundaries (epoch, leap year, Feb 29, DST, timezone). Boundaries are where bugs live — the oldest finding in testing (Myers; Beizer).

3. **Attack in order of expected yield.** Load `references/attack-catalog.md` — the testing canon, synthesized. Enumerate attacks against this feature: boundary values, invalid equivalence classes, error guessing, property invariants (round-trip, idempotence, ordering, no-crash), state and lifecycle, time and environment, concurrency. Rank them: which are most likely to actually fail here? Write those, following the project's test conventions. The catalog is a menu, not a checklist — a 200-test dump is noise; only attacks that can genuinely break this feature are signal.

4. **Run — fix what breaks.** The attack suite will find real bugs; that is the point. For each failure, the smallest fix that makes the failing test pass, verified by that test. If a bug implies a large-scale or wide-blast-radius fix, stop and recommend /skill:jnk-debug or /skill:jnk-1-explore instead — the user decides.

5. **Prove the survivors have teeth — `mutate-changed`.** A green suite with tests that can't fail is worse than none: it manufactures confidence. This step is a command now, not a hand-probe. `mutate-changed` mutates only the files you changed and runs only the test files that transitively import them — the whole tree was the slow part, and the scoped run is seconds. It flips operators across those files and fails below Stryker's score floor. Every survivor is either a real assertion gap — repaired in the test, never by editing the operator back — or an equivalent mutant you verify by hand and record as such. **In a scoped run a survivor is a suspect, not yet a gap:** only the tests that import the changed file ran, so a mutant that only another module's test would kill looks escaped. Confirm it with `mutate-changed --full` before you write an assertion for it. `mutate-changed --full` is the deliberate audit — whole tree, whole suite, no cache — not a checkpoint; `mutate-changed --files <path>` is the same scoped run pinned to files you name; `mutate-changed --dry-run` prints the files, tests, workers and exact command, and runs nothing.

   **Check the tool before you trust the score.** A mutation tool can lie in two directions, and the gate's `reject` assertion names both signatures.

   *It can tell you your tests are terrible.* Stryker's vitest runner reports every mutant as SURVIVED under vitest 5 — including mutants whose killing assertion is right there in the test file — printing `Ran 0.00 tests per mutant` and a 0.00% score. It is not activation: the runner picks the right test, then builds its name filter by joining the suite chain with a space, while vitest 5 matches the `>`-joined full name, so no test runs at all. If you see that, the tool is broken, not your suite — and it is a bug with a fix in the kit, `templates/stryker-vitest-runner.mjs` (the official runner with the separator corrected, which also makes `coverageAnalysis: "perTest"` usable: measured 3m39s -> 22-40s on a real project through `mutate-changed`, same verdicts). `templates/stryker.conf.cjs` ships that as the default and keeps the command runner as the fallback.

   *It can tell you your tests are perfect.* A runner left at Stryker's default concurrency starts one test-runner process per CPU core, and with the command runner — or any unscoped run — each of those starts your whole suite; when that suite itself fans out to a worker per file, the machine is oversubscribed, every mutant exceeds Stryker's default 5 seconds, and the report comes back `# killed 1  # timeout 2559  # survived 0` — a **100% score made entirely of timeouts**, which is the number you were hoping for and is why this one is worse. It also takes hours to produce. The fix is `concurrency` and `timeoutMS` in `stryker.conf.cjs`: a few runners rather than one per core, and a per-mutant timeout with room for the suite. Read that file's comment before you trust a score of 100.

   `checks/test_mutation.sh` proves a mutation setup in both directions against a fixture with one mutant that must be killed and one that must survive.

   And red-team the tests themselves: real assertion, right oracle, no swallowed exception, no vacuous setup. A test that cannot fail for the right reason is a false green.

6. **Report and hand off.** What was attacked, what broke and what you fixed, the green verdict, and the honest calibration per The honest limit: green means ironclad against the attacks — name what tests cannot cover (real concurrency under load, external systems, scale, human misuse). Squawks. A durable fact learned — undocumented behavior, a boundary the system actually has — belongs in `docs/external/`; create the dirs if missing. Do not commit — propose /skill:jnk-commit.

## The honest limit

Tests show the presence of bugs, never their absence (Dijkstra). "All green" is the strongest verdict testing can deliver — not a guarantee. The report says exactly how strong, and names what stayed outside the attack's reach. Anyone who claims more is selling something.

## Handoff

Nothing to hand off — the suite is written and green, or the escalation was named. Propose /skill:jnk-commit for the history. Do not start it.

## Do not

- Write friendly tests — the stance is adversarial; a test that can't fail is not a test.
- Blame your suite for a mutation score before checking the tool — a run that kills nothing is usually the tool, and the gate's `reject` says so.
- Dump the catalog — rank attacks for this feature, write the ones that can break it.
- Leave a false green: no assertion, swallowed exception, wrong oracle, setup that can't fail.
- Claim "bug-free" — the verdict is calibrated: ironclad against the attacks, residual risk named.
- Fix adjacent bugs silently — squawk them.
- Commit anything — history is written via /skill:jnk-commit, user-invoked.
