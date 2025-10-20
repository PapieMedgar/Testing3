# Project documentation — Testing3

This repository contains a small web application used to generate and download reports. It is split into two main projects in the workspace root:

- `sales-sync-backend` — Flask backend server that generates reports and serves the API
- `salespace-scan` — Frontend single-page app (React + Vite + TypeScript) that provides the UI

This document explains the overall architecture, where the main code lives, how to run the app locally, and operational notes for developers and non-technical users.

---

High-level summary

- The frontend is the user-facing website. Users open the site in a web browser, navigate to a Reports page, and can download generated XLSX/CSV files.
- The backend is a web API that produces those XLSX/CSV files on demand. The frontend calls backend endpoints to request report files.
- The frontend and backend communicate over HTTP. The frontend base URL for the API is configured with the environment variable `VITE_API_BASE_URL`.

Target users of this README

- Developers who will modify, run, or maintain the codebase.
- Non-technical team members who need a high-level understanding of how to run or use the application.

---

Architecture and major components

1. Backend — sales-sync-backend

- Framework: Flask (Python).
- App pattern: application factory (`create_app`) and Blueprints.
- Main responsibilities:
  - Generate reports (XLSX and CSV) using internal modules.
  - Provide endpoints to download those reports (binary responses).
  - Serve additional utilities/scripts used by the project.

Important files and folders

- `app/__init__.py` — app factory, configuration, and blueprint registration.
- `app/routes/reports_api.py` — reports blueprint providing endpoints under `/api/reports`.
- `run.py` — application entrypoint used to start the server in development.
- `requirements.txt` — Python dependencies.
- generator scripts at repository root (examples): `daily_visits_report.py`, `team_lead_visit_details_export.py`, `team_lead_visits_report.py` — these produce the binary XLSX/CSV data returned by the reports endpoints.
- `postman_collections/` — Postman JSON collections for manual API testing.

Report endpoints (examples)

- GET /api/reports/daily_visits_xlsx — produces a daily visits XLSX file
- GET /api/reports/team_lead_visits_xlsx — produces an aggregated team-lead visits XLSX
- GET /api/reports/team_lead_visit_details_xlsx/<lead_slug> — produces XLSX for a specific team lead
- CSV equivalents exist, e.g. `/api/reports/daily_visits_csv`

CORS and headers

- For cross-origin (frontend on a different origin) downloads to work reliably, backend must:
  - Echo the request `Origin` (do not use wildcard `*`) if credentialed requests are required.
  - Set `Access-Control-Allow-Credentials: true` if cookies or credentials are used.
  - Set `Access-Control-Expose-Headers` to include `Content-Disposition` and `Content-Type` so the frontend can access filename metadata.

2. Frontend — salespace-scan

- Framework: React + TypeScript using Vite for development.
- Main responsibilities:
  - Provide UI pages (including Reports page).
  - Make HTTP calls to the backend to request and download binary report files.

Important files and folders

- `src/main.tsx` — application entry.
- `src/lib/api.ts` — centralized API helper used to call backend endpoints. Uses `import.meta.env.VITE_API_BASE_URL`.
- `src/pages/Reports.tsx` — Reports page UI. Contains buttons to download single reports and a "Download All" button that downloads all 6 XLSX files.
- `src/components/` — UI components such as `Button` used across the UI.

How downloads work on the frontend

- The frontend uses fetch to request report endpoints and receives the file bytes in the response.
- The response is converted to a Blob, a temporary object URL is created, and a hidden `<a>` element is programmatically clicked to trigger the browser download.
- The Download All flow sequentially calls the report endpoints and triggers downloads for each file.

---

How to run locally (developer steps)

Prerequisites

- macOS examples below; adapt for Windows/Linux.
- Python 3.x and Node.js + npm (or yarn/pnpm) installed.

Backend (development)

1. Open a terminal.
2. Change to the backend folder:
   ```bash
   cd /Users/papiemojaki/Documents/Testing3/sales-sync-backend
   ```
3. Create and activate a virtual environment (recommended):
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   ```
4. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
5. Start the server (example):
   ```bash
   export FLASK_APP=run.py
   export FLASK_ENV=development
   flask run --port 5000
   ```
6. The server will listen on port 5000 by default and expose the API under `/api`.

Frontend (development)

1. Open a terminal.
2. Change to the frontend folder:
   ```bash
   cd /Users/papiemojaki/Documents/Testing3/salespace-scan
   ```
3. Install Node dependencies:
   ```bash
   npm install
   # or yarn
   # or pnpm install
   ```
4. Start the dev server with the backend base URL (example):
   ```bash
   VITE_API_BASE_URL=http://localhost:5000/api npm run dev
   ```
5. Open the URL printed in the terminal (usually http://localhost:5173) and navigate to Reports.

Notes

- If the backend is not running or `VITE_API_BASE_URL` is incorrect, downloads will fail with network or CORS errors.

---

Authentication and authorization

- Currently reports endpoints may be public in development. If the backend requires JWT or other auth, the frontend must send Authorization headers or include credentials when calling the API.
- Check `src/lib/api.ts` to add headers or `credentials: 'include'` as needed.

Testing the API

- Use Postman collections under `sales-sync-backend/postman_collections/` to manually test endpoints.
- Example curl to download an XLSX directly:
  ```bash
  curl -v -o daily_visits.xlsx "http://localhost:5000/api/reports/daily_visits_xlsx"
  ```

Troubleshooting common issues

- Browser shows CORS errors
  - Ensure the backend echoes the requesting Origin and sets `Access-Control-Allow-Credentials: true` if the frontend uses credentials.
  - Confirm `Access-Control-Expose-Headers` includes `Content-Disposition`.
- Downloads return empty files or 0 KB
  - Verify server logs for exceptions; generator functions may have thrown errors and returned JSON error responses instead of binary payloads.
  - Test endpoints directly with curl or Postman to confirm binary content.
- 404 Not Found
  - Confirm the backend route exists and that `VITE_API_BASE_URL` matches the backend base URL.

Security & maintenance notes

- Do not commit secrets (API keys, DB passwords) into the repository. Use environment variables or a secrets manager.
- Add a `.gitignore` to exclude local environment files such as `.venv`, `.idea`, and `node_modules`.
- Remove accidentally committed local files from the repo history if necessary.
- Sanitize any user-provided values used to build file paths to prevent path traversal attacks (the backend includes checks but review on changes).

Deployment suggestions

- Backend: run behind a production WSGI server (Gunicorn/uwsgi) and a reverse proxy (nginx). Ensure environment variables and CORS origins are set to production values.
- Frontend: build static assets (`npm run build`) and deploy to a static hosting service (Netlify, Vercel, S3+CloudFront) or serve from the same host as backend.
- For the "Download All" feature, consider adding a server-side endpoint that packages all files into one ZIP and returns a single binary — this improves UX and reduces browser-side complexity.

Recommended next steps

1. Verify if report endpoints require authentication; if so, update `src/lib/api.ts` to attach tokens or cookies.
2. Optionally add a server-side ZIP endpoint for the Download All feature.
3. Add tests for the report generators to detect runtime errors early.
4. Clean the repository (remove `.venv`, .idea) and add those entries to `.gitignore`.
5. Create `sales-sync-backend/API_DOCS.md` (I can generate this file with detailed endpoint examples if you want).

---
