# The Attack Catalog

The testing canon, synthesized into attacks. Load this at jnk-attack step 3, then rank — the catalog is a menu, not a checklist. Every attack names the question it asks, a probe, and the source(s) it comes from.

Sources: Myers, *The Art of Software Testing*; Beizer, *Software Testing Techniques*; Kaner, Falk & Nguyen, *Testing Computer Software*; Kaner, Bach & Pettichord, *Lessons Learned in Software Testing*; Whittaker, *How to Break Software*; Hendrickson, *Explore It!*; Claessen & Hughes, QuickCheck; MacIver, Hypothesis; Offutt & Ammann, *Introduction to Software Testing*; Meszaros, *xUnit Test Patterns*; Beck, *TDD by Example*; Feathers, *Working Effectively with Legacy Code*; Freeman & Pryce, *GOOS*; Meyer, *Design by Contract*; Hunt & Thomas, *The Pragmatic Programmer*; Rosenthal et al., *Chaos Engineering*; Weinberg, *The Psychology of Computer Programming*; Dijkstra (1972).

## The stance — what the canon agrees on

Testing's purpose is destructive: a successful test is one that finds a bug (Myers). Testing is sampling, so sample adversarially — you cannot test everything, so test the inputs most likely to break the program (Kaner et al.). The author is the wrong tester for their own code; their stake in it working blinds them (Weinberg) — the attack suite takes the enemy's seat. Bugs are not evenly distributed: they cluster at boundaries, in invalid input, and around assumptions (Beizer). The strength of a suite is measured by its ability to catch injected faults (Offutt & Ammann). And the limit holds: tests show the presence of bugs, never their absence (Dijkstra) — green is ironclad against the attacks, never bug-free.

## Ranking for a feature

- **Which inputs cross boundaries the code must compute with?** → boundary, computation, collection attacks.
- **What does the code trust without checking?** → error-guessing attacks; every trust is a crack.
- **What must always be true no matter what?** → property attacks — the strongest oracle there is.
- **What state does the feature hold across calls?** → state and lifecycle attacks.
- **What does it touch outside itself?** → environment, time, resource, concurrency attacks.
- **What is new or changed?** → diff-guided attacks: the regression surface.
- **No spec?** Pin down actual behavior with characterization tests first (Feathers) — you cannot attack a contract that was never written down. Then attack the gaps between what it does and what it must do.

## 1. Input attacks — what goes in

### Boundary values

What happens at min−1, min, min+1, max−1, max, max+1 of every input domain? Bugs congregate at boundaries — the oldest, most confirmed finding in testing (Myers; Beizer). Probe: a loop bound n with n−1, n, n+1 items; index −1, 0, n−1, n; INT_MIN/INT_MAX; a string at max length and max+1; page 0 and page total; an offset exactly at EOF.

### Invalid equivalence classes

Partition the input space into classes that should behave alike; every class needs a test — especially the invalid ones. The invalid classes are where "should have failed" hides (Myers; Beizer). Probe: null where non-null is expected; negative where positive is expected; an enum value that does not exist; the date 2023-02-30.

### Type and coercion

Wrong type, and neighbor types that coerce silently: int vs float vs the string "5", booleans as ints (True == 1), null vs empty string vs empty list — languages differ in what they accept quietly (Myers; Whittaker). Probe: "5" where 5 is expected; None vs "" vs []; a bare True; 1e999 as an int field.

### Strings

Empty, whitespace-only, single char, max length, max+1, unicode — emoji, combining marks, RTL text, the null byte, surrogate pairs — and huge strings (Whittaker; Hendrickson). Probe: "\n\n" and "   "; a max-length field with "😀" (grapheme vs byte vs code point); "é" written as e + U+0301; a 10⁶-char payload through a routine written for dozens.

### Collections

0, 1, 2, n−1, n, n+1 elements; duplicates; all-identical; sorted and reverse-sorted; mixed types; elements that are themselves collections; aliasing — two lists sharing elements (Myers; GOOS). Probe: [] through "first element" logic; [1,1,1] through dedupe; a list that is its own member; mutation of one alias corrupting the other.

### Malformed data

Truncated input, corrupted bytes, wrong schema version, extra and missing fields, trailing garbage, partial writes (Whittaker; Hendrickson). Probe: a CSV row cut mid-field; an unclosed tag; a file truncated exactly at the header/footer boundary; a message whose length prefix lies.

