# EduPulse deployment readiness

Assessment date: 2026-11-19

## Summary

**Overall: BLOCKED** for a deployment that treats the repository root as the application. The root `package.json` declares a missing `index.js`, has no start script, and its test script always exits with an error. The actual frontend and API live in separate subdirectories and are individually close to deployable.

This was a static-only assessment. No install, build, or test command was run during this assessment. The most recent frontend build recorded earlier in the session succeeded with a 1.02 MB chunk warning; backend tests previously passed.

## Component verdicts

| Component | Build | Completeness | Deployability |
|---|---|---|---|
| Root Node.js package (`.`) | WARN | FAIL | FAIL |
| EduPulse API (`community project`) | PASS | PASS | WARN |
| EduPulse frontend (`frontend community/project`) | WARN | WARN | WARN |

## Critical blocker

- **Root package is not runnable.** Its `main` points to a missing `index.js`, it has no `start` script, and the test script is hard-coded to fail. It also declares Prisma client 7.x with Prisma CLI 8.0.0-rc and has no Prisma schema. If the root package is only leftover scaffolding, deployment must explicitly target the two subprojects or the root manifest must be removed/cleaned up. If it is intentional, it needs a valid entry point and compatible dependencies first.

## Warnings

1. **Production frontend-to-API routing:** The frontend defaults to `/api`; the localhost API proxy is development-only. Set `VITE_API_URL` to the hosted API origin or configure a production `/api` reverse proxy.
2. **Database provisioning:** The API depends on pre-existing SQL Server `dbo` tables. No schema or migration files were found. Provision Azure SQL and its schema before the API can serve application data.
3. **Demo credentials/data:** The local database contains shared demo accounts and sample records. Do not copy these to production; create unique production accounts.
4. **Stale frontend README:** It still says the UI uses mock data and lists a demo password, although the frontend now calls the backend API.
5. **Bundle size:** The last recorded frontend build emitted a minified JavaScript bundle of about 1.02 MB, above Vite's 500 kB advisory threshold. This does not block deployment but may affect initial load time.
6. **Azure target unavailable:** Azure CLI is not installed, no Azure subscription was available to inspect, and no Azure IaC/deployment files were found. Subscription, quota, and region readiness were not evaluated.

## Deployment shape

- Frontend: React/Vite static site; candidate Azure Static Web Apps.
- API: Node.js 20+/Express REST API; candidate Azure App Service or Container Apps.
- Database: SQL Server client; use a reachable Azure SQL database and provide the schema/configuration.
- No Dockerfile, `azure.yaml`, Bicep, Terraform, Compose, or CI workflow was detected.
- The workspace is not a Git repository, so no remote or commit SHA could be recorded.

## Recommended next step

Confirm whether the root `package.json` is obsolete. If so, deploy the frontend and API from their subdirectories and leave the root package out of the deployment. Then configure Azure SQL/schema and the production API URL before provisioning.
