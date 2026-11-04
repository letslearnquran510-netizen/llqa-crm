# LLQA CRM — 24/7 runner

Keeps the CRM's automatic work going with nobody signed in, and takes website
inquiries in as Leads.

- **Automatic work, around the clock:** one Super Admin tab of the CRM stays open on the VPS (`index.html?runner=1`). Every 2 minutes it does the same automatic work an admin's tab does: teacher-leave cover, Fee Status, clock changes, leave starts. It also writes a heartbeat.
- **People's tabs leave the work to it:** while the heartbeat is fresh (under 5 minutes old), people's own tabs don't repeat that work. They show once what the runner did, with the usual buttons (tell substitutes / tell families).
- **Status on the Dashboard:** "🤖 24/7 runner online — last check 1 min ago" (or offline since …).
- **It watches itself:**
  - signs in again if it was signed out
  - reloads if the heartbeat stops or saving keeps failing
  - restarts the browser if it crashes or hangs
  - starts fresh once a day
  - reloads by itself when a new CRM version is published
- **Website inquiries:** they arrive at `POST /lead` and become Leads, due today, with a notice for the admin.
  - The same WhatsApp number already open as a lead gets a note instead of a second lead.
  - Each inquiry is queued on disk first, so none is lost while the CRM tab restarts.

Needs CRM v67.3 or newer.

## Install (Hostinger VPS, Ubuntu, as root)

1. Optional, for website inquiries: add a DNS **A record**, e.g. `crm-api.letslearnquran.net` pointing to the VPS's IP address.
2. Copy this folder to the VPS and run:
   ```
   bash install.sh crm-api.letslearnquran.net   # or just: bash install.sh
   ```
3. Check that it's running:
   ```
   curl -s http://127.0.0.1:8787/health
   ```
   You should see `"ok":true`. The CRM Dashboard should show the runner as online.

Settings are in `/opt/llqa-runner/config.json`. After changing them, run `systemctl restart llqa-runner`.
- `adminPassword`: the Super Admin password, once it is no longer blank.
- `allowedOrigins`: the websites allowed to send inquiries.
- `leadToken`: a shared secret, for posts from another server (header `X-LLQA-Token`).

Logs: `journalctl -u llqa-runner -f`

## Website form

Put `website-lead-form.html` on the site and set `LLQA_LEAD_URL` to `https://<your domain>/lead`. The chat widget can call `window.llqaSendLead({...})`.

Spam protection:
- Only the websites in `allowedOrigins` can send inquiries.
- A hidden field catches robots.
- One address can send at most 6 inquiries per 10 minutes.
