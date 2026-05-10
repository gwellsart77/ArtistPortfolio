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

```
1. Edit files locally (with Claude Code or manually)
2. git add + git commit + git push          # updates GitHub
3. In Replit Shell:
      git fetch origin
      git reset --hard origin/main          # applies GitHub changes to Replit
      npm run build                         # rebuilds the app
4. Click Redeploy in Replit Deployments panel
```

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

## Design System

### Typography
- **Page headings:** 32px (`text-3xl`) — refined, gallery-appropriate
- **Subheadings:** 14–16px (`text-sm/text-base`) with `leading-relaxed`
- **Body text:** 14px (`text-sm`)
- **Labels/buttons:** 12px (`text-xs`) with `tracking-widest uppercase`

### Colors
- **Brand accent:** Gold `#b8860b` — active states, underlines, dividers
- **Headings:** Black `#000000`
- **Body:** `neutral-700+`
- **UI inactive:** `neutral-400` → hover `neutral-600` → active `neutral-800`

### Filter Button Pattern
```tsx
// Active
className="border-b-2 border-[#b8860b] text-neutral-800 font-medium"
// Inactive
className="border-b-2 border-transparent text-neutral-400 hover:text-neutral-600"
```

---

## Admin Interface Notes

- `AdminLayout.tsx` wraps admin pages with a persistent sidebar + top header
- Admin pages that still use their own standalone layout (not yet converted): `edit.tsx`, `add-product.tsx`, `manage-products.tsx`, `orders.tsx`, `settings.tsx`
- The dashboard (`dashboard.tsx`) has its own internal sidebar with tab navigation — it does NOT use `AdminLayout`
- Sidebar groups: **CONTENT** / **WEBSITE** / **ACCOUNT & SECURITY** / **SUPPORT**

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