### Scale

10×, 100×, 1000× expected size: overflow, quadratic blowups, memory, timeouts, pagination drift (Whittaker; chaos). Probe: 100k items through logic written for dozens; an already-sorted vs reverse-sorted input to a sort; a paginated read where the page size does not divide the total.

## 2. Computation attacks — what happens in

### Overflow and wrapping

INT_MAX+1, LONG_MAX, unsigned wraparound to 0, signed/unsigned mismatch, the year 2038 (Myers; Beizer). Probe: a running total that crosses INT_MAX; adding 1 to a maxed id; a byte counter wrapping mid-transfer.

### Floating point

0.1 + 0.2 ≠ 0.3; big-plus-small cancellation; equality on floats; NaN ≠ NaN; −0.0; money as float (Beizer; Myers). Probe: summing 0.1 ten times; x − x; a NaN inside a sort or a min; prices stored as floats and compared with ==.

### Sign and zero

Negative zero, sign errors, abs(INT_MIN), division by −1 overflow, the empty-vs-zero confusion (Beizer). Probe: abs(INT_MIN); formatting −0.0; zero used as a rate or multiplier; an empty string vs "0" vs 0.

### Division

By zero, by −0, by a tiny epsilon → huge results, integer truncation toward zero vs floor (Beizer; Myers). Probe: 1/0; a 1e-300 divisor; −7/2 in integer arithmetic — is it −3 or −4?

### Rounding

