import { defineConfig, type Plugin } from 'vite'
import { existsSync, readFileSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import vue from '@vitejs/plugin-vue'
import Unocss from 'unocss/vite'
import { sentryVitePlugin } from '@sentry/vite-plugin'

// Source maps for Sentry, so error reports point at the real code. Only in the
// deploy build (SENTRY_AUTH_TOKEN, a GitHub secret): the maps are uploaded to
// Sentry and deleted before publishing.
const uploadSourceMaps = !!process.env.SENTRY_AUTH_TOKEN

/**
 * `vite preview` like GitHub Pages: a URL without a prerendered page gets 404.html with
 * status 404, where vite would fall back to index.html (the home page). The tests run
 * against the preview, so they see what visitors get.
 */
const githubPages404: Plugin = {
  name: 'github-pages-404',
  configurePreviewServer(server) {
    const dist = resolve(server.config.root, server.config.build.outDir)
    server.middlewares.use((req, res, next) => {
      const path = decodeURIComponent((req.url ?? '/').split('?')[0]).replace(/\/+$/, '').slice(1)
      if (req.method !== 'GET' || extname(path)) return next()
      const pages = path ? [`${path}.html`, `${path}/index.html`] : ['index.html']
      if (pages.some((page) => existsSync(join(dist, page)))) return next()
      res.statusCode = 404
      res.setHeader('Content-Type', 'text/html; charset=utf-8')
      res.end(readFileSync(join(dist, '404.html')))
    })
  },
}

/**
 * /llms.txt in `npm run dev`, from the code the build writes it with (src/llms.ts, through
 * scripts/llms.mjs): always the current profile, texts and data.
 */
const llmsDev: Plugin = {
  name: 'llms-txt-dev',
  configureServer(server) {
    server.middlewares.use('/llms.txt', async (_req, res, next) => {
      try {
        const { llms } = await server.ssrLoadModule('/src/llms.ts')
        res.setHeader('Content-Type', 'text/plain; charset=utf-8')
        res.end(llms().text)
      } catch (error) {
        next(error)
      }
    })
  },
}

// https://vitejs.dev/config/
export default defineConfig(({ isSsrBuild }) => ({
  base: '/',
  build: {
    sourcemap: uploadSourceMaps && !isSsrBuild ? 'hidden' : false,
  },
  plugins: [
    vue(),
    githubPages404,
    llmsDev,
    Unocss({
      theme: {
        extend: {
          keyframes: {
            wave: {
              '0%': { transform: 'rotate(0.0deg)' },
              '10%': { transform: 'rotate(14deg)' },
              '20%': { transform: 'rotate(-8deg)' },
              '30%': { transform: 'rotate(14deg)' },
              '40%': { transform: 'rotate(-4deg)' },
              '50%': { transform: 'rotate(10.0deg)' },
              '60%': { transform: 'rotate(0.0deg)' },
              '100%': { transform: 'rotate(0.0deg)' },
            },
          },
          animation: {
            'waving-hand': 'wave 2s linear infinite',
          },
        },
      },
    }),
    uploadSourceMaps &&
      !isSsrBuild &&
      sentryVitePlugin({
        org: 'robbe-saelens',
        project: 'portfolio',
        url: 'https://de.sentry.io',
        authToken: process.env.SENTRY_AUTH_TOKEN,
        release: { name: process.env.VITE_SENTRY_RELEASE },
        sourcemaps: { filesToDeleteAfterUpload: ['dist/**/*.map'] },
        telemetry: false,
      }),
  ],
}))
