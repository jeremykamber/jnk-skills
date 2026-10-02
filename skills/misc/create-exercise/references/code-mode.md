# Code mode — an exercise a student runs

The deliverable is a repository they clone and run: a failing test they
must make pass, or a program they must extend, with the trap already
placed in the code. Alongside it, never shipped to them, sit the
reference solution, the hidden tests and the rubric.

Read [design-rules.md](design-rules.md) first; those rules all apply.
**Reasoning vocabulary**: *starter, trap, failing test, spec test,
reference solution, hidden test, next step.*

## Layout

```
<slug>/
├── README.md              # the task, the how-to-run, the boundary
├── HINTS.md               # one hint per likely blocker, in order
├── <code>                 # their tree — what the spec tests drive
├── tests/                 # the visible tests: the contract, red
├── teacher/
│   ├── solution/          # the reference implementation
│   ├── hidden/            # tests the feedback layer runs
│   ├── RUBRIC.md          # what good looks like, per criterion
│   └── NOTES.md           # the misconception this exercise targets
└── run.sh                 # what CI and the feedback layer both call
```

Start from `assets/templates/<lang>/` (python, node, c) and read a
worked `demos/` exercise before authoring a new one. The demo spec is
flat — no `meta` wrapper:

```json
{
  "slug": "node-chunk-batches",
  "title": "Batch the readings",
  "objective": "chunk a stream without dropping the tail",
  "audience": "students who have written loops and array methods",
  "lang": "node",
  "concepts": ["off-by-one", "empty input"],
  "misconceptions": ["the loop stops one element early"],
  "estimateMinutes": 25
}
```

```bash
node scripts/new-exercise.mjs code node <slug>.demo.json <slug>/
node scripts/check-exercise.mjs code node <slug>/
node scripts/publish.mjs <slug>/ --mode code --dry-run
```

`publish.mjs` strips `teacher/` and `solution` on the way out and hard
-fails if either survives staging, so the same tree serves both
audiences. Never edit the published copy: fix the source repo and
republish.

## Three shapes, and when each is right

1. **Fix the failing test.** One bug, one red test, one obvious place to
   look. Use it to teach a *diagnosis* habit — the test names the
   behaviour, the student finds the cause. Best first exercise of a
   course.
2. **Complete the function.** A signature, a doc comment stating the
   contract, and a body that raises. Use it when the *design* is the
   lesson and the surrounding code should not be a puzzle.
3. **Extend the program.** Working code with a seam where the new
   behaviour belongs. Use it once they can read a codebase; it is the
   closest to real work and the easiest to make too big.

Pick one. An exercise that is a bit of all three is a project, and a
project does not fit a class period or a debrief.

## The trap is the exercise

Place the mistake deliberately, in the place a person actually makes it
— and keep the target in the *notes and the rubric*, not in a comment
the student can read. The three worth building:

- **Off-by-one** — `range(len(x))` where `range(len(x) - 1)` was meant,
  or a loop that stops one element early.
- **Assignment as equality**, and aliasing — mutate a list that was
  supposed to be copied; `is` where `==` was meant. Reference-vs-value
  confusion is one of the most durable programming misconceptions
  (Qian & Lehman 2017).
- **The happy path only** — code that works on the sample and falls
  over on the empty input, the single element, or the duplicate key.
  The missing case is the lesson.

## Tests are the contract, so give them the contract

For novices, provided tests that specify the behaviour beat
student-written TDD: the evidence for test-first in CS1 is thin, while
the evidence for tests-as-specification is not. So:

- **Visible tests** state the behaviour in the failure message,
  including the boundary cases ("empty input returns []").
- **Hidden tests** cover the trap and the edges, and run in the
  feedback layer — never in the student's run, or the trap is
  discoverable by trial and error.
- **Both go through `run.sh`**, so CI and the feedback layer cannot
  drift apart.
- **Do not grade with an autograder and call it feedback.** A test
  result is right/wrong at the task level — the weakest feedback level
  (Hattie & Timperley 2007). The rubric does the explaining; the test
  just tells them where to look.

## The README is a brief

1. **What to build**, in one sentence, in their words.
2. **How to run it** — the exact commands, including the test command,
   copy-pasteable and tested on a clean checkout.
3. **What "done" means** — the same criterion the rubric uses.
4. **The boundary** — which tooling is allowed, and whether they may
   read the reference solution before submitting. Say it; do not leave
   it to be argued later.

## Sequence across a course

Parsons problems first (arrange the shuffled lines), then trace this
code and say what it prints, then write this function, then extend this
program. The ordering is not style: novices reach roughly 50% accuracy
on tracing before they can write a trace-level construct themselves
(Lister et al. 2009), and Parsons problems are markedly *more
efficient* than writing the same code — 473 s versus 714 s to reach the
same post-test outcome (Ericson, Margulieux & Rick 2017) — so they buy
you the same learning in less class time.

Pair work is worth the cost. Pair programming improves the quality of
the artefact with a small effect and costs medium-clear effort — more
person-hours, not less (Hannay et al. 2009) — and in education the
outcomes are moderate-to-strong (Umapathy & Ritzhaupt 2017). So budget
for it: say who drives, who navigates, when they swap, and what the
pair hands in.

## Boundary

- **The repo is a worked example, not a product.** Keep the tree small
  enough to read in one sitting; every extra module is a place for the
  student to get lost instead of learning the lesson.
- **The reference solution is not "the" answer.** Multiple correct
  designs exist; the rubric scores the contract, and the solution is
  one instance of it. Write that in `teacher/NOTES.md` so the next TA
  does not mark for a different-but-correct shape.
- **The environment is part of the exercise.** If `run.sh` needs a
  version that fresh students do not have, you have written a setup
  exercise with a hidden prerequisite. Verify on a clean machine.
