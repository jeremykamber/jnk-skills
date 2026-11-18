# Better together or better apart

Read this when you are about to extract, split or merge: the same block appears
twice, two methods cannot be read apart, one class mixes a general mechanism with
one special use, or a method is long.

*Sources: ch. 9 (better together or better apart; splitting and joining methods;
special-general mixture; conjoined methods).*

## Split costs four things

Subdivision is not free, and the book names the bill:

- more components to track, and a new interface for each one;
- more code to manage the components;
- separation, so related code is no longer in view at once;
- duplication, when one copy becomes two.

Bring code together when the pieces are related. Four signals:

- they share information;
- they are used together, and the pairing runs both ways (a block cache uses a
  hash table, but a hash table has many other uses, so they stay apart);
- a simple higher-level category holds both;
- you cannot understand one without looking at the other.

## Bring together when

- **Information is shared.** Both pieces know the format, so the format would be
  written twice.
- **The interface gets simpler.** Combining removes an interface that existed
  only to pass data from one piece to the other, or lets the combined module do
  something automatically that every caller had to ask for.
- **Duplication goes.** Factor the repeated block out, or restructure so the block
  runs in one place only. A one-line snippet is not worth a method call, and a
  snippet that touches many locals needs a signature that cancels the gain.

## Keep apart when

- **A general mechanism carries one special use.** The undo history belonged in a
  `History` class; the text-specific undo actions belonged in the text class, and
  the policy for grouping them belonged in the user interface. Three pieces, three
  homes, and no piece needs to know what the others do. When a general mechanism
  contains code for one caller, the mechanism leaks that caller's world.
- **The lower layer must stay general.** Push special-purpose code upward, into
  the layer that has the purpose.

## Splitting a method

Length is not a reason. A hundred-line method with a simple signature and readable
blocks is deep. Splitting creates an interface, and it separates code that may need
to be read together.

Two splits can be right:

- **Extract a subtask.** The parent keeps its interface and calls the child. This
  works only when the child is separable: a reader of the child needs nothing from
  the parent, and a reader of the parent needs nothing from the child's body. The
  child is usually general-purpose enough to serve other callers.
- **Split an over-complex interface** into two methods that callers can use
  independently, each simpler than the original. Most callers should need one of
  them. If every caller needs both and passes state between them, you have made two
  shallow methods, and the split failed.

The red flag is **conjoined methods**: you flip between parent and child to
understand either. The code is physically apart and logically one thing.

## Example: the logging class that should not exist

One project logged errors through `NetworkErrorLogger.logRpcOpenError(req, dest,
e)`. Every method was one line, needed a paragraph of documentation, and had one
call site. A reader at the call site flipped to the logger to check the message; a
reader at the logger flipped back to see the purpose. Deleting the class and
writing the log statement where the error is detected removed an interface and
made both ends readable.

That is the shape to look for: a dedicated method, class or module whose every
member has exactly one caller.

## Where the idea is taken too far

- Merging large modules gives one class two jobs. Merge when the responsibilities
  cannot be told apart, not to avoid a seam.
- Convenience grouping is not a relationship. "They are both about storage" is a
  category, not a shared decision.
- Extraction that forces the caller to pass state back and forth, or to call the
  pieces in a particular order, is the shallow split in disguise.
