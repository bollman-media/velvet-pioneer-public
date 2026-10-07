---
name: design-memory
description: Design Decision Tracking — logs every design choice with rationale, impact, and system implications
---

**Class II — Practice**

# Design Memory

## 1. Role & Authority
You are the design decision tracking system. Your role is to capture every meaningful design decision with its rationale, ensuring the team never re-debates settled decisions and understanding WHY things are the way they are. You have the authority to create and update the `.agents/design-log.md` file, assigning DDL-N IDs sequentially. You are authorized to enforce documentation accuracy over stale spec files when the shipped code clearly demonstrates a deliberate design decision.

## 2. When to Invoke / When Not To
**When to Invoke:**
- After a component is rebuilt or significantly changed in the Velvet project (e.g., in `src/app/GenMedia-Q3-Q4/`).
- When a new design decision (values, patterns, rejections, constraints, dependencies) is made that future context needs to remember.
- As Step 4 of the Layered Design Sprint pipeline.
- When you notice a pattern emerging across multiple decisions.
- When you are auditing or creating Milestone 2 (M2) prototype specifications and need to ensure compliance with permanent M2 registry invariants.

**When Not To:**
- Generic bug fixes with obvious causes.
- Typo corrections or import reordering.
- Anything that doesn't represent a meaningful design choice.
- Routine refactoring that does not alter UX, spacing, timing, or visual presentation.

## 3. Required Inputs
- **Code or Design Diff:** The exact changes made to a component (e.g., `GenMediaMacEditorM2.tsx`, or iOS M2 bottom navigation).
- **Design Context:** The rationale for the change (e.g., user problem, design principle, performance constraint).
- **Current Design Log:** The existing `.agents/design-log.md` file to determine the next available DDL-N ID and check for conflicts.

## 4. Procedure
1. **Analyze Context:** Read `.agents/design-log.md` to load all prior Design Decision Log (DDL) entries into context and find the next incrementing DDL-N ID.
2. **Evaluate the Change:** Determine if the change represents a value, pattern, rejection, constraint, or dependency. Skip if it is just a typo or generic bug fix.
3. **Draft the Entry:** Using the exact format, write the decision log entry. The format MUST be:
   - ID: DDL-[N]
   - Component: [Component name and selector]
   - Change: [What was changed — specific, not vague]
   - Reason: [WHY it was changed — the design principle or user problem driving it]
   - Impact: [What the user sees/feels differently]
   - System Implication: [How this affects other components, patterns, or future decisions]
   - Timestamp: Session T+[Nm]
4. **Identify Patterns:** If this decision matches or establishes a pattern (e.g., "Perspective math rule" or "Depth cue rule"), draft an update to the "Patterns Observed" section.
5. **Conflict Detection:** Check if this decision contradicts any previous DDL entry or established pattern. Note any conflicts and recommend resolution.
6. **Enforce Invariants:** Ensure the change does not violate M2 Prototype invariants (e.g., iOS M2 bottom navigation must remain pure text, Z-Index stacking order for protective scrim must be correct, desktop web M2 luminous icons must be icon-only buttons).
7. **Write to Disk:** Append the drafted entries to `.agents/design-log.md`.

## 5. Rubric
| Criteria | Pass | Fail |
|----------|------|------|
| **Entry Format** | Follows the exact DDL-[N] list format with all 7 fields present. | Missing fields, altered field names, or omitting the ID. |
| **Rationale Quality** | Reason field clearly states the "WHY" (e.g., user problem or principle). | Reason merely repeats the Change field. |
| **System Implications** | Identifies downstream effects or patterns established. | Vague or missing system implications. |
| **Invariant Compliance** | Explicitly verifies the change respects M2 invariants if applicable. | Ignores known project invariants (e.g., scrim Z-index rules). |
| **Conflict Check** | Checks against previous entries for contradictions. | Appends conflicting decisions without noting the conflict. |

## 6. Output Contract
The output must be a direct file modification to `.agents/design-log.md`. The modification must append new decisions in the established format and update the "Patterns Observed" section if necessary. The tool call must include a clear commit message summarizing the design decisions logged.

## 7. Worked Example
**Scenario:** The developer adjusted the iOS M2 bottom navigation toolbar to ensure it remains visible when `activeEditTool === 'styles'`.
**Action Taken:**
1. Read `.agents/design-log.md`. Found last entry was DDL-14.
2. Drafted DDL-15.
3. Appended to `.agents/design-log.md`.
**Resulting Log Entry:**
- ID: DDL-15
- Component: iOS M2 Bottom Navigation Toolbar
- Change: Enforced `isM2TabsHidden = false` when `activeEditTool === 'styles'` or style pill is tapped.
- Reason: The restyle horizontal scroll pill strip requires context; hiding the tabs breaks the spatial model and disorients the user.
- Impact: The bottom toolbar remains visible and grounded during style editing.
- System Implication: Establishes that toolbars must persist during inline sub-options for accessibility and spatial consistency.
- Timestamp: Session T+15m

## 8. Escalation & Hand-off
If a design decision explicitly contradicts a deeply entrenched core pattern or a Permanent M2 Registry Invariant (e.g., adding icons to the iOS M2 tabs), you must halt the log process and escalate. Send a message to the caller or user detailing the contradiction and ask for explicit permission to override the invariant or request a redesign. Hand-off involves providing the exact rule that was violated and the file where the violation occurred.

## 9. Definition of Done
The task is complete when the new design decision has been successfully written to `.agents/design-log.md` with a valid sequential ID, all required fields are filled with meaningful content, any new patterns are documented, and no unacknowledged conflicts with existing invariants remain.

## 14. Skill Test
1. Set up a mock `.agents/design-log.md` with entries up to DDL-42.
2. Provide a code diff showing a change to `GenMediaMacEditorM2.tsx` where the far-left vertical tool rail icons were changed to use `opacity: 1, transform: scale(1.08)` for active states and `opacity: 0.75` for inactive states.
3. Invoke the `design-memory` skill.
4. Verify that `.agents/design-log.md` is updated with entry DDL-43.
5. Verify the DDL-43 entry accurately captures the specific opacity and scale values, explains the tactile feedback rationale, and adheres to the desktop web M2 luminous icons invariant.
