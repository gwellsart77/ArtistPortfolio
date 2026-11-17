# gabewells.com: Project Roadmap

Goal (Gabe, 2026-11-17): "optimize my website for Google results for artists and art for sale direct from artist. I would also like to connect my Google Analytics data to the Google Analytics section in my admin settings so that we can utilize that to track progress and make improvements over time to the SEO and website visibility optimizations."

Live state: `CLAUDE.md` (repo root). Why things were decided: `docs/project/DECISIONS.md`. Plain-English plan and baseline numbers: Project doc `claude/seo-plan.md`.

## Status

| Phase | What | Status |
|---|---|---|
| 1 | Technical SEO foundation (server-written pages, sitemap, robots, 404s, artwork pages, structured data) | ✅ Live 2026-11-17 |
| 2 | Google tools (GA4 tag, Search Console + sitemap, admin Google report) | ✅ Live 2026-11-17 |
| 3 | First review: Search Console data after ~2 weeks, fix what it shows | ⏳ Not started (earliest 2026-12-01) |
| 4 | Off-site visibility: Google Business Profile, links from galleries/shows, social bios | ⏳ Not started (needs Gabe for accounts) |
| 5 | Content: missing SEO descriptions/alt text, a Journal (one post per painting) | ⏳ Not started |

## Phase 3 · First review (done when: report read, top issues fixed or parked)
- [ ] Read Admin → Visitor analytics (28 days) and Search Console Pages/Sitemaps reports
- [ ] Confirm sitemap "Discovered pages" ≈ 47 (it showed 5 on first submit)
- [ ] Fix any indexing errors; note top searches in `claude/seo-plan.md`

## Phase 4 · Off-site (done when: Business Profile verified, 3+ inbound links)
- [ ] [G+C] Google Business Profile (Denver artist / studio): Claude prepares text, Gabe signs in and verifies
- [ ] [C] Draft link-request notes to Lone Tree Art Expo, Las Laguna Gallery, Deines Cultural Center, Beautiful Bizarre (Gabe sends)
- [ ] [G] Put gabewells.com in Instagram and Facebook bios

## Phase 5 · Content (done when: every artwork has SEO description + alt text; first 3 journal posts live)
- [ ] [C] Write SEO description + alt text for artworks missing them (e.g. #35), save via admin
- [ ] [C] Build a Journal section (server SEO + sitemap aware)
- [ ] [G+C] First 3 posts from Gabe's painting stories

## 🅿️ Backlog — Future Builds & Fixes

- [ ] [BUILD] Google Merchant Center free listings for originals — P2
  Found: 2026-11-17 by SEO chat while adding product structured data · Source: Claude
  Why it matters: free Shopping-tab listings · Evidence/where: Rich Results Test shows valid Merchant listing on /shop/product/8
  Suggested owner/model: Sonnet chat + Gabe [G] for account · Depends on: none
- [ ] [FIX] Add shippingDetails to Product structured data — P3
  Found: 2026-11-17 by SEO chat in Rich Results Test ("non-critical issues") · Source: Claude
  Why it matters: removes warnings, can show shipping cost in results · Evidence/where: `server/seo.ts` productLd · Needs Gabe's real shipping prices
  Suggested owner/model: Sonnet chat · Depends on: shipping price answer from Gabe
- [ ] [IDEA] "Twighlight" vs "Twilight" artwork title spelling — P3
  Found: 2026-11-17 by SEO chat in artwork data · Source: Claude
  Why it matters: people search the real word · Evidence/where: artwork #11 · Owner: Gabe [G] decides
- [ ] [FIX] Admin page `/api/settings/<key>` 404s show as console errors on public pages — P3
  Found: 2026-11-17 by SEO chat in browser console · Source: Claude
  Why it matters: noise only, no user impact · Evidence/where: settings never saved (e.g. built_in_analytics_enabled)
- [ ] [FIX] Pre-existing TypeScript errors (~790) across admin pages — P3
  Found: 2026-11-17 by SEO chat running `npx tsc` · Source: Claude
  Why it matters: hides new type errors · Evidence/where: `npx tsc --noEmit -p .`

## Session notes
- **2026-11-17 (SEO chat):** Built and shipped Phases 1–2 (3 deploys). Decided: server-written HTML over a Next.js rewrite; separate artwork vs shop titles; URL-prefix Search Console. Found GA was already running from a hidden env secret; kept that ID. Baseline in `claude/seo-plan.md`. Google Rich Results Test: product page valid (Product, Merchant listing, Breadcrumbs).
