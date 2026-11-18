# Information hiding and leakage

Read this when one decision, fact or data shape lives in two modules, when two
files keep changing together, or when the code is split by the order it runs in.

*Sources: ch. 5 (information hiding, leakage, temporal decomposition), ch. 6
(general-purpose modules), ch. 9.1–9.4.*

## The principle

Each module hides a few design decisions: how a file format is parsed, how a
block maps to a disk address, how threads are scheduled. The decision lives in
the implementation and never in the interface. Then a change to that decision
touches one module.

Leakage is the reverse. A decision is reflected in two modules, so both must
change together, and no compiler complains when one of them is missed.

The question to ask is the book's own: **how can I reorganise these classes so
that this piece of knowledge affects exactly one module?**

## Two ways it leaks, and why the second one is worse

- **Through the interface.** A `getParams(): Map` hands the internal map to every
  caller. The representation is now public. The better interface asks for one
  parameter and converts it (`getParameter`, `getIntParameter`), so the
  representation stays inside.
- **Through the back door.** Two classes both know a file format. Neither exposes
  it, and nothing in either signature says so. This is worse because it is
  invisible: the dependency exists with no declaration to find it by.

`depth` sees the mechanical half of this: `leaked-literal` (one string, regex or
magic number written twice), `leaked-shape` (one field list declared twice), and
`co-change-without-import` (two files that keep changing together with no import
between them). That last one is a back-door leak caught by history instead of by
reading.

## Temporal decomposition

The structure mirrors the order of execution: a class that reads a file, a class
that modifies it, a class that writes it. Both ends of that pipeline know the file
format, so the format is written twice.

The test is a question about knowledge, not order: **do these two steps read the
same facts?** If yes, they belong in one module. In the book's HTTP project, one
class read the request into a string and another parsed it, but the reader had to
parse headers to find `Content-Length` and learn where the request ended. Both
classes knew the whole format, and the parsing code was duplicated. Merging them
made the code shorter and gave callers one method instead of two.

Order still matters. Put it where it belongs: in the calling code, or in a
module whose stages genuinely use different information.

## The general-purpose answer

A special-purpose interface leaks the caller's world into the module. The text
class with `backspace(cursor)`, `delete(cursor)` and `deleteSelection(selection)`
knew about keyboard keys. The general-purpose interface — `insert(position,
text)`, `delete(start, end)`, `changePosition(position, chars)` — hides the text
and lets the user interface own the keys. It is fewer methods, it is smaller in
total, and the caller can read the behaviour off the call site.

Make the module **somewhat** general-purpose: its functionality reflects today's
need, its interface does not. Three questions keep it honest:

- What is the simplest interface that covers every current need?
- In how many situations will this method be used? One is a flag that it is too
  special-purpose.
- Is this easy to use for today's need? If callers write loops around it, the
  interface is too low-level.

## Moves

- **Merge the pair** when both are small and tied to the knowledge they share.
- **Give the knowledge one owner** and make the other module import it
  (`depth --explain leaked-literal`).
- **Raise the interface** so the caller asks a question instead of reading a
  structure.
- **Split by knowledge**, not by step, when one module holds two unrelated
  decisions.

## Where the idea is taken too far

- Hiding what a caller needs is a false abstraction. The user interface really
  does need to know which characters backspace deletes, so hiding that produced
  obscurity, not simplicity. When the information is needed outside, expose it.
- Configuration parameters are the escape hatch that avoids deciding. Export one
  only when a caller can compute a better value than the module can. Prefer a
  computed default (ch. 8.2).
