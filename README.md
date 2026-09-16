# Dinesh A Pathum Portfolio Website

Next.js (App Router) + TypeScript + Tailwind CSS, statically exported for GitHub Pages.

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

Push to GitHub and enable Pages (GitHub Actions source). `nextjs.yml` builds and deploys `out/` automatically on push to `main`. Update the `basePath` in `next.config.ts` to match your actual repo name if it differs from `dinesh-a-pathum`.
