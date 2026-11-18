# gabewells.com: Project Roadmap

Goal (Gabe, 2026-11-17): "optimize my website for Google results for artists and art for sale direct from artist. I would also like to connect my Google Analytics data to the Google Analytics section in my admin settings so that we can utilize that to track progress and make improvements over time to the SEO and website visibility optimizations."

Earlier goal, same project (Gabe, 2026-11-16): "I want to be able to click on a painting or image in the gallery, and be able to enlarge the painting to full screen, or read the details ... review the entire website ... optimized for visitors", then "go through the admin settings pages and options and help me optimize everything".

Live state: `CLAUDE.md` (repo root). Why things were decided: `docs/project/DECISIONS.md`. Plain-English plan and baseline numbers: Project doc `claude/seo-plan.md`.

## Status

| Phase | What | Status |
|---|---|---|
| R1 | Redesign: one-click full-screen viewer with Details, gallery palette + fonts, new header/footer/shop/product/contact/about, sized images | ✅ Live 2026-11-16 |
| R2 | Admin: security holes closed, one menu + real Overview + Inbox, 2-step login fixed and ON, blank-page fix (React 426) | ✅ Live 2026-11-17 |
| R3 | Website leftovers: checkout stock ✅, spam guard ✅, sq-inch save ✅, share link ✅ (already existed), mobile header ✅ (already 65 px); left: old "Back to Dashboard" headers (see DECISIONS 2026-11-17) | 🔨 Built, deploying |
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
- [ ] [FIX] **Checkout lowers stock before payment** — P2
  Found: 2026-11-16 by the redesign/admin chat, from reading the code (not reproduced) · Source: Claude
  Why it matters: an abandoned checkout can mark a one-of-a-kind original as sold out · Evidence/where: checkout/order routes in `server/routes.ts`
  Suggested owner/model: Opus or Sonnet chat · Depends on: none
- [ ] [FIX] **Site price for "It's Getting Hot In Here" while it is in the Governor's Art Show** — P2 [G] · decided 2026-11-17: match $4,500 once Gabe says the entry is in
  Found: 2026-11-17 by the redesign/admin close-out · Source: Claude (from Gabe's Mac DECISIONS.md, 2026-11-16)
  Why it matters: the site sells it for less than the show entry; the decision log says the site should match once the entry is submitted
  Suggested owner/model: Claude edits in Gabe's signed-in admin · Depends on: Gabe's answer
- [ ] [FIX] **One data fix left: unused "Our AI curator..." settings text** — P3 ("Propaganda Madness" size fixed to 10x8 on 2026-11-17)
  Found: 2026-11-16 by the redesign chat · Source: Claude · Evidence/where: product size 12x16 vs description 10x8 (needs Gabe's real size); Admin → Settings
  Done already (2026-11-16/17, live): IGHIH price, two hidden products back in the shop, genre wording in hero/footer/meta, shop description, "Immaginative" typo, Portland placeholder bio
- [ ] [FIX] **Upload larger artwork photos** — P2 [G+C]
  Found: 2026-11-16 · Why it matters: most photos are ~720 px tall, so full screen and zoom look soft · Owner: Gabe (photos, 2000-2500 px long edge) + Claude (upload)
- [ ] [BUILD] **Admin polish: contact-form spam filter, remove old "Back to Dashboard" headers, price-per-sq-inch box saves on every keystroke, settings.tsx (3,900 lines) cleanup incl. unused "Website Colors"** — P3
  Found: 2026-11-16 by the admin review · Source: Claude · Owner: Sonnet chat
- [ ] [BUILD] **Compact mobile header + per-painting share link from the viewer + lazy-load shop/About images** — P3
  Found: 2026-11-16 · Why it matters: the phone header uses ~125 px before any art; `/artwork/:id/:slug` pages now exist to share · Owner: Sonnet chat
- [ ] [IDEA] **Replit holds work GitHub lacks (podcast pages + flagship pricing)** — P3 [G]
  Found: 2026-11-16 · Why it matters: every deploy needs the backup/stash/deploy-branch path until it is pushed or dropped · Owner: Gabe decides when the podcast goes public
- [x] [IDEA] "Twighlight" vs "Twilight" artwork title spelling — DONE 2026-11-17: Gabe renamed it "Dwindling Lights"; site updated (see DECISIONS)
  Found: 2026-11-17 by SEO chat in artwork data · Source: Claude
  Why it matters: people search the real word · Evidence/where: artwork #11 · Owner: Gabe [G] decides
- [ ] [FIX] Admin page `/api/settings/<key>` 404s show as console errors on public pages — P3
  Found: 2026-11-17 by SEO chat in browser console · Source: Claude
  Why it matters: noise only, no user impact · Evidence/where: settings never saved (e.g. built_in_analytics_enabled)
- [ ] [FIX] Pre-existing TypeScript errors (~790) across admin pages — P3
  Found: 2026-11-17 by SEO chat running `npx tsc` · Source: Claude
  Why it matters: hides new type errors · Evidence/where: `npx tsc --noEmit -p .`

## Session notes
- **2026-11-16/17 (redesign + admin chat):** Shipped R1 and R2 (deploys 2026-11-16 21:01, 21:26-21:54; 2026-11-17 05:40, 06:19 MT; live = aa76e83). Found and closed critical admin holes (public read of 2-step secret and password hash, login back door, unguarded admin actions); verified 401/404 live. 2-step ON. Leftovers moved here from Gabe's Mac roadmap on 2026-11-17 (this file is now the website's one backlog).
- **2026-11-17 (SEO chat):** Built and shipped Phases 1–2 (3 deploys). Decided: server-written HTML over a Next.js rewrite; separate artwork vs shop titles; URL-prefix Search Console. Found GA was already running from a hidden env secret; kept that ID. Baseline in `claude/seo-plan.md`. Google Rich Results Test: product page valid (Product, Merchant listing, Breadcrumbs).
