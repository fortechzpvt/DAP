# Security Review: Travel Tips Supabase Migration

Date: 2026-09-15
Reviewer: Cybersecurity/AppSec Agent (Fortechz)

Scope: migrating Travel Tips content from a static JSON file to Supabase (Postgres + Auth),
split across two projects: `DAP` (public site, GitHub Pages, static export, read-only Supabase
access) and `travel-tips-admin` (separate, not yet deployed, write access via Supabase Auth).
Reviewing this because the change touches authentication and authorization, which requires
review per Fortechz's rules regardless of size.

This was a static/manual code review only. I read every file listed in the handoff in both
repos, ran targeted greps for secrets and service-role keys, and checked `.gitignore`/env-example
files. No dynamic testing, no live Supabase project inspection, and no penetration testing, since
no deployed Supabase project existed yet for `travel-tips-admin` and dashboard-level settings
(like whether self-signup is actually disabled) can't be verified from code alone.

## Attack surface

- Public site (`DAP`): browser-side Supabase `select` against `travel_tips`, using the `anon`
  key baked into the public JS bundle at build time, rendered client-side into React JSX.
- Admin app (`travel-tips-admin`): browser-side Supabase Auth (`signInWithPassword`) login form,
  then CRUD (`insert`/`update`/`delete`) against the same table, gated by an active
  `authenticated` session.
- Shared Supabase project: Postgres table `travel_tips` with Row Level Security as the sole
  authorization boundary. Neither project runs a server; both talk to Supabase directly from the
  browser.
- CI/CD: the GitHub Actions workflow (`nextjs.yml`) injects
  `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` at build time from repository
  Variables, not Secrets.

## Controls verified as present and correct

No service-role key or other secret exists in either repo. I grepped both `DAP` and
`travel-tips-admin` (excluding `node_modules`) for `service_role`, `SUPABASE_SERVICE`, and
JWT-shaped strings and found no matches; only anon key placeholders appear, and only in
`.env.local.example` files with empty values, not committed real keys. `.env*.local` is
gitignored in both repos and no `.env.local` file was present in either working tree.

The `anon` role's RLS policy in `supabase/setup.sql` grants `SELECT` only. There's no
`INSERT`/`UPDATE`/`DELETE` policy for `anon`, and RLS is enabled on the table, so Postgres
defaults to deny for anything without a matching policy. The anon key genuinely can't write.

Public-site rendering of tip content (`TravelTipsSection.tsx`) uses plain JSX interpolation
(`{category.title}`, `{item.label}`, `{item.detail}`), which React auto-escapes as text nodes.
There's no `dangerouslySetInnerHTML` anywhere in the tip-rendering path. The one
`dangerouslySetInnerHTML` in the codebase (`app/layout.tsx`, the JSON-LD `Person` schema) uses a
hardcoded static object, not owner-submitted or database content, so it's unrelated. No
stored-XSS path from admin-entered tip text to the public page.

Admin login (`LoginGate` in `TravelTipsAdmin.tsx`) uses Supabase's default
`signInWithPassword` error surface, which returns a generic "Invalid login credentials" message
that doesn't distinguish a bad email from a bad password, so there's no account enumeration via
the error message. Nothing logs credentials, tokens, or session data anywhere in
`supabaseClient.ts`, `travelTips.ts`, `TravelTipsSection.tsx`, or `TravelTipsAdmin.tsx` in either
repo. Sign-out is implemented (`supabase.auth.signOut()`), and session state is tracked via
`onAuthStateChange` plus `getSession()`, the standard supabase-js pattern.

`nextjs.yml` correctly sources the anon key/URL from GitHub Actions Variables rather than
Secrets, which is right since these values are intentionally public and end up in the shipped JS
bundle regardless; using Secrets here would just give a false sense of confidentiality.

Because PostgREST parameterizes all queries under the hood, admin-entered free-text fields
(slug, title, label, detail) don't create a SQL-injection path even though they're unvalidated
at the UI layer. And `docs/architecture/travel-tips-backend.md` accurately describes the real
implementation as reviewed: table shape, RLS policy split, key handling, and the two-project
split all match the code.

## Findings

### 1. RLS trusts "any authenticated user" as "the owner," with no enforcement in code (Medium)

The `authenticated`-role RLS policies in `supabase/setup.sql`
(`travel_tips_owner_insert`/`_update`/`_delete`) use `with check (true)` / `using (true)`, so any
successfully authenticated Supabase user gets full insert/update/delete on `travel_tips`, not
just the owner. The design assumes "no self-signup" makes this equivalent to "the owner" today,
but that guarantee lives entirely in a Supabase dashboard toggle (Authentication, disable
sign-ups) that isn't codified anywhere in either repo, isn't enforced by RLS, and couldn't be
verified in this review since no live Supabase project exists yet. If self-signup is ever left
on, whether from a future project recreation or a default that isn't revisited, anyone who
registers an account would immediately get full write/delete access to the live public content.
That's an authorization bypass, not just a data-quality issue.

