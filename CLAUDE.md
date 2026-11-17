# ArtistPortfolio — Claude Code Guide

## Project Overview

**Site:** https://gabewells.com (Gabe Wells Fine Art)  
**Stack:** React 18 + TypeScript (Vite) frontend / Express backend  
**Database:** PostgreSQL via Drizzle ORM (Neon serverless)  
**Styling:** Tailwind CSS + Radix UI (shadcn/ui patterns)  
**Routing:** Wouter (lightweight client-side router)  
**State:** TanStack React Query (server state) + Zustand (cart)

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
