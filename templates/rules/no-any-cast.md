---
description: "Flags an `as any` cast in TypeScript."
globs: ["*.ts", "*.tsx"]
astCondition: "$X as any"
interruptMode: never
---
Do not cast to `any`. Narrow the type with a guard, parse the value at the boundary, or
return a typed result. A cast to `any` moves the failure to runtime, where the caller
cannot see it.
