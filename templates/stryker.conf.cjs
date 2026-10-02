/**
 * Mutation config for a TypeScript project.
 *
 * Copy to `stryker.conf.cjs` at the repository root, copy
 * `stryker-vitest-runner.mjs` next to it, and edit the line marked EDIT ME.
 * Run it with the `mutation` gate. `gates --init` copies both files for you.
 *
 * The `.cjs` extension is deliberate, for the same reason as
 * `.dependency-cruiser.cjs`: it is the only one that works whether or not the
 * project sets "type": "module". It is also the only Stryker config format
 * that accepts comments, and every setting below needs one.
 *
 * REQUIREMENTS: vitest, and `npm i -D @stryker-mutator/vitest-runner`. Without
 * the second, the run stops at "Cannot find TestRunner plugin 'vitest-fixed'.
 * In fact, no TestRunner plugins were loaded. Did you forget to install it?" —
 * loud, and one command away from fixed.
 *
 * Three of these settings are load-bearing. Each exists because of a specific
 * way Stryker silently gives you the wrong answer, and each was found by
 * running it against a fixture with one mutant that must be killed and one
 * that must survive. Read them before you change them.
 *
 * WHY THIS RUNNER AND NOT "command". `testRunner: "vitest"` — Stryker's own
 * vitest integration — reports every mutant as SURVIVED under vitest 5,
 * including mutants whose killing assertion is right there in the test file,
 * and prints "Ran 0.00 tests per mutant" with a 0.00% score. That is worse than
 * a crash: a crash is a failure you fix, while a 0% score reads as "your tests
 * are terrible" and sends you off writing assertions for mutants that were
 * already detected.
 *
 * The mechanism, traced end to end rather than guessed. The dry run is fine:
 * the tests run and the per-test coverage is right, so Stryker knows which
 * tests cover each mutant. It then asks the runner for exactly those tests —
 * the request is correct, `tests/math.test.ts#math adds`. The runner turns that
 * id into a name filter by joining the suite chain with a SPACE (`math adds`),
 * and vitest 5 matches a name filter against the ">"-joined full name
 * (`math > adds`). Nothing matches, the file is skipped, and ZERO TESTS EXECUTE.
 * A mutant nothing executes against cannot be killed, so it is recorded as
 * Survived with `testsCompleted: 0`, and the average over the run is the "0.00
 * tests per mutant" in the report.
 *
 * Reproduce it in one line each way:
 *
 *     npx vitest run tests/math.test.ts -t "math adds"     # 3 skipped
 *     npx vitest run tests/math.test.ts -t "math > adds"   # 1 passed
 *
 * Not fixed in any release: `@stryker-mutator/vitest-runner` 10.0.0, the
 * latest, still joins with a space (`collectTestName` in its `test-helpers.js`).
 * Nor is it a misconfiguration on our side — the selection Stryker computes is
 * right, and the filter it builds cannot match.
 *
 * `stryker-vitest-runner.mjs` is that official runner with the separator
 * corrected before the filter is built — about 150 lines, and no fork of
 * anything. It is what makes `coverageAnalysis: "perTest"` usable at all, which
 * is the line that buys the speed: each mutant runs the tests that cover it
 * instead of the whole suite. Measured on a real project (1196 test files, one
 * mutated file, 122 mutants, 8 workers, cold cache, both configs, both through
 * `mutate-changed`): 3m39s with `testRunner: "command"` against 22-40s with this
 * one, and the same verdict either way — 79 killed, 42 survived and 1 with no
 * coverage. The spread is the shape of the run, not noise: most mutants run the
 * ~130 tests that cover them, in-process, and the few Stryker has no test plan
 * for run the whole suite — those set the wall clock, which is also why a mutant
 * with no covering test is worth reading rather than shrugging at. `checks/test_mutation.sh` in the kit pins the plugin against the
 * fixture described above, under both runners, so a run that reports 0 killed
 * fails the check rather than the reader's confidence. Run that check after any
 * Stryker or vitest upgrade.
 *
 * Its failure mode is deliberately loud or slow, never silent. It reads the
 * test-name mapping out of the live vitest task tree; if Stryker or vitest
 * changes the id format again, the ids stop resolving and the affected mutants
 * run their whole test file — a correct superset, and slower — rather than a
 * filter that matches nothing.
 *
 * IF THE PROJECT IS NOT ON VITEST — jest, mocha, node:test — use the command
 * runner instead, which needs no plugin and no extra dependency. A shell
 * command plus an exit code cannot lie; it is slower, because the whole suite
 * runs per mutant, which is why the gate is differential. Replace the three
 * settings at the top of `module.exports` with these, and keep the rest:
 *
 *     testRunner: "command",
 *     coverageAnalysis: "off",
 *     commandRunner: {
 *       command: process.env.MUTATE_TESTS
 *         ? `npx vitest run ${process.env.MUTATE_TESTS}`
 *         : "npx vitest run",
 *     },
 *
 * `MUTATE_TESTS` is how a scoped run hands the command runner one test file
 * instead of the whole suite: `mutate-changed` sets it, nothing else needs to,
 * and an unset variable means the whole suite.
 */
