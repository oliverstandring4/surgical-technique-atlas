# Notes for agents

- This project is **no longer connected to Lovable**. Edit code directly in this repo. Ignore any `.lovable/` files or Lovable references elsewhere.
- Hosting: Cloudflare Workers at https://my.surgicalatlas.workers.dev.
- Backend: Supabase (auth + Postgres with row-level security). Schema changes go in `drizzle/migrations/`.
- `.env` holds only Supabase's publishable keys, which are safe to be public. Never commit a service-role key or other secret; the repo is public.
- The app stores surgical technique only, never patient information. Keep the PHI warnings intact.
- Don't rewrite published git history (no force pushes, rebases, or amends of pushed commits). Keep `main` in a working state.
