// Vercel serverless entry point (used if the Vercel project's root directory is set to
// frontend/ instead of the repo root). See ../../api/index.ts for the full explanation —
// this used to be its own full standalone copy of the stale mock backend and has been
// collapsed to a re-export of the one real implementation.
export { default } from "../../backend/server";
