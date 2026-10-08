---
description: "Flags an assertion that cannot fail."
globs: ["*.test.ts", "*.test.tsx"]
astCondition: ["expect(true).toBe(true)", "expect($A).toBe($A)"]
interruptMode: never
---
An assertion that compares a value to itself, or asserts a literal against itself, cannot
fail. It reports the id of the method call, not the behavior. Assert a literal expected
value against the code's output.
