---
description: "Use when about to add a part, layer, parameter, option, flag, or process step. Try to delete first; a smaller base is cheaper to build on."
---

# Delete before you add

**Why.** Additions are permanent and every one must be learned, kept consistent, and tested. The most common error is building on top of something that should not exist. Removing dead weight first makes the thing you are about to build smaller.

**Pattern.**

1. List every part the change would add: a module, a layer, a parameter, an option, a flag, a step, a config key.
2. For each, ask what breaks if it is gone. Delete the ones nothing breaks for.
3. Delete the old way too: the unused export, the dead branch, the superseded path an agent would otherwise copy.
4. If you are never adding deleted things back, you are not deleting enough. Aim to over-delete a little.

**When it applies.** Any addition, refactor, or rewrite. Any diff that only grows.

**When it does not.** Required behavior, a guarantee, error handling for a case that can happen, or a seam a boundary needs. Argue the case it exists for before removing it; a hunch is not an argument.

**Cite it.** Name what you deleted, or state plainly that nothing could be deleted and why.
