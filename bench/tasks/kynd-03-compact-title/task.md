# A compact toast title

The toast header needs a shorter title than the badge has room for. Add
`toastTitle(message: string): string` to `src/lib/errorSummary.ts` and export it.

Rules:

- It starts from the same first non-blank line `summarizeError` chooses.
- A leading `Error: ` (the word, the colon and the space after it) is dropped
  once, so `Error: Error: boom` gives `Error: boom`.
- After that drop, a JSON/array blob collapses to `GENERIC_ERROR_SUMMARY` and
  blank input gives `'Unknown error'`, as they do today.
- The title is capped at 24 characters and ends with `'…'` when it is cut. The
  cap counts what is left after the prefix is dropped, and exactly 24 characters
  is not cut.
- Keep the existing tests green.

Read the module and its test before you change it. Follow the repository's
conventions, and run its test command.
