# Summarise several errors at once

The toast layer can receive a batch of errors, but `summarizeError` takes one
message. Add `summarizeErrors(messages: string[]): string` to
`src/lib/errorSummary.ts` and export it.

Rules:

- Each message is summarised by the existing `summarizeError`, so its rules for
  blank input, JSON blobs and truncation all apply unchanged.
- Identical summaries collapse to one, keeping first-seen order.
- Up to three summaries are joined with `'; '`.
- If more than three remain, show the first three and append `' (+N more)'`,
  where N counts the remaining **distinct** summaries.
- An empty list returns `'Unknown error'`.

Read the module and its test before you change it. Keep the existing tests green.
Follow the repository's conventions, and run its test command.
