# Errors and special cases

Read this when the code is shaped by its error paths: null checks, "not found"
branches, boolean flags, magic empty values, configuration knobs, `try`/`catch`
blocks that outnumber the normal path.

*Sources: ch. 10 (define errors out of existence; masking; aggregation; just
crash; special cases), ch. 5.7 (defaults), ch. 8.2 (configuration parameters).*

## Why this is where complexity hides

Code for special conditions is harder to write than the normal path, and it runs
rarely, so it is hard to test and its bugs survive. A study of production failures
in distributed data-intensive systems found that more than 90% of catastrophic
failures came from incorrect error handling. Throwing is cheap; handling is what
costs, and handling is written at every call site that cares.

An exception is part of the interface, and a particularly expensive part: it
propagates up several levels, so it enlarges the interfaces of callers that never
mentioned it. A class with many exceptions is shallow.

## The four moves

1. **Define the error out of existence.** Change what the operation promises, so
   the case is normal instead of exceptional.
   - Tcl's `unset` threw when the variable was absent. Redefine it as "ensure the
     variable no longer exists": the work is already done, so it returns.
   - Java's `substring` throws when an index is out of range. Redefine it as "the
     characters in range, if any": the answer is well defined for every index.
   - Windows refuses to delete an open file. Unix marks it and returns success; the
     data goes when the last reader closes. Two error cases gone, and the caller
     writes no new code.
2. **Mask it low.** Handle the condition inside the module that can. TCP resends
   lost packets, so callers never see loss. NFS hangs and retries rather than
   returning a failure that no application can act on.
3. **Aggregate it high.** One handler, in one place, for many throws. Let the
   exception carry its message; the top-level handler turns any of them into an
   error response and knows nothing about the specific case.
4. **Crash.** For a condition the code cannot handle and cannot avoid, abort with a
   clear message. Out-of-memory is the model: `ckalloc` checks and aborts, so no
   call site checks `malloc`.

## Special cases of every kind

The same reasoning applies to flags and empty values. A selection that "may not
exist" forces a check at every use. An empty selection — start equal to end —
makes every operation work unchanged: deleting it regenerates the line, copying it
inserts nothing. The user-facing notion of "no selection" stays in the interface,
where it belongs; the implementation holds a range that is sometimes empty.

Test each guard the same way: **what can the caller do with this information?** If
the answer is nothing, the condition is complexity. If the caller must know — a
network error the application has to surface — the module must expose it, because
masking it would leave callers unable to do their job.

## Moves

- Redefine the promise, then delete the throw and every handler that caught it.
- Replace a "does not exist" flag with an empty value that flows through the same
  code path.
- Move a policy choice into the module as a computed default instead of exporting a
  configuration parameter.
- Collect scattered handlers into the one place that can respond.

## Where the idea is taken too far

- Masking what the caller needs is not simplicity. A team masked every network
  error, and applications had no way to learn that messages were lost.
- Promotion has a cost. RAMCloud crashes a server to recover one corrupted object,
  and that is right because corruption is rare. The same move on lost packets would
  take the system down.
- Catching nothing and continuing is not masking. Masking means handling.
