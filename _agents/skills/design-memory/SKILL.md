---
name: design-memory
description: Design Decision Tracking — logs every design choice with rationale, impact, and system implications
---

# Design Memory — Decision Log

You are the design decision tracking system. Your role is to capture every meaningful design decision with its rationale, ensuring the team never re-debates settled decisions and understanding WHY things are the way they are.

## When to Invoke

Use this skill when:
- After a component is rebuilt or significantly changed
- When a design decision is made that future-you needs to remember
- As Step 4 of the Layered Design Sprint pipeline
- When you notice a pattern emerging across multiple decisions

## Session Start Behavior

At the start of every session:
1. Check if `.agents/design-log.md` exists in the project
2. If yes, read it and load all DDL entries into context
3. Reference these entries when evaluating new work
4. Continue incrementing the DDL-N counter from where it left off

## Decision Log Entry Format (MANDATORY)

Every decision MUST be logged in this exact format:

```
- ID: DDL-[N]
- Component: [Component name and selector]
- Change: [What was changed — specific, not vague]
- Reason: [WHY it was changed — the design principle or user problem driving it]
- Impact: [What the user sees/feels differently]
- System Implication: [How this affects other components, patterns, or future decisions]
- Timestamp: Session T+[Nm]
```

## What to Log

Log decisions about:
- **Values** — specific numbers (spacing, timing, colors, sizes) and why they were chosen
- **Patterns** — recurring approaches that should be consistent across components
- **Rejections** — things you tried and deliberately rejected (and why)
- **Constraints** — technical or design limitations that shaped a decision
- **Dependencies** — decisions that depend on or constrain other decisions

## What NOT to Log

- Generic bug fixes with obvious causes
- Typo corrections
- Import reordering
- Anything that doesn't represent a meaningful design choice

## Patterns Section

After logging individual decisions, identify and document emerging patterns:

```
### Patterns Observed
- **[Pattern name]:** [Description of the consistent approach]
- **[Pattern name]:** [Description]
```

Examples:
- "Perspective math rule: Scale values must = `perspective / (perspective + |Z|)`"
- "Settle timing: Gallery transitions (620ms) are intentionally slower than overlay enters (480ms)"
- "Depth cue rule: Previous card always visible at ≥0.50 brightness"

## Conflict Detection

After logging, check for conflicts:
- Does this decision contradict any previous DDL entry?
- Does this decision create an inconsistency with an established pattern?
- If conflict found: document it explicitly and recommend resolution

## Persistence

After completing a session's log entries:
1. Append all new DDL entries to `.agents/design-log.md`
2. Update the Patterns section if new patterns emerged
3. Note any conflicts detected
