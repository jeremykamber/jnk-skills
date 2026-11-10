# A compact error badge

The error badge in the header has room for about forty characters. Add
`errorBadge(message: string): string` to `src/lib/errorSummary.ts` and export it.

Rules:

- It shows the same first line `summarizeError` chooses: blank lines skipped,
  JSON/array blobs replaced by the generic phrase, and blank input giving
  `'Unknown error'`.
- A first line longer than forty characters is cut to forty and ends with `'…'`.
- A first line of forty characters or fewer is returned unchanged.

Keep the existing tests green, and keep the two behaviours from drifting apart:
a reader should not have to check two copies of the same rule.

Read the module and its test before you change it. Follow the repository's
conventions, and run its test command.
