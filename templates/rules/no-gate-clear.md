---
description: "Fires when the agent edits the gate stack, so a cleared finding gets a second look."
condition: "**/gates.json"
interruptMode: never
---
Changing `gates.json` to clear a finding is not allowed. A threshold is not a defect: fix
the cause, or if a gate is genuinely miscalibrated, say so out loud and make it the user's
call in its own commit. Adding a gate the project now has tooling for is fine.