module.exports = {
  packageManager: "npm",

  /**
   * A `plugins` list replaces Stryker's default plugin discovery, which is why
   * the plugin re-exports the official runner's validation schema: without that
   * re-export the run dies with "Cannot read properties of undefined (reading
   * 'dir')" from inside the official runner.
   */
  plugins: ["./stryker-vitest-runner.mjs"],
  testRunner: "vitest-fixed",

  /**
   * WHY "perTest", and why it is only possible here: with the fixed runner,
   * Stryker runs the tests that cover each mutant instead of the whole suite.
   * Under `testRunner: "command"` this must be "off" — a command runner has no
   * per-test reporting to analyse, and leaving it at "perTest" reintroduces the
   * silent-wrong-answer behaviour described at the top of this file.
   *
   * It is also what unlocks `ignoreStatic: true`, which drops the mutants that
   * run at module load. Stryker rejects that combination without perTest:
   * "Config option 'ignoreStatic' is not supported with coverage analysis
   * 'off'."
   */
  coverageAnalysis: "perTest",

  /**
   * WHY inPlace: Stryker's sandbox calls `ts.parseConfigFileTextToJson` to
   * rewrite tsconfig `extends`/`references` paths. TypeScript 7 removed that
   * API, so every sandboxed run on TS 7 dies with
   * "ts.parseConfigFileTextToJson is not a function".
   *
   * inPlace skips the sandbox entirely and mutates your files in the working
   * tree. Stryker restores them on the way out — verified, byte-identical —
   * and it is faster, because there is no sandbox to copy.
   *
   * Two consequences. Run it on a clean tree: if the process is killed mid-run
   * the tree can be left mutated, and `git checkout -- src` puts it back. An
   * aborted run does not always die loudly — a failed dry run leaves the files
   * instrumented, and the NEXT run then fails its own dry run with "There were
   * failed tests in the initial test run", which reads as a broken suite rather
   * than as a leftover. `mutate-changed` refuses to start on such a tree and
   * names the files. And do not run anything else against the tree while it
   * runs — during the run those files hold instrumented source with every
   * mutant behind a switch, so a concurrent coverage or test run reports
   * nonsense (branch counts inflate roughly tenfold). This is why the gate
   * runner runs gates one at a time.
   *
   * An interrupted run also leaves one `stryker-setup-<worker>.js` per worker
   * in the project root — the runner writes them and deletes them on the way
   * out. Keep `stryker-setup-*.js` in `.gitignore`.
   */
  inPlace: true,

  /**
   * RUN IT FAST. The whole tree with the whole suite is the slowest possible
   * run, and it is the one people stop doing. Five levers, in the order they
   * pay, with what each measured:
   *
   *   1. `testRunner: "vitest-fixed"` with `coverageAnalysis: "perTest"` — run
   *      only the covering tests. Already set above; it is the largest lever on
   *      a big suite, and the only one that changes the runner. 3m39s -> 22-40s on
   *      a real project.
   *   2. `--mutate <files>` — mutate what changed, not the tree. 231 files
   *      become one.
   *   3. `--concurrency <cores-1>` — safe once a mutant runs one test file's
   *      worth of tests, and not before: with the whole suite it is the timeout
   *      trap below.
   *   4. `--incremental --incrementalFile <per scope>` — reuse results for the
   *      same scope. The file has to differ per scope; see the cache note below.
   *   5. `MUTATE_TESTS=<test files>` — the command runner's only lever for the
   *      same thing, for a project that cannot use the plugin: on a 54-file
   *      suite, one test file instead of all of them took the per-mutant dry
   *      run from seconds to 807ms.
   *
   * `mutate-changed` does 2, 3 and 4, plus the two things that are easy to get
   * wrong by hand: which tests cover the change (vitest's own module graph via
   * `vitest related`, not a `foo.ts -> foo.test.ts` guess that misses the test
   * exercising it through another module) and one cache file per scope. Use it
   * rather than composing the flags yourself:
   *
   *     mutate-changed                 # the files changed against the base
   *     mutate-changed --files src/a.ts
   *     mutate-changed --dry-run       # the plan, and nothing else
   *     mutate-changed --full          # the deliberate audit: everything, no cache
   *
   * Measured end to end on a fixture with one unrelated 1.6s suite: 15.5s for
   * the whole tree and the whole suite, 3.4s for one mutated file with its one
   * test file, the same result either way (11 killed, 1 survived).
   *
   * WHAT IS ALREADY OPTIMAL and needs no setting: `checkers` defaults to []
   * (no type-checking pass over mutants), `disableTypeChecks` defaults to true,
   * and `disableBail` defaults to false. `ignoreStatic: true`, which drops the
   * mutants that run at module load, is available now that perTest is on — add
   * it if those mutants are noise for you.
   */

  /**
   * WHY concurrency AND timeoutMS ARE SET — the other way this gate lies, and
   * the one that costs an afternoon rather than a wrong answer.
   *
   * A test runner left at its default starts one process per CPU core, and each
   * of those starts the project's test command. Vitest fans out to one worker
   * per test file inside every one of them, so on a 10-core machine a
   * 3.2-second suite becomes nine concurrent suites of 48 workers each. Under
   * that load one suite run takes longer than Stryker's default 5 seconds per
   * mutant, so every mutant comes back as a TIMEOUT and the report says:
   *
   *     # killed 1   # timeout 2559   # survived 0
   *     % Mutation score: 100.00
   *
   * 100% made of timeouts is worse than a low score, because it is the number
   * you were hoping for. It is also the slowest possible run: 52 minutes for
   * 2560 mutants, with nothing learned at the end of it.
   *
   * The gate's `reject` pattern catches this ("Ran 0.00 tests per mutant"), but
   * only once the run is over. These two settings stop it happening: a few
   * runners rather than one per core, and a per-mutant timeout with room for the
   * tests a mutant runs plus whatever else the machine is doing. Measured on one
   * project and the same 167 mutants: 9m19s with one timeout, against 2559 of
   * 2560 timing out with the defaults.
   *
   * Size them together: `concurrency` times the time a mutant takes has to fit
   * comfortably inside `timeoutMS`. If a mutant is slower than a few seconds,
   * lower `concurrency` first — that costs throughput, while a timeout costs
   * both throughput and the answer.
   *
   * Size the number against what a mutant actually runs, and let
   * `mutate-changed` size it: with perTest a mutant is the tests that cover it,
   * usually one file's worth and under a second, so `cpuCount - 1` is safe, and
   * it passes that for a scoped run. This default has to stay safe for the
   * unscoped run too, where the dry run is the whole suite.
   *
   * One caveat, and it is why a scoped run's survivors still need reading by
   * hand: a mutant that only another module's test would kill now looks like a
   * gap. Confirm a survivor with `mutate-changed --full` before writing an
   * assertion for it.
   *
   * That confirmation only works if the cache changes with the scope. Stryker's
   * incremental report is keyed on the mutant, not on what ran: a mutant is
   * reused when its code did not change, and a *survivor* is reused when no test
   * was added (`incremental-differ.js`). Under `coverageAnalysis: "perTest"` the
   * report carries the per-test results, so a run scoped to one test file is not
   * the same as a whole-suite run to it — but the file is still per scope, and
   * `mutate-changed` keys it on the scope *and* on this file's contents, so
   * editing a setting here cannot reuse a verdict from the configuration before
   * it. That is the only version of this that stays correct by construction. By
   * hand, delete `reports/stryker-incremental*.json` whenever the scope changes.
   */
  concurrency: 3,
  timeoutMS: 30_000,

  reporters: ["json", "clear-text"],

  /** EDIT ME: the production files to mutate. Never include test files. */
  mutate: ["src/**/*.ts"],

  /**
   * The floor. Stryker exits non-zero below `break`, and that exit code is
   * what makes this a gate rather than a report — without it the gate passes
   * no matter how bad the score.
   *
   * Start at 60 and raise it as the suite grows. Do not chase 100: equivalent
   * mutants (different code, identical behavior) are undecidable in general
   * and estimated at 2-23% of all mutants, so a perfect score is unreachable
   * and the last few percent cost more than they are worth.
   */
  thresholds: { high: 100, low: 60, break: 60 },
};
