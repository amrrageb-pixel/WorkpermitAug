// Vercel serverless entry point. This used to be a full standalone copy of the Express app
// (hardcoded mock login, password "123" for everyone) that silently diverged from the real
// backend in backend/server.ts — meaning every auth fix shipped there never actually reached
// production on Vercel. There is now exactly one backend implementation; this file only
// re-exports it so Vercel's /api/* rewrite (see vercel.json) has something to route to.
export { default } from "../backend/server";
