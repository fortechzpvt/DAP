# Dinesh A Pathum Portfolio Website

Next.js (App Router) + TypeScript + Tailwind CSS, statically exported and hosted on Vercel.

## Development

```bash
npm install
npm run dev
```

## Content to update

- `lib/socials.ts`: real YouTube / Instagram / TikTok / Facebook links and email.
- `lib/journeys.ts`: real trip details, dates and video links (currently placeholder copy inferred from supplied photos).
- `components/AboutSection.tsx`: real bio copy.
- `public/assets/clip-1.mp4` .. `clip-5.mp4`: trip footage clips, compressed from the originals via `AVConvert --preset Preset960x540`. Swap for better cuts if available.
- `assets/_source_originals/`: original uncompressed uploads kept for reference.
- **Travel tips**: no longer a file to edit by hand. These are written and published from the separate `travel-tips-admin` project (its own repo/hosting on
  Vercel). Sign in there to add trips/topics and changes go live on this site
  immediately. See `docs/architecture/travel-tips-backend.md` for the
  Supabase setup shared between the two projects (env vars, schema, RLS)
  and `supabase/setup.sql` for the table + policies.

## Deploy

Hosted on Vercel, imported from this GitHub repo (`fortechzpvt/DAP`). Vercel auto-detects the
Next.js static export (`output: "export"` in `next.config.ts`) and serves the built `out/`
directory; no build command overrides are needed. Every push to `main` redeploys to
production, and every PR gets its own preview deployment automatically.

`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` must be set in Vercel Project
Settings -> Environment Variables (all environments) before the build succeeds, otherwise the
build fails prerendering pages that read Supabase. See `docs/deployment/deployment.md` for the
full procedure and `docs/architecture/travel-tips-backend.md` for the shared Supabase setup.

`SITE_URL` in `lib/seo.ts` should match the project's real Vercel domain (currently
`dap-sand.vercel.app`; update it if a custom domain is attached later).
