# jnk-verify-app: notes

Private notes for the human. The agent never sees this file.

**What:** Generate and maintain a project-local `verify-<app>` skill: launch, doctor, drive, evidence, cleanup, plus a feature map of what to drive, then keep the map honest on a periodic pass.

**When:** a project has no scripted way to drive the real app, so an agent cannot verify its own work and the human is the middleman.

**Why:** the agent cannot verify what it cannot run. Prove the generated skill once, or it is a draft. The maintenance pass fixes the map, never product code.

**Fits:** infrastructure that jnk-4-verify calls for its "exercise the change the way it is used" step; the feature map is operational and is not the acceptance spec in `features/*.feature`.

**Refs:** pstack's `create-verification-skill` and `maintain-verification-skill`; the workflow's "mechanical enforcement" philosophy (tools enforce principles, not aspirational text); AGENTS.md principle 8.
