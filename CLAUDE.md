# ArtistPortfolio — Claude Code Guide

## Project Overview

**Site:** https://gabewells.com (Gabe Wells Fine Art)  
**Stack:** React 18 + TypeScript (Vite) frontend / Express backend  
**Database:** PostgreSQL via Drizzle ORM (Neon serverless)  
**Styling:** Tailwind CSS + Radix UI (shadcn/ui patterns)  
**Routing:** Wouter (lightweight client-side router)  
**State:** TanStack React Query (server state) + Zustand (cart)

**Start here:** `docs/project/START_HERE.md` (knowledge map) → plan `docs/project/PROJECT_ROADMAP.md` →
why `docs/project/DECISIONS.md` → newest brief in `docs/project/HANDOFFS/`. A doc that disagrees with the live site loses.

### Standing answers (Gabe, do not re-ask)
- 2026-11-17: Claude does all SEO research, code, testing, deploying and publishing without asking; Gabe steps in only for logins/input.
- 2026-11-17: Use Gabe's own artist text for the site description (`shared/seo.ts`), condensed if needed, his words.
- 2026-11-16: Never drop Replit-only work (podcast, flagship) and don't publish the podcast until he asks (see Deployment).

### Scope guard
One test for anything found mid-chat: "Can the chat's goal be finished without this?" Yes → park it in
`docs/project/PROJECT_ROADMAP.md` → 🅿️ Backlog and tell Gabe in one line. No → fix it now (root cause first).

### Known failure patterns (dated)
- 2026-11-17: Admin settings save is `PUT /api/admin/settings` (there is no POST). Unknown `/api/*` now returns JSON 404.
- 2026-11-17: GA was secretly fed by the `VITE_GA_MEASUREMENT_ID` Replit secret; removing the env-based init stopped tracking for ~20 min. Server now falls back to that secret.
- 2026-11-17: Claude may not type or paste secret keys into fields: hand key steps to Gabe (illustrated guide).
- 2026-11-17: A brand-new Google service account is rejected by GA "Add users" for ~1 minute ("doesn't match a Google Account"); retry.
- 2026-11-17: Search Console sitemap first showed 5 discovered pages (old cache); live sitemap has 47. Re-check later, don't "fix".
- 2026-11-17: Built-in browser IS signed in to Replit and the Shell screenshot works there; Google (GA, Cloud, Search Console) is signed in only in Chrome.

### Skills used in this project
| Situation | Skill | How / gotcha |
|---|---|---|
| Deploy or drive the Replit Shell | `replit-shell-handoff` | Follow the Deployment recipe below; screenshot the shell before typing |
| Add/edit artwork, products, releases | `website-manager` | |
| Gabe must do a setup step (keys, accounts) | `illustrated-setup-guide` | Publish as artifact, give him the link |
| Any bug | `superpowers:systematic-debugging` | Root cause before fix |
| Before saying "done" | `superpowers:verification-before-completion` | curl the live URL / screenshot |
| Visual/UI changes | `frontend-design`, `design:accessibility-review` | Keep Design System below |
| Choices only Gabe can make | `decision-questionnaire` | |
| Numbers and claims | `anti-hallucination` | |
| Model choice | `advisor-router-unified` | |
| Plan / next steps | `project-roadmap`, `project-analysis` | |
| Phase end / chat close | `project-knowledge-update` | |
| Browser work | `built-in-browser` (default), `chrome-browser` (Google sites) | |
| Artwork descriptions in Gabe's voice | `artist-voice`, `post-writer` | |
| Pricing originals | `painting-pricer` | |

---

## Deployment Pipeline — READ THIS FIRST

### How it works

There are **two separate git repositories** that must be kept in sync manually:

| Location | Remote | Commits | Purpose |
|---|---|---|---|
| Local machine | `origin` → GitHub | Clean dev history | Source of truth for code changes |
| Replit workspace | internal (`gitsafe-backup`) | 1,400+ "Published your App" builds | What actually runs on gabewells.com |

**GitHub and Replit have diverged histories.** They cannot be merged normally.

### Deploying changes (every time)

**Replit can hold work that is not on GitHub** (as of 2026-11-16: podcast pages committed only on
Replit `main`, plus uncommitted "flagship pricing" work). Gabe's standing rule for that work: never
reset or pull in a way that drops it, and don't push or publish the podcast until he asks.
So `git reset --hard origin/main` is only safe when Replit has nothing GitHub lacks. Check first.

