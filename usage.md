# Using the Workflow — a practical guide

You are the pilot; the agent is the copilot. You decide when each step starts, you approve each step's result, and the agent does one job at a time. This guide is the day-to-day mechanics — what to type, what you'll see, and what to do when the context fills up. (The philosophy lives in each skill's `## About` block.) Every session should leave better software AND better understanding — both, or it's incomplete.

## The short version

- **You invoke, it works, it stops.** Type `/skill:jnk-N-name` to start a step. The agent never starts the next step on its own — it ends by *recommending* it.
- **Every step ends with a question.** "Sound good?", "Approve the route?", "Ready for slice N?" — that's a gate. Your answer is the workflow. One word usually suffices.
- **Checkpoints teach in layers.** Each implement checkpoint walks you through the slice — where it sits, the flow, the critical bits, the plumbing to skip — and invites your probes. You don't read every line; you pull where you care, and the agent backs its claims with lines.
- **Small fix → one-shot. Anything else → the beats.**
- **Broken behavior → jnk-debug.** Reproduce first, gate the diagnosis, verify the fix on the original failure.
- **Context at ~60% → finish the step, start a fresh session, pickup.**

## The modes

| Mode | Use it for | What happens |
| --- | --- | --- |
| `/skill:jnk-oneshot` | Small, well-understood fixes — the ~80% case | One pass, no questions: reads just enough, smallest change, verifies, reports — the commit is your call via /skill:jnk-commit. |
| `/skill:jnk-debug` | Behavior is wrong, cause unknown | Reproduce → diagnose → gate the diagnosis → smallest fix → verify on the original failure. Escalates when the fix is large-scale. |
| **Expedited** (no skill — just skip beats) | Small feature that needs some thought | understand → decide → design → implement → verify, with gates. |
| **Full beats** | Anything fuzzy, architectural, or risky | The whole arc — understand, decide, design (shape + route), implement, verify, debrief — plus brainstorm when fuzzy, gates between every one. |

Rule of thumb: start with one-shot. If it tells you the change outgrew it (it "escalates"), switch to the beats.

## Starting a session

**Fresh feature — isolate first, then the first beat:**

> You: `/skill:jnk-worktree`
> New work: the persona profile/backstory split.
>
> Agent: creates `.worktrees/<slug>` + branch, installs deps, runs a baseline, then asks: "Ready for the first beat?"
>
> You: `/skill:jnk-1-understand` — and off you go.

**Continuing work — just pickup, it reads the notebook:**

> You: `/skill:jnk-0-pickup`
> Continue the persona work.
>
> Agent: "Resuming *persona-pipeline*: model agreed, IOUs 1–3 in scope, squawks open on the cluster prompt. Next beat: decide."

## Invoking beats and answering gates

Type the skill, then say what you want in plain language.

> You: `/skill:jnk-1-understand`
> Strategy personas come back with empty values/fears/interests. Fields exist, but [].
>
> Agent: restates the request, proposes a reading list, then: "Sound good — or would you steer the list differently? I won't read anything until you confirm."

**Answering a gate — approve, steer, or add scope:**

> You: `y` — proceed as proposed.
> You: `drop the VPS route from scope, keep the rest` — steer it.
> You: `also check whether research has the same bug` — add scope.

Adding scope mid-implementation is normal. The agent should re-state the slice ledger out loud — *done / in flight / owed / deferred* — so nothing gets lost. If it reorders silently, that's a bug; the eval skill exists to catch it.

Many gates now ask you something, not just "approve?": "Which option would you defend?", "Which slice scares you?", "What would you want to see to trust this?", and the debrief's teach-back. That's deliberate — a gate that makes you think is the anti-rubber-stamp. If you catch yourself saying "yep" without a thought, the workflow is telling you you're no longer in charge.

One more thing the agent will name at decision time: a **thread name** (e.g. `persona-a-profile-backstory`). It threads through the branch, the route, and the log — useful when you're juggling several agents.

## Reading what the agent wrote — the layered walkthrough

The implement checkpoint (`/skill:jnk-5-implement`) teaches each slice in layers — where it sits, how data flows through it, the critical decisions (and the agent's least-confident choices), and what's mundane plumbing you can safely skip. Depth scales with the slice's risk: mechanical slices get the two-line version; risky ones get the full teach plus the adversarial reviewer's findings.

Use the loop — the agent is your tutor, not your authority:

> You: "Walk me through this — teach me why each abstraction exists and what it assumes."
> You: "What are the failure modes?" / "Give me three ways this could be wrong."
> You: "Show me exactly where that guarantee comes from."

When you ask it to back a claim, it must point at specific lines — if it can't, that's a finding, not a shrug. Verify the claims you care about against the code; skip the rest. Waving the teach ("skip it, I trust this one") is always a valid answer — this is layered understanding, not line-by-line reading. The same loop works on any agent's output, opencode included.

## The one-shot, in practice

> You: `/skill:jnk-oneshot`
> Fix the stale "strategy (default)" log line in GeneratePersonasUseCase — it's misleading.
>
> Agent: one-line restate → reads the file → makes the smallest change → runs the test → reports — then suggests /skill:jnk-commit for the history.

No gates. If the request is ambiguous it asks once, then goes. If the change turns out bigger than one shot, it stops and says so — that's the escalate.

## The notebook — the memory you never read

The agent writes its understanding and session log to `.ai/contexts/<date>-<feature>/` (gitignored, local to the project). You don't need to look at it. It exists so a *future* session — or a crash, or a context split — can pick up the thread. `pickup` reads it; nothing is remembered unless it's written. **Decisions, designs, and system facts live in the codebase instead**: `docs/adr/` (written by decide), `docs/designs/` (written by design — the mockups, contracts, call stacks, test shapes), and `docs/external/` (written by oneshot and debrief when they learn something durable) — committed, stable paths, free context for every future session.

## Where everything lives

| Artifact | Written by | Lives in | Committed? |
| --- | --- | --- | --- |
| Understanding (model, IOUs) | jnk-1-understand | `.ai/contexts/<feature>/understanding.md` | no — session state, converges |
| Decision record | jnk-3-decide | `docs/adr/<thread>.md` | yes |
| Program design (mockup, contracts, call stack, test shapes) | jnk-4-design | `docs/designs/<feature>/` | yes |
| Route / slice ledger | jnk-4-design → jnk-5-implement | `.ai/contexts/<feature>/plans/01-initial.md` | no — living document |
| Spikes, throwaway prototypes | jnk-4-design | `.ai/contexts/<feature>/designs/` | no — throwaway |
| Worklog | jnk-7-debrief | `.ai/contexts/<feature>/notes.md` | yes |
| Verification results | jnk-6-verify | `.ai/contexts/<feature>/verification/` | when needed |
| System facts (env, integrations) | jnk-7-debrief / jnk-oneshot | `docs/external/` | yes |

The one-line rule: **if a future session or future feature needs it, it's committed in `docs/`; if only this feature's continuation needs it, it's in the notebook.**

## Squawks — debt, logged not hidden

When the agent notices something wrong but it's not part of the current change, it logs a squawk instead of silently fixing it:

> `[squawk] low | cluster prompt | same "standard structure" weakness | deferred, cluster unused`

Your options: fix it now, defer it, or ignore it — but it's never silently forgiven. It lands in the notebook at verify or debrief, so a future session sees it.

## Session hygiene — when to split

Attention degrades as the context fills, no matter how big the window is. **Keep utilization under ~60%** — the rule lives here (Session hygiene). Hitting it is a signal to avoid new heavy work — not a panic button. **No instrument needed:** every beat ends with its state on disk, so a reset is free — when the session feels heavy, finish the beat and start fresh; pickup reads the files.

**What to do at ~60%:**

1. **Finish the current beat.** Its remaining work is usually small, and it writes its artifact to the notebook — every completed beat is a safe place to split.
2. **Start a fresh session** with `/skill:jnk-0-pickup`. It reads the artifact and proposes the next beat. Done.
3. **Only if you must stop truly mid-beat**: have the agent checkpoint-write its partial state first — a rough file beats a lost session.

**Where you are decides how easy it is:**

| Where you hit 60% | Pain | What to do |
| --- | --- | --- |
| Mid-**alignment** (understand/decide/plan) | Low — the state is a few lines in the notebook | Finish the current beat, split, pickup proposes the next beat. |
| **Before implementation** (after design) | The ideal seam | The route file *is* the alignment, serialized. Fresh session reads it and implements. |
| **Mid-implementation** | The awkward one — state is the working tree + conversation | Finish the slice if you can; otherwise checkpoint the ledger + squawks, split, pickup. |

**Example — the ideal split, before implementation:**

> (Session 1 — alignment)
> You: `/skill:jnk-4-design`
> Agent: shapes it (ASCII + contracts + failure paths), then proposes the route: slices with checkpoints... "Approve the shape, then the route and the order?"
> You: `yep!`
> You: "Context is at ~60% — wrap up."
> Agent: saves `plans/01-initial.md` (the living route), then: "Route approved and saved. The next beat is implement — start it with /skill:jnk-5-implement in a fresh session."
>
> (Session 2 — implementation)
> You: `/skill:jnk-5-implement`
> Read the route in `.ai/contexts/persona-pipeline/plans/01-initial.md` and fly it.
> Agent: announces slice 1 from the ledger, implements, checkpoints, writes the ledger back to the file, gates. Repeat.

**Example — mid-alignment:**

> You: "We're at ~60% and I'm still mid-understand. Finish the beat."
> Agent: writes `understanding.md` (model + open IOUs), then: "The next beat is decide — start it with /skill:jnk-3-decide when you're ready."
> (New session)
> You: `/skill:jnk-0-pickup`
> Agent: "Resuming: model agreed, IOU-2 still open, next beat is decide."

**Example — emergency, truly mid-beat:**

> You: "I have to drop this session right now — save what we have."
> Agent: "Writing a checkpoint of the partial model + open IOUs to `understanding.md`. Rough, but nothing is lost."

## When things go sideways

- **The agent did the next beat's work** (planned during understand, implemented during design): that's beat bleeding — it should *recommend* the next beat, never start it. Say so.
- **The agent wants a refactor**: it must ask first — `/skill:jnk-refactor`, with value and risk stated. "Not today" is a complete answer; it logs a squawk and moves on.
- **The one-shot escalated**: it stopped because the change is bigger than one shot. Fine — that's the guard working. Invoke `/skill:jnk-1-understand` and do it properly.
- **You don't like the direction**: gates work both ways. Answer with what you actually want — "stop", "rethink", "let's brainstorm instead" (`/skill:jnk-2-brainstorm`).

## Nice to know

- **Want a report card on a session?** Save the session export (jsonl or html) and run `/skill:jnk-eval` with its path — it measures gate discipline, notebook writes, and leading-word adoption, and proposes fixes to the workflow itself.
- **Where a paused implementation stands?** Read the route file (`.ai/contexts/<feature>/plans/`) — it's a living document the agent updates at every gate — or run `/skill:jnk-0-pickup`, which reads it for you.
- **The notebook's durability?** `notes.md` is committed with the code (gitignore exception — see the notebook section above) so the session history survives machines and worktree cleanup; the rest of the notebook is local. Decisions, designs, and system facts live in `docs/adr/`, `docs/designs/`, and `docs/external/` — in the codebase by definition.
- **Where the philosophy lives:** each skill's `SKILL.notes.md` — what it does, when to use it, why it exists, how it fits the other skills, and its sources. Private: the agent never sees them; read them when you want the why. This guide is the day-to-day.

## The next frontier

The incident loop: routing alerts and feature requests straight into this factory — monitoring, back pressure, an AI report per incident, a pull request instead of a page at 3 a.m. That is infra, not skills; build it next to this repo when the volume justifies it.
