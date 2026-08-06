# Squawk Sheet

A squawk is a defect or debt noticed but not fixed now — the aviation habit: log it in the book so it is not forgotten, then get on with the flight. Squawks are never silently fixed; they are logged, offered, and triaged.

## Format

```
[squawk] <severity> | <location> | <what> | <why deferred>
```

## Severity

- high — will bite soon (fix before shipping if the user agrees)
- med — will bite eventually
- low — worth remembering

## Taxonomy: the debt quadrant

Name the quadrant so the user can triage (after Cunningham's debt metaphor, as mapped by Fowler):

- prudent & deliberate — a conscious tradeoff ("we deferred indexing; fine at this scale")
- prudent & inadvertent — a decision that now looks wrong ("the abstraction we chose turned out to complicate")
- reckless & deliberate — knowingly bad ("we skipped the tests to ship; we should add them")
- reckless & inadvertent — accidentally bad ("we didn't know the pattern existed")

Quadrant + severity + location tells the user whether a squawk is debt to schedule or rot to remove.