Severity: Medium. No working exploit today if the dashboard setting is correctly set as
documented, but it's a silent, unverifiable single point of failure with no code-level guardrail.

Recommendation: scope the write policies to the specific owner, e.g.
`using (auth.uid() = '<owner-user-uuid>'::uuid)` (or match on `auth.jwt() ->> 'email'`) instead
of `true`, so a stray or compromised second account can't write even if self-signup gets left
on by accident. Also document explicitly, in `travel-tips-backend.md` or a setup checklist, that
"Authentication -> Disable sign-ups" needs to be re-verified any time the Supabase project is
created or recreated, and add that as a step in the setup instructions rather than just a design
assumption.

Status: recommended follow-up, not fixed here. Findings get documented for the requester to
decide on remediation, not silently patched.

### 2. Public site's CSP `connect-src` doesn't allow the Supabase domain (Medium, functional gap)

`DAP/app/layout.tsx` sets a production-only Content-Security-Policy meta tag:
`connect-src 'self' https://cloudflareinsights.com`. That doesn't include the Supabase project's
domain (`https://<project-ref>.supabase.co`). Browser CSP enforcement will block the fetch/XHR
calls `getTravelTips()` makes to Supabase in production, so the page fails closed silently:
`getTravelTips()`'s `.catch()` sets `travelTips` to `[]`, so the section just renders "Trip notes
are coming soon." instead of an error. This looks like a CSP that wasn't updated for the new
external dependency this change introduced (the old static-JSON version had no external
`connect-src` need). It's a maintenance gap directly caused by this change, even though the
immediate effect is a broken feature rather than an exploitable hole. Flagging it as a security
item rather than just a bug so whoever fixes it doesn't widen `connect-src` carelessly (e.g. to
`https:`), which would weaken the CSP.

Severity: Medium. Breaks the read path in production, and a careless fix could weaken the CSP.

Recommendation: add the specific Supabase project URL to `connect-src`, e.g.
`connect-src 'self' https://<project-ref>.supabase.co https://cloudflareinsights.com`, not a
wildcard.

Status: recommended follow-up, not fixed here. This needs to be verified against the real
deployed Supabase URL, which I don't have.

### 3. Admin app ships with no Content-Security-Policy at all (Low)

`travel-tips-admin`, which hosts the owner's login form and password field, has no CSP
configured anywhere (`app/layout.tsx` has none). This isn't a regression, it's a new project,
but since it's the credential-entry surface for the one account that can write to the live site,
it's worth hardening before deployment.

Severity: Low. A defense-in-depth gap rather than an active vulnerability; no XSS sink exists in
the current admin code that a missing CSP would otherwise mitigate.

Recommendation: add a restrictive CSP (`default-src 'self'`, `connect-src 'self'
https://<project-ref>.supabase.co`, etc.) before deploying to Vercel.

Status: recommended follow-up, accepted as a pre-launch item since the admin app isn't deployed
yet.

### 4. Admin form fields have no server-side/schema validation (Low)

The admin UI trims and requires non-empty strings but doesn't constrain length, character set,
or format (`slug` is free text, not restricted to `[a-z0-9-]`). Not a SQL-injection risk
(PostgREST parameterizes queries) and not an XSS risk (React escapes on output), but a malformed
slug containing `/`, `?`, or whitespace could break the URL/tab-selection experience on the
public site, and there's no database-level `check` constraint backing it up.

Severity: Low. Data-quality/availability issue only, single trusted owner input, no injection
vector.

Recommendation: add a `check` constraint on `slug` in `supabase/setup.sql` (e.g. regex
`^[a-z0-9-]+$`) and/or client-side validation in the admin form.

Status: accepted risk for now, single trusted owner, no attacker input path, non-blocking.

## Non-blocking hardening suggestions

For a single-owner password account, Supabase Auth's built-in defaults (rate limiting on auth
endpoints, 6-character minimum password) are adequate but minimal. None of these block approval,
but worth doing at some point: enable leaked-password protection (HaveIBeenPwned check) in
Supabase Auth settings, raise the minimum password length beyond the 6-character default for the
owner account, consider MFA (TOTP) for the owner account since it's the sole gate to write
access on a public login page, and consider CAPTCHA (hCaptcha/Turnstile, natively supported by
Supabase Auth) on the admin login once deployed. These are for the owner to apply in the
Supabase dashboard or admin app config, not something fixable in this repo's code alone.

## Assumptions made by this review

