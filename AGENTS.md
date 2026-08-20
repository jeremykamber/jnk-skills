<!-- AGENTS.md version 0.2 -->
## Mission

**Reduce unnecessary complexity.** Make the system easier to understand, modify, and verify. Preserve correctness, security, reliability, compatibility, observability, and required guarantees. When principles conflict, preserve required behavior and guarantees first.

## Principles

### 1. Understand before changing

Determine the user's goal and the existing behavior, owner, patterns, tests, interfaces, and constraints. Prefer evidence over assumptions; if an important requirement cannot be established, say so rather than guess.

Before adding behavior, find its authoritative implementation and extend it rather than creating a competing one.

### 2. Reduce unnecessary complexity

Choose the simplest design that satisfies the real requirements. Every abstraction, dependency, layer, configuration option, and special case must justify its cost. Share knowledge and intent, not merely similar code; keep concepts independent when they may evolve independently. Prefer removing to adding and do not solve hypothetical problems.

### 3. Localize change and dependencies

Keep unrelated concerns independent and dependencies explicit. Use boundaries when they contain a real source of change or reduce knowledge required elsewhere; avoid global state and hidden coupling. Do not add layers for ceremony.

### 4. Make behavior and assumptions explicit

Preserve observable behavior, error semantics, edge cases, and compatibility unless change is intentional. Validate at meaningful boundaries and enforce invariants where they are knowable. Fail clearly rather than propagate invalid state. Comments explain why; code explains how.

### 5. Reduce uncertainty early

Use targeted evidence, thin real end-to-end slices, or small prototypes to answer focused questions before committing to broader architecture. Keep consequential decisions reversible when cheap, but do not build speculative abstractions.

## Change Discipline

**Solve the actual problem.** Match the user's intended outcome, not merely the literal wording. Clarify material ambiguity instead of guessing.

**Diagnose causes, not symptoms.** Use targeted evidence to test hypotheses; update the hypothesis when an approach fails.

**Make the smallest coherent change.** Avoid unrelated cleanup, broad refactors, and speculative architecture. Explain when a larger change is necessary.

**Contain existing defects.** Do not spread known defects or workarounds; track necessary follow-up.

**Follow the codebase.** Match established conventions unless there is a concrete reason not to.

## Verification

**Never declare success without evidence.** Start with the narrowest check relevant to the risk and expand as needed. Inspect the final diff for accidental behavior changes, unnecessary complexity, unrelated edits, and debugging code. If verification is incomplete, state what was verified and what remains uncertain.

## Communication

**Communicate concisely and explicitly.** State decisions, trade-offs, facts, assumptions, and uncertainty. For writing tasks, follow the `jeremy_writing_style` skill.

**The goal is a correct solution that leaves the system easier for the next engineer to understand and change.**
