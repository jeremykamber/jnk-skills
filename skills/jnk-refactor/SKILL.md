---
name: jnk-refactor
description: Change structure without changing behaviour, judged the way Ousterhout judges design, and prove the debt went down. Use when the code works and getting it cleaner is the job.
disable-model-invocation: true
---

# Refactor

> Behaviour frozen. Depth on the ledger.

## The stance

Five rules from Ousterhout's *A Philosophy of Software Design* decide every call
here. They hold whatever you are refactoring, so they never leave this file.

1. **Complexity is the enemy.** It is anything in the structure that makes the
   system hard to understand and change. It shows as change amplification,
   cognitive load, and unknown unknowns, and its causes are dependencies and
   obscurity. It arrives one small compromise at a time, so tolerance is zero.
2. **A module earns its place by being deep.** The cost of a module is its
   interface; the benefit is the functionality behind it. A move that hides more
   knowledge behind a simpler interface is right. A rename, or a split, that
   leaves a caller knowing the same amount is churn.
3. **The common case decides the interface.** Defaults, buffering, retries and
   the usual call shape live inside the module. Complexity moves down, to where
   one person pays it instead of every caller.
4. **Design it twice.** Two whole shapes, sketched, compared, and one rejected in
   writing. The first idea is not the design.
5. **Strategic, not tactical.** When the change lands, the system has the
   structure it would have had if you had designed it with this change in mind.

State the rule you follow in the same breath as the move. `jnk-commit` reads it.

## Steps

1. **Freeze the behaviour.** The existing tests are the contract. Where they do
   not cover what you will move, write that test first and watch it go green.
   Done when every behaviour you intend to move is covered by a test that passes
   now.

2. **Name the red flags.** Run `depth report <area>` for the six readings, then
   `depth --changed --base <ref> --json` for the findings in this change. Read
   the target files yourself for what no tool decides: repetition, temporal
   decomposition, conjoined methods, special-general mixture, vague names,
   nonobvious code. Mark each one at its line. A red flag is evidence, not a
   mandate.

   No `depth` in this project? The table in step 3 is the detector.

   Done when every flag you will act on has a file, a line, and a name, and you
   have said which two or three moves are worth making.

3. **Route each flag to one reference.** Read only the rows that fired. The table
   is the whole selection process: a flag you did not find costs you no reading.
   Done when you can name, for each flag, the reference that answered it, and for
   the rest, that nothing fired.

   | What you see in the code — the red flag | Read |
   | --- | --- |
   | An interface nearly as complex as the body: one-line wrappers, thin accessors, a class per noun, adjacent layers with the same abstraction | `references/module-depth.md` |
   | One decision, fact or data shape written in two modules; two files that keep changing together; stages split by the order they run in | `references/information-hiding.md` |
   | The same block twice; two methods you cannot read apart; one class carrying both a general mechanism and one special use; a method you are about to split | `references/together-or-apart.md` |
   | Error paths, null checks, "not found" branches, boolean flags, magic empty values, configuration knobs | `references/errors-and-special-cases.md` |
   | A name too vague to be precise, or hard to choose; a comment that restates its line; a long comment where a short one should do | `references/names-and-comments.md` |
   | A reader would guess wrong; two similar things done differently; four files to follow one call | `references/obviousness.md` |
   | The goal is speed | `references/performance.md` |

   Each reference ends with the point where its idea is taken too far. Read that
   before you move. `depth --explain <flag>` prints the repair menu for the nine
   decidable flags; the reference adds the judgement the menu cannot.

4. **Design it twice.** Two candidate shapes for the flag that matters most.
   Neither needs a full write-up: the interface, who calls it, and what each one
   hides. Judge with one question — which one leaves a caller knowing less? Write
   the loser down with the reason it lost. This is also the cheap probe: a class
   or method interface comment you cannot keep short and complete is a design
   that is wrong, and you found it before writing code.
   Done when both sketches exist and the rejected one has its reason.

5. **Move in small steps.** One structural change per commit, tests green after
   each, `gates` at every checkpoint. No behaviour smuggled in: if a test has to
   change, the refactor became a feature. Say so and stop.

   Bad: rename, extract, move and change the sort order in one commit.

   Good: `refactor(store): extract matchesDone and matchesText` — behaviour
   unchanged, the gate green, one idea to review.

   Done when every checkpoint passed and no commit holds two ideas.

6. **Score it.** Baseline first, so the change can be judged:

   ```sh
   git worktree add /tmp/base <ref>
   (cd /tmp/base && depth --update-baseline --baseline /tmp/base.json)
   depth --changed --base <ref> --baseline /tmp/base.json --json
   ```

   `paid` is debt retired; `new` is debt added. Report both. A refactor that adds
   as much as it removes did not pay.
   Done when the ledger is written and every finding you left is named on
   purpose.

## Output

The moves made, each with the flag it answered and the rule it followed; the
ledger (paid and new); the behaviour evidence; which references you read and
which did not fire; what you left alone on purpose.

## Next

`jnk-commit`. Recommend and stop.
