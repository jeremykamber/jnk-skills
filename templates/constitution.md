# Constitution

Paste this into the target project's `AGENTS.md` (or `CLAUDE.md`). It is the
shared law every role reads before its own skill. Keep it short — the parts that
must never be missed — and let the gates carry everything else. Rules that live
in a prompt decay; rules that live in a gate do not.

Delete the sections your project does not have rather than leaving them
aspirational.

---

## Tooling

- Run the gates with `gates`. Do not run the underlying tools ad hoc when a gate
  already covers them.
- `gates --changed` scopes to changed files where a gate supports it. Use it on
  large trees.
- Do not invent project-local substitutes for a gate. If the project has no
  mutation gate, say so; do not write a script that counts mutation sites and
  call it mutation testing.
- Do not hand-edit generated manifests, coverage files, or mutation baselines.
  Let the tool update them as part of its normal run.

## Design and testability

- Work in small, reviewable increments.
- Prefer the simplest design that supports the current behavior and leaves clear
  options for the next step.
- Keep new behavior in testable modules. Put code that opens a GUI, touches a
  device, requires the network, or hangs under automation behind a small adapter
  boundary.
- Only testable modules participate in gates that run tests — unit, coverage,
  CRAP, mutation, and property tests.
- Keep property tests in their own command. Do not fold them into unit coverage
  or the mutation run.

## Verification

- Run the relevant gate before handing work on. A role that changes code runs the
  gates it owns and fixes what they find.
- Fix the cause of a gate failure, not the check.
- Never weaken a gate — threshold, exclude list, or inline disable — to make a
  run green. If a gate is genuinely wrong, change it deliberately, in its own
  commit, with the reason stated.
- Report advisory gate failures as failures. Advisory means "not yet enforced",
  not "not a problem".

## Working with the human

- The specification is the human's call. Do not improvise around a spec you
  believe is wrong; stop and say so.
- The module partition is the human's call. Propose changes to it; do not
  silently redesign the system.
- When a gate cannot be satisfied without changing behavior, that is a
  specification problem. Stop and ask.
