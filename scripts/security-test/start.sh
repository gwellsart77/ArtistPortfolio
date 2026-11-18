#!/bin/bash
# Start the test copy of the site on the THROWAWAY database (fake keys only).
pkill -9 -f "node index.js" 2>/dev/null; sleep 1
cd /home/claude/artistportfolio/dist-sectest
AT=$(printf '\x40')
export DATABASE_URL="postgres://u:p${AT}localhost:5433/art" NODE_ENV=production
export SESSION_SECRET=$(head -c 48 /dev/urandom | base64)
export STRIPE_SECRET_KEY=sk_test_fake USPS_CONSUMER_KEY=x USPS_CONSUMER_SECRET=x
export CLOUDINARY_CLOUD_NAME=x CLOUDINARY_API_KEY=x CLOUDINARY_API_SECRET=x PRINTFUL_API_KEY=x
nohup node index.js > /tmp/srv.log 2>&1 &
for i in $(seq 1 30); do sleep 1; c=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/healthz); [ "$c" = 200 ] && { echo "UP after ${i}s"; exit 0; }; done
echo "NOT UP"; grep -iE "error|fatal" /tmp/srv.log | head -8
