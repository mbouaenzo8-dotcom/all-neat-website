# Content Integrity Notes

This site was built from **publicly available business listings only** — no direct input from All Neat Cleaning Services. Nothing here should be treated as confirmed by the business until someone at the company signs off.

## Verified / sourced from public listings

- Business name: All Neat Cleaning Services / All Neat Inc. / All Neat LLC
- Phone: (202) 499-4572
- Based in Silver Spring, MD; serves the greater Washington, D.C. metro area (Maryland, D.C., Northern Virginia)
- Free estimates offered
- Spanish-language service available
- Veteran-owned/operated
- More than a decade of experience (per public listings)
- Residential + commercial cleaning; window cleaning; pressure washing associated with the business in public sources
- Recurring review themes: professionalism, punctuality, thoroughness, communication, friendliness, value
- **Testimonials** (`src/data/testimonials.ts`) — 4 real, attributed Google reviews for this business, sourced from the public review aggregator at [reviews.birdeye.com/all-neat-inc-170368831651139](https://reviews.birdeye.com/all-neat-inc-170368831651139), which republishes Google reviews for the business. Quote text was extracted directly from that page's raw HTML (not summarized by a model) and reproduced verbatim, with the reviewer's displayed name and star rating as shown on the page, captured 2026-09-18. Each card links back to the source; the section also has a "Read More Reviews" link. Individual relative dates ("a week ago," etc.) were intentionally **not** copied in, since they'd go stale — the section instead notes when the snapshot was taken.
- **Star rating / review count** — intentionally not hard-coded anywhere (copy uses "Highly rated by local customers" instead), since counts differ across platforms (110–135 reviews, 4.9–5.0 depending on platform/date) and will drift over time. This applies to individual testimonial cards too: only the two-sentence quote, name, and that specific review's own star rating are shown — no aggregate total.
- **Pricing** — no prices anywhere; all service cards route to "Request a Quote" / the estimate form.
- **All imagery (v3, 2026-09-23)** — AI-generated illustrations made locally (Z-Image Turbo, hero loop with LTX 2.5; pipeline in `C:\Users\enzom\ai-studio\projects\allneat_site`), served as responsive WebP from `/media`. They contain no people (no invented staff) and no text, carry a visible "AI illustration" badge, and their alt text says they are AI-generated. The before/after slider says the "before" side is a simulated filter. Replace them with real, owned photos before launch.
- **Bilingual (v3)** — every UI string lives in `src/i18n/content.ts` (English + Spanish) under the same integrity rules; Google reviews stay verbatim in English (marked `lang="en"`) with a Spanish note.
- **Structured data (v3)** — generated at build time by `vite.config.ts` from the site's own sources: `LocalBusiness` (the previous `HouseCleaningService` type does not exist in schema.org), `WebSite`, `FAQPage`. `priceRange` was removed because it was never verified. See `CHECKLIST.md` for what still needs input from the business.
- **Certifications, insurance, licensing, awards** — not claimed anywhere, since none were supplied or verified.
- **Team/staff bios** — none included; no names or headshots invented.
- **"Screen repair"** — mentioned in some public sources alongside window cleaning, but was left off the services list since it wasn't clearly confirmed as a current offering.

## Design intent

The business-integrity constraint (no fabricated facts) was treated as a hard requirement throughout, including in structured data (`index.html`), FAQ copy (`src/data/faqs.ts`), and the About section (`src/components/About.tsx`).

## Design rebuild (v2)

The visual design was rebuilt while preserving **every** content-integrity constraint above (same verified facts, same real Google reviews kept verbatim, same "no prices / no fabricated claims" rules, same honest placeholder-image labeling in `src/data/images.ts`).

- **Type:** self-hosted Bricolage Grotesque (display) + Geist (text) via Fontsource. No Google Fonts `<link>` in production.
- **Palette:** one locked accent (teal) on a navy ink + warm off-white system. Amber is used only for star-rating glyphs (semantic), never as a UI accent.
- **Theme:** single light theme, locked, matching the brief's prescribed bright palette (one deliberate dark "Why All Neat" band + a conventional dark footer). No dark-mode toggle was added, because the brief specifies a light palette.
- **Motion:** scroll-reveal via `IntersectionObserver` (`src/hooks/useReveal.ts` / `src/components/Reveal.tsx`) plus hover micro-interactions. All motion collapses under `prefers-reduced-motion`. No scroll-event listeners.
- **Images:** still placeholder stock photography, centralized in `src/data/images.ts` with honest alt text and a disclaimer. Not represented as real All Neat work.
