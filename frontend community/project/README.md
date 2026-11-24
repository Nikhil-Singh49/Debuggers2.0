# EduPulse frontend

React + Vite frontend for the EduPulse school ERP. It uses the Express API rather than a mock local-storage API.

From the repository root, install dependencies with `npm install`. Start the API with `npm run dev --workspace=edupulse-server` and the frontend with `npm run dev --workspace=edupulse-frontend`. The Vite development server proxies `/api` requests to `http://localhost:4000`.

The production frontend uses the same-origin `/api` path, which Netlify routes to the API function. To host the API separately, set `VITE_API_URL` to that API's base URL when building the frontend.

Students, Teachers, and Accounts users can update their display name in Settings; profile pictures are stored only in the current browser. Apply the API's `migrations/001_user_profiles.sql` before using database-backed name changes.

Teachers can select one of their timetable slots to manually mark attendance and display a short-lived class QR code. Students can scan it with camera permission on HTTPS or localhost. QR check-ins are demo-only and stay on the scanning student's device; they do not update the central attendance roster.
