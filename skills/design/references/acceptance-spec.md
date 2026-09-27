# The acceptance spec — `features/<feature>.feature`

The scenarios that define done, written in the language of the problem. Implementation's first slice makes this file *run*; every later slice turns more of it green. It is what the `acceptance` gate executes.

## The one rule

A scenario states **behavior and its outcome**, never the steps the code takes.

```gherkin
# yes — a user could have said this
Scenario: A bank CSV with metadata above the header is read correctly
  Given a CSV:
    """
    Account: Business Checking

    Date,Description,Amount,Balance
    01/03/2026,OPENING DEPOSIT,2500.00,2500.00
    01/05/2026,ACME SUPPLIES,-125.50,2374.50
    01/09/2026,CARD PAYMENT,-40.00,2334.50
    """
  When I convert it
  Then 3 transactions are produced
  And transaction 1 has amount 250000

# no — this is the implementation, restated
Scenario: parse() skips preamble lines
  Given the detector is configured with delimiter ","
  When parse() is called
  Then state.headerRowIndex === 4
```

The first survives a rewrite of the parser. The second has to be edited every time the code moves, which makes it a changelog, not a spec.

## The file is parsed, not transcribed

`tests/acceptance/<feature>.test.ts` reads this file at test time and matches each step against a handler — a small `World` object plus a regex per step. The scenario text and the assertion are the same string, so the two cannot drift. A scenario that cannot run is a scenario that is not a spec.

That harness is implementation's work, not yours; `design` writes the file.

## Constructs

- **`Feature:`** opens the file. The prose block under it says who this is for, what it does, and any invariant holding across every scenario — *"everything below is deterministic; no network call is ever required"*, *"amounts are integer minor units"*. That block is where the reader learns the rules that no single scenario states.
- **`Scenario:`** — one case, one behavior.
- **`Scenario Outline:` + `Examples:`** — one table row per case. Reach for it whenever the same shape repeats across many inputs (formats, locales, encodings): the table *is* the coverage, and extending it costs one line where a new scenario costs six.
- **`"""` doc strings** — multi-line input, verbatim.
- **`# ---` comment banners** — group scenarios by theme: reading a file, values, dates, rows that are not transactions. A four-hundred-line feature file is normal and good; an ungrouped one is not.

## Scope

Deterministic, no network, no clock. A scenario needing a real browser goes in `e2e/` instead — the acceptance suite skips it, so name that step in the file and leave a comment saying the browser path covers it. An exception the reader can see is deliberate; one they cannot is a hole.

## Anti-patterns

- Naming functions, classes, or files in a step — that is the implementation leaking into the spec.
- Asserting internal state (`state.x`, a private field) rather than observable output.
- One scenario walking through five behaviors: when it fails, its name tells you nothing.
- Encoding a bug as the expectation. When the code and the spec disagree, that is a finding to raise — not a check to update.
