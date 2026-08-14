<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Permit to Work System

This project has been redesigned as a SaaS-ready platform for multi-company EHS operations.

## New SaaS foundation

- Multi-tenant architecture with tenant-aware records and isolated scopes
- Role-based access control with permissions for admin, safety, and requester roles
- Backend API endpoints for tenant discovery and scoped permit access
- Frontend shell that presents tenant context and access rules from the start

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Verification

- Frontend build: `npm run build`
- Frontend tests: `npm run test -w frontend` (vitest)
- Backend tests: `npm run test -w backend` (`node --test backend/tests/**/*.ts`)
- Both: `npm run test` from the repo root

## Secure auth setup (required for real deployments)

Login, password resets, and admin password changes are verified server-side by the backend,
which needs a Firebase Admin SDK credential:

- Set `FIREBASE_SERVICE_ACCOUNT_JSON` (the service account JSON, as a single-line string) in
  the backend's environment, **or** place the downloaded key at `backend/serviceAccountKey.json`
  (gitignored — never commit it).
- Deploy `firestore.rules` to your Firebase project (`firebase deploy --only firestore:rules`)
  and validate it with the Rules Playground/emulator before relying on it in production.
- To create the very first platform admin on a brand-new project, temporarily set
  `PLATFORM_ADMIN_BOOTSTRAP_PASSWORD` on the backend, log in once as `admin@2m` with that
  password, create a real admin user through the app, then unset the env var.