Half-up vs half-even (banker's), floor vs truncation, negative values, currency rules (Beizer). Probe: 2.5, 3.5, −2.5; a price at 0.005; display rounding vs the stored value; rounding twice vs once.

## 3. State and lifecycle attacks — what was there before, what is left after

### Empty state

No rows, no session, no config, first run, nothing has happened yet (Feathers; GOOS). Probe: a query before any insert; deleting the last item and continuing; rendering an empty dashboard; a report over an empty month.

### Singleton state

Exactly one element; the first and last element; the only row in a table (Feathers; Myers). Probe: delete the only item; min/max of a 1-element list; a sort of one element; pagination with exactly one page.

### Double call — idempotence

Run twice: same result? The same request submitted twice — retries double-charge, double-insert, duplicate side effects (Hunt & Thomas; chaos). Probe: the same id posted twice; a refresh after a POST; the same patch applied twice.

### Ordering

A then B vs B then A; create-then-read vs read-then-create; interleaved callers (Feathers; GOOS). Probe: delete before update; create after close; a handler registered after the event already fired; two writers in different orders.

### Mid-flight failure

Failure between steps: partial write, half-moved file, an uncommitted transaction, missing cleanup on exception (chaos; Whittaker). Probe: kill between rename and write; an exception after insert before commit; a download interrupted at 50%.

### Reentrancy

Call during a callback, event during handling, mutation during iteration, deep recursion (GOOS; Whittaker). Probe: a collection changed during iteration; a callback that fires the event that fires the callback; recursion deep enough to overflow the stack.

### State leakage

Shared mutable state across calls: cache poisoning, a leftover session, static counters, module-level state, tests that only pass in one order (Meszaros; GOOS). Probe: two calls sharing a singleton; a value that survives "logout"; the same feature invoked from two concurrent requests.

### Resources

Files, sockets, connections, cursors, streams left open; exhaustion under repetition; locks never released (Whittaker; chaos). Probe: open/close 10k times — are file descriptors leaking? A connection pool exhausted; a lock held after an exception.

## 4. Time and environment attacks — when and where it runs

### Calendar boundaries

Epoch, year 2038, leap years, Feb 29, Dec 31/Jan 1, month ends, week starts (Hendrickson; Beizer). Probe: Feb 29 in a non-leap year; Dec 31 23:59 plus one minute; date math across a month boundary (31 vs 30 days); Jan 1 minus one day.

### Timezone and locale

UTC vs local, DST transitions — the spring-forward gap and fall-back overlap — timezone math across zones, locale formatting of numbers, dates, currency (Hendrickson). Probe: a meeting spanning a DST boundary; 12345.67 formatted in de-DE vs en-US; a UTC timestamp rendered in +14 vs −12.

### The clock

Code that reads now() more than once and gets two answers; fast/slow clocks; skew between services; timestamps generated inside logic (Hendrickson; chaos). Probe: a token that expires during its own creation; sorting by a timestamp that changes mid-sort; two now() calls straddling midnight.

### Environment

Missing file, empty directory, wrong permissions, no network, empty database, feature flag off, quota exceeded, disk full, unset env vars (Whittaker; chaos). Probe: a config file absent — defaults or crash? Disk full mid-write; network drop mid-request; HOME unset.

### Concurrency

Same input from two threads or processes: shared counters, last-write-wins races, check-then-act, double-submit, partial visibility (chaos; GOOS). Probe: two threads incrementing one counter; two processes writing one file; read-modify-write on shared state. Honest limit: unit tests cannot prove thread-safety — use race detectors (`go test -race`, TSAN) and stress runs, and say that the residual risk is named, not hidden.

### Restart and crash

Process killed between steps, crash mid-write, restart recovery, a journal or replay, partial state on boot (chaos; Feathers). Probe: kill after insert, before commit; a stale lock file blocking startup; recovery after a crash mid-migration.

## 5. Property attacks — what must always be true (the strongest oracle)

### Round-trip

encode→decode, serialize→deserialize, save→load, format→parse: the original survives (QuickCheck; Hunt & Thomas). Probe: parse(format(x)) == x across many x; load(save(x)) preserves every field; a float survives to-string/parse.

### Idempotence

f(f(x)) == f(x): normalize, dedupe, retry, re-apply a patch, "set" operations (QuickCheck). Probe: normalizing twice; deduping twice; the same request retried after a timeout.

### Inverse

undo after do, decrypt after encrypt, push then pop, add then remove (QuickCheck). Probe: undo(do(x)) == x; add then remove leaves the collection exactly as before.

### Commutativity and ordering

f(a, b) == f(b, a) where order must not matter; sorted output; stable vs unstable order; ties broken deterministically (QuickCheck; Beizer). Probe: inserts in reverse order give the same result; two equal keys sort deterministically; a sum that must not depend on order.

### Conservation

What must be preserved: count, sum, balance, length, uniqueness, membership (Pragmatic Programmer; QuickCheck). Probe: after any sequence of adds and removes, size == adds − removes; a ledger balance conserved through transfers; no duplicate ids ever created.

### Identity elements

0, "", [], {} where an identity is defined: adding zero, concatenating "", intersecting with the empty set, sorting the empty list (QuickCheck). Probe: sum([]); "".join; min of an empty list; a name with "" appended.

### No unexpected exceptions

For any input in the documented domain: no undocumented exception, no crash, no state corruption — even when the output is "wrong" (Hypothesis fuzz; Myers's robustness). Probe: random bytes through the parser; random valid-ish inputs through every path; the invariant "never throws" as a property.

### Monotonicity

Bigger input → bigger (or never smaller) output, where the domain promises it: totals, floors, pagination ordering (QuickCheck). Probe: adding items never decreases the total; page N+1 starts exactly where page N ended; a minimum never exceeds a maximum.

## 6. Suite attacks — do the tests have teeth?

### Mutation

Inject a bug, see if the suite catches it: flip < to ≤, delete a null-check, remove an error branch, off-by-one, swap operands. Every mutation the suite misses is a bug that ships (Offutt & Ammann). Tools: Stryker (JS/TS), PIT (Java), mutmut (Python), cargo-mutants (Rust), go-mutesting (Go). Probe: delete the "if x is None" guard — does anything fail?

### Vacuous test

A test that passes regardless of the code: no assertion, an assertion on the wrong value, code that never runs (Meszaros). Probe: comment out the assert — still green? Replace the implementation with a stub — still green? Change the input to anything — still green?

### Wrong oracle

Asserting what the code does, not what it must do: expectations copied from buggy output, golden files that lock in the defect (Feathers's characterization done wrong; Myers). Probe: was the expected value derived from the code under test? Would this test have caught the bug it claims to describe?

### Swallowed exception

try/catch around the assertion, an exception caught and ignored, "assert in finally", a test that passes on error paths (Meszaros). Probe: does the test fail loudly when the feature throws? Is there a bare except that returns true?

## The mnemonic

SFDPOT (Hendrickson; Bach) — a memory aid for generating attacks while reading a feature: **S**tructure (the shape of the thing), **F**unction (what it must do), **D**ata (what it consumes and produces), **P**latform (what it runs on), **O**perations (how it is used, in what order), **T**ime (when it runs, the clock, duration).
