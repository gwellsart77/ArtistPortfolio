# Handoff: deploy the 2026-11-18 security fixes (GitHub ca2bafe → gabewells.com)

Status: **LIVE since 2026-11-24 06:02 MT** (verified: resume 404, limited-edition 410, Gooten webhook Ignored, admin 401s, all public pages 200, no console errors, podcast still 404). Only open item: queue step 4 (Gabe checks the 2-step switch shows ON).

Original status: code on GitHub `main`, tested locally (34/34 attack checks, 9/9 browser checks).
Why not: Replit is signed in only in the built-in browser, and the Claude desktop app went offline mid-chat.
Chrome showed Replit's logged-out page. Claude does not sign in for Gabe.

## Autonomous queue (start without asking once a signed-in Replit browser is available)
1. Safe deploy per `CLAUDE.md` → Deployment Pipeline (backup branch → stash → `checkout -B deploy-20261118 origin/main`).
   **Extra step this time:** run `npm install` on the deploy branch BEFORE `npm run build`
   (the lockfile has security updates: express 4.22.3, form-data, axios, etc.; the server loads
   node_modules at runtime, so without this the library fixes don't go live).
2. Republish → click Shell → `$G checkout main` → `$G merge --no-edit origin/main` → **`npm install`** → `$G stash pop`.
3. Verify live (all must hold):
   - `curl -s https://gabewells.com/ | grep -o 'index-[^"]*\.js'` changed from `index-BoWoxkK8.js`.
   - `curl -s https://gabewells.com/api/settings/about_full_resume` → 404.
   - `curl -s -X POST https://gabewells.com/api/checkout/limited-edition -H 'Content-Type: application/json' -d '{}'` → 410.
   - `curl -s -X POST https://gabewells.com/api/webhooks/gooten -H 'Content-Type: application/json' -d '{}'` → `"Ignored"`.
   - `/api/admin/orders` still 401; home, gallery, shop load with no console errors.
4. Ask Gabe (one line) to open Admin → Account Security → Multifactor Authentication and check the
   switch shows ON. Don't turn it off.
5. Update `claude/next.md` (Project doc) "Done" + this file's status.

## What changed (why: `DECISIONS.md` 2026-11-18)
Payment reuse closed; paid-order crash (`stockQuantity`) fixed; 2-step needs a code to turn off/replace;
secrets out of logs; rate limits on payment starts + password reset; contact email escaped; private
settings widened; unused checkout/webhooks off; `npm audit fix`; 2 MB body limit.
Tests: `scripts/security-test/README.md`.
