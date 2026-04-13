# Velvet Pioneer — Regression Log

_Maintained by Deployment Guardian. Updated after every deployment._

---

## 2026-04-13 — Deploys `velvet-pioneer-00164-zkb` + `velvet-pioneer-00165-bgz`

### 🔴 REGRESSION: All API Endpoints Silently Broken (Pre-existing, now fixed)

**Revisions affected:** All revisions prior to `velvet-pioneer-00165-bgz`
**Detected:** 2026-04-13 during pre-deploy guardian assessment
**Fixed in:** `velvet-pioneer-00165-bgz` (commit `40a3f69`)

#### Failure
Every API endpoint in `server.js` used `./api/` prefix in route matching:
```js
// BROKEN — req.url is always an absolute path like /api/...
if (req.url === './api/generate-video') { ... }
```
Node.js HTTP server's `req.url` is always an absolute path (e.g. `/api/generate-video`). The `./` prefix never matched, causing all API calls to silently fall through to the static file server and return 404s.

**Affected routes (10 total):**
- `/api/save-upvotes`
- `/api/extract-keyframes`
- `/api/generate-shot-variations`
- `/api/generate-video`
- `/api/generate-cover`
- `/api/luminous-generate`
- `/api/generate-track`
- `/api/veo-status`
- `/api/latest-video`
- `/api/drive-video`

#### Root Cause
Route strings were written with relative `./` prefix (likely a copy/paste from client-side fetch calls), which are resolved by the browser but not by the HTTP server.

#### Remediation
Replace all 10 instances: `'./api/...'` → `'/api/...'` in `server.js`.

#### Prevention
Add a startup self-test that hits `/api/veo-status` at boot and logs a warning if it returns non-JSON. Consider adding a `/healthz` endpoint that returns `200 OK` for Cloud Run health checks and monitoring.

---

### 🟡 REGRESSION: `package-lock.json` References Private Artifact Registry

**Revisions affected:** All revisions prior to `velvet-pioneer-00164-zkb`
**Detected:** 2026-04-13 (and prior session 2026-04-10)
**Fixed in:** `velvet-pioneer-00164-zkb` (commit `2999087`)

#### Failure
`package-lock.json` was generated on a machine authenticated to Google's internal `artifact-foundry-prod` Artifact Registry (`us-npm.pkg.dev/artifact-foundry-prod/ah-3p-staging-npm/`). Cloud Build runs in a fresh sandbox with no credentials for this registry → build fails with 403 on every `npm ci`.

#### Root Cause
Running `npm install` locally while authenticated to the internal registry causes npm to write private resolved URLs into the lockfile.

#### Remediation
Delete `node_modules` and `package-lock.json`, then regenerate with:
```bash
npm install --registry https://registry.npmjs.org
```

#### Prevention
Add a pre-commit hook or CI check that scans `package-lock.json` for `artifact-foundry-prod` and blocks the commit. Alternatively, pin `registry=https://registry.npmjs.org` in a `.npmrc` file at the project root.

---

### ℹ️ KNOWN LIMITATION: `--allow-unauthenticated` Blocked by Org Policy

**Status:** Unresolved — org policy restriction
**Impact:** Service requires Google auth / IAP to access in browser

Attempts to set `allUsers` IAM binding on Cloud Run service fail with:
```
FAILED_PRECONDITION: One or more users named in the policy do not belong to a permitted customer, perhaps due to an organization policy.
```
This is an org-level restriction on the `gemini-gemmedia-sandbox-941001` project. Cannot be resolved without org admin intervention. Access the live service through a browser session authenticated with your Google account.

---
