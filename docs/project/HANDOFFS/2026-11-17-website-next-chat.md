# Handoff · website leftovers (redesign + admin follow-ups)

Date: 2026-11-17 · From: the redesign + admin chat (2026-11-16/17) · Can start now (no waiting on Google data).
Model: Sonnet for items 2-4; Opus for item 1 (checkout and stock touch money).
Goal: finish the website leftovers below. Gabe's standing approval covers building, deploying and publishing (2026-11-16). He signs in himself.
Read first: `docs/project/START_HERE.md`, `CLAUDE.md` (Deployment, Known failure patterns, Testing, Admin Interface Notes), `docs/project/PROJECT_ROADMAP.md` (R3 + Backlog).

## State (with evidence)
- Live build = GitHub `aa76e83` (bundle `index-p2lBKCC0.js`, checked 2026-11-17 06:19 MT). Later commits are docs only.
- Replit `main` = merge `9b1a8f4`, clean. Replit-only work (podcast pages, flagship pricing) stays there and on `backup/replit-main-2026-11-16*`, `-2026-11-17*`; not published, by Gabe's rule.
- Admin security verified live (401/404 for each old hole). 2-step login ON (`/api/admin/mfa-status` → enabled).

## Autonomous queue (no input from Gabe needed)
1. **Checkout lowers stock before payment.** Find where checkout/order creation reduces quantity or availability in `server/routes.ts`; move it to after Stripe confirms payment (the payment PATCH already checks the PaymentIntent). Done when: an unpaid test order leaves the original in stock and a paid one marks it sold. Verify locally, deploy by the CLAUDE.md recipe, check the live bundle changed.
2. **Admin polish:** contact-form spam filter (honeypot field + simple rate limit, no paid service); remove the old in-page "Back to Dashboard" headers; price-per-sq-inch box saves on blur or a button, not every keystroke. Done when: all `ADMIN_NAV` links click through with zero console errors and the three changes work.
3. **Compact mobile header + share link:** art starts within ~80 px of the top at phone width; the viewer's Details panel links to the painting's `/artwork/:id/:slug` page. Done when: both work on a phone-width test and live.
4. After each deploy: append to `docs/project/DECISIONS.md`, tick the backlog. End the chat with /project-knowledge-update.

## Gabe answered (2026-11-17, see DECISIONS)
- "Propaganda Madness" = 10x8: done. "Twighlight" → "Dwindling Lights" everywhere: done.
- "It's Getting Hot In Here": match $4,500 once his show entry is in. When he says it's in, set product 60 to 4500 in his signed-in admin and check the shop page.

## Still only Gabe
- Bigger artwork photos when he has time (2000-2500 px long edge).
If Gabe already answered (check `docs/project/DECISIONS.md`), just make the edits in his signed-in admin.

## Don't
- `git push --force` from Replit, or `git reset --hard` there without the CLAUDE.md check.
- Type Gabe's password or 2-step code.
- Blame caching for a blank page before reproducing the exact click.
