# Deployment

This is a pre-deployment review. No real Supabase project and no real Vercel deployment exist
yet, this describes the intended/configured topology so it can be checked once both are
provisioned, not a live audit.

## Topology: two independent projects, one shared Supabase backend

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
   │ Host: GitHub Pages   │                         │ normal Vercel deploy)   │
   │ CI/CD: nextjs.yml    │                         │ Host: Vercel            │
   │ (GitHub Actions)     │                         │ Owner-only, noindex     │
   │ Read-only            │                         │ Read + write (authed)   │
   └───────────────────────┘                        └─────────────────────────┘
```

DAP (this repo) is public-facing, statically exported, and deploys to GitHub Pages via
`.github/workflows/nextjs.yml` on push to `main`. It reads `travel_tips` client-side with the
Supabase anon key. No write path, no auth, no admin UI.

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
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (Project Settings -> API), public, not a secret | Local dev: `.env.local`. CI/build: GitHub repo Settings -> Secrets and variables -> Actions -> Variables, consumed in `nextjs.yml` as `${{ vars.NEXT_PUBLIC_SUPABASE_URL }}` | Local dev: `.env.local`. Prod: Vercel Project Settings -> Environment Variables |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public API key, intentionally public, ships in both client bundles, never the service role key | Same as above, Variables not Secrets | Same as above, Vercel Environment Variables |
| `NEXT_PUBLIC_CUSTOM_DOMAIN_LIVE` | `"true"` once a custom domain is cut over for GitHub Pages, otherwise unset | Needs to be added to `nextjs.yml`'s build `env:` block when the domain cutover happens (not yet done, see Known gaps) | Not applicable |
| Supabase service role key | N/A | Never used, never set anywhere | Never used, never set anywhere |

Both repos' `.env.local` files are gitignored (`.env*.local`), and `.env.local.example` in each
repo documents the two variable names without values, which is correct and safe.

GitHub Actions Variables (not Secrets) is the right call here because both values get baked
into the public client JS bundle at build time no matter where they're sourced from in CI.
Treating them as secrets would just be security theater and would make debugging build failures
harder, since Secrets get redacted from logs and these values were never sensitive to begin
with. The real security boundary is Supabase Row Level Security, not key handling.

## CI/CD

DAP's `.github/workflows/nextjs.yml` triggers on push to `main` and manual dispatch. The build
step now passes `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` from repo Variables
into `next build`'s environment. I checked the YAML is valid (the new `env:` map is a correctly
indented sibling of `run:` under the "Build with Next.js" step) and the vars/secrets split is
right. Nothing else in this workflow needs changes for this feature.

travel-tips-admin has no CI workflow file; Vercel's own GitHub integration (build-on-push,
preview-on-PR) handles CI/CD once the repo is connected. That's proportionate for a
two-person hobby-scale project; a separate GitHub Actions pipeline would just duplicate what
Vercel already does on import.

## Deploy procedure

DAP: push to `main`, `nextjs.yml` builds the static export and deploys to GitHub Pages
automatically. No manual steps once the repo Variables are set.

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

DAP: GitHub Pages serves whatever the last successful `nextjs.yml` run deployed. To roll back,
revert the offending commit on `main` (or use `workflow_dispatch` to re-run a prior successful
commit) and push; the next successful run redeploys. There's no separate "promote" step.

travel-tips-admin: Vercel keeps prior deployments, so use its dashboard's "Promote to
Production" on a previous deployment, or revert the commit and let Vercel redeploy from `main`.
No database migration is involved in rolling back either app; both are just read/write clients
against a stable Supabase schema.

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

`nextjs.yml` is correct: valid YAML, `vars` (not `secrets`) is the right choice for these public
values, nothing else needs adjusting.

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

`docs/architecture/travel-tips-backend.md`'s "Setup" section is correct and consistent with the
actual `nextjs.yml` implementation (repo Variables, not Secrets) and with travel-tips-admin's
Vercel env vars. It accurately documents that both projects share one Supabase project/schema.

## Known gaps

`NEXT_PUBLIC_CUSTOM_DOMAIN_LIVE` is documented in a code comment (`next.config.ts`, `nextjs.yml`)
as the switch for a future custom-domain cutover, but it isn't wired into `nextjs.yml`'s build
`env:` block yet. Not a problem today since no custom domain is live, but whoever does that
cutover needs to add it to the workflow at the same time, noting it here so it doesn't get
forgotten.

Neither the Supabase project nor the Vercel deployment exists yet, so the env var table above is
the intended configuration, not yet verified against a live build. Re-verify build success in
both GitHub Actions and Vercel once real values are provisioned.

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
