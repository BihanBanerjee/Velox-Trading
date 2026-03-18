#!/bin/bash
# ──────────────────────────────────────────────
# SSL Bootstrap Script for velox.bihanbanerjee.com
# Run this ONCE on the Droplet to get the first SSL certificate
# ──────────────────────────────────────────────

DOMAIN="velox.bihanbanerjee.com"
EMAIL="banerjeebihan456@gmail.com"

set -e

echo "==> Step 1: Creating temporary Nginx config (HTTP only)..."

# Backup the real config
cp /root/Velox-Trading/nginx/nginx.conf /root/Velox-Trading/nginx/nginx.conf.bak

# Write a temporary HTTP-only config for Certbot challenge
cat > /root/Velox-Trading/nginx/nginx.conf <<'TMPCONF'
events {
    worker_connections 1024;
}
http {
    server {
        listen 80;
        server_name velox.bihanbanerjee.com;

        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }

        location / {
            return 200 'Waiting for SSL...';
            add_header Content-Type text/plain;
        }
    }
}
TMPCONF

echo "==> Step 2: Starting Nginx (HTTP only)..."
docker compose -f docker-compose.prod.yml up -d nginx

echo "==> Step 3: Requesting SSL certificate from Let's Encrypt..."
docker compose -f docker-compose.prod.yml run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    -d "$DOMAIN"

echo "==> Step 4: Restoring full Nginx config (HTTPS)..."
cp /root/Velox-Trading/nginx/nginx.conf.bak /root/Velox-Trading/nginx/nginx.conf

echo "==> Step 5: Reloading Nginx with SSL..."
docker compose -f docker-compose.prod.yml restart nginx

echo ""
echo "==> Done! https://$DOMAIN is now live with SSL."
echo ""
echo "To auto-renew certificates, add this cron job:"
echo '0 3 * * * cd /root/Velox-Trading && docker compose -f docker-compose.prod.yml run --rm certbot renew && docker compose -f docker-compose.prod.yml exec nginx nginx -s reload'
