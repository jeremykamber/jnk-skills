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
  when *not* to run the design skill; `AGENTS.md` now does.
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
flails in a 456-file repository while the skill asks for the module and its test
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
skill's reading and thread-file overhead buys nothing and costs tokens.

This is the first series where the baseline wins, and it is the most useful
result of the round: the workflow pays when a repository is big enough that
finding the seam is the work (kynd: 5× fewer tokens), and it loses when the
whole program is eighty lines and the seam is the only file.

## The frozen baseline matrix (3 repeats, isolated invocations)

Every row below is a median of three repeats, each repeat its own invocation with
its own transcripts (`bench/matrix`). A repeat in which a checkpoint got no model
response is discarded and re-run; a provider error the harness retried and that
still produced work is kept and counted. All rows: `deepseek-v4.1-flash`.

Series lengths are now five (`ticket-desk-deep`, `scratch-csvq`) and three
(`kynd-lib`, with `kynd-03-compact-title` added).

| series | arm | strict | isolated | erosion ↓ | verbosity ↓ | tokens | minutes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ticket-desk-deep | baseline | 80% | 100% | 0.118 | 0.0170 | 2,336,190 | 16.3 |
| ticket-desk-deep | workflow | 80% | 100% | **0.068** | 0.0000 | **1,720,100** | 17.2 |
| kynd-lib | baseline | 100% | 100% | 0.000 | 0.0000 | **371,972** | 30.8 |
| kynd-lib | workflow | 100% | 100% | 0.000 | 0.0000 | 784,693 | 7.7 |
| scratch-csvq | baseline | 100% | 100% | **0.278** | 0.0041 | **870,301** | 10.1 |
| scratch-csvq | workflow | 100% | 100% | 0.589 | 0.0000 | 1,966,936 | 19.5 |

Verdict, series by series: the workflow wins `ticket-desk-deep` on erosion and
cost at equal correctness; it loses `scratch-csvq` on both; on `kynd-lib` erosion
reads 0.000 for both arms and the workflow costs 2.1× the tokens while taking a
quarter of the wall clock.

Three facts worth keeping:

- **The spread inside a cell is still the biggest number in the table.** Identical
  baseline runs on `ticket-desk-deep` scored erosion 0.118, 0.210, 0.118; on
  `scratch-csvq` 0.625, 0.224, 0.278. Any single run decides nothing.
- **`kynd-lib` erosion is below resolution.** A small module added to a mature
  file produced no function above CC 10 in either arm. A strict per-series
  erosion win is impossible there; 0.000 is the floor, not a tie the workflow
  can break.
- **The baseline's kynd runs were killed at the 900s timeout** on two of three
  checkpoints and still graded strict. Its token figures are therefore a cut-off
  cost, not a completed one — which biases the cost comparison in the baseline's
  favour, so the workflow's 2.1× cost on that series is real, not an artifact.

What the workflow does on `scratch-csvq`: it writes one helper that parses,
validates and renders in a single function (`select_rows`, CC 11, 18 SLOC in the
first checkpoint measured), while the baseline splits the same work into four
functions under CC 10. Erosion is exactly the share of complexity mass held by
functions over that cutoff, so the workflow's tidiness-last habit costs it the
whole axis.

## Checkpoint runs (skills changed, benchmark frozen)

Each checkpoint is one `skills/**` change measured by a fresh matrix; ticket-desk
and scratch are judged per checkpoint, kynd at the final matrix. The workflow's
aggregate erosion is the mean of the three series' workflow medians, so the floor
at kynd does not hide movement elsewhere.

| checkpoint | change | aggregate erosion | ticket | scratch |
| --- | --- | --- | --- | --- |
| baseline | frozen | 0.219 | 0.068 | 0.589 |
| 1 | `jnk-oneshot`: one function, one job | 0.146 | 0.270 | 0.167 |
| 2 | `jnk-oneshot`: a branch chain that picks a command is a table | **0.092** | **0.000** | 0.276 |

Checkpoint 2, medians of three repeats:

| series | arm | strict | erosion | verbosity | tokens |
| --- | --- | --- | --- | --- | --- |
| ticket-desk-deep | baseline | 80% | 0.475 | 0.0043 | 2,805,248 |
| ticket-desk-deep | workflow | 80% | **0.000** | 0.0000 | 2,414,479 |
| scratch-csvq | baseline | 100% | 0.514 | 0.0129 | 673,138 |
| scratch-csvq | workflow | 100% | **0.276** | 0.0000 | 1,925,581 |

Correctness ties on both series. Every case of erosion now belongs to the
baseline: the workflow lands no function over CC 10 on ticket-desk at all, and
halves the share on scratch. Verbosity is 0.0000 for the workflow.

The cost axis still goes to the baseline, and the reason is visible in the
transcripts rather than the code:

| scratch checkpoint | baseline turns / tokens | workflow turns / tokens |
| --- | --- | --- |
| 01 csvq | 7 / 61,741 | 14 / 160,927 |
| 02 where | 5 / 36,445 | 17 / 253,947 |
| 03 sort | 8 / 60,199 | 18 / 303,034 |
| 04 aggregate | 11 / 187,234 | 20 / 526,780 |
| 05 export | 14 / 166,916 | 22 / 680,893 |

Twice the turns at every checkpoint — red test, watch it fail, implement, run it
again, exercise, commit — and every turn re-sends the context, so turns compound
into a ~3× token bill. Lines landed are equivalent (37 vs 33, 62 vs 58, 83 vs 85,
154 vs 158, 180 vs 198), so the difference is process, not volume.

## Final matrix (frozen benchmark, skills after checkpoint 2)

Three series, three repeats each, `deepseek-v4.1-flash`, every repeat its own
invocation.

| series | arm | strict | isolated | erosion ↓ | verbosity ↓ | tokens | minutes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ticket-desk-deep | baseline | 80% | 100% | 0.135 | 0.0184 | 2,048,277 | 10.7 |
| ticket-desk-deep | workflow | 80% | 100% | **0.000** | **0.0000** | 2,438,766 | 17.7 |
| kynd-lib | baseline | 100% | 100% | 0.000 | 0.0000 | **427,606** | 33.5 |
| kynd-lib | workflow | 100% | 100% | 0.000 | 0.0000 | 622,822 | **4.9** |
| scratch-csvq | baseline | 100% | 100% | 0.217 | 0.0041 | **903,173** | 8.3 |
| scratch-csvq | workflow | 100% | 100% | **0.079** | **0.0000** | 1,573,905 | 12.0 |

Verdict against the objective:

- **Correctness:** tied on every series (80/80, 100/100, 100/100). No series lost.
- **Erosion:** won on both series that can move (ticket 0.000 vs 0.135, scratch
  0.079 vs 0.217); kynd sits on the 0.000 floor for both arms, which the agreed
  rule counts as satisfied.
- **Verbosity:** 0.0000 for the workflow on every series, against 0.0184 and
  0.0041 for the baseline.
- **Cost:** the workflow's median cell is 1.57M tokens against the baseline's
  0.90M. Accepted as the price of the loop, not optimised away.

Workflow aggregate erosion over the run: 0.219 → 0.146 → 0.092 → **0.026**, and
the only series left with any eroded mass at all is scratch, where the baseline
carries three times more of it.

## Reproducing

```sh
./tools/bench --self-test                                          # 5s, no LLM
./tools/bench --run ticket-desk-deep --arm baseline --arm workflow
./tools/bench --report
```

Archive a run whose numbers you do not trust (`bench/results/archive/`) rather
than deleting it: a result you quietly removed is a result you cannot explain
later.
