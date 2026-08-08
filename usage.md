# Using the Workflow — a practical guide

You are the pilot; the agent is the copilot. You decide when each step starts, you approve each step's result, and the agent does one job at a time. This guide is the day-to-day mechanics — what to type, what you'll see, and what to do when the context fills up. (For the philosophy behind it, read `workflow.md` once.)

## The short version

- **You invoke, it works, it stops.** Type `/skill:jnk-N-name` to start a step. The agent never starts the next step on its own — it ends by *recommending* it.
- **Every step ends with a question.** "Sound good?", "Approve the plan?", "Ready for slice N?" — that's a gate. Your answer is the workflow. One word usually suffices.
- **Small fix → one-shot. Anything else → the beats.**
- **Broken behavior → jnk-debug.** Reproduce first, gate the diagnosis, verify the fix on the original failure.
- **Context at ~60% → finish the step, start a fresh session, resume.**

## The modes

| Mode | Use it for | What happens |
|---|---|---|
| `/skill:jnk-oneshot` | Small, well-understood fixes — the ~80% case | One pass, no questions: reads just enough, smallest change, verifies, commits. |
| `/skill:jnk-debug` | Behavior is wrong, cause unknown | Reproduce → diagnose → gate the diagnosis → smallest fix → verify on the original failure. Ejects when the fix is large-scale. |
| **Expedited** (no skill — just skip beats) | Small feature that needs some thought | understand → decide → plan → implement → verify, with gates. |
| **Full beats** | Anything fuzzy, architectural, or risky | All nine beats, gates between every one. |

Rule of thumb: start with one-shot. If it tells you the change outgrew it (it "ejects"), switch to the beats.

## Starting a session

**Fresh feature — isolate first, then the first beat:**

> You: `/skill:jnk-worktree`
> New work: the persona profile/backstory split.
>
> Agent: creates `.worktrees/<slug>` + branch, installs deps, runs a baseline, then asks: "Ready for the first beat?"
>
> You: `/skill:jnk-1-understand` — and off you go.

**Continuing work — just resume, it reads the notebook:**

> You: `/skill:jnk-0-resume`
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

One more thing the agent will name at decision time: a **callsign** (e.g. `persona-a-profile-backstory`). It threads through the branch, the plan, and the log — useful when you're juggling several agents.

## The one-shot, in practice

> You: `/skill:jnk-oneshot`
> Fix the stale "strategy (default)" log line in GeneratePersonasUseCase — it's misleading.
>
> Agent: one-line restate → reads the file → makes the smallest change → runs the test → reports → commits as `fix: correct misleading strategy-mode log line`.

No gates. If the request is ambiguous it asks once, then goes. If the change turns out bigger than one shot, it stops and says so — that's the eject.

## The notebook — the memory you never read

The agent writes its understanding, decisions, and session log to `.ai/contexts/<date>-<feature>/` (gitignored, local to the project). You don't need to look at it. It exists so a *future* session — or a crash, or a context split — can pick up the thread. `resume` reads it; nothing is remembered unless it's written.

## Squawks — debt, logged not hidden

When the agent notices something wrong but it's not part of the current change, it logs a squawk instead of silently fixing it:

> `[squawk] low | cluster prompt | same "standard structure" weakness | deferred, cluster unused`

Your options: fix it now, defer it, or ignore it — but it's never silently forgiven. It lands in the notebook at verify or debrief, so a future session sees it.

## Session hygiene — when to split

Attention degrades as the context fills, no matter how big the window is. **Keep utilization under ~60%.** Hitting it is a signal to avoid new heavy work — not a panic button.

**What to do at ~60%:**

1. **Finish the current beat.** Its remaining work is usually small, and it writes its artifact to the notebook — every completed beat is a safe place to split.
2. **Start a fresh session** with `/skill:jnk-0-resume`. It reads the artifact and proposes the next beat. Done.
3. **Only if you must stop truly mid-beat**: have the agent checkpoint-write its partial state first — a rough file beats a lost session.

**Where you are decides how easy it is:**

| Where you hit 60% | Pain | What to do |
|---|---|---|
| Mid-**alignment** (understand/decide/plan) | Low — the state is a few lines in the notebook | Finish the current beat, split, resume proposes the next beat. |
| **Before implementation** (after plan) | The ideal seam | The plan file *is* the alignment, serialized. Fresh session reads it and implements. |
| **Mid-implementation** | The awkward one — state is the working tree + conversation | Finish the slice if you can; otherwise checkpoint the ledger + squawks, split, resume. |

**Example — the ideal split, before implementation:**

> (Session 1 — alignment)
> You: `/skill:jnk-5-plan`
> Agent: proposes the slices... "Approve the plan and the order?"
> You: `yep!`
> You: "Context is at ~60% — wrap up."
> Agent: saves `plans/01-initial.md`, then: "Plan approved and saved. The next beat is implement — start it with /skill:jnk-6-implement in a fresh session."
>
> (Session 2 — implementation)
> You: `/skill:jnk-6-implement`
> Read the plan in `.ai/contexts/persona-pipeline/plans/01-initial.md` and fly it.
> Agent: announces slice 1 from the ledger, implements, checkpoints, gates. Repeat.

**Example — mid-alignment:**

> You: "We're at ~60% and I'm still mid-understand. Finish the beat."
> Agent: writes `understanding.md` (model + open IOUs), then: "The next beat is decide — start it with /skill:jnk-3-decide when you're ready."
> (New session)
> You: `/skill:jnk-0-resume`
> Agent: "Resuming: model agreed, IOU-2 still open, next beat is decide."

**Example — emergency, truly mid-beat:**

> You: "I have to drop this session right now — save what we have."
> Agent: "Writing a checkpoint of the partial model + open IOUs to `understanding.md`. Rough, but nothing is lost."

## When things go sideways

- **The agent did the next beat's work** (planned during understand, implemented during plan): that's beat bleeding — it should *recommend* the next beat, never start it. Say so.
- **The agent wants a refactor**: it must ask first — `/skill:jnk-refactor`, with value and risk stated. "Not today" is a complete answer; it logs a squawk and moves on.
- **The one-shot ejected**: it stopped because the change is bigger than one shot. Fine — that's the guard working. Invoke `/skill:jnk-1-understand` and do it properly.
- **You don't like the direction**: gates work both ways. Answer with what you actually want — "stop", "rethink", "let's brainstorm instead" (`/skill:jnk-2-brainstorm`).

## Nice to know

- **Want a report card on a session?** Save the session export (jsonl or html) and run `/skill:jnk-eval` with its path — it measures gate discipline, notebook writes, and leading-word adoption, and proposes fixes to the workflow itself.
- **The full manual** is `workflow.md` — the beats, the notebook schema, the ideas behind it. Read it once; this guide is the day-to-day.
