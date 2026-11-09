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

Beats are invocable by you or by the agent. With `JNK_STRICT=1` exported, only
you start one.

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
./tools/bench --run ticket-desk --arm baseline --arm workflow
./tools/bench --report
```

Four features, applied in order to one repository, so what it measures is what
matters: whether the code gets worse as features accumulate. Per task it records
pass/fail (a verifier the agent cannot read), **slop** — the share of functions
that are over-complex or long, the duplicated-line share, and design findings per
file — plus tokens, cost and wall time. Three arms: no instructions, a short
`AGENTS.md`, and this workflow.

A failed task is excluded from the aggregate: slop in code that does not work
measures nothing.

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
