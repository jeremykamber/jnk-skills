# jnk-skills

**jnk-skills** is a beat-based development workflow, packaged as agent skills: pickup → explore →
design → implement → verify → commit, plus the non-coding skills in `skills/misc/`
(`teach`, `slides`, `create-exercise`).

Works with any agent that loads [Agent Skills](https://agentskills.io) — built and tested
with the pi coding agent.

## What's inside

- `skills/` — coding skills (one directory per skill: `SKILL.md` plus references and scripts)
- `skills/misc/` — non-coding skills (`teach`, `slides`, `create-exercise`), same layout
- `tools/` — the gate tooling (`gates`, `crap`, `depth`) and the adapters `gates --init` writes
- `checks/` — the tools' own test suite; `./tools/gates` runs it, and `gates.json` is that stack
- `install.sh` — puts the tools on your PATH and checks what they need
- `usage.md` — the practical guide: how to invoke the beats, answer gates, and manage context
- `templates/gates.json` — the recommended gate stack, for a project's `gates.json`
- `templates/` — the gate configs and the starting shapes for a project's constitution and acceptance spec

## Install

```sh
./setup.sh              # tools + skills
./setup.sh --dry-run    # show what would change, change nothing
```

It checks what the tools need (one Python package, `lizard`), puts `gates`, `crap` and `depth` on your PATH from `./tools`, and symlinks each skill flat into your agent's skill directory — one or two levels deep, so `skills/misc/` works without exposing a `misc` skill. Safe to re-run; existing symlinks are replaced and nothing is deleted. `./install.sh` alone does the tools and their dependencies, without the skills.

Skills register as `/skill:jnk-*` (and `/skill:teach`, `/skill:slides`, `/skill:create-exercise`).

The beats verify by running `gates`, which lives in `./tools` with the rest of the gate tooling — vendored from the `uncle-bob-workflow` kit so this checkout stands alone: clone it, run `./setup.sh`, and every beat works with no second repository to find. `tools/VENDORED.md` records where each file came from and `tools/sync-from-kit.sh` moves the copy forward; the `vendored` gate in `gates.json` fails the moment the copy drifts, so the one thing a copy must not do — drift silently — is the one thing it cannot do.

## Stand up a project

```sh
./setup.sh --project <dir>   # gates --init, then the jnk-skills stack
```

Or by hand, if the tools are already on your PATH:

```sh
cd <dir>
gates --init                            # gates.json + the configs the stack declares
cp <jnk-skills>/templates/gates.json .    # the fuller stack (acceptance, coverage, build, e2e)
```

`gates --init` copies the adapter for the project's language, along with every config file that adapter declares it needs. Use it rather than copying by hand: one of those files is a dotfile, and the wrong name makes the arch gate cruise nothing at all — an easy mistake to make, and the reason the command exists.

`templates/` carries the three configs the `arch` and `mutation` gates read — `.dependency-cruiser.cjs`, `stryker.conf.cjs`, and `stryker-vitest-runner.mjs`, the plugin that fixes Stryker's broken vitest runner and makes `coverageAnalysis: "perTest"` work — it is what `stryker.conf.cjs` ships (measured 3m39s -> 22-40s on a real project through `mutate-changed`, same verdicts) — so `gates --init` can write them into a project with no other checkout on the machine. They are vendored from the kit and tracked by `tools/vendored.sha256` like the rest of the tooling: a copy of a gate config is a risk, and an unrecorded copy is a silent one.

Then edit the lines marked `EDIT ME`: the layers in `.dependency-cruiser.cjs`, and the test command in `stryker.conf.cjs`. Delete any gate the project has no tooling for, and bring gates back one at a time.

`gates --list` shows the stack and warns about any config it cannot find. `gates` runs it.

**A repo with no stack gets one, it does not get a note saying there isn't one.** Any beat that reaches for the gates — verify, a checkpoint, pickup — and finds no `gates.json` stands the stack up first:

```sh
gates --init              # infers the adapter from the project; --adapter <name> when it cannot
depth --update-baseline   # accept today's design findings, so the ratchet has something to ratchet against
gates --list              # the stack, and any config file it cannot find
```

The third line is the cheap one: it names the config files that are missing. `gates` itself is what shows the gates whose tooling is absent — a young project cannot run everything the adapter lists, so delete those gates, bring them back as the tooling lands, and name what was dropped. `depth --update-baseline` is day-one debt accepted, not triage done — the baseline is a ratchet, and the findings in it are still there to read. A missing `AGENTS.md` is the same kind of gap: write it from `templates/constitution.md` before auditing a diff against it.

## The beats

- `pickup` — resume work from the notebook
- `1-explore` — walk the code, think first, explore candidate directions
- `2-design` — choose direction with lenses, shape and route
- `3-implement` — checkpoints; each slice taught in layers, subagent validation
- `4-verify` / `debug` / `eval` — prove and review, AGENTS.md enforcement
- `commit` — write the history

See `usage.md` for the full modes and day-to-day mechanics.

## Key features

- **Deterministic gates**: the beats verify by running a command, not by reaching a judgment. `gates` runs the project's stack, stops at the first failure, and prints the failing output — the output *is* the instruction. A gate that cannot fail is treated as worse than no gate. Mutation is differential by default — `mutate-changed` scopes the run to the changed files and the tests that import them — because the whole-tree audit is the run people stop doing.
- **The design debt is measured, not debated**: `depth` decides nine of Ousterhout's red flags from the source text — shallow methods, pass-throughs, leaked literals and shapes, co-change without a dependency, needless exports, forwarded parameters, the two comment defects — and ratchets them against a committed baseline. So the claim a change makes is "no *new* finding", and the ledger to read is its own: what it introduced, and what it retired. Design reads the readings before choosing a direction, verify reads the ledger before reporting, and a refactor is measured by the debt it pays off. What the flags cannot decide — leakage, conjoining, vague names — belongs to a reviewer that reads, and the two meet in one findings format.
- **Evidence is a run, not a suite**: a green suite written beside the code proves the implementation matches itself, bugs included — the failure mode most likely to fool an agent and its reviewer. A beat that changes behavior exercises the real path and shows what came back; a path it could not reach is named as unverified rather than assumed.
- **The acceptance spec is executable**: design writes `features/<feature>.feature` in the language of the problem, implementation makes it run and turns the scenarios green. The `acceptance` gate parses the file rather than trusting a transcription of it, so the spec and the tests cannot drift apart.
- **Write-in-the-moment persistence**: IOUs and squawks written to disk at every gate, not at debrief
- **Subagent architecture**: Slice validator, parallel execution with dependency graph, and the review panel — six seats over one diff (logic and APIs; leakage and obscurity; module shape; generality and repetition; simplification; a primed bug hunt), read in parallel, repaired by one writer
- **Adversarial review is a panel, not a generalist**: one reviewer reads everything the same way and misses what a seat with a single question catches. Three of the seats own a group of Ousterhout's red flags; one is the simplification seat, which asks the question nobody else does — why is this so complicated?; one hunts correctness and dead code; one is primed that the bugs are there. Each seat is briefed on why its group costs maintainability and which moves retire it, and returns a finding with the move already chosen — `depth --explain`'s menu for the nine flags the tool decides, the seat brief's for the rest.
- **AGENTS.md enforcement**: a subagent audits the diff against the project's `AGENTS.md` itself — never a restatement of it, because a copied principle list drifts silently
- **Anti-rationalization tables**: Intercept model rationalizations for skipping gates
- **Gates that target attention**: the teach leads with what the gates flagged — CRAP hotspots, coverage gaps, mutation survivors, arch violations, new design findings — so review attention goes where the risk actually is

## The workflow

1. **Explore** (`/skill:jnk-1-explore`): Build shared mental model, think first, explore candidate directions
2. **Design** (`/skill:jnk-2-design`): Read the design the code already has (`depth report`), choose direction with lenses, write ADR, shape (ASCII, contracts, failure paths, the acceptance spec), route (vertical slices with dependencies) — as far as the first gate
3. **Implement** (`/skill:jnk-3-implement`): Follow route, red-green-refactor, gates at each checkpoint, subagent validation, the review panel on risky slices, parallel execution. Slice one wires the acceptance spec so it runs; every later slice turns more of it green
4. **Verify** (`/skill:jnk-4-verify`): Run the gate stack, read the change's own design ledger, exercise the real path, AGENTS.md enforcement, reconcile IOUs
5. **Commit** (`/skill:jnk-commit`): Write the history

## Philosophy

- **You pilot, agent copilots**: You invoke each step, approve results
- **Gates make you think**: "Which option would you defend?" not just "approve?"
- **Write for the next engineer**: Obviousness over cleverness
- **Smallest coherent change**: Minimum viable change that fully solves the problem
- **Mechanical enforcement**: Tools enforce principles, not aspirational text. The beats verify by running `gates` and reading an exit code; a subagent audits the diff against `AGENTS.md` itself. Prompt text decays in a long context and copied lists drift silently — a command that fails does neither.
- **Plan to the first gate**: Design as far as the next thing that can prove you wrong, then build slice 1 and let the code and the gates correct the rest. Ceremony is what you pay when you cannot verify cheaply; gates buy it back.
- **Gates target attention, they do not replace it**: the CRAP hotspots, coverage gaps, survivors and arch violations are a reading list — they say where the risk is, and the layered teach walks you through it. You stay close to the code by knowing where to look, not by reading all of it.
