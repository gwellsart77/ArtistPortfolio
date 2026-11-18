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

## 2026-11-18 · Google Business Profile: created, verification postponed by Gabe
Who: Gabe decided; Claude did the setup in Chrome (Gabe's Google account).
- Gabe chose "hide address, serve Denver": no visitable location, service area Denver, CO. Name "Gabe Wells Fine Art", category Artist, website gabewells.com, no public phone, update emails off.
- Google offers only video verification for this profile. Gabe: "skip this step today"; he will film the video when he has free time. Until then the profile is not visible on Google.
- Next after verification: description (his artist text), Instagram/Facebook links, photos of his own paintings. Draft: Project doc `claude/google-business-profile-draft.md`.

## 2026-11-18 · Security review: 9 holes closed, 1 checkout crash fixed
Who: Claude (Opus), Gabe's request "be the security expert" + standing approval. Proof: 33 attack checks + 9 browser checks in `scripts/security-test/` pass on the new code; 18 of the 33 fail on the old code. Run against a throwaway local database and fake Stripe, never the live site.
- **Payment reuse (high).** `PATCH /api/orders/:id/payment` accepted any successful Stripe payment that was big enough, so one real payment could mark other orders paid (and their originals sold). Now the payment must carry this order's number and can't already belong to another order. `/api/create-payment-intent` keeps only `orderId` as payment notes and caps amounts.
- **Checkout crash (high, from 2026-11-17).** `updateProductStock` wrote a column that doesn't exist (`stockQuantity`; the column is `stock`), so after a real payment the server errored: the buyer saw "Payment Error" and the original stayed "available". Fixed. TypeScript had flagged it (TS2353).
- **2-step can't be switched off or swapped by a stolen session (medium).** Both turn-off routes and both "set up a new secret" routes need a current code while 2-step is on. Admin → Account Security shows a code box; the switch also now shows the real state (it showed OFF while 2-step was on).
- **Secrets out of the server log (medium).** Removed logging of session IDs, cookies, 2-step secrets/codes, the reset code, and admin reply bodies; the crash logger hides cookie/password/code/key fields.
- **Rate limits (medium):** payment starts + `/api/checkout/*` 10 per 15 min (card-testing fraud); password reset 6 per hour. Checked live: a fake `X-Forwarded-For` does not get a fresh counter (keyed on the real visitor).
- **Contact email (medium):** visitor text is escaped, so a message can't plant links or HTML in the email Gabe gets.
- **Private settings (low):** studio/drop-ship address and shipping contact never public (empty today, private if filled). `about_full_resume` (holds Gabe's phone number; not shown anywhere on the site, but anyone could read it through `/api/settings`) is now admin-only.
- **Unused doors closed (low):** limited-edition and digital checkout return 410 (edition used to count as sold before payment); Gooten/Printful webhooks ignored unless `GOOTEN_WEBHOOK_TOKEN` / `PRINTFUL_WEBHOOK_TOKEN` is set and sent as `?token=`. Only originals are sold (8 products, all `originals`). Turn back on with `ENABLE_PRINT_CHECKOUT=true`.
- **Libraries:** `npm audit fix` (non-breaking): critical 2 → 0, high 22 → 15; the rest are build tools or need major upgrades (parked). Request bodies capped at 2 MB (was 10 MB).
- **Already good (checked, no change):** every `/api/admin/*` needs sign-in (also `/api/ADMIN/...`, trailing slash), HTTPS + HSTS, CSP/helmet headers, bcrypt passwords, session ID renewed at sign-in, httpOnly secure cookies, no secrets in GitHub.
