# Decisions (append-only, newest last)

## 2026-11-17 · Server writes each page's SEO HTML (no Next.js rewrite)
Why: Google and AI crawlers read the first HTML; the app sent an empty shell. Injecting title, description, canonical, JSON-LD and readable content per URL in Express gives the same result with far less risk than a framework migration. Who: Claude (under Gabe's pre-approval). Where: `server/seo.ts`.

## 2026-11-17 · Gabe's artist text is the site's description
Why: Gabe asked for his words (even condensed) as the search snippet. Home description = condensed version; full text on home and About and in Person structured data. Who: Gabe. Where: `shared/seo.ts` ARTIST_STATEMENT_FULL / ARTIST_SNIPPET.

## 2026-11-17 · Artwork pages and shop pages target different searches
Why: avoid two pages competing. Artwork page title "<Title>, Oil on Canvas Painting by Gabe Wells"; shop page "<Title>: Original … for Sale | Gabe Wells". Who: Claude.

## 2026-11-17 · Gallery click still opens the full-screen viewer
Why: Gabe's existing design. Cards became real links to `/artwork/:id/:slug` (for Google) but a normal click is intercepted to open the viewer. Who: Claude.

## 2026-11-17 · Keep the existing GA4 property (G-VDNM0G75P3)
Why: it already had history, fed by the `VITE_GA_MEASUREMENT_ID` Replit secret. Now also saved as admin settings; server falls back to the secret if the setting is missing. Admin pages excluded from counting. Supersedes: env-only init in `App.tsx`.

## 2026-11-17 · Search Console as URL-prefix property `https://gabewells.com/`
Why: verified instantly through the GA tag, no DNS change. Who: Claude.

## 2026-11-17 · Read-only service account for the admin report
Why: lets the site read GA4 + Search Console with no access to change anything. GA Viewer, Search Console Restricted. Key uploaded by Gabe (Claude may not handle secret keys), stored encrypted in `api_configurations`. Who: Claude; key step Gabe.

## 2026-11-17 · robots.txt must not block /api/
Why: Google needs the API to render pages. Removed during build. Who: Claude.

## 2026-11-17 · Project docs live in `docs/project/` (public repo)
Why: cold chats read the repo; root is crowded. No secrets or identifiers in these files. The plain-English plan stays in the Cowork Project doc `claude/seo-plan.md`. Who: Claude.
