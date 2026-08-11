# Decision Record

Written at the end of /skill:jnk-3-decide. About ten lines. One record per decision.

## Template

```
# <thread name>

Status: accepted

Decision: <chosen approach, one sentence>

Context: <why this problem exists>

Alternatives: <the options seriously considered>

Reason: <why this option — name the lens, e.g. "smallest coherent change">

Failure mode to watch: <the inversion check result>

Measured by: <metric + target, or "—" when no measurable outcome exists yet>

Verification: <how success will be shown>
```

Measured by is the optional metric that proves the change — latency, cost per call, quality score, conversion. Tests verify the code; the metric verifies the change.

## Thread name

`<feature>-<option-letter>-<slug>` — e.g. `oauth-c-github-module`

- feature: the area (oauth)
- option-letter: which option won (a, b, c — matches the options discussion)
- slug: the shape (github-module)

Use the thread name for: the branch name, the route title, squawk tags, the session log.

## Where it lives

`docs/adr/<thread-name>.md` — one file per decision, committed with the code. Decisions are project truth, not session state: the model finds them at a stable path, in every feature. (Fall back to the notebook's `.ai/contexts/<dir>/decisions.md` only when the repo can't commit docs.)
