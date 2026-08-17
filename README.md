# jnk-skills

The jnk development workflow as agent skills: a beat-based system (pickup → explore →
design → implement → verify → commit) plus general-purpose skills like `teach`.

Works with any agent that loads [Agent Skills](https://agentskills.io) — built and tested
with the pi coding agent.

## What's inside

- `skills/` — the skills (one directory per skill: `SKILL.md` plus references and scripts)
- `usage.md` — the practical guide: how to invoke the beats, answer gates, and manage context
- `tools/complexity-analyzer` — CLI tool for cyclomatic complexity, maintainability index, and letter grades

## Install

Symlink or copy `skills/` into your agent's skill directory:

```bash
ln -s "$PWD/skills" ~/.agents/skills/jnk
```

Skills register as `/skill:jnk-*` (and `/skill:teach`).

## The beats

- `pickup` — resume work from the notebook
- `explore` — walk the code, think first, explore candidate directions
- `design` — choose direction with lenses, shape and route
- `implement` — checkpoints; each slice taught in layers, subagent validation
- `verify` / `debug` / `eval` — prove and review, AGENTS.md enforcement
- `commit` — write the history

See `usage.md` for the full modes and day-to-day mechanics.

## Key features

- **Write-in-the-moment persistence**: IOUs and squawks written to disk at every gate, not at debrief
- **Subagent architecture**: Slice validator, parallel execution with dependency graph, implementation reviewer (used in both implement and oneshot)
- **AGENTS.md enforcement**: Subagent checks diff against principles before verification
- **Anti-rationalization tables**: Intercept model rationalizations for skipping gates
- **Code complexity analysis**: CLI tool for cyclomatic complexity, maintainability index, letter grades

## The workflow

1. **Explore** (`/skill:jnk-explore`): Build shared mental model, think first, explore candidate directions
2. **Design** (`/skill:jnk-design`): Choose direction with lenses, write ADR, shape (ASCII, contracts, failure paths), route (vertical slices with dependencies)
3. **Implement** (`/skill:jnk-implement`): Follow route, red-green-refactor, subagent validation, parallel execution
4. **Verify** (`/skill:jnk-verify`): Run verification, AGENTS.md enforcement, reconcile IOUs
5. **Commit** (`/skill:jnk-commit`): Write the history

## Philosophy

- **You pilot, agent copilots**: You invoke each step, approve results
- **Gates make you think**: "Which option would you defend?" not just "approve?"
- **Write for the next engineer**: Obviousness over cleverness
- **Smallest coherent change**: Minimum viable change that fully solves the problem
- **Mechanical enforcement**: Tools and subagents enforce principles, not aspirational text
