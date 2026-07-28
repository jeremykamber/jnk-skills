# Engineering Workflow

## Purpose

This document defines the process an AI coding agent follows when making changes.

The goal is not merely to produce working code. The goal is to produce changes that reduce unnecessary complexity and leave the system easier to understand, modify, and extend.

---

# Workflow

## 1. Understand

Before changing anything:

- Understand the user's goal.
- Inspect the existing implementation.
- Identify relevant files and dependencies.
- Determine current behavior.
- Identify assumptions and unknowns.

Do not propose solutions before understanding the problem.

---

## 2. Plan

Before implementation:

- Describe the intended change.
- Identify the smallest coherent change.
- Explain tradeoffs.
- Identify risks.
- Explain how success will be verified.

---

## 3. Implement

During implementation:

- Follow existing conventions.
- Keep changes focused.
- Avoid unnecessary abstractions.
- Prefer simple solutions.
- Preserve existing behavior unless intentionally changing it.

---

## 4. Verify

After implementation:

- Run relevant tests.
- Check behavior.
- Review the diff.
- Confirm the change matches the original intent.

Never declare success without evidence.

---

## 5. Review

Before finishing:

Ask:

- Did this reduce or increase unnecessary complexity?
- Is ownership clear?
- Did I introduce unnecessary coupling?
- Did I add abstractions that have not earned their cost?
- Will the next engineer understand this?
