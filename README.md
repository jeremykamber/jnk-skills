# jnk-skills

**jnk-skills** is a beat-based development workflow, packaged as agent skills: pickup → explore →
design → implement → verify → commit, plus the non-coding skills in `skills/misc/`
(`teach`, `slides`, `create-exercise`).

Works with any agent that loads [Agent Skills](https://agentskills.io) — built and tested
with the pi coding agent.

## What's inside

- `skills/` — coding skills (one directory per skill: `SKILL.md` plus references and scripts)
- `skills/misc/` — non-coding skills (`teach`, `slides`, `create-exercise`), same layout
- `usage.md` — the practical guide: how to invoke the beats, answer gates, and manage context
- `templates/gates.json` — the recommended gate stack, for a project's `gates.json`

## Install

```sh
./setup.sh              # tools + skills
./setup.sh --dry-run    # show what would change, change nothing
```

It finds the `uncle-bob-workflow` kit (set `KIT=` if it lives somewhere unusual), runs the kit's installer to put `gates` and `crap` on your PATH, and symlinks each skill flat into your agent's skill directory — one or two levels deep, so `skills/misc/` works without exposing a `misc` skill. Safe to re-run; existing symlinks are replaced and nothing is deleted.

Skills register as `/skill:jnk-*` (and `/skill:teach`, `/skill:slides`, `/skill:create-exercise`).

The beats verify by running `gates`, which the kit provides — and this repo deliberately carries no copy of it, or of the gate configs. Two copies of a gate drift silently, the same way a copied principle list does.

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

jnk-skills deliberately does not carry its own copies of `.dependency-cruiser.cjs` or `stryker.conf.cjs`. Two copies of a gate config drift the same way a copied principle list does, silently, with nothing to catch it.

Then edit the lines marked `EDIT ME`: the layers in `.dependency-cruiser.cjs`, and the test command in `stryker.conf.cjs`. Delete any gate the project has no tooling for, and bring gates back one at a time.

`gates --list` shows the stack and warns about any config it cannot find. `gates` runs it.

## The beats

- `pickup` — resume work from the notebook
- `1-explore` — walk the code, think first, explore candidate directions
- `2-design` — choose direction with lenses, shape and route
- `3-implement` — checkpoints; each slice taught in layers, subagent validation
- `4-verify` / `debug` / `eval` — prove and review, AGENTS.md enforcement
- `commit` — write the history

See `usage.md` for the full modes and day-to-day mechanics.

## Key features

- **Deterministic gates**: the beats verify by running a command, not by reaching a judgment. `gates` runs the project's stack, stops at the first failure, and prints the failing output — the output *is* the instruction. A gate that cannot fail is treated as worse than no gate.
- **Write-in-the-moment persistence**: IOUs and squawks written to disk at every gate, not at debrief
- **Subagent architecture**: Slice validator, parallel execution with dependency graph, implementation reviewer (used in both implement and oneshot)
- **AGENTS.md enforcement**: a subagent audits the diff against the project's `AGENTS.md` itself — never a restatement of it, because a copied principle list drifts silently
- **Anti-rationalization tables**: Intercept model rationalizations for skipping gates
- **Gates that target attention**: the teach leads with what the gates flagged — CRAP hotspots, coverage gaps, mutation survivors, arch violations — so review attention goes where the risk actually is

## The workflow

1. **Explore** (`/skill:jnk-1-explore`): Build shared mental model, think first, explore candidate directions
2. **Design** (`/skill:jnk-2-design`): Choose direction with lenses, write ADR, shape (ASCII, contracts, failure paths), route (vertical slices with dependencies) — as far as the first gate
3. **Implement** (`/skill:jnk-3-implement`): Follow route, red-green-refactor, gates at each checkpoint, subagent validation, parallel execution
4. **Verify** (`/skill:jnk-4-verify`): Run the gate stack, AGENTS.md enforcement, reconcile IOUs
5. **Commit** (`/skill:jnk-commit`): Write the history

## Philosophy

- **You pilot, agent copilots**: You invoke each step, approve results
- **Gates make you think**: "Which option would you defend?" not just "approve?"
- **Write for the next engineer**: Obviousness over cleverness
- **Smallest coherent change**: Minimum viable change that fully solves the problem
- **Mechanical enforcement**: Tools enforce principles, not aspirational text. The beats verify by running `gates` and reading an exit code; a subagent audits the diff against `AGENTS.md` itself. Prompt text decays in a long context and copied lists drift silently — a command that fails does neither.
- **Plan to the first gate**: Design as far as the next thing that can prove you wrong, then build slice 1 and let the code and the gates correct the rest. Ceremony is what you pay when you cannot verify cheaply; gates buy it back.
- **Gates target attention, they do not replace it**: the CRAP hotspots, coverage gaps, survivors and arch violations are a reading list — they say where the risk is, and the layered teach walks you through it. You stay close to the code by knowing where to look, not by reading all of it.
