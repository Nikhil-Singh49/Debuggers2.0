# EduPulse API

The Express API uses the existing SQL Server tables in the `dbo` schema. The frontend Vite server proxies `/api` requests to `http://localhost:4000`.

## Netlify

The repository root `netlify.toml` builds the frontend and deploys this API as a Netlify Function. The function wraps the existing Express app; `/api/*` is rewritten to it, and database pools are reused while a function instance remains warm.

Configure the required API environment variables in Netlify's site settings with the **Functions** scope. See the repository-root README for the full list and setup steps. `DB_SERVER` must be a network-accessible SQL Server host; `localhost` refers to the function runtime, not your computer. Netlify does not provision this SQL Server database.

## Run locally

1. Copy `.env.example` to `.env` and set the SQL Server connection values and a private `JWT_SECRET` with at least 32 characters.
2. From the repository root, install dependencies with `npm install`.
3. Start the API with `npm run dev --workspace=edupulse-server`.
4. Start the frontend with `npm run dev --workspace=edupulse-frontend`.

Use the credentials of an active row in `dbo.users` to sign in. Enter either the `users.username` value or the user's numeric ID in the login field. Passwords must be bcrypt hashes; plaintext passwords are deliberately not accepted. To generate a hash with this project’s bcryptjs dependency, run:

```powershell
node --input-type=module -e "import bcrypt from 'bcryptjs'; console.log(await bcrypt.hash(process.argv[1], 12))" "replace-with-a-new-password"
```

Update the corresponding `dbo.users.password` value through your normal database administration process. Do not put real passwords or JWT secrets in source control.

Non-admin users can change their display name. Before deploying this feature, apply `migrations/001_user_profiles.sql` once to the SQL Server database. Profile pictures remain in the browser that uploaded them.

## API

- `POST /api/auth/login` — verifies an active user and issues a signed JWT.
- `GET /api/auth/me` — validates the bearer token.
- `GET /api/dashboard` — reads school, attendance, fees, notifications, and settings data.
- Student, teacher, attendance, payment-record, announcement, transport, feedback, notification, and settings routes support the corresponding frontend actions. Mutating routes require a JWT and enforce role checks.
- `GET /api/health` and `GET /api/ready` provide liveness and database readiness checks.

Payment records currently use the existing `dbo.payments` table; this is not connected to a payment gateway and must not be treated as proof of a real-world payment.

Run backend tests with `npm test`.
