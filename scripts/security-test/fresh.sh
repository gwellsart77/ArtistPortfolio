#!/bin/bash
# Fresh THROWAWAY database + one test server (never touches the live site)
pkill -9 -f "node index.js" 2>/dev/null; sleep 1
cd /home/claude/sectools
node reset.cjs
timeout 150 npx drizzle-kit push --force 2>&1 | tail -1
bash start.sh
