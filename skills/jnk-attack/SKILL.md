---
name: jnk-attack
description: Write adversarial tests that try to break a feature — boundaries, invalid input, properties, state, time — and prove each one can fail. Use before shipping something risky.
disable-model-invocation: true
---

# Attack

> Assume it is broken. Then prove it is not, or find the crack.

The first five tests anyone writes are the same five. This goes where nobody
looks.

## Steps

1. **Read the contract as an adversary.** What is it documented to do, and what
   must hold no matter what? Then list what the code trusts without checking —
   callers never pass null, ids are unique, the file exists, the clock is right.
   Every one is a target.

2. **Map the boundaries.** Types: min, max, zero, NaN, Infinity. Collections: 0,
   1, 2, n−1, n, n+1. Strings: empty, max length, unicode, injection. Time:
   epoch, leap year, Feb 29, DST, timezone. Boundaries are where bugs live.

3. **Attack in order of yield.** `references/attack-catalog.md` is the menu.
   Rank by "what is most likely to actually fail here", then write those in the
   project's test conventions. A 200-test dump is noise; ten aimed attacks are
   signal.

4. **Fix what breaks** — smallest change, verified by the failing test. A wide
   fix means stop and hand back to `jnk-debug` or `jnk-design`.

5. **Prove the survivors have teeth.** `mutate-changed` over the changed files.
   Every survivor is either a missing assertion (fix the test) or an equivalent
   mutant (say why, in one line). Confirm a survivor with `mutate-changed --full`
   before reporting it: the scoped run only sees the tests that import the file.

## Output

The attacks written, what broke and how it was fixed, the mutation result, and
the residual risk — what this suite cannot reach.

## Next

`jnk-commit`. Recommend and stop.
