---
description: "Flags a stub body left in the tree."
globs: ["*.ts", "*.tsx"]
astCondition: "throw new Error(\"not implemented\")"
interruptMode: never
---
A stub body is unfinished work. Implement it, or if the feature is genuinely out of scope,
delete the call site and its caller's dead branch rather than shipping a runtime throw.
