# JLco.app

Website for JLco: a short front page and a contact form that emails through our own mail server.

Built with [Astro](https://astro.build) and the Node adapter. Pages are static; the contact page and `/api/contact` run on the server.

## Develop

```sh
npm install
cp .env.example .env   # fill in SMTP settings to test sending
npm run dev            # http://localhost:4321
```

Without `TURNSTILE_SECRET_KEY` the captcha check is skipped, which is handy locally.

## Languages

English is the default. Swedish texts are already in `src/i18n/ui.ts`.
To publish Swedish (`/sv/`, `/sv/contact`) and show the EN / SV switcher, add `'sv'` to `enabledLangs` in that file.

## Logo and brand

The logo and graphic profile live in `brand/`. Web versions are in `public/brand/` and the icons in `public/`; `src/components/Logo.astro` shows the full logo (with "co") in the hero and the mark alone in the header, since the profile sets 120 px as the minimum width with "co". The colour palette from the profile is defined at the top of `src/styles/global.css`.

To regenerate the web images after a logo change:

```sh
npx -p sharp node brand/generate-assets.mjs brand/JLco_transparent_4096px.png /tmp/jlco-brand
# then copy the files into public/brand/ (logo, mark, og-image) and public/ (favicon, icons)
```

## Deploy with Coolify

1. In Coolify: **New resource → Public/Private repository → this repo**, branch `main`, build pack **Dockerfile**.
2. Port: `4321`. Domains: `https://jlco.app` (and `https://www.jlco.app` if used).
3. Environment variables (runtime, not build):

   | Variable | Example |
   | --- | --- |
   | `SMTP_HOST` | `mail.jlco.app` (or the mail container's hostname on the same VPS) |
   | `SMTP_PORT` | `587` |
   | `SMTP_SECURE` | `false` for 587, `true` for 465 |
   | `SMTP_USER` | `noreply@jlco.app` |
   | `SMTP_PASS` | the sender account's password |
   | `SMTP_FROM` | `JLco website <noreply@jlco.app>` |
   | `CONTACT_TO` | the inbox that should receive messages |
   | `TURNSTILE_SITE_KEY` | from Cloudflare → Turnstile |
   | `TURNSTILE_SECRET_KEY` | from Cloudflare → Turnstile |

4. Enable auto deploy so every push to `main` redeploys.
5. Cloudflare DNS: an `A` record for `jlco.app` (and `www`) pointing to the VPS. With the orange-cloud proxy on, set SSL/TLS mode to **Full (strict)**.

The recipient address only exists in `CONTACT_TO` on the server and is never sent to the browser.

If the site is served on another domain, add it to `security.allowedDomains` in `astro.config.mjs`, otherwise form posts are rejected by the origin check.
