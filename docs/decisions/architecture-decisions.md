# Architecture / Design Decisions (DAP public site)

## ADR-001: Gate mandatory scroll-snap to `lg` (1024px) and up

**Date:** 2026-09-15

The homepage (`app/page.tsx`) renders `AboutSection`, `JourneysSection`, and `VideoSection`
with `variant="home"`. That variant used to apply `overflow-hidden h-[100svh] snap-start`
unconditionally, and `scroll-snap-type: y mandatory` was set unconditionally on
`html.snap-page` in `app/globals.css`. Below each section's internal grid breakpoint
(About's `md:grid-cols-2`, Journeys' `sm:grid-cols-2 lg:grid-cols-3`, Video's
`sm:grid-cols-2 md:grid-cols-3`), content stacks into fewer columns and its natural height
exceeds `100svh`. With `overflow-hidden` and mandatory snap both active, that excess content
was clipped and unreachable by scrolling. Real content, like two of the three Journey cards
or the About section's bio paragraph and quote, was invisible to anyone on a phone or narrow
tablet with no way to scroll to see it.

Fix:
- `app/globals.css`: `scroll-snap-type: y mandatory` on `html.snap-page` is now gated behind
  `@media (min-width: 1024px)` (Tailwind's `lg` breakpoint), so mandatory snap only applies at
  `lg` and up.
- `AboutSection.tsx`, `JourneysSection.tsx`, `VideoSection.tsx`: the `variant === "home"`
  section className changed from `"overflow-hidden h-[100svh] snap-start"` to
  `"py-16 md:py-20 lg:py-0 lg:overflow-hidden lg:h-[100svh] snap-start"`. Below `lg` these
  sections now behave like `variant === "full"`: natural/auto height with vertical padding, no
  clipping, freely scrollable. At `lg`+ the original full-viewport cinematic snap effect is
  unchanged.

The owner needs the site to work on phones and tablets, not just laptops and desktops. The
full-viewport snap effect is a desktop-appropriate choice that only works once each section's
content actually fits in one screen at its widest column count, which happens at `md` for
About and `lg` for Journeys. `lg` (1024px) was picked as a single cutover point rather than a
per-section breakpoint for consistency: below 1024px, nothing in the phone/tablet range
reliably has the width and height headroom the fixed-height design assumes.

I don't have live browser access, so I checked this by reasoning through the source and
Tailwind's breakpoints for typical laptop/tablet-landscape heights (roughly 700-1024px,
including the iPad landscape case of 1024x768, which lands exactly on this cutover):

- JourneysSection at `lg`: `grid-cols-3` renders all three cards in one row (`h-[46svh]` each)
  below a heading block (~90-100px). No second row to overflow into, fits with wide margin
  even at a 768px-tall viewport.
- AboutSection at `lg`: `md:grid-cols-2` places the image column (`h-[50svh]`) beside the text
  column. In `variant="home"` only one bio paragraph renders (`bio.slice(0, 1)`), so the text
  column's height stays well under `100svh` and under the image column's own `50svh`.
- VideoSection at `lg`: `md:grid-cols-3` renders all three video cards in one row (`h-[26svh]`
  thumbnails plus ~90-110px of title/meta text) below a heading row. Comfortably under `100svh`.

So `lg` is a safe cutover for all three sections at realistic viewport heights, including the
borderline iPad-landscape case. No section needed a different or higher breakpoint.

One residual risk worth flagging, not a defect: the `100svh` fixed-height design at `lg`+ still
assumes a "normal" browser viewport height for a device at that width. An unusually short
browser window at `lg`+ (a laptop browser resized very short, or a snapped/split-screen window)
isn't something width-only breakpoints can catch, and wasn't part of this review's scope. If
that becomes a real complaint, an `lg`-only `overflow-y-auto` fallback inside each section would
be a safer fix than changing the breakpoint.

I considered per-section breakpoints (`md` for About, `lg` for Journeys/Video) but that would
make the snap-scroll effect kick in at different widths for different sections while scrolling
through the same page, for no real benefit given the margin the check above shows. I also
considered keeping mandatory snap everywhere and redesigning the mobile grids to always fit one
viewport (horizontal-scroll carousels), but that's a much bigger change than this bug warrants.
Natural scrolling below `lg` is simpler, avoids snap-scroll disorientation on touch devices, and
matches how people expect a content-heavy page to behave on a phone.