```
1. Edit files locally, commit, push to GitHub main.
2. In Replit Shell (G=/nix/store/x5hwjkyng8385q1pqhz8wyqkq0izmhpi-replit-runtime-path/bin/git):
      $G status --short; $G fetch origin; $G log --oneline origin/main..HEAD
      # If both are empty → $G reset --hard origin/main is fine.
      # If not → publish GitHub's version without the Replit-only work:
      $G branch -f backup/replit-main-<date> HEAD
      $G stash push -u -m wip-<date>
      $G checkout -B deploy-<date> origin/main
      npm run build
3. Click Republish (top right) → Republish. Wait for "Your project was published".
4. Put Replit back the way it was, with the new code merged in:
      $G checkout main
      $G merge --no-edit origin/main
      $G stash pop
```
Deployed 2026-11-16 this way (live build from GitHub cb99451; Replit `main` = merge 0def635).
Deployed 2026-11-17 three times this way (SEO work; live = GitHub 3b5113f; Replit `main` = merge 2f622b8).
**Note (2026-11-17):** Replit's Publish auto-committed the uncommitted flagship-pricing work on Replit `main`
as a "Published your App" commit (fd7a385). It is safe (also on `backup/replit-main-20261117c`) and was NOT
published: the live build came from GitHub. `stash push` now says "No local changes", which is expected.
Replit's `git` path changes: use `G=$(command -v git || ls /nix/store/*/bin/git | head -1)`.
Deployed 2026-11-17 06:19 (admin Suspense fix; live = GitHub aa76e83; Replit `main` = merge 9b1a8f4).
After clicking Republish, Replit jumps to the Publishing tab: click the Shell tab before typing.
**Every lazy page must sit inside a `<Suspense>`** (AdminLayout and the router both provide one now); a lazy page
without one crashes on a menu click (React error 426).

### CRITICAL — never run this from Replit Shell

```bash
git push origin main --force   # ← DESTROYS GitHub history with Replit's internal commits
```

Replit will suggest this when it detects diverged histories. Always refuse — it would wipe clean development commits from GitHub.

### Checking what's deployed

In Replit Shell:
```bash
/nix/store/x5hwjkyng8385q1pqhz8wyqkq0izmhpi-replit-runtime-path/bin/git log --oneline -3
curl -s -o /dev/null -w "HTTP %{http_code}" http://localhost:5000/
ls dist/
```

Note: `git` is not on the default PATH in Replit — use the full Nix store path above.

### GitHub repo

- **URL:** https://github.com/gwellsart77/ArtistPortfolio
- **Branch:** `main` (production)
- **Local path:** `C:\Users\gwell\iCloudDrive\Art\Website\ArtistPortfolio`

---

## SEO (added 2026-11-17)

- **`server/seo.ts`** writes per-page `<title>`, description, canonical, OG tags, JSON-LD and readable
  body content into index.html for every public URL (prod: `serveStatic`; dev: `setupVite`). Also serves
  `/robots.txt` and `/sitemap.xml` from the DB (60 s cache). Unknown URLs → 404.
- **`shared/seo.ts`** = single source for page titles/descriptions, Gabe's artist text, slugs and URL builders
  (`artworkPath`, `productPath`). Use these for any link to an artwork or product.
- Client `SEO` component updates existing head tags in place. Don't add react-helmet SEO tags or client JSON-LD.
- Gabe's artist text (his words, keep it): see `ARTIST_STATEMENT_FULL` / `ARTIST_SNIPPET`.
- Never add `Disallow: /api/` to robots.txt: Google needs the API to render pages.
- **Google report** (`server/google-insights.ts`, panel in `components/google-insights-panel.tsx`):
  service account key in `api_configurations` as `GOOGLE_SERVICE_ACCOUNT_KEY` (encrypted); settings
  `google_analytics_property_id`, `google_search_console_site`, `google_site_verification`,
  `google_analytics_id`, `google_analytics_enabled`.
- Smoke test without a database: `DATABASE_URL=postgres://u:p@localhost/x npx tsx scripts/seo-smoke.ts <dir with artworks.json, products.json, settings.json> <outDir>`.

---

## Project Structure

