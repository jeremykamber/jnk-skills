# jnk-skills

The jnk development workflow as agent skills: a beat-based system (pickup → understand →
decide → design → implement → verify → debrief) plus general-purpose skills like `teach`.

Works with any agent that loads [Agent Skills](https://agentskills.io) — built and tested
with the pi coding agent.

## What's inside

- `skills/` — the skills (one directory per skill: `SKILL.md` plus references and scripts)
- `usage.md` — the practical guide: how to invoke the beats, answer gates, and manage context

## Install

Symlink or copy `skills/` into your agent's skill directory:

```bash
ln -s "$PWD/skills" ~/.agents/skills/jnk
```

Skills register as `/skill:jnk-*` (and `/skill:teach`).

## The beats

- `pickup` — resume work from the notebook
- `understand` — read the right things, build the shared model
- `decide` / `grill` — resolve decisions, one question at a time
- `design` — shape and route
- `implement` — checkpoints; each slice taught in layers
- `verify` / `debug` / `eval` — prove and review
- `debrief` — close the loop

See `usage.md` for the full modes and day-to-day mechanics.
