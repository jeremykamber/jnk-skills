---
description: "Use before designing or building anything, and whenever a requirement feels off or came from someone senior. Make the requirement less dumb before you satisfy it."
---

# Question the requirement

**Why.** Requirements arrive as facts and are usually guesses. A wrong requirement wastes every hour spent satisfying it, and the more senior the author, the less anyone questions it.

**Pattern.**

1. Give every requirement a name: the person who asked for it, not a team, a ticket, or a document. A requirement with no owner is one an intern invented two years ago.
2. Ask what breaks if it is dropped. If nothing breaks, it was not a requirement.
3. Question it out loud, even when the author is senior. Everyone is wrong some of the time, including the person who gave you this one.
4. Restate the real problem in your own words, then check the requirement against it.

**When it applies.** Before designing or building. After two fixes fail the same way: the shared premise is the suspect, so question it instead of writing a third fix. Any time a requirement has no owner.

**When it does not.** A hard external constraint (a protocol, a law, a contract) is not yours to question. Record who owns it and move on.

**Cite it.** Name the requirement you questioned and what changed as a result. If nothing changed, say so.
