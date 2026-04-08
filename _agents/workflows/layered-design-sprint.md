---
description: Layered Design Sprint — chains critique → rebuild → code review → log in a single pass for any component
---

# Layered Design Sprint

A 4-step pipeline that takes any UI component from critique to shipped, with full design rigor.

## Pipeline

### Step 1 — Critique `/product-design`
Read the skill at `.agents/skills/product-design/SKILL.md` and execute it against the target component.

Deliver the full critique structure: BLUNT VERDICT → WHAT'S NOT WORKING → WHAT'S HOLDING IT BACK → HOW TO FIX → WHAT GREAT LOOKS LIKE.

### Step 2 — Rebuild `/SovereignMotionArchitect`
Read the skill at `.agents/skills/SovereignMotionArchitect/SKILL.md` and execute the rebuild.

Apply the critique prescriptions with cinematic motion precision. Document the architecture table, motion decisions, files modified, and performance notes.

### Step 3 — Code Review `/elite-frontend-engineer`
Read the skill at `.agents/skills/elite-frontend-engineer/SKILL.md` and execute a full code review.

Review the rebuilt code for runtime correctness, CSS validity, design fidelity, animation performance, edge cases, and accessibility. Fix all issues found.

### Step 4 — Log `/design-memory`
Read the skill at `.agents/skills/design-memory/SKILL.md` and log all design decisions.

Create DDL entries for every meaningful decision made during the sprint. Identify patterns. Check for conflicts with previous decisions.

## Rules

1. **All 4 steps run in sequence.** Never skip a step.
2. **Step 2 must address everything from Step 1.** The rebuild is the response to the critique.
3. **Step 3 must catch bugs from Step 2.** Fix them in-place before moving to Step 4.
4. **Step 4 must document everything.** Future sessions depend on this log.
5. **The sprint artifact should be saved** as a markdown file documenting all 4 steps for the session record.
