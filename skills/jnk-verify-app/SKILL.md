---
name: jnk-verify-app
description: Build or run the scripted way to drive an app the way a user does, so behaviour can be exercised the same way every session. Use when a change is user-facing and "I ran the tests" is not evidence.
disable-model-invocation: true
---

# Verify app

> Launch it, drive it, capture it, clean up. The same way every time.

A project with no scripted drive has no way to answer "does it work for a user",
and every session invents a different answer.

## Steps

1. **Does the drive exist?** Look for `verify-<app>` in the project's skills.
   Missing means build one (step 2); present means run it (step 4).

2. **Write the map first** — what the app is, how it starts, how to tell it is
   alive, the three or four user flows worth driving, and the fixture data each
   needs. `references/feature-map.md` is the shape.

3. **Write the driver** as a project-local skill with five parts:

   - launch;
   - doctor — is it worth driving: right port, right data, no error dialog;
   - drive — the flow, by selector or command, never by coordinate;
   - evidence — a screenshot, a transcript or the response body, saved under
     `.ai/threads/<slug>/`;
   - cleanup — kill what you started.

   Prove it once end to end, and paste the evidence.

4. **Run it and report what a user would see.** A drive that cannot fail is a
   screenshot. Where the app cannot be launched in this environment, say so and
   name it unverified.

   Bad: a screenshot of a blank list, called proof.

   Good: "Created 'buy milk', reloaded, list shows `1. buy milk`. Deleted it,
   reloaded, list is empty."

5. **Keep the map honest** — a periodic pass re-reads the flows against the
   current app. This pass never edits product code.

## Output

The drive (written or run), the evidence, and what could not be driven.
