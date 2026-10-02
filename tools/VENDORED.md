# The vendored gate tooling

This checkout carries its own copy of the gate tooling, so it stands alone: clone
it, run `./install.sh`, and the beats work. The copy is:

| Here | What it is |
|---|---|
| `tools/gates` | the gate runner — `gates`, `gates --changed`, `gates --init` |
| `tools/crap` | the CRAP metric (complexity × coverage) |
| `tools/depth` | the design readings and the nine decidable red flags |
| `tools/mutate-changed` | Stryker scoped to what changed, with the tests that cover it |
| `tools/adapters/` | the per-language adapter files `gates --init` writes |
| `checks/` | the tools' own test suite, fixtures included |
| `templates/dependency-cruiser.cjs`, `templates/stryker.conf.cjs`, `templates/stryker-vitest-runner.mjs` | the configs the `arch` and `mutation` gates read, and the plugin that fixes Stryker's broken vitest runner |
| `templates/constitution.md`, `templates/feature.feature` | the shape a project's principles and acceptance spec start from |

Two files under the same names are **not** vendored, because both are this
workflow's own: `gates.json` at the root is the stack that verifies these tools,
and `templates/gates.json` is the stack the workflow recommends to a project.
Neither is a copy of anything in the kit.

## Where it came from, and how it moves forward

The files are developed in the sibling `uncle-bob-workflow` kit. `tools/vendored.sha256`
records a hash per file at the moment of the last sync, and
`tools/sync-from-kit.sh` is the only thing that should change them:

```sh
./tools/sync-from-kit.sh            # check: report drift, change nothing
./tools/sync-from-kit.sh --sync     # copy the kit's current files in, re-record the hashes
```

The check runs as the `vendored` gate in `gates.json`, so the workflow's own
stack fails on a copy that has drifted. It reports two different things, because
they need different answers:

- **edited here** — the file no longer matches the recorded hash. Either this
  checkout is the newer one, in which case the change belongs in the kit as well
  (the next `--sync` would overwrite it), or something changed a tool without
  saying so.
- **kit moved on** — the kit's copy differs from this one. The copy is behind;
  `--sync` moves it forward.

With no kit on the machine the check still works: it compares the files against
the manifest, which is what a fresh clone can prove on its own.

## Why a copy at all

The workflow's own rule is that two copies of a gate drift silently, the same way
a copied principle list does — which is exactly what this manifest, the check,
and the gate exist to prevent. Portability is what the copy buys: a checkout of
this repository alone can run every beat, verify itself, and stand up a
project's stack, with no second repository to find and no path to guess.
