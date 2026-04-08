---
description: Run Deployment Guardian checks and deploy to Cloud Run
---

# Deploy Workflow

Triggered by: `/deploy`

This workflow runs the Deployment Guardian checks and then deploys to Cloud Run if approved.

## Steps

1. Read the skill file at `_agents/skills/deployment-guardian/SKILL.md` and follow it exactly.
2. Perform the assessment of the current codebase and project state based on the skill's guidelines.
3. Output the structured assessment response as defined in the skill's OUTPUT FORMAT.
4. If the Deployment Decision is `APPROVE` or `APPROVE WITH CAUTION`, proceed to step 5. If it is `BLOCK`, stop the workflow and report back to the user.
// turbo
5. Run the deployment command:
   `gcloud run deploy velvet-pioneer --source . --region us-west1 --project gemini-gemmedia-sandbox-941001 --allow-unauthenticated`
