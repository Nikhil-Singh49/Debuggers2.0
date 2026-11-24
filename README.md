# EduPulse

EduPulse is a React/Vite frontend with an Express API backed by SQL Server. The root npm workspace and [netlify.toml](./netlify.toml) configure a single Netlify site for both the frontend and API.

The repository can also be deployed to Vercel. The root [vercel.json](./vercel.json) builds the frontend, serves it from Vercel, and routes `/api/*` to the Express serverless function in [api/index.js](./api/index.js).

## Deploy on Netlify

1. Push this repository to a Git provider and import the repository root. If Netlify asks which workspace app to deploy, choose `edupulse-frontend` and keep the base directory at the repository root. The build, publish, function, API rewrite, and SPA fallback settings are in `netlify.toml`.
2. Provide the API environment variables in Netlify's site environment settings, with the **Functions** scope enabled:
   - `NODE_ENV=production`
   - `DB_SERVER`, `DB_PORT`, `DB_NAME`, `DB_USER`, and `DB_PASSWORD`
   - `DB_ENCRYPT=true` and `DB_TRUST_SERVER_CERT=false`
   - `JWT_SECRET` (a private random value with at least 32 characters)
   - `JWT_EXPIRES_IN=8h`
   - `CORS_ORIGINS` for any custom domain or deploy-preview origins not covered by Netlify's `URL` variable
3. Use a SQL Server instance reachable from Netlify Functions. The local `DB_SERVER=localhost` setting cannot work after deployment. Restrict database access appropriately and never commit credentials or demo accounts.
4. Trigger a new deploy after setting or changing environment variables.

Netlify does not provide this app's SQL Server database. The site can build without connecting to the database, but login and data endpoints will not be usable until the production database is reachable and contains the required `dbo` schema and production users.

## Local development

Install dependencies from the repository root with `npm install`. Copy `community project/.env.example` to `community project/.env`, then run both apps with `npm run dev`. This starts the API on port 4000 and the Vite frontend on port 5173.

Individual apps can be started with `npm run dev:api` and `npm run dev:frontend`.

Run the API tests with `npm run test:api` and build the frontend with `npm run build`.

## Deploy on Vercel

1. Import the repository root in Vercel. Vercel will detect `vercel.json`; keep the root directory empty.
2. Add the production database and application variables to the Vercel project:
   - `NODE_ENV=production`
   - `DB_SERVER`, `DB_PORT`, `DB_NAME`, `DB_USER`, and `DB_PASSWORD`
   - `DB_ENCRYPT=true` and `DB_TRUST_SERVER_CERT=false`
   - `JWT_SECRET` (at least 32 characters)
   - `JWT_EXPIRES_IN=8h`
   - `CORS_ORIGINS=https://your-production-domain.vercel.app`
3. Redeploy. Vercel's `VERCEL_URL` is also included automatically for preview deployments.
4. If a custom API host is used instead of `/api`, set `VITE_API_URL` in Vercel's build environment; otherwise the frontend uses the same Vercel deployment.
