---
name: jnk-verify-app
description: "Stand up and maintain a project-local skill that lets any agent launch the app, drive a feature the way a user does, capture evidence, and clean up, plus a feature map of what to drive. User-invoked only via /skill:jnk-verify-app."
disable-model-invocation: true
---

# Verify App

> The agent cannot verify what it cannot run.

## Purpose

The `jnk-4-verify` beat can run `gates` and a manual path, but many projects have no scripted way to drive the real app. When that is missing, the agent cannot verify its own work, and the human stays the middleman between the agent and its output: every "does it still work?" run happens in a window the agent cannot see, and the evidence lives in someone's memory. This skill builds that capability once, as a project-local skill, so every later session reuses the launch command, the selectors, the evidence path, and the teardown instead of rediscovering them.

Do not duplicate the verify beat. This generates infrastructure the verify beat then calls: a `verify-<app>` skill living with the project, and a feature map that says what to drive and what end state proves it worked. The point is mechanical enforcement: a command that fails, not prose that asks the agent to be careful.

## Steps

1. **Interview the repo, not the user.** Work out from the codebase:

   - **The surface a user touches:** web UI, CLI or TUI, desktop app, HTTP API, library, mobile app. Read the entry points, routes, commands, and menus.
   - **How the app launches locally:** prefer the repo's own documented dev command (README, `package.json` scripts, `Makefile`, `justfile`, `docker compose`). The command the maintainers run every day is the one to script.
   - **How an agent can drive it:** the existing test harness first, since it already knows the app's handles. Look for Playwright or Cypress config, `expect` or PTY scripts, curl-able endpoints, a remote debug port. Only when none exists, pick a generic recipe: a browser over CDP, tmux or a PTY, plain HTTP.
   - **What evidence proves behavior:** screenshots, terminal transcripts, response bodies, logs, exit codes, database state. Choose the artifact a reader can check without re-running the drive.
   - **Whether two instances can run side by side:** a shared port, a fixed data directory, a single global lock, or a dev server that writes one database are all reasons a second instance would corrupt the first. Give each run its own port and scratch state, or serialize.
   - **Ask the user only what the code cannot answer.** Which environment is authoritative, where a test account lives, and which feature matters most are questions for a human. The launch command, the selectors, and the data model are questions for the repo.

2. **Generate the skill.** Write `<project>/.agents/skills/verify-<app>/SKILL.md`, with frontmatter `name: verify-<app>` and a description that names the app, its surface, and when to reach for it. Every section is grounded in what the interview found, with no placeholders and no placeholder URLs:

   - **Launch:** the exact command, how to tell it is ready (a readiness line in the log, a health route, a port that answers), and how to tear it down.
   - **Doctor:** one read-only check that answers "is this instance worth driving?": the process is up, it is the right build, the port is owned by the instance we started rather than an older one, and auth is valid. A stale instance that still answers on the port is the failure this catches.
   - **Drive:** real selectors and commands from this repo. Prefer stable handles: ARIA labels, `data-testid` attributes, route paths, subcommands. A CSS path that depends on layout breaks on the next styling change.
   - **Evidence:** what to capture and where. Drive the real user path, never an internal setter or a test-only endpoint. Capture the action and the resulting state, not only the final screen. Check side effects too: the row in the database, the file on disk, the message on the queue.
   - **Cleanup:** kill what you started, never by process name. Record the PID or session handle at launch and use it. Cleanup removes instances and scratch state; it never removes the evidence.
   - **Helpers:** any script the skill ships is executable, and its invocation is shown in the skill body, so the next agent runs it rather than reading it.

3. **Seed the feature map.** Write `<project>/.agents/skills/verify-<app>/features/`: a `README.md` index plus one file per user-facing feature, starting with the top three to five taken from routes, CLI commands, menus, or docs. Each feature file answers, from the user's point of view, what the feature is, how to reach it, how to drive it with the harness, and what observable end state proves it works. The exact file shape, including its four headings, lives in `references/feature-map.md`; point the generated skill at its own copy. Keep this distinct from the acceptance spec at `features/<feature>.feature`: that file states required behavior, the map states how to reach the behavior and see it.

4. **Prove the generated skill once.** Before handing it over, run it end to end: launch, doctor, drive ONE mapped feature, capture evidence, clean up. After cleanup, confirm the evidence still exists at the location the skill names. Fix what fails, and run cleanup after every failed attempt, so no half-started instance survives a broken run. A generated skill that was never executed is a draft, not a deliverable. If the checkout does not build or start as-is, fix that first, or report precisely what blocks it, rather than shipping a skill that cannot run.

5. **Describe the maintenance loop.** The generated skill carries a periodic pass with four moves: (a) read the feature map for entries that are missing, extra, duplicated, or dead; (b) one read-only source reader per feature, to flag drift between the map and the code; (c) one live pass driving every mapped feature; and (d) exactly one outcome, `clean` (no changes), `changed` (one change set of proven corrections, confined to the verification skill's own directory, so its blast radius is that directory), or `blocked` (name the blocker). The loop never edits product code, and a product regression it finds is reported as a regression rather than papered over in the docs. Say the cadence only if the user asks.

## Do not

- Drive an instance you have not health-checked since it last did something surprising. Run Doctor first.
- Kill by process name. Record the PID or session handle and kill that.
- Trust a dry-run or test-mode flag by its name. Observe what it actually skips.
- Let cleanup eat the evidence. Kill instances and scratch state, keep the artifacts.
- Commit the generated skill without proving it once. An unrun skill is a draft.
- Edit product code from the maintenance pass. It reports a regression; it does not fix one.
- Confuse the feature map with the acceptance spec. `features/*.feature` holds required behavior; the map holds how to reach it.
- Ship a placeholder. A `TODO` in the Launch or Drive section is a skill that cannot run.

## Output

The generated skill (its path, the sections it carries, and the one feature proven) / The feature map seed (which features, and the index) / The proof run (what was launched, driven, captured, and cleaned up) / The maintenance loop (its four moves and its three outcomes) / Squawks for anything the proof run surfaced but did not fix

## Handoff

The generated `verify-<app>` skill is what `/skill:jnk-4-verify` calls when it exercises the change the way it is used: one command launches the app and drives the feature, and the captured evidence is what the verification report shows. Once the skill is proven, the next beat is user-invoked: recommend `/skill:jnk-4-verify` for the change in hand, and log anything the proof run surfaced but did not fix as a squawk in the notebook (`.ai/contexts/<slug>/`). Do not start the next beat.
