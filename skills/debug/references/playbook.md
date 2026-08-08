# Debugging Playbook

The tried-and-true methods, synthesized. Load this when diagnosing. Sources: Agans' *Debugging: The 9 Indispensable Rules* (2002), Zeller & Hildebrandt's delta debugging (2002) and *Why Programs Fail* — plus the classics (git bisect, rubber duck, five whys).

## The core loop (Agans)

Understand → make it fail → look → divide → one change at a time → audit trail → check the plug → fresh view → prove the fix.

| Rule | Essence | Counteracts |
| --- | --- | --- |
| 1. Understand the system | You can't spot abnormal behavior without a model of normal behavior. Read the intended flow, not just the error. | Debugging the wrong mental model |
| 2. Make it fail | Turn "sometimes it crashes" into "input X, config Y, operation Z → crash". Reproduction turns anecdotes into experiments. | Unreproducible reports |
| 3. Quit thinking and look | Gather observations. Your theory is a hypothesis; reality gets the final vote. Read the actual error: first stack line, log message. | Inventing explanations |
| 4. Divide and conquer | Find where behavior first diverges from expectation. Each observation should eliminate the largest number of causes. | Searching everywhere |
| 5. Change one thing at a time | Every uncontrolled change destroys information. One variable per test, or you can't know what fixed it. | Shotgun debugging |
| 6. Keep an audit trail | Record what you did, in what order, what happened. A session is an experiment; the trail is its notebook. | Amnesia, circular retries |
| 7. Check the plug | Verify the boring prerequisites: env, config, feature flags, correct process, correct log, correct build. | Premature sophistication |
| 8. Get a fresh view | Explain the evidence — symptoms, not theories — to someone or something. Fresh eyes break cognitive fixation. | Tunnel vision |
| 9. If you didn't fix it, it ain't fixed | Re-run the original failure. Prove your change caused the fix (revert → see it return). Fix the cause, not the workaround. | False confidence |

## Reproduction discipline (rule 2)

- Never hypothesize or patch before reproduction exists.
- Can't reproduce from the report? Ask once for steps/environment/input, or build a minimal repro.
- Intermittent? It's a failure whose conditions you haven't found. Find the variables that correlate — change concurrency, load, timing — one at a time.
- A failure that disappears after a change is evidence, not proof (rule 9).

## Quit thinking and look (rule 3)

- Read the FIRST line of the stack and the earliest log message, not the last.
- Trace the call path: what actually runs vs. what you assumed runs.
- Can't see what's happening? Make it observable: logging, assertions, probes, breakpoints, counters, timestamps.
- Check "is this the code I think is running?" — stale build, wrong branch, wrong environment (rule 7).

## Divide and conquer (rule 4)

- The question isn't "split in half" — it's "which observation eliminates the most possible causes?"
- Find the boundary where behavior first becomes wrong, then bisect: test halfway, discard the half that's fine, repeat.
- 1,000 commits → ~10 tests. That's git bisect.

## Delta debugging (Zeller)

A huge failing case is signal mixed with circumstances; the tiny failing case is a microscope for the bug. Minimize the input before understanding it.

- Define an oracle: `test(input) → FAIL/PASS`. The oracle is the whole domain knowledge — the algorithm is domain-independent.
- Deltas are the removable pieces: input lines, user actions, config options — or the diff between two versions.
- Strategy: delete large pieces first, confirm the failure survives; when large deletion stops working, go finer; stop when no single remaining piece can be removed (1-minimal — not globally minimum).
- Test complements too: if neither half fails alone, the cause may be an interaction across halves (X + Y).
- Caveats: needs a reliable oracle and deterministic behavior; flaky failures break the logic; syntax-aware deltas beat character deletion.
- Applications: crash repros (a 50KB fuzz input → a 17-byte repro), regression isolation (which of a thousand changes crossed PASS → FAIL), interaction bugs.

## Regression archaeology (rule 4 + "what changed")

- Most bugs are introduced by a change. Name the change that introduced the behavior — or say clearly the bug is old.
- `git bisect`: mark current bad, mark last-known-good, let binary search run; automate with `git bisect run <script>`.
- `git blame` on the suspicious lines; `git log -S <string>` (pickaxe) to find when a token appeared or disappeared; diff from last-known-good.
- Flaky? Run the suspect commit's test a few times before trusting a bisect step.

## Five whys (root cause drill)

For the suspected cause, ask "why" until you reach something you can fix — then fix THAT, and state the intermediate whys. A workaround is a symptom patch: "restart the process every hour" controls a leak, it doesn't fix it.

## Stuck protocol

When a hypothesis fails twice or the trail is going in circles:

1. Re-read the evidence — the actual error, the actual state — not your notes about it.
2. Check the plug: environment, config, build, process, feature flag, log file.
3. Fresh view: explain symptoms (not your theory) to the user, or as if to a rubber duck. Articulating the sequence often exposes the contradiction.
4. Review the audit trail: what did you actually try, in what order? Try nothing you've already tried.

## Sources

- Agans, *Debugging: The 9 Indispensable Rules for Finding Even the Most Elusive Software and Hardware Problems* (2002). [Google Books](https://books.google.com/books/about/Debugging.html?id=Q4EaBQAAQBAJ) · [author interview](https://adtmag.com/articles/2002/11/18/qa-an-interview-with-author-david-agans-on-debugging.aspx)
- Zeller & Hildebrandt, *Simplifying and Isolating Failure-Inducing Input* (2002). [paper](https://www.st.cs.uni-saarland.de/papers/tse2002/) · [using delta debugging](https://www.st.cs.uni-saarland.de/dd/ddusage.php3) · [The Debugging Book](https://www.debuggingbook.org/html/DeltaDebugger.html)
- Zeller, *Why Programs Fail* — systematic debugging end to end. [Elsevier](https://www.sciencedirect.com/book/9780123745156/why-programs-fail)
