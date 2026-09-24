# All Neat Cleaning Services — Website Concept

A website concept/prototype for All Neat Cleaning Services (Silver Spring, MD). Built with React, TypeScript, Tailwind CSS v4, and Vite.

This is **not** an official, business-approved site. See [`CONTENT-NOTES.md`](./CONTENT-NOTES.md) for what's verified vs. placeholder before publishing anything derived from this project.

## Getting started

```bash
npm install
npm run dev
```

Then open the printed local URL (typically `http://localhost:5173`).

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — type-check (`tsc -b`) and build for production into `dist/`
- `npm run preview` — preview the production build locally
- `npm run lint` — run oxlint

## Project structure

```
src/
  components/   One component per file (Navbar, Hero, ServiceCard, QuoteForm, etc.)
  data/         Content as typed data (services, faqs, testimonials, serviceAreas, business info)
  types/        Shared TypeScript interfaces for the data above
  index.css     Tailwind v4 theme tokens (colors, fonts) + base/utility layers
  App.tsx       Assembles the one-page layout from the section components
index.html      Meta tags, Open Graph, and LocalBusiness/Service JSON-LD structured data
```

Editing site copy or list content (services, FAQs, testimonials, service areas) should only require touching files in `src/data/` — not the components themselves.

## Before this goes to production

1. **Re-confirm testimonials with the business owner.** `src/data/testimonials.ts` now contains 4 real, attributed Google reviews (verbatim, sourced from a public review aggregator — see `CONTENT-NOTES.md` for exactly how). Get the owner's sign-off on republishing these, refresh them periodically since they're a static snapshot (not a live feed), and consider pulling reviews dynamically from the business's Google Business Profile instead of hard-coding them long-term.
2. **Replace stock photography** — the hero image and the "Drag to Compare" gallery in `src/components/BeforeAfter.tsx` use placeholder Unsplash photos (credited via URL, not downloaded) and a CSS-filter effect standing in for a real before/after. Swap in real All Neat project photos.
3. **Confirm the business address.** Public listings disagree on a street address; none is displayed on this site. See `src/data/business.ts`.
4. **Wire up the quote form.** `src/components/QuoteForm.tsx` currently mocks submission (see the comment inside `handleSubmit`). Connect it to a real backend, serverless function, or form service (e.g. Formspree) that emails the business and/or writes to a CRM.
5. **Update `index.html`** — the `canonical`, `og:url`, and image URLs use a placeholder `allneatcleaning.example` domain. Replace with the real production domain once one exists.
6. **Verify every FAQ answer and service description** against the business owner before launch — content here is based on publicly available listings only, not confirmed by the business.
