# Using the workflow

You decide when a step starts and approve its result; the agent does one job at a
time. This is the day-to-day.

## The short version

- **You invoke a skill, it works, it stops.** The agent never starts the next one
  silently — it names it and says what it would do. Skills are user-invoked by
  design: a model-invocable skill costs its description in the prompt on every
  turn, and choosing the skill is your call.
- **Every skill ends with a question you can answer in a word.** "Which slice
  scares you?", "Does this model surprise you?", "Approve the route?"
- **Small fix → `jnk-oneshot`. Anything else → `jnk-design` first.**
- **Broken behaviour → `jnk-debug`.** Reproduce, gate the diagnosis, prove the
  fix on the original failure.
- **A decision only you can make → `jnk-grill`.** One question at a time, with a
  recommendation attached.
- **Context at ~60% → finish the skill or `jnk-handoff`, then `jnk-pickup`.**
- **A skill proves it worked by running `gates`.** Verification is a command, not
  a judgment.
- **Everything you read follows the `writing` skill.** Answer first, next action
  last, plain English. `AGENTS.md` points at it rather than repeating it.

## Where state lives

| What | Where | Committed |
| --- | --- | --- |
| Model, IOUs, route, ledger, squawks, decisions, where you stopped | `.ai/threads/<slug>.md` | no — session state |
| The design, when it will be re-read | `docs/designs/<slug>.md` | yes |
| The spec | `tests/acceptance/` | yes |
| Durable facts about the system | `docs/` | yes |

One thread file, not five. If you cannot find where the work stands, read it —
`jnk-pickup` does exactly that.

`.ai/` is gitignored by `setup.sh` and by this repo's `.gitignore`. Session state
that gets committed becomes a second, stale source of truth.

## A session

**Fresh work:**

> `/skill:jnk-worktree`
> New work: save and reload tickets.

The agent creates `.worktrees/<slug>`, installs, runs `gates` for a baseline, and
asks whether to start.

> `/skill:jnk-design`
> Tickets need to survive a restart.

It reads three or four files, writes `.ai/threads/ticket-store.md`, and comes back
with the model, the options, and the trade-off. It asks which option you would
defend. Then it shapes slice one, writes the failing test, and routes the rest.

> `/skill:jnk-implement`
> Slice 1.

Per slice: the plan, the red test, the checkpoint, the observed run, a short
teach, a checkpoint commit. The ledger is restated at every checkpoint.

> `/skill:jnk-commit`, then `/skill:jnk-verify`

## Answering a gate

- `y` — proceed.
- `drop the VPS route` — steer.
- `also check whether research has the same bug` — add scope.

Scope changes during implementation are normal. The agent restates the ledger —
done / in flight / owed / deferred — so nothing is lost. If it reorders silently,
that is a bug.

A gate that asks you something real ("which slice scares you?") is doing its job.
If you find yourself answering "yep" without thinking, you are no longer in the
loop, and the workflow has stopped working.

## Reading what the agent wrote

Each checkpoint teaches the slice in layers: where it sits, the flow, the two
decisions that matter, what is plumbing, and the failure modes — leading with
what the gates flagged. Probe where you care:

> "Walk me through why each abstraction exists."
> "Show me exactly where that guarantee comes from."

If the agent cannot point at the line, that is a finding, not a shrug.

## The gates

`gates` runs the stack, stops at the first failure, prints the output.

| Skill | Runs |
| --- | --- |
| `jnk-implement` | `gates types lint unit` at each checkpoint; `gates acceptance` when a spec test should move |
| `jnk-implement` (risky slice) | `mutate-changed --files <path>` and the two review seats |
| `jnk-verify` | the whole stack, `depth --changed --base <ref>`, the real path |
| `jnk-attack` | `mutate-changed` over the change |
| `jnk-refactor` | `depth --changed` for `paid` and `new` |

`mutate-changed` without arguments is the deliberate audit, not a checkpoint.
A scoped run's survivors must be confirmed with `--full` before you call them an
assertion gap: the scoped run only sees the tests that import the file.

**A repo with no stack** can be stood up — `gates --init --yes`, then
`depth --update-baseline`, then `gates --list` and delete the gates whose tooling
is missing. It writes files into the project, so ask first; `gates --init` without
`--yes` and without a terminal writes nothing.

**Never weaken a gate to go green.** A threshold is your call, in its own commit,
with the reason. An absent stack is not a threshold.

## Debugging the workflow itself

```sh
./tools/gates                        # the tools' own tests
./tools/bench --self-test            # the benchmark, with a stub agent
./tools/bench --run ticket-desk-deep --arm baseline --arm workflow
```

The arms are compared correctness first, then erosion, then verbosity, then
tokens — in that order and no other. If the workflow is less correct or dirtier
than a 15-line `AGENTS.md`, cut skills until it is not. That is the only argument
that settles it.
