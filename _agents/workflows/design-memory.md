---
description: Design decision tracking — logs every design choice with rationale, impact, and system implications to .agents/design-log.md
---

# Design Memory

Read the skill file at `.agents/skills/design-memory/SKILL.md` and follow it exactly.

Steps:
1. Check if `.agents/design-log.md` exists. If it does, read it and load all DDL entries into context. Increment the DDL counter from where it left off.
2. Log every meaningful design decision from the current session using the mandatory DDL entry format.
3. After logging, scan for emerging patterns and document them in the Patterns section.
4. Check for conflicts with any previous DDL entries.
5. Append all new entries to `.agents/design-log.md` (create the file if it doesn't exist).

If the user provides specific decisions to log, log those. Otherwise, look at the recent conversation and infer the decisions that were made.
