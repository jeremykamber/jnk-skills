# herdr — the mechanics of directing an agent on another machine

Everything here was exercised while writing this skill. `vps` is a saved machine label; `wC:p1` is
a pane id.

```sh
herdr --machine vps agent list              # panes: which agent, which cwd, which state
herdr --machine vps agent get  wC:p1        # one agent as JSON
herdr --machine vps agent read wC:p1        # the visible screen, as text
herdr --machine vps agent prompt wC:p1 "<text>" [--wait --until working --timeout 12000]
```

`herdr agent` also has `wait`, `send-keys`, `focus`, `attach`, `start`, `rename`, `explain`.

## Read the state, not your hope

`agent get` returns `agent_status` (`idle`, `working`, `blocked`, `done`), `terminal_title_stripped`
— which the agent sets to its own current task, so it is a free progress feed — and
`agent_session.value`, the path of its transcript on that machine.

`agent read` is the agent's screen: its TODO block (the item ledger ticked off), its live subagent
list, and whatever command it is running. Tail it — it is the cheapest progress signal there is, and
it shows what the agent *believes* it is doing before it reports.

## Submitting: the attachment trap

A short prompt is submitted. A long one can land in the composer as a **document attachment**
(`📄 #3`, titled with your first words) with the agent still `idle` — queued, not started. What we
saw: an 11 KB brief arrived as an attachment and the agent sat idle until nudged.

The reliable pattern:

1. Write the brief locally, `scp` it to a path on the target machine.
2. Submit a **short** prompt: where the file is, what it supersedes, and to start now.
3. Confirm pickup:

```sh
herdr --machine vps agent prompt wC:p1 "New mission, supersedes the previous one. The full work
order is at ~/release-checks/2026-10-12/fix-order.md. Read it completely and execute it end to end.
Start with Phase 0." --wait --until working --timeout 12000
```

Accepted submissions return `{"result":{"type":"agent_prompted", ...}}`. `--wait` means "observe the
state after submission": from a non-working state it requires `working` or `blocked` within 5000 ms
or it returns `agent_prompt_stalled`; a caller timeout can expire first and returns `timeout`. If
the agent is already `blocked`, the prompt is rejected with `agent_blocked` before any input is sent
— unblock it first.

Then confirm once more with `agent get` ~20 s later. A submission that reports success but leaves
the agent `idle` has not been picked up.

## Reading the agent's own transcript

Its session file is on the target machine:

```
~/.omp/agent/sessions/<slug>/<timestamp>_<uuid>.jsonl      # slug for ~/dev/kynd is -dev-kynd
```

One JSON object per line. `{"type":"message","message":{"role":"assistant","content":[{"type":
"thinking"|"text", ...}]}}`; `{"type":"custom_message","customType":"async-result"}` carries
background-job results; `{"type":"custom","customType":"tool_execution_start"}` carries the exact
command it ran in `data.args.command`.

Use it for two things: the close-out message (its own summary, which is usually better than anything
you can reconstruct from the screen), and evidence of friction — what it actually ran, where it
backtracked, what it found but did not say. Extract the last assistant text:

```sh
ssh vps 'cat ~/.omp/agent/sessions/-dev-kynd/<file>.jsonl' | python3 -c "
import sys, json
texts = []
for line in sys.stdin:
    try: d = json.loads(line)
    except Exception: continue
    m = d.get('message') or {}
    if m.get('role') != 'assistant': continue
    c = m.get('content')
    if not isinstance(c, list): continue
    t = ''.join(x.get('text','') for x in c if isinstance(x, dict) and x.get('type') == 'text')
    if t.strip(): texts.append(t)
print(texts[-1][:3000])"
```

Grep the same file for a symbol you asked about (`grep -c withResolvers <file>`) to see whether a
steer actually landed and how it was acted on.

## One tree, one writer

An agent editing a checkout you also care about is your problem, not its. Give it a worktree off the
trunk and run the project's setup script there (`.env` copy + dependency install), and keep the
user's working checkout untouched. If several agents must run at once, give each its own worktree
and branch and name a single merge owner — never several writers on one tree coordinating by
politeness. Prefer fanning out *inside* the owning agent by area (exclusive files per worker).

Leave the user's tmux layout alone. If an idle session already sits in the repo, brief that one
rather than opening new panes.

## Moving files

`scp` the brief in and pull the diff out. Keep evidence outside the repo — a checkout with a dirty
tree and evidence files in it is a checkout nobody can review. Where a diff is large, pull it once
(`git diff > /tmp/x.diff` on the target, `scp` it back) and read it in ranges rather than re-fetching.
