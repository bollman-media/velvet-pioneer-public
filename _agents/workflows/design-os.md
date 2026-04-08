---
description: The master operating system rules for the Layered Design Sprint. This ties all other skills together.
---
# Design OS — Master Workflow

This workflow orchestrates the "Layered Design Sprint" pipeline, chaining critique, rebuild, code review, and logging in a single pass.

## Steps

1. **State Assessment**: Review the current proposal or code. Identify current state and goals.
2. **Design Critique**: Call `/product-design` to critique the design intent, taste, and system hierarchy. Follow the BLUNT VERDICT structure.
3. **Technical Execution**: Use the feedback to generate components, motion tokens, or layouts. (If motion involved, leverage the SovereignMotionArchitect rules).
4. **Code Quality Review**: Call `/elite-frontend-engineer` to review the resulting code for performance, bugs, and aesthetics.
5. **Decision Tracking**: Call `/design-memory` to log the final decisions in the decision log to prevent drift over time.