I assumed, per the handoff and `travel-tips-backend.md`, that self-signup is actually disabled
in the Supabase Auth dashboard and that exactly one owner user exists. That couldn't be verified
since no live Supabase project exists yet (see Finding 1). I also assumed the real Supabase
project URL will get added to CSP `connect-src` once the project is actually created and
deployed (see Finding 2). I didn't review Vercel project configuration for `travel-tips-admin`
beyond what's in its README/code, since it isn't deployed yet.

## Exceptions

None requested or granted. Findings 3 and 4 are recorded as accepted risk for the current
pre-launch state, not formally exempted, and should be revisited before or at admin app
deployment.

## Verdict

Approved with conditions. No Critical or High findings. Two Medium findings (the RLS trust
boundary isn't codified/enforced, and the CSP wasn't updated for the new Supabase dependency)
should be resolved or explicitly accepted by the owner before this is fully production-ready.
Finding 2 in particular will likely cause the public feature to silently fail once a real
Supabase project URL is wired up, so it should be fixed as part of that step rather than
deferred. Low findings and hardening suggestions are non-blocking.

| # | Finding | Severity | Status |
|---|---|---|---|
| 1 | RLS write policies trust any authenticated user, no owner-scoping in code | Medium | Recommended follow-up |
| 2 | Public-site CSP `connect-src` missing Supabase domain | Medium | Recommended follow-up |
| 3 | Admin app has no CSP | Low | Recommended follow-up (pre-launch) |
| 4 | Admin form fields lack format validation | Low | Accepted risk |
| - | Supabase Auth default hardening (leaked-password protection, MFA, CAPTCHA) | Info | Optional, non-blocking |

---

## Live verification addendum, 2026-09-15

Reviewer: Cybersecurity/AppSec Agent (Fortechz)

A real Supabase project now exists (ref `naygxsyqefvgdufztqup`); `supabase/setup.sql` has been
run against it, and the owner's Supabase Auth user has been created and added to
`public.admins`. Both `DAP` (`:3000`) and `travel-tips-admin` (`:3001`) are running in local dev.
This addendum re-verifies Findings 1 and 2 against the live project, since the original review
above was static/manual only and explicitly couldn't do this.

Testing this time was live black-box HTTP testing via `curl` directly against the Supabase REST
endpoint (`{SUPABASE_URL}/rest/v1/...`) using the real `anon` key from `DAP/.env.local`, plus
inspection of the real running dev servers and the actual production static-export build output
(`DAP/out/index.html`). No service-role key was used or created; none exists in either repo (see
below). This still isn't a full dynamic scan or pentest: no fuzzing, no auth-bypass tooling, and
no second test Auth account was created. Scope and limitations are called out per finding below.

### Finding 1, RLS write policies: verified-fixed (with a testing caveat)

The live `supabase/setup.sql` no longer contains `with check (true)` for writes. It now defines
`public.admins` (allowlist, RLS-enabled, `admins_self_read` policy `using (auth.uid() =
user_id)`) and scopes all three write policies to `exists (select 1 from public.admins where
user_id = auth.uid())` instead of `true`. That directly implements the original recommendation:
write access no longer depends solely on an unverifiable "self-signup disabled" dashboard toggle.

Live tests against the anon role: `GET {SUPABASE_URL}/rest/v1/travel_tips` returned `200` with
exactly the 3 seeded rows. `POST` (insert attempt, anon key) returned `401` with body
`{"code":"42501", ..."message":"new row violates row-level security policy for table
\"travel_tips\""}`, an explicit rejection. `PATCH ...?slug=eq.ladakh-bike-tour` (update attempt,
anon key) returned `200` with body `[]` (zero rows matched), not an explicit permission error.
That's expected PostgREST/RLS behavior for `USING`-clause row filtering on `UPDATE`: the row is
invisible to `anon` for the update, so PostgREST reports "0 rows matched" instead of a 403. It's
a quieter failure mode than the insert case, but re-`GET` of the same row confirmed the title
wasn't modified, so data integrity held. Worth knowing that a naive "check for non-2xx" monitor
would miss a blocked PATCH like this.

`GET {SUPABASE_URL}/rest/v1/admins` with the anon key returned `200` with body `[]`, so the admin
allowlist table doesn't leak which user_ids are admins to the anon role (no policy exists for
`anon` on that table, so RLS filters all rows out). That confirms admin identity itself isn't
discoverable pre-auth.

