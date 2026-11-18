# Security tests (added 2026-11-18)

Attack tests that run the REAL server code against a throwaway local Postgres and a fake
Stripe. They never touch gabewells.com or the Neon database.

What they check (33 checks in `attack.mjs`, 9 in `ui-mfa.mjs`):
- 2-step can't be turned off or replaced without a current code
- one real payment can't mark other orders paid; $1 payment can't pay a $100 order
- paid original: stock drops once (the `stockQuantity` crash, fixed 2026-11-18)
- private settings (studio address, 2-step secret) never public
- unused doors closed (limited-edition / digital checkout, Gooten / Printful webhooks)
- rate limits on password reset and payment starts
- the server log never holds the 2-step secret, the password or session IDs

How to run (cloud chat, as root; paths assume the repo is at /home/claude/artistportfolio
and these files are copied to /home/claude/sectools):
1. Local Postgres on port 5433: `npm i embedded-postgres` somewhere, then as a NON-root user run
   its `native/bin/initdb -D /tmp/pgdata2 -U u --pwfile=<file with "p"> -A md5` and
   `pg_ctl -D /tmp/pgdata2 -o '-p 5433 -k /tmp' start`; create database `art`.
2. In /home/claude/sectools: `npm i drizzle-kit@0.30.6 drizzle-orm@0.39.3 pg zod drizzle-zod`
   (the repo's own drizzle-kit 0.18 has no `push`).
3. `bash build-test.sh` (test build into `dist-sectest/`, gitignored), `npm run build` once for
   `dist/public`, `ln -s ../dist/public dist-sectest/public`, copy the two test files into dist-sectest.
4. `bash fresh.sh` (wipes the TEST db, starts one server), then `node attack.mjs` from dist-sectest.
5. Prove a check catches a bug by running it on the old code first (`git stash`, build, run, `git stash pop`).

Gotchas: `server.listen` uses `reusePort`, so a forgotten old test server shares port 5000 with a
different session secret and sign-ins fail at random. `fresh.sh` kills them; check `pgrep -af "node index.js"`.
Production mode sets Secure cookies: send `X-Forwarded-Proto: https`.
