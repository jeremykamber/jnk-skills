# Measured results

Model: `deepseek-v4.1-flash`. Fresh session per checkpoint, identical seed
repository, identical prompts. Arms compared **correctness → erosion →
verbosity → tokens**, in that order and no other.

The instrument follows [SlopCodeBench](https://arxiv.org/abs/2603.24755):
`strict` (all tests, regressions included), `isolated` (this checkpoint alone),
`erosion` (share of complexity mass in functions with CC > 10, `mass = CC ×
√SLOC`), `verbosity` (share of lines duplicated or flagged redundant).

## What the first instrument got wrong

The first version scored one blended "slop" number: functions over a size
threshold, duplicated lines, and design findings, summed as shares. Three
problems, all now fixed:

1. **It mixed units.** A count share, a line share and a findings-per-file share
   summed to a number that could not be argued with, because no term had a
   definition anyone else uses.
2. **It excluded failed checkpoints.** That hides the case the benchmark exists
   to find: an agent that keeps passing while the code rots, or fails while the
   code stays clean.
3. **It had one correctness axis.** A checkpoint that breaks an earlier feature
   and one that never lands look identical, and they are different failures.

The redesign also settled a priority question the old report could not answer:
an arm that is cheaper but less correct must lose.

## Runs, old instrument (superseded)

Kept because they drove real changes, not because the numbers still apply.

| pass | arm | pass | slop | lines per checkpoint | tokens | minutes |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | bare | 100% | 0.00 | 82 → 104 → 136 → 183 | 373k | 3.1 |
| 1 | baseline | 100% | 0.00 | 48 → 74 → 122 → 188 | 1.16M | 6.6 |
| 2 | baseline | 100% | 0.00 | 56 → 80 → 116 → 166 | 650k | 6.7 |
| 2 | workflow, before any fix | 100% | 10.0 → 8.3 | 134 → 160 | 1.57M → 714k | 9.6 |
| 3 | workflow, after the size rule | 100% | 0.00 | 83 → 104 | 386k → 286k | 5.9 |

What those runs did establish, and the redesign keeps as requirements:

- **The workflow over-built on small work.** 134 lines where 48 were enough, and
  a slop score the plain agent never produced. The cause was that nothing said
  when *not* to run the design beat; `AGENTS.md` now does.
- **The thread file was written but never read.** The next checkpoint re-read
  four files it had already read. `jnk-oneshot` and `jnk-design` now read it
  first, and checkpoint 1 fell from 134 to 59 lines — at the baseline's size.
- **Run-to-run variance exceeded the gap between arms.** Two identical baseline
  runs cost 1.16M and 650k tokens. A single run's token count is noise; repeat
  and compare medians.

## Runs, current instrument

`ticket-desk-deep` — five checkpoints, the fifth adding a second input path and
a second output format, which is where a growing CLI starts to sprawl.

| arm | strict | isolated | erosion | verbosity | tokens | minutes |
| --- | --- | --- | --- | --- | --- | --- |
| baseline | 80% | 100% | 0.232 | 0.000 | 4,384,723 | 14.8 |
| workflow | 80% | 100% | 0.226 | 0.000 | 2,884,328 | 13.5 |

Both arms fail checkpoint 5 *strictly* and pass it *in isolation*: the feature
landed and broke something earlier. That is the distinction the ladder exists to
make, and it is the first time the benchmark measured it on real output rather
than a fixture.

The means tie on correctness and nearly tie on erosion, and the workflow used
**34% fewer tokens**. The trajectories are where the difference is:

```text
baseline  erosion  0.00 → 0.00 → 0.00 → 0.41 → 0.75
workflow  erosion  0.00 → 0.00 → 0.37 → 0.32 → 0.44
```

The baseline holds everything at zero for three checkpoints and then concentrates
half its complexity mass in one function at checkpoint 4 and three quarters at
checkpoint 5. The workflow crosses the line earlier and then recovers, ending at
0.44 against 0.75. Late-trajectory erosion is the failure SlopCodeBench reports
across every model it tested; here it is 1.7× smaller under the workflow, on one
run.

Two caveats, both of which the numbers cannot settle:

- **One run.** Run-to-run variance in tokens has already been measured at 1.8×
  on identical prompts. The erosion trajectories differ by more than that, but
  the token saving is within the noise until this is repeated.
- **Verbosity is unexercised.** Both arms scored 0.000: this codebase never
  duplicated a block or left a stub or an unused import. A metric that reads zero
  everywhere has not been tried. The fixture tests prove it can move; the series
  does not yet make it move.

## A real repository: kynd

`kynd-lib` seeds the benchmark from a real Next.js application at HEAD — 456
tracked files, 108 test files — and asks for one small feature in a module that
already has tests. `node_modules` and `.env` are hard-linked in (not symlinked:
a symlink prints its target, and an agent that reads it can walk out of the
workspace — one did, once, before this was fixed).

| arm | strict | erosion | lines added | tokens | minutes |
| --- | --- | --- | --- | --- | --- |
| baseline | pass | 0.000 | 55 | 1,015,040 | 2.6 |
| workflow | pass `*` | 0.000 | 21 | 200,919 | 15.0 |

`*` marks the timeout: the checkpoint was graded after 900s and passed, so the
work was complete, but the agent had not exited.

On real code the ordering reverses from the toy series: the workflow produced
**fewer than half the lines** and used **5× fewer tokens**, because the baseline
flails in a 456-file repository while the beat asks for the module and its test
before editing. Its cost moved to wall time — 15 minutes against 2.6 — which is
the trade this workflow actually makes, and the one a user feels.

Erosion and verbosity cannot separate them here: one small module added to a
mature file is below the resolution of both.

## From an empty repository (SlopCodeBench's own setting)

`scratch-csvq` starts with nothing and gives a CLI contract: build `./csvq`, then
extend it with filtering. This is the paper's shape — the agent implements the
first checkpoint from scratch and then extends its own code.

| arm | strict | isolated | erosion | verbosity | tokens | minutes |
| --- | --- | --- | --- | --- | --- | --- |
| baseline | 100% | 100% | 0.262 | 0.000 | 232,523 | 2.2 |
| workflow | 100% | 100% | 0.301 | 0.000 | 385,454 | 4.8 |

**The workflow is worse here**: erosion 0.301 against 0.262, and 66% more tokens.
Both arms pass both checkpoints; both keep the second edit in one function
(0.52 and 0.60 at checkpoint 2). On a two-checkpoint from-scratch build, the
beat's reading and thread-file overhead buys nothing and costs tokens.

This is the first series where the baseline wins, and it is the most useful
result of the round: the workflow pays when a repository is big enough that
finding the seam is the work (kynd: 5× fewer tokens), and it loses when the
whole program is eighty lines and the seam is the only file.

## Reproducing

```sh
./tools/bench --self-test                                          # 5s, no LLM
./tools/bench --run ticket-desk-deep --arm baseline --arm workflow
./tools/bench --report
```

Archive a run whose numbers you do not trust (`bench/results/archive/`) rather
than deleting it: a result you quietly removed is a result you cannot explain
later.
