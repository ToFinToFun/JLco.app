// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

export default defineConfig({
  site: 'https://jlco.app',
  output: 'static',
  adapter: node({ mode: 'standalone' }),
  // Inline the (small) stylesheet so it doesn't block the first render.
  build: { inlineStylesheets: 'always' },
  security: {
    // The app runs behind Coolify's proxy (and Cloudflare), which terminates TLS.
    // Trust X-Forwarded-Host/Proto for these domains so form posts pass the origin check.
    allowedDomains: [
      { hostname: 'jlco.app', protocol: 'https' },
      { hostname: 'www.jlco.app', protocol: 'https' },
    ],
  },
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'sv'],
    routing: { prefixDefaultLocale: false },
  },
});
