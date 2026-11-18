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

## 2026-11-16 · Redesign and admin decisions (summary; full entries on Gabe's Mac, `Artwork Marketing Manager/DECISIONS.md`)
- One click on a painting opens a full-screen viewer with a Details button; the old hover overlay was swallowing clicks.
- Gallery palette (paper, ink, stone, bronze accent) + Cormorant Garamond / Inter; `--primary` is ink.
- One middleware guards every `/api/admin/*` route; secrets never leave `/api/settings*`; login back door removed; payments verified with Stripe. Who: Claude, Gabe approved all admin fixes.
- 2-step codes accept one adjacent 30-second step (clock drift).
- Deploy via a Replit deploy branch, never `reset --hard`, because Replit holds podcast/flagship work GitHub lacks.

## 2026-11-17 · Every lazy page sits inside `<Suspense>`
Why: a lazy admin page with no Suspense crashed on a menu click (React error 426). Corrects the 05:40 diagnosis (stale files); the auto-reload safety net stays. Who: Claude. Where: `AdminLayout.tsx`, `App.tsx` (aa76e83).

## 2026-11-17 · One set of website docs: `docs/project/` in this repo
Why: two chats closed out at the same time and each started a knowledge map (this repo, and Gabe's Mac + Project docs). This repo's set came first and every chat can reach it. The redesign chat's map, backlog items and handoff were merged in here; the other copies are now one-line pointers. Gabe's Mac `Artwork Marketing Manager/` keeps the whole-business view and points here. Who: Claude.

## 2026-11-17 · Gabe's answers: painting size, a new title, show price
Asked once in the close-out questionnaire. Who: Gabe.
- "Propaganda Madness" is 10x8. Done: shop product now height 10, width 8 (was 12x16); artwork already said 10" x 8".
- "Twighlight" is renamed **"Dwindling Lights"** everywhere (his words: "Update to: Dwindling Lights everywhere"). Done: artwork #11 and product #6 title, description, SEO description and alt text. The page is now `/artwork/11/dwindling-lights`; old links still open it (pages match by id). Left as is: the Cloudinary image file name (`Twighlight_web_...jpg`), which visitors don't see; renaming it means re-uploading the image.
- Also fixed (Claude): the artwork's SEO description said "oil painting"; its medium, description and alt text all say acrylic, so it now says acrylic.
- "It's Getting Hot In Here": match the show price ($4,500) once his Governor's Art Show entry is in. Waiting on Gabe to say the entry is in.

## 2026-11-17 · R3 leftovers: stock after payment, contact spam guard, sq-inch save
Why and what. Who: Claude (Gabe's standing approval, 2026-11-16).
- **Stock drops only after Stripe confirms payment.** `POST /api/orders` no longer lowers stock; `PATCH /api/orders/:id/payment` does, once (only while the order is `pending`), never below zero. Proof: fake-store test through the real routes passed on the new code and failed on the old code (stock dropped at order creation).
- **Contact form spam guard:** 5 messages per hour per visitor, plus a hidden `website` field; a filled field gets a fake success and nothing is saved. Proof: fake-store test (bot saved 0, human saved, 6th rapid message got HTTP 429). No paid service.
- **Price per square inch** (Admin → Overview) saves on blur or Enter, not on every keystroke.
- **Checked, no change needed:** the viewer's Details panel already links to the painting's own page ("Page for this work"); the phone header is already 65 px tall (measured on live, 375 px wide).
- **Parked:** removing the old "Back to Dashboard" headers (12 admin files, cosmetic; `.admin-main` CSS already flattens them).