No visual or behavioral change at `lg`+; the cinematic homepage experience is preserved exactly.
Below `lg`, the homepage now scrolls naturally with no clipped or unreachable content. Any future
"home"-variant section must follow the same pattern (`lg:overflow-hidden lg:h-[100svh]
snap-start`, natural height below `lg`) and get the same fits-in-`100svh`-at-`lg` check before
shipping.

Approved and implemented.

---

## ADR-002: Header mobile-menu touch target size (flagged, not fixed yet)

**Date:** 2026-09-15

No code change here, just recording a finding for later.

`components/Header.tsx`'s hamburger menu toggle (~line 128-136) is sized `w-8 h-8` (32x32px).
It's the only way to open primary navigation on any viewport below `md` (768px), i.e. all
phones and portrait tablets. That's under the ~40-44px touch-target size commonly recommended
as a best practice (WCAG 2.5.5 is AAA; WCAG 2.5.8's AA floor is 24px, which this clears, but
32px still leaves little margin for mis-taps on a primary control).

Out of scope for the snap-scroll/clipping bug this review was actually verifying, so leaving it
here rather than fixing it inline.

Recommended fix: bump the hit area to at least `w-10 h-10` (40x40px) via padding, keeping the
visual 32px icon centered, or wrap it in an element with invisible padding.

Open. Full-Stack Engineer should pick this up in a follow-up pass; it's a straightforward size
bump, not a layout change, so no further UI/UX decision is needed first.

---

## ADR-003: Animation-dependent visibility bug class, confirmed fixes, and codebase audit

**Date:** 2026-09-15

**The bug class:** a scroll/intersection-triggered (`whileInView`, `viewport={{ once: true }}`)
framer-motion animation whose `initial` state doesn't just look unpolished, it's unusable.
Content is fully suppressed (zero width/height via `clip-path`/`scale`, `display: none`, or
translated far enough off its resting position to be functionally gone) until the animation
fires. If the IntersectionObserver trigger never fires, which this codebase has now shown
happens in practice on tall, auto-height, scrollable mobile layouts, the content isn't "less
polished," it's permanently invisible and non-interactive with no fallback. Compare that to an
ordinary opacity/transform fade starting at `opacity: 0`: worst case there it just reads as
static, correct content once it snaps in.

Two instances of this were already found and fixed, one at a time, via separate user bug
reports rather than a systematic search:

1. `components/BirdsReveal.tsx`'s shared `RevealCard` export (the grid card reveal used by both
   Journeys and Videos) had `initial={{ clipPath: "inset(0 100% 0 0)" }}`, clipping the card to
   zero visible width until the wipe animation ran. Fixed to
   `initial={{ opacity: 0, y: 24 }}` / `whileInView={{ opacity: 1, y: 0 }}`.
2. `components/VideoSection.tsx` had a separate, independent inline copy of the same broken
   clip-path pattern on each video card (`motion.a`, ~line 115-123 as fixed now). Fixed the same
   way, matching `RevealCard`.

The fact that the second occurrence turned out to be the same root cause in a different file is
why this audit happened at all.

I searched `app/` and `components/` in `DAP` for `whileInView`, `whileHover`, `clipPath`/
`clip-path`, and every `motion.*` usage, and separately confirmed `travel-tips-admin` has zero
framer-motion usage (it's a plain admin CRUD tool, not in scope for this bug class). A repo-wide
grep for `clipPath`/`clip-path` in first-party source now returns zero matches (only incidental
hits inside compiled `.next/` output). No further High-severity instances turned up: no
remaining `clip-path`, `scale: 0`/near-zero, `display: none`-behind-a-scroll-trigger, or
off-canvas-translate pattern gating real content anywhere in `DAP` or `travel-tips-admin`.

A few Low-severity cases use the same proven opacity/transform pattern, or are otherwise not at
risk:

- `components/ContactSection.tsx:16-33` (CTA heading + button, opacity/`y:20`) always sits in a
  fixed `h-[100svh] overflow-hidden` section, so it never had the layout precondition that broke
  Journeys/Videos.
- `components/JourneysSection.tsx:34-47` and `components/TravelTipsSection.tsx:54-71` (heading
  blocks, opacity/`y:20`) use the same proven pattern as the fixed cards.
- `components/AboutSection.tsx:166-179` (image, opacity/`x:-24`) and `:181-219` (bio text,
  opacity/`x:24`) also use the proven pattern. Worth noting: `AboutSection` does share the exact
  `variant="home"` fixed-viewport vs. `variant="full"` auto-height structural precondition that
  caused the original clip-path bug. It was never broken (it never used clip-path), but because
  it shares that precondition it's worth a manual mobile smoke-test alongside this fix, out of
  caution rather than any known defect.
- `components/BirdsReveal.tsx`'s `BirdsOverlay` (decorative flying-bird flourish, ~line 45-62)
  is `aria-hidden`, `pointer-events-none`, and purely visual texture over cards it doesn't gate.
  If its `whileInView` never fires, the birds just never show up; no real content is affected.
- `components/TravelTipsSection.tsx`'s per-category `RevealCard` usage (tab panel content, ~line
  110-125) uses `trigger="mount"` (`animate`, not `whileInView`), the right choice for content
  that swaps on click rather than scrolling into view. Not subject to IntersectionObserver
  failure at all.

