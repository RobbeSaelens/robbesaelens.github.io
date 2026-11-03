import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Unocss from 'unocss/vite'
import { sentryVitePlugin } from '@sentry/vite-plugin'

// Source maps for Sentry, so error reports point at the real code. Only in the
// deploy build (SENTRY_AUTH_TOKEN, a GitHub secret): the maps are uploaded to
// Sentry and deleted before publishing.
const uploadSourceMaps = !!process.env.SENTRY_AUTH_TOKEN

// https://vitejs.dev/config/
export default defineConfig(({ isSsrBuild }) => ({
  base: '/',
  build: {
    sourcemap: uploadSourceMaps && !isSsrBuild ? 'hidden' : false,
  },
  plugins: [
    vue(),
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
