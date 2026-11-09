---
name: jnk-verify
description: Prove a finished change with evidence, and say plainly what remains unverified. Use when implementation is done and before handing work on. Runs the gate stack, exercises the real path, audits the diff against AGENTS.md, reconciles squawks, and reports the design ledger.
---

# Verify

> Evidence, not opinion. Tests show the presence of bugs, never their absence.

## 1. Run the stack

`gates` — the project's `gates.json` **is** the definition of verified. Show the
run and its result. The failing gate's output is the instruction.

No `gates.json` is stand-up work, not a finding — but ask first, because it writes
files into a repo you may not own:

```sh
gates --init --yes        # infers the adapter; --adapter <name> when it cannot
depth --update-baseline   # accept today's design findings so the ratchet has an anchor
gates --list              # the stack, and any config it cannot find
```

Then delete the gates whose tooling is absent and name what you dropped. A
*threshold* is the user's decision; a missing stack is not.

## 2. Exercise the real path

The stack is evidence about the code, not about the feature. Run the CLI with
real arguments, the route with a real request, the page in a browser, the
migration against a copy of real data — and paste what came back. When the tests
were written by the context that wrote the code, say so and treat them as the
weakest evidence in the report. `jnk-verify-app` builds the scripted way to drive
an app the same way every session.

## 3. Prove the blast radius

Name the one fact this change is safe because of, and climb as far as is cheap:

you said so → you pointed at `file:line` → you showed the bad case cannot happen
→ you ran it → you reproduced it in the running app.

Say where it stopped. List what you checked and cleared separately from what you
confirmed.

## 4. The design ledger

Baseline the base ref once, then read this change's own findings:

```sh
git worktree add /tmp/base <ref>
(cd /tmp/base && depth --update-baseline --baseline /tmp/base.json)   # once
depth --changed --base <ref> --baseline /tmp/base.json --json        # on the branch
```

`new` is what this change introduced; `paid` is what it retired. For each new
finding: fix it, or write one line answering why it is wrong. A finding you
neither fix nor answer is one you decided to keep — say so.

## 5. Audit against the rules

Hand a subagent the diff and the `AGENTS.md` files themselves — the machine's and
the project's, never a summary of them — and ask which principles the diff
breaks, with `file:line` for each. Report every finding, including the ones you
judge wrong, with your reason.

## 6. Reconcile and report

Squawks: fix, file, or drop, one line each. IOUs in the thread file: retired or
still open. Then the report:

- what passed, with the command and its output;
- what you ran by hand, and what came back;
- the blast-radius fact and the rung it reached;
- new design findings and what each got;
- **what you could not verify, and why** — this list is never empty;
- the AGENTS.md findings.

Report flaky tests, failures and ugly truths. A verification that hides one is
worth less than none.

## Next

`jnk-commit` for any fixes this produced. Recommend and stop.
