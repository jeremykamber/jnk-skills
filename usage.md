# Using the Workflow — a practical guide

You are the pilot; the agent is the copilot. You decide when each step starts, you approve each step's result, and the agent does one job at a time. This guide is the day-to-day mechanics — what to type, what you'll see, and what to do when the context fills up. (The philosophy lives in each skill's `## About` block.) Every session should leave better software AND better understanding — both, or it's incomplete.

## The short version

- **You invoke, it works, it stops.** Type `/skill:jnk-name` to start a step. The agent never starts the next step on its own — it ends by *recommending* it. (Grill is the one exception: the agent fires /skill:jnk-grill itself when a decision tree appears — it's a mode, not a step.)
- **Every step ends with a question.** "Sound good?", "Approve the route?", "Ready for slice N?" — that's a gate. Your answer is the workflow. One word usually suffices.
- **Checkpoints teach in layers.** Each implement checkpoint walks you through the slice — where it sits, the flow, the critical bits, the plumbing to skip — and invites your probes. You don't read every line; you pull where you care, and the agent backs its claims with lines.
- **Small fix → one-shot. Anything else → the beats.**
- **Broken behavior → jnk-debug.** Reproduce first, gate the diagnosis, verify the fix on the original failure.
- **Ship it ironclad → /skill:jnk-attack.** Adversarial tests that try to break the feature; green is as strong as tests get, with residual risk named.
- **Unresolved decision → the agent fires /skill:jnk-grill.** One question at a time, it proposes an answer and researches facts; you decide.
- **Own the understanding → /skill:jnk-interrogate.** The agent interrogates you on a repo or feature until your understanding is real — brutal Socratic chains, a teaching ladder where you gap, and a "two areas left" signal so it never runs forever.
- **Context at ~60% → finish the step and split, or /skill:jnk-handoff mid-beat; fresh session, pickup.**
- **A beat proves it worked by running `gates`.** Verification is a command, not a judgment — see the next section.

## The gates — how a beat proves it worked

Every beat that claims something works now proves it with a command. `gates` is that command: it runs the project's stack in order, stops at the first failure, and prints the failing output — and that output is the instruction. Exit 0 means green; exit 1 means a gate failed; exit 2 means the config is broken.

It lives in `tools/` in this repository — vendored from the `uncle-bob-workflow` kit, where it is developed, so a clone of this repository alone can run every beat. `./install.sh` puts `gates`, `crap` and `depth` on your PATH and checks that `lizard`, the one package they need, is importable. `tools/VENDORED.md` records where the copy came from; `tools/sync-from-kit.sh` moves it forward, and the `vendored` gate fails when it drifts.

**Set a project up once:**

```sh
./setup.sh --project <dir>  # gates --init, then the jnk-skills stack
# or, by hand:
gates --init               # writes gates.json + the configs the stack declares
cp templates/gates.json .  # optional: the fuller stack, with acceptance + e2e
gates --list               # the stack, and any config it cannot find
gates                      # run it
```

`--init` writes every config file the adapter declares it needs. Do not copy those by hand: one is a dotfile, and the wrong name makes the arch gate cruise nothing at all.


Bring gates back one at a time as you install their tooling. The template ships a TypeScript stack — types, lint, unit, acceptance, coverage, crap, arch, dry, build, e2e, mutation — and the `why` on each one says what it proves.

**Where the beats use it:**

| Beat | What it runs |
| --- | --- |
| `/skill:jnk-3-implement` | `gates types lint unit` at each slice checkpoint — the cheap subset |
| `/skill:jnk-3-implement` (spec) | `gates acceptance` whenever a slice lands an acceptance scenario |
| `/skill:jnk-3-implement` (mutation) | `mutate-changed` at a checkpoint, scoped to the slice's files — optional, and never the whole tree |
| `/skill:jnk-4-verify` | the whole stack, once, at the end |
| `/skill:jnk-4-verify` (design) | `depth --changed --base <ref>` — the change's own ledger: what it introduced, what it retired |
| `/skill:jnk-refactor` | the same ledger: a refactor is measured by the design debt it retires |
| `/skill:jnk-oneshot` | the cheap subset between slices, the whole stack before it reports |
| `/skill:jnk-attack` | `mutate-changed` — the changed files and the tests that transitively import them |
| the audit (any beat) | `mutate-changed --full` — whole tree, whole suite, no cache; a deliberate act, not a checkpoint |

**The mutation gate is differential now, and the whole tree is the audit.** `mutate-changed` mutates the files changed against the base ref and runs only the test files that transitively import them; `mutate-changed --full` is the deliberate opposite — whole tree, whole suite, no cache — and belongs to the audit, not to a checkpoint. It uses `vitest related`, not a filename guess: on a real project that found the 14 test files importing one changed file — including `qa/acceptance.test.ts` and `src/cli/main.test.ts`, which a `foo.ts → foo.test.ts` guess never would — in 1.3 seconds, and a missing test file reads as a survivor, which reads as "write an assertion for this" for a mutant the suite already kills. Two traps: its incremental file is keyed on the scope, so a scoped run's survivors are not silently reused by a whole-suite run — which is why the tool, not a hand-run Stryker, is the path; and `inPlace: true` restores your files on the way out but not if the run is killed, so an aborted run leaves the source instrumented, the next run refuses to start and names the files, and `git checkout -- <files>` clears it. The diagnostic is Stryker's own line, `Ran N tests per mutant`: a low score with `Ran 0.00 tests per mutant` is a broken runner, and a slow run with a high number is an unscoped one.

**The design gate is the one that ratchets, so read the change, not the total.** `depth` decides nine of Ousterhout's fourteen red flags from the source text — shallow methods, pass-throughs, leaked literals and shapes, co-change without a dependency, needless exports, forwarded parameters, the two comment defects — and compares today's findings against `.depth-baseline.json`. Its claim is therefore "no *new* finding", and the thing to read is the change's own ledger: baseline the base ref once, then run `depth --changed --base <ref> --baseline .depth-baseline.json --json` on the branch. The `new` list is what this change introduced and the `paid` list is what it retired. Every finding carries its repair moves — `depth --explain <flag>` prints them with the case each one is for — so a finding is a question with answers attached, not a scold. For the design the flags cannot decide, `depth report` prints six readings and never fails a build: the shallow modules, the deletion candidates, the single-implementation abstractions, the pure blocks worth extracting, the drift over recent revisions, and the recorded trend.

**The stack is evidence about the code, not about the feature.** A green suite written after the code, by the same context that wrote it, proves the implementation matches itself — including its bugs — and that is the failure mode most likely to fool an agent and its reviewer. So a beat that changes behavior also runs the thing: the CLI with real arguments, the route with a real request, the page in a browser, the migration against a copy of real data, with the output shown rather than summarized. The `e2e` gate runs the path when the project has one; when it does not, the run is the beat's own work and it belongs in the report beside the gate results. A path that could not be reached is named as unverified, never assumed.

**The acceptance gate is the spec, and design writes it.** `features/<feature>.feature` holds the scenarios that define done, in the language of the problem. Design writes the file; implementation's first slice makes it *run* — the runner and the step definitions are implementation's work — and each later slice turns more scenarios green. The gate parses the file instead of trusting a transcription of it, so a scenario that cannot run is a scenario that is not a spec, and the spec cannot drift from the tests.

**The rule that matters: a gate that cannot fail is worse than no gate.** A green light you cannot turn red manufactures confidence, and you will make decisions on it. Two of the gates carry output assertions for exactly this reason — `expect` proves the tool actually did the work, `reject` names a signature that means the run itself is invalid. `arch` has an `expect` because dependency-cruiser silently cruises zero modules on TypeScript 7 and exits 0; `mutation` has a `reject` because Stryker's vitest runner reports every mutant as survived and prints `Ran 0.00 tests per mutant` — the kit ships the fix for that one and `templates/stryker.conf.cjs` now runs it (`templates/stryker-vitest-runner.mjs` with `perTest`: 3m39s -> 22-40s on a real project through `mutate-changed`, same verdicts), and the `reject` stays because a fix that stops working must fail loudly. Neither failure looks like a failure until you have seen it once.

**When a gate fails, the failure is the finding.** Fix the cause. Do not edit `gates.json` to clear it — raising a threshold is not fixing a defect, and the agent is told not to. If a threshold is genuinely wrong for the project, that is your call, made out loud with the reason.

**When the gate itself is wrong,** that is different, and worth checking before you rewrite tests: `checks/test_mutation.sh` proves a mutation setup in both directions on a fixture with one mutant that must be killed and one that must survive. The same instinct applies to any tool — before you believe a score, make sure the tool can produce a score you would not believe.

**What the gates give you.** They are a reading list, not a substitute for reading. The CRAP hotspots, the coverage gaps, the survivors, the arch violations — those are the two or three places in a change where the risk actually is, and the implement checkpoint teaches those first, then says plainly what the gates cleared. That is how you stay close to the code without reading all of it: the gates tell you where to look, and the layered teach walks you through it.

## The modes

| Mode | Use it for | What happens |
| --- | --- | --- |
| `/skill:jnk-oneshot` | Small, well-understood fixes — the ~80% case | One pass, no questions: reads just enough, builds vertical slices with subagent validation and parallel execution, verifies, reports — the commit is your call via /skill:jnk-commit. |
| `/skill:jnk-debug` | Behavior is wrong, cause unknown | Reproduce → diagnose → gate the diagnosis → smallest fix → verify on the original failure. Escalates when the fix is large-scale. |
| `/skill:jnk-attack` | A feature must be ironclad before it ships | Adversarial tests that try to break it — boundary values, invalid classes, property invariants, state/time/concurrency. Green means ironclad against the attack catalog; each test is proven able to fail. |
| **Expedited** (no skill — just skip beats) | Small feature that needs some thought | explore → design → implement → verify, with gates. |
| **Full beats** | Anything fuzzy, architectural, or risky | The whole arc — explore, design (decision + shape + route), implement, verify — plus grill when fuzzy, gates between every one. |
| `/skill:jnk-grill` | A decision that needs walking before it can be made | The agent fires it from any beat when a decision tree appears; one question at a time, you decide; back to that beat after. |
| `/skill:jnk-interrogate` | You want to actually understand a repo or feature — not just approve it | The agent interrogates you across thirteen coverage areas: Socratic chains verified against the code, a teaching ladder where you gap (hint → concept → code → analogy → explain-back), and a "two areas left" signal before it ends. |
| `/skill:jnk-handoff` | The live thread must cross a session boundary | Writes a compact thread checkpoint; pickup reads it next session. Split anywhere, not just at beat ends. |

Rule of thumb: start with one-shot. If it tells you the change outgrew it (it "escalates"), switch to the beats.

**How far to plan: to the first gate.** Design as far as the next thing that can prove you wrong — no further — then build slice 1 and let the code and the gates tell you whether the rest of the plan was right. That is AGENTS.md principle 5 applied to the plan itself, and it is why design now asks for the shape of slice 1 and the seams it exposes rather than a validated route for the whole feature. Design the whole thing up front only when falsifying is expensive: a migration you cannot roll back, an interface someone else is already coding against, a boundary you cannot move afterwards. A route that is right for slice 1 and wrong for slice 4 has done its job.

## Starting a session

**Fresh feature — isolate first, then the first beat:**

> You: `/skill:jnk-worktree`
> New work: the persona profile/backstory split.
>
> Agent: creates `.worktrees/<slug>` + branch, installs deps, runs a baseline, then asks: "Ready for the first beat?"
>
> You: `/skill:jnk-1-explore` — and off you go.

**Continuing work — just pickup, it reads the notebook:**

> You: `/skill:jnk-pickup`
> Continue the persona work.
>
> Agent: "Resuming *persona-pipeline*: model agreed, IOUs 1–3 in scope, squawks open on the cluster prompt. Next beat: design."

## Invoking beats and answering gates

Type the skill, then say what you want in plain language.

> You: `/skill:jnk-1-explore`
> Strategy personas come back with empty values/fears/interests. Fields exist, but [].
>
> Agent: restates the request, thinks first (no tool calls), proposes a reading list, then: "Sound good — or would you steer the list differently? I won't read anything until you confirm."

**Answering a gate — approve, steer, or add scope:**

> You: `y` — proceed as proposed.
> You: `drop the VPS route from scope, keep the rest` — steer it.
> You: `also check whether research has the same bug` — add scope.

Adding scope mid-implementation is normal. The agent should re-state the slice ledger out loud — *done / in flight / owed / deferred* — so nothing gets lost. If it reorders silently, that's a bug; the eval skill exists to catch it.

Many gates now ask you something, not just "approve?": "Which option would you defend?", "Which slice scares you?", "What would you want to see to trust this?" That's deliberate — a gate that makes you think is the anti-rubber-stamp. If you catch yourself saying "yep" without a thought, the workflow is telling you you're no longer in charge. And if the *agent* makes a call that should be yours, that's the same signal — it should have fired /skill:jnk-grill to walk it back through you, one question at a time (you can fire it yourself too).

One more thing the agent will name at decision time: a **thread name** (e.g. `persona-a-profile-backstory`). It threads through the branch, the route, and the log — useful when you're juggling several agents.

## Reading what the agent wrote — the layered walkthrough

The implement checkpoint (`/skill:jnk-3-implement`) teaches each slice in layers — where it sits, how data flows through it, the critical decisions (and the agent's least-confident choices), and what's mundane plumbing you can safely skip. Depth scales with the slice's risk: mechanical slices get the two-line version; risky ones get the full teach plus the adversarial reviewer's findings.

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

The agent writes its understanding and session log to `.ai/contexts/<date>-<feature>/` (gitignored, local to the project). You don't need to look at it. It exists so a *future* session — or a crash, or a context split — can pick up the thread. `pickup` reads it; nothing is remembered unless it's written. **Decisions, designs, specs, and system facts live in the codebase instead**: `docs/adr/` (written by design), `docs/designs/` (written by design — the mockups, contracts, call stacks, test shapes), `features/` (written by design — the acceptance spec the `acceptance` gate runs), and `docs/external/` (written by oneshot when they learn something durable) — committed, stable paths, free context for every future session.

One principle governs what gets written: **don't serialize the conversation because you're afraid of losing it — serialize knowledge because the project actually needs it.** A beat artifact (`understanding.md`, the route file) is written when it earns keeping. When the *live thread* — the thinking, the rejected branches, the next move — must cross a session boundary, `/skill:jnk-handoff` carries it instead: a compact checkpoint, overwritten, gitignored, read by pickup, never a second source of truth.

## Where everything lives

| Artifact | Written by | Lives in | Committed? |
| --- | --- | --- | --- |
| Understanding (model, IOUs) | jnk-1-explore | `.ai/contexts/<feature>/understanding.md` | no — session state, converges; written when it earns keeping |
| Live thread checkpoint | jnk-handoff | `.ai/contexts/<feature>/handoff.md` | no — transient, overwritten |
| Decision record | jnk-2-design | `docs/adr/<thread>.md` | yes |
| Program design (mockup, contracts, call stack, test shapes) | jnk-2-design | `docs/designs/<feature>/` | yes |
| Acceptance spec (the scenarios the `acceptance` gate runs) | jnk-2-design | `features/<feature>.feature` | yes |
| Route / slice ledger | jnk-2-design → jnk-3-implement | `.ai/contexts/<feature>/route.md` | no — living document |
| Spikes, throwaway prototypes | jnk-2-design | `.ai/contexts/<feature>/designs/` | no — throwaway |
| Squawks | jnk-3-implement / jnk-4-verify | `.ai/contexts/<feature>/squawks.md` | no — session state |
| Verification results | jnk-4-verify | `.ai/contexts/<feature>/verification/` | when needed |
| System facts (env, integrations) | jnk-oneshot | `docs/external/` | yes |

The one-line rule: **if a future session or future feature needs it, it's committed in the codebase; if only this feature's continuation needs it, it's in the notebook; if the live conversation must survive, it's a handoff.**

## Squawks — debt, logged not hidden

When the agent notices something wrong but it's not part of the current change, it logs a squawk instead of silently fixing it:

> `[squawk] low | cluster prompt | same "standard structure" weakness | deferred, cluster unused`

Your options: fix it now, defer it, or ignore it — but it's never silently forgiven. It lands in the notebook at verify, so a future session sees it.

## Session hygiene — when to split

Attention degrades as the context fills, no matter how big the window is. **Keep utilization under ~60%** — the rule lives here (Session hygiene). Hitting it is a signal to avoid new heavy work — not a panic button. **No instrument needed:** every beat ends with its state on disk, so a reset is free — when the session feels heavy, finish the beat and start fresh; pickup reads the files.

**What to do at ~60%:**

1. **Finish the current beat.** Its remaining work is usually small, and it writes its artifact to the notebook — every completed beat is a safe place to split.
2. **Start a fresh session** with `/skill:jnk-pickup`. It reads the artifact and proposes the next beat. Done.
3. **Only if you must stop truly mid-beat**: run /skill:jnk-handoff — a rough checkpoint beats a lost session.

**Where you are decides how easy it is:**

| Where you hit 60% | Pain | What to do |
| --- | --- | --- |
| Mid-**alignment** (explore/design) | Low — the state is a few lines in the notebook | Finish the current beat if you can; otherwise /skill:jnk-handoff, split, pickup proposes the next beat. |
| **Before implementation** (after design) | The ideal seam | The route file *is* the alignment, serialized. Fresh session reads it and implements. |
| **Mid-implementation** | The awkward one — state is the working tree + conversation | Finish the slice if you can; otherwise /skill:jnk-handoff (ledger + squawks + next move), split, pickup. |

**Example — the ideal split, before implementation:**

> (Session 1 — alignment)
> You: `/skill:jnk-2-design`
> Agent: decides with lenses, writes ADR, shapes it (ASCII + contracts + failure paths), then proposes the route: slices with checkpoints... "Approve the shape, then the route and the order?"
> You: `yep!`
> You: "Context is at ~60% — wrap up."
> Agent: saves `route.md` (the living route), then: "Route approved and saved. The next beat is implement — start it with /skill:jnk-3-implement in a fresh session."
>
> (Session 2 — implementation)
> You: `/skill:jnk-3-implement`
> Read the route in `.ai/contexts/persona-pipeline/route.md` and fly it.
> Agent: announces slice 1 from the ledger, implements, checkpoints, writes the ledger back to the file, gates. Repeat.

**Example — mid-alignment:**

> You: "We're at ~60% and I'm still mid-explore. Finish the beat."
> Agent: writes `understanding.md` (model + open IOUs), then: "The next beat is design — start it with /skill:jnk-2-design when you're ready."
> (New session)
> You: `/skill:jnk-pickup`
> Agent: "Resuming: model agreed, IOU-2 still open, next beat is design."

**Example — emergency, truly mid-beat:**

> You: "I have to drop this session right now — save what we have."
> Agent: "Writing a handoff — where we are, what we decided, what's next — to `.ai/contexts/<dir>/handoff.md`. Rough, but nothing is lost. Resume with /skill:jnk-pickup."

## When things go sideways

- **The agent did the next beat's work** (planned during explore, implemented during design): that's beat bleeding — it should *recommend* the next beat, never start it. Say so.
- **The agent wants a refactor**: it must ask first — `/skill:jnk-refactor`, with value and risk stated. "Not today" is a complete answer; it logs a squawk and moves on.
- **The one-shot escalated**: it stopped because the change is bigger than one shot. Fine — that's the guard working. Invoke `/skill:jnk-1-explore` and do it properly.
- **You don't like the direction**: gates work both ways. Answer with what you actually want — "stop", "rethink", "let's brainstorm instead" (`/skill:jnk-1-explore`).
- **The agent decided something that should be your call**: that's a silent decision — it should have fired /skill:jnk-grill; run it now and walk it back. The workflow makes you the pilot; the grill is the instrument that puts you back in the seat.

## Nice to know

- **Want a report card on a session?** Save the session export (jsonl or html) and run `/skill:jnk-eval` with its path — it measures gate discipline, notebook writes, and leading-word adoption, and proposes fixes to the workflow itself.
- **Where a paused implementation stands?** Read the route file (`.ai/contexts/<feature>/route.md`) — it's a living document the agent updates at every gate — or run `/skill:jnk-pickup`, which reads it for you.
- **The notebook's durability?** `notes.md` is committed with the code (gitignore exception — see the notebook section above) so the session history survives machines and worktree cleanup; the rest of the notebook is local. Decisions, designs, specs, and system facts live in `docs/adr/`, `docs/designs/`, `features/`, and `docs/external/` — in the codebase by definition.
- **Where the philosophy lives:** each skill's `SKILL.notes.md` — what it does, when to use it, why it exists, how it fits the other skills, and its sources. Private: the agent never sees them; read them when you want the why. This guide is the day-to-day.
- **Code complexity:** the `crap` gate (`crap src --coverage coverage/coverage-final.json --threshold 10`) scores every function on complexity *and* coverage together — $CRAP = CCN^2 \times (1 - coverage)^3 + CCN$. It separates a complex function that is tested from one that is not, which a maintainability index cannot, because MI is driven mostly by size. Run it in the gate stack, after the gate that emits the coverage file.

## The next frontier

The incident loop: routing alerts and feature requests straight into this factory — monitoring, back pressure, an AI report per incident, a pull request instead of a page at 3 a.m. That is infra, not skills; build it next to this repo when the volume justifies it.
