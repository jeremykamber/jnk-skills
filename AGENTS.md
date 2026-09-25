<!-- AGENTS.md version 0.3 -->
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

## Behavioral rules

- **Solve the actual problem.** Match the user's intended outcome, not merely the literal wording. Clarify material ambiguity instead of guessing.
- **Make the smallest coherent change.** Avoid unrelated cleanup, broad refactors, and speculative architecture. Explain when a larger change is necessary.
- **Contain existing defects.** Do not spread known defects or workarounds; track necessary follow-up.
- **Follow the codebase.** Match established conventions unless there is a concrete reason not to. A convention you would not have chosen is still one the next engineer can read.
- **Write in the house voice.** For prose — commits, pull requests, issues, docs — follow the `jeremy_writing_style` skill.

**The goal is a correct solution that leaves the system easier for the next engineer to understand and change.**
