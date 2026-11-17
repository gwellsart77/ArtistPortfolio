# Handoff · SEO first review (start on or after 2026-12-01)

Goal: read the first Google Search Console + GA4 numbers, fix what they show, move to Phase 4 prep.
Model: Sonnet is enough; Opus only if a crawl/indexing problem needs root-causing.
Read first: `docs/project/START_HERE.md`, `CLAUDE.md` (SEO + Deployment), `docs/project/PROJECT_ROADMAP.md`, Project doc `claude/seo-plan.md` (baseline).

## State (with evidence)
- Live 2026-11-17: per-page titles/canonicals (curl of 8 URLs), sitemap 47 URLs, robots OK, 404s real.
- Rich Results Test on /shop/product/8: Product, Merchant listing, Breadcrumbs valid (non-critical warnings).
- Admin report connected: GA4 returns data; Search Console returns zero rows (property created 2026-11-17).
- GA tag G-VDNM0G75P3 in page HTML; admin pages excluded.

## Autonomous queue (no input from Gabe needed)
1. Open Admin → Visitor analytics (Chrome, Gabe is signed in). Done when: 28-day GA + Search Console numbers recorded in `claude/seo-plan.md` next to the baseline. Verify: values match the panel.
2. Search Console → Sitemaps: confirm discovered pages ≈ 47; Pages report: list "not indexed" reasons. Done when: each reason fixed or parked in the backlog.
3. Write SEO description + alt text for artworks missing them (admin edit or `PUT` via admin session). Done when: `/api/artworks` shows non-empty seoDescription/altText for all. Verify by curl.
4. Draft (don't send) link-request messages for the 4 venues in Phase 4 and a Google Business Profile text. Done when: drafts saved in Project docs.

## Only Gabe can decide (batch into one questionnaire)
- Shipping prices for originals (for structured data).
- "Twighlight" vs "Twilight".
- Go-ahead + sign-in for Google Business Profile.
