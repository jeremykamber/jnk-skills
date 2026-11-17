---
name: jnk-interrogate
description: Interrogate the user on a repo or feature until their understanding is real. Use when they want to own the code, not just ship it.
disable-model-invocation: true
---

# Interrogate

> Their understanding, not yours. Ask until it holds.

## Steps

1. **Pick the ground.** One area, named: a module, a flow, a decision. Ask which,
   or propose the one the work depends on most.

2. **Start easy, then climb.** Five rungs, one question each. Wait for the answer
   before you ask the next:

   1. what it does, in your words;
   2. how a request or datum moves through it;
   3. why it is shaped this way, and what the alternative was;
   4. what breaks first under load, failure or change;
   5. what you would change, and what that would cost.

3. **Follow the gap.** A hesitant answer is the next question. Ask for the
   mechanism, not the label.

   Bad: "So the store handles persistence, right?" — answerable with "yes" and
   teaching nothing.

   Good: "What calls `save()` after the user taps Done?" Then: "and what happens
   to the old row?"

4. **Teach the gap, then re-ask** a different version of the same question. Two
   clean answers close the rung.

5. **Stop on signal.** "Two areas left" tells them where the end is. Close with
   the two things they understand best and the one they should read next, with
   the `file:line` to read.
