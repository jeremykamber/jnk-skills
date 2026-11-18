# jnk-skills

A development workflow for coding agents, in steps you start yourself. You run
one skill, the agent does that job, a command proves the result, and the agent
stops. The skills are plain [Agent Skills](https://agentskills.io) files, built
and tested with the pi coding agent, and readable by any agent that loads them.

The repository makes one testable claim: deterministic gates make an agent's work
verifiable, and a short instruction set does more than a long one. `tools/bench`
measures both claims.

## Install

Requires Python 3 and the `lizard` package. Everything else is the standard
library, and `install.sh` checks for both.

```sh
git clone https://github.com/jeremykamber/jnk-skills
cd jnk-skills
./setup.sh
```

`setup.sh` links the tools onto `PATH`, links every skill and principle into your
agent's directories, and links `AGENTS.md` to `~/.agents/AGENTS.md`. It is safe
to run again.

```sh
./setup.sh --dry-run            # print what would change
./setup.sh --project <dir>      # also give a project a gate stack and an AGENTS.md
```

## What is inside

| Path | Holds |
| --- | --- |
| `skills/jnk-*` | The four build skills and the modes. One directory per skill, with deep material in `references/` that the agent reads on demand. |
| `skills/writing/` | The voice for everything a person reads. `AGENTS.md` points here. |
| `skills/misc/` | Non-coding skills: `teach`, `slides`, `create-exercise`, `explain`. |
| `tools/` | `gates`, `crap`, `depth`, `mutate-changed`, `bench`. Vendored from the uncle-bob-workflow kit, with a checksum manifest and `tools/sync-from-kit.sh`. |
| `checks/` | Tests for those tools. `./tools/gates` runs them. |
| `bench/` | The benchmark: seeds, series, tasks, arms, the matrix driver, and the results. |
| `rules/` | Named engineering principles, read on demand at `rule://<name>`. |
| `templates/` | A project `AGENTS.md`, gate stacks for TypeScript and Python, and opt-in stream rules. |
| `scripts/` | `test_docs.py` is the `voice` gate: a cap on `AGENTS.md` and a ban on filler words. `eval-nightly.sh` runs `jnk-eval` on a schedule. |
| `AGENTS.md` | The rules the agent loads on every turn. |
| `usage.md` | The day-to-day: how a session runs, and how to answer a gate. |

## The four build skills

Four skills carry a change from idea to history. Each has one job and one exit.
You start it. It stops at a gate that asks a question you can answer in one
word.

| Skill | Does |
| --- | --- |
| `jnk-design` | Reads the code, decides the direction, shapes the first slice, and routes the rest. Stops at the first gate. |
| `jnk-implement` | Builds one vertical slice at a time. A checkpoint before the next slice, and a ledger that never loses a slice. |
| `jnk-verify` | Runs the gate stack, exercises the real path, proves the blast radius, and audits the diff against `AGENTS.md`. |
| `jnk-commit` | Turns the checkpoints into a story of one-line conventional commits. |

The other skills cover the work beside those four:

- `jnk-oneshot` for a small, understood change in one pass.
- `jnk-debug` for broken behaviour. It reproduces first.
- `jnk-refactor` for structure without a behaviour change, with one reference per red flag.
- `jnk-attack` for adversarial tests.
- `jnk-grill` for a decision only you can make.
- `jnk-handoff` and `jnk-pickup` to cross a session boundary.
- `jnk-worktree` for a git worktree per session.
- `jnk-correct` to encode a repeated correction as a gate.
- `jnk-eval` to judge a session from its trace.
- `jnk-delegate` to hand work to another machine.
- `jnk-interrogate` to test your own understanding of a repo.
- `jnk-ui-design` and `jnk-verify-app` for interface work and scripted app runs.
- `jnk-legacy` maps the older names to the current skills.

Only `jnk-commit`, `jnk-grill`, `jnk-legacy`, and `writing` are model-invocable.
A model-invocable skill costs its description in the prompt on every turn, and
the choice of skill is yours.

## What a change produces

1. **`.ai/threads/<slug>.md`**: session state, gitignored. It holds the model and
   its IOUs, the route and its ledger, squawks, decisions, and where the last
   session stopped. One file, because five files that describe one thread drift
   apart.
2. **`docs/designs/<slug>.md`**: committed when the design will be re-read. It
   holds the contracts, the failure paths, and the trade-off that was chosen.
3. **A failing test** in `tests/acceptance/`: the spec. Written from the
   requirement, seen red before the code, and run by the `acceptance` gate. Not a
   Gherkin file, because step definitions are a second implementation of the code
   under test.

## The gates

`gates` runs a project's stack in order, stops at the first failure, and prints
the failing output. That output is the instruction.

```sh
gates --init --yes   # write the stack, inferring an adapter or taking --adapter
gates --list         # show the stack, and any config it cannot find
gates                # run it
gates --changed      # scope to changed files where the gate supports it
gates --keep-going   # run everything and report every failure
gates crap           # run one gate by name
```

`--init` infers a TypeScript or Python project and writes the matching stack from
`templates/`. It asks before it writes; `--yes` is the non-interactive answer.
`--adapter python` or `--adapter typescript` chooses explicitly.

Two features make the runner more than a task list.

**Output assertions.** A gate can require a pattern in the tool's output and
reject another. This catches a tool that exits 0 without doing its job, such as
dependency-cruiser that cruises zero modules, or Stryker that reports
`Ran 0.00 tests per mutant`.

**A ratchet.** `depth` decides nine of Ousterhout's fourteen red flags from the
source text. It fails only on a finding that is not in the committed baseline.
Day one on an old tree costs nothing, and the gate means "never worse than
yesterday".

`crap` scores a function as `comp^2 * (1 - cov)^3 + comp`. A complex function
with no test is the expensive place to change.

`mutate-changed` scopes Stryker to the changed files and the tests that import
them. It keeps a cache key per scope, and it refuses to start when a killed run
left files instrumented.

`bench` measures whether any of this makes the code better.

## The benchmark

```sh
./tools/bench --run ticket-desk-deep --arm baseline --arm workflow
./tools/bench --report
./tools/bench --self-test   # a stub agent, about ten seconds
```

A series applies a list of features in order to one repository. Three seeds are
in use: `ticket-desk-deep` grows a small CLI, `kynd-lib` adds a feature to a real
Next.js application, and `scratch-csvq` starts from an empty directory. The
benchmark asks what a single-shot test cannot: does the code survive being
extended by the person who wrote it? It follows
[SlopCodeBench](https://arxiv.org/abs/2603.24755) and reports two scores, both as
a share so that a 200-line repository and a 20,000-line one compare.

- **Erosion**: the share of complexity mass held by functions with cyclomatic
  complexity above 10, where `mass = CC * sqrt(SLOC)`. A function that grows
  branches gains mass. A function that is merely long does not.
- **Verbosity**: the share of lines that are structurally duplicated or flagged
  redundant, such as stub bodies, TODO markers, and unused imports.

Each checkpoint gets two correctness readings:

- **Strict**: every test passes, including the regressions of earlier
  checkpoints. The code still works.
- **Isolated**: this checkpoint alone passes. The work landed even though
  something earlier broke.

Arms are compared in a fixed order: correctness, then erosion, then verbosity,
then tokens. A cheaper arm that is less correct has not won. `bench` exits 1 when
the workflow loses on the first axis that differs.

`bench/matrix` runs the repeats as separate invocations, keeps every transcript,
and takes medians. A repeat in which a checkpoint got no model response is
discarded and run again.

The results are mixed, and `bench/RESULTS.md` reports them that way. The workflow
wins `ticket-desk-deep` on erosion and cost at equal correctness. It loses
`scratch-csvq` on erosion and tokens. On `kynd-lib` erosion reads zero for both
arms and the workflow costs more tokens, while finishing in a quarter of the wall
clock. Run-to-run variance is still larger than the gap between arms on a single
run.

The verifier runs from outside the repository, so the agent can never read or
edit it. A checkpoint with no code from the agent counts as unsolved. Quality is
averaged only over checkpoints that produced code.

## How the workflow decides

- You pilot and the agent drives. A skill ends by naming the next one and what it
  would do.
- A command that fails does not decay. A paragraph does.
- Design to the first gate: as far as the next thing that can prove you wrong.
- Gates direct attention. They do not replace it. The findings are a reading
  list, not a verdict.
- Every instruction must change a decision. The benchmark checks that it does.

For the rules, read `AGENTS.md`. For the day-to-day, read `usage.md`. For the
voice, read `skills/writing/SKILL.md`.
