# Delivery

How an exercise leaves this machine, what is public, and how the deck
gets its QR code. `publish.mjs` does all of it; nothing else should ever
push an exercise.

**Reasoning vocabulary**: *staging, student tree, teacher tree,
handoff, activity JSON, QR, live URL.*

## The one command

```bash
SKILL=~/.agents/skills/create-exercise
node "$SKILL/scripts/publish.mjs" <exercise-dir> --mode web|code [--name slug] [--dry-run]
```

| Flag | Effect |
|---|---|
| `--mode web` | publishes to GitHub Pages; `url` is the live page, and the publisher waits for it to answer 200 |
| `--mode code` | publishes the student tree to a repo; `url` is the repo URL |
| `--name slug` | overrides the slug (default: the directory name, lowercased and hyphenated) |
| `--owner` | overrides the account (default: `gh api user`) |
| `--out <dir>` | where `<slug>.activity.json` is written (default: the exercise's parent directory) |
| `--dry-run` | stages everything, prints the exact git/gh plan, touches no network |

Order of operations: **stage → strip → QR → README → git → repo →
Pages → handoff**. Staging copies the directory to a temp tree with
`teacher|.git|node_modules|solution` filtered out, then *hard-fails* if
`teacher/` survived — a publish that would leak a solution stops
instead of warning. The staged `.gitignore` gains a `teacher/` rule, so
the rule lives in what leaves the machine rather than in the local repo
(where it would hide your own reference solutions from git).

For `web`, the publisher creates the repo, enables Pages via the API,
and polls up to three minutes for `status=built` **and** an HTTP 200
before declaring success. If it is not live, it warns rather than
pretending: a QR code pointing at a 404 is worse than a late deck.

Running it twice is safe — an existing repo gets a remote and a push
instead of a create.

## What is public, and what is not

| Tree | Visibility | Contains |
|---|---|---|
| `web` exercise | public page (Pages) | the page, with the answers inside it |
| `code` student tree | public repo | starter code, visible tests, README, HINTS |
| `teacher/` | **never leaves the machine** | reference solution, hidden tests, rubric, notes |
| `<slug>.activity.json` | local | the handoff record for the slides skill |
| `<slug>.qr.png` | local (copied into the repo too) | the scannable code |

Same two consequences, stated once: a public web exercise's answers are
readable, so it is practice and never assessment; and a public code
repo's visible tests are the contract, so the trap lives in the hidden
tests and the rubric.

## The handoff

`publish.mjs` writes `<slug>.activity.json` and prints it:

```json
{
  "slug": "quiet-hours-boundaries",
  "mode": "web",
  "title": "Quiet hours: boundaries and edge cases",
  "url": "https://you.github.io/quiet-hours-boundaries/",
  "liveUrl": "https://you.github.io/quiet-hours-boundaries/",
  "repo": "you/quiet-hours-boundaries",
  "repoUrl": "https://github.com/you/quiet-hours-boundaries",
  "qrPng": "/abs/path/quiet-hours-boundaries.qr.png",
  "activityJson": "/abs/path/quiet-hours-boundaries.activity.json",
  "publishedFrom": "/abs/path/quiet-hours-boundaries",
  "dryRun": false
}
```

That file is the single source of truth for the QR. The `slides` skill
points an activity slide at it (`activity.artifact.activityJson`) and
`build-deck.mjs` hydrates the URL, the short display form and the QR
bytes from it — so the code on the slide and the published page cannot
drift apart. Never transcribe a URL from here into a deck by hand.

## Requirements

- `gh`, authenticated (`gh auth status`). The publisher resolves the
  owner from the API and borrows the account's email if git has no
  identity configured.
- `curl` for the Pages readiness check.
- Network. Nothing here works offline except `--dry-run`.
- For `code`: the toolchain the exercise targets (`node`, `python3`,
  `cc`/`make`) — the demos are checked with what is actually on the
  machine, and `run.sh` is what CI and the feedback layer both call.

## When it fails

- **`teacher/ survived staging`** — a symlink or a path the filter did
  not match. Fix the tree; do not edit the filter to let it through.
- **Pages not confirmed in three minutes** — the build usually lands
  late. Re-check `gh api repos/<repo>/pages --jq .status` before class;
  if it is still failing, the page itself is fine and the QR is the
  problem, so republish rather than re-teach.
- **Repo name already taken by someone else** — `--name <slug>-<year>`.
