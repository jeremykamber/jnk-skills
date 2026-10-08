---
description: "Judges whether a reply claims a check passed without showing it was run."
scope: text
question: "Does the reply claim a gate, test, build, or command passed without showing the command and its output?"
interruptMode: never
---
A claim that a check passed is evidence only with the command and what came back. Show the
run, or say plainly that it was not run. `It should work` is not a result.

This rule is judged, not deterministic: it asks a yes/no question of a completed reply, so
it needs `ttsr.judge` configured (`auto` uses a native judge model). With no judge it
registers but never fires.
