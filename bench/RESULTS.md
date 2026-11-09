# Measured results

Model: `deepseek-v4.1-flash`. Fresh session per task, identical seed repository,
identical task prompts. The workflow arm carries one extra line telling the agent
to pick the lightest beat that fits.

## The series

Four features, applied in order to one repository, so what is measured is what
matters: whether the code gets worse as features accumulate.

`add + list` → `done + filter` → `priorities` → `due dates + overdue`

Pass means the task's verifier exited 0. The verifier runs from outside the repo,
so the agent never reads it, and it is written from the requirement.

## Runs

| pass | arm | pass | slop | source lines per step | tokens | minutes |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | bare | 100% | 0.00 | 82 → 104 → 136 → 183 | 373k | 3.1 |
| 1 | baseline | 100% | 0.00 | 48 → 74 → 122 → 188 | 1.16M | 6.6 |
| 2 | baseline | 100% | 0.00 | 56 → 80 → 116 → 166 | 650k | 6.7 |
| 2 | workflow, before any fix | 100% | 0.00 | 134 → 160 | 1.57M → 714k | 6.6+ |
| 3 | workflow, after the size rule | 100% | 0.00 | 83 → 104 | 386k → 286k | 3.6+ |
| 3 | workflow, after wiring the thread file in | 100% | 0.00 | 59 → 77 | 237k → 368k | 3.8+ |

Pass 2's workflow arm was stopped after two tasks: its first task cost **1.57M
tokens and 134 lines** for a feature the baseline built in 48, because the prompt
named all three beats and the workflow had no rule saying a one-file change does
not need a design beat.

Pass 3 added that rule (`AGENTS.md` → "Size the ceremony to the change") and made
the arm prompt ask for the lightest beat instead of naming them. Task 1 fell from
134 to 83 lines, and slop from 10.0 to 0.

Pass 4 added one line to `jnk-oneshot` and `jnk-design`: read the thread file
before re-deriving the repo. Task 1 fell again, to 59 lines — at the baseline's
size — and the second task stopped re-reading four files it had already read.

The runs after pass 3 were cut short by a benchmark bug, now fixed: on a timeout,
`shell=True` left the agent running as an orphan, still writing to the repo while
the verifier read it, and the elapsed time counted the wait for a pipe the orphan
held open. `run_agent` now starts a new session and kills the process group.

## What the numbers say

1. **Correctness does not separate the arms.** Every arm passed every task at
   this size. A four-feature Python series is below the level where a workflow
   changes whether the code works.

2. **Slop does not separate them either — yet.** Every arm scored 0.00. That is
   the metric working (the self-test shows 100 for a god function with duplicated
   blocks) and the series being too small: 180 lines of Python has no room to
   become a ball of mud. `ticket-desk-deep` adds a fifth feature — a second input
   path and a second output format — which is where a growing CLI starts to
   sprawl.

3. **Run-to-run variance is larger than the difference between arms.** Two
   identical baseline runs cost 1.16M and 650k tokens, a 1.8× spread. Any claim
   this benchmark makes about a *single* run's token cost is noise. Repeat, then
   compare medians.

4. **The workflow's measurable failure was over-building, and the fix was one
   sentence.** 134 lines where 48 were enough, 4× the tokens, and a slop score
   that the plain agent never produced. That is the failure mode `jnk-design`
   invites on small work, and it is now named in the rules the agent loads.

5. **The remaining cost is real.** After the fixes, the workflow still spends
   ~2–3× the tokens of a 15-line `AGENTS.md` on the same small feature. That is
   the price of the discipline: reading a beat, writing a thread file, running
   the gates. It is worth paying where a change is big enough to need it, and it
   is not worth paying on a one-file change — which is exactly what the size rule
   now says.

## Reproducing

```sh
./tools/bench --self-test                                    # 10s, no LLM
./tools/bench --run ticket-desk --arm baseline --arm workflow
./tools/bench --report
```

Archive a run whose numbers you do not trust (`bench/results/archive/`) rather
than deleting it: a result you quietly removed is a result you cannot explain
later.
