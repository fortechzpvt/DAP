# Deployment

This is a pre-deployment review. The Supabase project now exists; DAP's Vercel deployment
exists (`dap-sand.vercel.app`) but is still being brought up. travel-tips-admin's Vercel
deployment doesn't exist yet, so its section below is still the intended/configured topology.

## Topology: two independent projects, both on Vercel, one shared Supabase backend

```
                         ┌───────────────────────────┐
                         │   Supabase project         │
                         │   (Postgres + Auth)        │
                         │   table: travel_tips       │
                         │   RLS: anon=SELECT,        │
                         │        authenticated=CRUD  │
                         └─────────────┬─────────────┘
                     anon key (read)   │   anon key (read+write,
                                       │   gated by Auth session)
              ┌────────────────────────┴───────────────────────┐
              │                                                 │
   ┌──────────▼───────────┐                         ┌───────────▼────────────┐
   │ DAP (public site)    │                         │ travel-tips-admin       │
   │ Next.js static export│                         │ Next.js (SSR/CSR,       │
   │ Host: Vercel          │                        │ normal Vercel deploy)   │
   │ CI/CD: Vercel's       │                        │ Host: Vercel            │
   │ GitHub integration    │                        │ Owner-only, noindex     │
   │ Read-only             │                        │ Read + write (authed)   │
   └───────────────────────┘                        └─────────────────────────┘
```

DAP (this repo) is public-facing, statically exported, and deploys to Vercel via Vercel's own
GitHub integration (build-on-push to `main`, preview-per-PR). It reads `travel_tips`
client-side with the Supabase anon key. No write path, no auth, no admin UI.

**Prior state (superseded 2026-09-16):** DAP was originally configured for GitHub Pages, static
export with a `/dinesh-a-pathum` basePath and a `nextjs.yml` GitHub Actions workflow at the repo
root. That workflow was never actually wired up (it sat at the repo root instead of
`.github/workflows/`, so GitHub never ran it) and has been removed along with the basePath logic
in `next.config.ts`/`lib/basePath.ts` (deleted) now that Vercel serves the site from a domain
root and needs no subpath prefix. See `docs/decisions/architecture-decisions.md` ADR-004.

travel-tips-admin (sibling repo, `../travel-tips-admin`) is a standalone Next.js app with its
own git repo, deployed independently to Vercel. It's owner-only and password-gated via Supabase
Auth. Writes go straight to the same `travel_tips` table on the Supabase side, so neither
project needs a rebuild or redeploy when content changes.

Both projects share one Supabase project. Schema, RLS, and seed data live in this repo's
`supabase/setup.sql` and run once; the admin repo doesn't duplicate any of it. Neither project
runs a custom backend server; both talk to Supabase directly from the browser.

## Environment variables

| Variable | Value | Set in DAP | Set in travel-tips-admin |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (Project Settings -> API), public, not a secret | Local dev: `.env.local`. Prod: Vercel Project Settings -> Environment Variables | Local dev: `.env.local`. Prod: Vercel Project Settings -> Environment Variables |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase `anon` `public` API key, intentionally public, ships in both client bundles, never the `service_role` key | Same as above, Vercel Environment Variables | Same as above, Vercel Environment Variables |
| Supabase service role key | N/A | Never used, never set anywhere | Never used, never set anywhere |

Both repos' `.env.local` files are gitignored (`.env*.local`), and `.env.local.example` in each
repo documents the two variable names without values, which is correct and safe.

These are `NEXT_PUBLIC_` values inlined into the client bundle at build time, so they must be
set in Vercel before the first deploy of either project, applied to all environments
(Production, Preview, and Development). A Preview deployment without them set would build with
empty values and fail at runtime (or, for a static export, fail the build outright while
prerendering any page that touches the Supabase client) when the Supabase client initializes.
The real security boundary here is Supabase Row Level Security, not key handling; there was
never a reason to treat these as secrets.

## CI/CD

Both DAP and travel-tips-admin are built and deployed by Vercel's own GitHub integration
(build-on-push to `main` for production, preview-per-PR) once each repo is imported as its own
Vercel project. Neither repo has a GitHub Actions workflow. That's proportionate for a
two-person hobby-scale project; a separate CI pipeline would just duplicate what Vercel already
does on import.

## Deploy procedure