```
client/src/
  components/
    AdminLayout.tsx       ← Admin sidebar + layout wrapper (use on ALL admin pages)
    layout.tsx            ← Public site layout
    ui/                   ← shadcn/ui components
  pages/
    admin/
      dashboard.tsx       ← Main admin dashboard (has its own sidebar, tab-based)
      upload.tsx          ← Upload artwork form
      manage.tsx          ← Manage gallery (search/sort/filter)
      edit.tsx            ← Edit artwork
      orders.tsx          ← Orders management
      manage-products.tsx ← Manage shop products
      settings.tsx        ← Website settings (homepage, gallery, bio, etc.)
      account-security.tsx← MFA settings
      analytics-settings.tsx
    home.tsx / gallery.tsx / shop.tsx / about.tsx / contact.tsx
  lib/
    queryClient.ts        ← React Query client + apiRequest helper
    cache-invalidation.ts ← Automatic query invalidation helpers
server/
  routes.ts               ← All API routes
  storage.ts              ← Database access layer
  index.ts                ← Express app entry point
shared/
  schema.ts               ← Drizzle schema + Zod types (single source of truth)
```

---

## Design System (public site, updated 2026-11-16)

### Colors
- **Paper** (page background): `#f7f6f3` · **Ink** (text, buttons): `#1b1a18` · **Stone** (muted text): `#6e6a63`
- **Line** (hairlines): `#e3e0da` · **Mat** (behind artwork): `#efede8`
- **Bronze accent** `#8b6b3e` — thin rules, active tab underline, link hover only. Never a big fill.
- Tailwind names exist (`ink`, `paper`, `stone`, `line`, `bronze`) but pages mostly use the hex values.
- `--primary` is ink, so shadcn default buttons are ink. The admin area still uses the old gold `#b8860b`.

### Typography
- Headings: `font-serif` = Cormorant Garamond (weight 500). Page titles `text-4xl md:text-5xl`, centered, with a `w-16 h-px bg-[#8b6b3e]` rule.
- Text/UI: `font-sans` = Inter. Labels/tabs `text-xs uppercase tracking-[0.14em]`.

### Patterns
- Tabs: active `text-[#1b1a18] border-b border-[#8b6b3e]`, inactive `text-[#6e6a63] border-transparent`.
- Primary button: `bg-[#1b1a18] hover:bg-black text-white h-12 text-xs uppercase tracking-[0.16em]` (square corners).
- Artwork viewer: `components/artwork-lightbox.tsx` (one click opens; Details panel). Images go through `lib/cloudinary.ts`.
- Product titles are stored as `Original Painting: "X"`; show them with `displayTitle()` from `lib/product-display.ts`.
- Never add placeholder bios, CVs or stock photos as fallbacks: only Gabe's real content.

## Admin Interface Notes (updated 2026-11-16)

- **Every admin page renders inside `AdminLayout`** (wrapped in `App.tsx`, except login,
  forgot-password, and `manage`/`upload`/`messages`/`dashboard`, which use it directly).
  The one menu lives in `ADMIN_NAV` in `AdminLayout.tsx`; only add links to pages that exist.
- The dashboard's tabs live in the URL: `/admin/dashboard?tab=stripe-config|email-config|api-configuration|...`.
  The Overview shows real counts and latest Inbox messages (no placeholder numbers).
- Inbox: `/admin/messages` (contact-form messages, `GET /api/admin/messages`).
- Older pages still draw their own "Back to Dashboard" headers; `.admin-main` CSS flattens their grey frame.
- **Security rules (do not undo):** every `/api/admin/*` route requires sign-in via one middleware
  near the top of `registerRoutes` (only login, logout, 2-step status, session check and password
  reset are public). `GET /api/settings*` never returns secret keys to the public
  (`isSensitiveSettingKey` in `server/middleware.ts`). Product create/edit requires sign-in.
  Orders are marked paid only after Stripe confirms the payment. Logout = `POST /api/admin/logout`.

### Category display names
Categories are stored as slugs (`imaginative-realism`) in the DB. Always convert for display:
```ts
category.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
```

### Order status display
`getStatusBadge()` in `orders.tsx` uses `.toLowerCase()` matching. Known API values:
`pending`, `processing`, `shipped`, `delivered`, `completed`, `cancelled`, `refunded`,
`sent_to_printful`, `sent_to_gooten`, `in_production`, `on_hold`

---

## Common Commands

```bash
npm run dev        # start dev server (port 5000)
npm run build      # production build → dist/
npm run check      # TypeScript check
npm run db:push    # push schema changes to database
```

---

## Key Conventions

- **Forms:** React Hook Form + Zod validation
- **API calls:** use `apiRequest()` from `@/lib/queryClient`
- **Cache invalidation:** use helpers from `@/lib/cache-invalidation` after mutations
- **Images:** Cloudinary for storage; URLs start with `https://res.cloudinary.com/`
- **Auth:** Session-based; verify with `GET /api/admin/verify-session` on mount
- **No CSS modules** — Tailwind utility classes only