Not applicable to this risk class at all: `components/Header.tsx`'s mobile nav overlay and menu
items (~line 140-177, gated by a React conditional render plus `AnimatePresence`, not scroll
position) and `components/HeroSection.tsx`'s CTA buttons (~line 47-56, `animate` on mount, above
the fold). Neither uses `whileInView`, so there's no intersection-trigger-failure mode.

On timing: `RevealCard`'s `y: 24` / 0.7s duration / `0.25 + index * 0.14` stagger / `-60px`
viewport margin is fine for both current grids. Journeys tops out at 4 items (`lib/journeys.ts`)
and Videos always renders exactly 3, so the worst-case last-card delay is about
0.25 + 3x0.14 + 0.7 = 1.37s, which reads as a deliberate sequential reveal rather than
sluggishness. A 24px lift is subtle enough not to cause layout jank. No change needed now, but
if either grid's item count grows a lot (Journeys becoming a long unlimited list, say), cap the
stagger, e.g. `Math.min(index, 4) * 0.14`, so later items don't inherit a pointless long delay.

Rule of thumb for future work on this codebase: a scroll-triggered reveal animation should only
ever animate `opacity` and/or `transform` (`x`/`y`/`scale` within a subtle, still-legible range),
never `clip-path`, `width`, `height`, or `display`. A failed or delayed trigger needs to degrade
to "visible but less polished," never to "invisible or unusable." Any new `whileInView` usage
should get checked against this before merging, and anything inside a section whose
height/overflow changes by breakpoint or state (like About/Journeys/Videos via `variant`) should
get a mobile auto-height smoke test as part of that review.

I thought about just leaving this undocumented and trusting the next engineer to avoid
clip-path on their own, but this exact mistake already happened twice independently in two
files, which is exactly the kind of thing worth writing down.

No code changes came out of this pass itself; the two real fixes it covers were already made
before this entry was written. This just documents the rule of thumb above for future
reveal-animation work and flags `AboutSection` for an optional precautionary mobile check.

Audit complete. Two known instances of this bug class fixed prior to this entry, zero further
High-severity instances found, rule of thumb documented for future work.

---

## ADR-004: Move DAP hosting from GitHub Pages to Vercel

**Date:** 2026-09-16

**Decision:** Host DAP on Vercel instead of GitHub Pages. Removed the GitHub Pages-specific
`basePath`/`assetPrefix` logic in `next.config.ts` and its mirror in `lib/basePath.ts` (deleted),
updated every call site (`app/layout.tsx`, `app/robots.ts`, `app/sitemap.ts`,
`components/AboutSection.tsx`, `components/VideoBackground.tsx`, `components/HeroSection.tsx`,
`components/JourneysSection.tsx`) to plain root-relative paths, and deleted the root-level
`nextjs.yml` (confirmed it was never actually wired up as a GitHub Actions workflow, since it
sat outside `.github/workflows/`).

**Reason:** The owner asked to host DAP on Vercel. Vercel serves a site from its own domain
root (the assigned `*.vercel.app` URL, or a custom domain), unlike GitHub's project-page URLs
(`<user>.github.io/<repo>`), which needed the `/dinesh-a-pathum` prefix on every asset,
canonical URL, and sitemap entry. Keeping that prefix logic after the hosting move would 404
every asset. `output: "export"` and `images.unoptimized: true` are unchanged: the site has no
server-only routes (Travel Tips are fetched client-side, see
`docs/architecture/travel-tips-backend.md`), so a static export still fits.

**Impact:** `lib/seo.ts`'s `SITE_URL` updated to the real Vercel project domain
(`dap-sand.vercel.app`; update again if a custom domain is attached). `README.md` and
`docs/deployment/deployment.md` updated to describe the Vercel deploy procedure.
`docs/architecture/travel-tips-backend.md` updated to stop describing DAP as GitHub
Pages-hosted. Verified locally: `npm run type-check` and `npm run build` both pass from a clean
state.

Approved and implemented.
