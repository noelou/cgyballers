import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Cloudflare Web Analytics beacon. Only injected into production builds so
// local `npm run dev` visits aren't counted. The token is public by design.
// Inserted as a raw string (Cloudflare's own snippet, single-quoted JSON):
// Vite's tag-descriptor form escapes the inner quotes as \" which isn't
// valid HTML, so the browser saw data-cf-beacon="{\" and nothing was tracked.
const CF_BEACON =
  `<script defer src="https://static.cloudflareinsights.com/beacon.min.js" ` +
  `data-cf-beacon='{"token": "c2aca1deab1a40f88bfc07f471426efc"}'></script>`

const cloudflareAnalytics = {
  name: 'cloudflare-analytics',
  apply: 'build',
  transformIndexHtml: (html) => html.replace('</body>', `  ${CF_BEACON}\n  </body>`),
}

export default defineConfig({
  plugins: [vue(), cloudflareAnalytics],
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
      '/uploads': 'http://localhost:3001',
      '/sitemap.xml': 'http://localhost:3001',
    },
  },
})
