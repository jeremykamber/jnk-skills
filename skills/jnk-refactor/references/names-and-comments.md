# Names and comments

Read this when a name is vague, or hard to choose, or when a comment restates the
line below it, or when the comment for a method has to be long to be complete.

*Sources: ch. 13 (what comments describe; precision; intuition; interface
documentation), ch. 14 (choosing names), ch. 15 (comments first), ch. 16.2–16.6
(maintaining comments).*

## Names

Two properties: precision and consistency. A precise name creates an image of the
thing, including what it is not.

The book's worst case cost six months. A file system used `block` for two things:
a physical block on disk and a logical block in a file. A `block` holding a logical
number reached code that wanted a physical one, and an unrelated disk block was
zeroed. Several people read the faulty line and assumed the name meant what it
said. `fileBlock` and `diskBlock` would have made the mistake impossible.

Tests to apply while refactoring:

- **Would a reader guess what this means, seeing the name alone?** If not, the name
  is too generic: `getCount()` of what, `x` and `y` for what.
- **Does a boolean read as a predicate?** `cursorVisible`, not `blinkStatus`.
- **Is the name too specific?** `delete(Range selection)` claims the text is always
  selected. `range` is the honest word.
- **Is it hard to pick a name?** That difficulty is the finding. The entity is
  probably two things, or it has no clean definition. Split it. `depth` cannot see
  this one; you have to notice it and treat it as a design signal.
- **Is one term used for two things, or two terms for one?** Both are bugs in
  waiting. One term for one thing, always, and never for anything else. When you
  need a pair, prefix it: `srcFileBlock`, `dstFileBlock`.

## Comments

The rule: a comment describes what is not obvious from the code beside it. So
"beside" means the declaration or the block, never the whole application.

- **Repeats the code.** Ask whether someone who has never seen the code could
  write this comment from the line alone. If yes, delete it, or replace it with the
  thing the line does not say. `depth` reports this as `comment-repeats-code`.
- **Down for precision.** On a declaration, add what the type cannot say: units,
  whether a bound is inclusive, what null means, invariants, who frees or closes
  the resource. `// Current offset in resp Buffer` says nothing; the position of
  the first object not yet returned does.
- **Up for intuition.** Before a block, state the intent and how control got here.
  `// Try to append the current key hash onto an existing RPC to the desired
  server that hasn't been sent yet.` explains a five-condition `if` better than a
  sentence that lists the conditions again.
- **Interface, not implementation.** An interface comment lets a caller use the
  module without reading the body. A sentence about the internal mechanism in that
  comment is a leak: it tells the caller what the abstraction was supposed to hide
  (`depth`: `implementation-narrative-comment`). Move it into the body.
- **Write it first.** For the module you are reshaping, write the interface comment
  before the body, and keep it short. A comment that cannot be short and complete
  marks an abstraction that is wrong. That is the cheapest design probe there is,
  and it doubles as the second design in step 4.

## Keeping them true

- The comment sits next to the code it describes, so a later edit walks past it.
- One decision, one comment. Everywhere else points at it: `See "Zombies" in
  designNotes`.
- A change that a reader would need later belongs in the code, not only in the
  commit message. A commit log is not where anyone looks while editing.
- Scan the diff for stale comments before you commit. This is the cheapest place
  to catch them.

## Where the idea is taken too far

- A one-line accessor may need no comment. Comment everything else rather than
  spend judgement on which lines are obvious.
- A comment pinned to internal detail goes stale fast; one at the level of intent
  survives. Prefer intent, and keep the precise version only where precision is
  the point.
