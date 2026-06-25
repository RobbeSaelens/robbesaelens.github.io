import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Unocss from 'unocss/vite'

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/portfolio/' : '/',
  plugins: [
    vue(),
    Unocss({
      rules: [['font-theme', { 'font-family': 'anisette-petite, sans-serif' }]],
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
  ],
}))
