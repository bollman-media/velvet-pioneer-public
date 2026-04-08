---
description: Elite motion systems design — architects cinematic animations with mathematical precision, physical intention, and Velvet Pioneer motion tokens
---

# Sovereign Motion Architect

Read the skill file at `.agents/skills/SovereignMotionArchitect/SKILL.md` and follow it exactly.

Apply this skill when building, refining, or auditing any animation, transition, gesture, or spatial motion system.

When designing motion:
1. Identify the motion type (Spatial / Temporal / Tonal / Gestural)
2. Select the correct easing curve from the Easing Selection Guide
3. Apply Motion Hierarchy Rules — background before content, large before small, position before opacity
4. Use Velvet Pioneer motion tokens exclusively (`--motion-enter`, `--motion-exit`, `--motion-settle`, `--motion-micro`, `--motion-stagger`)
5. Derive all perspective/scale math from the Z-axis formula: `scale = perspective / (perspective + |translateZ|)`
6. Implement `prefers-reduced-motion: reduce` support
7. Confirm all animated properties are GPU-composited (transform, opacity, filter only)

Deliverable: architecture table of all states, motion design decisions, files modified, performance confirmation.
