# Performance

Read this only when speed is the stated goal. It changes the order of the moves,
not the principles: the answer is still the simpler design.

*Sources: ch. 20 (designing for performance; measure before modifying; design
around the critical path), ch. 7 (shallow layers cost on the hot path).*

## The order

1. **Measure.** Both to find where the time goes and to have a baseline to judge
   the change by. Intuition about performance is unreliable, even for people who
   have been right before.
2. **Look for a fundamental fix** first: a cache, a different algorithm, one
   allocation instead of many. Fundamental fixes are design work, and the design
   rules apply unchanged.
3. **Only then redesign the hot code.** This is the last resort, and it should be
   rare.

## Natural efficiency

Most of the time the cheap design is also the simple one, so prefer it while
choosing between two candidates:

- A hash table over an ordered map, unless the ordering is needed. Often 5–10x.
- Structures inside the array, not pointers to them: one allocation, not n+1.
- Deep modules. Each layer crossing costs a call, so shallow layers cost on every
  path, and the hot path crosses them most.

Simplicity pays twice: fewer special cases means less code to run, as well as less
code to read.

## Designing around the critical path

When a specific method is the problem, start from a thought experiment: what is the
smallest amount of code that must run in the common case? Ignore the current
structure and write that version. It is the ideal, and it probably will not fit
the class layout.

Then find the design that comes close to the ideal and still reads cleanly. The
work is mostly subtraction:

- **One early test for all special cases.** Check once, and branch the rare case
  off the path. Special-case code can then be written for clarity, since nobody
  cares whether it is fast.
- **Delete the shallow layers on the path.** Two pass-through methods with the
  same signature cost two calls, and each return value needs a check at the caller.
  That is both a performance problem and the pass-through red flag.
- **Add one field to remove repeated work**, when the field is cheap to keep true.
  RAMCloud added `extraAppendBytes` so the common append needed no search.

The Buffer rewrite in the book: the same moves made the class about twice as fast
and 20% smaller. Fewer layers, fewer tests, less code. Any complexity that speed
appears to require is a claim to measure and to keep behind the interface; if it
does not show a gain, back it out.

## Where the idea is taken too far

- Optimising every statement while designing slows development and usually does
  not help. Aim for naturally efficient, not tuned.
- A fast design with a worse interface is a loss unless the interface is unchanged
  and the gain is measured. Complexity bought for speed is still complexity.
- Tuning a path that measurement never named is guessing with extra steps.
