# EduPulse

EduPulse is a React/Vite frontend with an Express API backed by SQL Server. The root npm workspace and [netlify.toml](./netlify.toml) configure a single Netlify site for both the frontend and API.

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

Install dependencies from the repository root with `npm install`. Run the API with `npm run dev --workspace=edupulse-server` and the frontend with `npm run dev --workspace=edupulse-frontend`. Configure the backend's `community project/.env` from `.env.example` first.

Run the API tests with `npm run test:api` and build the frontend with `npm run build`.
