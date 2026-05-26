import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        space: {
          dark: '#0f0f1e',
          darker: '#0a0a14',
          accent: '#00d4ff',
        }
      }
    },
  },
  plugins: [],
} satisfies Config
