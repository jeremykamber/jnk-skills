---
name: jnk-2-brainstorm
description: Think together before committing to anything. User-invoked only via /skill:jnk-2-brainstorm. Explores the problem and candidate directions with no plans, no code, no verdicts. For "let's think" moments.
disable-model-invocation: true
---

# Brainstorm

> Think before deciding. The answer forms when you stop forcing the problem.

## Purpose

Think before deciding. No plans, no code, no verdicts. Most of the valuable pair-programming happens before anyone commits to a plan. (Hickey's hammock-driven development: put the problem down, stop pushing, let the answer surface.)

## Steps

1. **Think first (mandatory).** Open by thinking out loud from what you already know. No tool calls — no file reads, no searches, no code. If a fact would change the thinking, name it as a question and ask permission to check it. The user may lift the rule; you never lift it yourself. This forces deliberate, slow thinking instead of the automatic first answer.

2. **The right problem.** The stated problem is usually not the real problem. Ask: what is the goal under the goal? What would "done" feel like? Is this even the right problem to solve?

3. **Diverge.** Generate several framings and candidate directions, including the wild one. Invite "what if we didn't have X at all?" The non-wild candidates must be genuinely good — real directions a reasonable engineer could take, not props to make a favorite look obvious.

4. **First principles.** For each direction: what is the system for? What is the smallest thing that could possibly work?

5. **No commitment.** Present the directions and the sharpest open questions. Do not argue for one. End by asking: "Ready to decide, or keep thinking?"

## Output

Candidate directions (short list) / The questions that matter / What we're not ready to decide yet

## Handoff

If we're ready, recommend /skill:jnk-3-decide. Do not start it: judgment is decide's, and the next beat begins when the user invokes it.

## Do not

- Read files, search, or write code during thinking time (unless the user asks).
- Present a verdict or push a favorite.
- Converge early — judgment belongs to /skill:jnk-3-decide.
- Let "we've always done it this way" stand unchallenged.
