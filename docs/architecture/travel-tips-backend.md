# Travel Tips backend: Supabase (Auth + Postgres), split across two projects

## Decision

Travel tips content now lives in Supabase instead of the static
`lib/travelTips.json` file. The owner-facing authoring page is not part of
this site. It lives in a separate standalone project, `travel-tips-admin`
(sibling directory, own git repo, deployed on Vercel independently of this
site's own Vercel project). This repo only ever *reads* from Supabase.

## Reason

The site (`dinesh-a-pathum`) is deployed as a fully static export
(`output: "export"` in `next.config.ts`, hosted on Vercel), so there's no
server at runtime. The owner needs to log in with a password,
write tips under a topic, and have them show up live on the public site
right away, without a commit/rebuild/redeploy cycle every time.

An earlier version added the login/editor as a `/admin/travel-tips` route
inside this same site. That got dropped: the owner wanted the admin tool on
its own separate webpage with its own hosting instead of a hidden route
bundled into the public site. Splitting it out means the public site's JS
bundle never ships any admin/auth code, which shrinks the blast radius if
the admin app ever has a bug and gives a real separation between the public
read surface and the owner's write surface, rather than relying on
`noindex`/`robots.txt` to do that job.

## Alternatives considered

- Keep static JSON with manual redeploys. Rejected, doesn't meet the "live
  immediately" requirement.
- `/admin/travel-tips` route inside this site. Tried first, then dropped
  once the owner asked for a separately hosted page.
- A Node/Express server or Next.js server runtime on this site. Rejected;
  that would mean moving off static export just to get a database and auth
  that a BaaS already provides for free.
- Fully normalized schema (`trips` / `tip_categories` / `tip_items` tables
  with foreign keys). Rejected in favor of one `travel_tips` row per trip
  with a `categories` JSONB column, since there's a single owner, low write
  volume, and it keeps the query code minimal.

## Chosen solution

Two independent Next.js projects share one Supabase project, each talking to
Supabase directly from the browser with no server on either side (Supabase's
standard mode for static/client-heavy apps).

- This repo (public, read-only): `lib/travelTips.ts` (`getTravelTips()`) and
  `components/TravelTipsSection.tsx` fetch from the `travel_tips` table
  client-side using the Supabase `anon` key.
- `../travel-tips-admin` (private, write access): a separate Next.js app,
  its own repo, deployed on Vercel. Shows a Supabase Auth login form; once
  signed in as the owner, it lets them add trips/topics, writing straight to
  the same `travel_tips` table. See that project's own README for its
  setup/deploy steps, it's the source of truth for anything specific to the
  admin app.
- Database: a single `travel_tips` table (`id, slug, title, categories
  (jsonb), updated_at`). Schema, trigger, RLS policies, and a one-time seed
  of the pre-existing `lib/travelTips.json` content all live in
  `supabase/setup.sql` in this repo, run once against the shared Supabase
  project. The admin app doesn't duplicate any of that.

## Security model

The Supabase `anon` key is intentionally public in both projects. It ships
in each project's client JS bundle at build time
(`NEXT_PUBLIC_SUPABASE_ANON_KEY`, set in this repo's Vercel project env vars
and in `travel-tips-admin`'s). That's the documented, expected
way to use Supabase from a browser. It is not a secret and should never be
confused with the Supabase service role key, which isn't used in either
project.

Row Level Security is what actually gates writes, not key secrecy or which
project holds the key. Policies on `travel_tips` in `supabase/setup.sql`:

- `anon` role gets `SELECT` only. That's all this repo's key can ever do.
- `authenticated` role gets `SELECT` too (any signed-in user, since reading
  isn't the sensitive operation), but `INSERT`/`UPDATE`/`DELETE` require the
  caller's `auth.uid()` to appear in a separate `public.admins` table.

Writes aren't gated by "authenticated" alone. An earlier version of this
design relied on Supabase's dashboard "disable self-signup" setting to keep
`authenticated` equivalent to "the owner." A security review flagged that as
a trust gap the SQL itself couldn't verify or enforce. The `admins`
allowlist fixes that in code: even if self-signup got turned on by mistake,
a new signup still can't write until their UID is added to `admins`.

After creating the owner's Supabase Auth user, their `user_id` has to be
inserted into `public.admins` (see the comment above the seed insert in
`supabase/setup.sql`). Without that row, login succeeds but every write gets
rejected by RLS.

This site has no admin route left to hide; `app/robots.ts` no longer
disallows `/admin`. The admin app sets its own `noindex` as extra
hardening, but the real boundary is Supabase Auth plus RLS.

Brute-force/rate-limiting on the admin login is handled by Supabase Auth's
built-in defaults. Turning on Supabase's leaked-password protection is a
reasonable extra step given the admin login sits on a public URL.

Both projects send a Content-Security-Policy restricting `connect-src` to
`'self'` plus `https://*.supabase.co`, so the browser only allows network
calls to the app itself and Supabase. This repo's policy lives in
`app/layout.tsx` as a `<meta>` tag (the static export has no server to send
real HTTP headers); `travel-tips-admin`'s lives in `next.config.ts`'s
`headers()`, since that app runs as a normal Next.js server on Vercel.

## Setup (one-time, done by the site owner)

1. Create a project at supabase.com.
2. Project Settings -> API: copy the Project URL and anon public key. Set
   them in both places that need them:
   - This repo: `.env.local` (dev) and this repo's Vercel project's
     Environment Variables, as `NEXT_PUBLIC_SUPABASE_URL` /
     `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
   - `travel-tips-admin`: `.env.local` (dev) and its own Vercel project's
     Environment Variables, same two names.
3. SQL Editor (in Supabase, once, not per project): run this repo's
   `supabase/setup.sql` to create the tables, RLS policies, and seed the
   existing content.
4. Authentication -> Users: add one user (owner's email + password), this
   is the `travel-tips-admin` login. Copy that user's User UID from the same
   screen.
5. SQL Editor: run
   `insert into public.admins (user_id) values ('<paste-uid-here>');`
   Without this, the owner can log in but every write gets rejected by RLS.

## Impact

`lib/travelTips.json` is retired from the read path in this repo (kept only
as the historical source the seed SQL was generated from). This repo no
longer has any admin UI, login form, or write path to Supabase; `app/admin/`
and `components/admin/` were removed. Content changes now happen through
`travel-tips-admin` (or the Supabase dashboard directly), never by editing
files in this repo.

## Known limitations

There's a single shared owner account, so there's no per-tip audit trail of
who wrote what (not needed with one writer). There's no image/media upload
support in this pass either, tips stay text (label + detail) only, matching
the pre-existing content shape. And the two projects/repos need their
Supabase env vars kept in sync if the Supabase project is ever recreated or
keys get rotated.
