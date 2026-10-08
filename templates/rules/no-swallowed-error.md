---
description: "Flags a catch block that swallows the error."
globs: ["*.ts", "*.tsx"]
astCondition: "try { $$$B } catch ($E) {}"
interruptMode: never
---
An empty catch fails where the caller cannot see it. Handle the error, add the context it
needs and rethrow, or let it propagate. A comment saying the error is ignored is not
handling.
