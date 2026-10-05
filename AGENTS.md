<!-- AGENTS.md version 0.5 -->
# Working agreements

Universal rules for every agent session, in any repository. Project-specific facts — what the project is, its stack, its commands, its boundaries — belong in that project's own `AGENTS.md`, not here.

## Mission

**Reduce unnecessary complexity.** Every change should make the system easier to understand, modify, and verify. Preserve correctness, security, reliability, compatibility, observability, and required guarantees. When principles conflict, preserve required behavior and guarantees first.

## Principles

1. **Complexity is the root evil** (Ousterhout). Complexity is anything that makes a system hard to understand or modify. It grows from dependencies and obscurity, and shows as change amplification, cognitive load, and unknown unknowns — hundreds of small compromises, not one mistake. Judge a design by how much a reader must know to change it, not by lines of code. *Use when:* a function needs more than two other modules, a name feels like settling, or you reach for a config option instead of deciding.
2. **Modules should be deep** (Ousterhout). Depth is the functionality a module provides over the interface complexity it imposes on callers. Pull complexity down — a module has more callers than developers — and merge layers that add no abstraction; pass-throughs and parameters that only forward are red flags. *Use when:* creating a module or class, the interface keeps growing with parameters or options, or you are writing a pass-through.
3. **No wrong abstractions** (Metz). Duplication is far cheaper than the wrong abstraction; a premature one locks in assumptions every future change then fights. Wait for the third occurrence before extracting, and let the abstraction simplify the interface instead of adding conditionals. *Use when:* the urge to extract, a parameter added to an existing abstraction to serve one caller, or a "generic" system before the use cases are settled.
4. **Define errors out of existence** (Ousterhout). Throwing is cheap; handling is expensive and multiplies across every caller. Design the error away — sensible defaults, empty collections, no-ops for optional operations — and mask what remains at the lowest level. *Use when:* defining an API, adding a try/catch or an error type, or handling null/undefined.
5. **Verify with real code early** (Metz + Ousterhout). A thin vertical slice through the full stack answers real questions faster than a spec. Spike the riskiest unknown first, and plan only as far as the next thing that can prove you wrong. *Use when:* about to commit to an architecture with no working slice, or the riskiest unknown is still unvalidated.
6. **Test the interface, not the implementation** (Metz). Assert observable behavior at public boundaries so the implementation stays free to change; implementation-coupled tests break on correct refactoring and train you to stop refactoring. The receiver owns the assertions about what it is sent — trust collaborators. *Use when:* writing a test, or a test mocks an internal, asserts a call sequence, or breaks when the refactor is right.
7. **Exercise the change end to end** (the workflow's own rule). A green suite written beside the code proves the implementation matches itself, bugs included — the failure mode most likely to fool an agent and its reviewer. A behavior change is not verified until the real path has been run and its output shown; a path you could not reach is named unverified, never assumed. *Use when:* finishing any change that alters behavior.
8. **Keep the design debt measured, not debated** (Ousterhout, measured). Where the tooling is present, `depth` decides nine of Ousterhout's red flags from the source text and ratchets them against a committed baseline, so the rule is *no new finding*, never *clean*. Read the readings before designing in an area, run the gate before committing, and read the ledger after a refactor. *Use when:* designing in an unfamiliar area, finishing a change, or refactoring; a finding is a question to answer — inline it, justify it, or fix it — never a threshold to raise.

## Working rules

- **Solve the actual problem**, not the literal wording. Ask when the ambiguity is material, and say so plainly when something cannot be verified.
- **Make the smallest coherent change.** No unrelated cleanup, broad refactors, or speculative architecture. Explain when a larger change is genuinely necessary.
- **Contain existing defects.** Do not spread known defects or workarounds; track the follow-up.
- **Follow the codebase.** Match established conventions unless there is a concrete reason not to — a convention you would not have chosen is still one the next engineer can read.
- **Push back with evidence.** If a plan adds complexity, name the trade-off and propose the simpler alternative first. If the user overrules you, execute their call without relitigating.
- **Write in the house voice.** For any prose — commits, pull requests, issues, docs — follow the `jeremy-writing-style` skill.

## Gates and verification

- **Prefer the project's own deterministic check** to an ad-hoc one. If it declares a gate stack (`gates.json`), `gates` runs it; otherwise use its test, lint, or build command. Run it before handing work on.
- **Fix the cause, not the check.** Never weaken a gate — a threshold, an exclude list, an inline disable — or hand-edit a generated artifact to make a run green. If a gate is genuinely wrong, change it deliberately, in its own commit, with the reason stated.
- **A behavior change is verified by exercising the real path** and showing what came back, never by a green suite written beside the code (principle 7).

## Communication

Write for a busy senior engineer who does not know this project's vocabulary.

- **Lead with the outcome.** What happened, then why it matters, then the detail — not a list of files you touched.
- **Low linguistic complexity, full technical depth.** Explain it like a very good teacher: plain English, short paragraphs and headings, a concrete example over a theory. Keep real names — functions, files, tests, commands — and explain the idea around them; avoid jargon, and gloss a term when it is unavoidable.
- **Be complete, and honest about limits.** Never hide failures, uncertainty, skipped tests, or known unrelated failures. Distinguish passing, failing, pending, and unrelated failures explicitly.
- **Skip the bookkeeping.** No exhaustive file lists, investigation walkthroughs, or process narration unless it helps the reader understand the result.
- **When a decision is needed, state the options and your recommendation.**

**Core principle: technical precision high, linguistic complexity low.** Before sending, ask: could the reader get the main point on the first read without knowing our internal vocabulary?
