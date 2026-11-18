#!/bin/bash
# Build the TEST copy of the server: plain Postgres driver + fake Stripe (never deployed)
cd /home/claude/artistportfolio
S=/home/claude/sectools
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm \
  --outfile=dist-sectest/index.js \
  --alias:@neondatabase/serverless=$S/neon-shim.mjs \
  --alias:drizzle-orm/neon-serverless=$S/drizzle-shim.mjs \
  --alias:stripe=$S/fake-stripe.mjs 2>&1 | tail -1
