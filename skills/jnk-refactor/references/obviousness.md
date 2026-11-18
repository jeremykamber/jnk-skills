# Obviousness and consistency

Read this when a careful reader would guess wrong about what the code does, when
two similar things are done differently, or when following one call means opening
four files.

*Sources: ch. 17 (consistency), ch. 18 (code should be obvious), ch. 19.6 (getters
and setters), ch. 16.1 (stay strategic).*

## What obvious means

Code is obvious when a reader with no history looks at it and their first guess is
correct. Obscurity is one of the two causes of complexity, so this is not a
politeness rule; it is the half of the design the tests cannot check.

Obviousness lives in the reader's head, so the reader decides. If a reviewer says
it is not obvious, it is not obvious, however clear it looks to its author.

## Three ways to make code obvious

1. **Need less information.** Abstract, and delete special cases. The fewer
   branches and the fewer facts a reader must hold, the less there is to get wrong.
2. **Reuse what the reader already knows.** Follow the conventions of the codebase,
   and be consistent: a pattern the reader has met before needs no explanation.
3. **Put the information in the code.** Precise names, and strategic comments where
   the code cannot say it.

## Consistency

Similar things the same way; dissimilar things in different ways. The second half
matters as much as the first: forcing unlike things into one pattern teaches the
reader a rule that is false.

- **One term for one thing.** The naming chapters and this one are the same rule at
  different scales.
- **Follow what is there.** "When in Rome": look at the neighbours, then match
  them. Method order, casing, error shape, the shape of a test.
- **Do not improve a convention on the way past.** Ask what new information
  justifies it, and whether the whole codebase will be updated. If the answer to
  both is not yes, match the convention and leave the improvement on the record.
  Half-migrated convention is worse than the old one.

Enforce the mechanical conventions with a check rather than a paragraph. A script
that fails the commit is how a convention survives the next new contributor.

## What makes code less obvious, and the repair

- **Event-driven control flow.** No call site, and which handler runs depends on
  registration. Repair: the interface comment for each handler states when it runs.
- **Generic containers.** `Pair<Integer, Boolean>` returned from a method leaves
  the caller with `getKey()` and `getValue()`. Repair: a small named type with
  named fields. Design for the reader, not for the writer's convenience.
- **A declaration that disagrees with the allocation.** `List<Message>` holding an
  `ArrayList` misleads about performance and thread-safety. Repair: match them.
- **Code that breaks expectations.** A `main` that returns while work continues in
  other threads. Repair: document it at the call site, not only in the constructor.
- **Getter and setter pairs.** They expose the representation, one line at a time.
  Repair: delete the accessor and ask the module for the thing the caller actually
  wants.
- **Layout.** Whitespace groups the blocks of a method, and one blank line between
  a comment and its block is what makes the sequence readable.

## Where the idea is taken too far

- Forcing unlike things into one shape in the name of consistency creates
  confusion: the reader learns "if it looks like an x it is an x" and then it is
  not.
- A named wrapper type for a genuine one-off is ceremony. Use the container when
  the values have no meaning a reader needs to name.
