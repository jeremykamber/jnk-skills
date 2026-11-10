<!-- AGENTS.md version 1.0 — the machine's universal rules. Project facts live in the project's own AGENTS.md. -->
# Working agreements

## Mission

Reduce unnecessary complexity. Every change should make the system easier to
understand, modify, and verify. Correctness, security, reliability and stated
guarantees come first when principles collide.

## Principles

1. **Complexity is the root evil** (Ousterhout). Judge a design by how much a
   reader must know to change it. *Use when:* a function needs more than two
   other modules, or you reach for a config option instead of deciding.
2. **Modules should be deep.** Functionality over interface. Pull complexity
   down; merge layers that add no abstraction. *Use when:* the interface keeps
   growing, or you are writing a pass-through.
3. **No wrong abstractions** (Metz). Duplication is cheaper than the wrong
   abstraction. Extract at the third occurrence. *Use when:* the urge to
   generalise arrives before the second use case.
4. **Define errors out of existence.** Prefer defaults, empty collections and
   no-ops to throwing and catching. *Use when:* adding an error type or a
   `try`/`catch`.
5. **Verify with real code early.** Spike the riskiest unknown first; plan only
   to the next thing that can prove you wrong. *Use when:* about to commit to an
   architecture with no working slice.
6. **Test the interface, not the implementation.** Assert behaviour at public
   boundaries. *Use when:* a test mocks an internal or asserts a call sequence.
7. **Exercise the change end to end.** A green suite written beside the code
   proves the implementation matches itself, bugs included. Run the real path and
   show what came back; name what you could not reach as unverified. *Use when:*
   finishing any change that alters behaviour.
8. **Measure design debt, don't debate it.** `depth` decides nine of Ousterhout's
   red flags and ratchets them against a committed baseline, so the rule is *no
   new finding*, never *clean*. *Use when:* designing in an unfamiliar area or
   finishing a refactor.

A principle earns its place when it changes a decision; say which one, in the
same breath as the decision.

## Working rules

- **Solve the actual problem.** Ask when the ambiguity is material; say plainly
  what cannot be verified.
- **Make the smallest coherent change.** No unrelated cleanup, no speculative
  architecture.
- **Encode a repeated correction in structure** — architecture, then types, then
  a lint whose error names the fix, then a test. Prose decays; a failing command
  does not.
- **Contain existing defects.** Track the follow-up instead of spreading the
  workaround.
- **Follow the codebase.** Match its conventions unless you can say why not.
- **Push back with evidence.** Name the trade-off and the simpler alternative
  first. If the user overrules you, execute their call.

## Gates

- **The project's gate stack is the definition of done.** Run `gates`; the
  failing output is the instruction. Exit 0 is green, 1 is a failed gate, 2 is a
  broken config.
- **Fix the cause, not the check.** Never weaken a threshold, an exclude list or
  an inline disable to make a run green. A miscalibrated gate is the user's
  decision, in its own commit, with the reason stated.
- **A behaviour change is verified by running the real path** and showing the
  output — never by a green suite alone.

## Beats

The beats are `jnk-design`, `jnk-implement`, `jnk-verify`, `jnk-commit`, and the
modes beside them. The user starts a beat; you never do. Their files are on disk
under the installed skills directory — read the one the user names, or the one
the work needs, and follow it.

Two modes you may reach for on your own: `jnk-grill` when a decision is the
user's, and `jnk-legacy` when someone types an old beat name.

**Size the ceremony to the change.** One file with an obvious approach is
`jnk-oneshot`. Two or more files, a decision worth writing down, or behaviour
nobody has settled is `jnk-design`. Running the heavy path on a small change is
the most expensive mistake this workflow makes, and the benchmark shows it.

Close a beat by naming the next one and what it would do. Start it when the user
says go, or when the work plainly needs it and strict mode is off.

## Communication

Lead with the outcome, then why it matters, then the detail. Plain English, full
technical depth, real names. State limits: what passed, what failed, what you did
not verify. Skip the file-by-file narration unless it helps the reader act.
