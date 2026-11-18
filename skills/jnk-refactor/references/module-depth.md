# Module depth

Read this when the interface costs as much as the body: one-line wrappers, thin
accessors, a class per noun, adjacent layers that offer the same abstraction.

*Sources: ch. 4 (deep modules, classitis), ch. 5.7 (defaults), ch. 7.1–7.3
(pass-through methods, decorators), ch. 9.2.*

## The test that decides it

A module is deep when the interface is much simpler than the implementation. Its
cost to the system is the interface; its benefit is the functionality. The test is
not size. It is this: **can a caller use this without knowing what is inside?**

Write the interface comment first and check its length against the body.

- The comment fits in a few lines and says everything a caller needs: the module
  is deep. Keep the body as long as it wants.
- The comment has to describe the implementation to be complete: the module is
  shallow. The comment is the measurement, so measure before you move code.

Ousterhout's shallowest example, from a student project:

```java
private void addNullValueForAttribute(String attribute) {
    data.put(attribute, null);
}
```

The documentation for that method is longer than the method. The call site is
longer than the manipulation it hides, and the caller still has to know that the
value lands in `data`. The method adds an interface and hides nothing.

## Three ways a module goes shallow

1. **A method that is its own name.** The body says exactly what the signature
   says, so there is nothing left to hide. `depth` reports the one-statement case
   as `shallow-method`.
2. **Classitis.** Small classes and short methods treated as the goal. Each has an
   interface, so the system pays many small costs, and none of them hides much.
   The extreme: Java's `FileInputStream` + `BufferedInputStream` +
   `ObjectInputStream` to read one file, where the first two objects are dead the
   moment the third exists.
3. **The interface duplicated across a layer.** A pass-through method forwards to
   a method of the same name and adds nothing (`depth`: `pass-through`). A
   decorator does the same thing for a reason, and usually it is still a bad
   trade: a lot of boilerplate for a little new behaviour.

The book's pass-through example: 13 of 15 public methods in `TextDocument` just
called `TextArea`. The classes had tangled responsibilities, and the fix was to
merge three classes into two with a clean split.

## Moves

`depth --explain shallow-method` and `--explain pass-through` print the menus:
inline into the caller, raise the interface, expose the lower object, redistribute,
merge. Beyond the menu:

- **Raise the interface.** Replace the three steps a caller performs with one
  method that performs all three (ch. 5.5). This is the move that makes a module
  deeper without making it bigger.
- **Make the common case the default.** A parameter almost every caller passes
  the same value to is a default that leaked out. Buffering should not have to be
  asked for. The rare caller gets a separate way to override it, and most callers
  never learn that way exists (ch. 5.7).
- **Delete the needless export.** A symbol exported from a module that names it
  nowhere is interface paid for by nobody (`depth`: `needless-export`).

## Where the idea is taken too far

- Shallow modules are sometimes unavoidable. A linked-list class hides little, and
  the language may still want it.
- Merging upward has a floor. One class for the whole application is not deep, it
  is the absence of decomposition.
- The same signature in two methods is fine when each contributes something. A
  dispatcher picks which of several methods runs; a set of drivers implement one
  interface for different hardware. Those are deep, not pass-through.
- A decorator earns its place when the new behaviour is genuinely optional and
  separable. When most callers want it, it belongs in the base class.

## Before you commit

- The interface comment is now shorter than the body, and a caller reads it
  instead of the code.
- The callers know less than they did, and the number of things they must call
  went down, not up.
- Nothing moved that only renames a concept. A rename is a refactor only when the
  new name carries knowledge the old one hid.
