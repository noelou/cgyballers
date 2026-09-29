import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Cloudflare Web Analytics beacon. Only injected into production builds so
// local `npm run dev` visits aren't counted. The token is public by design.
const cloudflareAnalytics = {
  name: 'cloudflare-analytics',
  apply: 'build',
  transformIndexHtml: () => [
    {
      tag: 'script',
      attrs: {
        type: 'module',
        src: 'https://static.cloudflareinsights.com/beacon.min.js',
        'data-cf-beacon': '{"token": "c2aca1deab1a40f88bfc07f471426efc"}',
      },
      injectTo: 'body',
    },
  ],
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
