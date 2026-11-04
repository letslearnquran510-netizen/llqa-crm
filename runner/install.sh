#!/usr/bin/env bash
# LLQA CRM 24/7 runner — install on an Ubuntu VPS (22.04 / 24.04), as root:
#   bash install.sh                       runner only
#   bash install.sh crm-api.example.com   runner + HTTPS address for website inquiries
# Safe to run again (updates the files, keeps config.json and queued inquiries).
set -euo pipefail
cd "$(dirname "$0")"
DIR=/opt/llqa-runner
DOMAIN="${1:-}"
say() { printf '\n== %s\n' "$*"; }

say "Node.js"
if ! command -v node >/dev/null 2>&1 || [ "$(node -p 'process.versions.node.split(".")[0]')" -lt 18 ]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi
node -v

say "Runner files in $DIR"
id -u llqa >/dev/null 2>&1 || useradd --system --create-home --home-dir /var/lib/llqa --shell /usr/sbin/nologin llqa
mkdir -p "$DIR/data"
cp runner.js package.json "$DIR"/
[ -f "$DIR/config.json" ] || cp config.example.json "$DIR/config.json"
chown -R llqa:llqa "$DIR"

say "Packages and Chromium"
cd "$DIR"
sudo -u llqa npm install --omit=dev --no-audit --no-fund
npx --yes playwright install-deps chromium
sudo -u llqa env PLAYWRIGHT_BROWSERS_PATH="$DIR/browsers" npx playwright install chromium
cd - >/dev/null

say "Service (starts now and after every reboot)"
cp llqa-runner.service /etc/systemd/system/llqa-runner.service
systemctl daemon-reload
systemctl enable llqa-runner
systemctl restart llqa-runner

if [ -n "$DOMAIN" ]; then
  say "HTTPS address for website inquiries: https://$DOMAIN/lead"
  if ss -ltn | grep -qE ':(80|443) ' && ! systemctl is-active --quiet caddy; then
    echo "Another web server already uses port 80/443 on this VPS. Add this to it instead (nginx example):"
    echo "  server { server_name $DOMAIN; location / { proxy_pass http://127.0.0.1:8787; proxy_set_header X-Forwarded-For \$remote_addr; } }"
    echo "then get a certificate for $DOMAIN (e.g. certbot --nginx -d $DOMAIN)."
  else
    if ! command -v caddy >/dev/null 2>&1; then
      apt-get install -y debian-keyring debian-archive-keyring apt-transport-https curl gnupg
      curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor --yes -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
      curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' > /etc/apt/sources.list.d/caddy-stable.list
      apt-get update && apt-get install -y caddy
    fi
    printf '%s {\n\treverse_proxy 127.0.0.1:8787\n}\n' "$DOMAIN" > /etc/caddy/Caddyfile
    systemctl reload caddy || systemctl restart caddy
    echo "Caddy gets the HTTPS certificate by itself once $DOMAIN points to this VPS (DNS A record)."
  fi
fi

say "Status (give it a minute to open the CRM)"
sleep 45
curl -s http://127.0.0.1:8787/health || true
echo
echo "Logs: journalctl -u llqa-runner -f      Restart: systemctl restart llqa-runner"
