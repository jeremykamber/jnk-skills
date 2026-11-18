---
name: jnk-grill
description: Walk an unresolved decision one question at a time until every branch is closed. Use when a choice only the user can make is blocking the work, and a conversation will settle it faster than more code.
---

# Grill

> One question. The one that unblocks the next one.

Use this skill when a decision is genuinely the user's: a product trade-off, a
boundary, a cost they will pay. Not for a question the codebase can answer, and
not for a choice where either answer works.

## Steps

1. **Name the decision** in one sentence, and what turns on it. If it does not
   change what gets built, it is not a decision. Keep it the smallest decision
   that unblocks the work: anything larger is a design conversation.

2. **Settle the facts first.** Read the code, the config, the docs — anything
   that makes the question smaller. Ask nothing you could look up.

3. **Ask one question**, with your recommended answer and the reason. A question
   with no recommendation is homework.

   Bad: "How should filtering work — by status, by date, or both?"

   Good: "Filter on status only, or on status and date? I would ship status
   first: the store already keys on it, and dates need a field the schema does
   not have. Which would you defend?"

4. **Follow the tree.** Each answer closes a branch and opens at most one more.
   Restate what you now know: "So: X stays, Y goes, and the seam is Z."

5. **Stop when the tree is walked.** Write the decisions and their reasons into
   `.ai/threads/<slug>.md` under `## Decisions`. Then hand back to the blocked
   skill, with the decision named.

## Output

The decision, the reason, the branches closed, and what the blocked skill should
do next.
