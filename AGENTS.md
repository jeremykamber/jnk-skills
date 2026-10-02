<!-- AGENTS.md version 0.4 -->
## Mission

**Reduce unnecessary complexity.** Make the system easier to understand, modify, and verify. Preserve correctness, security, reliability, compatibility, observability, and required guarantees. When principles conflict, preserve required behavior and guarantees first.

## Principles

### 1. Complexity is the root evil (Ousterhout)

Complexity is anything that makes a system hard to understand and modify. It has two causes — dependencies and obscurity — and three symptoms: change amplification (small change, many edits), cognitive load (must hold too much to make one change), and unknown unknowns (don't know what to change). No single mistake creates a complex system; hundreds of small compromises do. Zero tolerance: every "just this once" compounds. Judge designs by how much knowledge a change requires, not by lines of code.

**Use when:** a function requires understanding more than two other modules, naming something feels like settling for "good enough", or you're tempted to add a config option instead of making a decision.

### 2. Modules should be deep (Ousterhout)

Depth is the ratio of functionality provided to interface complexity imposed on callers. A deep module hides rich behavior behind a simple interface; a shallow module pushes complexity into callers. Pull complexity downward: a module has more callers than developers, so simple interfaces beat simple implementations. Layers that don't add abstraction should be merged — pass-through methods are a red flag. Every element must eliminate more complexity than it introduces.

**Use when:** creating a new module or class, the interface keeps growing with new parameters or options, or you're writing pass-through methods that just forward calls to a lower layer.

### 3. No wrong abstractions (Metz)

Duplication is far cheaper than the wrong abstraction. Premature abstraction infers a pattern from too few examples and locks in assumptions that may not hold. Every future change fights the wrong structure. Wait for the third occurrence before extracting — two examples aren't enough information to find the right abstraction. When you do abstract, it should simplify the interface, not add parameters and conditionals. If the abstraction needs a conditional to serve a new caller, it has stopped being an abstraction.

**Use when:** you see duplication and feel the urge to extract, you're adding a parameter to an existing abstraction to handle a new case, or you're building a "generic" system before the use cases are settled.

### 4. Define errors out of existence (Ousterhout)

Exception handling is one of the worst sources of complexity. Throwing is cheap; handling is expensive — each exception forces every caller to deal with it, and each new exception type multiplies the handling cost across the call stack. Design APIs so errors can't occur: sensible defaults, empty collections, no-ops for missing optional operations. The goal is to make the common case trivial and the error case either impossible or boring. Where exceptions remain, mask them at the lowest level so upper layers never see them.

**Use when:** defining an API, adding a try/catch, creating a new error type, or handling null/undefined. Ask: can I redesign the interface so this case isn't an error?

### 5. Verify with real code early (Metz + Ousterhout)

Architecture decisions made on paper are cheap to revise; architecture decisions implemented are expensive. A thin vertical slice through the full stack answers real questions faster than a detailed spec. Spike the riskiest unknown first — the thing you understand least should be the first slice you build. A prototype built to be thrown away is cheaper than discovering a wrong assumption after full implementation. Keep consequential decisions reversible when cheap.

**Use when:** about to commit to an architecture without a working slice, the riskiest unknown is still unvalidated, or you're building a "proof of concept" that could become permanent if you're not disciplined.

### 6. Test the interface, not the implementation (Metz)

Implementation-coupled tests are the most expensive kind: they break on correct refactoring and train you to stop refactoring. Tests should assert only on observable behavior at public boundaries, so implementations stay free to change. LLMs are particularly prone to over-mocking internals and asserting on call sequences — this creates tests that pass on the exact code the LLM wrote but break on any subsequent change, the worst kind of false confidence. The receiver owns assertions about incoming messages; trust collaborators. If a test breaks when you refactor correctly but behavior hasn't changed, it was testing the wrong thing.

**Use when:** writing tests, and especially when a test mocks an internal collaborator, asserts on a call sequence, or breaks when you refactor correctly. Ask: is this test asserting on what happened, or on how it happened?

### 7. Exercise the change end to end (the workflow's own rule)

A test written after the code, by the context that wrote the code, encodes what the code does — including its bugs. It passes on the day it is written and proves only that the implementation matches itself. This is the most common way an agent-written change fools its author: the tests conform to the code instead of the requirement, and every later reader inherits them as evidence. So a change to behavior is not verified until it has been exercised the way it is used — the CLI run, the route called, the page opened, the migration applied — with the observed output shown rather than summarized. *Test the interface, not the implementation* governs the shape of a test; this principle governs what evidence is admissible. The spec comes first, and the mutation gate is the mechanical check on whether the tests could have failed at all: a test that survives a mutation of the code it covers was shaped to that code.

**Use when:** finishing any change that alters behavior. Ask: what did I run that a user would recognize, and would it have failed if the behavior were wrong?

### 8. Keep the design debt measured, not debated (Ousterhout, measured)

"Deep modules", "no pass-throughs", "pull complexity down" are judgements, and a judgement made by the context that just wrote the code is advocacy, not evidence. The decidable part is measured instead: `depth` decides nine of the red flags from the source text — shallow methods, pass-throughs, leaked literals and shapes, co-change without a dependency, needless exports, forwarded parameters, the two comment defects — and ratchets them against a committed baseline, so the rule is "never worse than the baseline" rather than "clean". Read the readings before designing in an area, run the gate before committing, and read the paid/new ledger after a refactor. The number is not the goal — complexity is — but a design claim nobody can check is a claim that drifts.

**Use when:** designing in an unfamiliar area, finishing a change, or refactoring. A finding is a question to answer — inline it, justify it, or fix it — never a threshold to raise.

## Behavioral rules

- **Solve the actual problem.** Match the user's intended outcome, not merely the literal wording. Clarify material ambiguity instead of guessing.
- **Make the smallest coherent change.** Avoid unrelated cleanup, broad refactors, and speculative architecture. Explain when a larger change is necessary.
- **Contain existing defects.** Do not spread known defects or workarounds; track necessary follow-up.
- **Follow the codebase.** Match established conventions unless there is a concrete reason not to. A convention you would not have chosen is still one the next engineer can read.
- **Write in the house voice.** For prose — commits, pull requests, issues, docs — follow the `jeremy_writing_style` skill.

**The goal is a correct solution that leaves the system easier for the next engineer to understand and change.**
