/**
 * A drop-in replacement for Stryker's vitest test runner that fixes one bug.
 * Copy to the repository root next to `stryker.conf.cjs`.
 *
 * THE BUG. Under vitest 5 the official runner reports every mutant as SURVIVED
 * and prints "Ran 0.00 tests per mutant". The dry run and the coverage are
 * fine; the failure is one separator. Stryker asks the runner for the tests
 * covering a mutant by id — `tests/math.test.ts#math adds` — and the runner
 * turns the name half into a `testNamePattern` regex. It builds that name by
 * joining the suite chain with a SPACE (`math adds`), while vitest matches a
 * name filter against the ">"-joined full name (`math > adds`). Nothing
 * matches, vitest skips the whole file, zero tests execute, and a mutant that
 * nothing executes against cannot be killed. The official `collectTestName`
 * still joins with a space in 10.0.0, the latest release.
 *
 * Reproduce it in one line each way:
 *
 *     npx vitest run tests/math.test.ts -t "math adds"     # 3 skipped
 *     npx vitest run tests/math.test.ts -t "math > adds"   # 1 passed
 *
 * THE FIX. Rewrite the name half of each id into the form vitest matches,
 * before the official runner builds its filter. The names come from the same
 * task tree the official runner reads, so the mapping is exact rather than a
 * guess: a suite titled "a b" with a test "c", and a suite "a" with a test
 * "b c", both produce the space-joined "a b c", and only the tree knows which
 * is which.
 *
 * WHEN THE TREE IS NOT THERE YET. Stryker runs the dry run in ONE worker and
 * spreads the mutants across all of them, so a worker's first mutant has no
 * task tree to read. Those ids fall back to the file alone — an empty name
 * matches every test, so the whole file runs. That is the correct answer
 * (a superset of the covering tests) and merely slower; after that run the
 * tree is in the worker's state and every later mutant gets the precise
 * filter. What it must never do is pass the space-joined name through, which
 * is the silent bug this file exists to remove.
 *
 * WHAT THIS BUYS. `coverageAnalysis: "perTest"`, which the bug makes unusable:
 * Stryker then runs only the tests that cover each mutant, instead of the
 * whole suite per mutant, in-process instead of through a shell. That is the
 * configuration Stryker documents as the fast one, and it also unlocks
 * `ignoreStatic`. The command runner in `templates/stryker.conf.cjs` needs no
 * extra dependency and no plugin; this file is for when the suite is large
 * enough that running the whole suite per mutant is the thing that hurts.
 *
 * USAGE
 *
 *     // stryker.conf.cjs
 *     module.exports = {
 *       plugins: ["./stryker-vitest-runner.mjs"],
 *       testRunner: "vitest-fixed",
 *       coverageAnalysis: "perTest",
 *       ...
 *     };
 *
 * `npm i -D @stryker-mutator/vitest-runner` is required: this file delegates
 * to the official runner and only corrects the id. A `plugins` list replaces
 * Stryker's default discovery, which is why the schema is re-exported below —
 * without it the run dies with "Cannot read properties of undefined (reading
 * 'dir')" from inside the official runner. The official runner also writes one
 * `stryker-setup-<worker>.js` into the project root per worker and deletes it
 * on the way out, so an interrupted run leaves those behind: add
 * `stryker-setup-*.js` to `.gitignore`.
 *
 * VERIFY IT, DO NOT TRUST IT. Run `checks/test_mutation.sh` in the kit, which
 * pins a fixture with one mutant that must be killed and one that must
 * survive. A runner that reports zero killed is the bug; one that kills the
 * detectable mutant and reports the one real gap is this fix working. Do that
 * after any Stryker upgrade: this file reaches into the runner's context, and
 * the trade being made deliberately is that a change there fails loudly (a
 * crash, a missing test, or a whole-file run) rather than silently (a 0%
 * score).
 */

import path from "node:path";
import { commonTokens, declareFactoryPlugin, PluginKind, tokens } from "@stryker-mutator/api/plugin";
import { strykerPlugins as vitestRunnerPlugins, strykerValidationSchema } from "@stryker-mutator/vitest-runner";

const PLUGIN_NAME = "vitest-fixed";

export { strykerValidationSchema };

const official = vitestRunnerPlugins.find((plugin) => plugin.kind === PluginKind.TestRunner);
if (!official) {
  throw new Error(
    "stryker-vitest-runner: @stryker-mutator/vitest-runner is not installed, so there is " +
      'nothing to fix. Install it, or use testRunner: "command" instead.',
  );
}

/**
 * Every test task under a node, with the file path it belongs to. The path
 * comes from the top node's name rather than from `task.file`, which is absent
 * on some nodes and would silently produce an "unknown.js" key that matches
 * nothing.
 */
function* testTasks(node, filepath) {
  for (const child of node.tasks ?? []) {
    if (child.type === "test") {
      yield { test: child, filepath };
    } else {
      yield* testTasks(child, filepath);
    }
  }
}

/** The official runner's `collectTestName`, with the separator as a parameter. */
function nameWith(test, separator) {
  const parts = [test.name];
  for (let suite = test.suite; suite; suite = suite.suite) {
    parts.unshift(suite.name);
  }
  return parts.join(separator).trim();
}

function normalizeFilepath(filepath) {
  return path.relative(process.cwd(), path.resolve(filepath)).replace(/\\/g, "/");
}

/** `file#spaceJoinedName` -> `greaterThanJoinedName`, from the live task tree. */
function nameMap(ctx) {
  const map = new Map();
  for (const file of ctx?.state?.getFiles?.() ?? []) {
    const filepath = normalizeFilepath(file.name ?? "unknown.js");
    for (const { test } of testTasks(file, filepath)) {
      map.set(`${filepath}#${nameWith(test, " ")}`, nameWith(test, " > "));
    }
  }
  return map;
}

function createVitestFixedTestRunner(injector) {
  const base = official.factory(injector);
  let warned = false;

  return {
    capabilities: () => base.capabilities(),
    init: () => base.init?.(),
    dispose: () => base.dispose?.(),

    dryRun: (options) => base.dryRun(options),

    mutantRun(options) {
      const ids = options.testFilter ?? [];
      if (ids.length === 0) {
        return base.mutantRun(options); // no per-test filter: nothing to translate
      }

      const names = nameMap(base.ctx);
      let unresolved = 0;
      const fixed = ids.map((id) => {
        const name = names.get(id);
        if (name) {
          return `${id.slice(0, id.indexOf("#"))}#${name}`;
        }
        // No task tree in this worker yet. Run the whole file rather than a
        // name filter that cannot match anything.
        unresolved += 1;
        return `${id.slice(0, id.indexOf("#"))}#`;
      });

      if (unresolved > 0 && !warned) {
        warned = true;
        base.log?.warn?.(
          `stryker-vitest-runner: ${unresolved} test id(s) had no task tree to resolve yet ` +
            "(the dry run happens in one worker only); those mutants run their whole test " +
            "file instead of just the covering tests. Later mutants in this worker are precise.",
        );
      }

      return base.mutantRun({ ...options, testFilter: fixed });
    },
  };
}
createVitestFixedTestRunner.inject = tokens(commonTokens.injector);

export const strykerPlugins = [
  declareFactoryPlugin(PluginKind.TestRunner, PLUGIN_NAME, createVitestFixedTestRunner),
];