DAP:
1. Push the project to its GitHub repo (`fortechzpvt/DAP`), already done.
2. In Vercel: New Project, import that repo (use "Import Git Repository" on vercel.com/new, not
   the `/new/clone` flow, which tries to create a brand-new copy repo and isn't needed here). The
   "Next.js" framework preset auto-detects. `next.config.ts` sets `output: "export"`, so Vercel
   builds and serves the static `out/` directory; no build command override is needed.
3. Project Settings -> Environment Variables: add `NEXT_PUBLIC_SUPABASE_URL` and
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` (the `anon` `public` key, from Supabase Project Settings ->
   API Keys, never `service_role`), applied to all environments, as type Config (not Secret,
   consistent with the reasoning above).
4. Deploy/redeploy. Vercel assigns a `*.vercel.app` URL (currently `dap-sand.vercel.app`), or
   attach a custom domain in Project Settings -> Domains. `SITE_URL` in `lib/seo.ts` should be
   kept in sync with whichever domain is actually live, since sitemap/robots/canonical/Open
   Graph/JSON-LD all read from that one constant.
5. Every subsequent push to `main` redeploys production automatically; every PR gets its own
   preview deployment. No manual steps once env vars are set.

travel-tips-admin:
1. Push the project to its own git repository, separate from DAP's.
2. In Vercel: New Project, import that repo. The "Next.js" framework preset auto-detects, no
   build command changes needed since this is a normal server/edge-capable deploy, not a static
   export.
3. Project Settings -> Environment Variables: add `NEXT_PUBLIC_SUPABASE_URL` and
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, applied to all environments (Production, Preview, and
   Development). These are `NEXT_PUBLIC_` values inlined at build time, so a Preview deployment
   without them set would build with empty values and fail at runtime when the Supabase client
   initializes.
4. Deploy. Vercel assigns its own `*.vercel.app` URL, fully separate from the public site's
   domain, which is fine for an owner-only tool. No custom domain is needed; a generic Vercel
   subdomain is marginally less discoverable and there's no user-facing reason to brand it.

## Rollback

Both DAP and travel-tips-admin: Vercel keeps prior deployments, so use its dashboard's "Promote
to Production" on a previous deployment, or revert the offending commit on `main` and let Vercel
redeploy. There's no separate build/promote pipeline step to manage. No database migration is
involved in rolling back either app; both are just read/write clients against a stable Supabase
schema.

Supabase (shared): `supabase/setup.sql` is additive (creates table/policies/seed), so there's
currently no destructive migration to roll back. Any future schema change to `travel_tips`
should ship with its own rollback SQL or a follow-up migration file; that hasn't been needed yet
since nothing beyond the initial creation exists.

Rotating the Supabase anon key or recreating the Supabase project is a shared-infrastructure,
hard-to-reverse action: both projects would need new values, and the public site would show
errors until DAP's value is updated. That requires explicit human approval before doing it, per
Fortechz's policy on shared/production environments. It's not part of this review since no
rotation is being requested right now.

## Review findings (this pass)

`travel-tips-admin/next.config.ts` and `package.json` are correct: confirmed no
`output: "export"`, no `basePath`, no `images.unoptimized`, none of DAP's static-export config
leaked into the new project. It's a plain Next.js app suitable for a normal Vercel deploy.

`travel-tips-admin/README.md`'s "Deploy (Vercel)" steps are correct and complete for this
project's scale. I added one thing here (not in the README itself, to avoid over-specifying a
hobby project): apply env vars to all Vercel environments, not just Production, so PR preview
builds don't silently ship with empty Supabase config. I'm deliberately not recommending a
custom domain, formal branch protection, or a separate CI check before merge, that's
disproportionate process for a single-owner admin tool with no other contributors, and Vercel's
built-in preview-per-PR already gives a manual look before merging.

`docs/architecture/travel-tips-backend.md`'s "Setup" section is correct and consistent with
travel-tips-admin's Vercel env vars. It accurately documents that both projects share one
Supabase project/schema.

## Known gaps

travel-tips-admin's Vercel deployment doesn't exist yet, so its section of this doc is still the
intended configuration, not yet verified against a live build.

DAP's first Vercel deployment (`dap-sand.vercel.app`) initially 404'd at the root: it was built
from a commit that still had the GitHub Pages `/dinesh-a-pathum` basePath, and separately failed
prerendering `/contact` with "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
once the basePath was fixed, because those env vars weren't set in the Vercel project yet. Both
are being fixed as part of this pass: the basePath removal below, and setting the Supabase env
vars (as `anon` `public`, not `service_role`) in Vercel Project Settings. Re-verify the
deployment succeeds and serves the site at the root after both fixes are pushed and redeployed.

Local build verification (2026-09-15): `npm run build` in DAP with placeholder
`NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` values, and `npm run type-check`, both
passed cleanly from a fully clean state (`.next`, `tsconfig.tsbuildinfo`, `node_modules/.cache`
removed first). travel-tips-admin's `npm run build`/`type-check` also passed. No source changes
were needed; `components/TravelTipsSection.tsx`, `lib/travelTips.ts`, and `lib/supabaseClient.ts`
are correctly typed, and there are no leftover imports to the deleted `app/admin/travel-tips` or
`components/admin` paths anywhere in the repo.

A prior local build had reportedly failed at Next's own "Running TypeScript" step with just
"Failed to type check." and no detail. I couldn't reproduce that after this change. Most likely
explanation: a stale `.next` build cache from before `app/admin/travel-tips` was deleted. Next's
generated `.next/types/validator.ts` type-checks one `typeof import(...)` per route file, and if
that cache doesn't regenerate after a route deletion it can reference a module that no longer
exists. If this recurs, run `rm -rf .next` before `npm run build` rather than assuming a
source-code regression.
