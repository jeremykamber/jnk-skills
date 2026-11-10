# jnk-skills

A beat-based development workflow for coding agents: **design → implement →
verify → commit**, plus the modes beside them. Built and tested with the pi
coding agent; the skills are plain [Agent Skills](https://agentskills.io) files
and load anywhere that reads them.

The claim this repository makes is small and testable: **deterministic gates make
an agent's work verifiable, and a short instruction set beats a long one.**
`tools/bench` measures both.

## What's inside

- `skills/jnk-*` — one directory per beat. `jnk-design`, `jnk-implement`,
  `jnk-verify`, `jnk-commit`, and the modes: `oneshot`, `debug`, `grill`,
  `attack`, `refactor`, `handoff`, `pickup`, `worktree`, `correct`, `verify-app`,
  `interrogate`, `eval`, `delegate`, `legacy`.
- `skills/misc/` — non-coding skills (`teach`, `slides`, `create-exercise`,
  `explain`).
- `tools/` — the gate tooling: `gates`, `crap`, `depth`, `mutate-changed`, `bench`.
- `bench/` — the benchmark: a four-feature series on one growing repository, three
  arms, and a slop score. `--self-test` runs it with a stub agent in ten seconds.
- `rules/` — named engineering principles, installed as rulebook rules the agent
  reads on demand at `rule://<name>`.
- `checks/` — the tools' own tests. `./tools/gates` runs them.
- `AGENTS.md` — the machine's universal rules, linked to `~/.agents/AGENTS.md`.
- `templates/` — a project's `AGENTS.md`, the recommended gate stack, and the gate
  configs `gates --init` writes.

## Install

```sh
./setup.sh              # tools + skills + the global rules file
./setup.sh --dry-run    # show what would change
./setup.sh --project <dir>   # a new project: gate stack + its AGENTS.md
```

## The three artifacts

Everything else this workflow used to write is gone. A change produces:

1. **`.ai/threads/<slug>.md`** — gitignored session state: the model and its
   IOUs, the route and its ledger, squawks, decisions, and where the last session
   stopped. One file, because five files that describe one thread drift apart.
2. **`docs/designs/<slug>.md`** — committed, when the design will be re-read:
   contracts, failure paths, the trade-off that was chosen.
3. **A failing test** — the spec. Written from the requirement, seen red before
   the code, run by the `acceptance` gate. Not a Gherkin file: step definitions
   are a second implementation of the thing under test.

## The beats

| Beat | What it does |
| --- | --- |
| `jnk-design` | Understand, decide, shape slice one, route the rest. Stops at the first gate. |
| `jnk-implement` | One vertical slice at a time, a checkpoint before the next, a ledger that never loses a slice. |
| `jnk-verify` | The gate stack, the real path exercised, the blast radius proved, the diff audited against `AGENTS.md`. |
| `jnk-commit` | Checkpoints become a story of one-line conventional commits. |

You start a beat; the agent follows it and stops at the next gate. Only
`jnk-grill` and `jnk-legacy` are model-invocable — every other beat's description
would otherwise cost prompt tokens on every turn, for a decision the user is
making anyway.

## The gates

`gates` runs a project's stack in order, stops at the first failure, and prints
the failing output — that output is the instruction.

```sh
gates --init --yes    # write the stack (asks first; --yes for scripts)
gates --list          # the stack, and any config it cannot find
gates                 # run it
```

Two things make it more than a task runner.

**Output assertions.** A gate can require a regex in the tool's output and reject
another. That catches the worst failure: a tool that exits 0 without doing its
job — dependency-cruiser cruising zero modules, Stryker reporting `Ran 0.00 tests
per mutant`.

**A ratchet.** `depth` decides nine of Ousterhout's fourteen red flags from the
source text and fails only on a finding that is not in the committed baseline.
Day one on an old tree is free; the gate means "never worse than yesterday".

`mutate-changed` scopes Stryker to the changed files and the tests that import
them, with a cache key per scope and a refusal to start when a killed run left
files instrumented. `bench` measures whether any of this makes the code better.

## The benchmark

```sh
./tools/bench --run ticket-desk-deep --arm baseline --arm workflow
./tools/bench --report
```

Five features applied in order to one repository, so what it measures is what
matters: whether the code survives being extended by whoever wrote it. The
instrument follows [SlopCodeBench](https://arxiv.org/abs/2603.24755):

- **strict** — every test passes, earlier checkpoints' regressions included. The
  code still works.
- **isolated** — this checkpoint alone passes. The work landed even though
  something earlier broke.
- **erosion** — the share of complexity mass held by functions with cyclomatic
  complexity above 10, where `mass = CC × √SLOC`. A function that quietly grows
  branches accumulates mass; a function that is merely long does not.
- **verbosity** — the share of lines that are structurally duplicated or flagged
  redundant (stub bodies, TODO markers, imports nothing uses). A documented
  subset of the paper's pattern set.

Arms are compared **lexicographically: correctness → erosion → verbosity →
tokens**. A cheaper arm that is less correct has not won, and `bench` exits 1
when the workflow loses on the first axis that differs.

A verifier runs from outside the repository, so the agent can never read it or
edit it. A checkpoint the agent never produced code for counts as unsolved;
quality is averaged only over checkpoints that produced code, never imputed.

## Philosophy

- **You pilot, the agent drives.** Beats end by naming the next one and what it
  would do.
- **Mechanical enforcement over aspirational text.** A command that fails does not
  decay; a paragraph does.
- **Plan to the first gate.** Design as far as the next thing that can prove you
  wrong, then build slice one.
- **Gates target attention, not replace it.** The findings are a reading list, not
  a verdict.
- **Fewer words, more teeth.** Every instruction here earns its place by changing
  a decision, and the benchmark is how that is checked.

See `usage.md` for the day-to-day mechanics.
