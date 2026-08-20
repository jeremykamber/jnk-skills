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

5. **Prove the survivors have teeth.** A green suite with tests that can't fail is worse than none — it manufactures confidence. For each passing test, run the mutation probe: flip a comparison, delete a null-check, remove an error branch, off-by-one — does the test catch it? Use the project's mutation tool if one exists (Stryker, PIT, mutmut, cargo-mutants, go-mutesting); otherwise spot-check by hand. And red-team the tests themselves: real assertion, right oracle, no swallowed exception, no vacuous setup. A test that cannot fail for the right reason is a false green.

6. **Report and hand off.** What was attacked, what broke and what you fixed, the green verdict, and the honest calibration per The honest limit: green means ironclad against the attacks — name what tests cannot cover (real concurrency under load, external systems, scale, human misuse). Squawks. A durable fact learned — undocumented behavior, a boundary the system actually has — belongs in `docs/external/`; create the dirs if missing. Do not commit — propose /skill:jnk-commit.

## The honest limit

Tests show the presence of bugs, never their absence (Dijkstra). "All green" is the strongest verdict testing can deliver — not a guarantee. The report says exactly how strong, and names what stayed outside the attack's reach. Anyone who claims more is selling something.

## Handoff

Nothing to hand off — the suite is written and green, or the escalation was named. Propose /skill:jnk-commit for the history. Do not start it.

## Do not

- Write friendly tests — the stance is adversarial; a test that can't fail is not a test.
- Dump the catalog — rank attacks for this feature, write the ones that can break it.
- Leave a false green: no assertion, swallowed exception, wrong oracle, setup that can't fail.
- Claim "bug-free" — the verdict is calibrated: ironclad against the attacks, residual risk named.
- Fix adjacent bugs silently — squawk them.
- Commit anything — history is written via /skill:jnk-commit, user-invoked.