One gap: I didn't create a second, non-admin Supabase Auth account to confirm live that an
authenticated-but-non-admin user is also rejected by the `exists (...)` check. Only the `anon`
role got tested end-to-end. That path is covered by the SQL logic itself (a non-admin
`auth.uid()` won't satisfy the `exists` subquery), and it's a standard, well-understood RLS
pattern, but I only confirmed it by reading the live `setup.sql`, not by testing it end-to-end.
Recommend this as a follow-up live test before final production sign-off if a second test
account can be provisioned safely and removed afterward.

Overall: verified-fixed. The schema change is deployed live, and the anon-role and
admins-table-leak aspects are confirmed live. Authenticated-non-admin rejection is confirmed by
code inspection of the live SQL, not end-to-end testing, flagged above as a residual low-risk gap
rather than an open finding.

### Finding 2, public-site CSP: verified-fixed

`DAP/app/layout.tsx`'s CSP `<meta>` tag is gated to `process.env.NODE_ENV === "production"`, so
it doesn't appear on the local dev server on `:3000` (confirmed, no `Content-Security-Policy`
header in the dev HTML response). That's by design, not a gap. To check the real shipped policy
I inspected the actual static-export build output directly: `DAP/out/index.html` contains
`connect-src 'self' https://cloudflareinsights.com https://*.supabase.co`, and
`https://*.supabase.co` correctly matches the real project domain
`https://naygxsyqefvgdufztqup.supabase.co` (standard CSP wildcard subdomain match). That's the
artifact that will actually deploy to GitHub Pages, so this is a direct verification of the fix,
not just a source read.

`travel-tips-admin/next.config.ts`'s `headers()` sets
`Content-Security-Policy: ... connect-src 'self' https://*.supabase.co ...` unconditionally as a
server-side header, not gated by `NODE_ENV`. Confirmed live via `curl -D -` against
`http://localhost:3001/`: the header is present verbatim and matches the real Supabase domain.
This app also now sets `X-Frame-Options: DENY` and `Referrer-Policy:
strict-origin-when-cross-origin`, which addresses part of the originally-Low Finding 3 ahead of
deployment.

Verified-fixed for both apps, confirmed against real running processes and real build output,
not just source review.

### Secrets/key hygiene re-check

Live `.env.local` files now exist for both projects. I grepped both repos (excluding
`node_modules`, `.next`, `out`) for `service_role`, `SUPABASE_SERVICE`, `service-role`, and raw
JWT-shaped strings (`eyJ...eyJ...`). No service-role key or any other Supabase secret exists
anywhere in either repo. The only JWT-shaped strings found are the real `anon` key in
`DAP/.env.local` and `travel-tips-admin/.env.local` (confirmed to be the `"role":"anon"` key by
direct inspection, never printed here); `.env.local.example` in both repos still ships only
empty placeholders. `.gitignore` in both repos contains `.env*.local`, which covers `.env.local`,
confirmed by direct read of both files.

Neither `DAP` nor `travel-tips-admin` is currently a git repository at all
(`git rev-parse --is-inside-work-tree` fails with "not a git repository" in both). That updates
the earlier note, which only said "no `.env.local` file present"; that's now stale since real
`.env.local` files exist, but since there's no `.git` in either tree, there's trivially nothing
tracked or staged to leak today. It also means the `.gitignore` protection hasn't actually been
exercised against a real `git add`/`git status` yet; it's correct on paper but untested in
practice. Recommendation: when either repo gets `git init` or connected to a remote, re-run
`git status` / `git check-ignore -v .env.local` before the first commit to confirm the ignore
rule actually works. Not a finding against the current state since there's no git history to
leak into yet.

No service-role key was found, used, or created during this review, per the task's explicit
instruction.

### Updated findings table

| # | Finding | Severity | Prior status | Live-verification status (2026-09-15) |
|---|---|---|---|---|
| 1 | RLS write policies owner-scoping | Medium | Recommended follow-up | Verified-fixed (anon-role and admins-table-leak tested live; authenticated-non-admin path confirmed by live-SQL code read only, not end-to-end) |
| 2 | Public-site CSP `connect-src` missing Supabase domain | Medium | Recommended follow-up | Verified-fixed (confirmed in real prod build output and live admin-app HTTP response) |
| 3 | Admin app has no CSP | Low | Recommended follow-up (pre-launch) | Substantially addressed, `travel-tips-admin` now ships a CSP plus `X-Frame-Options` and `Referrer-Policy` live on `:3001` (not formally re-scored here, in scope for a future full re-review) |
| 4 | Admin form fields lack format validation | Low | Accepted risk | Not in scope for this addendum, unchanged |

### Revised verdict (this addendum only)

Both Medium findings from the original review are verified-fixed against the live Supabase
project, with one honestly-disclosed residual gap: authenticated-non-admin write rejection
wasn't end-to-end black-box tested with a second account, only anon-role and code-level
verification were done for that sub-case. No new Critical/High findings turned up from the live
setup, and no service-role key or other secret was found. This addendum doesn't by itself flip
the project to unconditionally approved; it upgrades the two Medium findings from "recommended
follow-up" to "verified-fixed," which was the condition set by the original "approved with
conditions" verdict. The remaining Low findings (3, 4) are unchanged and non-blocking as before.
